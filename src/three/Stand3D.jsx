// Real-time 3D stand for the scroll story at the top of the page. Both models
// (en T and con pinza) are extruded from the silhouettes traced in
// standShape.js and lit by one top-left key light. Scroll drives the stand: it
// starts on the right showing its front (stood on end, only its upper half),
// turns to its other face while sliding left and panning to its lower half for
// the story, then comes back whole to the centre for the anatomy labels.
// Switching model runs a "print head" sweep (sweep.js). Loaded lazily.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, useTexture } from '@react-three/drei';
import { asset } from '../data.js';
import {
  FOV,
  PINZA_INSERT_TOP,
  PINZA_PIVOT,
  STAND_DROP,
  bodyOutline,
  capOutline,
  cells,
  panelFrame,
  panelOutline,
  pinzaBodyOutline,
  pinzaCells,
  pinzaLegOutline,
  pinzaLegPanelFrame,
  pinzaLegPanelOutline,
  pinzaStripOutline,
  roundedPath,
} from './standShape.js';
import { applySweep, makeSweep } from './sweep.js';

const S = 0.01; // photo pixels → scene units
const DEPTH = 34;
const BEVEL = 5;
const FACE = DEPTH / 2 + BEVEL; // z of the body's front face
const LEG_DEPTH = 24;
const LEG_Z = FACE + 3 + LEG_DEPTH / 2 + BEVEL; // the pinza's pivoting leg sits in front of the body
const LEG_FACE = LEG_Z + LEG_DEPTH / 2 + BEVEL;
const LEG_BACK = LEG_Z - LEG_DEPTH / 2 - BEVEL;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
const MODEL_W = 6.3;
const MODEL_H = 2.8;
const SWEEP_SECONDS = 1.7;

function toShape(pts, radius, holes = []) {
  const shape = new THREE.Shape();
  roundedPath(pts, radius, shape);
  for (const h of holes) {
    const path = new THREE.Path();
    roundedPath(h, 7, path);
    shape.holes.push(path);
  }
  return shape;
}

const extrude = (shape, depth, bevel) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 4,
    curveSegments: 8,
  }).translate(0, 0, -depth / 2);

function useGeometry() {
  return useMemo(
    () => ({
      t: {
        body: extrude(toShape(bodyOutline(), 10, cells()), DEPTH, BEVEL),
        cap: extrude(toShape(capOutline(), 5), DEPTH + 2, BEVEL),
        panel: extrude(toShape(panelOutline(), 10), 1.5, 1),
      },
      pinza: {
        body: extrude(toShape(pinzaBodyOutline(), 10, pinzaCells()), DEPTH, BEVEL),
        strip: extrude(toShape(pinzaStripOutline(), 4), DEPTH / 2 - 6, 2),
        leg: extrude(toShape(pinzaLegOutline(), 9), LEG_DEPTH, BEVEL),
        panel: extrude(toShape(pinzaLegPanelOutline(), 10), 1.5, 1),
        screw: new THREE.CylinderGeometry(9, 9, LEG_FACE + FACE + 4, 24).rotateX(Math.PI / 2),
        screwHead: new THREE.CylinderGeometry(15, 15, 5, 6).rotateX(Math.PI / 2),
      },
    }),
    []
  );
}

function makeMaterials(uniforms) {
  return {
    body: applySweep(new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.6 }), uniforms),
    cap: applySweep(new THREE.MeshPhysicalMaterial({ roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.6 }), uniforms),
    panel: applySweep(new THREE.MeshStandardMaterial({ roughness: 0.75 }), uniforms),
    logo: applySweep(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.92, toneMapped: false }), uniforms),
    metal: applySweep(new THREE.MeshStandardMaterial({ color: '#dcdee2', metalness: 0.8, roughness: 0.28 }), uniforms),
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

const centroid = (tri) => [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];

// What each anatomy label points at, per model, in outline coordinates + z.
const ANCHORS = {
  t: [
    [0, 266, FACE + 2], // T head + insert
    [...panelFrame().center, FACE + 2], // logo panel
    [...centroid(cells()[1]), FACE + 2], // a leg cell
    [-268, 10, FACE + 2], // foot
  ],
  pinza: [
    [PINZA_INSERT_TOP[0], PINZA_INSERT_TOP[1], FACE], // insert strips
    [PINZA_PIVOT[0], PINZA_PIVOT[1], LEG_FACE + 4], // pivot screw
    [...centroid(pinzaCells()[1]), FACE + 2], // a leg cell
    [...pinzaLegPanelFrame().center, LEG_FACE + 2], // logo panel
  ],
};
const ANCHOR_VECTORS = Object.fromEntries(Object.entries(ANCHORS).map(([k, list]) => [k, list.map((a) => new THREE.Vector3(...a))]));

const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _box = new THREE.Box3();

function TModel({ geo, mats }) {
  const f = panelFrame();
  const w = f.length * 0.86;
  return (
    <>
      <mesh geometry={geo.body} material={mats.body} castShadow receiveShadow />
      <mesh geometry={geo.cap} material={mats.cap} castShadow />
      <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, FACE - 0.6]} />
      <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, -FACE - 0.9]} />
      <mesh material={mats.logo} position={[f.center[0], f.center[1], FACE + 2]} rotation={[0, 0, f.angle]}>
        <planeGeometry args={[w, w * (358 / 1201)]} />
      </mesh>
      <mesh material={mats.logo} position={[f.center[0], f.center[1], -FACE - 3.6]} rotation={[0, Math.PI, -f.angle]}>
        <planeGeometry args={[w, w * (358 / 1201)]} />
      </mesh>
    </>
  );
}

function PinzaModel({ geo, mats }) {
  const f = pinzaLegPanelFrame();
  const w = f.length * 0.86;
  const [px, py] = PINZA_PIVOT;
  const stripZ = DEPTH / 4 + 1;
  return (
    <>
      <mesh geometry={geo.body} material={mats.body} castShadow receiveShadow />
      {/* two insert strips side by side along the top of the head */}
      <mesh geometry={geo.strip} material={mats.cap} position={[0, 0, stripZ]} castShadow />
      <mesh geometry={geo.strip} material={mats.cap} position={[0, 0, -stripZ]} castShadow />
      {/* the pivoting leg, in front of the body */}
      <mesh geometry={geo.leg} material={mats.body} position={[0, 0, LEG_Z]} castShadow receiveShadow />
      <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, LEG_FACE - 0.6]} />
      <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, LEG_BACK - 0.9]} />
      <mesh material={mats.logo} position={[f.center[0], f.center[1], LEG_FACE + 2]} rotation={[0, 0, f.angle]}>
        <planeGeometry args={[w, w * (358 / 1201)]} />
      </mesh>
      <mesh material={mats.logo} position={[f.center[0], f.center[1], LEG_BACK - 3.6]} rotation={[0, Math.PI, -f.angle]}>
        <planeGeometry args={[w, w * (358 / 1201)]} />
      </mesh>
      {/* the screw it pivots on */}
      <mesh geometry={geo.screw} material={mats.metal} position={[px, py, (LEG_FACE - FACE) / 2]} />
      <mesh geometry={geo.screwHead} material={mats.metal} position={[px, py, LEG_FACE + 2]} />
      <mesh geometry={geo.screwHead} material={mats.metal} position={[px, py, -FACE - 2]} />
    </>
  );
}

function Stand({ colorway, variant, reducedMotion, interactive, progress, pose, annot }) {
  const travel = useRef(null);
  const turn = useRef(null);
  const shadow = useRef(null);
  const groups = { t: useRef(null), pinza: useRef(null) };
  const models = { t: useRef(null), pinza: useRef(null) };
  const geo = useGeometry();
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const layout = useMemo(() => layoutFor(size, pose), [size, pose]);
  const logos = useTexture({
    dark: asset('img/logo-horizontal-negro.png'),
    light: asset('img/logo-horizontal-blanco.png'),
  });

  const sweeps = useMemo(() => ({ t: makeSweep(), pinza: makeSweep() }), []);
  const mats = useMemo(() => ({ t: makeMaterials(sweeps.t), pinza: makeMaterials(sweeps.pinza) }), [sweeps]);

  // first paint uses the target colours directly; later changes are eased in useFrame
  const targets = useRef(null);
  const next = {
    body: new THREE.Color(colorway.body),
    cap: new THREE.Color(colorway.cap),
    panel: new THREE.Color(colorway.body).multiplyScalar(0.82),
  };
  if (!targets.current) {
    for (const m of Object.values(mats)) {
      m.body.color.copy(next.body);
      m.cap.color.copy(next.cap);
      m.panel.color.copy(next.panel);
    }
  }
  targets.current = next;
  for (const m of Object.values(mats)) m.logo.map = colorway.logo === 'light' ? logos.light : logos.dark;

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

  useEffect(() => {
    camera.position.set(0, 0, layout.z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, layout]);

  const start = useRef(null);
  const smooth = useRef(progress.current);

  useFrame((state, dt) => {
    const g = travel.current;
    const r = turn.current;
    if (!g || !r) return;
    const k = 1 - Math.exp(-dt * 6);
    for (const m of Object.values(mats)) {
      m.body.color.lerp(targets.current.body, k);
      m.cap.color.lerp(targets.current.cap, k);
      m.panel.color.lerp(targets.current.panel, k);
    }

    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    // Reduced motion: no intro, no idle sway, and no travelling.
    const target = reducedMotion ? snap(progress.current) : progress.current;
    smooth.current = reducedMotion ? target : THREE.MathUtils.damp(smooth.current, target, 7, dt);
    const p = smooth.current;
    const at = poseAt(p, layout);

    const rise = reducedMotion ? 1 : 1 - Math.pow(2, -7 * Math.min(t / 1.8, 1));
    const sway = reducedMotion ? 0 : Math.sin(t * 0.5) * 0.08;
    const px = interactive && !reducedMotion ? state.pointer.x : 0;
    const py = interactive && !reducedMotion ? state.pointer.y : 0;

    g.position.x = at.x;
    g.position.y = at.y + (1 - rise) * -1.2;
    g.scale.setScalar(at.s);
    // front (towards the hero copy) → back (towards the story) → front again for the anatomy
    r.rotation.y = at.rot + (1 - rise) * -1 + sway + px * 0.18;
    r.rotation.x = THREE.MathUtils.damp(r.rotation.x, -py * 0.1, 4, dt);
    if (shadow.current && layout.floor !== null) {
      shadow.current.position.x = g.position.x;
      shadow.current.position.y = layout.floor - 0.06;
    }
    g.updateMatrixWorld(true);

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
              <group ref={models.t} scale={S} position={[0, -STAND_DROP, 0]}>
                <TModel geo={geo.t} mats={mats.t} />
              </group>
            </group>
            <group ref={groups.pinza} visible={initial === 'pinza'}>
              <group ref={models.pinza} scale={S} position={[0, -STAND_DROP, -0.2]}>
                <PinzaModel geo={geo.pinza} mats={mats.pinza} />
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

export default function Stand3D({ colorway, variant, reducedMotion, interactive, progress, pose, eventSource, annot }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);

  // stop rendering while the story is scrolled away
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="stand3d">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
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
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[-4, 4, 4]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={0.9} position={[5, 1, 3]} scale={[3, 6, 1]} />
          <Lightformer form="rect" intensity={0.9} position={[0, 2, -6]} scale={[6, 3, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#ff3b30" position={[-4, -2, -6]} scale={3} />
        </Environment>
        <Stand
          colorway={colorway}
          variant={variant}
          reducedMotion={reducedMotion}
          interactive={interactive}
          progress={progress}
          pose={pose}
          annot={annot}
        />
      </Canvas>
    </div>
  );
}
