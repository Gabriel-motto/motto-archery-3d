import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import NotFound from './components/NotFound.jsx';

// One-page site: anything other than the root path is a miss. `?404` previews it.
const base = import.meta.env.BASE_URL;
const path = window.location.pathname;
const isHome = path === base || path === base.replace(/\/$/, '') || path === `${base}index.html`;
const missed = !isHome || new URLSearchParams(window.location.search).has('404');

createRoot(document.getElementById('root')).render(
  <StrictMode>{missed ? <NotFound /> : <App />}</StrictMode>
);
