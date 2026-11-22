// Level -3 — Final Call Stories ep. 3, in the Liminal Found Footage look.
// three.js scene (720×540, 4:3) → depth of field (autofocus) + bloom → VHS camcorder pass → the 4:3 band in a 1080×1920 frame; overlay: hook, chips, captions, end card
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { clamp, seg, ss, lerp, hash, vnoise, env } from '/core/lib.js';
import { DUR, SEGS, segAt, T, figure, FEAR, HOLD, clock } from './story.js';
import { buildWorld, buildProps, updateLights, U, MIRROR, DOOR, STAIR, BARRIER } from './world.js';
import { makeShoes, makeHand, makeAttendant } from './figures.js';
import { VHS } from './vhs.js';
import { drawOSD } from './osd.js';

const Q = new URLSearchParams(location.search), NOSUB = Q.has('nosub');
for (const f of ["700 30px 'IBM Plex Sans Condensed'", "600 30px 'IBM Plex Sans Condensed'", "600 30px 'IBM Plex Mono'", "700 30px 'IBM Plex Mono'", "500 30px 'IBM Plex Mono'"]) await document.fonts.load(f);
const W = 1080, H = 1920, SW = 720, SH = 540, BAND = [(H - W * .75) / 2, (H + W * .75) / 2];   // the tape band: y 555 → 1365

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .9;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0, 0, 0);
const camera = new THREE.PerspectiveCamera(40, 4 / 3, .03, 180); camera.rotation.order = 'YXZ'; scene.add(camera);
const post = makePost(renderer, scene, camera, SW, SH, { ssaa: 1, ao: false });
post.bloom.strength = .55; post.bloom.radius = .55; post.bloom.threshold = 1.05;
post.vig.uniforms.amt.value = 0; post.vig.uniforms.contrast.value = 0; post.vig.uniforms.sat.value = 1;
post.dof.maxCoc = 12;
const osdCv = document.createElement('canvas'); osdCv.width = SW; osdCv.height = SH;
const osdTex = new THREE.CanvasTexture(osdCv); osdTex.minFilter = osdTex.magFilter = THREE.LinearFilter; osdTex.generateMipmaps = false;
const vhs = new ShaderPass(VHS); vhs.uniforms.tOSD.value = osdTex; vhs.uniforms.res.value = [W, H]; vhs.uniforms.src.value = [SW, SH];
post.composer.addPass(vhs);

const world = buildWorld(scene), props = buildProps(scene);
const shoes = makeShoes(scene), hand = makeHand(scene), att = makeAttendant(scene);
scene.remove(hand); camera.add(hand); hand.position.set(.06, -.13, -.33); hand.rotation.set(.25, 0, .1);
const tk = props.ticket; scene.remove(tk); camera.add(tk); tk.position.set(.035, .03, -.36); tk.rotation.set(.12, 0, -.04);

// convex mirror: a cube camera at the mirror renders the room; a sphere cap reflects it (the world behind you, bent)
const cubeRT = new THREE.WebGLCubeRenderTarget(192, { type: THREE.HalfFloatType });
const cubeCam = new THREE.CubeCamera(.1, 60, cubeRT); cubeCam.position.copy(MIRROR.p); scene.add(cubeCam);
const mirMat = new THREE.ShaderMaterial({ uniforms: { env: { value: cubeRT.texture } }, toneMapped: true,
  vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform samplerCube env; varying vec3 vW; varying vec3 vN; void main(){ vec3 v = normalize(vW - cameraPosition); vec3 r = reflect(v, normalize(vN));
    vec3 c = textureCube(env, r).rgb * .92; float e = pow(1. - abs(dot(-v, normalize(vN))), 3.); gl_FragColor = vec4(c + e * .05, 1.); }` });
const mirror = new THREE.Mesh(new THREE.SphereGeometry(MIRROR.r * 1.6, 48, 24, 0, Math.PI * 2, 0, .67), mirMat);
mirror.rotation.x = Math.PI / 2; mirror.position.z = -MIRROR.r * 1.6 * Math.cos(.67) + .005; props.mirror.add(mirror);

const ov = document.getElementById('ov'), ox = ov.getContext('2d');
const fetchJ = async (p, d) => { try { const r = await fetch(p); return r.ok ? await r.json() : d; } catch { return d; } };
const CUES = await fetchJ('voice/cues.json', []);

// —— camera: segment keys + handheld rig ——
const camKey = t => { const s = segAt(t); if (s.rewind) { const p = seg(t, s.t0, s.t1); return camKey(lerp(s.rewind[0], s.rewind[1], p)); } return s.cam(t); };
const DT = 1 / 240, NS = Math.ceil(DUR / DT) + 2, DIST = new Float32Array(NS);
for (let k = 1; k < NS; k++) { const a = camKey((k - 1) * DT), b = camKey(k * DT); const d = Math.hypot(b[0] - a[0], b[2] - a[2]); DIST[k] = DIST[k - 1] + (d < .2 ? d : 0); }
const distAt = t => { const f = clamp(t / DT, 0, NS - 1.001), i = Math.floor(f); return lerp(DIST[i], DIST[i + 1], f - i); };
const speedAt = t => (distAt(t + .12) - distAt(t - .12)) / .24;
const nz = (t, f, s) => vnoise(t * f + s * 17.3) - .5;
const punch = t => { let p = 0; for (const a of T.punch) p = Math.max(p, env(t, a, a + .35, 6 / 60, .25)); return p; };
function camPose(t) {
  const [x, y0, z, yaw0, pitch0, fov, focus] = camKey(t);
  const sp = speedAt(t), amp = clamp(sp / 1.2), ph = distAt(t) / .72 * Math.PI, fear = FEAR(t), hold = 1 - HOLD(t) * .9;
  const br = Math.sin(t * Math.PI * 2 * (.27 + .25 * fear));
  let y = y0 + (.03 * amp * (Math.abs(Math.sin(ph)) - .6) + br * .006) * hold;
  const pitch = pitch0 + (nz(t, 1.1, 1) * .016 + nz(t, 3.7, 2) * .006 * (1 + 2 * fear) + nz(t, 9.5, 3) * .003 * fear + br * .006) * hold;
  const yaw = yaw0 + (nz(t, .9, 4) * .018 + nz(t, 3.3, 5) * .006 * (1 + 2 * fear) + .011 * amp * Math.sin(ph)) * hold;
  const roll = (nz(t, .6, 6) * .03 + .014 * amp * Math.sin(ph) + nz(t, 7, 7) * .004 * fear) * hold + .01;
  return { x, y, z, yaw, pitch, roll, fov: fov * (1 - .08 * punch(t)), focus, amp, ph };
}

// floor height under the feet (the stairwell steps; elsewhere the slab)
function groundAt(x, z, yaw) {
  if (x < 50) return 0;
  const zf = z - Math.cos(yaw) * .25;                         // the feet are a little ahead of the lens
  return -clamp(Math.floor((STAIR.z1 - 1.2 - zf) / STAIR.run) + 1, 0, STAIR.steps) * STAIR.rise;
}
// —— light state ——
function gLight(t) {
  let g = 1;
  for (const f of T.flicks) { if (t > f - .04 && t < f + .13) g = .02; else if (t >= f + .13 && t < f + .3) g = Math.min(g, .5 + .5 * seg(t, f + .13, f + .3)); }
  if (t > T.twist - .05 && t < T.twist + .12) g = .02;
  if (t > T.blackA[0] && t < T.rewind[0]) g = 0;
  return g;
}
const darkMem = t => { let s = 0, w = 0; for (let k = 0; k < 40; k++) { const d = k * .03, e = Math.exp(-d / .45); s += (1 - gLight(t - d)) * e; w += e; } return s / w; };
const dayAt = t => t >= 35.5 && t < T.twist ? ss(seg(t, T.day[0], T.day[1])) : 0;
const lightExtra = (L, t) => (L.stair ? 1 : 1);

// —— the frame ——
function render(t) {
  const s = segAt(t), tv = s.rewind ? lerp(s.rewind[0], s.rewind[1], seg(t, s.t0, s.t1)) : t;   // the picture's own time (the rewind plays it backwards)
  const cp = camPose(tv);
  if (Q.has('cam')) { const c = Q.get('cam').split(',').map(Number); Object.assign(cp, { x: c[0], y: c[1], z: c[2], yaw: c[3], pitch: c[4], roll: 0, fov: 70 }); }
  camera.position.set(cp.x, cp.y, cp.z); camera.rotation.set(cp.pitch, cp.yaw, cp.roll);
  const hf = cp.fov * Math.PI / 180; camera.fov = 2 * Math.atan(Math.tan(hf / 2) / (4 / 3)) * 180 / Math.PI; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  shoes.pose({ x: cp.x, y: groundAt(cp.x, cp.z, cp.yaw), z: cp.z, yaw: cp.yaw, phase: cp.ph, amp: cp.amp });
  // the attendant
  const F = figure(tv);
  att.visible = !!F;
  if (F) { att.position.set(...F.p); att.rotation.y = F.yaw; att.pose(tv * 1.3, 0, F.offer); const sp = new THREE.Vector3(); att.slit.getWorldPosition(sp); U.uSlit.value.copy(sp); U.uSlitI.value = .12; }
  else U.uSlitI.value = 0;
  // doors, barrier, car, hand + ticket
  props.door.rotation.y = -1.35 * ss(seg(tv, T.doorOpen[0], T.doorOpen[1]));
  props.stBotDoor.position.x = -DOOR.w * .98 * ss(seg(tv, T.stBotOpen[0], T.stBotOpen[1]));
  props.barrier.rotation.z = -1.42 * ss(seg(tv, T.barrier[0], T.barrier[1]));
  props.car.position.x = lerp(-14, 14, seg(tv, 36.4, 39.0));
  const handOn = tv > 38.25 && tv < 44.0; hand.visible = handOn; tk.visible = handOn;
  // lights, daylight, fog
  const g = gLight(tv), day = dayAt(tv);
  updateLights(tv, g, lightExtra);
  U.uDay.value = day * .45; U.uSignI.value = .5 * (g > .5 ? 1 : .5); U.uFogG.value = .3 + .7 * g;
  scene.background.copy(U.uFogCol.value).multiplyScalar(U.uFogG.value * .15);
  props.day.visible = tv >= 35.5 && tv < 44; props.day.material.uniforms.c.value.setRGB(1, .96, .86).multiplyScalar(day > 0 ? .4 + .5 * day : .02);
  world.tubeMat.uniforms.uEmit.value = 4.0;
  // the mirror: only refresh while it can be seen
  const mirOn = tv < 4.0 || tv > 43.8; props.mirror.visible = true;
  if (mirOn) { props.mirror.visible = false; hand.visible = tk.visible = false; cubeCam.update(renderer, scene); props.mirror.visible = true; hand.visible = tk.visible = handOn; }
  // focus
  post.dof.focus = cp.focus; post.dof.aper = 3.2 + 5 * seg(cp.fov, 52, 14);
  // VHS
  const u = vhs.uniforms, dm = darkMem(tv);
  u.frame.value = Math.floor(t * 30);
  u.tint.value = [1.0 + .02 * Math.sin(t * .23), 1.0, .93 + .04 * Math.sin(t * .31) + .1 * day];
  u.expo.value = (1 + .45 * dm) * (day > 0 ? lerp(.8, .62, ss(seg(tv, 36.6, 38.4))) : 1);
  u.gain.value = .035 + .08 * dm + .02 * seg(cp.fov, 52, 14) + .015 * FEAR(tv);
  let track = 0, roll = 0;
  for (const [a, b] of [T.tear1, T.tear2, T.tear3, T.tear4]) track = Math.max(track, env(t, a, b, .05, .12));
  if (t < .25) track = Math.max(track, 1 - seg(t, 0, .25) * .7);
  if (t >= T.rewind[0] && t < T.rewind[1]) { track = Math.max(track, .55 + .25 * Math.sin(t * 9)); roll = (hash(Math.floor(t * 30) * .7) - .5) * .05; u.jitter.value = 1.2; }
  else u.jitter.value = .3;
  u.track.value = track; u.roll.value = roll;
  u.off.value = (t > T.blackA[0] && t < T.rewind[0]) ? 1 : 0;
  const rew = t >= T.rewind[0] && t < T.rewind[1];
  drawOSD(osdCv, { hide: u.off.value > .5, t, rec: !rew, clock: clock(t), date: 'NOV.21.1996', bat: t > 40 ? 1 : 3, batBlink: t > 41.1,
    title: rew ? ['<< REW'] : null, titleN: 99 });
  osdTex.needsUpdate = true;
  U.uTime.value = t;
  post.composer.render();
  overlay(t);
}

// —— overlay: hook, chips, captions, end card (English, per the series) ——
const CHIPS = [{ t: 'TAKE THE STAIRS', c: '#e0392b' }, { t: 'FOLLOW HIM', c: '#2fbf5b' }];
function pill(x, y, w, h, label, col, a, big = false) {
  ox.save(); ox.globalAlpha = a; ox.fillStyle = '#f4f1ea'; ox.beginPath(); ox.roundRect(x, y, w, h, h / 2); ox.fill();
  ox.fillStyle = col; ox.beginPath(); ox.arc(x + h * .55, y + h / 2, h * .2, 0, 7); ox.fill();
  ox.fillStyle = '#121212'; ox.font = `700 ${big ? 50 : 42}px 'IBM Plex Sans Condensed'`; ox.textAlign = 'left'; ox.textBaseline = 'middle'; ox.fillText(label, x + h * .95, y + h / 2 + 2); ox.restore();
}
function chips(t, big = false) {
  const act = t < T.rewind[0] ? 0 : t < T.followOn[0] ? -1 : 1;
  const h = big ? 104 : 90, y = big ? 330 : 392, gap = 22;
  const ws = CHIPS.map(c => { ox.font = `700 ${big ? 50 : 42}px 'IBM Plex Sans Condensed'`; return ox.measureText(c.t).width + h * 1.35; });
  if (big) { ws.forEach((w, i) => pill((W - w) / 2, y + i * (h + gap), w, h, CHIPS[i].t, CHIPS[i].c, 1, true)); return; }
  const tot = ws[0] + ws[1] + gap; let x = (W - tot) / 2;
  const a0 = ss(seg(t, T.chips, T.chips + .35));
  ws.forEach((w, i) => { const a = a0 * (act === -1 || t < T.stairsOn[0] ? 1 : act === i ? 1 : .35); pill(x, y, w, h, CHIPS[i].t, CHIPS[i].c, a); x += w + gap; });
}
function caption(t) {
  const c = [...CUES].reverse().find(c => t >= c.t0 && t < c.t1); if (!c) return;
  ox.save(); ox.font = "600 58px 'IBM Plex Mono'"; ox.textAlign = 'center'; ox.textBaseline = 'middle';
  const w = ox.measureText(c.text).width + 36, y = H * .55;
  ox.fillStyle = '#000'; ox.fillRect((W - w) / 2, y - 40, w, 80); ox.fillStyle = '#ffffff'; ox.fillText(c.text, W / 2, y + 2); ox.restore();
}
function overlay(t) {
  ox.clearRect(0, 0, W, H);
  // hook question, top, from frame 0
  if (t < T.hook[1]) { ox.save(); ox.globalAlpha = 1 - ss(seg(t, T.hook[1] - .3, T.hook[1])); ox.fillStyle = '#f4f1ea'; ox.font = "700 92px 'IBM Plex Sans Condensed'"; ox.textAlign = 'center'; ox.textBaseline = 'middle';
    ox.fillText('WOULD YOU', W / 2, 330); ox.fillText('GO DOWN?', W / 2, 430); ox.restore(); }
  if (t >= T.chips && t < T.end[0]) chips(t);
  if (!NOSUB && t < T.end[0]) caption(t);
  if (t >= T.end[0]) {
    const a = ss(seg(t, T.end[0], T.end[0] + .25));
    ox.save(); ox.globalAlpha = a; ox.fillStyle = '#f4f1ea'; ox.font = "700 84px 'IBM Plex Sans Condensed'"; ox.textAlign = 'center'; ox.textBaseline = 'middle'; ox.fillText('WHAT WOULD YOU DO?', W / 2, 230);
    chips(t, true);
    ox.font = "600 40px 'IBM Plex Mono'"; ox.fillText('COMMENT: STAIRS OR FOLLOW?', W / 2, 1470); ox.restore();
  }
}

// —— events for the mixer ——
const EV = [];
CUES.forEach(c => EV.push({ t: c.t0, type: 'line', id: c.id }));
{ let last = 0; for (let t = 0; t < DUR; t += 1 / 120) { const n = Math.floor(distAt(t) / .72); if (n > last) { last = n; const s = segAt(t); EV.push({ t, type: s.name === 'stairs' ? 'stepStair' : 'step', v: clamp(speedAt(t) / 1.2, .4, 1.1), rev: !!s.rewind }); } } }
EV.push({ t: 0, type: 'hit' }, { t: 2.6, type: 'turn' }, { t: T.tear1[0], type: 'tear', d: .35 }, { t: 13.2, type: 'zoom', d: 1.2 }, { t: 14.0, type: 'af' }, { t: 14.4, type: 'af' },
  { t: T.hush[0], type: 'hush', d: 2 }, { t: T.chips, type: 'chips' }, { t: T.doorOpen[0], type: 'door' }, { t: T.tear2[0], type: 'tear', d: .25 }, { t: T.stBotOpen[0], type: 'door' },
  { t: T.tear3[0], type: 'tear', d: .25 }, { t: 23.8, type: 'hit' }, { t: T.blackA[0], type: 'cut' }, { t: T.rewind[0], type: 'rewind', d: 3 },
  ...T.flicks.map(f => ({ t: f, type: 'flick' })), { t: T.offer[0], type: 'rustle' }, { t: T.tear4[0], type: 'tear', d: .25 }, { t: T.barrier[0], type: 'barrier' },
  { t: T.day[0], type: 'day' }, { t: 36.4, type: 'car' }, { t: 38.3, type: 'rustle' }, { t: 40.0, type: 'silence', d: 1.1 }, { t: T.twist, type: 'twist' }, { t: 44.0, type: 'turn' }, { t: T.end[0], type: 'end' });
EV.sort((a, b) => a.t - b.t);

window.DUR = DUR; window.EV = EV; window.render = render;
window.TEXTS = t => { render(t); return []; };
render(Q.has('t') ? +Q.get('t') : 0);
window.READY = true;
