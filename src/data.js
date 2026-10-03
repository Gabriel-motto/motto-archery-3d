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

// Bento per model. Facts the photos themselves show; nothing here is a spec
// we were not given.
export const DETAILS = {
  t: [
    {
      id: 'celdas',
      title: 'Celdas triangulares',
      text: 'La estructura calada quita material donde no trabaja y deja una pieza rígida y ligera de mover.',
      photo: 'multicolor-apilados',
      alt: 'Reposa en T verde, azul, morado y rosa apilados, con sus celdas triangulares',
    },
    {
      id: 'insertos',
      title: 'Cabeza en T con inserto',
      text: 'La pieza superior se imprime aparte: combínala con el cuerpo como quieras.',
      photo: 'negro-insertos-vertical',
      alt: 'Reposa en T negros con insertos azul, verde, rojo y naranja',
    },
    {
      // "plegado" comes from the owner's photo names; confirm it folds before launch.
      id: 'plegado',
      title: 'Se pliega',
      text: 'Abierto en la línea, recogido en la bolsa.',
      photo: 'trio-neutro-plegado',
      alt: 'Reposa en T blanco, gris y negro plegados',
    },
    {
      id: 'envase',
      title: 'Llega en su envase',
      text: 'Cada reposa sale preparado y con su marca, listo para regalar o para la próxima tirada.',
      photo: 'rojo-envase',
      alt: 'Reposa en T rojo dentro de su envase de Motto Archery',
    },
    {
      id: 'pedido',
      title: 'Impreso bajo pedido',
      text: 'No hay estantería: cada unidad se imprime cuando la pides, en el color que eliges.',
      photo: 'calidos',
      alt: 'Reposa en T amarillo, naranja, rojo y rosa',
    },
  ],
  pinza: [
    {
      id: 'celdas',
      title: 'Celdas triangulares',
      text: 'La pata fija es una celosía de triángulos: rígida donde trabaja, sin material donde no hace falta.',
      photo: 'rojo-azul-verde',
      alt: 'Reposa con pinza rojo con su pata de celdas triangulares e insertos azul y verde',
    },
    {
      id: 'insertos',
      title: 'Cabezal con insertos',
      text: 'Dos bandas de otro color recorren la zona de apoyo del cabezal.',
      photo: 'amarillo-perfil',
      alt: 'Reposa con pinza amarillos con las bandas negras del cabezal',
    },
    {
      id: 'plegado',
      title: 'Pata articulada',
      text: 'La pata del logo gira sobre un tornillo junto al cabezal.',
      photo: 'patas-neutras',
      alt: 'Patas articuladas blanca, gris y negra con su tornillo y el panel del logo',
    },
    {
      id: 'envase',
      title: 'Llega en su envase',
      text: 'Con su bolsa y su tarjeta de Motto Archery, listo para la próxima tirada.',
      photo: 'rojo-envase-tarjeta',
      alt: 'Reposa con pinza rojo en su envase con la tarjeta de Motto Archery',
    },
    {
      id: 'pedido',
      title: 'Impreso bajo pedido',
      text: 'Cuerpo e insertos en los colores que elijas, impresos cuando haces el pedido.',
      photo: 'rojo-azul',
      alt: 'Reposa con pinza rojo con insertos azules y otro azul con insertos rojos',
    },
  ],
};

// "Elige tu color" gallery per model: only photos where that model appears.
// colorway: which hero colour the "Verlo en 3D" button applies.
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

// Labels for the 3D anatomy, per model, in the order of the anchors in
// Stand3D. Only what the photos show; no measurements until the owner gives them.
export const ANATOMY = {
  t: [
    { title: 'Cabeza en T con inserto', text: 'El inserto superior se imprime aparte, en otro color.' },
    { title: 'Panel con la marca', text: 'Logo Motto Archery en relieve, en las dos caras.' },
    { title: 'Celdas triangulares', text: 'Quitan material donde la pieza no trabaja.' },
    { title: 'Dos patas en arco', text: 'Apoyo ancho y separado sobre el suelo.' },
  ],
  pinza: [
    { title: 'Cabezal con insertos', text: 'Dos bandas de color en la zona de apoyo.' },
    { title: 'Pata articulada', text: 'Gira sobre un tornillo junto al cabezal.' },
    { title: 'Celdas triangulares', text: 'La pata fija, calada en triángulos.' },
    { title: 'Panel con la marca', text: 'Logo en relieve sobre panal hexagonal.' },
  ],
};
