// Final Call Stories – Folge 2 „Platform Zero“ (60 fps, auf Retention optimiert: Cold Open, Loop-Ende).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {GEO, LambertCtx, M, T} from './hd';
import {Cam, Halo} from './NightGate';
import {Caption, Chips, Conductor, FilmLook, Pal, TrainProps, TrainSet, TravelerHD, Bone} from './NightTrain';
import tm from './timing_pz.json';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
export const PZ_DURATION = 59.45;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- timing helpers ----------
const L = (i: number) => tm.lines[i][0];
const LE = (i: number) => tm.lines[i][1];
const S = (li: number, si: number) => tm.sentences.filter((s) => s.line === li)[si].start;
const Wd = (li: number, txt: string) => tm.words.find((w) => w.line === li && w.text.toLowerCase().startsWith(txt.toLowerCase()))!.start;
const CAP = (txt: string) => tm.caps.find((c) => c.text === txt)!.start;

// ---------- extra sets ----------
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}
const tileTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = '#7d8580'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 128) {
    const v = 150 + rnd(x + y * 3) * 30; g.fillStyle = `rgb(${v},${v + 6},${v})`; g.fillRect(x + 3, y + 3, 122, 58);
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,50,30,${0.05 + rnd(i) * 0.12})`; g.beginPath(); g.ellipse(rnd(i + 1) * 512, rnd(i + 2) * 512, 20 + rnd(i + 3) * 60, 10 + rnd(i + 4) * 40, 0, 0, Math.PI * 2); g.fill(); }
}, [4, 3]);
const exitTex = () => canvasTex(512, 256, (g) => {
  g.fillStyle = '#1f9d55'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#fff'; g.font = '900 120px Inter, Arial'; g.textBaseline = 'middle'; g.fillText('EXIT', 40, 130);
  g.beginPath(); g.moveTo(410, 60); g.lineTo(470, 130); g.lineTo(430, 130); g.lineTo(430, 200); g.lineTo(390, 200); g.lineTo(390, 130); g.lineTo(350, 130); g.closePath(); g.fill();
});
const p3Tex = () => canvasTex(1024, 384, (g) => {
  g.fillStyle = '#1d4f91'; g.fillRect(0, 0, 1024, 384); g.fillStyle = '#fff';
  g.beginPath(); g.arc(190, 192, 130, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1d4f91'; g.font = '900 190px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3', 190, 205);
  g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '800 110px Inter, Arial'; g.fillText('PLATFORM', 360, 160); g.font = '600 64px Inter, Arial'; g.globalAlpha = 0.8; g.fillText('CITY CENTRE  →', 364, 280);
});
const concTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = '#a9a59c'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) { const v = 140 + rnd(i) * 50; g.fillStyle = `rgba(${v},${v},${v - 6},.5)`; g.fillRect(rnd(i + 5) * 512, rnd(i + 9) * 512, 3, 3); }
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
}, [4, 14]);
const ticketTex = () => canvasTex(1024, 480, (g) => {
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, 1024, 480);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(120,100,60,${rnd(i) * 0.08})`; g.fillRect(rnd(i + 1) * 1024, rnd(i + 2) * 480, 2, 2); }
  g.fillStyle = '#5a1720'; g.fillRect(0, 0, 1024, 92);
  g.fillStyle = '#efe6cf'; g.font = '800 54px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'; g.fillText('NIGHT LINE  ·  ONE WAY', 36, 48);
  g.fillStyle = '#1b1b1b'; g.font = '600 34px "IBM Plex Mono", monospace'; g.fillText('TO', 40, 150);
  g.font = '900 104px "IBM Plex Mono", monospace'; g.fillText('PLATFORM 0', 36, 232);
  g.font = '600 34px "IBM Plex Mono", monospace'; g.fillText('DEPARTS', 40, 322); g.fillText('SEAT', 640, 322);
  g.fillStyle = '#b3141f'; g.font = '900 72px "IBM Plex Mono", monospace'; g.fillText('TONIGHT', 36, 392); g.fillStyle = '#1b1b1b'; g.fillText('YOURS', 636, 392);
  for (let x = 640; x < 990; x += 7) { if (rnd(x) > 0.35) { g.fillRect(x, 120, rnd(x + 1) > 0.5 ? 4 : 2, 150); } }
  g.fillStyle = '#3a3226'; g.beginPath(); g.arc(960, 440, 22, 0, Math.PI * 2); g.fill();
});

const StairsSet: React.FC<{t: number; flick: number}> = ({t, flick}) => {
  const tile = useMemo(tileTex, []);
  const exit = useMemo(exitTex, []);
  const N = 16, rise = 0.18, run = 0.3, ang = Math.atan2(rise, run);
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#06070a', 5, 16]} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#4a5a70', '#120c08', 0.35]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]} receiveShadow><planeGeometry args={[2.4, 4]} /><meshStandardMaterial color="#3d3c39" roughness={0.6} /></mesh>
      {Array.from({length: N}).map((_, i) => (
        <group key={i}>
          <T geo={GEO.box} color="#55534e" p={[0, (i + 1) * rise / 2, -i * run - run / 2]} s={[2.3, (i + 1) * rise, run]} o={0.004} />
          <M geo={GEO.box} color="#d9b42a" p={[0, (i + 1) * rise + 0.002, -i * run - 0.03]} s={[2.3, 0.008, 0.05]} o={0} />
        </group>
      ))}
      <T geo={GEO.box} color="#55534e" p={[0, N * rise / 2, -N * run - 2.5]} s={[2.3, N * rise, 5]} o={0} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.15, 3, -3]} rotation={[0, -s * Math.PI / 2, 0]}><planeGeometry args={[14, 6]} /><meshStandardMaterial map={tile} roughness={0.35} metalness={0.1} /></mesh>
          <group position={[s * 1.05, 0.9 + rise / 2, -N * run / 2]} rotation={[ang, 0, 0]}>
            <M geo={GEO.cyl} color="#c9ced6" r={[Math.PI / 2, 0, 0]} s={[0.025, N * run / Math.cos(ang) + 1, 0.025]} o={0} />
          </group>
          {[0, 1, 2, 3].map((k) => <M key={k} geo={GEO.cyl} color="#aab0ba" p={[s * 1.1, 0.75 + k * 0.72 * rise / run * 1.1, -0.2 - k * 1.3]} r={[0, 0, Math.PI / 2]} s={[0.012, 0.1, 0.012]} o={0} />)}
        </group>
      ))}
      <mesh position={[0, 2.6 + N * rise / 2, -N * run / 2]} rotation={[Math.PI / 2 + ang, 0, 0]}><planeGeometry args={[2.3, 9]} /><meshStandardMaterial color="#2a2c2e" roughness={0.9} /></mesh>
      {[[1.1, 2.2, 0.6, 1], [-1.1, 3.2, -2.4, flick], [1.1, 4.6, -5.6, 1]].map(([x, y, z, on], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh scale={[0.05, 0.12, 0.5]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={new THREE.Color('#dff3ff').multiplyScalar(0.1 + 0.9 * on)} toneMapped={false} /></mesh>
          <Halo p={[-Math.sign(x) * 0.1, 0, 0]} s={1.6} color="#cfe6ff" o={0.3 * on} />
          <pointLight position={[-Math.sign(x) * 0.4, 0, 0]} color="#d6ecff" intensity={6 * on} distance={5} decay={1.5} />
        </group>
      ))}
      <mesh position={[0, 4.75, -N * run - 1.0]}><planeGeometry args={[0.9, 0.45]} /><meshBasicMaterial map={exit} toneMapped={false} /></mesh>
      <Halo p={[0, 4.75, -N * run - 0.9]} s={2.2} color="#2fe07a" o={0.45} />
      <pointLight position={[0, 4.5, -N * run - 0.5]} color="#2fe07a" intensity={4} distance={5} />
      {Array.from({length: 40}).map((_, i) => <mesh key={'d' + i} position={[-1 + rnd(i) * 2, 0.5 + ((rnd(i + 3) * 4 + t * 0.1) % 4), 1 - rnd(i + 7) * 6]} scale={0.006}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#fff1d0" transparent opacity={0.3} toneMapped={false} /></mesh>)}
    </>
  );
};
const stairY = (z: number) => clamp(-z / 0.3, 0, 16) * 0.18;

const COMMUTERS: {x: number; z0: number; v: number; pal: Partial<Pal>; hair: 'curly' | 'caesar' | 'bald'}[] = [
  {x: -1.5, z0: -9, v: 1.0, pal: {parka: '#c0532d', dark: '#8a3a1f', jeans: '#3a3a3a', shoe: '#222', skin: '#d9a07a', hair: ['#1a1a1a']}, hair: 'caesar'},
  {x: 1.4, z0: 4, v: -0.9, pal: {parka: '#5a4a8a', dark: '#3e3266', jeans: '#2b2b33', shoe: '#e9e4dc', skin: '#8d5a3c', hair: ['#111']}, hair: 'bald'},
  {x: 2.2, z0: -4, v: 1.1, pal: {parka: '#e0b02a', dark: '#a8821c', jeans: '#334466', shoe: '#5a3a22', skin: '#f2c4a0', hair: ['#a0522d', '#8a4426', '#b35f33']}, hair: 'curly'},
  {x: -0.8, z0: 7, v: -1.2, pal: {parka: '#2d6b3a', dark: '#1f4a28', jeans: '#222b3a', shoe: '#ddd', skin: '#c68c64', hair: ['#3a2416']}, hair: 'caesar'},
  {x: -2.0, z0: -1, v: 0.8, pal: {parka: '#8a8f99', dark: '#5f646c', jeans: '#1d2433', shoe: '#7a2a2a', skin: '#e8b48e', hair: ['#d9c39a', '#c9b08a']}, hair: 'curly'},
  {x: 1.0, z0: -12, v: 0.95, pal: {parka: '#b8364a', dark: '#82222f', jeans: '#2b3a5c', shoe: '#f1efe9', skin: '#6b4430', hair: ['#0e0e0e']}, hair: 'bald'},
  {x: 2.6, z0: 9, v: -1.0, pal: {parka: '#3d6f9e', dark: '#2a4e70', jeans: '#3a3a3a', shoe: '#222', skin: '#f2c4a0', hair: ['#5a3a20']}, hair: 'caesar'},
];
const MorningSet: React.FC<{t: number; hero?: React.ReactNode; bait?: boolean; people?: boolean}> = ({t, hero, bait, people = true}) => {
  const conc = useMemo(concTex, []);
  const p3 = useMemo(p3Tex, []);
  return (
    <>
      <color attach="background" args={['#cfe2f1']} />
      <fog attach="fog" args={['#dbe7f1', 12, 46]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#eef6ff', '#8a7a66', 1.15]} />
      <directionalLight position={[7, 10, 6]} intensity={2.6} color="#ffe0b0" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, 0, -8]} receiveShadow><planeGeometry args={[6.4, 60]} /><meshStandardMaterial map={conc} roughness={0.75} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.25, 0.005, -8]}><planeGeometry args={[0.14, 60]} /><meshStandardMaterial color="#e2b72c" /></mesh>
      <T geo={GEO.box} color="#8d897f" p={[-2.4, -0.5, -8]} s={[0.1, 1, 60]} o={0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, -1, -8]} receiveShadow><planeGeometry args={[5, 60]} /><meshStandardMaterial color="#5f574d" roughness={1} /></mesh>
      {[-4.3, -5.7].map((x) => <M key={x} geo={GEO.box} color="#9aa0a6" p={[x, -0.93, -8]} s={[0.07, 0.1, 60]} o={0} />)}
      {Array.from({length: 30}).map((_, i) => <T key={'sl' + i} geo={GEO.box} color="#4a3a2a" p={[-5, -0.97, 12 - i * 1.4]} s={[2.2, 0.06, 0.22]} o={0} />)}
      {/* canopy + columns */}
      <T geo={GEO.box} color="#e9ebee" p={[0.8, 4.3, -8]} s={[7, 0.15, 60]} o={0} />
      {Array.from({length: 9}).map((_, i) => (
        <group key={'c' + i} position={[1.4, 0, 8 - i * 5]}>
          <M geo={GEO.cyl} color="#f2f3f5" p={[0, 2.15, 0]} s={[0.12, 4.3, 0.12]} o={0.006} />
          {i === 2 ? <group position={[0, 3.1, 0.13]}><T geo={GEO.cyl} color="#ffffff" r={[Math.PI / 2, 0, 0]} s={[0.3, 0.06, 0.3]} o={0.01} /><mesh position={[0.05, 0.08, 0.035]} rotation={[0, 0, -0.6]} scale={[0.02, 0.18, 0.01]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#111" /></mesh><mesh position={[0.04, -0.02, 0.035]} rotation={[0, 0, 1.4]} scale={[0.02, 0.12, 0.01]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#111" /></mesh></group> : null}
        </group>
      ))}
      <group position={[0.4, 3.4, -6]}>
        <mesh><planeGeometry args={[2.2, 0.82]} /><meshBasicMaterial map={p3} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        {[-0.9, 0.9].map((x) => <M key={x} geo={GEO.cyl} color="#8a8f99" p={[x, 0.65, 0]} s={[0.012, 0.5, 0.012]} o={0} />)}
      </group>
      {[-3, -14].map((z) => (
        <group key={'b' + z} position={[3.3, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
          <T geo={GEO.rbox} color="#6b4a2e" p={[0, 0.45, 0]} s={[1.6, 0.06, 0.4]} o={0.008} />
          <T geo={GEO.rbox} color="#6b4a2e" p={[0, 0.8, -0.18]} s={[1.6, 0.4, 0.05]} o={0.008} />
          {[-0.7, 0.7].map((x) => <M key={x} geo={GEO.box} color="#444" p={[x, 0.22, 0]} s={[0.05, 0.44, 0.35]} o={0} />)}
        </group>
      ))}
      <T geo={GEO.box} color="#c9c6be" p={[4.1, 2.2, -8]} s={[0.2, 4.4, 60]} o={0} />
      {/* sun shafts */}
      {[0, 1, 2].map((i) => <mesh key={'sh' + i} position={[1.5 + i * 0.8, 2.2, 1 - i * 3]} rotation={[0, 0.4, 0.5]}><planeGeometry args={[0.7, 6]} /><meshBasicMaterial color="#fff2d6" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} /></mesh>)}
      {people ? COMMUTERS.map((c, i) => {
        let z = c.z0 + c.v * t; z = ((z + 14) % 26 + 26) % 26 - 14;
        return <TravelerHD key={i} p={[c.x, 0, z]} ry={c.v > 0 ? 0 : Math.PI} sit={false} walk={t * 0.9 * Math.abs(c.v) + i * 0.3} mood={i % 2 ? 'calm' : 'stern'} pal={c.pal} hairStyle={c.hair} scarf={i % 3 === 0} />;
      }) : null}
      {bait ? <Conductor p={[2.3, 0, -7.5]} ry={-0.1} glow={1.4} point={0} s={1.08} /> : null}
      {hero}
    </>
  );
};

const TicketProp: React.FC<{p: V3; tint: number}> = ({p, tint}) => {
  const tx = useMemo(ticketTex, []);
  return (
    <group position={p} rotation={[-0.08, 0, 0.03]}>
      <mesh castShadow><planeGeometry args={[0.34, 0.16]} /><meshStandardMaterial map={tx} roughness={0.8} side={THREE.DoubleSide} emissive={new THREE.Color('#ff0000')} emissiveIntensity={tint * 0.25} /></mesh>
      {/* thumb + fingers holding the ticket, forearm from below */}
      <T geo={GEO.sphere} color="#f2c4a0" p={[-0.15, -0.045, 0.015]} s={[0.03, 0.022, 0.016]} o={0.006} />
      <Bone a={[-0.21, -0.06, -0.02]} b={[-0.155, -0.04, 0.012]} r={0.016} color="#f2c4a0" o={0.006} />
      {[0, 1, 2].map((k) => <Bone key={k} a={[-0.2, -0.07 + k * 0.025, -0.03]} b={[-0.16, -0.065 + k * 0.025, -0.012]} r={0.012} color="#f2c4a0" o={0.005} />)}
      <T geo={GEO.sphere} color="#f2c4a0" p={[-0.22, -0.06, -0.035]} s={[0.045, 0.055, 0.03]} o={0.008} />
      <Bone a={[-0.4, -0.4, -0.2]} b={[-0.25, -0.08, -0.05]} r={0.055} color="#1f8a8a" />
      <T geo={GEO.cyl} color="#14605f" p={[-0.26, -0.11, -0.06]} r={[0.5, 0, -0.45]} s={[0.05, 0.04, 0.05]} o={0.008} />
    </group>
  );
};

// ---------- world state over time ----------
type CamS = {pos: V3; look: V3; fov: number};
type Trav = React.ComponentProps<typeof TravelerHD>;
type Cond = React.ComponentProps<typeof Conductor>;
type St = {set: 'train' | 'stairs' | 'morning' | 'ticket' | 'black'; cam: CamS; train?: Partial<TrainProps>; trav?: Trav | null; cond?: Cond | null; flick?: number; bait?: boolean; hero?: Trav | null; tint?: number; shake?: number};
const lp = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mv = (t: number, t0: number, t1: number, from: V3, to: V3, la: V3, lb: V3, fov: number): CamS => {
  const k = ease(clamp((t - t0) / Math.max(0.01, t1 - t0)));
  return {pos: lp(from, to, k), look: lp(la, lb, k), fov};
};
const TRAV0: Trav = {p: [-0.7, 0, 0.98], ry: 0.18, mood: 'shock', look: 0.8, sit: true};
const COND_AISLE: V3 = [0.05, 0, -1.4];
const OPEN_FROM: V3 = [0.12, 1.45, 4.2], OPEN_LOOK: V3 = [-0.35, 1.35, -1.4];
const DOT: V3 = [0.05, 2.0, -1.4];

// platform flicker: list of [start, length] dark moments during way B
const FLICKS: [number, number][] = [];
function buildFlicks() {
  if (FLICKS.length) return;
  const a = S(10, 1), b = S(10, 2), c = S(11, 0), d = S(11, 1);
  [[a + 0.15, 0.08], [a + 0.4, 0.12], [a + 0.85, 0.06], [b - 0.05, 0.22], [b + 0.5, 0.07], [c - 0.05, 0.28], [c + 0.45, 0.08], [d - 0.05, 0.26]].forEach((f) => FLICKS.push(f as [number, number]));
}
const flickAt = (t: number) => { buildFlicks(); for (const [s, l] of FLICKS) if (t >= s && t < s + l) return 0.04; return 1; };
const lastFlick = (t: number) => { buildFlicks(); let n = -1; FLICKS.forEach(([s], i) => { if (t >= s) n = i; }); return n; };

function world(t: number, inRewind = false): St {
  const def: Partial<TrainProps> = {};
  // ---- L0 cold open (frame 0 = loop frame) ----
  if (t < 1.15) return {set: 'train', cam: mv(t, 0, 1.15, OPEN_FROM, [0.02, 1.43, 3.5], OPEN_LOOK, [-0.33, 1.4, -1.4], 54), trav: TRAV0, cond: {p: COND_AISLE, ry: -0.1, glow: 1, point: 0, s: 1.08}, shake: 0.004};
  if (t < L(1)) return {set: 'train', cam: mv(t, 1.15, L(1), [0.25, 2.0, -0.15], [0.12, 2.0, -0.55], DOT, DOT, 38), trav: TRAV0, cond: {p: COND_AISLE, ry: -0.1, glow: 1 + (t - 1.15) * 0.6, point: 0, s: 1.08}};
  // ---- L1 asleep / wake up / empty ----
  if (t < S(1, 1)) return {set: 'train', cam: mv(t, L(1), S(1, 1), [0.25, 1.65, 4.6], [0.2, 1.55, 4.0], [-0.6, 0.95, 0.5], [-0.6, 0.95, 0.5], 50), trav: {...TRAV0, mood: 'calm', look: 0, headRoll: 0.25, breathe: t * 0.3}};
  if (t < CAP('THE CAR')) return {set: 'train', cam: mv(t, S(1, 1), CAP('THE CAR'), [-0.42, 1.42, 2.1], [-0.5, 1.4, 1.85], [-0.7, 1.35, 0.98], [-0.7, 1.35, 0.98], 42), trav: {...TRAV0, mood: 'stern', look: Math.sin(t * 3) * 0.9, headRy: Math.sin(t * 1.5) * 0.2}};
  if (t < L(2)) return {set: 'train', cam: mv(t, CAP('THE CAR'), L(2), [-0.3, 1.35, 1.4], [-0.15, 1.33, 0.4], [0, 1.25, -7], [0, 1.25, -7], 55)};
  // ---- L2 the train stands / sign ----
  if (t < S(2, 1)) return {set: 'train', cam: mv(t, L(2), S(2, 1), [4.6, 1.7, 3.2], [4.3, 1.6, 2.2], [1.4, 1.35, -3.5], [1.4, 1.3, -4.0], 50)};
  if (t < S(2, 2)) return {set: 'train', cam: mv(t, S(2, 1), S(2, 2), [-0.1, 1.6, -6.55], [0.6, 1.72, -6.62], [3.1, 2.45, -6.65], [3.1, 2.5, -6.65], 46)};
  if (t < L(3)) return {set: 'train', cam: mv(t, S(2, 2), L(3), [1.95, 2.48, -7.05], [2.1, 2.5, -6.8], [3.1, 2.55, -7.0], [3.1, 2.55, -6.55], 42), shake: 0.002};
  // ---- L3 last stop ----
  if (t < S(3, 1)) return {set: 'train', cam: mv(t, L(3), S(3, 1), [0, 1.95, -4.6], [0, 2.05, -5.7], [0, 2.24, -7.9], [0, 2.24, -7.9], 48), train: {led: Math.floor((t - L(3)) * 3) % 2 ? 'PLATFORM 0' : 'LAST STOP', ledSub: 'ALL PASSENGERS EXIT'}};
  if (t < L(4)) return {set: 'train', cam: mv(t, S(3, 1), L(4), [-0.7, 1.55, -3.2], [-0.35, 1.5, -4.3], [1.5, 1.1, -6.65], [1.5, 1.1, -6.65], 50)};
  // ---- L4 he's behind you ----
  if (t < S(4, 1)) {
    const fl = t - L(4) < 0.35 ? (Math.sin(t * 90) > 0 ? 1 : 0) : 0;
    return {set: 'train', cam: mv(t, L(4), S(4, 1), [0.14, 1.45, 4.4], [0.0, 1.43, 3.6], OPEN_LOOK, OPEN_LOOK, 54), trav: TRAV0, cond: t - L(4) > 0.2 ? {p: COND_AISLE, ry: -0.1, glow: 1, point: 0, s: 1.08} : null, train: {flicker: fl, lightsOn: fl ? 4 : 12}};
  }
  if (t < S(4, 2)) return {set: 'train', cam: mv(t, S(4, 1), S(4, 2), [-0.3, 1.95, 0.4], [-0.2, 1.98, -0.1], [0.05, 1.95, -1.4], DOT, 44), cond: {p: COND_AISLE, ry: -0.1, glow: 1, point: 0, s: 1.08}};
  if (t < L(5)) return {set: 'train', cam: mv(t, S(4, 2), L(5), [0.1, 2.0, -0.6], [0.07, 2.0, -0.88], DOT, DOT, 36), cond: {p: COND_AISLE, ry: -0.1, glow: 1 + clamp((t - S(4, 2)) / 1.2) * 1.4, point: 0, s: 1.08}, shake: 0.0015};
  // ---- L5 he points / decision ----
  if (t < S(5, 1)) return {set: 'train', cam: mv(t, L(5), S(5, 1), [0.62, 1.55, 1.0], [0.55, 1.55, 0.6], [0.2, 1.55, -1.6], [0.25, 1.55, -1.6], 52), trav: TRAV0, cond: {p: COND_AISLE, ry: -0.1, glow: 1.1, point: ease(clamp((t - L(5) - 0.25) / 0.8)), s: 1.08}};
  if (t < L(6)) return {set: 'train', cam: mv(t, S(5, 1), L(6), [-0.42, 1.42, 2.05], [-0.48, 1.4, 1.82], [-0.7, 1.35, 0.98], [-0.7, 1.35, 0.98], 42), trav: {...TRAV0, mood: 'shock', look: Math.sin(t * 7) > 0 ? 0.9 : -0.6}};
  // ---- WAY A: stay seated ----
  const COND_POINT: Cond = {p: COND_AISLE, ry: -0.1, glow: 1, point: 1, s: 1.08};
  if (t < S(6, 1)) return {set: 'train', cam: mv(t, L(6), S(6, 1), [0.35, 1.3, 2.9], [0.3, 1.3, 2.5], [-0.55, 1.1, 0.5], [-0.55, 1.1, 0.5], 48), trav: {...TRAV0, mood: 'stern', look: 0}, cond: COND_POINT};
  if (t < L(7)) return {set: 'train', cam: mv(t, S(6, 1), L(7), [-0.3, 1.5, -6.1], [0.05, 1.5, -6.35], [1.5, 1.15, -6.65], [1.5, 1.15, -6.65], 50), train: {doorOpen: 1 - ease(clamp((t - S(6, 1) - 0.1) / 0.9))}};
  if (t < S(7, 1)) {
    const dt = t - L(7);
    return {set: 'train', cam: mv(t, L(7), S(7, 1), [-0.25, 1.65, 2.6], [-0.2, 1.62, 2.2], [1.5, 1.45, -2.6], [1.5, 1.45, -2.9], 52), train: {doorOpen: 0, outsideZ: -0.9 * dt * dt, outsideOn: 1 - clamp((dt - 1.3) / 0.5)}, shake: 0.003};
  }
  const dark1: Partial<TrainProps> = {doorOpen: 0, outsideOn: 0};
  if (t < Wd(7, 'drei')) return {set: 'train', cam: mv(t, S(7, 1), Wd(7, 'drei'), [0, 1.95, -4.8], [0, 2.05, -5.8], [0, 2.24, -7.9], [0, 2.24, -7.9], 48), train: {...dark1, led: 'DEPARTING', ledSub: 'NEXT STOP: — — —'}, shake: 0.002};
  if (t < Wd(7, 'zwei')) return {set: 'train', cam: mv(t, Wd(7, 'drei'), Wd(7, 'zwei'), [0.1, 1.45, 4.3], [0.05, 1.44, 3.9], OPEN_LOOK, OPEN_LOOK, 54), trav: {...TRAV0, mood: 'shock', look: 0}, train: {...dark1, led: '3', ledSub: '', lightsOn: 8, dark: 0.3}};
  if (t < Wd(7, 'eins')) return {set: 'train', cam: mv(t, Wd(7, 'zwei'), Wd(7, 'eins'), [-0.45, 1.42, 2.0], [-0.5, 1.4, 1.8], [-0.7, 1.35, 0.98], [-0.7, 1.35, 0.98], 42), trav: {...TRAV0, mood: 'shock', look: -0.4}, train: {...dark1, led: '2', ledSub: '', lightsOn: 4, dark: 0.6}};
  if (t < L(8)) return {set: 'train', cam: mv(t, Wd(7, 'eins'), L(8), [0.1, 1.45, 4.3], [0.0, 1.43, 3.7], OPEN_LOOK, OPEN_LOOK, 54), trav: {...TRAV0, mood: 'shock', look: 0.3}, train: {...dark1, led: '1', ledSub: '', lightsOn: t - Wd(7, 'eins') > 0.45 ? 0 : 2, dark: 0.85}};
  if (t < S(8, 1)) return {set: 'train', cam: mv(t, L(8), S(8, 1), [0.0, 1.43, 3.6], [-0.1, 1.42, 3.2], OPEN_LOOK, OPEN_LOOK, 54), trav: {...TRAV0, mood: 'shock', look: 0}, train: {...dark1, led: '', ledSub: '', lightsOn: 0, dark: 1}};
  if (t < LE(8) + 0.3) return {set: 'train', cam: mv(t, S(8, 1), LE(8), [-0.5, 1.45, 2.7], [-0.72, 1.42, 2.35], [-0.92, 1.35, 0.98], [-0.95, 1.38, 0.98], 46), trav: {...TRAV0, mood: 'shock', look: -0.9}, cond: {p: [-1.24, 0, 0.98], ry: 0.25, glow: 0.6 + clamp((t - S(8, 1)) / 1.5) * 1.6, point: 0, s: 1.0, sit: true}, train: {...dark1, led: '', ledSub: '', lightsOn: 0, dark: 1}, shake: 0.002};
  if (t < L(9) && !inRewind) return {set: 'black', cam: {pos: [0, 0, 0], look: [0, 0, -1], fov: 50}};
  // ---- rewind ----
  if (t < S(9, 1) && !inRewind) {
    const k = (LE(8) - L(5)) / (S(9, 1) - L(9));
    return world(LE(8) - (t - L(9)) * k, true);
  }
  // ---- WAY B: get off ----
  if (t < L(10)) return {set: 'train', cam: mv(t, S(9, 1), L(10), [-0.7, 1.55, -2.9], [0.4, 1.45, -5.1], [1.5, 1.1, -6.65], [1.6, 1.1, -6.65], 50)};
  if (t < S(10, 1)) {
    const k = clamp((t - L(10)) / 1.0);
    return {set: 'train', cam: mv(t, L(10), S(10, 1), [3.9, 1.5, -3.3], [3.6, 1.45, -3.9], [1.6, 1.0, -6.65], [2.2, 1.1, -6.6], 50), trav: {p: [0.9 + k * 1.6, 0, -6.65 + k * 0.2], ry: Math.PI / 2 - k * 0.6, sit: false, walk: k < 1 ? (t - L(10)) * 1.7 : 0, mood: 'stern', look: 0}};
  }
  const pf = flickAt(t), lf = lastFlick(t);
  const condZ = lf < 3 ? null : lf < 5 ? -7.0 : lf < 7 ? -4.3 : -2.4;
  const condB: Cond | null = condZ === null ? null : {p: [condZ < -5 ? 3.45 : condZ < -3 ? 3.3 : 3.12, 0, condZ], ry: -0.05, glow: 1.2, point: 0, s: 1.08};
  const travB: Trav = {p: [2.8, 0, -1.2], ry: 0, sit: false, mood: lf >= 3 ? 'shock' : 'stern', look: Math.sin(t * 2) * 0.6, breathe: t * 0.8};
  if (t < S(11, 0)) return {set: 'train', cam: mv(t, S(10, 1), S(11, 0), [2.9, 1.65, 3.4], [2.9, 1.6, 2.4], [2.8, 1.3, -6], [2.8, 1.35, -6], 50), trav: travB, cond: condB, train: {platFlicker: pf}};
  if (t < S(11, 1)) return {set: 'train', cam: mv(t, S(11, 0), S(11, 1), [2.9, 1.6, 2.3], [2.9, 1.58, 1.9], [2.8, 1.35, -6], [2.8, 1.4, -6], 50), trav: travB, cond: condB, train: {platFlicker: pf}, shake: 0.002};
  if (t < L(12)) return {set: 'train', cam: mv(t, S(11, 1), L(12), [2.72, 1.75, 0.55], [2.76, 1.74, 0.25], [2.8, 1.78, -1.4], [2.8, 1.8, -1.4], 46), trav: {...travB, mood: 'shock', look: -0.2}, cond: condB, train: {platFlicker: pf}, shake: 0.003};
  // ---- stairs → morning ----
  if (t < S(12, 1)) {
    const k = clamp((t - L(12)) / (S(12, 1) - L(12)));
    const z = 1.0 - k * 4.4, y = stairY(z);
    return {set: 'stairs', cam: {pos: [0.5, y + 1.25 + 0.05 * Math.sin(t * 9), z + 3.0], look: [0, y + 1.2, z - 1.5], fov: 54}, trav: {p: [0, y, z], ry: Math.PI, sit: false, walk: t * 2.4, run: 1, mood: 'shock'}, flick: Math.sin(t * 37) > 0.3 ? 1 : 0.1, shake: 0.004};
  }
  const hero: Trav = {p: [0, 0, 0], ry: 0, sit: false, mood: 'stern', look: 0, breathe: t * 0.6};
  if (t < S(12, 2)) return {set: 'morning', cam: mv(t, S(12, 1), S(12, 2), [0.4, 1.15, 4.6], [0.3, 1.55, 3.6], [0, 1.35, 0], [0, 1.45, 0], 52), hero: {...hero, look: Math.sin(t * 2) * 0.5}};
  if (t < S(12, 3)) {
    const b = t > S(12, 2) + 0.38 && t < S(12, 2) + 0.38 + 3 / 60;
    return {set: 'morning', cam: mv(t, S(12, 2), S(12, 3), [-1.6, 1.7, 5.6], [1.5, 1.7, 5.2], [0, 1.2, -2], [0.6, 1.2, -3], 50), hero: {...hero, mood: 'calm'}, bait: b};
  }
  if (t < L(13)) return {set: 'morning', cam: mv(t, S(12, 3), L(13), [0.15, 1.75, 1.35], [0.1, 1.74, 1.05], [0, 1.72, 0], [0, 1.72, 0], 42), hero: {...hero, mood: 'calm', headRoll: 0.08}};
  if (t < L(14)) return {set: 'morning', cam: mv(t, L(13), L(14), [0.6, 1.5, 2.9], [0.5, 1.45, 2.5], [0, 1.25, 0], [0.05, 1.2, 0], 48), hero: {...hero, mood: 'stern', pocket: ease(clamp((t - L(13) - 0.2) / 0.7))}};
  // ---- ticket ----
  const TK: V3 = [0, 1.25, 0.45];
  if (t < S(14, 1)) return {set: 'ticket', cam: mv(t, L(14), S(14, 1), [0.02, 1.3, 1.45], [0.0, 1.28, 1.25], TK, TK, 40), tint: 0};
  if (t < S(14, 2)) return {set: 'ticket', cam: mv(t, S(14, 1), S(14, 2), [-0.045, 1.26, 1.08], [-0.048, 1.255, 1.0], [-0.048, 1.25, 0.45], [-0.048, 1.25, 0.45], 40), tint: 0};
  if (t < L(15)) return {set: 'ticket', cam: mv(t, S(14, 2), L(15), [-0.1, 1.21, 0.96], [-0.108, 1.205, 0.86], [-0.108, 1.2, 0.45], [-0.108, 1.2, 0.45], 40), tint: clamp((t - S(14, 2) - 0.3) / 1.2), shake: 0.0015};
  // ---- L15 loop back to frame 0 ----
  return {set: 'train', cam: mv(t, L(15), PZ_DURATION, [0.0, 1.43, 3.55], OPEN_FROM, [-0.33, 1.4, -1.4], OPEN_LOOK, 54), trav: TRAV0, cond: {p: COND_AISLE, ry: -0.1, glow: 1, point: 0, s: 1.08}};
}

// hits for zoom punches (also used by the music script)
export const HITS = () => [0, L(4) + 0.2, S(4, 1), S(4, 2), Wd(7, 'drei'), Wd(7, 'zwei'), Wd(7, 'eins'), S(8, 1) + 0.1, LE(8) + 0.3, L(10), S(10, 2), S(11, 0), S(11, 1), S(14, 2) + 0.3];

const World: React.FC<{st: St; t: number}> = ({st, t}) => {
  const sh = st.shake ?? 0;
  const pos: V3 = [st.cam.pos[0] + Math.sin(t * 23) * sh + Math.sin(t * 0.9) * 0.01, st.cam.pos[1] + Math.sin(t * 29 + 1) * sh + Math.sin(t * 1.3) * 0.008, st.cam.pos[2]];
  return (
    <>
      <Cam pos={pos} look={st.cam.look} fov={st.cam.fov} />
      {st.set === 'train' ? <TrainSet t={t} {...(st.train ?? {})} /> : null}
      {st.set === 'stairs' ? <StairsSet t={t} flick={st.flick ?? 1} /> : null}
      {st.set === 'morning' ? <MorningSet t={t} bait={st.bait} hero={st.hero ? <TravelerHD {...st.hero} /> : null} /> : null}
      {st.set === 'ticket' ? <MorningSet t={t} people={false} hero={<TicketProp p={[0, 1.25, 0.45]} tint={st.tint ?? 0} />} /> : null}
      {st.set === 'black' ? <color attach="background" args={['#000']} /> : null}
      {st.trav ? <TravelerHD {...st.trav} /> : null}
      {st.cond ? <Conductor {...st.cond} /> : null}
    </>
  );
};

const CaptionNow: React.FC<{t: number}> = ({t}) => {
  const c = tm.caps.find((x) => t >= x.start - 0.04 && t < x.end + 0.18);
  return c ? <Caption text={c.text} /> : null;
};

export const PlatformZero: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const st = world(t);
  const morning = st.set === 'morning' || st.set === 'ticket';
  const rewind = t >= L(9) && t < S(9, 1);
  const punch = HITS().reduce((acc, h) => (t >= h && t < h + 0.4 ? Math.max(acc, 0.07 * Math.exp(-(t - h) * 10)) : acc), 0);
  const white = st.set === 'morning' ? clamp(1 - (t - S(12, 1)) / 0.45) : 0;
  const lightsOutBlack = t >= L(8) && t < S(8, 1) ? 0.55 : 0;
  // chips
  let chipsOn = false, active: 0 | 1 | null = null;
  if (t >= S(5, 1) && t < L(6)) chipsOn = true;
  if (t >= L(6) && t < LE(8) + 0.3) { chipsOn = true; active = 0; }
  if (t >= S(9, 1) && t < LE(14)) { chipsOn = true; active = 1; }
  const chipIn = spring({frame: frame - Math.round(S(5, 1) * fps), fps, config: {damping: 13}});
  const endIn = spring({frame: frame - Math.round((L(15) + 0.05) * fps), fps, config: {damping: 14}});
  const end = t >= L(15);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1 + punch})`}}>
        <ThreeCanvas width={width} height={height} shadows dpr={1} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: morning ? 1.05 : 1.5}} camera={{fov: 50, near: 0.03, far: 160}}>
          <LambertCtx.Provider value><World st={st} t={t} /></LambertCtx.Provider>
        </ThreeCanvas>
      </AbsoluteFill>
      <FilmLook frame={frame} />
      {st.set === 'ticket' && (st.tint ?? 0) > 0 ? <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(120,0,0,0) 30%, rgba(90,0,0,${0.55 * (st.tint ?? 0)}) 100%)`}} /> : null}
      {rewind ? (
        <AbsoluteFill style={{background: 'rgba(20,24,40,.35)'}}>
          <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 2px, transparent 2px 6px)', transform: `translateY(${(t * 600) % 6}px)`}} />
          {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: ((t * (700 + i * 260) + i * 500) % 2100) - 100, height: 26 + i * 14, background: 'rgba(255,255,255,.13)', filter: 'blur(3px)'}} />)}
          <div style={{position: 'absolute', top: 250, left: 70, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 800, fontSize: 64, color: '#fff', textShadow: '3px 0 0 rgba(255,0,60,.7), -3px 0 0 rgba(0,200,255,.7)'}}>◀◀ REWIND</div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#fff', opacity: white}} />
      <AbsoluteFill style={{background: '#000', opacity: lightsOutBlack}} />
      {/* hook text, frame 0 */}
      {t < 2.4 ? <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 86, lineHeight: 1.05, color: '#fff', textShadow: '0 6px 26px rgba(0,0,0,.95)'}}>WOULD YOU<br /><span style={{color: '#ff3b3b'}}>GET OFF?</span></div> : null}
      {chipsOn && !end ? <div style={{transform: `scale(${t < L(6) ? chipIn : 1})`, position: 'absolute', inset: 0}}><Chips a="STAY ON THE TRAIN" b="GET OFF" active={active} top={150} /></div> : null}
      {end ? (
        <AbsoluteFill style={{background: `rgba(0,0,0,${0.5 * endIn})`}}>
          <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: '#fff', transform: `scale(${endIn})`, textShadow: '0 6px 26px rgba(0,0,0,.95)'}}>WHAT WOULD<br />YOU DO?</div>
          <div style={{position: 'absolute', top: 790, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: `scale(${endIn})`}}>
            {[['#e8343a', 'STAY ON THE TRAIN'], ['#2fbf71', 'GET OFF']].map(([c, txt]) => (
              <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: '#14161c', background: '#fff', borderRadius: 999, padding: '14px 34px 14px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 30px rgba(0,0,0,.5)'}}>
                <span style={{width: 34, height: 34, borderRadius: 17, background: c}} />{txt}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {!rewind ? <CaptionNow t={t} /> : null}
      <Audio src={staticFile('pz_voice.wav')} />
      <Audio src={staticFile('pz_music.wav')} volume={0.55} />
    </AbsoluteFill>
  );
};

/** quick stills for checking every scene */
export const PZ_CHECK_TIMES = (): number[] => [0.3, 1.6, L(1) + 0.8, S(1, 1) + 0.3, CAP('THE CAR') + 0.3, L(2) + 0.5, S(2, 1) + 0.5, S(2, 2) + 0.3, L(3) + 0.4, S(3, 1) + 0.4, L(4) + 0.8, S(4, 1) + 0.4, S(4, 2) + 0.6, L(5) + 1.2, S(5, 1) + 0.4, L(6) + 0.4, S(6, 1) + 0.8, L(7) + 0.8, S(7, 1) + 0.3, Wd(7, 'drei') + 0.2, Wd(7, 'zwei') + 0.2, Wd(7, 'eins') + 0.6, L(8) + 0.3, S(8, 1) + 1.0, L(9) + 0.4, S(9, 1) + 0.4, L(10) + 0.6, S(10, 1) + 0.2, S(10, 2) + 0.4, S(11, 0) + 0.6, S(11, 1) + 0.5, L(12) + 0.8, S(12, 1) + 0.5, S(12, 2) + 0.39, S(12, 3) + 0.3, L(13) + 1.0, L(14) + 0.5, S(14, 1) + 0.4, S(14, 2) + 0.9, L(15) + 0.8];
