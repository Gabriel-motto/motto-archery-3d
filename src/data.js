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

function orderMessage(colorName, modelName) {
  const model = modelName ? ` ${modelName.toLowerCase()}` : '';
  return colorName
    ? `Hola, me interesa un reposa arcos Motto Archery${model} en ${colorName.toLowerCase()}.`
    : `Hola, me interesa un reposa arcos Motto Archery${model}.`;
}

/** Where an order button goes: WhatsApp or email with the colour already written; until then, the contact block. */
export function orderHref(colorName, modelName) {
  const msg = encodeURIComponent(orderMessage(colorName, modelName));
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

// The two models, told apart in the photos: the T head with its top insert,
// and the clamp ("pinza") with a slotted head, insert strips and a pivoting leg.
export const VARIANTS = [
  { id: 't', name: 'En T' },
  { id: 'pinza', name: 'Con pinza' },
];

// Bento per model. Only what the photos and the owner confirm: stock models,
// sold in specialised shops, custom colours on request. It does not fold.
const TOUGH = { title: 'Diseñado para resistir', text: 'Con un peso mínimo.' };
const BOXED = { title: 'Llega en su envase', text: 'Listo para regalar o para la próxima tirada.' };
const SHOPS = { title: 'En tu tienda', text: 'Disponible en tiendas especializadas de tiro con arco.' };

export const DETAILS = {
  t: [
    { id: 'celdas', ...TOUGH, photo: 'multicolor-apilados', alt: 'Reposa en T verde, azul, morado y rosa apilados' },
    {
      id: 'insertos',
      title: 'Cabezal en T',
      text: 'Especial para palas bífidas.',
      photo: 'negro-insertos-vertical',
      alt: 'Reposa en T negros con insertos azul, verde, rojo y naranja',
    },
    {
      id: 'plegado', // grid slot name only
      title: '¿Uno especial?',
      text: 'Un color que no ves aquí, una combinación tuya: te lo hacemos.',
      photo: 'multicolor',
      alt: 'Reposa en T verde, azul, morado y rosa',
    },
    { id: 'envase', ...BOXED, photo: 'rojo-envase', alt: 'Reposa en T rojo dentro de su envase de Motto Archery' },
    { id: 'pedido', ...SHOPS, photo: 'neutros-apilados', alt: 'Reposa en T blanco, gris y negro apilados' },
  ],
  pinza: [
    { id: 'celdas', ...TOUGH, photo: 'rojo-azul-verde', alt: 'Reposa con pinza rojo con su pata calada e insertos azul y verde' },
    {
      id: 'insertos',
      title: 'Cabezal con pinza',
      text: 'Diseño universal.',
      photo: 'amarillo-perfil',
      alt: 'Reposa con pinza amarillos con las bandas negras del cabezal',
    },
    {
      id: 'plegado', // grid slot name only
      title: 'Pata articulada',
      text: 'Apertura total para todo tipo de palas.',
      photo: 'patas-neutras',
      alt: 'Patas articuladas blanca, gris y negra con su tornillo y el panel del logo',
    },
    { id: 'envase', ...BOXED, photo: 'rojo-envase-tarjeta', alt: 'Reposa con pinza rojo en su envase con la tarjeta de Motto Archery' },
    { id: 'pedido', ...SHOPS, photo: 'rojo-azul', alt: 'Reposa con pinza rojo con insertos azules y otro azul con insertos rojos' },
  ],
};

export const GALLERY = {
  t: [
    { photo: 'rojo-negro', name: 'Rojo y negro', colorway: 'rojo' },
    { photo: 'negro-rojo', name: 'Negro y rojo', colorway: 'negro' },
    { photo: 'trio-neutro', name: 'Blanco, gris y negro', colorway: 'blanco' },
    { photo: 'calidos', name: 'Amarillo, naranja y rosa', colorway: 'amarillo' },
    { photo: 'azul-turquesa', name: 'Azul y turquesa', colorway: 'azul' },
    { photo: 'rosa-morado', name: 'Rosa y morado', colorway: 'rosa' },
  ],
  pinza: [
    { photo: 'amarillo', name: 'Amarillo y negro', colorway: 'amarillo' },
    { photo: 'rojo-azul-verde', name: 'Rojo con azul y verde', colorway: 'rojo' },
    { photo: 'rojo-azul', name: 'Rojo y azul', colorway: 'azul' },
    { photo: 'patas-neutras', name: 'Blanco, gris y negro', colorway: 'blanco' },
  ],
};

export const STEPS = [
  { title: 'Elige modelo y color', text: 'De los que hay en stock.' },
  { title: 'Escríbenos', text: 'Resolvemos tus dudas.' },
  { title: '¿Especial?', text: 'Dinos colores y te lo hacemos.' },
];

// Only answers we know; price, shipping and shop names come from the owner.
export const FAQ = [
  { q: '¿Dónde lo compro?', a: 'En tiendas especializadas de tiro con arco, o escribiéndonos directamente.' },
  { q: '¿Puedo pedir un color especial?', a: 'Pregúntanos por disponibilidad de colores.' },
  { q: '¿Para qué arcos sirve?', a: 'Para arcos de poleas. Nació para el de su creador.' },
  {
    q: '¿Qué diferencia hay entre los dos modelos?',
    a: 'El modelo en T lleva una cabeza en T especial para palas bífidas. El modelo con pinza permite usarlo en todo tipo de arcos compuestos.',
  },
];

export const ANATOMY = {
  t: [
    { title: 'Cabezal en T', text: 'Especial para palas bífidas.' },
    { title: 'Panel Motto Archery', text: 'Logo en relieve.' },
    { title: 'Estructura en triángulos', text: 'Resistente, con el peso mínimo.' },
    { title: 'Patas en arco', text: 'Base ancha, apoyo firme.' },
  ],
  pinza: [
    { title: 'Cabezal con pinza', text: 'Diseño universal.' },
    { title: 'Pata articulada', text: 'Gira sobre su tornillo.' },
    { title: 'Pata calada', text: 'Resistente, con el peso mínimo.' },
    { title: 'Panel Motto Archery', text: 'Logo en relieve sobre panal.' },
  ],
};
