import { useState } from 'react';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import { Colours, Details, Order } from './components/Sections.jsx';
import Footer from './components/Footer.jsx';
import OrderBar from './components/OrderBar.jsx';
import { COLORWAYS, VARIANTS } from './data.js';

export default function App() {
  const [colorway, setColorway] = useState(COLORWAYS[0].id);
  const [variant, setVariant] = useState(VARIANTS[0].id);
  // one short message for screen readers instead of re-reading whole sections
  const [status, setStatus] = useState('');

  const changeVariant = (id) => {
    setVariant(id);
    setStatus(`Mostrando el modelo ${VARIANTS.find((v) => v.id === id).name.toLowerCase()}`);
  };

  // "Verlo en 3D" from the colour tray: switch the colour, go back up to the
  // stand, and take keyboard focus there too so it isn't left behind
  const preview = (id) => {
    setColorway(id);
    setStatus(`Viendo en 3D: ${COLORWAYS.find((c) => c.id === id).name.toLowerCase()}`);
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = document.getElementById('inicio');
    hero.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    hero.focus({ preventScroll: true });
  };

  return (
    <>
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <Nav />
      <Hero colorway={colorway} onColorway={setColorway} variant={variant} onVariant={changeVariant} />
      <main id="main">
        <Details variant={variant} onVariant={changeVariant} />
        <Colours variant={variant} onVariant={changeVariant} onPreview={preview} />
        <Order colorway={colorway} variant={variant} />
      </main>
      <Footer />
      <OrderBar colorway={colorway} variant={variant} />
      <p className="sr-only" role="status">
        {status}
      </p>
    </>
  );
}
