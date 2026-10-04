import { asset } from '../data.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__cols">
        <p className="footer__claim">Soporte para arcos compuestos. Diseñado en la línea de tiro.</p>
        <ul className="footer__links">
          <li><a href="#origen">Origen</a></li>
          <li><a href="#detalles">Detalles</a></li>
          <li><a href="#colores">Colores</a></li>
          <li><a href="#pedido">Pedido</a></li>
        </ul>
        {/* credit read from the photo watermark — confirm the exact name with the owner */}
        <p className="footer__meta">
          Fotografía: Paula Marzoa
          <br />© {new Date().getFullYear()} Motto Archery
        </p>
      </div>
      <img className="footer__mark" src={asset('img/logo-horizontal-blanco.png')} alt="Motto Archery" width="1201" height="358" loading="lazy" />
    </footer>
  );
}
