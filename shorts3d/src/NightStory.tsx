// "Flight 404" — 60 s story in the dark night-liminal style (original story + characters).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {GEO, M, Roman, T} from './hd';
import {Attendant, Cam, GateDetails, Halo, Seat, Traveler} from './NightGate';
import timing from './timing_f404.json';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
export const F404_DURATION = timing.duration + 3.0;

// ---------- textures ----------
function boardTex(morning: boolean) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#07090c'; g.fillRect(0, 0, 1024, 512);
  g.font = '700 46px "IBM Plex Mono", monospace'; g.fillStyle = '#e8eef5'; g.fillText('DEPARTURES', 40, 70);
  const rows = morning
    ? [['06:40', 'OSLO', 'ON TIME'], ['07:05', 'LISBON', 'ON TIME'], ['07:20', 'TALLINN', 'BOARDING'], ['07:35', 'VIENNA', 'ON TIME']]
    : [['01:40', 'OSLO', 'CANCELLED'], ['02:05', 'LISBON', 'CANCELLED'], ['02:20', 'TALLINN', 'CANCELLED'], ['03:33', 'FLIGHT 404', 'BOARDING']];
  rows.forEach((r, i) => {
    const y = 150 + i * 88;
    g.fillStyle = '#e8eef5'; g.fillText(r[0], 40, y); g.fillText(r[1], 230, y);
    g.fillStyle = r[2] === 'CANCELLED' ? '#ff4b4b' : r[2] === 'BOARDING' ? '#ffb347' : '#5bd47a'; g.fillText(r[2], 660, y);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function passTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 420;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 1024, 420);
  g.fillStyle = '#7a1f2a'; g.fillRect(0, 0, 1024, 70);
  g.fillStyle = '#fff'; g.font = '800 44px Inter, Arial'; g.fillText('BOARDING PASS', 30, 50);
  g.fillStyle = '#5a5f6a'; g.font = '600 26px Inter, Arial';
  [['PASSENGER', 30, 120], ['FLIGHT', 30, 250], ['GATE', 280, 250], ['SEAT', 480, 250], ['DEPARTS', 680, 250]].forEach(([s, x, y]) => g.fillText(s as string, x as number, y as number));
  g.fillStyle = '#14161c'; g.font = '800 64px Inter, Arial'; g.fillText('YOU', 30, 190);
  g.font = '800 70px Inter, Arial'; g.fillText('404', 30, 330); g.fillText('B7', 280, 330); g.fillText('—', 480, 330); g.fillText('03:33', 680, 330);
  for (let i = 0; i < 40; i++) { g.fillStyle = '#14161c'; g.fillRect(860 + (i % 2 ? 2 : 0) + i * 3.2, 110, (i * 7) % 3 + 1, 90); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const Pass: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => {
  const tex = useMemo(passTex, []);
  return <mesh position={p} rotation={r} scale={s}><planeGeometry args={[0.6, 0.25]} /><meshStandardMaterial map={tex} roughness={0.6} side={THREE.DoubleSide} /></mesh>;
};

// ---------- world ----------
export type World = {
  t: number; morning: boolean; lightsOn: number; flickerBlack: boolean;
  attendant: {p: V3; ry: number; glow: number; visible: boolean};
  traveler: {p: V3; ry: number; sit: boolean; walk: number; mood: any; look: number; holdPass: boolean};
  passOnDesk: number; doorOpen: number; crowd: boolean;
};
export const NightWorld: React.FC<World> = (w) => {
  const boardN = useMemo(() => boardTex(false), []);
  const boardM = useMemo(() => boardTex(true), []);
  const floor = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d')!;
    g.fillStyle = '#2b2a28'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const {t} = w;
  const dark = w.flickerBlack ? 0.04 : 1;
  const day = w.morning;
  // ceiling strips: index 0 = nearest the camera side (z=4) … index 6 farthest; lightsOn counts from the back (desk side) forward
  return (
    <>
      <color attach="background" args={[day ? '#9fb3c8' : '#050608']} />
      <fog attach="fog" args={[day ? '#b9c7d6' : '#07080b', day ? 14 : 8, day ? 50 : 30]} />
      <ambientLight intensity={(day ? 0.9 : 0.3) * dark} />
      <hemisphereLight args={[day ? '#f2f6ff' : '#3a4a70', day ? '#8a7a66' : '#1a120a', (day ? 1.4 : 0.5) * dark]} />
      {day ? <directionalLight position={[-8, 8, 4]} intensity={2.4} color="#fff2dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} /> : null}
      {Array.from({length: 7}).map((_, i) => {
        const on = (7 - i) <= w.lightsOn ? 0 : 1; // lights go out from the camera side backwards
        const k = (i % 3 === 1 ? 0.06 : 1) * on * dark * (day ? 0.4 : 1);
        return (
          <group key={i} position={[0, 5.2, 4 - i * 4]}>
            <mesh scale={[0.18, 0.04, 2.4]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={k > 0.05 ? '#dfe8ff' : '#2a2d33'} toneMapped={false} /></mesh>
            <pointLight position={[0, -0.3, 0]} color="#cfdcff" intensity={9 * k} distance={9} decay={1.5} />
            {k > 0.5 ? <Halo p={[0, -0.2, 0]} s={2.6} color="#cfdcff" o={0.35} /> : null}
          </group>
        );
      })}
      {!day ? <pointLight position={[1.4, 2.4, -3.4]} color="#ff9a3c" intensity={22 * dark} distance={9} decay={1.5} castShadow /> : null}
      {!day ? <spotLight position={[-1.5, 5, 2]} angle={0.5} penumbra={0.8} intensity={30 * dark * (w.lightsOn >= 6 ? 0 : 1)} distance={14} color="#ffd9a0" castShadow target-position={[-1.5, 0, -1]} /> : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 60]} /><meshStandardMaterial map={floor} roughness={day ? 0.4 : 0.18} metalness={day ? 0.1 : 0.35} color={day ? '#c9c4bc' : '#ffffff'} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.35, 0]}><planeGeometry args={[40, 60]} /><meshStandardMaterial color={day ? '#cfd3da' : '#0e1014'} /></mesh>
      {/* back wall with jet-bridge door */}
      <mesh position={[0, 2.7, -6.6]}><planeGeometry args={[30, 5.4]} /><meshStandardMaterial color={day ? '#b8bec8' : '#101217'} roughness={0.9} /></mesh>
      <group position={[-2.6, 0, -6.55]}>
        <T geo={GEO.box} color={day ? '#8a909a' : '#2a2d33'} p={[0, 1.4, 0]} s={[1.8, 2.9, 0.1]} o={0.01} />
        <mesh position={[0, 1.35, 0.06]}><planeGeometry args={[1.5, 2.6]} /><meshBasicMaterial color="#000000" /></mesh>
        {/* sliding door panels */}
        <T geo={GEO.box} color={day ? '#6e747e' : '#3a3e46'} p={[-0.38 - w.doorOpen * 0.75, 1.35, 0.1]} s={[0.76, 2.6, 0.05]} o={0.01} />
        <T geo={GEO.box} color={day ? '#6e747e' : '#3a3e46'} p={[0.38 + w.doorOpen * 0.75, 1.35, 0.1]} s={[0.76, 2.6, 0.05]} o={0.01} />
        {w.doorOpen > 0.3 && !day ? <mesh position={[0, 1.2, 0.07]} scale={0.04}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ff3b3b" toneMapped={false} /></mesh> : null}
      </group>
      {/* seats */}
      {Array.from({length: 4}).map((_, r) => Array.from({length: 7}).map((__, c) => <Seat key={r + '-' + c} p={[-2.6 + c * 0.66, 0, 3.0 - r * 2.2]} />))}
      {/* desk + board */}
      <group position={[1.5, 0, -4.6]} rotation={[0, -0.2, 0]}>
        <T geo={GEO.rbox} color="#2a2420" p={[0, 0.55, 0]} s={[2.6, 1.1, 0.8]} o={0.01} />
        <T geo={GEO.box} color="#8a3a1f" p={[0, 1.12, 0]} s={[2.7, 0.06, 0.9]} o={0} />
        <mesh position={[0, 3.6, -0.6]}><planeGeometry args={[2.8, 1.4]} /><meshBasicMaterial map={day ? boardM : boardN} toneMapped={false} /></mesh>
        <mesh position={[0, 4.55, -0.6]}><planeGeometry args={[1.2, 0.35]} /><meshBasicMaterial color="#ffb347" toneMapped={false} /></mesh>
        {w.passOnDesk > 0 ? <Pass p={[-0.05, 1.16, 0.45 - (1 - w.passOnDesk) * 0.5]} r={[-Math.PI / 2, 0, 0.1]} /> : null}
      </group>
      {/* ceiling speaker */}
      <group position={[1.6, 5.25, 1.9]}>
        <T geo={GEO.cyl} color="#c9ced6" s={[0.3, 0.06, 0.3]} o={0.008} />
        {Array.from({length: 4}).map((_, k) => <mesh key={k} position={[0, -0.04, -0.15 + k * 0.1]} scale={[0.4, 0.01, 0.02]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#555b66" /></mesh>)}
      </group>
      {!day ? <GateDetails t={t} /> : null}
      {w.attendant.visible && !day ? <Attendant p={w.attendant.p} ry={w.attendant.ry} s={0.72} glow={w.attendant.glow} /> : null}
      <Traveler p={w.traveler.p} ry={w.traveler.ry} mood={w.traveler.mood} look={w.traveler.look} sit={w.traveler.sit} walk={w.traveler.walk}
        armR={w.traveler.holdPass ? 1.3 : 0.2} handR={w.traveler.holdPass ? <Pass p={[0, -0.1, 0.12]} r={[0.3, 0, 0]} s={0.6} /> : undefined} />
      {/* morning crowd (generic travelers) */}
      {w.crowd ? [[3, 3], [6, 0], [5, 1], [0, 2], [3, 2], [6, 2], [1, 3], [4, 3], [5, 3]].map(([c, r], i) => (
        <group key={i} position={[-2.6 + c * 0.66, -0.45, 3.0 - r * 2.2]} scale={0.7}>
          <Roman robe={['#c0392b', '#2d6bd9', '#f0b429', '#7a3fb5', '#2fa84f'][i % 5]} trim="#333" skin={['#f3c9a4', '#e0b08a', '#d9a47c', '#f6d2b5', '#c98f68'][i % 5]} hairStyle={i % 2 ? 'curly' : 'caesar'} hair={['#2e2016', '#6b4426', '#e8c45a', '#1a1a1a'][i % 4]} mood="calm" look={0.3} bob={t + i} />
        </group>
      )) : null}
      {day ? <M geo={GEO.box} color="#e9ecf2" p={[-5, 2.7, 0]} s={[0.1, 5.4, 30]} o={0} /> : null}
    </>
  );
};

// ---------- story timeline ----------
type Shot = {at: number; from: V3; to: V3; la: V3; lb: V3; dur: number; fov: number; follow?: boolean};
const S = (at: number, from: V3, to: V3, la: V3, lb: V3, dur: number, fov: number, follow = false): Shot => ({at, from, to, la, lb, dur, fov, follow});
const TRAV_SEAT: V3 = [-1.28, 0, 0.8];
const SHOTS: Shot[] = [
  S(0, [-0.2, 1.7, 4.4], [-0.35, 1.6, 3.7], [-1.25, 1.0, 0.75], [-1.25, 1.0, 0.75], 2.4, 44),
  S(L(1) - 0.1, [-0.2, 2.6, 8.6], [-0.2, 2.9, 9.6], [0.5, 1.2, -2.6], [0.5, 1.2, -2.6], 2.0, 52),
  S(L(2) - 0.15, [0.3, 2.9, 1.6], [0.5, 3.0, 0.8], [1.65, 3.4, -5.2], [1.65, 3.4, -5.2], 2.6, 50),
  S(L(3) - 0.1, [0.9, 3.2, -0.6], [1.05, 3.25, -1.2], [1.7, 3.35, -5.2], [1.7, 3.3, -5.2], 1.6, 46),
  S(L(4) - 0.15, [2.6, 3.4, 4.6], [2.4, 3.7, 4.0], [1.6, 5.2, 1.9], [1.6, 5.25, 1.9], 3.2, 46),
  S(L(5) - 0.15, [0.4, 1.7, 2.0], [0.9, 1.6, -0.6], [1.5, 1.5, -5.3], [1.5, 1.6, -5.3], 2.4, 44),
  S(L(6) - 0.1, [-0.2, 2.8, 9.0], [-0.2, 3.0, 9.6], [0.4, 1.2, -2.6], [0.4, 1.2, -2.6], 2.0, 52),
  S(L(7) - 0.1, [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], 1, 50, true),
  S(L(8) - 0.1, [2.2, 2.6, -3.3], [2.1, 2.5, -3.55], [1.42, 1.12, -4.15], [1.42, 1.12, -4.2], 2.4, 44),
  S(L(9) - 0.1, [1.2, 2.0, -3.4], [1.0, 2.1, -3.0], [-0.6, 1.4, 4.0], [-0.6, 1.4, 4.0], 2.6, 54),
  S(L(10) - 0.1, [-0.2, 1.8, -2.4], [-0.9, 1.7, -3.4], [-2.6, 1.4, -6.5], [-2.6, 1.4, -6.5], 3.0, 48),
  S(L(12) - 0.1, [-0.6, 1.7, 3.4], [-0.75, 1.6, 3.0], [-1.25, 1.0, 0.75], [-1.25, 1.0, 0.75], 1.4, 44),
  S(L(13) - 0.1, [-0.9, 2.3, 5.6], [-1.0, 2.2, 5.2], [-0.4, 1.2, -2.5], [-0.4, 1.2, -2.5], 6.0, 50),
  S(L(15) - 0.1, [-0.6, 1.5, 2.9], [-0.7, 1.45, 2.6], [-1.25, 1.0, 0.75], [-1.25, 1.0, 0.75], 2.0, 40),
  S(L(16) - 0.1, [-0.2, 2.6, 8.6], [-0.2, 2.8, 9.2], [0.4, 1.2, -2.6], [0.4, 1.2, -2.6], 3.4, 52),
  S(L(17) - 0.1, [1.2, 3.3, -2.0], [1.3, 3.4, -2.6], [1.65, 3.6, -5.2], [1.65, 3.6, -5.2], 2.6, 44),
  S(L(18) - 0.1, [0.4, 1.9, 4.4], [0.3, 1.85, 4.0], [-0.8, 1.0, 0.8], [-0.8, 1.0, 0.8], 2.0, 52),
  S(L(19) - 0.1, [-0.2, 2.8, 9.0], [-0.2, 3.2, 10.0], [0.4, 1.2, -2.6], [0.4, 1.2, -2.6], 5.0, 52),
];

const WALK_PTS: V3[] = [TRAV_SEAT, [-1.28, 0, 1.6], [2.1, 0, 1.6], [2.1, 0, -2.2], [0.8, 0, -3.0]];
function walkPos(u: number): {p: V3; ry: number} {
  const segs = WALK_PTS.length - 1; const x = Math.min(segs - 0.0001, Math.max(0, u * segs)); const i = Math.floor(x); const f = x - i;
  const a = WALK_PTS[i], b = WALK_PTS[i + 1];
  return {p: [a[0] + (b[0] - a[0]) * f, 0, a[2] + (b[2] - a[2]) * f], ry: Math.atan2(b[0] - a[0], b[2] - a[2])};
}

function stateAt(t: number): {w: World; cam: {pos: V3; look: V3; fov: number; cutAt: number}} {
  const r = (a: number, d: number) => interpolate(t, [a, a + d], [0, 1], cl);
  const w: World = {
    t, morning: false, lightsOn: 0, flickerBlack: false,
    attendant: {p: [1.5, 0, -5.3], ry: -0.2, glow: 0.7 + 0.3 * Math.sin(t * 2), visible: true},
    traveler: {p: TRAV_SEAT, ry: 0.45, sit: true, walk: 0, mood: t < 1.2 ? 'calm' : 'stern', look: t > 1.2 ? Math.sin((t - 1.2) * 1.6) * 0.9 : 0, holdPass: false},
    passOnDesk: 0, doorOpen: 0, crowd: false,
  };
  // path A: walk to the desk
  if (t >= L(7) - 0.1 && t < L(11) - 0.1) {
    const u = r(L(7) - 0.1, LE(7) - L(7) + 1.2);
    const wp = walkPos(u);
    w.traveler = {p: wp.p, ry: u < 1 ? wp.ry : Math.PI, sit: false, walk: u < 1 ? t * 2.2 : 0, mood: 'stern', look: 0, holdPass: t > LE(8) - 0.3};
    w.passOnDesk = t < LE(8) - 0.3 ? r(L(8) + 0.2, 0.8) : 0;
    w.lightsOn = Math.floor(interpolate(t, [L(9) + 0.2, LE(9) + 0.4], [0, 6.99], cl));
    w.doorOpen = r(L(10) + 0.2, 1.4);
    w.attendant.glow = t > L(10) ? 1.5 : w.attendant.glow;
    if (t >= L(10) - 0.1) w.traveler.ry = Math.PI + 0.6;
  }
  // path B: stay seated, flickers bring him closer
  if (t >= L(12) - 0.1 && t < L(16) - 0.1) {
    const step = t < L(13) + 1.4 ? 0 : t < L(14) + 0.3 ? 1 : 2;
    const pts: V3[] = [[1.5, 0, -5.3], [2.1, 0, -2.6], [2.1, 0, -0.6]];
    w.attendant.p = pts[step]; w.attendant.ry = step ? -Math.PI / 2 - 0.3 : -0.2; w.attendant.glow = 1.1;
    w.flickerBlack = (t > L(13) + 1.1 && t < L(13) + 1.45) || (t > L(14) + 0.05 && t < L(14) + 0.35);
    w.traveler.mood = t > L(15) - 0.1 ? 'calm' : 'shock'; w.traveler.look = 0.7;
  }
  // morning
  if (t >= L(16) - 0.1 && t < L(19) - 0.1) {
    w.morning = true; w.crowd = true; w.attendant.visible = false;
    w.traveler.mood = t > L(18) ? 'shock' : 'stern'; w.traveler.look = 0.4;
    w.traveler.holdPass = t > L(18) + 0.3;
  }
  // camera
  let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i]; const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  let pos = lp(s.from, s.to), look = lp(s.la, s.lb);
  if (s.follow) { const tp = w.traveler.p; pos = [tp[0] + 1.8, 3.0, tp[2] + 4.6]; look = [tp[0] - 0.2, 1.1, tp[2] - 2.5]; }
  pos[0] += Math.sin(t * 0.9) * 0.01; pos[1] += Math.sin(t * 1.3 + 1) * 0.008;
  return {w, cam: {pos, look, fov: s.fov, cutAt: s.at}};
}

const Caption: React.FC<{t: number}> = ({t}) => {
  const ws = timing.words;
  let i = ws.findIndex((w) => t >= w.start && t < w.end + 0.1);
  if (i < 0) { const nx = ws.findIndex((w) => t < w.start); i = nx > 0 ? nx - 1 : nx === 0 ? -1 : ws.length - 1; }
  if (i < 0) return null;
  const ln = timing.lines[ws[i].line];
  if (t > ln[1] + 0.3) return null;
  const short = (k: number) => ws[k].text.replace(/[^A-Za-z0-9]/g, '').length <= 3;
  let start = i;
  if (i > 0 && short(i - 1) && ws[i - 1].line === ws[i].line && !(i > 1 && short(i - 2) && ws[i - 2].line === ws[i].line)) start = i - 1;
  const chunk = [ws[start], ...(short(start) && start + 1 < ws.length && ws[start + 1].line === ws[start].line ? [ws[start + 1]] : [])];
  return <div style={{position: 'absolute', top: 1060, left: 40, right: 40, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 66, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', textShadow: '0 4px 18px rgba(0,0,0,.9)'}}>{chunk.map((w) => w.text).join(' ')}</div>;
};

const Chips: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => {
  if (t < L(6) - 0.1) return null;
  const active = t >= L(7) - 0.1 && t < L(11) - 0.1 ? 'walk' : t >= L(12) - 0.1 && t < L(19) - 0.1 ? 'stay' : 'both';
  const big = t >= L(19) - 0.1;
  const s = spring({frame: frame - Math.round((L(6) + 0.3) * fps), fps, config: {damping: 14}});
  const items = [['#e8343a', 'STAY SEATED', 'stay'], ['#2fbf71', 'WALK TO THE DESK', 'walk']].filter(([, , k]) => active === 'both' || active === k);
  return (
    <div style={{position: 'absolute', top: big ? 820 : 120, left: 0, right: 0, display: 'flex', flexDirection: big ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: big ? 24 : 18, transform: `scale(${s})`}}>
      {items.map(([c, txt]) => (
        <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: big ? 44 : 26, color: '#14161c', background: '#fff', borderRadius: 999, padding: big ? '14px 32px 14px 20px' : '8px 18px 8px 12px', display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{width: big ? 32 : 22, height: big ? 32 : 22, borderRadius: 16, background: c}} />{txt}
        </span>
      ))}
    </div>
  );
};

export const Flight404: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const {w, cam} = stateAt(t);
  const fadeIn = interpolate(t, [0, 0.6], [1, 0], cl);
  const closeEyes = interpolate(t, [LE(15) - 0.2, LE(15) + 0.5, L(16) - 0.25, L(16) + 0.1], [0, 1, 1, 0], cl);
  const doorBlack = interpolate(t, [LE(10) + 0.3, LE(10) + 0.8], [0, 1], cl) * (t < L(11) + 0.1 ? 1 : 0);
  const rewind = t >= L(11) - 0.1 && t < L(12) - 0.1;
  const endBlack = interpolate(t, [L(19) - 0.3, L(19)], [0, 0.55], cl);
  return (
    <AbsoluteFill style={{backgroundColor: '#050608'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: w.morning ? 1.15 : 1.65}} camera={{fov: 44, near: 0.05, far: 140}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <NightWorld {...w} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 48%, rgba(0,0,0,${w.morning ? 0.35 : 0.7}) 100%)`}} />
      {rewind ? (
        <AbsoluteFill style={{background: 'rgba(10,10,14,.55)'}}>
          <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 2px, transparent 2px 6px)', transform: `translateY(${(t * 400) % 6}px)`}} />
          <div style={{position: 'absolute', top: 160, left: 70, fontFamily: FONT, fontWeight: 900, fontSize: 90, color: '#fff'}}>◀◀</div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, closeEyes, doorBlack, endBlack)}} />
      <Chips t={t} frame={frame} fps={fps} />
      {t >= L(19) - 0.1 ? <div style={{position: 'absolute', top: 640, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 70, lineHeight: 1.1, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.9)'}}>WHAT WOULD<br />YOU DO?</div> : null}
      {t < L(19) - 0.1 ? <Caption t={t} /> : null}
      <Audio src={staticFile('f404_voice.wav')} />
      <Audio src={staticFile('f404_music.wav')} />
    </AbsoluteFill>
  );
};
