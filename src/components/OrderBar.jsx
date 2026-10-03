import { useEffect, useState } from 'react';
import { COLORWAYS, VARIANTS, orderHref } from '../data.js';

/**
 * Phones only (CSS): once the hero's own order button has scrolled away, a bar
 * keeps "Pide el tuyo" and the chosen colour at hand. It steps aside again when
 * the order section itself is on screen.
 */
export default function OrderBar({ colorway, variant }) {
  const [pastHero, setPastHero] = useState(false);
  const [atOrder, setAtOrder] = useState(false);
  const current = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];
  const model = VARIANTS.find((v) => v.id === variant);

  useEffect(() => {
    const hero = document.querySelector('.hero__actions');
    const order = document.getElementById('pedido');
    const footer = document.querySelector('.footer');
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setPastHero(!seen.get(hero) && hero.getBoundingClientRect().top < 0);
      setAtOrder(Boolean(seen.get(order) || seen.get(footer)));
    });
    [hero, order, footer].forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const shown = pastHero && !atOrder;

  return (
    <div className={`order-bar ${shown ? 'is-shown' : ''}`} inert={!shown}>
      <span className="order-bar__pick">
        <span className="swatch__chip" style={{ '--body': current.body, '--cap': current.cap, width: 22, height: 22, flex: 'none' }} aria-hidden="true" />
        <strong>{model.name} · {current.name}</strong>
      </span>
      <a className="btn btn--red btn--sm" href={orderHref(current.name, model.name)}>
        Pide el tuyo
      </a>
    </div>
  );
}
