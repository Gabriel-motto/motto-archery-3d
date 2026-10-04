import SpotlightCard from './rb/SpotlightCard.jsx';
import TiltedCard from './rb/TiltedCard.jsx';
import Magnet from './rb/Magnet.jsx';
import FaqAccordion from './vg/FaqAccordion.jsx';
import { useRef } from 'react';
import VariantSwitch, { useSlideSwap } from './VariantSwitch.jsx';
import { COLORWAYS, CONTACT, DETAILS, FAQ, GALLERY, HAS_CONTACT, STEPS, VARIANTS, img, orderHref, srcSet } from '../data.js';

export function Details({ variant, onVariant }) {
  const grid = useRef(null);
  const shown = useSlideSwap(variant, grid, '.bento__cell');
  return (
    <section className="details" id="detalles" aria-labelledby="detalles-title">
      <div className="section-head">
        <h2 id="detalles-title" className="section-title">
          Al detalle
        </h2>
        <VariantSwitch value={variant} onChange={onVariant} />
      </div>
      <div className="bento" ref={grid}>
        {DETAILS[shown].map((d) => (
          <SpotlightCard as="article" key={d.id} className={`bento__cell bento__cell--${d.id}`} spotlightColor="rgba(255, 59, 48, 0.12)">
            <div className="bento__photo">
              <img src={img(d.photo, 800)} srcSet={srcSet(d.photo)} sizes="(min-width: 900px) 40vw, 100vw" alt={d.alt} loading="lazy" />
            </div>
            <div className="bento__text">
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}

export function Colours({ variant, onVariant, onPreview }) {
  const tray = useRef(null);
  const shown = useSlideSwap(variant, tray, '.colour');
  const model = VARIANTS.find((v) => v.id === shown);
  return (
    <section className="colours" id="colores" aria-labelledby="colores-title">
      <div className="colours__head">
        <h2 id="colores-title" className="section-title">
          Tus colores
        </h2>
        <div className="colours__aside">
          <VariantSwitch value={variant} onChange={onVariant} />
          <p className="colours__note">Estos están en stock. ¿Otro color u otra combinación? Contáctanos.</p>
        </div>
      </div>
      <ul className="colours__tray" ref={tray}>
        {GALLERY[shown].map((g, i) => {
          const c = COLORWAYS.find((x) => x.id === g.colorway);
          return (
          <li key={i} className="colour">
            <TiltedCard className="colour__photo" src={img(g.photo, 800)} srcSet={srcSet(g.photo)} sizes="(min-width: 900px) 30vw, 80vw" alt={`Soporte ${model.name.toLowerCase()}, ${g.name.toLowerCase()}`} rotateAmplitude={6} />
            <div className="colour__row">
              <h3 className="colour__name">
                <span className="colour__chip" style={{ '--body': c.body, '--cap': c.cap }} aria-hidden="true" />
                {g.name}
              </h3>
              <button className="link-btn" onClick={() => onPreview(c.id)}>
                Verlo en 3D
              </button>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Order({ colorway, variant }) {
  const current = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];
  const model = VARIANTS.find((v) => v.id === variant);
  return (
    <section className="order" id="pedido" aria-labelledby="pedido-title">
      <div className="order__cta">
        <h2 id="pedido-title" className="order__title">
          Pide el tuyo.
        </h2>
        <p className="order__lede">
          Escríbenos o búscalo en tu tienda de tiro con arco. Tienes elegido el modelo <strong>{model.name.toLowerCase()}</strong> en <strong>{current.name.toLowerCase()}</strong>.
        </p>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="order__actions">
          <Magnet padding={50} magnetStrength={5}>
            <a className="btn btn--red btn--lg" href={orderHref(current.name, model.name)}>
              Escribir para pedirlo
            </a>
          </Magnet>
          {!HAS_CONTACT && <p className="order__pending">Mock-up: falta añadir WhatsApp, email o Instagram.</p>}
          {CONTACT.instagram && (
            <a className="link-btn" href={`https://instagram.com/${CONTACT.instagram}`}>
              @{CONTACT.instagram} en Instagram
            </a>
          )}
        </div>
      </div>
      <div className="order__faq">
        <h2 className="section-title section-title--sm">Preguntas</h2>
        <FaqAccordion items={FAQ} />
      </div>
    </section>
  );
}
