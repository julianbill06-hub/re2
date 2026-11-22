// Level -3: an underground car park built for the Liminal Found Footage look.
// Same lighting idea as the style's engine: thousands of tube lights in one float DataTexture, each fragment sums the 5×5
// nearest, no occlusion; fog follows the local light, so dead zones are holes in the light.
// Coordinates: metres; x east, z south (−z = forward along the drive lane), y up.
import * as THREE from 'three';
import { mulberry, hash } from '/core/lib.js';
import * as TX from './tex.js';

export const H = 2.6;                     // ceiling height
export const LX = 4.0, LZ = 5.0, LOX = 0.0, LOZ = 0.0;   // light grid
const LN = 128, LOFF = 64;

// ———— layout ————
export const PILLARS = [];                 // [x, z, label]
for (const x of [-16, -8, 8, 16]) for (let k = -2; k <= 12; k++) PILLARS.push([x, -k * 7.5 + 2.5, x < 0 ? 'C' + (k + 3) : 'D' + (k + 3)]);
export const RAMP = { x0: -3.2, x1: 3.2, z0: -46, z1: -62, drop: 2.8 };          // the ramp down, at the end of the lane
export const CORE = { x0: -14.5, x1: -10.5, z0: -27, z1: -20.5 };                 // stair core with the emergency exit
export const DOOR = { x: -10.5, z: -23.2, w: .95, h: 2.05 };
export const STAIR = { x0: 60, x1: 64, z0: -14, z1: 2, steps: 16, rise: .175, run: .3 };   // the stairwell, off the map
export const BARRIER = { z: 12, x: 3.2 };                                          // exit barrier; daylight beyond z ≈ 18
export const MIRROR = { p: new THREE.Vector3(-1.25, 2.22, 3.6), r: .34 };

// ———— light grid ————
export const lightData = new Float32Array(LN * LN * 4);
export const lightTex = new THREE.DataTexture(lightData, LN, LN, THREE.RGBAFormat, THREE.FloatType);
lightTex.magFilter = lightTex.minFilter = THREE.NearestFilter;
export const LIGHTS = [];
{
  const R = mulberry(311);
  for (let i = -LOFF; i < LOFF; i++) for (let j = -LOFF; j < LOFF; j++) {
    const x = LX * i + LOX, z = LZ * j + LOZ;
    const garage = Math.abs(x) <= 36 && z <= 16 && z >= -110, stair = x >= 58 && x <= 66 && z >= -16 && z <= 4;
    if (!garage && !stair) continue;
    const r = R();
    let kind = r < .05 ? 'dead' : r < .08 ? 'flicker' : 'ok';
    if (Math.abs(x) < 2.5 && z > -36 && z < 14) kind = 'ok';                        // the route is lit
    if (Math.abs(x) < 5 && z <= -36 && z > -47) kind = 'dead';                      // where he stands, at the top of the ramp
    if (Math.abs(x) < 7 && z < -64 && z > -76) kind = 'dead';                          // far end: dark where he stands
    if (Math.abs(x) < 9 && z <= -76 && z > -110) kind = R() < .3 ? 'dead' : 'dim';     // behind him a faint glow, so he is a hole in it
    if (z < -46 && z > -64 && Math.abs(x) < 4) kind = R() < .5 ? 'dim' : 'dead';    // over the ramp the lights give out
    if (x > 0 && x < 3 && z > 8 && z < 11) kind = 'dead';                              // behind you, at the start: the light over him is dead
    if (stair) kind = r < .2 ? 'flicker' : 'ok';
    const warm = (R() - .5) * .1, green = .04 + R() * .08;
    const base = kind === 'dead' ? 0 : kind === 'dim' ? .1 + R() * .1 : .8 + R() * .3;
    LIGHTS.push({ i, j, x, z, base, col: [1 + warm, 1 + green, .9 - warm], kind, ph: R() * 100, stair });
  }
}
export function updateLights(t, g = 1, extra = null) {
  lightData.fill(0);
  for (const L of LIGHTS) {
    let k = L.base;
    if (L.kind === 'flicker') { const s = Math.floor(t * 24 + L.ph), h1 = hash(s * 1.7 + L.ph), h2 = hash(Math.floor(t * 1.3 + L.ph)); k *= h2 < .35 ? (h1 < .5 ? .12 : .9) : 1; }
    if (extra) k *= extra(L, t);
    const o = ((L.j + LOFF) * LN + (L.i + LOFF)) * 4;
    lightData[o] = L.col[0] * k * g; lightData[o + 1] = L.col[1] * k * g; lightData[o + 2] = L.col[2] * k * g; lightData[o + 3] = 1;
  }
  lightTex.needsUpdate = true;
}

// ———— shaders ————
export const U = {
  uLights: { value: lightTex }, uAmb: { value: .14 }, uI: { value: 2.4 },
  uSign: { value: new THREE.Vector3(DOOR.x + .12, 2.3, DOOR.z) }, uSignI: { value: .5 },
  uSlit: { value: new THREE.Vector3(0, -100, 0) }, uSlitI: { value: 0 },
  uDay: { value: 0 },                                  // daylight from the exit (z > 18)
  uFogCol: { value: new THREE.Color(.15, .15, .11) }, uFogD: { value: .045 }, uFogG: { value: 1 },
  uTime: { value: 0 },
};
const VS = `varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;
const COMMON = `
uniform sampler2D uLights; uniform float uAmb, uI, uSignI, uSlitI, uDay, uFogD, uFogG, uTime; uniform vec3 uSign, uSlit, uFogCol;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int k = 0; k < 5; k++){ s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
void lightAt(vec3 P, vec3 N, vec3 V, float shin, out vec3 dif, out vec3 spc, out vec3 amb){
  dif = vec3(0); spc = vec3(0); amb = vec3(0);
  float gi = floor((P.x - ${LOX.toFixed(2)}) / ${LX.toFixed(2)} + .5), gj = floor((P.z - ${LOZ.toFixed(2)}) / ${LZ.toFixed(2)} + .5);
  for (int di = -2; di <= 2; di++) for (int dj = -2; dj <= 2; dj++) {
    float i = gi + float(di), j = gj + float(dj);
    vec4 L = texture2D(uLights, (vec2(i, j) + ${LOFF}.5) / ${LN}.);
    if (L.a < .5) continue;
    vec3 lp = vec3(i * ${LX.toFixed(2)} + ${LOX.toFixed(2)}, ${(H - .06).toFixed(2)}, j * ${LZ.toFixed(2)} + ${LOZ.toFixed(2)});
    if (lp.x > 50.) lp.y = 2.5 - clamp(floor((${(STAIR.z1 - 1.2).toFixed(2)} - lp.z) / ${STAIR.run.toFixed(2)}), 0., ${STAIR.steps.toFixed(1)}) * ${STAIR.rise.toFixed(3)};   // stairwell: each lamp hangs over its own step
    vec3 d = lp - P; float d2 = dot(d, d); vec3 l = d * inversesqrt(d2);
    float emit = .3 + .7 * max(l.y, 0.);
    dif += L.rgb * max(dot(N, l), 0.) * emit / (d2 + .4);
    if (shin > 0.) { vec3 hv = normalize(l + V); spc += L.rgb * pow(max(dot(N, hv), 0.), shin) * emit / (d2 + .4); }
    vec2 dh = d.xz; amb += L.rgb / (dot(dh, dh) + 4.);
  }
  dif *= uI; spc *= uI; amb *= uAmb;
  if (uSignI > 0.) { vec3 d = uSign - P; float d2 = dot(d, d); vec3 l = d * inversesqrt(d2); dif += vec3(.1, 1., .35) * uSignI * (max(dot(N, l), 0.) * .9 + .05) / (d2 + .15); }
  if (uSlitI > 0.) { vec3 d = uSlit - P; float d2 = dot(d, d); vec3 l = d * inversesqrt(d2); dif += vec3(.15, 1., .45) * uSlitI * (max(dot(N, l), 0.) * .9 + .05) / (d2 + .05); }
  if (uDay > 0.) { float k = smoothstep(4., 18., P.z); vec3 l = normalize(vec3(.15, .35, 1.)); dif += vec3(1.05, .95, .82) * uDay * k * (max(dot(N, l), 0.) * 1.2 + .35); amb += vec3(.5, .6, .75) * uDay * k * .5; }
}
vec3 fogA(vec3 c, vec3 P, vec3 a){ float d = length(P - cameraPosition); float f = 1. - exp(-d * uFogD);
  float k = clamp(dot(a, vec3(.333)) / (.2 * uAmb / .16), .12, 1.25) + uDay * smoothstep(0., 20., P.z) * 4.; return mix(c, uFogCol * uFogG * k, f); }
`;
const mat = (frag, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: VS, fragmentShader: COMMON + frag });

// concrete walls, pillars and beams: board marks, stains, painted bands; pillars carry their bay label and the level number
const WALL_FS = `
uniform sampler2D tLbl;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  float u = abs(N.x) > .5 ? vW.z : vW.x;
  vec3 alb = vec3(.56, .54, .49) * (.86 + .22 * fbm(vec2(u * 1.3, vW.y * 1.3) + 3.));
  alb *= .94 + .06 * step(.5, fract(vW.y / .9));                                        // formwork rows
  alb *= mix(vec3(1.), vec3(.72, .66, .55), smoothstep(.55, .8, fbm(vec2(u * .35, vW.y * .9))) * .7);  // water stains
  alb *= mix(vec3(1.), vec3(.6, .55, .45), smoothstep(.25, .0, vW.y) * .8);             // dirt at the foot
  if (vW.y > .9 && vW.y < 1.15) alb = mix(alb, vec3(.78, .63, .2), .85);                // the yellow band
  if (vW.y < .06) alb = vec3(.2, .19, .17);
  vec3 d, s, a; lightAt(vW + N * .03, N, V, 0., d, s, a);
  gl_FragColor = vec4(fogA(alb * (d + a), vW, a), 1.);
}`;
const PILLAR_FS = `
uniform sampler2D tLbl; uniform float nLbl;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  vec3 alb = vec3(.6, .58, .53) * (.86 + .22 * fbm(vW.xz * 2.3 + vW.y * 1.7));
  alb *= mix(vec3(1.), vec3(.62, .57, .47), smoothstep(.35, .0, vW.y) * .8);
  // hazard stripes at the foot
  if (vW.y < .7) { float s = step(.5, fract((vW.x + vW.z + vW.y) * 2.6)); alb = mix(vec3(.85, .68, .12), vec3(.08, .07, .06), s) * (.8 + .2 * fbm(vW.xz * 9.)); }
  // the label panel (uv set per face in the geometry)
  if (vUv.x >= 0.) { vec4 L = texture2D(tLbl, vUv); alb = mix(alb, L.rgb, L.a); }
  vec3 d, s, a; lightAt(vW + N * .03, N, V, 0., d, s, a);
  gl_FragColor = vec4(fogA(alb * (d + a), vW, a), 1.);
}`;
// floor: worn concrete, oil stains, bay lines, a yellow dashed centre line, painted arrows
const FLOOR_FS = `
uniform float rampX0, rampX1, rampZ0, rampZ1;
void main(){
  vec3 N = vec3(0, 1, 0); vec3 V = normalize(cameraPosition - vW);
  if (vW.x > rampX0 && vW.x < rampX1 && vW.z < rampZ0 && vW.z > rampZ1) discard;
  vec3 alb = vec3(.45, .44, .41) * (.82 + .3 * fbm(vW.xz * .7));
  alb *= .9 + .15 * fbm(vW.xz * 6.);
  alb *= 1. - .45 * smoothstep(.62, .75, fbm(vW.xz * .9 + 7.)) * step(3.4, abs(vW.x));     // oil under the cars that left
  alb *= 1. - .15 * smoothstep(.55, .7, fbm(vW.xz * 2.1 + 31.));
  // bay lines: every 2.5 m, from |x| 3.4 to 8.2 and 8.6 to 15.6
  float ax = abs(vW.x);
  bool bay = (ax > 3.4 && ax < 7.6) || (ax > 8.6 && ax < 15.4);
  float bl = abs(fract((vW.z + 1.25) / 2.5) - .5) * 2.5;
  float wear = .6 + .4 * vn(vW.xz * 3.);
  if (bay && bl < .06) alb = mix(alb, vec3(.86, .85, .8), .85 * wear);
  if (abs(ax - 3.4) < .05 && vW.z < 12.) alb = mix(alb, vec3(.86, .85, .8), .8 * wear);
  // centre line: yellow, dashed
  if (abs(vW.x) < .06 && fract(vW.z / 3.) < .55 && vW.z < 12.) alb = mix(alb, vec3(.82, .64, .16), .85 * wear);
  vec3 d, s, a; lightAt(vW, N, V, 30., d, s, a);
  vec3 c = alb * (d + a * .8) + s * .05 * vec3(1., .97, .9);
  gl_FragColor = vec4(fogA(c, vW, a), 1.);
}`;
const CEIL_FS = `
void main(){
  vec3 N = vec3(0, -1, 0); vec3 V = normalize(cameraPosition - vW);
  vec3 alb = vec3(.5, .49, .46) * (.8 + .3 * fbm(vW.xz * .8));
  alb *= mix(vec3(1.), vec3(.7, .63, .5), smoothstep(.6, .78, fbm(vW.xz * .5 + 9.)) * .8);     // leak stains
  // conduit and sprinkler pipe along the lane
  if (abs(vW.x - 1.1) < .04 || abs(vW.x + 2.3) < .025) alb = vec3(.62, .6, .55);
  vec3 d, s, a; lightAt(vW - vec3(0, .08, 0), N, V, 0., d, s, a);
  gl_FragColor = vec4(fogA(alb * (d * .5 + a * 1.1), vW, a), 1.);
}`;
const TUBE_FS = `
uniform float uEmit;
void main(){
  vec2 cell = vec2(floor((vW.x - ${LOX.toFixed(2)}) / ${LX.toFixed(2)} + .5), floor((vW.z - ${LOZ.toFixed(2)}) / ${LZ.toFixed(2)} + .5));
  vec4 L = texture2D(uLights, (cell + ${LOFF}.5) / ${LN}.);
  float core = smoothstep(.5, .0, abs(vUv.y - .5)) * smoothstep(0., .05, vUv.x) * smoothstep(1., .95, vUv.x);
  vec3 c = mix(vec3(.12, .12, .11) * (L.rgb * .3 + .03), L.rgb * uEmit, core);
  float d = length(vW - cameraPosition); c = mix(c, uFogCol * uFogG * .3, 1. - exp(-d * uFogD * .6));
  gl_FragColor = vec4(c, 1.);
}`;
const PAINT_FS = `
uniform sampler2D map; uniform vec3 color; uniform float useMap, shin, spec, emit, alphaTest;
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N; vec3 V = normalize(cameraPosition - vW);
  vec4 tx = useMap > .5 ? texture2D(map, vUv) : vec4(1.);
  if (tx.a < alphaTest) discard;
  vec3 alb = color * tx.rgb;
  vec3 d, s, a; lightAt(vW + N * .02, N, V, shin, d, s, a);
  vec3 c = alb * (d + a) + s * spec + alb * emit;
  gl_FragColor = vec4(fogA(c, vW, a), 1.);
}`;
export function paint(o = {}) {
  const m = mat(PAINT_FS, { map: { value: o.map || null }, color: { value: new THREE.Color(o.color ?? '#ffffff') }, useMap: { value: o.map ? 1 : 0 },
    shin: { value: o.shin ?? 0 }, spec: { value: o.spec ?? 0 }, emit: { value: o.emit ?? 0 }, alphaTest: { value: o.alphaTest ?? 0 } });
  if (o.side) m.side = o.side;
  return m;
}
// an unlit glowing material (signs, the slit, the daylight)
export function glow(color, k = 1, map = null) {
  return new THREE.ShaderMaterial({ toneMapped: false, uniforms: { c: { value: new THREE.Color(color).multiplyScalar(k) }, map: { value: map }, useMap: { value: map ? 1 : 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform vec3 c; uniform sampler2D map; uniform float useMap; varying vec2 vUv; void main(){ vec4 t = useMap > .5 ? texture2D(map, vUv) : vec4(1.); gl_FragColor = vec4(c * t.rgb, 1.); }` });
}

// ———— geometry helpers ————
function boxInto(acc, x0, y0, z0, x1, y1, z1, uvFn = null) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const ni = g.toNonIndexed(); const p = ni.attributes.position.array, n = ni.attributes.normal.array, u = ni.attributes.uv.array;
  acc.p.push(...p); acc.n.push(...n);
  for (let k = 0; k < u.length / 2; k++) { if (uvFn) { const r = uvFn(k, p.slice(k * 3, k * 3 + 3), n.slice(k * 3, k * 3 + 3), u[k * 2], u[k * 2 + 1]); acc.u.push(r[0], r[1]); } else acc.u.push(-1, -1); }
}
function merged(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.u, 2));
  return g;
}

export function buildWorld(scene) {
  const out = {};
  // walls: perimeter, ramp walls, stair core, the stairwell box, exit wall with its opening
  const W = { p: [], n: [], u: [] };
  boxInto(W, -38, 0, -112, -37.6, H, 20); boxInto(W, 37.6, 0, -112, 38, H, 20); boxInto(W, -38, 0, -112.4, 38, H, -112);
  boxInto(W, -38, 0, 19.8, -4.5, H, 20.2); boxInto(W, 4.5, 0, 19.8, 38, H, 20.2); boxInto(W, -4.5, 2.35, 19.8, 4.5, H, 20.2);
  boxInto(W, RAMP.x0 - .2, -RAMP.drop, RAMP.z1, RAMP.x0, H, RAMP.z0); boxInto(W, RAMP.x1, -RAMP.drop, RAMP.z1, RAMP.x1 + .2, H, RAMP.z0);
  boxInto(W, RAMP.x0, -RAMP.drop, RAMP.z1 - .2, RAMP.x1, H, RAMP.z1);
  // stair core (door opening on its east face)
  boxInto(W, CORE.x0, 0, CORE.z0, CORE.x1, H, CORE.z0 + .2); boxInto(W, CORE.x0, 0, CORE.z1 - .2, CORE.x1, H, CORE.z1); boxInto(W, CORE.x0, 0, CORE.z0, CORE.x0 + .2, H, CORE.z1);
  boxInto(W, CORE.x1 - .2, 0, CORE.z0, CORE.x1, H, DOOR.z - DOOR.w / 2); boxInto(W, CORE.x1 - .2, 0, DOOR.z + DOOR.w / 2, CORE.x1, H, CORE.z1);
  boxInto(W, CORE.x1 - .2, DOOR.h, DOOR.z - DOOR.w / 2, CORE.x1, H, DOOR.z + DOOR.w / 2);
  // ceiling beams across the lane every 7.5 m
  for (let k = -2; k <= 14; k++) { const z = -k * 7.5 + 6.25; boxInto(W, -37.6, H - .42, z - .2, 37.6, H, z + .2); }
  // stairwell: a tall shaft, the stairs go down along −z
  const S = STAIR;
  boxInto(W, S.x0 - .2, -4, S.z0, S.x0, H + 1, S.z1); boxInto(W, S.x1, -4, S.z0, S.x1 + .2, H + 1, S.z1);
  boxInto(W, S.x0 + 1.6, -4, S.z0 + 1.5, S.x0 + 1.8, H + 1, S.z1 - 1.2);                    // the inner wall: one narrow flight boxInto(W, S.x0, -4, S.z0 - .2, S.x1, H + 1, S.z0); boxInto(W, S.x0, -4, S.z1, S.x1, H + 1, S.z1 + .2);
  out.walls = new THREE.Mesh(merged(W), mat(WALL_FS)); scene.add(out.walls);
  // pillars with labels (one canvas atlas of labels)
  const atlas = TX.pillarAtlas(PILLARS.map(p => p[2]));
  const L = { p: [], n: [], u: [] };
  PILLARS.forEach(([x, z], idx) => {
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cx = x + nx * .302, cz = z + nz * .302;
      const g = new THREE.PlaneGeometry(.56, .95); g.rotateY(Math.atan2(nx, nz)); g.translate(cx, 1.72, cz);
      const ni = g.toNonIndexed(); L.p.push(...ni.attributes.position.array); L.n.push(...ni.attributes.normal.array);
      const uu = ni.attributes.uv.array; for (let k = 0; k < uu.length / 2; k++) { const r = atlas.uv(idx, uu[k * 2], uu[k * 2 + 1]); L.u.push(r[0], r[1]); }
    }
  });
  const pillarsAcc = { p: [], n: [], u: [] };
  PILLARS.forEach(([x, z]) => boxInto(pillarsAcc, x - .3, 0, z - .3, x + .3, H, z + .3));
  out.pillars = new THREE.Mesh(merged(pillarsAcc), mat(PILLAR_FS, { tLbl: { value: atlas.tex }, nLbl: { value: PILLARS.length } })); scene.add(out.pillars);
  out.labels = new THREE.Mesh(merged(L), paint({ map: atlas.tex, alphaTest: .5 })); scene.add(out.labels);
  // floor (with a hole for the ramp), the ramp, the ceiling
  const fm = mat(FLOOR_FS, { rampX0: { value: RAMP.x0 }, rampX1: { value: RAMP.x1 }, rampZ0: { value: RAMP.z0 }, rampZ1: { value: RAMP.z1 } });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(76, 134), fm); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -46); scene.add(floor);
  const rl = Math.hypot(RAMP.z0 - RAMP.z1, RAMP.drop);
  const ramp = new THREE.Mesh(new THREE.PlaneGeometry(RAMP.x1 - RAMP.x0, rl), paint({ color: '#6c6a62' }));
  ramp.rotation.x = -Math.PI / 2 - Math.atan2(RAMP.drop, RAMP.z0 - RAMP.z1); ramp.position.set(0, -RAMP.drop / 2, (RAMP.z0 + RAMP.z1) / 2); scene.add(ramp);
  const rfloor = new THREE.Mesh(new THREE.PlaneGeometry(RAMP.x1 - RAMP.x0, 6), paint({ color: '#5a5850' })); rfloor.rotation.x = -Math.PI / 2; rfloor.position.set(0, -RAMP.drop, RAMP.z1 + 3); scene.add(rfloor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(76, 134), mat(CEIL_FS)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -46); scene.add(ceil);
  // tube battens (one merged mesh): 1.5 m tubes in a shallow housing
  const tp = [], tn = [], tu = [];
  for (const Lt of LIGHTS) {
    const x0 = Lt.x - .06, x1 = Lt.x + .06, z0 = Lt.z - .75, z1 = Lt.z + .75, y = (Lt.stair ? H + .9 : H - .42) - .004;
    tp.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z0, x1, y, z1, x0, y, z1); for (let k = 0; k < 6; k++) tn.push(0, -1, 0);
    tu.push(0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0);
  }
  const tubeMat = mat(TUBE_FS, { uEmit: { value: 4.0 } });
  const tubes = new THREE.Mesh(merged({ p: tp, n: tn, u: tu }), tubeMat); scene.add(tubes);
  out.tubeMat = tubeMat;
  // stairwell steps, landing, handrail
  {
    const A = { p: [], n: [], u: [] };
    for (let k = 0; k < S.steps; k++) { const z = S.z1 - 1.2 - k * S.run, y = -k * S.rise; boxInto(A, S.x0, y - S.rise - .3, z - S.run, S.x0 + 1.6, y, z); }
    boxInto(A, S.x0, -.3, S.z1 - 1.2, S.x1, 0, S.z1);                                              // top landing
    const yb = -S.steps * S.rise; boxInto(A, S.x0, yb - .3, S.z0, S.x1, yb, S.z1 - 1.2 - S.steps * S.run); // bottom landing
    out.stairs = new THREE.Mesh(merged(A), paint({ color: '#9a978c' })); scene.add(out.stairs);
    const N = { p: [], n: [], u: [] };                                                                  // yellow nosing strip on every step
    for (let k = 0; k < S.steps; k++) { const z = S.z1 - 1.2 - k * S.run, y = -k * S.rise; boxInto(N, S.x0, y - .004, z - .1, S.x0 + 1.6, y + .008, z); }
    scene.add(new THREE.Mesh(merged(N), paint({ color: '#d9b03c', emit: .9 })));
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, Math.hypot(S.steps * S.run, S.steps * S.rise), 8), paint({ color: '#3d6b45', shin: 40, spec: .2 }));
    rail.position.set(S.x0 + .25, .9 - S.steps * S.rise / 2, S.z1 - 1.2 - S.steps * S.run / 2); rail.rotation.x = Math.PI / 2 - Math.atan2(S.steps * S.rise, S.steps * S.run); scene.add(rail);
  }
  return out;
}

// ———— props ————
export function buildProps(scene) {
  const P = {};
  // big level signs: hanging over the lane and painted on the ramp wall
  const sign = TX.levelSign();
  for (const z of [-14]) {
    const g = new THREE.Group(); g.position.set(0, H - .62, z);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(1.9, .5, .06), paint({ color: '#1d2a20' })); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.84, .44), paint({ map: sign, emit: .35 })); f.position.z = .031;
    const f2 = f.clone(); f2.rotation.y = Math.PI; f2.position.z = -.031; g.add(bx, f, f2);
    for (const sx of [-.8, .8]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .42, 6), paint({ color: '#555' })); r.position.set(sx, .46, 0); g.add(r); }
    scene.add(g); P['sign' + z] = g;
  }
  // the green EXIT sign and the steel door on the stair core (door hinged on its north side, opens into the core)
  {
    const g = new THREE.Group(); g.position.set(DOOR.x + .02, 2.3, DOOR.z); g.rotation.y = Math.PI / 2;
    const bx = new THREE.Mesh(new THREE.BoxGeometry(.42, .2, .07), paint({ color: '#d9d4c4' })); bx.position.z = .035;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(.38, .17), glow('#ffffff', 3.2, TX.exitSign())); face.position.z = .071; g.add(bx, face); scene.add(g);
    const pivot = new THREE.Group(); pivot.position.set(DOOR.x - .1, 0, DOOR.z - DOOR.w / 2);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.05, DOOR.h - .01, DOOR.w - .02), paint({ color: '#4f6a58', shin: 30, spec: .08 })); door.position.set(0, DOOR.h / 2, (DOOR.w - .02) / 2); pivot.add(door);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, .62), paint({ color: '#b9b4a6', shin: 60, spec: .4 })); bar.position.set(.05, 1.0, .5); pivot.add(bar);
    const note = new THREE.Mesh(new THREE.PlaneGeometry(.21, .28), paint({ map: TX.doorNote() })); note.rotation.y = Math.PI / 2; note.position.set(.027, 1.45, .48); pivot.add(note);
    scene.add(pivot); P.door = pivot;
    // the same door at the top of the stairwell (seen from inside) and at its bottom
    for (const [z, y] of [[STAIR.z1 - .05, 0], [STAIR.z0 + .05, -STAIR.steps * STAIR.rise]]) {
      const dg = new THREE.Group(); dg.position.set(STAIR.x0 + 2.8, y, z);
      const d = new THREE.Mesh(new THREE.BoxGeometry(DOOR.w, DOOR.h, .05), paint({ color: '#4f6a58', shin: 30, spec: .08 })); d.position.y = DOOR.h / 2; dg.add(d);
      const eg = new THREE.Mesh(new THREE.PlaneGeometry(.38, .17), glow('#ffffff', 3.2, TX.exitSign())); eg.position.set(0, 2.3, z > STAIR.z0 + 1 ? -.04 : .04); eg.rotation.y = z > STAIR.z0 + 1 ? Math.PI : 0; dg.add(eg);
      const lvl = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), paint({ map: TX.stairLevel(z > STAIR.z0 + 1 ? '-3' : '-3') })); lvl.position.set(-1.0, 1.55, z > STAIR.z0 + 1 ? -.04 : .04); lvl.rotation.y = z > STAIR.z0 + 1 ? Math.PI : 0; dg.add(lvl);
      scene.add(dg); P[z > STAIR.z0 + 1 ? 'stTop' : 'stBot'] = dg; P[(z > STAIR.z0 + 1 ? 'stTop' : 'stBot') + 'Door'] = d;
    }
  }
  // convex traffic mirror on a bracket
  {
    const g = new THREE.Group(); g.position.copy(MIRROR.p);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(MIRROR.r + .015, .03, 10, 48), paint({ color: '#d8501f', shin: 20, spec: .1 }));
    const back = new THREE.Mesh(new THREE.CircleGeometry(MIRROR.r + .02, 48), paint({ color: '#2b2b2b' })); back.position.z = -.03;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .6, 8), paint({ color: '#666' })); arm.position.set(0, .5, -.12);
    g.add(rim, back, arm); g.lookAt(new THREE.Vector3(.4, 1.5, 6.2)); scene.add(g); P.mirror = g;
  }
  // exit barrier: booth, arm, and the daylight beyond the opening
  {
    const booth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.4), paint({ color: '#8d8a80' })); booth.position.set(BARRIER.x + 1.1, 1.1, BARRIER.z); scene.add(booth);
    const post = new THREE.Mesh(new THREE.BoxGeometry(.3, 1.0, .3), paint({ color: '#c9a640' })); post.position.set(BARRIER.x + .2, .5, BARRIER.z); scene.add(post);
    const pivot = new THREE.Group(); pivot.position.set(BARRIER.x + .2, .95, BARRIER.z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(6.2, .09, .07), paint({ map: TX.stripes(), color: '#ffffff' })); arm.position.x = -3.1; pivot.add(arm); scene.add(pivot); P.barrier = pivot;
    const day = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.35), glow('#fff4dc', 2.2)); day.position.set(0, 1.175, 20.5); day.rotation.y = Math.PI; scene.add(day); P.day = day;
    // a car passing outside, a figure on the pavement (dark against the light)
    const car = new THREE.Group(); const cb = new THREE.Mesh(new THREE.BoxGeometry(4.2, .8, 1.8), paint({ color: '#2c3440' })); cb.position.y = .55; const ct = new THREE.Mesh(new THREE.BoxGeometry(2.2, .6, 1.6), paint({ color: '#222831' })); ct.position.set(-.3, 1.2, 0); car.add(cb, ct);
    car.position.set(-12, 0, 21.5); scene.add(car); P.car = car;
  }
  // the ticket
  {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(.085, .16), paint({ map: TX.ticket(), side: THREE.DoubleSide })); t.visible = false; scene.add(t); P.ticket = t;
  }
  return P;
}
