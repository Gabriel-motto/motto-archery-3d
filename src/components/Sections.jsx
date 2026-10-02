import SpotlightCard from './rb/SpotlightCard.jsx';
import TiltedCard from './rb/TiltedCard.jsx';
import Magnet from './rb/Magnet.jsx';
import FaqAccordion from './vg/FaqAccordion.jsx';
import { COLORWAYS, CONTACT, DETAILS, FAQ, HAS_CONTACT, STEPS, img, orderHref, srcSet } from '../data.js';

export function Details() {
  return (
    <section className="details" id="detalles" aria-labelledby="detalles-title">
      <h2 id="detalles-title" className="section-title">
        Cortado a medida
      </h2>
      <div className="bento">
        {DETAILS.map((d) => (
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

export function Colours({ onPreview }) {
  return (
    <section className="colours" id="colores" aria-labelledby="colores-title">
      <div className="colours__head">
        <h2 id="colores-title" className="section-title">
          Elige tu color
        </h2>
        <p className="colours__note">Cuerpo e inserto se imprimen por separado. Estas son algunas combinaciones ya hechas.</p>
      </div>
      <ul className="colours__tray">
        {COLORWAYS.map((c) => (
          <li key={c.id} className="colour">
            <TiltedCard className="colour__photo" src={img(c.photo, 800)} srcSet={srcSet(c.photo)} sizes="(min-width: 900px) 30vw, 80vw" alt={`Reposa ${c.name.toLowerCase()}`} rotateAmplitude={6} />
            <div className="colour__row">
              <h3 className="colour__name">
                <span className="colour__chip" style={{ '--body': c.body, '--cap': c.cap }} aria-hidden="true" />
                {c.name}
              </h3>
              <button className="link-btn" onClick={() => onPreview(c.id)}>
                Verlo en 3D
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Order({ colorway }) {
  const current = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];
  return (
    <section className="order" id="pedido" aria-labelledby="pedido-title">
      <div className="order__cta">
        <h2 id="pedido-title" className="order__title">
          Pide el tuyo.
        </h2>
        <p className="order__lede">
          Dinos el color y lo imprimimos para ti. Ahora mismo tienes elegido <strong>{current.name.toLowerCase()}</strong>.
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
            <a className="btn btn--red btn--lg" href={orderHref(current.name)}>
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
