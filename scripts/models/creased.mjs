// Split an indexed triangle mesh along creases and give every corner an
// angle-weighted smooth normal from the faces around its vertex that are within
// `creaseDeg` of its own face. Returns a new indexed mesh (positions, normals, indices).
export function creaseNormals(positions, indices, creaseDeg = 40) {
  const nT = indices.length / 3;
  const fn = new Float64Array(nT * 3);
  const ang = new Float64Array(nT * 3); // corner angles
  const P = (i) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const keep = new Uint8Array(nT);
  for (let t = 0; t < nT; t++) {
    const a = P(indices[t * 3]), b = P(indices[t * 3 + 1]), c = P(indices[t * 3 + 2]);
    const u = sub(b, a), v = sub(c, a);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = len(n);
    if (l < 1e-12) continue; // degenerate: drop
    keep[t] = 1;
    fn[t * 3] = n[0] / l; fn[t * 3 + 1] = n[1] / l; fn[t * 3 + 2] = n[2] / l;
    const corners = [[a, b, c], [b, c, a], [c, a, b]];
    for (let k = 0; k < 3; k++) {
      const [p, q, r] = corners[k];
      const e1 = sub(q, p), e2 = sub(r, p);
      ang[t * 3 + k] = Math.acos(Math.max(-1, Math.min(1, dot(e1, e2) / (len(e1) * len(e2) || 1))));
    }
  }
  const nV = positions.length / 3;
  const vf = Array.from({ length: nV }, () => []);
  for (let t = 0; t < nT; t++) if (keep[t]) for (let k = 0; k < 3; k++) vf[indices[t * 3 + k]].push(t * 3 + k);
  const cosC = Math.cos((creaseDeg * Math.PI) / 180);
  const outP = [], outN = [], outI = [];
  const map = new Map();
  for (let t = 0; t < nT; t++) {
    if (!keep[t]) continue;
    for (let k = 0; k < 3; k++) {
      const vi = indices[t * 3 + k];
      let nx = 0, ny = 0, nz = 0;
      for (const ck of vf[vi]) {
        const f = (ck / 3) | 0;
        const d = fn[t * 3] * fn[f * 3] + fn[t * 3 + 1] * fn[f * 3 + 1] + fn[t * 3 + 2] * fn[f * 3 + 2];
        if (d < cosC) continue;
        const w = ang[ck];
        nx += fn[f * 3] * w; ny += fn[f * 3 + 1] * w; nz += fn[f * 3 + 2] * w;
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      const key = `${vi}|${Math.round(nx * 1000)}|${Math.round(ny * 1000)}|${Math.round(nz * 1000)}`;
      let id = map.get(key);
      if (id === undefined) {
        id = outP.length / 3;
        map.set(key, id);
        outP.push(positions[vi * 3], positions[vi * 3 + 1], positions[vi * 3 + 2]);
        outN.push(nx, ny, nz);
      }
      outI.push(id);
    }
  }
  return { positions: Float32Array.from(outP), normals: Float32Array.from(outN), indices: Uint32Array.from(outI) };
}
