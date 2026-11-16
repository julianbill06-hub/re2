// Final Call Stories – Folge 3 „Closing Time“ (60 fps): leeres Weihnachts-Kaufhaus, Gegenspieler „The Greeter“.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {GEO, LambertCtx, M, T} from './hd';
import {Cam, Halo} from './NightGate';
import {Bone, Caption, Chips, FilmLook, Pal, TravelerHD} from './NightTrain';
import {Greeter, MallSet} from './MallRef';
import tm from './timing_ct.json';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
export const CT_DURATION = tm.duration;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const L = (i: number) => tm.lines[i][0];
const LE = (i: number) => tm.lines[i][1];
const CAP = (txt: string) => tm.caps.find((c) => c.text === txt)!.start;

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}

// ---------- Umkleide ----------
const FittingRoom: React.FC<{t: number; bulb: number; hero: React.ReactNode}> = ({t, bulb, hero}) => {
  const sign = useMemo(() => canvasTex(512, 160, (g) => { g.fillStyle = '#1b1414'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#e8d8b0'; g.font = '800 64px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FITTING ROOM 3', 256, 84); }), []);
  const flick = bulb * (Math.sin(t * 43) > -0.85 ? 1 : 0.4);
  return (
    <>
      <color attach="background" args={['#050404']} />
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#5a4a3a', '#120c08', 0.25]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6, 6]} /><meshStandardMaterial color="#4a2a2a" roughness={0.95} /></mesh>
      <mesh position={[0, 1.5, -0.65]} receiveShadow><planeGeometry args={[2.4, 3]} /><meshStandardMaterial color="#b9a88a" roughness={0.9} /></mesh>
      <mesh position={[1.15, 1.5, 0.4]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[2.4, 3]} /><meshStandardMaterial color="#a8987a" roughness={0.9} /></mesh>
      <mesh position={[-1.15, 1.5, 0.4]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.4, 3]} /><meshStandardMaterial color="#a8987a" roughness={0.9} /></mesh>
      {/* Spiegel links */}
      <group position={[-1.12, 1.25, 0.25]} rotation={[0, Math.PI / 2, 0]}>
        <M geo={GEO.box} color="#c9a64a" s={[0.75, 1.75, 0.04]} o={0.004} />
        <mesh position={[0, 0, 0.025]}><planeGeometry args={[0.65, 1.65]} /><meshStandardMaterial color="#8fa2b6" metalness={0.9} roughness={0.08} /></mesh>
      </group>
      {/* Bank + Kleiderhaken mit Pulli */}
      <T geo={GEO.rbox} color="#5a3a24" p={[0, 0.43, -0.32]} s={[1.5, 0.08, 0.5]} o={0.008} />
      {[-0.6, 0.6].map((x) => <T key={x} geo={GEO.box} color="#3a2414" p={[x, 0.2, -0.32]} s={[0.06, 0.4, 0.4]} o={0} />)}
      <M geo={GEO.cyl} color="#c9a64a" p={[0.55, 2.05, -0.6]} r={[Math.PI / 2, 0, 0]} s={[0.025, 0.14, 0.025]} o={0} />
      <T geo={GEO.rbox} color="#b0142a" p={[0.55, 1.72, -0.55]} s={[0.5, 0.6, 0.08]} o={0.008} />
      <T geo={GEO.rbox} color="#ece6da" p={[0.55, 1.6, -0.5]} s={[0.5, 0.06, 0.02]} o={0} />
      {/* Vorhang rechts vorne */}
      <M geo={GEO.cyl} color="#c9a64a" p={[0, 2.62, 1.3]} r={[0, 0, Math.PI / 2]} s={[0.025, 2.4, 0.025]} o={0} />
      {Array.from({length: 9}).map((_, i) => <T key={'cu' + i} geo={GEO.cyl} color={i % 2 ? '#5a0f18' : '#4a0c14'} p={[-1.05 + i * 0.08, 1.3, 1.3 + Math.sin(i * 1.7) * 0.04]} s={[0.06, 2.6, 0.06]} o={0.004} />)}
      <mesh position={[0, 2.85, -0.62]}><planeGeometry args={[0.9, 0.28]} /><meshBasicMaterial map={sign} toneMapped={false} /></mesh>
      {/* Glühbirne */}
      <mesh position={[0, 2.7, 0.1]} scale={0.07}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color={new THREE.Color('#ffd28a').multiplyScalar(0.3 + 1.6 * flick)} toneMapped={false} /></mesh>
      <Halo p={[0, 2.7, 0.15]} s={1.2} color="#ffcf8a" o={0.4 * flick} />
      <pointLight position={[0, 2.55, 0.3]} color="#ffcf8a" intensity={14 * flick} distance={6} castShadow />
      {hero}
    </>
  );
};

// ---------- Morgen draußen ----------
const PEOPLE: {x0: number; z: number; v: number; pal: Partial<Pal>; hair: 'curly' | 'caesar' | 'bald'}[] = [
  {x0: -5, z: -1.6, v: 1.0, pal: {parka: '#c0532d', dark: '#8a3a1f', jeans: '#3a3a3a', shoe: '#222', skin: '#d9a07a', hair: ['#1a1a1a']}, hair: 'caesar'},
  {x0: 4, z: -0.9, v: -0.9, pal: {parka: '#5a4a8a', dark: '#3e3266', jeans: '#2b2b33', shoe: '#e9e4dc', skin: '#8d5a3c', hair: ['#111']}, hair: 'bald'},
  {x0: -1, z: -2.6, v: 1.1, pal: {parka: '#e0b02a', dark: '#a8821c', jeans: '#334466', shoe: '#5a3a22', skin: '#f2c4a0', hair: ['#a0522d', '#8a4426', '#b35f33']}, hair: 'curly'},
  {x0: 6, z: 1.6, v: -1.2, pal: {parka: '#2d6b3a', dark: '#1f4a28', jeans: '#222b3a', shoe: '#ddd', skin: '#c68c64', hair: ['#3a2416']}, hair: 'caesar'},
  {x0: -3, z: 2.2, v: 0.8, pal: {parka: '#8a8f99', dark: '#5f646c', jeans: '#1d2433', shoe: '#7a2a2a', skin: '#e8b48e', hair: ['#d9c39a', '#c9b08a']}, hair: 'curly'},
  {x0: 2, z: -3.2, v: -0.95, pal: {parka: '#b8364a', dark: '#82222f', jeans: '#2b3a5c', shoe: '#f1efe9', skin: '#6b4430', hair: ['#0e0e0e']}, hair: 'bald'},
];
const MorningSet: React.FC<{t: number; children?: React.ReactNode; bait?: boolean; people?: boolean}> = ({t, children, bait, people = true}) => {
  const facade = useMemo(() => canvasTex(1024, 256, (g) => { g.fillStyle = '#2a3b2f'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#f2e6c8'; g.font = '800 120px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DEPARTMENT STORE', 512, 136); }), []);
  const snow = useMemo(() => Array.from({length: 120}).map((_, i) => [rnd(i) * 12 - 6, rnd(i + 50), rnd(i + 99) * 10 - 6, rnd(i + 200)]), []);
  return (
    <>
      <color attach="background" args={['#cfe0ef']} />
      <fog attach="fog" args={['#dbe6f0', 10, 40]} />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#eef6ff', '#9a9088', 1.1]} />
      <directionalLight position={[6, 9, 7]} intensity={2.4} color="#ffe2b8" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#e9edf2" roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.005, 0.5]}><planeGeometry args={[40, 5]} /><meshStandardMaterial color="#b9bcc0" roughness={0.8} /></mesh>
      {/* Fassade mit Glastüren */}
      <T geo={GEO.box} color="#c8b89a" p={[0, 3.2, -4.2]} s={[20, 6.4, 0.4]} o={0.006} />
      <mesh position={[0, 4.9, -3.98]}><planeGeometry args={[5.2, 1.3]} /><meshBasicMaterial map={facade} /></mesh>
      {[-1.6, 0, 1.6].map((x) => (
        <group key={x} position={[x, 0, -3.98]}>
          <mesh position={[0, 1.25, 0.01]}><planeGeometry args={[1.4, 2.5]} /><meshStandardMaterial color="#5a7590" roughness={0.1} metalness={0.5} /></mesh>
          <M geo={GEO.box} color="#3a3a3a" p={[0, 2.52, 0.03]} s={[1.5, 0.06, 0.06]} o={0} />
          <M geo={GEO.box} color="#3a3a3a" p={[0.72, 1.25, 0.03]} s={[0.06, 2.5, 0.06]} o={0} />
        </group>
      ))}
      {/* Kränze */}
      {[-4.2, 4.2].map((x) => (
        <group key={'w' + x} position={[x, 2.4, -3.9]}>
          <T geo={GEO.torus} color="#1f5a32" s={[0.5, 0.5, 2.2]} o={0.008} />
          <T geo={GEO.box} color="#b0142a" p={[0, -0.45, 0.08]} s={[0.3, 0.16, 0.05]} o={0.004} />
        </group>
      ))}
      {/* Schaufenster */}
      {[-6.5, 6.5].map((x) => <mesh key={'sw' + x} position={[x, 1.6, -3.98]}><planeGeometry args={[3, 2.2]} /><meshStandardMaterial color="#6d5638" emissive="#ffcf8a" emissiveIntensity={0.25} /></mesh>)}
      {/* Laternen + Schneehaufen + Tannen */}
      {[-3.4, 3.4].map((x) => (
        <group key={'l' + x} position={[x, 0, 2.9]}>
          <M geo={GEO.cyl} color="#2a2e33" p={[0, 1.6, 0]} s={[0.06, 3.2, 0.06]} o={0.004} />
          <T geo={GEO.box} color="#2a2e33" p={[0, 3.3, 0]} s={[0.3, 0.35, 0.3]} o={0.006} />
          <T geo={GEO.sphere} color="#f4f6f8" p={[0.5, 0.1, 0.3]} s={[0.7, 0.25, 0.5]} o={0.004} />
        </group>
      ))}
      {[-8, -6.2, 6.2, 8].map((x, i) => (
        <group key={'tr' + i} position={[x, 0, -2.8]}>
          <T geo={GEO.cone} color="#1d4a2e" p={[0, 1.1, 0]} s={[0.8, 2.2, 0.8]} o={0.01} />
          <T geo={GEO.cone} color="#f2f5f8" p={[0, 1.95, 0]} s={[0.42, 0.6, 0.42]} o={0.006} />
        </group>
      ))}
      {snow.map(([x, ph, z, d], i) => <mesh key={'s' + i} position={[x, 5 - ((ph * 5 + t * (0.3 + d * 0.3)) % 5), z]} scale={0.015 + d * 0.02}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
      {people ? PEOPLE.map((c, i) => {
        let x = c.x0 + c.v * t * 0.9; x = ((x + 9) % 18 + 18) % 18 - 9;
        return <TravelerHD key={i} p={[x, 0, c.z]} ry={c.v > 0 ? Math.PI / 2 : -Math.PI / 2} sit={false} walk={t * 0.85 * Math.abs(c.v) + i * 0.3} mood={i % 2 ? 'calm' : 'grin'} pal={c.pal} hairStyle={c.hair} scarf={i % 2 === 0} />;
      }) : null}
      {bait ? <Greeter p={[2.4, 0, -2.4]} ry={-0.3} s={0.74} glow={1.6} /> : null}
      {children}
    </>
  );
};

// Papiertüte + Kassenbon
const bagTex = () => canvasTex(256, 256, (g) => { g.fillStyle = '#c9a072'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#1f6f4a'; g.font = '800 40px Arial'; g.textAlign = 'center'; g.fillText('THANK', 128, 120); g.fillText('YOU', 128, 166); });
const Bag: React.FC<{p: V3}> = ({p}) => {
  const tx = useMemo(bagTex, []);
  return (
    <group position={p}>
      <T geo={GEO.box} color="#c9a072" map={tx} p={[0, -0.22, 0]} s={[0.34, 0.4, 0.16]} o={0.008} />
      <T geo={GEO.torus} color="#7a5a3a" p={[0, 0.0, 0]} s={[0.08, 0.1, 0.25]} o={0.004} />
    </group>
  );
};
const receiptTex = () => canvasTex(512, 1024, (g) => {
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(90,80,60,${rnd(i) * 0.06})`; g.fillRect(rnd(i + 1) * 512, rnd(i + 2) * 1024, 2, 2); }
  g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.font = '700 46px "Courier New", monospace';
  g.fillText('DEPARTMENT', 256, 90); g.fillText('STORE', 256, 140);
  g.font = '600 32px "Courier New", monospace'; g.fillText('24.12.   00:00', 256, 210); g.fillText('- - - - - - - - - - -', 256, 250);
  g.textAlign = 'left'; g.fillText('1x  YOU', 40, 320); g.textAlign = 'right'; g.fillText('0.00', 472, 320);
  g.textAlign = 'left'; g.fillText('1x  NIGHT', 40, 370); g.textAlign = 'right'; g.fillText('0.00', 472, 370);
  g.textAlign = 'center'; g.fillText('- - - - - - - - - - -', 256, 420);
  g.font = '700 40px "Courier New", monospace'; g.textAlign = 'left'; g.fillText('TOTAL', 40, 480); g.textAlign = 'right'; g.fillText('0.00', 472, 480);
  g.textAlign = 'center'; g.font = '600 32px "Courier New", monospace'; g.fillText('THANK YOU', 256, 580); g.fillText('FOR SHOPPING', 256, 620);
  g.fillStyle = '#0f7a3e'; g.font = '800 50px "Courier New", monospace'; g.fillText('COME BACK', 256, 730); g.fillText('TONIGHT', 256, 790);
  for (let x = 90; x < 420; x += 6) if (rnd(x) > 0.35) { g.fillStyle = '#1b1b1b'; g.fillRect(x, 860, rnd(x + 1) > 0.5 ? 4 : 2, 90); }
});
const ReceiptProp: React.FC<{p: V3}> = ({p}) => {
  const tx = useMemo(receiptTex, []);
  return (
    <group position={p} rotation={[-0.06, 0, -0.04]}>
      <mesh castShadow><planeGeometry args={[0.15, 0.3]} /><meshStandardMaterial map={tx} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      {/* Daumen + Finger + Unterarm */}
      <T geo={GEO.sphere} color="#f2c4a0" p={[-0.068, -0.11, 0.014]} s={[0.022, 0.03, 0.015]} o={0.005} />
      {[0, 1, 2].map((k) => <Bone key={k} a={[-0.11, -0.13 + k * 0.022, -0.03]} b={[-0.075, -0.125 + k * 0.022, -0.012]} r={0.011} color="#f2c4a0" o={0.005} />)}
      <T geo={GEO.sphere} color="#f2c4a0" p={[-0.12, -0.13, -0.035]} s={[0.04, 0.05, 0.028]} o={0.007} />
      <Bone a={[-0.32, -0.45, -0.2]} b={[-0.15, -0.15, -0.05]} r={0.05} color="#1f8a8a" />
      <T geo={GEO.cyl} color="#14605f" p={[-0.16, -0.17, -0.06]} r={[0.5, 0, -0.5]} s={[0.046, 0.04, 0.046]} o={0.008} />
    </group>
  );
};

// ---------- Zustand über die Zeit ----------
type CamS = {pos: V3; look: V3; fov: number};
type Trav = React.ComponentProps<typeof TravelerHD>;
type Gr = React.ComponentProps<typeof Greeter>;
type St = {set: 'mall' | 'fit' | 'morning' | 'receipt' | 'black'; cam: CamS; hero?: Trav | null; gr?: Gr | null; light?: number; board?: number; esc?: number; shake?: number; bait?: boolean; bulb?: number; bag?: boolean; tint?: number};
const lp = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mv = (t: number, t0: number, t1: number, from: V3, to: V3, la: V3, lb: V3, fov: number): CamS => {
  const k = ease(clamp((t - t0) / Math.max(0.01, t1 - t0)));
  return {pos: lp(from, to, k), look: lp(la, lb, k), fov};
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const HX = -0.3, HZ = 3.0;
const GS = 0.74;
const COLD_HERO: Trav = {p: [-0.3, 0, 3.3], ry: 0.15, sit: false, mood: 'shock', look: 0.7};
const COLD_GR: Gr = {p: [0.95, 0, 0.5], ry: -0.12, s: GS, glow: 1};
const OPEN_FROM: V3 = [0.35, 1.25, 8.0], OPEN_LOOK: V3 = [0.15, 2.3, -3];
const GT: V3 = [1.5, 0, -4.4]; const GT_RY = -0.24;
const slit = (g: V3, ry: number, d: number, y = 2.02): V3 => [g[0] + Math.sin(ry) * d, y, g[2] + Math.cos(ry) * d];
// Rolltreppe: Lauffläche y(z)
const escY = (z: number) => (z > -4.96 ? 0 : clamp(2.525 + (-9.5 - z) * 0.459, 0.44, 4.61));
const FL_B: [number, number][] = [];
const flicks = () => { if (!FL_B.length) { const a = L(17), b = L(18); [[a + 0.05, 0.1], [a + 0.42, 0.14], [b - 0.12, 0.16], [b + 0.33, 0.12], [b + 0.72, 0.16]].forEach((f) => FL_B.push(f as [number, number])); } return FL_B; };
const flickB = (t: number) => { for (const [s, l] of flicks()) if (t >= s && t < s + l) return 0.03; return 1; };
const lastB = (t: number) => { let n = -1; flicks().forEach(([s], i) => { if (t >= s) n = i; }); return n; };
// Weg B: Position der Hauptfigur
const runStart = () => LE(15) + 0.05;
function heroB(t: number): Trav {
  const t0 = runStart(), t1 = L(17), t2 = L(19) - 0.1, t3 = L(19) + 0.8;
  if (t < t1) { const k = clamp((t - t0) / (t1 - t0)); const p = lp([HX, 0, HZ], [2.6, 0, -5.2], k); return {p, ry: Math.atan2(2.6 - HX, -5.2 - HZ), sit: false, walk: (t - t0) * 2.6, run: 1, mood: 'shock', look: 0}; }
  if (t < t2) { const k = clamp((t - t1) / (t2 - t1)); const z = -5.2 + (-14.3 + 5.2) * k; return {p: [2.6, escY(z), z], ry: Math.PI, sit: false, walk: (t - t1) * 2.4, run: 1, mood: 'shock', look: 0}; }
  const k = clamp((t - t2) / (t3 - t2)); const z = -14.3 - k * 4.0; return {p: [2.6, 4.61, z], ry: Math.PI, sit: false, walk: k < 1 ? (t - t2) * 2.4 : 0, run: k < 1 ? 1 : 0, mood: 'stern', look: 0};
}

function world(t: number, inRewind = false): St {
  const hero: Trav = {p: [HX, 0, HZ], ry: Math.PI + 0.2, sit: false, mood: 'stern', look: 0, breathe: t * 0.5};
  const grT: Gr = {p: GT, ry: GT_RY, s: GS, glow: 1};
  // ---- L0 Cold Open (Frame 0 = Loop-Bild) ----
  if (t < 1.3) return {set: 'mall', cam: mv(t, 0, 1.3, OPEN_FROM, [0.3, 1.3, 7.2], OPEN_LOOK, [0.2, 2.25, -3], 56), hero: COLD_HERO, gr: COLD_GR, shake: 0.003};
  if (t < L(1)) { const s = slit(COLD_GR.p, COLD_GR.ry!, 2.6, 1.95); const e = slit(COLD_GR.p, COLD_GR.ry!, 2.0, 1.97); return {set: 'mall', cam: mv(t, 1.3, L(1), s, e, slit(COLD_GR.p, 0, 0, 1.92), slit(COLD_GR.p, 0, 0, 1.95), 36), gr: {...COLD_GR, glow: 1 + (t - 1.3) * 0.8}}; }
  // ---- L1 Umkleide ----
  const sleeper: Trav = {p: [0, 0, -0.05], ry: 0, sit: true, mood: 'calm', look: 0, headRoll: 0.28, breathe: t * 0.3};
  if (t < LE(1) + 0.15) return {set: 'fit', cam: mv(t, L(1), LE(1) + 0.15, [0.55, 1.4, 2.4], [0.4, 1.3, 1.9], [0, 0.95, -0.1], [0, 1.0, -0.1], 50), hero: sleeper, bulb: 1};
  // ---- L2 raus ins Dunkle ----
  if (t < L(3)) {
    const k = clamp((t - LE(1) - 0.15) / (L(3) - LE(1) - 0.15));
    const p = lp([-5.6, 0, 1.6], [-3.2, 0, -0.4], k);
    return {set: 'mall', cam: mv(t, LE(1) + 0.15, L(3), [-7.0, 1.75, 3.6], [-5.8, 1.8, 2.6], [-1, 2.4, -6], [0, 2.6, -6], 54), hero: {p, ry: Math.atan2(2.4, -2.0), sit: false, walk: t * 1.6, mood: 'stern', look: 0}};
  }
  // ---- L3 nur der Baum ----
  if (t < L(4)) return {set: 'mall', cam: mv(t, L(3), L(4), [1.6, 0.5, 0.8], [1.2, 1.5, 0.2], [-0.4, 3.6, -7.5], [-0.4, 4.6, -7.5], 56), hero: {p: [-3.0, 0, -0.6], ry: 2.6, sit: false, mood: 'stern', look: 0}};
  // ---- L4/L5 Durchsage ----
  if (t < L(5) + 0.5) return {set: 'mall', cam: mv(t, L(4), L(5) + 0.5, [-3.0, 6.0, -14.0], [-3.4, 6.4, -15.6], [-3.6, 6.6, -18.9], [-3.6, 6.6, -18.9], 40), board: t >= L(5) ? 1 : 0, shake: t >= L(5) ? 0.003 : 0};
  if (t < L(6)) return {set: 'mall', cam: mv(t, L(5) + 0.5, L(6), [HX - 0.35, 1.7, HZ - 1.75], [HX - 0.3, 1.7, HZ - 1.5], [HX, 1.6, HZ], [HX, 1.62, HZ], 42), hero: {...hero, mood: 'shock', look: Math.sin(t * 6) * 0.7}, shake: 0.0015};
  // ---- L6 jemand am Baum ----
  const flick6 = t > L(6) + 0.25 && t < L(6) + 0.37;
  if (t < L(7)) return {set: 'mall', cam: mv(t, L(6), L(7), [HX + 0.45, 1.85, HZ + 1.7], [HX + 0.4, 1.85, HZ + 1.2], [1.3, 1.8, -4.4], [1.4, 1.9, -4.4], 46), hero, gr: t > L(6) + 0.31 ? grT : null, light: flick6 ? 0.05 : 1};
  // ---- L7 kein Gesicht ----
  if (t < L(8)) return {set: 'mall', cam: mv(t, L(7), L(8), add(GT, [-0.3, 1.8, 4.2]), add(GT, [-0.25, 1.85, 3.4]), add(GT, [0, 1.65, 0]), add(GT, [0, 1.8, 0]), 44), gr: grT};
  // ---- L8 grünes Licht ----
  if (t < L(9)) return {set: 'mall', cam: mv(t, L(8), L(9), slit(GT, GT_RY, 2.8, 1.95), slit(GT, GT_RY, 2.0, 1.97), slit(GT, GT_RY, 0, 1.92), slit(GT, GT_RY, 0, 1.95), 36), gr: {...grT, glow: 1 + clamp((t - L(8)) / 1.0) * 1.5}, shake: 0.001};
  // ---- L9 Entscheidung ----
  const mid9 = (L(9) + LE(9)) / 2;
  if (t < mid9) return {set: 'mall', cam: mv(t, L(9), mid9, [HX + 0.8, 1.9, HZ + 2.5], [HX + 0.65, 1.9, HZ + 2.1], [0.6, 1.6, -3.5], [0.7, 1.6, -3.5], 50), hero, gr: grT};
  if (t < L(10)) return {set: 'mall', cam: mv(t, mid9, L(10), [HX - 0.35, 1.7, HZ - 1.75], [HX - 0.3, 1.7, HZ - 1.5], [HX, 1.6, HZ], [HX, 1.62, HZ], 42), hero: {...hero, mood: 'shock', look: Math.sin(t * 7) > 0 ? 0.9 : -0.7}};
  // ---- WEG A: stehen bleiben ----
  if (t < L(11)) return {set: 'mall', cam: mv(t, L(10), L(11), [3.6, 1.4, 4.6], [3.3, 1.45, 4.3], [HX, 1.2, HZ], [HX, 1.25, HZ], 48), hero: {...hero, mood: 'stern', breathe: t * 1.6}};
  if (t < L(12)) return {set: 'mall', cam: mv(t, L(11), L(12), add(GT, [-0.9, 1.5, 3.6]), add(GT, [-0.8, 1.5, 3.1]), add(GT, [0, 1.35, 0]), add(GT, [0, 1.4, 0]), 46), gr: {...grT, armUp: 0.7, ring: (t - L(11)) * 3}};
  const rings = [L(12) - 0.05, L(12) + 0.45, L(12) + 0.95];
  const nR = rings.filter((r) => t >= r).length;
  const GA: V3[] = [GT, [1.0, 0, -1.6], [0.5, 0, 0.3], [0.15, 0, 1.55]];
  const gA: Gr = {p: GA[nR], ry: Math.atan2(HX - GA[nR][0], HZ - GA[nR][2]), s: GS, glow: 1 + nR * 0.3, armUp: 0.7, ring: (t - L(12)) * 3};
  const darkA = rings.some((r) => t >= r && t < r + 0.07);
  if (t < LE(12) + 0.45) return {set: 'mall', cam: mv(t, L(12), LE(12) + 0.45, [HX + 0.55, 1.95, HZ + 1.6], [HX + 0.45, 1.9, HZ + 1.25], [0.6, 1.6, -1.5], [0.4, 1.7, -0.5], 50), hero: {...hero, mood: 'stern'}, gr: gA, light: darkA ? 0.03 : 1};
  // Stille → Licht aus, er steht hinter dir
  const whisper: Gr = {p: [HX + 0.3, 0, HZ + 0.5], ry: Math.PI + 0.2, s: GS, glow: 1.6, tilt: 0.25};
  if (t < L(13)) return {set: 'mall', cam: mv(t, LE(12) + 0.45, L(13), [HX - 0.2, 1.8, HZ - 1.5], [HX - 0.18, 1.8, HZ - 1.35], [HX + 0.05, 1.85, HZ], [HX + 0.05, 1.85, HZ], 46), hero: {...hero, mood: 'shock', look: 0}, light: 0.15};
  if (t < LE(13) + 0.25) return {set: 'mall', cam: mv(t, L(13), LE(13) + 0.25, [HX - 0.2, 1.85, HZ - 1.45], [HX - 0.12, 1.85, HZ - 1.0], [HX + 0.1, 1.88, HZ], [HX + 0.1, 1.88, HZ], 46), hero: {...hero, mood: 'shock', look: -0.9}, gr: whisper, light: 0.15, shake: 0.0015};
  if (t < L(14) && !inRewind) return {set: 'black', cam: {pos: [0, 0, 0], look: [0, 0, -1], fov: 50}};
  // ---- Rückspulen ----
  const rwEnd = L(15) + 0.45;
  if (t < rwEnd && !inRewind) { const k = (LE(13) + 0.2 - L(9)) / (rwEnd - L(14)); return world(LE(13) + 0.2 - (t - L(14)) * k, true); }
  if (t < runStart()) return {set: 'mall', cam: mv(t, rwEnd, runStart(), slit(GT, GT_RY, 2.4, 1.97), slit(GT, GT_RY, 1.9, 1.97), slit(GT, GT_RY, 0, 1.95), slit(GT, GT_RY, 0, 1.95), 34), gr: {...grT, glow: 2.6}, shake: 0.002};
  // ---- WEG B: rennen ----
  const hb = heroB(t);
  const esc = Math.max(0, t - runStart() - 0.5) * 0.6;
  if (t < L(17)) return {set: 'mall', cam: {pos: [hb.p[0] + 3.6, 1.5, hb.p[2] + 3.4], look: [hb.p[0], 1.1, hb.p[2] - 0.5], fov: 52}, hero: hb, gr: {...grT, ry: GT_RY + 0.8 * clamp((t - runStart()) / 0.8)}, esc, shake: 0.003};
  const lb = lastB(t);
  const GBZ = [-4.6, -6.6, -8.4, -10.2, -11.4];
  const gB: Gr | null = lb < 0 ? null : {p: [2.6, escY(GBZ[lb]), GBZ[lb]], ry: Math.PI, s: GS, glow: 1.3};
  const lightB = flickB(t);
  if (t < L(18)) return {set: 'mall', cam: {pos: [-1.0 + (t - L(17)) * 0.2, 4.4 + (t - L(17)) * 0.3, -3.6 - (t - L(17)) * 0.8], look: [hb.p[0], hb.p[1] + 0.8, hb.p[2] + 0.6], fov: 52}, hero: hb, gr: gB, esc, light: lightB, shake: 0.002};
  if (t < L(19)) return {set: 'mall', cam: mv(t, L(18), L(19), [3.15, 6.7, -16.2], [3.05, 6.6, -16.4], [2.6, 2.8, -8.5], [2.6, 3.3, -10], 50), hero: {...hb, ry: Math.PI}, gr: gB, esc, light: lightB, shake: 0.003};
  if (t < LE(19) + 0.25) return {set: 'mall', cam: mv(t, L(19), LE(19) + 0.25, [1.7, 6.1, -18.2], [1.85, 6.05, -18.0], [2.8, 5.7, -15.0], [2.75, 5.6, -15.6], 52), hero: {...hb, ry: Math.PI}, gr: {p: [2.6, escY(-13.6), -13.6], ry: Math.PI, s: GS, glow: 1.5}, esc};
  // ---- Morgen ----
  const hm: Trav = {p: [0, 0, 0], ry: 0, sit: false, mood: 'stern', look: 0, breathe: t * 0.9};
  const people = CAP('PEOPLE.');
  if (t < people) return {set: 'morning', cam: mv(t, LE(19) + 0.25, people, [0.6, 1.3, 4.6], [0.45, 1.45, 3.8], [0, 1.3, 0], [0, 1.4, 0], 52), hero: {...hm, look: Math.sin(t * 2) * 0.6}};
  if (t < CAP('YOU MADE IT.')) { const b = t > people + 0.32 && t < people + 0.32 + 3 / 60; return {set: 'morning', cam: mv(t, people, CAP('YOU MADE IT.'), [-2.2, 1.7, 6.0], [1.6, 1.7, 5.6], [0, 1.2, -2], [0.6, 1.2, -2.5], 50), hero: {...hm, mood: 'calm'}, bait: b}; }
  if (t < L(21)) return {set: 'morning', cam: mv(t, CAP('YOU MADE IT.'), L(21), [0.2, 1.65, 2.0], [0.15, 1.65, 1.7], [0, 1.6, 0], [0, 1.6, 0], 42), hero: {...hm, mood: 'calm', headRoll: 0.08}};
  if (t < L(22)) return {set: 'morning', cam: mv(t, L(21), L(22), [0.9, 1.45, 2.6], [0.75, 1.35, 2.2], [-0.15, 1.0, 0], [-0.2, 0.9, 0], 46), hero: {...hm, mood: 'stern', look: -0.3}, bag: true};
  // ---- Kassenbon ----
  const RC: V3 = [0, 1.25, 0.45];
  const mid22 = CAP('COME BACK');
  if (t < mid22) return {set: 'receipt', cam: mv(t, L(22), mid22, [0.02, 1.27, 1.2], [0.0, 1.26, 1.0], RC, RC, 40), tint: 0};
  if (t < L(23)) return {set: 'receipt', cam: mv(t, mid22, L(23), [0.0, 1.2, 0.8], [0.0, 1.19, 0.68], [0.0, 1.18, 0.45], [0.0, 1.18, 0.45], 40), tint: clamp((t - mid22 - 0.2) / 1.0), shake: 0.0012};
  // ---- L23 Loop zurück zu Frame 0 ----
  return {set: 'mall', cam: mv(t, L(23), CT_DURATION, [0.3, 1.3, 7.0], OPEN_FROM, [0.2, 2.25, -3], OPEN_LOOK, 56), hero: COLD_HERO, gr: COLD_GR};
}

export const HITS = () => [0, L(5), L(6) + 0.31, L(8), L(12) - 0.05, L(12) + 0.45, L(12) + 0.95, L(13), LE(13) + 0.25, L(15), runStart(), ...flicks().slice(1).map(([s]) => s + 0.1), CAP('COME BACK') + 0.2];

const World: React.FC<{st: St; t: number}> = ({st, t}) => {
  const sh = st.shake ?? 0;
  const pos: V3 = [st.cam.pos[0] + Math.sin(t * 23) * sh + Math.sin(t * 0.9) * 0.01, st.cam.pos[1] + Math.sin(t * 29 + 1) * sh + Math.sin(t * 1.3) * 0.008, st.cam.pos[2]];
  const heroN = st.hero ? <TravelerHD {...st.hero} /> : null;
  return (
    <>
      <Cam pos={pos} look={st.cam.look} fov={st.cam.fov} />
      {st.set === 'mall' ? <MallSet t={t} light={st.light ?? 1} boardMode={st.board ?? 1} esc={st.esc ?? 0}>{heroN}{st.gr ? <Greeter {...st.gr} /> : null}</MallSet> : null}
      {st.set === 'fit' ? <FittingRoom t={t} bulb={st.bulb ?? 1} hero={heroN} /> : null}
      {st.set === 'morning' ? <MorningSet t={t} bait={st.bait}>{heroN}{st.bag ? <Bag p={[-0.36, 0.78, 0.06]} /> : null}</MorningSet> : null}
      {st.set === 'receipt' ? <MorningSet t={t} people={false}><ReceiptProp p={[0, 1.25, 0.45]} /></MorningSet> : null}
      {st.set === 'black' ? <color attach="background" args={['#000']} /> : null}
    </>
  );
};

const CaptionNow: React.FC<{t: number}> = ({t}) => {
  const c = tm.caps.find((x) => t >= x.start - 0.04 && t < x.end + 0.15);
  return c ? <Caption text={c.text} /> : null;
};

export const ClosingTime: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const st = world(t);
  const morning = st.set === 'morning' || st.set === 'receipt';
  const rewind = t >= L(14) && t < L(15) + 0.45;
  const punch = HITS().reduce((acc, h) => (t >= h && t < h + 0.4 ? Math.max(acc, 0.075 * Math.exp(-(t - h) * 10)) : acc), 0);
  const white = morning ? clamp(1 - (t - LE(19) - 0.25) / 0.45) : (t > LE(19) - 0.25 && t < LE(19) + 0.25 ? clamp((t - LE(19) + 0.25) / 0.5) : 0);
  let chipsOn = false, active: 0 | 1 | null = null;
  if (t >= L(9) && t < L(10)) chipsOn = true;
  if (t >= L(10) && t < LE(13) + 0.25) { chipsOn = true; active = 0; }
  if (t >= L(15) + 0.45 && t < LE(22)) { chipsOn = true; active = 1; }
  const chipIn = spring({frame: frame - Math.round(L(9) * fps), fps, config: {damping: 13}});
  const endIn = spring({frame: frame - Math.round((L(23) + 0.05) * fps), fps, config: {damping: 14}});
  const end = t >= L(23);
  const tint = st.set === 'receipt' ? st.tint ?? 0 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1 + punch})`}}>
        <ThreeCanvas width={width} height={height} shadows dpr={1} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: morning ? 1.05 : 1.55}} camera={{fov: 50, near: 0.03, far: 160}}>
          <LambertCtx.Provider value><World st={st} t={t} /></LambertCtx.Provider>
        </ThreeCanvas>
      </AbsoluteFill>
      <FilmLook frame={frame} />
      {tint > 0 ? <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,80,30,0) 30%, rgba(0,60,25,${0.6 * tint}) 100%)`}} /> : null}
      {rewind ? (
        <AbsoluteFill style={{background: 'rgba(20,24,40,.35)'}}>
          <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 2px, transparent 2px 6px)', transform: `translateY(${(t * 600) % 6}px)`}} />
          {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: ((t * (700 + i * 260) + i * 500) % 2100) - 100, height: 26 + i * 14, background: 'rgba(255,255,255,.13)', filter: 'blur(3px)'}} />)}
          <div style={{position: 'absolute', top: 250, left: 70, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 800, fontSize: 64, color: '#fff', textShadow: '3px 0 0 rgba(255,0,60,.7), -3px 0 0 rgba(0,200,255,.7)'}}>◀◀ REWIND</div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#fff', opacity: white}} />
      {t < 2.4 ? <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 86, lineHeight: 1.05, color: '#fff', textShadow: '0 6px 26px rgba(0,0,0,.95)'}}>WOULD YOU<br /><span style={{color: GREENC}}>STAND STILL?</span></div> : null}
      {chipsOn && !end ? <div style={{transform: `scale(${t < L(10) ? chipIn : 1})`, position: 'absolute', inset: 0}}><Chips a="STAND STILL" b="RUN TO THE EXIT" active={active} top={150} /></div> : null}
      {end ? (
        <AbsoluteFill style={{background: `rgba(0,0,0,${0.5 * endIn})`}}>
          <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: '#fff', transform: `scale(${endIn})`, textShadow: '0 6px 26px rgba(0,0,0,.95)'}}>WHAT WOULD<br />YOU DO?</div>
          <div style={{position: 'absolute', top: 790, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: `scale(${endIn})`}}>
            {[['#e8343a', 'STAND STILL'], ['#2fbf71', 'RUN TO THE EXIT']].map(([c, txt]) => (
              <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: '#14161c', background: '#fff', borderRadius: 999, padding: '14px 34px 14px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 30px rgba(0,0,0,.5)'}}>
                <span style={{width: 34, height: 34, borderRadius: 17, background: c}} />{txt}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {!rewind && !end ? <CaptionNow t={t} /> : null}
      <Audio src={staticFile('ct_voice.wav')} />
      <Audio src={staticFile('ct_music.wav')} volume={0.55} />
    </AbsoluteFill>
  );
};
const GREENC = '#5dff9a';

/** Prüf-Zeitpunkte für Standbilder */
export const CT_CHECK = (): number[] => [0.3, 1.6, L(1) + 0.6, L(2) + 0.6, L(3) + 0.6, L(4) + 0.4, L(5) + 0.3, L(5) + 0.8, L(6) + 0.6, L(7) + 0.3, L(8) + 0.6, L(9) + 0.4, LE(9) - 0.3, L(10) + 0.4, L(11) + 0.4, L(12) + 0.2, L(12) + 1.1, LE(12) + 0.7, L(13) + 1.0, L(14) + 0.4, LE(15) - 0.2, runStart() + 0.6, L(17) + 0.3, L(18) + 0.2, L(18) + 0.9, L(19) + 0.4, L(20) + 0.3, CAP('PEOPLE.') + 0.33, L(21) - 0.2, L(21) + 0.8, L(22) + 0.5, L(23) - 0.4, L(23) + 0.8];
