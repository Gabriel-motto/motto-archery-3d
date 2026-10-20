// 3MF (Fusion 360 export, mm) → compact GLB for the hero, one node per printed
// body, each tagged with a colour role (glTF extras.role, read by Stand3D.jsx).
// Build transforms are applied, mm are scaled to scene units and the model is
// centred on cfg.origin; normals are recomputed with a crease angle so flat
// faces stay crisp; then meshopt-compressed and quantized.
//   node scripts/models/convert.mjs "<file>.3mf" public/models/motto-t.glb scripts/models/motto-t.json
import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, reorder, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { parse3mf } from './parse3mf.mjs';
import { creaseNormals } from './creased.mjs';
import { logoMask } from './logo.mjs';

const [, , src, out, cfgPath] = process.argv;
if (!cfgPath) throw new Error("usage: convert.mjs <in.3mf> <out.glb> <config.json>");
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const { parts } = parse3mf(src);

const K = cfg.scale; // mm → scene units
const [cx, cy, cz] = cfg.origin; // mm, becomes (0,0,0)

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene(cfg.name);
const mats = {};
const material = (role) =>
  (mats[role] ??= doc.createMaterial(role).setBaseColorFactor(cfg.roleColors?.[role] ?? [0.6, 0.6, 0.6, 1]).setRoughnessFactor(0.6).setMetallicFactor(role === 'metal' ? 1 : 0));

const report = [];
for (const [i, part] of parts.entries()) {
  const spec = cfg.parts[String(i)] ?? cfg.parts[part.id];
  if (!spec) throw new Error(`no spec for part #${i} (${part.name}, object ${part.id})`);
  if (spec.drop) {
    report.push(`  #${i} ${part.name} dropped (${spec.why})`);
    continue;
  }
  const pos = new Float64Array(part.positions.length);
  for (let j = 0; j < pos.length; j += 3) {
    pos[j] = (part.positions[j] - cx) * K;
    pos[j + 1] = (part.positions[j + 1] - cy) * K;
    pos[j + 2] = (part.positions[j + 2] - cz) * K;
  }
  // optional split of one body into sub-meshes by a face predicate (e.g. the raised lettering)
  const groups = [{ name: spec.name, role: spec.role, faces: null }];
  if (spec.logo) {
    // the raised lettering on the logo panel(s) becomes its own mesh, so it can take the accent colour
    const { mask, info } = logoMask(part, spec.logo);
    const inSplit = [], rest = [];
    for (let t = 0; t < part.indices.length / 3; t++) (mask[t] ? inSplit : rest).push(part.indices[t * 3], part.indices[t * 3 + 1], part.indices[t * 3 + 2]);
    groups[0].faces = rest;
    groups.push({ name: spec.logo.name, role: spec.logo.role, faces: inSplit });
    report.push('  logo ' + JSON.stringify(info));
  }
  for (const g of groups) {
    const idx = g.faces ? Uint32Array.from(g.faces) : part.indices;
    if (!idx.length) continue;
    const m = creaseNormals(pos, idx, cfg.crease ?? 40);
    const nV = m.positions.length / 3;
    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(m.positions).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(m.normals).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(nV < 65536 ? Uint16Array.from(m.indices) : m.indices).setBuffer(buffer))
      .setMaterial(material(g.role));
    const mesh = doc.createMesh(g.name).addPrimitive(prim);
    const node = doc.createNode(g.name).setMesh(mesh).setExtras({ role: g.role, source: part.name });
    scene.addChild(node);
    report.push(`  #${i} ${part.name.padEnd(9)} → ${g.name.padEnd(14)} role=${g.role.padEnd(6)} verts ${part.positions.length / 3} → ${nV}, tris ${m.indices.length / 3}`);
  }
}

await MeshoptEncoder.ready;
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await doc.transform(
  dedup(),
  prune(),
  reorder({ encoder: MeshoptEncoder, target: 'size' }),
  // 14-bit positions over a ~5.7 unit model ≈ 0.02 mm steps; 8-bit normals
  quantize({ quantizePosition: 14, quantizeNormal: 8 })
);
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await io.write(out, doc);
console.log(report.join('\n'));
console.log(`${out}: ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
