// Find the raised lettering on a recessed logo panel: faces inside the panel
// that stand above the panel floor and are not part of the panel's rim.
import { regions } from './regions.mjs';

export function logoMask(part, { sides = [1, -1], xmin = 40, minH = 0.25, maxH = 2.8 } = {}) {
  const p = part.positions, ix = part.indices, nT = ix.length / 3;
  const { reg, n, area, cen } = regions(p, ix, 20);
  const mask = new Uint8Array(nT);
  // edge adjacency
  const edges = new Map();
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) {
    const a = ix[t * 3 + k], b = ix[t * 3 + ((k + 1) % 3)];
    const key = a < b ? a * 1e6 + b : b * 1e6 + a;
    (edges.get(key) || edges.set(key, []).get(key)).push(t);
  }
  const nbr = Array.from({ length: nT }, () => []);
  for (const fs of edges.values()) for (const f of fs) for (const g of fs) if (f !== g) nbr[f].push(g);
  const info = [];
  for (const side of sides) {
    // floor: biggest smooth region facing `side` on the panel leg
    const R = new Map();
    for (let t = 0; t < nT; t++) {
      if (cen[t * 3] < xmin || n[t * 3 + 2] * side < 0.85) continue;
      R.set(reg[t], (R.get(reg[t]) || 0) + area[t]);
    }
    const floorId = [...R.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const floor = [];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let t = 0; t < nT; t++) if (reg[t] === floorId) {
      floor.push(t);
      for (let k = 0; k < 3; k++) { const v = ix[t * 3 + k] * 3; x0 = Math.min(x0, p[v]); x1 = Math.max(x1, p[v]); y0 = Math.min(y0, p[v + 1]); y1 = Math.max(y1, p[v + 1]); }
    }
    // height of a point above the floor: signed distance to the plane of the closest floor triangle (by centroid)
    const height = (x, y, z) => {
      let best = -1, bd = Infinity;
      for (const f of floor) { const d = (cen[f * 3] - x) ** 2 + (cen[f * 3 + 1] - y) ** 2; if (d < bd) { bd = d; best = f; } }
      return (x - cen[best * 3]) * n[best * 3] + (y - cen[best * 3 + 1]) * n[best * 3 + 1] + (z - cen[best * 3 + 2]) * n[best * 3 + 2];
    };
    // candidate faces: inside the floor's bbox, not floor, on this side of the part's mid plane
    // seeds: small smooth regions facing out, standing 1.5–2.8 above the floor (the letter tops)
    const RG = new Map();
    for (let t = 0; t < nT; t++) {
      if (cen[t * 3] < xmin || cen[t * 3] < x0 || cen[t * 3] > x1 || cen[t * 3 + 1] < y0 || cen[t * 3 + 1] > y1) continue;
      const e = RG.get(reg[t]) || { faces: [], a: 0, out: 0, h: 0 };
      e.faces.push(t); e.a += area[t]; e.out += n[t * 3 + 2] * side * area[t];
      e.h += height(cen[t * 3], cen[t * 3 + 1], cen[t * 3 + 2]) * area[t];
      RG.set(reg[t], e);
    }
    let letters = 0, letterArea = 0;
    const stack = [];
    for (const e of RG.values()) {
      const h = e.h / e.a, out = e.out / e.a;
      if (out < 0.85 || h < 1.4 || h > maxH || e.a > 120 || e.a < 0.5) continue;
      letters++;
      for (const f of e.faces) if (!mask[f]) { mask[f] = 1; letterArea += area[f]; stack.push(f); }
    }
    // grow down the letter walls: neighbours that don't face out and still stand above the floor
    while (stack.length) {
      const f = stack.pop();
      for (const g of nbr[f]) {
        if (mask[g] || n[g * 3 + 2] * side > 0.85) continue;
        if (height(cen[g * 3], cen[g * 3 + 1], cen[g * 3 + 2]) < minH) continue;
        mask[g] = 1; letterArea += area[g]; stack.push(g);
      }
    }
    info.push({ side, floorArea: R.get(floorId), letters, letterArea });
  }
  return { mask, info };
}
