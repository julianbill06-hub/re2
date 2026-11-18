import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {EffectComposer, Bloom, DepthOfField, Vignette, HueSaturation, BrightnessContrast} from '@react-three/postprocessing';
import {GEO, HEAD_Y, Head, M, Mood, StickBody, T} from './hd';
import timing from './timing_goldfish.json';
import env from './env_goldfish.json';

// ============ Mythos-Check #2: Goldfische haben ein 3-Sekunden-Gedächtnis ============
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
const WL = (line: number, prefix: string) => (timing.words.find((w) => w.line === line && w.text.startsWith(prefix)) ?? timing.words.find((w) => w.line === line)!).start;
export const GOLDFISH_DURATION = timing.duration + 1.0;
type V3 = [number, number, number];
type SetName = 'room' | 'lab';
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sstep = (a: number, b: number, x: number) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const talkAt = (t: number) => { const v = env.env[Math.floor(t * env.fps)] ?? 0; return v < 0.12 ? 0 : v < 0.3 ? 1 : v < 0.55 ? 2 : 3; };
const blinkAt = (t: number, seed = 0) => ((t + seed * 1.37) % 3.4) < 0.11;
const heading = (vx: number, vz: number) => Math.atan2(-vz, vx);

function cTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}
function useTex() {
  return useMemo(() => {
    const wood = cTex(512, 512, (g) => {
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#b07a48' : '#bb8552'; g.fillRect(0, k * 64, 512, 64); g.fillStyle = 'rgba(70,40,15,.45)'; g.fillRect(0, k * 64, 512, 3); }
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(80,45,15,.10)'; g.fillRect(rnd(i) * 512, rnd(i * 5) * 512, 40 + rnd(i * 9) * 80, 2); }
    }, [5, 5]);
    const wall = cTex(512, 512, (g) => {
      g.fillStyle = '#f3dcc0'; g.fillRect(0, 0, 512, 512);
      g.fillStyle = 'rgba(220,170,120,.25)'; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 26, 512);
    }, [6, 2]);
    const tiles = cTex(512, 512, (g) => {
      g.fillStyle = '#e9f2f3'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#c4d6da'; g.lineWidth = 6;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
    }, [8, 4]);
    const skyWin = cTex(256, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5aa7e6'); gr.addColorStop(1, '#d5eefc'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#fff'; [[60, 80, 30], [90, 70, 36], [120, 84, 26], [190, 140, 22], [210, 132, 28]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#7fb069'; g.fillRect(0, 210, 256, 46);
    });
    const poster = cTex(256, 340, (g) => {
      g.fillStyle = '#ffcf3a'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#e8343a'; g.font = '900 54px Inter, Arial'; g.textAlign = 'center';
      g.fillText('MYTH', 128, 120); g.fillText('CHECK', 128, 180); g.fillStyle = '#14161c'; g.font = '900 30px Inter, Arial'; g.fillText('#2', 128, 240);
    });
    return {wood, wall, tiles, skyWin, poster};
  }, []);
}

// ---------------- goldfish ----------------
const ORANGE = '#f5841f', BELLY = '#ffc15a', FIN = '#ffa93a';
const Goldfish: React.FC<{p: V3; ry?: number; s?: number; t: number; speed?: number; derp?: number; tilt?: number}> = ({p, ry = 0, s = 1, t, speed = 1, derp = 0, tilt = 0}) => {
  const w = Math.sin(t * (6 + speed * 6)) * (0.25 + 0.2 * speed);
  const pupil = (sd: number): V3 => derp > 0 ? [0.075 + Math.sin(t * 7 + sd) * 0.02 * derp, 0.03 * sd * derp, sd * 0.03 * derp] : [0.08, 0.01, 0];
  return (
    <group position={p} rotation={[0, ry, tilt]} scale={s}>
      <group rotation={[0, w * 0.15, 0]}>
        <T geo={GEO.sphere} color={ORANGE} s={[0.5, 0.36, 0.27]} o={0.02} />
        <T geo={GEO.sphere} color={BELLY} p={[0.05, -0.12, 0]} s={[0.36, 0.2, 0.22]} o={0} />
        {/* dorsal + side fins */}
        <T geo={GEO.sphere} color={FIN} p={[-0.02, 0.36, 0]} r={[0, 0, -0.3]} s={[0.2, 0.14, 0.03]} o={0.012} />
        {[-1, 1].map((sd) => <T key={sd} geo={GEO.sphere} color={FIN} p={[0.08, -0.16, sd * 0.24]} r={[sd * 0.6 + Math.sin(t * 8 + sd) * 0.3 * sd, 0, -0.5]} s={[0.14, 0.05, 0.08]} o={0.01} />)}
        {/* eyes */}
        {[-1, 1].map((sd) => (
          <group key={'e' + sd} position={[0.32, 0.08, sd * 0.17]}>
            <T geo={GEO.sphere} color="#ffffff" s={0.105} o={0.012} />
            <mesh position={pupil(sd)} scale={0.055}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#14161c" /></mesh>
            <mesh position={[0.11, 0.04, 0]} scale={0.018}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
          </group>
        ))}
        <T geo={GEO.torus} color="#c45a12" p={[0.49, -0.04, 0]} r={[0, Math.PI / 2, 0]} s={[0.05, 0.04, 0.6]} o={0} />
        {/* tail */}
        <group position={[-0.42, 0.02, 0]} rotation={[0, w, 0]}>
          <T geo={GEO.sphere} color={FIN} p={[-0.2, 0.14, 0]} r={[0, 0, 0.7]} s={[0.26, 0.12, 0.03]} o={0.012} />
          <T geo={GEO.sphere} color={FIN} p={[-0.2, -0.12, 0]} r={[0, 0, -0.7]} s={[0.26, 0.12, 0.03]} o={0.012} />
        </group>
      </group>
    </group>
  );
};
const Bubbles: React.FC<{p: V3; t: number; n?: number; h?: number}> = ({p, t, n = 8, h = 1.4}) => (
  <group position={p}>
    {Array.from({length: n}).map((_, i) => {
      const ph = ((t * 0.5 + rnd(i)) % 1);
      return <mesh key={i} position={[Math.sin(t * 3 + i) * 0.06 + (rnd(i * 3) - 0.5) * 0.3, ph * h, (rnd(i * 7) - 0.5) * 0.3]} scale={0.03 + rnd(i * 5) * 0.03}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#e8f7ff" transparent opacity={0.75 * (1 - ph)} roughness={0.1} /></mesh>;
    })}
  </group>
);
const Heart: React.FC<{p: V3; s: number}> = ({p, s}) => s <= 0.001 ? null : (
  <group position={p} scale={s}>
    {[-1, 1].map((sd) => <T key={sd} geo={GEO.sphere} color="#ff4b6b" p={[sd * 0.16, 0.1, 0]} s={0.2} o={0.012} />)}
    <T geo={GEO.cone} color="#ff4b6b" p={[0, -0.14, 0]} r={[0, 0, Math.PI]} s={[0.3, 0.34, 0.2]} o={0.012} />
  </group>
);

// ---------------- characters ----------------
// the series host: yellow hoodie, red cap, glasses
const Host: React.FC<{p?: V3; ry?: number; s?: number; mood?: Mood; look?: number; t: number; talk?: number; armR?: number; armL?: number; elbowR?: number; elbowL?: number; handR?: React.ReactNode; handL?: React.ReactNode; tilt?: number; lean?: number}> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'grin', look = 0, t, talk = 0, armR = 0.15, armL = 0.15, elbowR = 0.3, elbowL = 0.3, handR, handL, tilt = 0, lean = 0}) => {
  const b = Math.sin(t * Math.PI * 1.6) * 0.015;
  const nod = talk > 1 ? 0.05 : 0;
  return (
    <group position={p} rotation={[lean, ry, 0]} scale={s}>
      <group position={[0, b, 0]}>
        <StickBody robe="#ffcf3a" trim="#2a2a2a" skin="#f2c4a0" armR={armR} armL={armL} elbowR={elbowR} elbowL={elbowL} handR={handR} handL={handL} />
        <T geo={GEO.torus} color="#e9b52a" p={[0, 1.98, 0]} r={[Math.PI / 2, 0, 0]} s={[0.3, 0.26, 1.2]} o={0.012} />
        <T geo={GEO.box} color="#ffffff" p={[0, 1.7, 0.31]} s={[0.22, 0.16, 0.02]} o={0.006} />
      </group>
      <group position={[0, HEAD_Y + b * 1.6, 0]} rotation={[nod, 0, tilt]}>
        <Head skin="#f2c4a0" mood={mood} look={look} hair="#4a2e1a" hairStyle="caesar" talk={talk} blink={blinkAt(t, 2)} />
        {/* red cap */}
        <group position={[0, 0.3, -0.02]} rotation={[-0.12, 0, 0]}>
          <T geo={GEO.half} color="#e8343a" s={[0.8, 0.52, 0.78]} o={0.02} />
          <T geo={GEO.sphere} color="#c42a30" p={[0, 0.02, 0.74]} s={[0.56, 0.05, 0.36]} o={0.012} />
          <T geo={GEO.sphere} color="#ffffff" p={[0, 0.5, 0]} s={0.06} o={0.006} />
        </group>
        {/* glasses */}
        {[-1, 1].map((sd) => <M key={sd} geo={GEO.torus} color="#14161c" p={[sd * 0.24, 0.06, 0.66]} r={[0, sd * 0.3, 0]} s={[0.17, 0.16, 0.35]} o={0} />)}
        <M geo={GEO.box} color="#14161c" p={[0, 0.08, 0.72]} s={[0.12, 0.03, 0.03]} o={0} />
      </group>
    </group>
  );
};
const Scientist: React.FC<{p: V3; ry?: number; t: number; mood?: Mood; armR?: number; elbowR?: number; armL?: number; elbowL?: number; handL?: React.ReactNode}> = ({p, ry = 0, t, mood = 'calm', armR = 0.3, elbowR = 0.6, armL = 0.3, elbowL = 0.8, handL}) => (
  <group position={p} rotation={[0, ry, 0]}>
    <StickBody robe="#f4f6f8" trim="#9fb4c0" skin="#e8b48e" armR={armR} armL={armL} elbowR={elbowR} elbowL={elbowL} handL={handL} />
    <group position={[0, HEAD_Y, 0]}>
      <Head skin="#e8b48e" mood={mood} look={0.3} hair="#8a8a8a" hairStyle="curly" blink={blinkAt(t, 5)} />
      {[-1, 1].map((sd) => <M key={sd} geo={GEO.torus} color="#3a5a8a" p={[sd * 0.24, 0.06, 0.66]} r={[0, sd * 0.3, 0]} s={[0.16, 0.14, 0.3]} o={0} />)}
    </group>
  </group>
);
const Clipboard: React.FC = () => (
  <group position={[0.05, -0.05, 0.22]} rotation={[-0.6, 0, 0]}>
    <T geo={GEO.box} color="#a87a4a" s={[0.4, 0.52, 0.03]} o={0.01} />
    <T geo={GEO.box} color="#ffffff" p={[0, -0.02, 0.02]} s={[0.34, 0.42, 0.01]} o={0} />
  </group>
);

// ---------------- props ----------------
const Bowl: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {/* gravel + plant */}
    {Array.from({length: 26}).map((_, i) => { const a = rnd(i) * Math.PI * 2, r = rnd(i * 3) * 0.55; return <T key={i} geo={GEO.sphere} color={['#e8d8b0', '#c9a87a', '#9fc4d8', '#f0b8a8'][i % 4]} p={[Math.cos(a) * r, -0.82 + rnd(i * 5) * 0.05, Math.sin(a) * r]} s={0.07} o={0} />; })}
    {[0, 1, 2].map((k) => <T key={'pl' + k} geo={GEO.cone} color="#3e9a4a" p={[-0.38 + k * 0.08, -0.55, -0.25]} r={[0, 0, (k - 1) * 0.3]} s={[0.07, 0.6, 0.07]} o={0.01} />)}
    {/* water body (open top) + surface */}
    <mesh renderOrder={2}><sphereGeometry args={[0.95, 40, 28, 0, Math.PI * 2, 0.62, Math.PI - 0.62]} /><meshStandardMaterial color="#6cc4ee" transparent opacity={0.26} roughness={0.1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, Math.cos(0.62) * 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}><circleGeometry args={[Math.sin(0.62) * 0.95, 40]} /><meshStandardMaterial color="#a8e0ff" transparent opacity={0.35} roughness={0.05} depthWrite={false} /></mesh>
    {/* glass */}
    <mesh renderOrder={4}><sphereGeometry args={[1, 48, 32, 0, Math.PI * 2, 0.46, Math.PI - 0.46]} /><meshStandardMaterial color="#e6f6ff" transparent opacity={0.16} roughness={0.02} metalness={0.2} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, Math.cos(0.46), 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[Math.sin(0.46), 0.025, 10, 48]} /><meshStandardMaterial color="#e6f6ff" transparent opacity={0.6} /></mesh>
    <mesh position={[-0.45, 0.35, 0.72]} scale={[0.08, 0.22, 0.02]} rotation={[0, 0, -0.4]}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.7} /></mesh>
  </group>
);

const TANK = {w: 4.4, h: 2.2, d: 1.8, y: 2.1};
const Tank: React.FC = () => (
  <group position={[0, TANK.y, 0]}>
    <mesh position={[0, -TANK.h / 2 + 0.06, 0]}><boxGeometry args={[TANK.w - 0.06, 0.12, TANK.d - 0.06]} /><meshStandardMaterial color="#d8c8a0" roughness={1} /></mesh>
    {Array.from({length: 40}).map((_, i) => <T key={i} geo={GEO.sphere} color={['#e8d8b0', '#c9a87a', '#9fc4d8'][i % 3]} p={[(rnd(i) - 0.5) * (TANK.w - 0.3), -TANK.h / 2 + 0.14, (rnd(i * 3) - 0.5) * (TANK.d - 0.3)]} s={0.07} o={0} />)}
    {[-1.6, -1.3, 1.5].map((x, k) => <T key={'pl' + k} geo={GEO.cone} color="#3e9a4a" p={[x, -TANK.h / 2 + 0.6, -0.6]} r={[0, 0, (k - 1) * 0.2]} s={[0.09, 1.0, 0.09]} o={0.01} />)}
    <mesh renderOrder={2} position={[0, -0.08, 0]}><boxGeometry args={[TANK.w - 0.08, TANK.h - 0.24, TANK.d - 0.08]} /><meshStandardMaterial color="#5cb8e8" transparent opacity={0.22} roughness={0.1} depthWrite={false} /></mesh>
    <mesh renderOrder={3}><boxGeometry args={[TANK.w, TANK.h, TANK.d]} /><meshStandardMaterial color="#e6f6ff" transparent opacity={0.1} roughness={0.02} depthWrite={false} /></mesh>
    {/* black frame */}
    {[-1, 1].map((sy) => [-1, 1].map((sz) => <M key={'fx' + sy + sz} geo={GEO.box} color="#1d2230" p={[0, sy * TANK.h / 2, sz * TANK.d / 2]} s={[TANK.w + 0.06, 0.07, 0.07]} o={0} />))}
    {[-1, 1].map((sx) => [-1, 1].map((sz) => <M key={'fy' + sx + sz} geo={GEO.box} color="#1d2230" p={[sx * TANK.w / 2, 0, sz * TANK.d / 2]} s={[0.07, TANK.h + 0.06, 0.07]} o={0} />))}
    {[-1, 1].map((sx) => [-1, 1].map((sy) => <M key={'fz' + sx + sy} geo={GEO.box} color="#1d2230" p={[sx * TANK.w / 2, sy * TANK.h / 2, 0]} s={[0.07, 0.07, TANK.d + 0.06]} o={0} />))}
  </group>
);
const Speaker: React.FC<{p: V3; ring: number}> = ({p, ring}) => (
  <group position={p} rotation={[0, -Math.PI / 2, 0]}>
    <T geo={GEO.rbox} color="#2a2f3a" s={[0.7, 0.9, 0.5]} o={0.015} />
    <T geo={GEO.cyl} color="#14161c" p={[0, 0.1, 0.26]} r={[Math.PI / 2, 0, 0]} s={[0.24, 0.04, 0.24]} o={0} />
    <M geo={GEO.sphere} color="#7a8494" p={[0, 0.1, 0.28]} s={[0.1, 0.1, 0.05]} o={0} />
    <T geo={GEO.cyl} color="#14161c" p={[0, -0.27, 0.26]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.04, 0.1]} o={0} />
    {ring > 0 ? [0, 1, 2].map((k) => {
      const ph = (ring * 1.6 + k / 3) % 1;
      return <mesh key={k} position={[0, 0.1, 0.4 + ph * 0.6]}><torusGeometry args={[0.25 + ph * 0.9, 0.03, 8, 40]} /><meshBasicMaterial color="#ffd23f" transparent opacity={0.9 * (1 - ph)} /></mesh>;
    }) : null}
  </group>
);

const Lights: React.FC<{dim?: number}> = ({dim = 1}) => (
  <>
    <hemisphereLight args={['#fff8ee', '#8a6a4a', 1.0 * dim]} />
    <ambientLight intensity={0.22 * dim} />
    <directionalLight position={[6, 10, 9]} intensity={2.4 * dim} color="#fff2dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.0004} shadow-radius={5} />
    <directionalLight position={[-6, 5, 7]} intensity={0.8 * dim} color="#e4eeff" />
    <directionalLight position={[-2, 6, -10]} intensity={1.4 * dim} color="#fff0d8" />
  </>
);

// ---------------- sets ----------------
const Room: React.FC<{t: number; tex: ReturnType<typeof useTex>; children?: React.ReactNode}> = ({t, tex, children}) => (
  <>
    <color attach="background" args={['#f3dcc0']} />
    <Lights />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={tex.wood} roughness={0.7} /></mesh>
    <mesh position={[0, 5, -4]} receiveShadow><planeGeometry args={[40, 10]} /><meshStandardMaterial map={tex.wall} roughness={1} /></mesh>
    {/* window */}
    <group position={[3.2, 4.0, -3.95]}>
      <mesh><planeGeometry args={[2.6, 2.2]} /><meshBasicMaterial map={tex.skyWin} /></mesh>
      {[[0, 1.12, 2.8, 0.14], [0, -1.12, 2.8, 0.14], [1.33, 0, 0.14, 2.3], [-1.33, 0, 0.14, 2.3], [0, 0, 0.08, 2.2], [0, 0, 2.6, 0.08]].map(([x, y, w, h], i) => <T key={i} geo={GEO.box} color="#ffffff" p={[x, y, 0.05]} s={[w, h, 0.1]} o={0.008} />)}
    </group>
    {/* poster, shelf, plant */}
    <group position={[-3.4, 4.3, -3.95]}><mesh><planeGeometry args={[1.3, 1.7]} /><meshBasicMaterial map={tex.poster} /></mesh></group>
    <T geo={GEO.box} color="#8a5a32" p={[-0.6, 4.6, -3.75]} s={[2.2, 0.1, 0.5]} o={0.01} />
    {[0, 1, 2, 3].map((k) => <T key={k} geo={GEO.box} color={['#3f6fb0', '#e8343a', '#5aa04a', '#f0a63a'][k]} p={[-1.4 + k * 0.28, 4.95, -3.75]} s={[0.22, 0.6 + (k % 2) * 0.12, 0.4]} o={0.01} />)}
    <group position={[4.4, 0, -2.6]}>
      <T geo={GEO.cyl} color="#c4683a" p={[0, 0.4, 0]} s={[0.45, 0.8, 0.45]} o={0.015} />
      {Array.from({length: 7}).map((_, k) => <T key={k} geo={GEO.sphere} color={k % 2 ? '#3e8a4a' : '#4fa05a'} p={[Math.sin(k * 2.1) * 0.4, 1.3 + (k % 3) * 0.35, Math.cos(k * 2.1) * 0.3]} r={[0, 0, Math.sin(k) * 0.6]} s={[0.22, 0.5, 0.1]} o={0.01} />)}
    </group>
    {/* table */}
    <T geo={GEO.rbox} color="#9a6236" p={[0, 1.25, 0]} s={[3.2, 0.12, 1.8]} o={0.015} />
    {[[-1.4, -0.75], [1.4, -0.75], [-1.4, 0.75], [1.4, 0.75]].map(([x, z], i) => <T key={i} geo={GEO.cylLow} color="#7a4a26" p={[x, 0.6, z]} s={[0.07, 1.2, 0.07]} o={0.01} />)}
    <T geo={GEO.cyl} color="#e9c690" p={[1.0, 1.36, 0.3]} s={[0.18, 0.1, 0.18]} o={0.01} />
    <Bowl p={[0, 2.26, 0]} />
    {children}
  </>
);
const Lab: React.FC<{t: number; tex: ReturnType<typeof useTex>; children?: React.ReactNode}> = ({t, tex, children}) => (
  <>
    <color attach="background" args={['#e9f2f3']} />
    <Lights />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#b9c7cc" roughness={0.6} /></mesh>
    <mesh position={[0, 5, -3.5]} receiveShadow><planeGeometry args={[40, 10]} /><meshStandardMaterial map={tex.tiles} roughness={0.5} /></mesh>
    {/* bench */}
    <T geo={GEO.rbox} color="#f4f6f8" p={[0, 0.5, 0]} s={[5.6, 1.0, 2.2]} o={0.015} />
    <T geo={GEO.box} color="#3a8a9a" p={[0, 1.03, 0]} s={[5.7, 0.06, 2.3]} o={0.01} />
    <Tank />
    {/* lab shelf with flasks */}
    {[-3.6, -3.0, 3.2, 3.7].map((x, k) => (
      <group key={k} position={[x, 4.0, -3.3]}>
        <T geo={GEO.sphere} color={['#5fd4a0', '#ff8a5b', '#7ab8ff', '#ffd23f'][k]} p={[0, 0, 0]} s={0.26} o={0.012} />
        <T geo={GEO.cyl} color="#e6f6ff" p={[0, 0.34, 0]} s={[0.08, 0.3, 0.08]} o={0.008} />
      </group>
    ))}
    <T geo={GEO.box} color="#8a9aa8" p={[0, 3.7, -3.35]} s={[9, 0.08, 0.4]} o={0.008} />
    {children}
  </>
);

// ---------------- camera ----------------
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number; set: SetName};
const sh = (at: number, set: SetName, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov = 46): Shot => ({at, from, to, lookA, lookB, dur, fov, set});
const BOWL: V3 = [0, 2.26, 0];
const SHOTS: Shot[] = [
  sh(0, 'room', [0.2, 2.5, 3.2], [0.1, 2.4, 2.5], [0, 2.2, 0], [0, 2.2, 0], 1.4, 40),
  sh(L(1) - 0.1, 'room', [0.6, 2.4, 2.4], [0.4, 2.3, 2.0], [0, 2.2, 0], [0, 2.2, 0], 2.8, 40),
  sh(L(2) - 0.1, 'room', [0.8, 3.3, 8.2], [0.6, 3.2, 7.4], [-0.8, 2.6, 0], [-0.8, 2.7, 0], 2.4, 46),
  sh(L(3) - 0.1, 'room', [-0.4, 3.5, 8.0], [-0.6, 3.5, 7.3], [-1.4, 2.9, 0.4], [-1.4, 3.0, 0.4], 1.8, 44),
  sh(L(4) - 0.1, 'lab', [0, 3.3, 8.6], [0, 3.1, 7.6], [0, 2.3, 0], [0, 2.3, 0], 2.4, 48),
  sh(L(5) - 0.1, 'lab', [1.6, 2.6, 6.0], [1.2, 2.5, 5.4], [0.8, 2.1, 0], [1.0, 2.1, 0], 2.6, 44),
  sh(L(6) - 0.1, 'lab', [-1.0, 2.5, 6.4], [0.4, 2.5, 6.0], [0, 2.1, 0], [0.8, 2.1, 0], 3.8, 46),
  sh(L(7) - 0.1, 'lab', [0, 3.2, 8.8], [0, 3.2, 8.4], [0, 2.3, 0], [0, 2.3, 0], 2.4, 48),
  sh(L(8) - 0.1, 'lab', [4.6, 3.0, 4.6], [4.2, 2.9, 4.2], [2.6, 2.5, 0.6], [2.6, 2.5, 0.6], 1.8, 44),
  sh(L(9) - 0.1, 'lab', [1.8, 2.4, 5.0], [1.4, 2.3, 4.4], [1.2, 2.1, 0], [1.4, 2.1, 0], 1.6, 42),
  sh(L(10) - 0.1, 'lab', [0, 2.8, 7.6], [0, 2.9, 8.4], [0.6, 2.2, 0], [0.6, 2.3, 0], 2.0, 46),
  sh(L(11) - 0.1, 'room', [0, 2.3, 2.0], [0, 2.3, 1.7], [0, 2.2, 0], [0, 2.2, 0], 1.0, 40),
  sh(L(12) - 0.1, 'room', [-0.4, 2.6, 4.0], [0.2, 2.5, 3.6], [0, 2.2, 0], [0, 2.2, 0], 3.4, 42),
  sh(L(13) - 0.1, 'lab', [0, 7.6, 2.8], [0, 7.2, 2.4], [0, 1.4, 0], [0, 1.4, 0], 2.4, 46),
  sh(L(14) - 0.1, 'lab', [0.6, 2.4, 5.4], [-0.2, 2.4, 5.2], [0, 2.1, 0], [0, 2.1, 0], 2.4, 44),
  sh(L(15) - 0.1, 'room', [0.6, 3.2, 7.6], [0.3, 3.1, 7.0], [-0.8, 2.7, 0], [-0.8, 2.6, 0], 2.8, 46),
  sh(L(16) - 0.1, 'room', [-0.2, 3.5, 7.6], [-0.5, 3.5, 7.0], [-1.5, 3.0, 0.4], [-1.5, 3.0, 0.4], 2.4, 44),
  sh(L(17) - 0.1, 'room', [0.01, 6.6, 0.9], [0.01, 6.1, 0.8], [0, 2.0, 0], [0, 2.0, 0], 2.8, 36),
  sh(L(18) - 0.1, 'room', [0.5, 2.4, 2.2], [0.3, 2.35, 1.9], [0, 2.2, 0], [0, 2.2, 0], 1.6, 40),
  sh(L(19) - 0.1, 'room', [0.6, 3.4, 7.0], [0.4, 3.3, 6.4], [-1.0, 2.8, 0], [-1.0, 2.8, 0], 3.0, 46),
  sh(L(21) - 0.1, 'room', [-0.1, 3.1, 7.4], [-0.3, 3.0, 6.8], [-0.85, 2.7, 0], [-0.85, 2.7, 0], 2.6, 44),
  sh(L(22) - 0.1, 'room', [-0.2, 3.4, 6.8], [-0.3, 3.3, 6.4], [-0.85, 2.8, 0], [-0.85, 2.8, 0], 1.6, 44),
  sh(L(23) - 0.15, 'room', [0, 3.6, 9.5], [0, 3.8, 10.5], [0, 2.8, 0], [0, 2.9, 0], 9, 48),
];
function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to);
  pos[1] += Math.sin(t * 1.1 + 1) * 0.02; pos[0] += Math.sin(t * 0.7) * 0.02;
  return {pos, look: lp(s.lookA, s.lookB), fov: s.fov, cutAt: s.at, set: s.set};
}
const Cam: React.FC<{pos: V3; look: V3; fov: number; punch: number}> = ({pos, look, fov, punch}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov / (1 + punch);
  camera.updateProjectionMatrix();
  camera.lookAt(...look);
  return null;
};

// ---------------- overlays ----------------
const Captions: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => {
  const ws = timing.words;
  let i = ws.findIndex((w) => t >= w.start && t < w.end + 0.08);
  if (i < 0) { const nx = ws.findIndex((w) => t < w.start); i = nx > 0 ? nx - 1 : nx === 0 ? -1 : ws.length - 1; }
  if (i < 0) return null;
  const line = timing.lines[ws[i].line];
  if (t > line[1] + 0.3) return null;
  const short = (k: number) => ws[k].text.replace(/[^A-Za-z0-9]/g, '').length <= 3;
  let start = i;
  if (i > 0 && short(i - 1) && ws[i - 1].line === ws[i].line && !(i > 1 && short(i - 2) && ws[i - 2].line === ws[i].line)) start = i - 1;
  const chunk = [ws[start], ...(short(start) && start + 1 < ws.length && ws[start + 1].line === ws[start].line ? [ws[start + 1]] : [])];
  const s = spring({frame: frame - Math.round(ws[i].start * fps), fps, config: {damping: 13, stiffness: 220}});
  const hot = /three|seconds|months|maze|nonsense|memory|proof|remember|goldfish|food|sound|four|five|circles|forgetful/i;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1400, textAlign: 'center', transform: `scale(${0.82 + 0.18 * s})`}}>
      {chunk.map((w, k) => {
        const txt = w.text.replace(/[.,!?:]$/, '');
        return <span key={k} style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, letterSpacing: -1, color: hot.test(txt) ? '#FFD23F' : '#fff', WebkitTextStroke: '16px #0e0b12', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.35)'}}>{(k ? ' ' : '') + txt.toUpperCase()}</span>;
      })}
    </div>
  );
};
const Pill: React.FC<{text: string; at: number; until: number; t: number; frame: number; fps: number; top?: number; bg?: string}> = ({text, at, until, t, frame, fps, top = 330, bg = 'rgba(14,11,18,.62)'}) => {
  if (t < at || t > until + 0.3) return null;
  const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 12}});
  const o = interpolate(t, [until, until + 0.25], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, letterSpacing: 6, color: '#fff', background: bg, padding: '14px 30px', borderRadius: 14}}>{text}</span>
    </div>
  );
};
const Stamp: React.FC<{text: string; at: number; until: number; t: number; frame: number; fps: number; color?: string; top?: number; rot?: number; size?: number}> = ({text, at, until, t, frame, fps, color = '#ff3b3b', top = 520, rot = -10, size = 140}) => {
  if (t < at || t > until + 0.25) return null;
  const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 9, stiffness: 260}});
  const o = interpolate(t, [until, until + 0.25], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o}}>
      <span style={{display: 'inline-block', transform: `rotate(${rot}deg) scale(${2.2 - 1.2 * s})`, fontFamily: FONT, fontWeight: 900, fontSize: size, color, border: `16px solid ${color}`, borderRadius: 26, padding: '0 36px', letterSpacing: 4, background: 'rgba(255,255,255,.88)'}}>{text}</span>
    </div>
  );
};

// ---------------- fish behaviour ----------------
// bowl: slow circles; "come to the front" when the host is near (line 15) and at the end
function bowlFish(t: number) {
  const front = Math.max(sstep(L(15), L(15) + 0.8, t) * (1 - sstep(LE(15) + 0.2, LE(15) + 0.8, t)), sstep(L(21), L(21) + 0.8, t));
  const fast = t >= L(17) - 0.1 && t < LE(18) + 0.2 ? 1.8 : 1;
  const th = -t * 0.9 * fast;
  const R = 0.42;
  const cx = Math.cos(th) * R, cz = Math.sin(th) * R;
  const vx = Math.sin(th) * R, vz = -Math.cos(th) * R;
  const fx = -0.25, fz = 0.35; // front, facing the host (left)
  const x = cx + (fx - cx) * front, z = cz + (fz - cz) * front;
  let ry = heading(vx, vz);
  if (front > 0) { const target = Math.PI * 0.8; ry = ry + (((target - ry + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * front; }
  return {p: [BOWL[0] + x, BOWL[1] - 0.25 + Math.sin(t * 1.7) * 0.05, BOWL[2] + z] as V3, ry, speed: front > 0.5 ? 0.6 : fast};
}
// tank: 3 fish; idle loops, rush to the speaker (right side) when called
function soundAt(t: number) {
  const calls = [WL(5, 'plays'), L(6) + 0.2, WL(8, 'play')];
  let ring = 0;
  for (const c of calls) if (t >= c && t < c + 1.6) ring = (t - c) / 1.6 + 0.001;
  return ring;
}
function callAt(t: number) {
  const a = sstep(WL(5, 'plays') + 0.3, WL(5, 'plays') + 1.2, t) * (1 - sstep(LE(6) + 0.1, L(7) + 0.3, t));
  const b = sstep(WL(8, 'play') + 0.25, WL(8, 'play') + 0.7, t) * (1 - sstep(LE(10), LE(10) + 0.4, t));
  return Math.max(a, b);
}
function tankFish(i: number, t: number) {
  const ph = i * 2.1, sp = 0.55 + i * 0.12;
  const th = t * sp + ph;
  const ix = Math.cos(th) * 1.5, iz = Math.sin(th) * 0.45, iy = 2.1 + Math.sin(th * 1.7 + i) * 0.35 - 0.2;
  let ry = heading(-Math.sin(th) * 1.5, Math.cos(th) * 0.45);
  const c = callAt(t);
  const tx = 1.55 - i * 0.18, ty = 2.2 + (i - 1) * 0.3, tz = (i - 1) * 0.35;
  const x = ix + (tx - ix) * c, y = iy + (ty - iy) * c, z = iz + (tz - iz) * c;
  if (c > 0) ry = ry + ((((0) - ry + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * c;
  return {p: [x, y, z] as V3, ry, speed: 1 + c * 1.5};
}
// maze path (line 13) inside the tank, seen from above
const MAZE_PTS: [number, number][] = [[-1.8, 0.6], [-0.9, 0.6], [-0.9, -0.5], [0.2, -0.5], [0.2, 0.55], [1.2, 0.55], [1.2, -0.5], [1.85, -0.5]];
function mazeFish(t: number) {
  const u = Math.max(0, Math.min(1, (t - L(13) - 0.2) / (LE(13) - L(13) + 0.1)));
  const segs = MAZE_PTS.length - 1, f = u * segs, k = Math.min(segs - 1, Math.floor(f)), r = f - k;
  const [ax, az] = MAZE_PTS[k], [bx, bz] = MAZE_PTS[k + 1];
  return {p: [ax + (bx - ax) * r, 1.4, az + (bz - az) * r] as V3, ry: heading(bx - ax, bz - az)};
}

// ---------------- main ----------------
export const GoldfishMyth: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const tex = useTex();
  const talk = talkAt(t);

  const bf = bowlFish(t);
  const derp = (t < L(2) && t > L(1) + 0.3) || (t >= L(18) - 0.1 && t < LE(18) + 0.2) ? 1 : 0;
  const ring = soundAt(t);
  const inMaze = t >= L(13) - 0.15 && t < L(14) - 0.1;
  const inTrick = t >= L(14) - 0.15 && t < L(15) - 0.1;

  // host poses
  let hostMood: Mood = 'grin', hostArmR = 0.2, hostArmL = 0.2, hostElbR = 0.3, hostElbL = 0.3, hostTilt = 0, hostLook = 0.3;
  if (t >= L(3) && t < L(4)) { hostMood = 'smug'; hostArmR = 1.2; hostArmL = 1.2; hostElbR = 2.2; hostElbL = 2.2; } // arms crossed-ish
  if (t >= L(16) && t < L(17)) { hostMood = 'stern'; hostArmR = 2.4; hostElbR = 2.4; hostTilt = 0.15; } // scratch head
  if (t >= L(19) && t < L(20)) { hostMood = 'smug'; hostArmR = 1.6 + Math.sin(t * 9) * 0.25; hostElbR = 0.6; }
  if (t >= L(22) - 0.2 && t < L(23)) { hostArmR = 1.9; hostElbR = 0.9; hostLook = 0.6; }
  const hostLean = t >= L(15) && t < LE(15) + 0.3 ? 0.12 : 0;
  const near = t >= L(15) && t < LE(15) + 0.3;
  const hostX = near ? -1.3 : -2.0, hostZ = near ? 1.25 : 0.6;
  const heart = Math.max(
    spring({frame: frame - Math.round((L(15) + 1.1) * fps), fps, config: {damping: 10}}) * (t < LE(15) + 0.3 ? 1 : 0),
    spring({frame: frame - Math.round((L(21) + 1.0) * fps), fps, config: {damping: 10}}) * (t >= L(21) && t < L(23) ? 1 : 0),
  );
  const flakes = t >= L(22) - 0.1 && t < L(23) + 1.5;

  const punchAt = [L(0), L(3), WL(9, 'come'), L(12), L(19)];
  let punch = 0;
  for (const p of punchAt) punch = Math.max(punch, interpolate(t - p, [0, 0.12, 0.45], [0, 0.08, 0], cl));
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [0.2, 0], cl);
  const endO = interpolate(t, [L(23) + 0.1, L(23) + 0.5], [0, 1], cl);
  const card = (at: number) => spring({frame: frame - Math.round((at - 0.1) * fps), fps, config: {damping: 11}});
  const loopFlash = interpolate(t, [GOLDFISH_DURATION - 0.25, GOLDFISH_DURATION - 0.05], [0, 1], cl);
  const calO = interpolate(t, [L(7) + 0.1, L(7) + 0.35, LE(7) + 0.2, LE(7) + 0.45], [0, 1, 1, 0], cl);
  const month = Math.min(5, 1 + Math.floor(interpolate(t, [L(7) + 0.3, LE(7)], [0, 4.99], cl)));
  const cmpO = interpolate(t, [L(12) + 0.1, L(12) + 0.4, LE(12) + 0.2, LE(12) + 0.45], [0, 1, 1, 0], cl);
  const cmpB = spring({frame: frame - Math.round(WL(12, 'three') * fps), fps, config: {damping: 10}});
  const countdown = t < L(1) ? Math.max(1, 3 - Math.floor(t / 0.34)) : 0;

  const set = cam.set;
  return (
    <AbsoluteFill style={{backgroundColor: '#f3dcc0'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true}} camera={{fov: 46, near: 0.05, far: 300}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} punch={punch} />
        {set === 'room' ? (
          <Room t={t} tex={tex}>
            <Goldfish p={bf.p} ry={bf.ry} t={t} speed={bf.speed} derp={derp} s={0.62} />
            <Bubbles p={[0.3, 1.5, -0.2]} t={t} h={1.1} />
            {t >= L(2) - 0.1 ? (
              <Host p={[hostX, 0, hostZ]} ry={0.55} t={t} talk={talk} mood={hostMood} look={hostLook} armR={hostArmR} armL={hostArmL} elbowR={hostElbR} elbowL={hostElbL} tilt={hostTilt} lean={hostLean} />
            ) : null}
            <Heart p={[BOWL[0] - 0.2, BOWL[1] + 1.35 + Math.sin(t * 3) * 0.05, BOWL[2] + 0.3]} s={heart * 0.8} />
            {flakes ? Array.from({length: 10}).map((_, i) => {
              const tt = (t - L(22) + 0.1 - rnd(i) * 0.8);
              if (tt < 0) return null;
              const y = BOWL[1] + 1.2 - Math.min(1.7, tt * 0.9);
              return <mesh key={i} position={[-0.3 + rnd(i * 3) * 0.5, y, -0.1 + rnd(i * 7) * 0.4]} rotation={[tt * 3 + i, tt * 2, 0]}><boxGeometry args={[0.07, 0.015, 0.06]} /><meshStandardMaterial color={i % 2 ? '#e8743a' : '#d8a03a'} /></mesh>;
            }) : null}
          </Room>
        ) : null}
        {set === 'lab' ? (
          <Lab t={t} tex={tex}>
            {!inMaze && !inTrick ? [0, 1, 2].map((i) => { const f = tankFish(i, t); return <Goldfish key={i} p={f.p} ry={f.ry} t={t + i} speed={f.speed} s={0.55} />; }) : null}
            <Speaker p={[TANK.w / 2 + 0.55, TANK.y + 0.2, 0]} ring={ring} />
            <Bubbles p={[-1.4, TANK.y - 1.0, 0.2]} t={t} n={10} h={1.9} />
            {/* food flakes when the sound plays */}
            {callAt(t) > 0.05 ? Array.from({length: 12}).map((_, i) => {
              const tt = (t * 0.6 + rnd(i)) % 1;
              return <mesh key={i} position={[1.2 + rnd(i * 3) * 0.7, TANK.y + 1.0 - tt * 1.6, -0.5 + rnd(i * 7)]} rotation={[t * 2 + i, t + i, 0]}><boxGeometry args={[0.06, 0.012, 0.05]} /><meshStandardMaterial color={i % 2 ? '#e8743a' : '#d8a03a'} /></mesh>;
            }) : null}
            {/* scientist */}
            <Scientist p={[3.6, 0, 1.6]} ry={-0.7} t={t} mood={callAt(t) > 0.5 ? 'grin' : 'calm'} handL={<Clipboard />} armL={0.8} elbowL={1.4}
              armR={t >= WL(8, 'play') - 0.4 && t < WL(8, 'play') + 0.3 ? 1.3 : 0.3} elbowR={0.4} />
            <T geo={GEO.cyl} color="#e8343a" p={[3.0, 1.12, 0.9]} s={[0.12, 0.08, 0.12]} o={0.01} />
            {/* maze */}
            {inMaze ? (
              <>
                {[[-1.35, -0.3, 0.06, 1.3], [-0.35, 0.25, 0.06, 1.3], [0.7, -0.3, 0.06, 1.3], [1.55, 0.25, 0.06, 1.3], [-0.4, -0.85, 4.2, 0.06], [0, 0.85, 4.2, 0.06]].map(([x, z, w, d], k) => (
                  <T key={k} geo={GEO.box} color="#ff9a7a" p={[x, 1.55, z]} s={[w, 0.7, d]} o={0.01} />
                ))}
                <Goldfish p={mazeFish(t).p} ry={mazeFish(t).ry} t={t} speed={1.4} s={0.62} />
                <T geo={GEO.sphere} color="#ffd23f" p={[1.95, 1.4, -0.5]} s={0.12 + Math.sin(t * 6) * 0.02} o={0.01} />
              </>
            ) : null}
            {/* trick: swim through the ring */}
            {inTrick ? (() => {
              const u = Math.max(0, Math.min(1, (t - L(14) - 0.1) / 1.8));
              const x = -1.8 + u * 3.4, y = 2.1 + Math.sin(u * Math.PI) * 0.25;
              const passed = u > 0.55;
              return (
                <>
                  <mesh position={[0, 2.25, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.42, 0.06, 12, 40]} /><meshStandardMaterial color="#ff6b3a" emissive={passed ? '#ff9a3a' : '#000000'} emissiveIntensity={passed ? 0.6 : 0} /></mesh>
                  <Goldfish p={[x, y, 0]} ry={0} t={t} speed={1.6} s={0.55} />
                  {passed ? Array.from({length: 8}).map((_, k) => { const a = k / 8 * Math.PI * 2, r = 0.5 + (u - 0.55) * 1.5; return <mesh key={k} position={[0.1, 2.25 + Math.sin(a) * r, Math.cos(a) * r]} scale={0.06}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ffd23f" /></mesh>; }) : null}
                </>
              );
            })() : null}
          </Lab>
        ) : null}
        <EffectComposer multisampling={0}>
          <DepthOfField target={cam.look} focalLength={0.04} bokehScale={3} height={480} />
          <Bloom intensity={0.3} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur />
          <HueSaturation saturation={0.12} />
          <BrightnessContrast contrast={0.06} />
          <Vignette offset={0.32} darkness={0.4} />
        </EffectComposer>
      </ThreeCanvas>

      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', opacity: endO > 0.5 ? 0 : 1}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: 6, color: '#0e0b12', background: '#FFD23F', padding: '12px 28px', borderRadius: 999}}>MYTH CHECK #2</span>
      </div>
      {countdown > 0 ? (
        <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 260, color: '#FFD23F', WebkitTextStroke: '16px #0e0b12', paintOrder: 'stroke fill', transform: `scale(${1.25 - ((t % 0.34) / 0.34) * 0.25})`}}>{countdown}</div>
      ) : null}
      <Pill text="🐟 3-SECOND MEMORY?" at={L(1) + 0.1} until={LE(2)} t={t} frame={frame} fps={fps} />
      <Stamp text="MYTH" at={WL(3, 'nonsense') - 0.05} until={LE(3) + 0.1} t={t} frame={frame} fps={fps} top={540} />
      <Pill text="🧪 THE EXPERIMENT" at={L(4) + 0.2} until={LE(4)} t={t} frame={frame} fps={fps} />
      <Pill text="🔊 SOUND = 🍤 FOOD" at={WL(5, 'sound') - 0.1} until={LE(6)} t={t} frame={frame} fps={fps} />
      {calO > 0 ? (
        <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: calO}}>
          <div style={{width: 420, borderRadius: 34, overflow: 'hidden', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,.3)', fontFamily: FONT, textAlign: 'center', transform: `rotate(${Math.sin(t * 20) * (t % 0.42 < 0.08 ? 3 : 0)}deg)`}}>
            <div style={{background: '#e8343a', color: '#fff', fontWeight: 900, fontSize: 44, padding: '18px 0', letterSpacing: 4}}>NO SOUND 🔇</div>
            <div style={{fontWeight: 900, fontSize: 190, color: '#14161c', lineHeight: 1.05}}>{month}</div>
            <div style={{fontWeight: 800, fontSize: 46, color: '#7a8494', paddingBottom: 22}}>{month === 1 ? 'MONTH' : 'MONTHS'}</div>
          </div>
        </div>
      ) : null}
      <Stamp text="THEY REMEMBER" at={WL(9, 'come')} until={LE(9) + 0.1} t={t} frame={frame} fps={fps} color="#1f9d55" top={540} rot={-6} size={100} />
      <Pill text="⏱ 4–5 MONTHS LATER" at={L(10) + 0.1} until={LE(10)} t={t} frame={frame} fps={fps} />
      {t >= L(11) && t < L(12) ? (
        <div style={{position: 'absolute', top: 420, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 240, color: '#FFD23F', WebkitTextStroke: '14px #0e0b12', paintOrder: 'stroke fill', transform: `scale(${spring({frame: frame - Math.round(L(11) * fps), fps, config: {damping: 9}})}) rotate(${Math.sin(t * 6) * 6}deg)`}}>?</div>
      ) : null}
      {cmpO > 0 ? (
        <div style={{position: 'absolute', top: 340, left: 70, right: 70, opacity: cmpO, display: 'flex', gap: 30, fontFamily: FONT}}>
          <div style={{flex: 1, background: 'rgba(14,11,18,.82)', borderRadius: 30, padding: '26px 0', textAlign: 'center', color: '#fff'}}>
            <div style={{fontSize: 36, fontWeight: 800, color: '#ff6b5b'}}>THE MYTH</div>
            <div style={{fontSize: 96, fontWeight: 900, textDecoration: 'line-through', textDecorationColor: '#ff3b3b', textDecorationThickness: 12}}>3 SEC</div>
          </div>
          <div style={{flex: 1, background: 'rgba(14,11,18,.82)', borderRadius: 30, padding: '26px 0', textAlign: 'center', color: '#fff', transform: `scale(${cmpB})`}}>
            <div style={{fontSize: 36, fontWeight: 800, color: '#5BD47A'}}>REALITY</div>
            <div style={{fontSize: 96, fontWeight: 900, color: '#5BD47A'}}>3+ MO</div>
          </div>
        </div>
      ) : null}
      <Pill text="🧩 MAZE: SOLVED" at={L(13) + 0.3} until={LE(13)} t={t} frame={frame} fps={fps} />
      <Pill text="🎯 TRAINED" at={L(14) + 0.2} until={LE(14)} t={t} frame={frame} fps={fps} />
      <Pill text="❤️ KNOWS WHO FEEDS IT" at={L(15) + 0.6} until={LE(15)} t={t} frame={frame} fps={fps} />
      <Pill text="🔄 ALL DAY" at={L(17) + 0.4} until={LE(18)} t={t} frame={frame} fps={fps} />
      <Stamp text="NO PROOF" at={WL(19, 'proof') - 0.05} until={LE(19) + 0.1} t={t} frame={frame} fps={fps} top={540} />

      {endO > 0 ? (
        <AbsoluteFill style={{background: `rgba(8,14,28,${0.6 * endO})`}}>
          <div style={{position: 'absolute', top: 300, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 84, lineHeight: 1.05, color: '#fff', opacity: endO}}>NEXT MYTH<br /><span style={{fontSize: 56, color: '#FFD23F'}}>YOU DECIDE</span></div>
          {([['🎩', 'NAPOLEON WAS TINY', '#ffcf3a', WL(24, 'Napoleon')], ['🧱', 'GREAT WALL FROM SPACE', '#ff6b5b', WL(25, 'Great')]] as [string, string, string, number][]).map(([e, txt, col, at], k) => (
            <div key={txt} style={{position: 'absolute', left: 80, right: 80, top: 640 + k * 190, height: 150, borderRadius: 30, background: '#fff', border: `8px solid ${col}`, display: 'flex', alignItems: 'center', gap: 26, padding: '0 36px', transform: `scale(${card(at)})`, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: '#0e0b12'}}>
              <span style={{fontSize: 72}}>{e}</span>{txt}
            </div>
          ))}
          <div style={{position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center', transform: `scale(${card(L(26))})`}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', background: '#e8343a', padding: '20px 44px', borderRadius: 999}}>💬 COMMENT</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {t < L(23) ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(cam.cutAt > 0 ? flash : 0, loopFlash)}} />
      <Audio src={staticFile('goldfish_voice.wav')} />
      <Audio src={staticFile('goldfish_music.wav')} />
    </AbsoluteFill>
  );
};
