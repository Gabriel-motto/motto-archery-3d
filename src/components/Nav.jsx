import { useEffect, useState } from 'react';
import { asset, orderHref } from '../data.js';

const LINKS = [
  { href: '#origen', label: 'Origen' },
  { href: '#detalles', label: 'Detalles' },
  { href: '#colores', label: 'Colores' },
  { href: '#pedido', label: 'Pedido' },
];

/** Floating pill nav; turns solid once the page scrolls under it. */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`} aria-label="Principal">
      <a className="nav__brand" href="#inicio" aria-label="Motto Archery, inicio">
        <img src={asset('img/logo-horizontal-blanco.png')} alt="" width="120" height="36" />
      </a>
      <ul className="nav__links" id="nav-links">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <a className="btn btn--red btn--sm nav__cta" href={orderHref()}>
        Pide el tuyo
      </a>
      <button
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true" />
      </button>
    </nav>
  );
}
