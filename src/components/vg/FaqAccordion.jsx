// Adapted from Vengeance UI "faq-accordion" (https://www.vengenceui.com),
// ported from Tailwind to plain CSS. Kept: the single-open behaviour and the
// grid-rows height animation. Changed: no thick coloured side stripe (off
// brand), +/- glyph replaced by the drawn cross, buttons wired to their
// panels with aria-controls / role=region for screen readers.
import { useId, useState } from 'react';
import './FaqAccordion.css';

export default function FaqAccordion({ items }) {
  const [active, setActive] = useState(null);
  const baseId = useId();

  return (
    <ul className="faq-acc">
      {items.map((item, i) => {
        const open = active === i;
        const btnId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <li key={item.q} className={`faq-acc__item ${open ? 'is-open' : ''}`}>
            <h3 className="faq-acc__heading">
              <button
                id={btnId}
                className="faq-acc__button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setActive(open ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-acc__icon" aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} className="faq-acc__panel" inert={!open}>
              <div className="faq-acc__clip">
                <p>{item.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
