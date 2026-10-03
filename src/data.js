// Photos live in public/img as <slug>-1600.webp and <slug>-800.webp.
// BASE_URL is '/' locally and the repo path on GitHub Pages.
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
export const img = (slug, size = 1600) => asset(`img/${slug}-${size}.webp`);
export const srcSet = (slug) => `${img(slug, 800)} 800w, ${img(slug)} 1600w`;

// ─── Pendiente del dueño: rellena al menos uno y todos los "Pide el tuyo"
// empiezan a funcionar. Prioridad: WhatsApp > email.
export const CONTACT = {
  whatsapp: '', // formato internacional sin "+" ni espacios, p. ej. '34600111222'
  email: '', // p. ej. 'pedidos@mottoarchery.com'
  instagram: '', // usuario sin "@", p. ej. 'mottoarchery'
};

export const HAS_CONTACT = Boolean(CONTACT.whatsapp || CONTACT.email || CONTACT.instagram);

function orderMessage(colorName) {
  return colorName
    ? `Hola, me interesa un reposa arcos Motto Archery en ${colorName.toLowerCase()}.`
    : 'Hola, me interesa un reposa arcos Motto Archery.';
}

/** Where an order button goes: WhatsApp or email with the colour already written; until then, the contact block. */
export function orderHref(colorName) {
  const msg = encodeURIComponent(orderMessage(colorName));
  if (CONTACT.whatsapp) return `https://wa.me/${CONTACT.whatsapp}?text=${msg}`;
  if (CONTACT.email) return `mailto:${CONTACT.email}?subject=${encodeURIComponent('Pedido Motto Archery')}&body=${msg}`;
  return '#pedido';
}

// Colourways seen in the product photos — which ones are sold is still to be
// confirmed with the owner. body/cap drive the 3D model, logo picks the
// wordmark that reads on that body colour.
export const COLORWAYS = [
  { id: 'rojo', name: 'Rojo y negro', body: '#d1191b', cap: '#151515', logo: 'dark', photo: 'rojo-negro' },
  { id: 'negro', name: 'Negro y rojo', body: '#1b1b1c', cap: '#d1191b', logo: 'light', photo: 'negro-rojo' },
  { id: 'blanco', name: 'Blanco', body: '#e9e7e2', cap: '#8d8f93', logo: 'dark', photo: 'trio-neutro' },
  { id: 'amarillo', name: 'Amarillo', body: '#f2bf0a', cap: '#151515', logo: 'dark', photo: 'amarillo' },
  { id: 'azul', name: 'Azul y turquesa', body: '#1f6fd1', cap: '#19b3b0', logo: 'light', photo: 'azul-turquesa' },
  { id: 'rosa', name: 'Rosa y morado', body: '#e57fb0', cap: '#7c4bc0', logo: 'dark', photo: 'rosa-morado' },
];

// Facts the photos themselves show; nothing here is a spec we were not given.
export const DETAILS = [
  {
    id: 'celdas',
    title: 'Celdas triangulares',
    text: 'La estructura calada quita material donde no trabaja y deja una pieza rígida y ligera de mover.',
    photo: 'rojo-azul-verde',
    alt: 'Reposa rojo con su estructura de celdas triangulares e insertos azul y verde',
    size: 'wide',
  },
  {
    id: 'insertos',
    title: 'Insertos de color',
    text: 'La pieza superior se imprime aparte: combínala con el cuerpo como quieras.',
    photo: 'negro-insertos-vertical',
    alt: 'Reposa negros con insertos azul, verde, rojo y naranja',
    size: 'tall',
  },
  {
    // "plegado" comes from the owner's photo names; confirm it folds before launch.
    id: 'plegado',
    title: 'Se pliega',
    text: 'Patas articuladas con tornillo: abierto en la línea, recogido en la bolsa.',
    photo: 'trio-neutro-plegado',
    alt: 'Reposa blanco, gris y negro plegados',
    size: 'square',
  },
  {
    id: 'envase',
    title: 'Llega en su envase',
    text: 'Cada reposa sale preparado y con su marca, listo para regalar o para llevar a la próxima tirada.',
    photo: 'rojo-envase-tarjeta',
    alt: 'Reposa rojo junto a su envase y tarjeta de Motto Archery',
    size: 'square',
  },
  {
    id: 'pedido',
    title: 'Impreso bajo pedido',
    text: 'No hay estantería: cada unidad se imprime cuando la pides, en el color que eliges.',
    photo: 'calidos',
    alt: 'Reposa amarillo, naranja, rojo y rosa',
    size: 'wide',
  },
];

export const STEPS = [
  { title: 'Elige el color', text: 'Cuerpo e inserto, de los colores disponibles.' },
  { title: 'Escríbenos', text: 'Nos cuentas cuál quieres y resolvemos tus dudas.' },
  { title: 'Lo imprimimos', text: 'Se fabrica para ti y te lo preparamos.' },
];

// Only questions whose answers we actually know; price, shipping, timing and
// compatibility details must come from the owner.
export const FAQ = [
  {
    q: '¿Para qué tipo de arco está pensado?',
    a: 'Para arcos de poleas (compuestos). Nació precisamente para el arco de poleas de su creador.',
  },
  {
    q: '¿Puedo elegir el color?',
    a: 'Sí. Se imprime bajo pedido, así que puedes elegir el color del cuerpo y el del inserto superior entre los disponibles.',
  },
  {
    q: '¿Cómo se fabrica?',
    a: 'Mediante impresión 3D, unidad a unidad, cuando haces el pedido.',
  },
  {
    q: '¿Cómo hago un pedido?',
    a: 'Escríbenos con el color que quieres y te explicamos el resto del proceso.',
  },
];

// Labels for the 3D anatomy, in the order of the anchors in Stand3D.
// Only what the photos show; no measurements until the owner gives them.
export const ANATOMY = [
  { title: 'Cabeza en T con inserto', text: 'El inserto superior se imprime aparte, en otro color.' },
  { title: 'Panel con la marca', text: 'Logo Motto Archery en relieve, en las dos caras.' },
  { title: 'Celdas triangulares', text: 'Quitan material donde la pieza no trabaja.' },
  { title: 'Dos patas en arco', text: 'Apoyo ancho y separado sobre el suelo.' },
];
