// The stand's front silhouette, traced from the product photos (negro-rojo,
// rojo-azul-verde): an arch on two legs, a T-shaped cradle on top whose upper
// bar is a separate coloured insert, triangular cells cut into the left leg
// and a logo panel on the right one. Units are "photo pixels", y up, base on
// y = 0, centred on x = 0. Both the three.js model and the SVG recess in the
// hero are built from these same points, so the foam cut-out always fits.

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const quad = (p0, c, p1, t) => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
};
const cubic = (p0, c1, c2, p1, t) => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]];
};
const sample = (fn, n) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

// Right leg edges, t = 0 at the top, t = 1 at the foot.
const SHOULDER = [84, 202];
const FOOT_OUT = [300, 10];
const FOOT_IN = [210, 0];
const APEX = [0, 100];
const outerEdge = (t) => quad(SHOULDER, [206, 138], FOOT_OUT, t);
const innerEdge = (t) => cubic(APEX, [40, 98], [136, 38], FOOT_IN, t);

const NECK = 22; // half width of the neck under the T
const BAR_LOW = 236; // underside of the T bar
const BAR_TOP = 252; // where the coloured insert starts
const CAP_TOP = 270;
const BAR_HALF = 104;

/** Closed outline of the printed body (without the insert), counter-clockwise. */
export function bodyOutline() {
  // underside of the arch: left foot → apex → right foot
  const under = sample(innerEdge, 18); // apex → right foot
  const underLeft = under.map(([x, y]) => [-x, y]).reverse();
  // right foot, outer edge up to the shoulder, neck, T bar
  const topRight = [
    [292, 0],
    [304, 6],
    ...sample(outerEdge, 18).reverse().slice(1),
    [NECK, 204],
    [NECK, BAR_LOW],
    [BAR_HALF - 6, BAR_LOW],
    [BAR_HALF, BAR_LOW + 6],
    [BAR_HALF, BAR_TOP],
  ];
  // …then the same thing mirrored, back down to the left foot
  const topLeft = topRight.map(([x, y]) => [-x, y]).reverse();
  return [...underLeft, ...under.slice(1), ...topRight, ...topLeft];
}

/** The coloured insert on top of the T: a bar with rounded, slightly drooping ends. */
export function capOutline() {
  // a bar along the top whose ends hook down over the body's T, as in the photos
  const right = [
    [BAR_HALF - 8, CAP_TOP],
    [BAR_HALF + 12, CAP_TOP - 6],
    [BAR_HALF + 16, BAR_TOP - 4],
    [BAR_HALF + 8, BAR_LOW + 2],
    [BAR_HALF + 2, BAR_TOP - 2],
    [BAR_HALF - 4, BAR_TOP + 4],
  ];
  const left = right.map(([x, y]) => [-x, y]).reverse();
  // clockwise from the top-left: across the top, round the right hook, back along the underside
  return [...left.slice(-1), ...right, ...left.slice(0, -1)];
}

function shrink(tri, d) {
  const c = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];
  return tri.map((p) => {
    const v = [p[0] - c[0], p[1] - c[1]];
    const len = Math.hypot(v[0], v[1]);
    return [p[0] - (v[0] / len) * d, p[1] - (v[1] / len) * d];
  });
}

/** Triangular cells: a truss along the left leg plus the one under the neck. */
export function cells() {
  const P = (t, s) => {
    const p = lerp(innerEdge(t), outerEdge(t), s);
    return [-p[0], p[1]]; // left leg
  };
  const m = 0.16; // margin from the leg edges, as a share of its width
  const ts = [0.2, 0.38, 0.56, 0.74, 0.9];
  const out = [];
  for (let i = 0; i < ts.length - 1; i++) {
    const a = ts[i], b = ts[i + 1], mid = (a + b) / 2;
    const tri = i % 2 === 0
      ? [P(a, m), P(b, m), P(mid, 1 - m)]
      : [P(a, 1 - m), P(b, 1 - m), P(mid, m)];
    out.push(shrink(tri, 10));
  }
  out.push([[-34, 136], [34, 136], [0, 188]]);
  return out;
}

/** Recessed logo panel on the right leg: a band between the leg edges. */
export function panelOutline() {
  const P = (t, s) => lerp(innerEdge(t), outerEdge(t), s);
  const ts = sample((t) => 0.3 + t * 0.58, 8);
  return [...ts.map((t) => P(t, 0.16)), ...ts.reverse().map((t) => P(t, 0.84))];
}

/** Position and angle of the logo panel, for placing the wordmark on it. */
export function panelFrame() {
  const P = (t, s) => lerp(innerEdge(t), outerEdge(t), s);
  const a = P(0.36, 0.5), b = P(0.82, 0.5);
  return {
    center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
    length: Math.hypot(b[0] - a[0], b[1] - a[1]),
  };
}

// Camera framing shared by the 3D canvas and the SVG recess: vertical fov 30°,
// stand group dropped 1.32 units so it sits centred on the view axis.
export const FOV = 30;
export const STAND_DROP = 1.32;
const TAN = Math.tan((FOV / 2) * (Math.PI / 180));

/** Camera distance that fits the stand (6.2 × 2.7 units) with room around it. */
export function fitCameraZ(aspect) {
  const viewH = Math.max(2.7 / 0.62, 6.2 / 0.8 / aspect);
  return viewH / 2 / TAN;
}

/** Visible height at z = 0 for that distance, in photo pixels. */
export const viewHeightPx = (z) => 2 * z * TAN * 100;

/** Rounds every corner of a polygon; short segments get proportionally small radii. */
export function roundedPath(pts, radius, ops) {
  const n = pts.length;
  const corner = (i) => {
    const p = pts[i], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const d1 = Math.hypot(prev[0] - p[0], prev[1] - p[1]);
    const d2 = Math.hypot(next[0] - p[0], next[1] - p[1]);
    const r = Math.min(radius, d1 / 2, d2 / 2);
    return {
      a: [p[0] + ((prev[0] - p[0]) / d1) * r, p[1] + ((prev[1] - p[1]) / d1) * r],
      b: [p[0] + ((next[0] - p[0]) / d2) * r, p[1] + ((next[1] - p[1]) / d2) * r],
      p,
    };
  };
  const first = corner(0);
  ops.moveTo(first.b[0], first.b[1]);
  for (let i = 1; i <= n; i++) {
    const c = corner(i % n);
    ops.lineTo(c.a[0], c.a[1]);
    ops.quadraticCurveTo(c.p[0], c.p[1], c.b[0], c.b[1]);
  }
  ops.closePath();
}

/** Same rounding, as an SVG path string (y flipped for screen space). */
export function svgPath(pts, radius) {
  let d = '';
  const f = (n) => n.toFixed(1);
  roundedPath(pts, radius, {
    moveTo: (x, y) => (d += `M${f(x)} ${f(-y)}`),
    lineTo: (x, y) => (d += `L${f(x)} ${f(-y)}`),
    quadraticCurveTo: (cx, cy, x, y) => (d += `Q${f(cx)} ${f(-cy)} ${f(x)} ${f(-y)}`),
    closePath: () => (d += 'Z'),
  });
  return d;
}
