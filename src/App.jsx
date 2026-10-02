import { useState } from 'react';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import { Colours, Details, Order, Origin } from './components/Sections.jsx';
import Footer from './components/Footer.jsx';
import { COLORWAYS } from './data.js';

export default function App() {
  const [colorway, setColorway] = useState(COLORWAYS[0].id);

  // "Verlo en 3D" from the colour tray: switch the model, go back up to it
  const preview = (id) => {
    setColorway(id);
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('inicio').scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <>
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <Nav />
      <Hero colorway={colorway} onColorway={setColorway} />
      <main id="main">
        <Origin />
        <Details />
        <Colours onPreview={preview} />
        <Order colorway={colorway} />
      </main>
      <Footer />
    </>
  );
}
