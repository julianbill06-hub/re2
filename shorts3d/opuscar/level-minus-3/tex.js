// Procedural textures for Level -3: pillar labels, level signs, exit sign, door note, ticket, barrier stripes
import * as THREE from 'three';
import { mulberry } from '/core/lib.js';

const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const COND = "'IBM Plex Sans Condensed'", MONO = "'IBM Plex Mono'";
function grime(x, w, h, seed, k = .25) {
  const R = mulberry(seed);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${40 + R() * 40},${36 + R() * 30},${20 + R() * 20},${R() * .07 * k * 4})`; const r = 2 + R() * 22; x.beginPath(); x.arc(R() * w, R() * h, r, 0, 7); x.fill(); }
}

// pillar label: a painted panel — level number large, bay code under it; returns an atlas
export function pillarAtlas(labels) {
  const TW = 128, TH = 216, COLS = 16, ROWS = Math.ceil(labels.length / COLS);
  const [c, x] = cv(TW * COLS, TH * ROWS);
  labels.forEach((lb, i) => {
    const ox = (i % COLS) * TW, oy = Math.floor(i / COLS) * TH, R = mulberry(100 + i);
    x.fillStyle = '#20382a'; x.fillRect(ox + 6, oy + 6, TW - 12, TH - 12);
    x.fillStyle = '#efe9d6'; x.font = `700 96px ${COND}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('-3', ox + TW / 2, oy + 78);
    x.fillStyle = '#c9a640'; x.fillRect(ox + 18, oy + 132, TW - 36, 6);
    x.fillStyle = '#efe9d6'; x.font = `600 44px ${COND}`; x.fillText(lb, ox + TW / 2, oy + 172);
    // wear
    for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(150,145,130,${R() * .35})`; x.fillRect(ox + 6 + R() * (TW - 12), oy + 6 + R() * (TH - 12), 1 + R() * 6, 1 + R() * 3); }
  });
  const t = tex(c);
  return { tex: t, uv: (i, u, v) => [((i % COLS) + u) / COLS, 1 - (Math.floor(i / COLS) + (1 - v)) / ROWS] };
}
// hanging sign: LEVEL -3 with arrows
export function levelSign() {
  const [c, x] = cv(1024, 244);
  x.fillStyle = '#1d3326'; x.fillRect(0, 0, 1024, 244);
  x.strokeStyle = '#e9e3cf'; x.lineWidth = 8; x.strokeRect(14, 14, 996, 216);
  x.fillStyle = '#efe9d6'; x.font = `700 150px ${COND}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LEVEL  -3', 560, 128);
  // arrow down
  x.beginPath(); x.moveTo(120, 60); x.lineTo(180, 60); x.lineTo(180, 120); x.lineTo(215, 120); x.lineTo(150, 195); x.lineTo(85, 120); x.lineTo(120, 120); x.closePath(); x.fill();
  grime(x, 1024, 244, 7, .5);
  return tex(c);
}
export function exitSign() {
  const [c, x] = cv(256, 116);
  x.fillStyle = '#0b8f3a'; x.fillRect(0, 0, 256, 116);
  x.fillStyle = '#eafff0'; x.font = `700 68px ${COND}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('EXIT', 92, 60);
  // running figure + door
  x.fillRect(16, 20, 50, 76); x.fillStyle = '#0b8f3a'; x.fillRect(22, 26, 38, 70);
  x.fillStyle = '#eafff0'; x.beginPath(); x.arc(44, 36, 6, 0, 7); x.fill(); x.fillRect(38, 44, 10, 26); x.fillRect(30, 50, 22, 6); x.fillRect(36, 68, 6, 22); x.fillRect(46, 66, 6, 20);
  return tex(c);
}
// the note taped on the stair door
export function doorNote() {
  const [c, x] = cv(420, 560);
  x.fillStyle = '#efe7cc'; x.fillRect(0, 0, 420, 560); grime(x, 420, 560, 21, .6);
  x.fillStyle = '#1c1a16'; x.textAlign = 'left'; x.textBaseline = 'top';
  x.font = `700 46px ${COND}`; x.fillText('NOTICE', 30, 30);
  x.font = `600 22px ${MONO}`; x.fillText('FORM P-3 · REV. 4', 30, 88);
  x.fillRect(30, 122, 360, 3);
  x.font = `600 34px ${COND}`;
  ['THESE STAIRS DO', 'NOT LEAD UP.', '', 'PLEASE WAIT FOR', 'THE ATTENDANT.'].forEach((l, i) => x.fillText(l, 30, 150 + i * 52));
  x.font = `500 22px ${MONO}`; x.fillText('— MANAGEMENT', 30, 480);
  return tex(c);
}
export function stairLevel(t) {
  const [c, x] = cv(256, 256);
  x.fillStyle = '#c9a640'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#16140f'; x.font = `700 150px ${COND}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 128, 136);
  grime(x, 256, 256, 33, .6); return tex(c);
}
export function stripes() {
  const [c, x] = cv(512, 16);
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2efe6' : '#c4261d'; x.fillRect(i * 64, 0, 64, 16); }
  return tex(c);
}
// the parking ticket: the twist is printed on it
export function ticket() {
  const [c, x] = cv(340, 640);
  x.fillStyle = '#f1ecd9'; x.fillRect(0, 0, 340, 640);
  x.fillStyle = '#c9a640'; x.fillRect(0, 0, 340, 70);
  x.fillStyle = '#16140f'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `700 40px ${COND}`; x.fillText('PARK TICKET', 170, 36);
  x.font = `600 24px ${MONO}`; x.textAlign = 'left';
  ['NO. 000413', '', 'ENTRY  00:07', 'LEVEL  -3', '', 'PAID   --'].forEach((l, i) => x.fillText(l, 30, 120 + i * 34));
  x.fillRect(24, 330, 292, 3);
  x.font = `700 46px ${COND}`; x.textAlign = 'center'; x.fillText('EXIT:', 170, 395); x.font = `700 74px ${COND}`; x.fillText('LEVEL -3', 170, 465);
  // magnetic stripe + barcode
  x.fillStyle = '#2a2722'; x.fillRect(0, 560, 340, 40);
  for (let i = 0; i < 46; i++) { if ((i * 7) % 3) x.fillRect(40 + i * 5.6, 515, (i % 4) + 1.2, 34); }
  grime(x, 340, 640, 41, .3);
  return tex(c);
}
