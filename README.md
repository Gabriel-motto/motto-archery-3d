# Motto Archery: landing (mock-up 3D)

Landing de una sola página para los reposa arcos de Motto Archery. Está hecha con React + Vite, GSAP para las animaciones y three.js (vía @react-three/fiber) para el reposa en 3D.

- **En vivo:** https://gabriel-motto.github.io/motto-archery-3d/
- **Página de error:** cualquier ruta que no exista, por ejemplo `/nada`, o `?404` en local.
- **Variante "de pie":** añade `?pose=upright` a la URL.

## Arrancar, publicar

```bash
npm install          # la primera vez
npm run dev          # servidor local → http://localhost:5173 (añade -- --host para verlo en la red)
npm run build        # compila a dist/
npm run deploy       # compila para GitHub Pages y sube dist/ a la rama gh-pages
```

`npm run deploy` publica directamente. Tarda uno o dos minutos en verse y no hace falta tocar nada en GitHub.

---

## Lo más probable que quieras cambiar

| Quiero… | Dónde |
|---|---|
| Poner WhatsApp / email / Instagram para que funcionen los botones de pedido | `src/data.js` → `CONTACT` |
| Cambiar los colores del selector (y del 3D) | `src/data.js` → `COLORWAYS` (`body` = cuerpo, `cap` = inserto, `logo` = logo claro u oscuro) |
| Cambiar textos, fotos o el orden del bento ("Cortado a medida") | `src/data.js` → `DETAILS.t` / `DETAILS.pinza` |
| Cambiar las fotos de "Elige tu color" | `src/data.js` → `GALLERY.t` / `GALLERY.pinza` |
| Cambiar las etiquetas de "Pieza a pieza" | `src/data.js` → `ANATOMY` (el orden importa, ver más abajo) |
| Cambiar los pasos del pedido o las preguntas frecuentes | `src/data.js` → `STEPS` / `FAQ` |
| Cambiar el titular o el texto del hero o de la historia | `src/components/Hero.jsx` |
| Cambiar colores, tipografías o espaciados generales | `src/index.css` → bloque `:root` del principio |
| Añadir fotos nuevas | `public/img/` (ver "Fotos") |
| Cambiar los nombres de los modelos ("En T", "Con pinza") | `src/data.js` → `VARIANTS` |

Casi todo el contenido vive en `src/data.js`. Los componentes solo lo pintan.

---

## Mapa de archivos

### Raíz
| Archivo | Qué es |
|---|---|
| `index.html` | El HTML base: título, descripción, fuentes de Google (Big Shoulders Display + Schibsted Grotesk) y metadatos para compartir en WhatsApp/redes (`og:*`). |
| `vite.config.js` | Configuración de Vite. Cuando se publica en Pages cambia la ruta base a `/motto-archery-3d/`. |
| `scripts/deploy-pages.mjs` | Lo que hace `npm run deploy`: compila, copia `index.html` como `404.html` (para la página de "Has fallado el tiro") y sube `dist/` a la rama `gh-pages`. |
| `PRODUCT.md` | Ficha del producto para el plugin impeccable: público, tono y lo que **no** se puede inventar (precios, medidas, testimonios…). |
| `.impeccable/surfaces/index-html.md` | La "dirección de diseño" acordada (el estuche del arco). |
| `LICENSE-reactbits.md` | Licencia de los componentes adaptados de React Bits. |
| `public/` | Archivos que se sirven tal cual: `img/` (fotos y logos), `favicon.png`, `og-image.jpg` (la imagen que sale al compartir el enlace). |

### `src/`: la aplicación
| Archivo | Qué es |
|---|---|
| `main.jsx` | Punto de entrada. Decide si pinta la web (`App`) o la página de error (`NotFound`) según la URL. |
| `App.jsx` | Monta la página en orden: nav → hero/historia/anatomía → bento → colores → pedido → footer → barra de pedido móvil. Guarda el **color** y el **modelo** elegidos y los reparte a todas las secciones. |
| `data.js` | **Todo el contenido**: contacto, colores, modelos, bento, galería, pasos, FAQ, etiquetas 3D. También tiene `orderHref()`, que arma el enlace de WhatsApp/email con el mensaje ya escrito ("…con pinza en rojo y negro"). |
| `index.css` | Todos los estilos. Arriba están las variables (`--foam` fondo, `--bone` texto, `--red` acción…). Cada sección tiene su bloque comentado, en el mismo orden que la página. |
| `hooks/useMotionPrefs.js` | Dos detectores: si el usuario pidió "reducir movimiento" en su sistema, y si usa ratón (para activar efectos de hover solo con ratón). |

### `src/components/`: las secciones
| Archivo | Qué es |
|---|---|
| `Nav.jsx` | Menú flotante tipo pastilla. Se oscurece al hacer scroll, se esconde al bajar y vuelve al subir. En móvil se convierte en un desplegable. |
| `Hero.jsx` | La parte de arriba con scroll: el reposa 3D se queda fijo mientras pasan tres paneles. (1) Hero con título, selector de modelo, colores y botones. (2) "Hecho por un arquero", la historia. (3) "Pieza a pieza", con las etiquetas que apuntan al 3D. Aquí se mide cuánto has bajado (`progress`) y se le pasa al 3D. |
| `Sections.jsx` | Las secciones de abajo: `Details` (bento "Cortado a medida"), `Colours` (galería "Elige tu color") y `Order` (pedido + preguntas). |
| `VariantSwitch.jsx` | El interruptor "En T / Con pinza" (`VariantSwitch`) y `useSlideSwap`, la animación que desliza el contenido del bento y la galería al cambiar de modelo (sale por un lado y vuelve por el mismo). |
| `OrderBar.jsx` | Barra fija de "Pide el tuyo" que solo aparece en móvil, después del hero y antes de la sección de pedido. |
| `Footer.jsx` | Pie con enlaces, crédito de la fotógrafa y el logo grande a todo el ancho. |
| `NotFound.jsx` | Página 404: la diana con la flecha fuera, "Has fallado el tiro". |
| `rb/*` | Componentes adaptados de **React Bits**: `SplitText` (titular que aparece palabra a palabra), `ScrollReveal` (historia que se revela con el scroll), `Magnet` (botones que se acercan al ratón), `SpotlightCard` (brillo que sigue al ratón en el bento) y `TiltedCard` (fotos que se inclinan con el ratón). |
| `vg/*` | Componentes adaptados de **Vengeance UI**: `FaqAccordion` (las preguntas desplegables). |

### `src/three/`: el reposa en 3D
| Archivo | Qué es |
|---|---|
| `standShape.js` | **La forma de los dos modelos**, en 2D: contornos, celdas triangulares, paneles del logo, posición del tornillo… Están calcados de las fotos, en "píxeles de foto" (el reposa mide unos 600 de ancho y 270 de alto). Si algo del modelo no se parece, se toca aquí. |
| `Stand3D.jsx` | La escena 3D. Convierte esas formas en piezas con grosor (extrusión), las pinta con el color elegido, pone luces y sombra, y mueve el reposa según el scroll. También mueve las etiquetas de "Pieza a pieza" para que sigan al modelo y lanza la transición al cambiar de modelo. |
| `sweep.js` | El efecto de cambio de modelo: una línea roja que sube "imprimiendo" el modelo nuevo y borrando el viejo. Es un pequeño shader que se inyecta en los materiales. |

---

## Cómo funciona por dentro (lo justo)

**El recorrido del 3D con el scroll.** `Hero.jsx` mide el scroll de toda la zona superior como un número de 0 a 1. `Stand3D.jsx` lo traduce en posición, giro y tamaño con `poseAt()`:
- de 0 a ⅓: el reposa pasa de la derecha (cara delantera, mitad de arriba) a la izquierda (cara trasera, mitad de abajo);
- de ⅓ a 0,4: se queda quieto mientras lees la historia;
- de 0,4 a 0,64: vuelve al centro, entero y más pequeño;
- de 0,64 a 1: gira un poco y aparecen las etiquetas una a una.

Los tamaños por pantalla salen de `layoutFor()`. En el móvil el reposa se queda arriba y solo gira.

**Las etiquetas de "Pieza a pieza".** En `Stand3D.jsx`, `ANCHORS` define a qué punto del modelo apunta cada etiqueta. El orden tiene que coincidir con el de `ANATOMY` en `data.js`: la primera etiqueta apunta al primer punto, etc.

**Cambiar de modelo.** Los dos modelos están siempre cargados. Al cambiar, `sweep.js` corta uno por encima de la línea y el otro por debajo mientras la línea sube durante 1,7 s (`SWEEP_SECONDS`). Con "reducir movimiento" activado, el cambio es instantáneo.

**Colores.** El color del cuerpo y del inserto del 3D salen de `COLORWAYS` y cambian con una transición suave. Las fotos de la galería son fijas: si añadís un color nuevo, conviene añadir también su foto en `GALLERY`.

**Accesibilidad y movimiento.** Todas las animaciones respetan la opción del sistema "reducir movimiento". Los efectos de ratón solo se activan si hay ratón. Las etiquetas 3D tienen su versión en texto (lista) para lectores de pantalla.

---

## Fotos

Las fotos están en `public/img/` como `nombre-800.webp` y `nombre-1600.webp`, dos tamaños para que el móvil cargue la pequeña. En `data.js` se usan por su nombre sin sufijo (`photo: 'rojo-azul'`).

Para añadir una foto nueva, expórtala a WebP en 800 y 1600 px de ancho con ese patrón de nombres. Por ejemplo, con cualquier conversor online o con Squoosh.

| Modelo | Fotos |
|---|---|
| Con pinza | `rojo-azul-verde`, `rojo-azul`, `amarillo`, `amarillo-perfil`, `rojo-envase-tarjeta`, `patas-neutras` |
| En T | El resto |

---

## Pendiente (datos del dueño)

- Contacto real (`CONTACT` en `data.js`). Hasta entonces los botones de pedido llevan a la sección de pedido.
- Qué colores y combinaciones se pueden hacer, para el configurador cuerpo + inserto.
- Confirmar que el modelo en T se pliega (el bento lo dice por el nombre de la foto).
- Precio, envío y plazos, si se quieren mostrar.
- Nombre exacto de la fotógrafa para el crédito (ahora pone "Paula Marzoa").
- Archivos 3D reales (STL/3MF) de los dos modelos, para sustituir los calcados de las fotos.
