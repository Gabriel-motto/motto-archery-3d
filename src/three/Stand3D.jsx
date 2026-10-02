// Real-time 3D stand for the hero. The geometry is extruded from the traced
// silhouette in standShape.js (body, top insert, logo panel), lit by a single
// top-left key light with a soft contact shadow. Loaded lazily so the page
// paints before three.js arrives.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, useTexture } from '@react-three/drei';
import { asset } from '../data.js';
import { FOV, STAND_DROP, bodyOutline, capOutline, cells, panelFrame, panelOutline, roundedPath } from './standShape.js';

const S = 0.01; // photo pixels → scene units
const DEPTH = 34;
const BEVEL = 5;

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
      cap: extrude(toShape(capOutline(), 4), DEPTH + 2, BEVEL),
      panel: extrude(toShape(panelOutline(), 10), 1.5, 1),
    };
  }, []);
}

const colorTarget = (hex) => new THREE.Color(hex);

function Stand({ colorway, reducedMotion, interactive }) {
  const group = useRef(null);
  const geo = useStandGeometry();
  const logos = useTexture({
    dark: asset('img/logo-horizontal-negro.png'),
    light: asset('img/logo-horizontal-blanco.png'),
  });
  const mats = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({ roughness: 0.52, clearcoat: 0.25, clearcoatRoughness: 0.6 }),
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
  targets.current = { body: colorTarget(colorway.body), cap: colorTarget(colorway.cap), panel: colorTarget(colorway.body).multiplyScalar(0.82) };

  const frame = panelFrame();
  const logoW = frame.length * 0.86;
  const logoH = logoW * (358 / 1201);
  const start = useRef(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const k = 1 - Math.exp(-dt * 6);
    mats.body.color.lerp(targets.current.body, k);
    mats.cap.color.lerp(targets.current.cap, k);
    mats.panel.color.lerp(targets.current.panel, k);

    if (reducedMotion) {
      g.rotation.set(0.02, -0.38, 0);
      g.position.y = 0;
      return;
    }
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    // the authored moment: the stand rises into its recess and settles
    const rise = 1 - Math.pow(2, -7 * Math.min(t / 1.8, 1));
    const px = interactive ? state.pointer.x : 0;
    const py = interactive ? state.pointer.y : 0;
    const turn = Math.sin(t * 0.32) * 0.62;
    g.position.y = (1 - rise) * -0.9;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, (1 - rise) * -1.2 + turn + px * 0.35, 4, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -py * 0.12, 4, dt);
  });

  return (
    <group ref={group}>
      <group scale={S} position={[0, -STAND_DROP, 0]}>
        <mesh geometry={geo.body} material={mats.body} castShadow receiveShadow />
        <mesh geometry={geo.cap} material={mats.cap} castShadow />
        <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, DEPTH / 2 + BEVEL - 0.6]} />
        <mesh position={[frame.center[0], frame.center[1], DEPTH / 2 + BEVEL + 1.2]} rotation={[0, 0, frame.angle]}>
          <planeGeometry args={[logoW, logoH]} />
          <meshBasicMaterial map={colorway.logo === 'light' ? logos.light : logos.dark} transparent opacity={0.92} toneMapped={false} />
        </mesh>
        {/* the back carries the same logo panel, so the turn never shows a blank face */}
        <mesh geometry={geo.panel} material={mats.panel} position={[0, 0, -DEPTH / 2 - BEVEL - 0.9]} />
      </group>
    </group>
  );
}

/** Keeps the camera at the distance the hero computed, so the SVG recess lines up. */
function CameraRig({ z }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(0, 0, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, z]);
  return null;
}

export default function Stand3D({ cameraZ, colorway, reducedMotion, interactive }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);

  // stop rendering while the hero is scrolled away
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
        camera={{ position: [0, 0, cameraZ], fov: FOV }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        aria-hidden="true"
      >
        <CameraRig z={cameraZ} />
        <ambientLight intensity={0.25} />
        <spotLight position={[-5, 8, 6]} angle={0.42} penumbra={0.9} intensity={160} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[4, 2, -5]} intensity={1.2} color="#ffd9cf" />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[-4, 4, 4]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={0.8} position={[5, 1, 3]} scale={[3, 6, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#ff3b30" position={[0, 2, -6]} scale={3} />
        </Environment>
        <Stand colorway={colorway} reducedMotion={reducedMotion} interactive={interactive} />
        <ContactShadows position={[0, -STAND_DROP - 0.04, 0]} opacity={0.75} scale={9} blur={2.4} far={2.5} resolution={512} color="#000000" />
      </Canvas>
    </div>
  );
}
