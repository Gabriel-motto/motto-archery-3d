// Smooth regions of a triangle mesh: faces joined across edges whose dihedral angle is under `deg`.
export function faceNormals(p, ix) {
  const n = new Float64Array(ix.length), area = new Float64Array(ix.length / 3), cen = new Float64Array(ix.length);
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3;
    const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
    const x = u[1] * v[2] - u[2] * v[1], y = u[2] * v[0] - u[0] * v[2], z = u[0] * v[1] - u[1] * v[0];
    const l = Math.hypot(x, y, z) || 1;
    n[t] = x / l; n[t + 1] = y / l; n[t + 2] = z / l; area[t / 3] = l / 2;
    for (let k = 0; k < 3; k++) cen[t + k] = (p[a + k] + p[b + k] + p[c + k]) / 3;
  }
  return { n, area, cen };
}
export function regions(p, ix, deg = 20) {
  const { n, area, cen } = faceNormals(p, ix);
  const nT = ix.length / 3, edges = new Map();
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) {
    const a = ix[t * 3 + k], b = ix[t * 3 + (k + 1) % 3]; const key = a < b ? a + ',' + b : b + ',' + a;
    (edges.get(key) || edges.set(key, []).get(key)).push(t);
  }
  const parent = Int32Array.from({ length: nT }, (_, i) => i);
  const find = (i) => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  const cosT = Math.cos(deg * Math.PI / 180);
  for (const fs of edges.values()) if (fs.length === 2) {
    const [f, g] = fs; if (n[f*3]*n[g*3]+n[f*3+1]*n[g*3+1]+n[f*3+2]*n[g*3+2] >= cosT) parent[find(f)] = find(g);
  }
  const reg = new Int32Array(nT); for (let t = 0; t < nT; t++) reg[t] = find(t);
  return { reg, n, area, cen };
}
