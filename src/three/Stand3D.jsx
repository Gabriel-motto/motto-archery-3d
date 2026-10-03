// Real-time 3D stand for the scroll story at the top of the page. The geometry
// is extruded from the traced silhouette in standShape.js (body, hooked top
// insert, logo panels front and back), lit by one top-left key light with a
// soft contact shadow. Scroll drives it: it starts on the right showing its
// front (and, stood on end, only its upper half), and as the page scrolls it
// turns to its other face while sliding left and panning to its lower half,
// making room for the story text. Loaded lazily so the page paints first.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, useTexture } from '@react-three/drei';
import { asset } from '../data.js';
import { FOV, STAND_DROP, bodyOutline, capOutline, cells, panelFrame, panelOutline, roundedPath } from './standShape.js';

const S = 0.01; // photo pixels → scene units
const DEPTH = 34;
const BEVEL = 5;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
const MODEL_W = 6.3;
const MODEL_H = 2.8;

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

function useStandGeometry() {
  return useMemo(() => {
    const extrude = (shape, depth, bevel) =>
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel * 0.8,
        bevelSegments: 4,
        curveSegments: 8,
      }).translate(0, 0, -depth / 2);
    return {
      body: extrude(toShape(bodyOutline(), 10, cells()), DEPTH, BEVEL),
      cap: extrude(toShape(capOutline(), 5), DEPTH + 2, BEVEL),
      panel: extrude(toShape(panelOutline(), 10), 1.5, 1),
    };
  }, []);
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
    // phones: the stand holds the top of the screen and the copy runs underneath
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

const _v = new THREE.Vector3();
const _c = new THREE.Vector3();

function Stand({ colorway, reducedMotion, interactive, progress, pose, annot }) {
  const travel = useRef(null);
  const model = useRef(null);
  const turn = useRef(null);
  const shadow = useRef(null);
  const geo = useStandGeometry();
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const layout = useMemo(() => layoutFor(size, pose), [size, pose]);
  const logos = useTexture({
    dark: asset('img/logo-horizontal-negro.png'),
    light: asset('img/logo-horizontal-blanco.png'),
  });
  const mats = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.6 }),
      cap: new THREE.MeshPhysicalMaterial({ roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.6 }),
      panel: new THREE.MeshStandardMaterial({ roughness: 0.75 }),
    }),
    []
  );
  // first paint uses the target colours directly; later changes are eased in useFrame
  const targets = useRef(null);
  if (!targets.current) {
    mats.body.color.set(colorway.body);
    mats.cap.color.set(colorway.cap);
    mats.panel.color.set(colorway.body).multiplyScalar(0.82);
  }
  targets.current = {
    body: new THREE.Color(colorway.body),
    cap: new THREE.Color(colorway.cap),
    panel: new THREE.Color(colorway.body).multiplyScalar(0.82),
  };

  useEffect(() => {
    camera.position.set(0, 0, layout.z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, layout]);

  const frame = panelFrame();
  const logoW = frame.length * 0.86;
  const logoH = logoW * (358 / 1201);
  const start = useRef(null);
  const smooth = useRef(progress.current);
  const faceZ = DEPTH / 2 + BEVEL;
  // Points the anatomy labels point at, in the traced outline's coordinates:
  // top insert, logo panel, a leg cell, the foot.
  const anchors = useMemo(() => {
    const cell = cells()[1];
    const cx = (cell[0][0] + cell[1][0] + cell[2][0]) / 3;
    const cy = (cell[0][1] + cell[1][1] + cell[2][1]) / 3;
    const { center } = panelFrame();
    return [[0, 266], center, [cx, cy], [-268, 10]].map(([x, y]) => new THREE.Vector3(x, y, faceZ + 2));
  }, [faceZ]);

  useFrame((state, dt) => {
    const g = travel.current;
    const r = turn.current;
    if (!g || !r) return;
    const k = 1 - Math.exp(-dt * 6);
    mats.body.color.lerp(targets.current.body, k);
    mats.cap.color.lerp(targets.current.cap, k);
    mats.panel.color.lerp(targets.current.panel, k);

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

    // Anatomy labels: project each anchor to the screen and move its marker,
    // leader line and label there. Written straight to the DOM, no React render.
    const A = annot?.current;
    if (!A || !model.current) return;
    g.updateMatrixWorld(true);
    const { width, height } = state.size;
    const wide = width >= 760;
    _c.setFromMatrixPosition(g.matrixWorld).project(state.camera);
    const cx = ((_c.x + 1) / 2) * width;
    const reveal = (p - (PHASE.bEnd - 0.04)) / (1 - PHASE.bEnd);
    anchors.forEach((a, i) => {
      _v.copy(a).applyMatrix4(model.current.matrixWorld).project(state.camera);
      const sx = ((_v.x + 1) / 2) * width;
      const sy = ((1 - _v.y) / 2) * height;
      const alpha = reducedMotion ? (p > 0.6 ? 1 : 0) : clamp01((reveal - i * 0.14) / 0.08);
      const marker = A.markers[i];
      if (marker) {
        marker.style.opacity = alpha;
        marker.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${0.6 + alpha * 0.4})`;
      }
      const label = A.labels[i];
      const line = A.lines[i];
      if (!label || !line) return;
      const side = sx < cx - 4 ? -1 : 1;
      const edge = side < 0 ? Math.min(sx - 48, cx - width * 0.11) : Math.max(sx + 48, cx + width * 0.11);
      const show = wide ? alpha : 0;
      label.style.opacity = show;
      label.dataset.side = side < 0 ? 'left' : 'right';
      label.style.transform = `translate(${edge}px, ${sy}px) translate(${side < 0 ? '-100%' : '0'}, -50%) translateX(${(1 - show) * side * 12}px)`;
      const x1 = sx + side * 10;
      line.setAttribute('x1', x1);
      line.setAttribute('y1', sy);
      line.setAttribute('x2', x1 + (edge - x1) * show);
      line.setAttribute('y2', sy);
      line.style.opacity = show;
    });
  });

  const logo = colorway.logo === 'light' ? logos.light : logos.dark;

  return (
    <>
      <group ref={travel}>
        <group ref={turn}>
          {/* vertical pose: stood on end, the hooked top pointing at the text */}
          <group rotation={[0, 0, pose === 'vertical' ? Math.PI / 2 : 0]}>
            <group ref={model} scale={S} position={[0, -STAND_DROP, 0]}>
              <mesh geometry={geo.body} material={mats.body} castShadow receiveShadow />
              <mesh geometry={geo.cap} material={mats.cap} castShadow />
              <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, faceZ - 0.6]} />
              <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, -faceZ - 0.9]} />
              <mesh position={[frame.center[0], frame.center[1], faceZ + 2]} rotation={[0, 0, frame.angle]}>
                <planeGeometry args={[logoW, logoH]} />
                <meshBasicMaterial map={logo} transparent opacity={0.92} toneMapped={false} />
              </mesh>
              <mesh position={[frame.center[0], frame.center[1], -faceZ - 3.6]} rotation={[0, Math.PI, -frame.angle]}>
                <planeGeometry args={[logoW, logoH]} />
                <meshBasicMaterial map={logo} transparent opacity={0.92} toneMapped={false} />
              </mesh>
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

export default function Stand3D({ colorway, reducedMotion, interactive, progress, pose, eventSource, annot }) {
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
        <Stand colorway={colorway} reducedMotion={reducedMotion} interactive={interactive} progress={progress} pose={pose} annot={annot} />
      </Canvas>
    </div>
  );
}
