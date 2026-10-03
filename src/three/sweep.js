// The model switch, as a print head would do it: a glowing line sweeps up the
// stand; below it the new model is already "printed" (with faint layer lines
// right under the line), above it the old one is still there. Implemented by
// patching the standard materials: fragments on the wrong side of a slightly
// noisy world-space height are discarded, and the band at the line glows.
import * as THREE from 'three';

/** Uniforms shared by every material of one model. side: 0 whole, 1 keep above the line, -1 keep below. */
export const makeSweep = () => ({
  uCut: { value: 0 },
  uSide: { value: 0 },
  uEdge: { value: new THREE.Color('#ff3b1f') },
});

const HEADER = /* glsl */ `
varying vec3 vSweepPos;
uniform float uCut;
uniform float uSide;
uniform vec3 uEdge;
float sweepHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float sweepNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(sweepHash(i), sweepHash(i + vec3(1, 0, 0)), f.x), mix(sweepHash(i + vec3(0, 1, 0)), sweepHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(sweepHash(i + vec3(0, 0, 1)), sweepHash(i + vec3(1, 0, 1)), f.x), mix(sweepHash(i + vec3(0, 1, 1)), sweepHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}`;

const CUT = /* glsl */ `
  float sweepD = vSweepPos.y + (sweepNoise(vSweepPos * 7.0) - 0.5) * 0.16 - uCut;
  if (uSide > 0.5 && sweepD < 0.0) discard;
  if (uSide < -0.5 && sweepD > 0.0) discard;
  float sweepGlow = abs(uSide) > 0.5 ? 1.0 - smoothstep(0.0, 0.06, abs(sweepD)) : 0.0;
  float sweepLayers = uSide < -0.5 ? step(0.55, fract(vSweepPos.y * 60.0)) * (1.0 - smoothstep(0.0, 0.3, -sweepD)) * 0.4 : 0.0;
`;

export function applySweep(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSweepPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSweepPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    let frag = shader.fragmentShader.replace('#include <common>', `#include <common>\n${HEADER}`).replace('void main() {', `void main() {\n${CUT}`);
    frag = frag.includes('#include <emissivemap_fragment>')
      ? frag.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uEdge * (sweepGlow * 4.0 + sweepLayers);')
      : frag.replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb += uEdge * sweepGlow * 2.0;');
    shader.fragmentShader = frag;
  };
  material.customProgramCacheKey = () => `sweep-${material.type}`;
  return material;
}
