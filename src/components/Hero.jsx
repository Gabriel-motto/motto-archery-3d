// The opening scroll story: the 3D stand stays pinned while two panels scroll
// over it. Panel one (hero) has the copy on the left and the stand on the
// right; scrolling turns the stand to its other face and slides it left,
// which leaves the right side free for panel two, the product's story.
import { lazy, Suspense, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitText from './rb/SplitText.jsx';
import ScrollReveal from './rb/ScrollReveal.jsx';
import Magnet from './rb/Magnet.jsx';
import { COLORWAYS, orderHref } from '../data.js';
import { useFinePointer, useReducedMotion } from '../hooks/useMotionPrefs.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Stand3D = lazy(() => import('../three/Stand3D.jsx'));

// ?pose=upright shows the stand on its feet; the default stands it on end.
const POSE = new URLSearchParams(window.location.search).get('pose') === 'upright' ? 'upright' : 'vertical';

export default function Hero({ colorway, onColorway }) {
  const story = useRef(null);
  const progress = useRef(0);
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const current = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];

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
            reducedMotion={reducedMotion}
            interactive={finePointer}
            progress={progress}
            pose={POSE}
            eventSource={document.getElementById('root')}
          />
        </Suspense>
      </div>

      <header className="panel panel--hero" id="inicio">
        <div className="panel__copy">
          <SplitText as="h1" className="hero__title" text="Nació en la línea de tiro." delay={0.15} />
          <p className="hero__lede">
            Reposa arcos para arcos de poleas, diseñado por un arquero de competición para su propio arco. Impreso en 3D bajo pedido, en tu color.
          </p>
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
            Hecho por un arquero
          </h2>
          <ScrollReveal
            className="story__text"
            start="top 95%"
            // finish while the panel settles: the text sits lower on phones
            end={() => (window.innerWidth < 760 ? 'top 72%' : 'top 42%')}
          >
            No salió de un catálogo. Lo diseñó un arquero de poleas, después de muchos años compitiendo, para apoyar su propio arco entre tandas. Luego se lo pidieron los de su línea.
          </ScrollReveal>
          <p className="story__note">Hoy cada reposa se sigue imprimiendo uno a uno, bajo pedido, en el color que eliges.</p>
        </div>
      </section>
    </div>
  );
}
