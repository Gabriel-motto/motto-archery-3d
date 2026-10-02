import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import SplitText from './rb/SplitText.jsx';
import Magnet from './rb/Magnet.jsx';
import { COLORWAYS, orderHref } from '../data.js';
import { STAND_DROP, bodyOutline, capOutline, fitCameraZ, svgPath, viewHeightPx } from '../three/standShape.js';
import { useFinePointer, useReducedMotion } from '../hooks/useMotionPrefs.js';

const Stand3D = lazy(() => import('../three/Stand3D.jsx'));


/** The foam cut-out the stand sits in, drawn from the same outline as the model. */
function Recess({ aspect, cameraZ }) {
  const VIEW_H = viewHeightPx(cameraZ);
  const d = useMemo(() => svgPath(bodyOutline(), 10) + svgPath(capOutline(), 4), []);
  const w = VIEW_H * aspect;
  return (
    <svg className="recess" viewBox={`${-w / 2} ${-VIEW_H / 2} ${w} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <filter id="recess-inset" x="-10%" y="-10%" width="120%" height="120%">
          <feComponentTransfer in="SourceAlpha" result="inv">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feOffset dx="-4" dy="9" />
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feFlood floodColor="#000" floodOpacity="0.95" />
          <feComposite operator="in" in2="blur" />
          <feComposite operator="in" in2="SourceAlpha" result="shadow" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shadow" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(0 ${STAND_DROP * 100})`} filter="url(#recess-inset)">
        <path d={d} className="recess__rim" />
        <path d={d} className="recess__cut" />
        {/* finger notch, the way a case insert lets you lift the piece out */}
        <ellipse cx="0" cy="-262" rx="46" ry="34" className="recess__cut" />
      </g>
    </svg>
  );
}

function useAspect(ref) {
  const [aspect, setAspect] = useState(2);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (height) setAspect(width / height);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return aspect;
}

export default function Hero({ colorway, onColorway }) {
  const stage = useRef(null);
  const aspect = useAspect(stage);
  const cameraZ = fitCameraZ(aspect);
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const current = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];

  return (
    <header className="hero" id="inicio">
      <div className="hero__copy">
        <SplitText as="h1" className="hero__title" text="Nació en la línea de tiro." delay={0.15} />
        <p className="hero__lede">
          Reposa arcos para arcos de poleas, diseñado por un arquero de competición para su propio arco. Impreso en 3D bajo pedido, en tu color.
        </p>
      </div>

      <div className="hero__stage" ref={stage}>
        <Recess aspect={aspect} cameraZ={cameraZ} />
        <Suspense fallback={null}>
          <Stand3D cameraZ={cameraZ} colorway={current} reducedMotion={reducedMotion} interactive={finePointer} />
        </Suspense>
      </div>

      <div className="hero__foot">
        <fieldset className="swatches">
          <legend className="swatches__legend">
            Color: <strong>{current.name}</strong>
          </legend>
          <div className="swatches__row">
            {COLORWAYS.map((c) => (
              <label key={c.id} className="swatch" title={c.name}>
                <input type="radio" name="hero-color" value={c.id} checked={c.id === current.id} onChange={() => onColorway(c.id)} />
                <span className="swatch__chip" style={{ '--body': c.body, '--cap': c.cap }} aria-hidden="true" />
                <span className="sr-only">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="hero__actions">
          <Magnet padding={40} magnetStrength={5}>
            <a className="btn btn--red" href={orderHref(current.name)}>
              Pide el tuyo
            </a>
          </Magnet>
          <a className="btn btn--ghost" href="#colores">
            Ver todos los colores
          </a>
        </div>
      </div>
    </header>
  );
}
