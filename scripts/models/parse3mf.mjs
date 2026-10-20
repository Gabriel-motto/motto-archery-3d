// Minimal, data-only 3MF model parser: reads <object><mesh> vertices/triangles,
// <component> refs and <build><item transform>. No code from the file is executed.
import fs from 'node:fs';
import zlib from 'node:zlib';

/** Reads one entry of a zip archive (stored or deflated) without extracting anything to disk. */
function readZipEntry(buf, wanted) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip file');
  let count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  if (off === 0xffffffff || count === 0xffff) {
    // ZIP64: the real values live in the zip64 end-of-central-directory record
    if (buf.readUInt32LE(eocd - 20) !== 0x07064b50) throw new Error('bad zip64 locator');
    const z = Number(buf.readBigUInt64LE(eocd - 12));
    if (buf.readUInt32LE(z) !== 0x06064b50) throw new Error('bad zip64 record');
    count = Number(buf.readBigUInt64LE(z + 32));
    off = Number(buf.readBigUInt64LE(z + 48));
  }
  for (let k = 0; k < count; k++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('bad zip directory');
    const method = buf.readUInt16LE(off + 10);
    const nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), commentLen = buf.readUInt16LE(off + 32);
    let size = buf.readUInt32LE(off + 20), usize = buf.readUInt32LE(off + 24), local = buf.readUInt32LE(off + 42);
    // ZIP64 extra field (id 1): the 64-bit values of whichever fields are 0xffffffff, in this order
    for (let e = off + 46 + nameLen; e < off + 46 + nameLen + extraLen; ) {
      const id = buf.readUInt16LE(e), len = buf.readUInt16LE(e + 2);
      if (id === 1) {
        let q = e + 4;
        if (usize === 0xffffffff) { usize = Number(buf.readBigUInt64LE(q)); q += 8; }
        if (size === 0xffffffff) { size = Number(buf.readBigUInt64LE(q)); q += 8; }
        if (local === 0xffffffff) { local = Number(buf.readBigUInt64LE(q)); q += 8; }
      }
      e += 4 + len;
    }
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (name.toLowerCase() === wanted.toLowerCase()) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error('unsupported zip method ' + method);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(wanted + ' not found in archive');
}

function parseTransform(s) {
  // 3MF: 12 numbers m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32 (row-vector convention)
  if (!s) return null;
  const a = s.trim().split(/\s+/).map(Number);
  if (a.length !== 12 || a.some((n) => !Number.isFinite(n))) throw new Error('bad transform ' + s);
  return a;
}
const applyT = (t, x, y, z) =>
  t ? [x * t[0] + y * t[3] + z * t[6] + t[9], x * t[1] + y * t[4] + z * t[7] + t[10], x * t[2] + y * t[5] + z * t[8] + t[11]] : [x, y, z];
const mulT = (a, b) => {
  // apply a then b
  if (!a) return b;
  if (!b) return a;
  const r = new Array(12);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  const o = applyT(b, a[9], a[10], a[11]);
  r[9] = o[0]; r[10] = o[1]; r[11] = o[2];
  return r;
};

/** Parses a .3mf archive (or an already extracted 3D/3dmodel.model). Data only: nothing in the file is executed. */
export function parse3mf(path) {
  const raw = fs.readFileSync(path);
  const xml = (raw.readUInt32LE(0) === 0x04034b50 ? readZipEntry(raw, '3D/3dmodel.model') : raw).toString('utf8');
  const unit = (xml.match(/<model[^>]*\sunit="([^"]+)"/) || [])[1] || 'millimeter';
  const objects = new Map();
  const objRe = /<object\b([^>]*)>([\s\S]*?)<\/object>/g;
  let m;
  while ((m = objRe.exec(xml))) {
    const attrs = m[1];
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    const name = (attrs.match(/\bname="([^"]*)"/) || [])[1] || `obj${id}`;
    const body = m[2];
    const verts = [];
    const vRe = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/g;
    let v;
    while ((v = vRe.exec(body))) verts.push(+v[1], +v[2], +v[3]);
    const tris = [];
    const tRe = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"/g;
    let t;
    while ((t = tRe.exec(body))) tris.push(+t[1], +t[2], +t[3]);
    const comps = [];
    const cRe = /<component\b([^>]*)\/?>/g;
    let c;
    while ((c = cRe.exec(body))) {
      comps.push({ objectid: (c[1].match(/objectid="([^"]+)"/) || [])[1], transform: parseTransform((c[1].match(/transform="([^"]+)"/) || [])[1]) });
    }
    if (verts.some((n) => !Number.isFinite(n))) throw new Error('bad vertex in ' + name);
    const nv = verts.length / 3;
    if (tris.some((i) => i >= nv)) throw new Error('bad index in ' + name);
    objects.set(id, { id, name, verts: Float64Array.from(verts), tris: Uint32Array.from(tris), comps });
  }
  const items = [];
  const buildBody = (xml.match(/<build\b[^>]*>([\s\S]*?)<\/build>/) || [])[1] || '';
  const iRe = /<item\b([^>]*)\/?>/g;
  let it;
  while ((it = iRe.exec(buildBody))) items.push({ objectid: (it[1].match(/objectid="([^"]+)"/) || [])[1], transform: parseTransform((it[1].match(/transform="([^"]+)"/) || [])[1]) });

  // flatten build items → list of {name, positions (Float32 world mm), indices}
  const out = [];
  const visit = (oid, T, depth) => {
    if (depth > 8) throw new Error('component nesting too deep');
    const o = objects.get(oid);
    if (!o) throw new Error('missing object ' + oid);
    if (o.tris.length) {
      const pos = new Float64Array(o.verts.length);
      for (let i = 0; i < o.verts.length; i += 3) {
        const p = applyT(T, o.verts[i], o.verts[i + 1], o.verts[i + 2]);
        pos[i] = p[0]; pos[i + 1] = p[1]; pos[i + 2] = p[2];
      }
      out.push({ name: o.name, id: o.id, positions: pos, indices: o.tris });
    }
    for (const c of o.comps) visit(c.objectid, mulT(c.transform, T), depth + 1);
  };
  for (const i of items) visit(i.objectid, i.transform, 0);
  return { unit, parts: out };
}

export function stats(part) {
  const p = part.positions, ix = part.indices;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[i + k]); max[k] = Math.max(max[k], p[i + k]); }
  let vol = 0, area = 0;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    const ax = p[a], ay = p[a + 1], az = p[a + 2], bx = p[b], by = p[b + 1], bz = p[b + 2], cx = p[c], cy = p[c + 1], cz = p[c + 2];
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    area += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return { verts: p.length / 3, tris: ix.length / 3, min, max, size: max.map((v, k) => v - min[k]), vol, area };
}

