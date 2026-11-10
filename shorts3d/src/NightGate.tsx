// Dark cinematic "liminal night airport" look — original characters.
import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import timing from './timing_gate.json';
import {ThreeCanvas} from '@remotion/three';
import {GEO, HEAD_Y, M, Roman, T} from './hd';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

function boardTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#07090c'; g.fillRect(0, 0, 1024, 512);
  g.font = '700 46px "IBM Plex Mono", monospace'; g.fillStyle = '#e8eef5';
  g.fillText('DEPARTURES', 40, 70);
  const rows = [['01:40', 'OSLO', 'CANCELLED'], ['02:05', 'LISBON', 'CANCELLED'], ['02:20', 'TALLINN', 'CANCELLED'], ['02:35', 'HOME', 'BOARDING']];
  rows.forEach((r, i) => {
    const y = 150 + i * 88;
    g.fillStyle = '#e8eef5'; g.fillText(r[0], 40, y); g.fillText(r[1], 230, y);
    g.fillStyle = r[2] === 'BOARDING' ? '#ffb347' : '#ff4b4b'; g.fillText(r[2], 640, y);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function floorTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#2b2a28'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// original antagonist: faceless uniformed attendant with a glowing amber visor slit
export const Attendant: React.FC<{p: V3; ry?: number; s?: number; glow?: number}> = ({p, ry = 0, s = 1, glow = 1}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Roman robe="#1b1d24" trim="#7a1f2a" skin="#3a3d45" hairStyle="none" mood="calm" armR={0.15} armL={0.15} />
    {/* smooth faceless head shell over the cartoon head */}
    <T geo={GEO.sphere} color="#4a4e58" p={[0, HEAD_Y, 0]} s={[0.8, 0.74, 0.74]} o={0.02} />
    <mesh position={[0, HEAD_Y + 0.05, 0.75]} scale={[0.56, 0.06, 0.06]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={new THREE.Color('#ffb347').multiplyScalar(1 + glow)} toneMapped={false} /></mesh>
    <pointLight position={[0, HEAD_Y + 0.05, 1.1]} color="#ffb347" intensity={0.8 * glow} distance={2.2} />
    {/* cap + badge */}
    <T geo={GEO.cyl} color="#14161c" p={[0, HEAD_Y + 0.62, 0]} s={[0.62, 0.22, 0.62]} o={0.015} />
    <T geo={GEO.cyl} color="#14161c" p={[0, HEAD_Y + 0.5, 0.35]} s={[0.5, 0.04, 0.4]} o={0.01} />
    <M geo={GEO.box} color="#d9a83a" p={[0.16, 1.8, 0.3]} s={[0.14, 0.06, 0.02]} o={0} />
  </group>
);

export const Traveler: React.FC<{p: V3; ry?: number; mood?: any; look?: number; sit?: boolean}> = ({p, ry = 0, mood = 'calm', look = 0, sit}) => (
  <group position={[p[0], p[1] - (sit ? 0.45 : 0), p[2]]} rotation={[0, ry, 0]} scale={0.7}>
    <Roman robe="#1f8a8a" trim="#156a6a" skin="#f2c4a0" hairStyle="curly" hair="#2e2016" mood={mood} look={look} armR={0.2} armL={0.2} />
    {/* parka hood ring */}
    <T geo={GEO.torus} color="#176f6f" p={[0, 2.05, -0.05]} r={[Math.PI / 2, 0, 0]} s={[0.36, 0.34, 1.6]} o={0.012} />
  </group>
);

const Seat: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <T geo={GEO.rbox} color="#1c1f26" p={[0, 0.55, 0]} s={[0.62, 0.1, 0.6]} o={0.008} />
    <T geo={GEO.rbox} color="#1c1f26" p={[0, 0.95, -0.27]} r={[-0.15, 0, 0]} s={[0.62, 0.75, 0.08]} o={0.008} />
    <M geo={GEO.box} color="#6b717c" p={[0.33, 0.7, 0]} s={[0.04, 0.32, 0.5]} o={0} />
  </group>
);

const Cam: React.FC<{pos: V3; look: V3; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos); (camera as THREE.PerspectiveCamera).fov = fov; camera.updateProjectionMatrix(); camera.lookAt(...look);
  return null;
};

export const GateSet: React.FC<{t: number; travelerMood?: any; travelerLook?: number; glow?: number; flicker?: number}> = ({t, travelerMood = 'calm', travelerLook = 0.6, glow, flicker = 0}) => {
  const board = useMemo(boardTex, []);
  const floor = useMemo(floorTex, []);
  return (
    <>
      <color attach="background" args={['#050608']} />
      <fog attach="fog" args={['#07080b', 8, 30]} />
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#3a4a70', '#1a120a', 0.5]} />
      {/* ceiling light strips (cool) */}
      {Array.from({length: 7}).map((_, i) => (
        <group key={i} position={[0, 5.2, 4 - i * 4]}>
          <mesh scale={[0.18, 0.04, 2.4]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#dfe8ff" toneMapped={false} /></mesh>
          <pointLight position={[0, -0.3, 0]} color="#cfdcff" intensity={(i % 3 === 1 ? 0.6 : 9) * (i === 5 ? 1 - flicker : 1)} distance={9} decay={1.5} />
        </group>
      ))}
      {/* warm practicals near the gate desk */}
      <pointLight position={[1.4, 2.4, -3.4]} color="#ff9a3c" intensity={22} distance={9} decay={1.5} castShadow />
      <spotLight position={[-1.5, 5, 2]} angle={0.5} penumbra={0.8} intensity={30} distance={14} color="#ffd9a0" castShadow target-position={[-1.5, 0, -1]} />
      {/* floor (polished) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 60]} /><meshStandardMaterial map={floor} roughness={0.18} metalness={0.35} /></mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.35, 0]}><planeGeometry args={[40, 60]} /><meshStandardMaterial color="#0e1014" /></mesh>
      {/* window wall with plane outside */}
      <group position={[-5, 0, 0]}>
        {Array.from({length: 9}).map((_, i) => <T key={i} geo={GEO.box} color="#15171c" p={[0, 2.7, 6 - i * 3]} s={[0.15, 5.4, 0.2]} o={0} />)}
        <mesh position={[-0.05, 2.7, -6]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[30, 5.4]} /><meshStandardMaterial color="#0b1220" transparent opacity={0.35} roughness={0.05} metalness={0.6} /></mesh>
      </group>
      <group position={[-13, 0.2, -6]} rotation={[0, 0.3, 0]}>
        <T geo={GEO.cap} color="#c9ced6" p={[0, 3.2, 0]} r={[Math.PI / 2, 0, 0]} s={[3.2, 9, 3.2]} o={0} />
        <T geo={GEO.box} color="#aab0ba" p={[0, 3.0, 0]} s={[16, 0.25, 2.6]} o={0} />
        {Array.from({length: 10}).map((_, i) => <mesh key={i} position={[1.62, 3.8, -4 + i * 0.9]} scale={0.12}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>)}
        <mesh position={[0, 6.6, 7.6]} scale={0.18}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={Math.sin(t * 4) > 0 ? '#ff3b3b' : '#330808'} toneMapped={false} /></mesh>
      </group>
      {/* seat rows */}
      {Array.from({length: 4}).map((_, r) => Array.from({length: 7}).map((__, c) => <Seat key={r + '-' + c} p={[-2.6 + c * 0.66, 0, 3.0 - r * 2.2]} />))}
      {/* gate desk + departure board */}
      <group position={[1.5, 0, -4.6]} rotation={[0, -0.2, 0]}>
        <T geo={GEO.rbox} color="#2a2420" p={[0, 0.55, 0]} s={[2.6, 1.1, 0.8]} o={0.01} />
        <T geo={GEO.box} color="#8a3a1f" p={[0, 1.12, 0]} s={[2.7, 0.06, 0.9]} o={0} />
        <mesh position={[0, 3.6, -0.6]}><planeGeometry args={[2.8, 1.4]} /><meshBasicMaterial map={board} toneMapped={false} /></mesh>
        <mesh position={[0, 4.55, -0.6]}><planeGeometry args={[1.2, 0.35]} /><meshBasicMaterial color="#ffb347" toneMapped={false} /></mesh>
      </group>
      <Attendant p={[1.5, 0, -5.3]} ry={-0.2} s={0.72} glow={glow ?? 0.7 + 0.3 * Math.sin(t * 2)} />
      <Traveler p={[-1.28, 0, 0.8]} ry={0.45} mood={travelerMood} look={travelerLook} sit />
    </>
  );
};

export const NightGateStill: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#050608'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.6}} camera={{fov: 40, near: 0.1, far: 120}}>
        <Cam pos={[-0.2, 2.7, 8.8]} look={[0.5, 1.2, -2.6]} fov={52} />
        <GateSet t={t} />
      </ThreeCanvas>
      {/* film look: vignette + slight grain */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,.7) 100%)'}} />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
        {[['#e8343a', 'STAY SEATED'], ['#2fbf71', 'WALK TO THE DESK']].map(([c, txt]) => (
          <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#14161c', background: '#fff', borderRadius: 999, padding: '8px 18px 8px 12px', display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{width: 22, height: 22, borderRadius: 11, background: c}} />{txt}
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: 1, textShadow: '0 4px 18px rgba(0,0,0,.9)'}}>NO PASSENGERS.</div>
    </AbsoluteFill>
  );
};

// ---------- short animated reference scene ----------
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const GL = (i: number) => timing.lines[i][0];
export const GATE_DURATION = timing.duration + 1.4;
type Sh = {at: number; from: V3; to: V3; la: V3; lb: V3; dur: number; fov: number};
const GSHOTS: Sh[] = [
  {at: 0, from: [-0.2, 1.7, 4.4], to: [-0.35, 1.6, 3.7], la: [-1.25, 1.0, 0.75], lb: [-1.25, 1.0, 0.75], dur: 3.0, fov: 44},
  {at: GL(1) - 0.15, from: [-0.2, 2.5, 8.2], to: [-0.2, 2.8, 9.2], la: [0.5, 1.2, -2.6], lb: [0.5, 1.2, -2.6], dur: 2.0, fov: 52},
  {at: GL(2) - 0.15, from: [0.4, 1.7, 2.0], to: [0.9, 1.6, -0.6], la: [1.5, 1.5, -5.3], lb: [1.5, 1.6, -5.3], dur: 2.4, fov: 44},
  {at: GL(3) - 0.2, from: [1.1, 1.9, -1.9], to: [1.2, 1.9, -2.5], la: [1.5, 1.85, -5.3], lb: [1.5, 1.85, -5.3], dur: 2.0, fov: 40},
];
function gcam(t: number) {
  let i = 0; for (let k = 0; k < GSHOTS.length; k++) if (t >= GSHOTS[k].at) i = k;
  const s = GSHOTS[i]; const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to); pos[0] += Math.sin(t * 0.9) * 0.01; pos[1] += Math.sin(t * 1.3 + 1) * 0.008;
  return {pos, look: lp(s.la, s.lb), fov: s.fov, cutAt: s.at};
}
const GateCaption: React.FC<{t: number}> = ({t}) => {
  const ws = timing.words;
  let i = ws.findIndex((w) => t >= w.start && t < w.end + 0.1);
  if (i < 0) { const nx = ws.findIndex((w) => t < w.start); i = nx > 0 ? nx - 1 : nx === 0 ? -1 : ws.length - 1; }
  if (i < 0) return null;
  const ln = timing.lines[ws[i].line];
  if (t > ln[1] + 0.3) return null;
  const short = (k: number) => ws[k].text.replace(/[^A-Za-z]/g, '').length <= 3;
  const start = i > 0 && short(i - 1) && ws[i - 1].line === ws[i].line ? i - 1 : i;
  const chunk = [ws[start], ...(short(start) && start + 1 < ws.length && ws[start + 1].line === ws[start].line && start + 1 !== i + 1 ? [ws[start + 1]] : [])];
  return <div style={{position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', textShadow: '0 4px 18px rgba(0,0,0,.9)'}}>{chunk.map((w) => w.text).join(' ')}</div>;
};
export const NightGateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = gcam(t);
  const woke = t > 1.1;
  const look = woke ? Math.sin((t - 1.1) * 1.6) * 0.9 : 0;
  const glow = interpolate(t, [GL(3) + 0.3, GL(3) + 0.8], [0.6, 1.5], cl);
  const flicker = t > GL(3) - 0.2 && t < GL(3) + 0.9 ? (Math.sin(t * 47) > 0.2 ? 1 : 0) : 0;
  const black = interpolate(t, [timing.duration - 0.1, timing.duration + 0.05], [0, 1], cl);
  const fadeIn = interpolate(t, [0, 0.6], [1, 0], cl);
  const chipS = spring({frame: frame - Math.round((timing.duration + 0.15) * fps), fps, config: {damping: 14}});
  return (
    <AbsoluteFill style={{backgroundColor: '#050608'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.6}} camera={{fov: 40, near: 0.05, far: 120}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <GateSet t={t} travelerMood={woke ? 'stern' : 'calm'} travelerLook={look} glow={glow} flicker={flicker} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(black, fadeIn)}} />
      {t > timing.duration + 0.1 ? (
        <div style={{position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: `scale(${chipS})`}}>
          {[['#e8343a', 'STAY SEATED'], ['#2fbf71', 'WALK TO THE DESK']].map(([c2, txt]) => (
            <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#14161c', background: '#fff', borderRadius: 999, padding: '12px 28px 12px 18px', display: 'flex', alignItems: 'center', gap: 14}}>
              <span style={{width: 30, height: 30, borderRadius: 15, background: c2}} />{txt}
            </span>
          ))}
        </div>
      ) : null}
      {black < 1 ? <GateCaption t={t} /> : null}
      <Audio src={staticFile('gate_voice.wav')} />
      <Audio src={staticFile('gate_music.wav')} />
    </AbsoluteFill>
  );
};
