import { asset } from '../data.js';

// World Archery face colours, outermost first.
const RINGS = ['#f2f0eb', '#f2f0eb', '#1b1b1c', '#1b1b1c', '#2a7bd6', '#2a7bd6', '#e10b0b', '#e10b0b', '#f6c800', '#f6c800'];

export default function NotFound() {
  const home = import.meta.env.BASE_URL;
  return (
    <main className="miss">
      <a className="miss__brand" href={home}>
        <img src={asset('img/logo-horizontal-blanco.png')} alt="Motto Archery" width="140" height="42" />
      </a>
      <svg className="miss__target" viewBox="-120 -120 240 240" aria-hidden="true">
        {RINGS.map((c, i) => (
          <circle key={i} r={100 - i * 10} fill={c} stroke={i < 2 ? '#1b1b1c' : i === 2 || i === 3 ? '#f2f0eb' : '#1b1b1c'} strokeWidth="0.6" />
        ))}
        <path d="M-3 0h6M0 -3v6" stroke="#1b1b1c" strokeWidth="0.8" />
        {/* the arrow, well off the face, buried in the foam */}
        <g className="miss__arrow" transform="translate(112 -96) rotate(38)">
          <line x1="0" y1="0" x2="0" y2="-70" stroke="#f2f0eb" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 -70 l-7 -12 v-14 l7 6 l7 -6 v14z" fill="#e10b0b" />
          <circle r="4" fill="#0b0b0b" />
        </g>
      </svg>
      <h1 className="miss__title">Has fallado el tiro.</h1>
      <p className="miss__text">Esta página no existe. Recoge la flecha y vuelve a la línea.</p>
      <a className="btn btn--red" href={home}>
        Volver a la línea de tiro
      </a>
    </main>
  );
}
