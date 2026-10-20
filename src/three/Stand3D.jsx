// Real-time 3D stand for the scroll story at the top of the page. Both models
// (en T and con pinza) are the real print files, converted from the Fusion 360
// 3MF exports to compressed GLBs (public/models, see scripts/models) with one
// node per printed body, and lit by one top-left key light. Scroll drives the
// stand: it starts on the right showing its front (stood on end, only its upper
// half), turns to its other face while sliding left and panning to its lower
// half for the story, then comes back whole to the centre for the anatomy labels.
// Switching model runs a "print head" sweep (sweep.js). In the hero the visitor
// can also turn the stand by hand (drag, with a flick of inertia); it eases back
// to the scripted pose once the story starts. Loaded lazily.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { asset } from '../data.js';
import { applySweep, makeSweep } from './sweep.js';

// Vertical field of view of the camera, in degrees.
const FOV = 30;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
// The models are 283 × 140 × 41 mm, exported at 1 unit = 50 mm and centred on
// the origin: 5.67 × 2.8 units. Layout sizes keep a little air around them.
const MODEL_W = 5.9;
const MODEL_H = 2.9;
const SWEEP_SECONDS = 1.7;

const MODEL_URLS = [asset('models/motto-t.glb'), asset('models/motto-pinza.glb')];
const withMeshopt = (loader) => loader.setMeshoptDecoder(MeshoptDecoder);

// Every mesh in the GLBs carries a role (glTF extras → userData.role):
// body   the printed frame and the pivoting leg        → colourway body colour
// cap    T-head inserts, clamp slot insert, foot pads,
//        and the raised MOTTO ARCHERY lettering          → colourway cap colour
// metal  pivot screw, washer and nut
// dark   the small plug at the top of the head
function makeMaterials(uniforms) {
  return {
    body: applySweep(new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.6 }), uniforms),
    cap: applySweep(new THREE.MeshPhysicalMaterial({ roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.6 }), uniforms),
    metal: applySweep(new THREE.MeshStandardMaterial({ color: '#dcdee2', metalness: 0.8, roughness: 0.28 }), uniforms),
    dark: applySweep(new THREE.MeshStandardMaterial({ color: '#1b1b1c', roughness: 0.6 }), uniforms),
  };
}

/**
 * Where the stand sits for a given canvas size and pose. Desktop: it travels
 * from the right third to the left third. Phones: it stays centred in the top
 * of the screen (the text runs underneath) and only turns.
 */
function layoutFor({ width, height }, pose) {
  const aspect = width / height;
  const w = pose === 'vertical' ? MODEL_H : MODEL_W;
  const h = pose === 'vertical' ? MODEL_W : MODEL_H;
  if (width < 760) {
    const viewH = Math.max(h / (pose === 'vertical' ? 0.42 : 0.32), w / (0.84 * aspect));
    const y = viewH * 0.2;
    return { z: viewH / 2 / TAN, x0: 0, x1: 0, y0: y, y1: y, x2: 0, y2: y, s2: 0.92, floor: y - h / 2 };
  }
  if (pose === 'vertical') {
    // Stood on end and larger than the screen: the hero shows its upper half,
    // the story its lower half, and the scroll pans from one to the other.
    const viewH = Math.max(h / 1.45, w / (0.42 * aspect));
    const viewW = viewH * aspect;
    const y0 = viewH * 0.4 - h / 2; // top edge just under the nav
    return { z: viewH / 2 / TAN, x0: viewW * 0.22, x1: -viewW * 0.22, y0, y1: -y0, x2: 0, y2: -viewH * 0.04, s2: (viewH * 0.72) / h, floor: null };
  }
  const viewH = Math.max(h / 0.6, w / (0.42 * aspect));
  const viewW = viewH * aspect;
  const y = -viewH * 0.02;
  return { z: viewH / 2 / TAN, x0: viewW * 0.23, x1: -viewW * 0.23, y0: y, y1: y, x2: 0, y2: y, s2: 0.8, floor: y - h / 2 };
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = THREE.MathUtils.lerp;

// Scroll phases over the whole story (hero 100svh, origin 100svh, anatomy 200svh):
// A hero → origin, a hold while the story is read, B origin → anatomy, C anatomy.
const PHASE = { aEnd: 1 / 3, bStart: 0.4, bEnd: 0.64 };
const ROT = [-0.42, Math.PI + 0.42, 2 * Math.PI - 0.3, 2 * Math.PI + 0.1];

function poseAt(p, L) {
  if (p <= PHASE.aEnd) {
    const t = ease(p / PHASE.aEnd);
    return { x: lerp(L.x0, L.x1, t), y: lerp(L.y0, L.y1, t), s: 1, rot: lerp(ROT[0], ROT[1], t) };
  }
  if (p < PHASE.bStart) return { x: L.x1, y: L.y1, s: 1, rot: ROT[1] };
  if (p < PHASE.bEnd) {
    const t = ease((p - PHASE.bStart) / (PHASE.bEnd - PHASE.bStart));
    return { x: lerp(L.x1, L.x2, t), y: lerp(L.y1, L.y2, t), s: lerp(1, L.s2, t), rot: lerp(ROT[1], ROT[2], t) };
  }
  const t = (p - PHASE.bEnd) / (1 - PHASE.bEnd);
  return { x: L.x2, y: L.y2, s: L.s2, rot: lerp(ROT[2], ROT[3], t) };
}

// Reduced motion snaps between the resting places instead of travelling.
const snap = (p) => (p < 0.17 ? 0 : p < 0.52 ? PHASE.aEnd : 0.8);

// Drag to turn the stand, only while the page sits at the hero. Radians per
// pixel dragged, the pitch limit, how fast a flick dies out after release
// (per second, exponential) and how fast the stand goes back to its scripted
// pose once the story starts. HERO_END is the scroll progress (≈ 40px) past
// which the hero counts as left.
const DRAG = { yaw: 0.0085, pitch: 0.006, pitchMax: 0.5, friction: 3.5, back: 4, slop: 6, pad: 16 };
const HERO_END = 0.015;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// What each anatomy label points at, per model, in model units (see MODEL_W).
const ANCHORS = {
  t: [
    [0, 1.22, 0.38], // T head + inserts
    [1.59, -0.53, 0.18], // logo panel
    [-1.55, -0.66, 0.3], // a leg cell
    [-2.62, -1.3, 0.3], // foot
  ],
  pinza: [
    [-0.2, 1.05, 0.44], // slot insert
    [0.61, 0.48, 0.45], // pivot screw
    [-1.55, -0.66, 0.3], // a leg cell
    [1.62, -0.57, 0.18], // logo panel
  ],
};
const ANCHOR_VECTORS = Object.fromEntries(Object.entries(ANCHORS).map(([k, list]) => [k, list.map((a) => new THREE.Vector3(...a))]));

const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _box = new THREE.Box3();

/** One loaded print file, its meshes dressed in the model's materials by role. */
function PrintedModel({ gltf, mats }) {
  const root = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const role = o.userData.role in mats ? o.userData.role : 'body';
      o.material = mats[role];
      o.castShadow = true;
      o.receiveShadow = role === 'body';
    });
    return scene;
  }, [gltf, mats]);
  return <primitive object={root} />;
}

function Stand({ colorway, variant, reducedMotion, interactive, progress, pose, annot, hitArea, hint, heroCopy }) {
  const travel = useRef(null);
  const turn = useRef(null);
  const shadow = useRef(null);
  const groups = { t: useRef(null), pinza: useRef(null) };
  const models = { t: useRef(null), pinza: useRef(null) };
  const [gltfT, gltfPinza] = useLoader(GLTFLoader, MODEL_URLS, withMeshopt);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const layout = useMemo(() => layoutFor(size, pose), [size, pose]);
  const invalidate = useThree((s) => s.invalidate);

  const sweeps = useMemo(() => ({ t: makeSweep(), pinza: makeSweep() }), []);
  const mats = useMemo(() => ({ t: makeMaterials(sweeps.t), pinza: makeMaterials(sweeps.pinza) }), [sweeps]);

  // first paint uses the target colours directly; later changes are eased in useFrame
  const targets = useRef(null);
  const next = {
    body: new THREE.Color(colorway.body),
    cap: new THREE.Color(colorway.cap),
  };
  if (!targets.current) {
    for (const m of Object.values(mats)) {
      m.body.color.copy(next.body);
      m.cap.color.copy(next.cap);
    }
  }
  targets.current = next;

  // model switch: which one is showing, and the sweep in progress
  const active = useRef(variant);
  const initial = useRef(variant).current; // after mount, visibility is driven by the sweep only
  const sweep = useRef(null);
  useEffect(() => {
    if (variant === active.current && !sweep.current) return;
    const finish = (to) => {
      for (const id of Object.keys(groups)) groups[id].current.visible = id === to;
      for (const s of Object.values(sweeps)) s.uSide.value = 0;
      active.current = to;
      sweep.current = null;
    };
    if (sweep.current) finish(sweep.current.to); // a second click mid-sweep: settle first
    if (variant === active.current) return;
    if (reducedMotion) return finish(variant);
    groups[variant].current.visible = true;
    sweep.current = { from: active.current, to: variant, t: 0, finish };
    // groups is a fresh object each render but its refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, reducedMotion, sweeps]);

  // The canvas renders on demand (frameloop "demand"): these wake it up.
  useEffect(() => {
    const wake = () => invalidate();
    window.addEventListener('scroll', wake, { passive: true });
    if (interactive) window.addEventListener('pointermove', wake, { passive: true });
    return () => {
      window.removeEventListener('scroll', wake);
      window.removeEventListener('pointermove', wake);
    };
  }, [invalidate, interactive]);
  useEffect(() => invalidate(), [invalidate, colorway, variant]);

  useEffect(() => {
    camera.position.set(0, 0, layout.z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, layout]);

  // The visitor's own turn of the stand (drag in the hero), added on top of the
  // scripted pose. rect is the stand's screen box, refreshed every frame in the
  // hero; it is the grab area (the panels' copy sits above the canvas and keeps
  // its own clicks, see .panel / .panel__copy).
  const user = useRef({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, drag: null, back: false, touched: false, rect: null, hinted: false });
  useEffect(() => {
    const el = hitArea;
    if (!el) return;
    const u = user.current;
    const inHero = () => progress.current <= HERO_END;
    const overStand = (e) => {
      const R = u.rect;
      if (!R) return false;
      const b = el.getBoundingClientRect();
      const x = e.clientX - b.left;
      const y = e.clientY - b.top;
      return x >= R.x0 - DRAG.pad && x <= R.x1 + DRAG.pad && y >= R.y0 - DRAG.pad && y <= R.y1 + DRAG.pad;
    };
    const setCursor = (c) => {
      el.classList.toggle('is-grab', c === 'grab');
      el.classList.toggle('is-grabbing', c === 'grabbing');
    };
    const begin = (e) => {
      const d = u.drag;
      d.live = true;
      d.x = e.clientX;
      d.y = e.clientY;
      d.t = e.timeStamp;
      u.vYaw = u.vPitch = 0;
      u.back = false;
      u.touched = true;
      u.hinted = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer may already be gone */
      }
      setCursor('grabbing');
      invalidate();
    };
    const end = (e, keepSpeed) => {
      const d = u.drag;
      if (!d || (e && e.pointerId !== d.id)) return;
      // a flick keeps turning; a pause before letting go doesn't
      if (!keepSpeed || reducedMotion || !e || e.timeStamp - d.t > 80) u.vYaw = u.vPitch = 0;
      u.drag = null;
      if (el.hasPointerCapture?.(d.id)) el.releasePointerCapture(d.id);
      setCursor(e && e.pointerType === 'mouse' && inHero() && overStand(e) ? 'grab' : null);
      invalidate();
    };
    u.end = end;

    const onDown = (e) => {
      if (u.drag || !e.isPrimary || e.button !== 0 || !inHero() || !overStand(e)) return;
      u.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, live: false };
      if (e.pointerType === 'mouse') {
        e.preventDefault(); // no text selection while dragging
        begin(e);
      }
      // touch / pen: wait for the first move to tell a turn from a scroll
    };
    const onMove = (e) => {
      const d = u.drag;
      if (!d) {
        if (e.pointerType === 'mouse') setCursor(inHero() && overStand(e) ? 'grab' : null);
        return;
      }
      if (e.pointerId !== d.id) return;
      if (!inHero()) return end(e, false);
      if (!d.live) {
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (Math.hypot(dx, dy) < DRAG.slop) return;
        // mostly vertical: it's a scroll, leave it to the page (touch-action: pan-y)
        if (Math.abs(dy) > Math.abs(dx)) {
          u.drag = null;
          return;
        }
        begin(e);
        return;
      }
      const dt = Math.max(e.timeStamp - d.t, 1) / 1000;
      const dYaw = (e.clientX - d.x) * DRAG.yaw;
      const pitch = THREE.MathUtils.clamp(u.pitch + (e.clientY - d.y) * DRAG.pitch, -DRAG.pitchMax, DRAG.pitchMax);
      const dPitch = pitch - u.pitch;
      u.yaw += dYaw;
      u.pitch = pitch;
      // speed for the flick after release, smoothed over the last few moves
      u.vYaw = lerp(u.vYaw, THREE.MathUtils.clamp(dYaw / dt, -12, 12), 0.5);
      u.vPitch = lerp(u.vPitch, THREE.MathUtils.clamp(dPitch / dt, -6, 6), 0.5);
      d.x = e.clientX;
      d.y = e.clientY;
      d.t = e.timeStamp;
      invalidate();
    };
    const onUp = (e) => end(e, true);
    const onCancel = (e) => end(e, false);
    const onLeave = (e) => {
      if (!u.drag && e.pointerType === 'mouse') setCursor(null);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('lostpointercapture', onCancel);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('lostpointercapture', onCancel);
      el.removeEventListener('pointerleave', onLeave);
      setCursor(null);
      u.drag = null;
      u.end = null;
    };
  }, [hitArea, progress, invalidate, reducedMotion]);

  const start = useRef(null);
  const smooth = useRef(progress.current);
  const tilt = useRef(0); // the pointer parallax tilt
  const parallax = useRef(1); // fades the parallax out while the visitor holds the stand
  const hintShown = useRef(null);

  useFrame((state, delta) => {
    const g = travel.current;
    const r = turn.current;
    if (!g || !r) return;
    const dt = Math.min(delta, 1 / 30); // the first frame after an idle pause would otherwise jump
    const k = 1 - Math.exp(-dt * 6);
    let colourLeft = 0;
    for (const m of Object.values(mats)) {
      m.body.color.lerp(targets.current.body, k);
      m.cap.color.lerp(targets.current.cap, k);
      colourLeft += Math.abs(m.body.color.r - targets.current.body.r) + Math.abs(m.cap.color.g - targets.current.cap.g);
    }

    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    // Reduced motion: no intro, no idle sway, and no travelling.
    const target = reducedMotion ? snap(progress.current) : progress.current;
    smooth.current = reducedMotion ? target : THREE.MathUtils.damp(smooth.current, target, 7, dt);
    const p = smooth.current;
    const at = poseAt(p, layout);

    const rise = reducedMotion ? 1 : 1 - Math.pow(2, -7 * Math.min(t / 1.8, 1));
    const px = interactive && !reducedMotion ? state.pointer.x : 0;
    const py = interactive && !reducedMotion ? state.pointer.y : 0;

    // The visitor's turn: follows the pointer while held, coasts after a flick,
    // and eases back to the scripted pose as soon as the story starts.
    const u = user.current;
    const hero = progress.current <= HERO_END;
    if (!hero && (u.drag || u.yaw || u.pitch || u.vYaw || u.vPitch) && !u.back) {
      if (u.drag) u.end?.(null, false);
      u.back = true;
      u.yaw = wrapAngle(u.yaw); // the short way round
      u.vYaw = u.vPitch = 0;
    }
    if (u.back) {
      u.yaw = reducedMotion ? 0 : THREE.MathUtils.damp(u.yaw, 0, DRAG.back, dt);
      u.pitch = reducedMotion ? 0 : THREE.MathUtils.damp(u.pitch, 0, DRAG.back, dt);
      if (Math.abs(u.yaw) < 1e-3 && Math.abs(u.pitch) < 1e-3) {
        u.yaw = u.pitch = 0;
        u.back = u.touched = false;
      }
    } else if (!u.drag?.live && (u.vYaw || u.vPitch)) {
      u.yaw += u.vYaw * dt;
      const pitch = THREE.MathUtils.clamp(u.pitch + u.vPitch * dt, -DRAG.pitchMax, DRAG.pitchMax);
      if (pitch !== u.pitch + u.vPitch * dt) u.vPitch = 0;
      u.pitch = pitch;
      const decay = Math.exp(-DRAG.friction * dt);
      u.vYaw = Math.abs(u.vYaw * decay) < 0.01 ? 0 : u.vYaw * decay;
      u.vPitch = Math.abs(u.vPitch * decay) < 0.01 ? 0 : u.vPitch * decay;
    }
    parallax.current = THREE.MathUtils.damp(parallax.current, u.touched ? 0 : 1, 4, dt);
    const pw = parallax.current;

    g.position.x = at.x;
    g.position.y = at.y + (1 - rise) * -1.2;
    g.scale.setScalar(at.s);
    // front (towards the hero copy) → back (towards the story) → front again for the anatomy
    r.rotation.y = at.rot + (1 - rise) * -1 + px * 0.18 * pw + u.yaw;
    tilt.current = THREE.MathUtils.damp(tilt.current, -py * 0.1, 4, dt);
    r.rotation.x = tilt.current * pw + u.pitch;

    // keep rendering only while something is still moving
    const busy =
      rise < 0.999 ||
      sweep.current ||
      Math.abs(smooth.current - target) > 1e-4 ||
      colourLeft > 1e-3 ||
      Math.abs(tilt.current + py * 0.1) > 1e-4 ||
      Math.abs(pw - (u.touched ? 0 : 1)) > 1e-3 ||
      u.back ||
      u.vYaw ||
      u.vPitch;
    if (busy) state.invalidate();
    if (shadow.current && layout.floor !== null) {
      shadow.current.position.x = g.position.x;
      shadow.current.position.y = layout.floor - 0.06;
    }
    g.updateMatrixWorld(true);

    // In the hero: the stand's screen box (the grab area) and the drag hint under it.
    const { width: W, height: H } = state.size;
    if (hero) {
      _box.setFromObject(r);
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (let i = 0; i < 8; i++) {
        _v.set(i & 1 ? _box.max.x : _box.min.x, i & 2 ? _box.max.y : _box.min.y, i & 4 ? _box.max.z : _box.min.z).project(state.camera);
        const sx = ((_v.x + 1) / 2) * W;
        const sy = ((1 - _v.y) / 2) * H;
        x0 = Math.min(x0, sx);
        x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy);
        y1 = Math.max(y1, sy);
      }
      u.rect = { x0: Math.max(x0, 0), y0: Math.max(y0, 0), x1: Math.min(x1, W), y1: Math.min(y1, H) };
    } else {
      u.rect = null;
    }
    const tip = hint?.current;
    if (tip) {
      const show = hero && !u.hinted && rise > 0.9 && !!u.rect;
      if (u.rect && !u.hinted) {
        const copy = W < 760 && heroCopy?.current?.getBoundingClientRect();
        if (copy) {
          // phones: the copy runs under the stand, so the hint sits just above it, on its left edge
          tip.style.transform = `translate(${copy.left}px, ${Math.max(copy.top - 32, 0)}px)`;
        } else {
          // centred under the stand, kept on screen (the vertical pose runs off the bottom)
          const hx = THREE.MathUtils.clamp((u.rect.x0 + u.rect.x1) / 2, 90, W - 90);
          const hy = Math.min(u.rect.y1 + 14, H - 84);
          tip.style.transform = `translate(${hx}px, ${hy}px) translate(-50%, 0)`;
        }
      }
      if (hintShown.current !== show) {
        hintShown.current = show;
        tip.classList.toggle('is-on', show);
      }
    }

    // The print-head sweep, bottom to top over the part of the stand on screen.
    const sw = sweep.current;
    if (sw) {
      sw.t = Math.min(1, sw.t + dt / SWEEP_SECONDS);
      _box.setFromObject(r);
      const half = layout.z * TAN;
      const lo = Math.max(_box.min.y, -half) - 0.1;
      const hi = Math.min(_box.max.y, half) + 0.1;
      const cut = lerp(lo, hi, ease(sw.t));
      sweeps[sw.from].uSide.value = 1;
      sweeps[sw.to].uSide.value = -1;
      sweeps[sw.from].uCut.value = cut;
      sweeps[sw.to].uCut.value = cut;
      if (sw.t >= 1) sw.finish(sw.to);
    }

    // Anatomy labels: project each anchor to the screen and move its marker,
    // leader line and label there. Written straight to the DOM, no React render.
    const A = annot?.current;
    const shown = sweep.current?.to ?? active.current;
    const model = models[shown].current;
    if (!A || !model) return;
    const { width, height } = state.size;
    const wide = width >= 760;
    _c.setFromMatrixPosition(g.matrixWorld).project(state.camera);
    const cx = ((_c.x + 1) / 2) * width;
    const reveal = (p - (PHASE.bEnd - 0.04)) / (1 - PHASE.bEnd);
    const pts = ANCHOR_VECTORS[shown].map((a, i) => {
      _v.copy(a).applyMatrix4(model.matrixWorld).project(state.camera);
      const sx = ((_v.x + 1) / 2) * width;
      const sy = ((1 - _v.y) / 2) * height;
      const side = sx < cx - 4 ? -1 : 1;
      return { i, sx, sy, side, ly: sy };
    });
    // keep labels on the same side at least 76px apart, in screen order
    for (const side of [-1, 1]) {
      const col = pts.filter((q) => q.side === side).sort((m, n) => m.sy - n.sy);
      for (let j = 1; j < col.length; j++) col[j].ly = Math.max(col[j].ly, col[j - 1].ly + 76);
    }
    for (const { i, sx, sy, side, ly } of pts) {
      const alpha = reducedMotion ? (p > 0.6 ? 1 : 0) : clamp01((reveal - i * 0.14) / 0.08);
      const marker = A.markers[i];
      if (marker) {
        marker.style.opacity = alpha;
        marker.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${0.6 + alpha * 0.4})`;
      }
      const label = A.labels[i];
      const line = A.lines[i];
      if (!label || !line) continue;
      const edge = side < 0 ? Math.min(sx - 48, cx - width * 0.11) : Math.max(sx + 48, cx + width * 0.11);
      const show = wide ? alpha : 0;
      label.style.opacity = show;
      label.dataset.side = side < 0 ? 'left' : 'right';
      label.style.transform = `translate(${edge}px, ${ly}px) translate(${side < 0 ? '-100%' : '0'}, -50%) translateX(${(1 - show) * side * 12}px)`;
      const x1 = sx + side * 10;
      line.setAttribute('x1', x1);
      line.setAttribute('y1', sy);
      line.setAttribute('x2', x1 + (edge - x1) * show);
      line.setAttribute('y2', sy + (ly - sy) * show);
      line.style.opacity = show;
    }
  });

  return (
    <>
      <group ref={travel}>
        <group ref={turn}>
          {/* vertical pose: stood on end, the head pointing at the text */}
          <group rotation={[0, 0, pose === 'vertical' ? Math.PI / 2 : 0]}>
            <group ref={groups.t} visible={initial === 't'}>
              <group ref={models.t}>
                <PrintedModel gltf={gltfT} mats={mats.t} />
              </group>
            </group>
            <group ref={groups.pinza} visible={initial === 'pinza'}>
              <group ref={models.pinza}>
                <PrintedModel gltf={gltfPinza} mats={mats.pinza} />
              </group>
            </group>
          </group>
        </group>
      </group>
      {/* a floor only exists when the whole stand is on screen */}
      {layout.floor !== null && (
        <group ref={shadow}>
          <ContactShadows opacity={pose === 'vertical' ? 0.45 : 0.7} scale={[9, 9]} blur={2.6} far={pose === 'vertical' ? 6.5 : 3} resolution={512} color="#000000" />
        </group>
      )}
    </>
  );
}

/** Soft studio reflections from three's RoomEnvironment, built once on the GPU. */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.3;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
      room.dispose?.();
    };
  }, [gl, scene]);
  return null;
}

export default function Stand3D({ colorway, variant, reducedMotion, interactive, progress, pose, eventSource, annot, heroCopy }) {
  const wrap = useRef(null);
  const hint = useRef(null);
  const [visible, setVisible] = useState(true);
  // the grab area, as state: the scene's effects run before this div's ref is set
  const [area, setArea] = useState(null);
  const wrapRef = useCallback((el) => {
    wrap.current = el;
    setArea(el);
  }, []);

  // stop rendering while the story is scrolled away
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="stand3d">
      <Canvas
        frameloop={visible ? 'demand' : 'never'}
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 12], fov: FOV }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        eventSource={eventSource}
        eventPrefix="client"
        aria-hidden="true"
      >
        <ambientLight intensity={0.25} />
        <spotLight position={[-5, 8, 7]} angle={0.5} penumbra={0.9} intensity={190} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[4, 2, -5]} intensity={1.4} color="#ffd9cf" />
        <directionalLight position={[5, 3, 5]} intensity={0.5} />
        <StudioEnvironment />
        {/* warm red rim from behind, where the old ring light was */}
        <pointLight position={[-4, -2, -6]} intensity={30} color="#ff3b30" />
        <Stand
          colorway={colorway}
          variant={variant}
          reducedMotion={reducedMotion}
          interactive={interactive}
          progress={progress}
          pose={pose}
          annot={annot}
          hitArea={area}
          hint={hint}
          heroCopy={heroCopy}
        />
      </Canvas>
      {/* shown under the stand in the hero until the first drag */}
      <span className="stand3d__hint" ref={hint} aria-hidden="true">
        <svg viewBox="0 0 20 12" width="20" height="12">
          <path d="M5 2 1 6l4 4M15 2l4 4-4 4M1 6h18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Arrastra para girar
      </span>
    </div>
  );
}
