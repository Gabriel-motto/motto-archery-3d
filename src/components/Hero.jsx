// The opening scroll story: the 3D stand stays pinned while three panels
// scroll over it. Hero: copy on the left, stand on the right. Story: the stand
// turns to its other face and slides left, leaving room for the origin text.
// Anatomy: it comes back to the centre, whole, and labels point at its parts.
import { lazy, Suspense, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitText from './rb/SplitText.jsx';
import ScrollReveal from './rb/ScrollReveal.jsx';
import Magnet from './rb/Magnet.jsx';
import { ANATOMY, COLORWAYS, VARIANTS, orderHref } from '../data.js';
import VariantSwitch from './VariantSwitch.jsx';
import { useFinePointer, useReducedMotion } from '../hooks/useMotionPrefs.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Stand3D = lazy(() => import('../three/Stand3D.jsx'));

// ?pose=upright shows the stand on its feet; the default stands it on end.
const POSE = new URLSearchParams(window.location.search).get('pose') === 'upright' ? 'upright' : 'vertical';

export default function Hero({ colorway, onColorway, variant, onVariant }) {
  const story = useRef(null);
  const progress = useRef(0);
  // DOM nodes the 3D scene moves every frame (markers, leader lines, labels)
  const annot = useRef({ markers: [], lines: [], labels: [] });
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const current = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];
  const model = VARIANTS.find((v) => v.id === variant);
  const labels = ANATOMY[variant];

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: story.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => (progress.current = self.progress),
      });
    },
    { scope: story }
  );

  return (
    <div className="story" ref={story}>
      <div className="story__pin">
        <Suspense fallback={null}>
          <Stand3D
            colorway={current}
            variant={variant}
            reducedMotion={reducedMotion}
            interactive={finePointer}
            progress={progress}
            pose={POSE}
            eventSource={document.getElementById('root')}
            annot={annot}
          />
        </Suspense>
        <div className="anatomy" aria-hidden="true">
          <svg className="anatomy__lines">
            {labels.map((a, i) => (
              <line key={a.title} ref={(el) => (annot.current.lines[i] = el)} />
            ))}
          </svg>
          {labels.map((a, i) => (
            <span key={a.title} className="anatomy__marker" ref={(el) => (annot.current.markers[i] = el)}>
              {i + 1}
            </span>
          ))}
          {labels.map((a, i) => (
            <span key={a.title} className="anatomy__label" ref={(el) => (annot.current.labels[i] = el)}>
              <strong>{a.title}</strong>
              {a.text}
            </span>
          ))}
        </div>
      </div>

      <header className="panel panel--hero" id="inicio" tabIndex={-1}>
        <div className="panel__copy">
          <SplitText as="h1" className="hero__title" text="Tu arco con pisada firme." delay={0.15} />
          <p className="hero__lede">
            El soporte de arcos compuestos diseñado para la competición. Ligero, firme y preciso.
          </p>
          <VariantSwitch className="hero__switch" value={variant} onChange={onVariant} />
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
              <a className="btn btn--red" href={orderHref(current.name, model.name)}>
                Pide el tuyo
              </a>
            </Magnet>
            <a className="btn btn--ghost" href="#colores">
              Ver colores
            </a>
          </div>
        </div>
        <a className="scroll-cue" href="#origen">
          <span>Desliza</span>
          <svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true">
            <path d="M6 1v17M1 13l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </header>

      <section className="panel panel--story" id="origen" aria-labelledby="origen-title">
        <div className="panel__copy">
          <h2 id="origen-title" className="story__title">
            Nacido en competición
          </h2>
          <ScrollReveal
            className="story__text"
            start="top 95%"
            // finish while the panel settles: the text sits lower on phones
            end={() => (window.innerWidth < 760 ? 'top 72%' : 'top 42%')}
          >
            Nacido en la línea de tiro, usado por los mejores. Diseñado por un arquero para arqueros. Buscando la mayor estabilidad incluso en aire libre. Testado y demostrado en campeonatos de todo el mundo.
          </ScrollReveal>
          <p className="story__note">En tiendas especializadas. ¿Quieres hacerlo tuyo? Contáctanos.</p>
        </div>
      </section>

      <section className="panel panel--anatomy" aria-labelledby="pieza-title">
        <div className="panel__copy">
          <h2 id="pieza-title" className="anatomy__title">
            Ideado en busca de la perfección
          </h2>
          {/* the readable version of the labels: shown on phones, for screen readers everywhere */}
          <ol className="anatomy__legend">
            {labels.map((a) => (
              <li key={a.title}>
                <strong>{a.title}.</strong> {a.text}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
