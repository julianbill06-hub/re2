import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {GEO, HEAD_Y, Head, M, Mood, StickBody, T} from './hd';
import timing from './timing_viking.json';
import env from './env_viking.json';
import {EffectComposer, Bloom, DepthOfField, Vignette, HueSaturation, BrightnessContrast} from '@react-three/postprocessing';

const FX = true; // cinematic post-processing (DOF + bloom + grade)
// mirrored copy of the smooth horn for the left side (flip x, fix winding)
const HORN_R = GEO.hornTube;
const HORN_L = (() => {
  const g = GEO.hornTube.clone();
  g.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
  const idx = g.index!;
  for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a); }
  g.computeVertexNormals();
  return g;
})();
// lip-sync level 0..3 for the current time (voice loudness envelope)
const talkAt = (t: number) => { const v = env.env[Math.floor(t * env.fps)] ?? 0; return v < 0.12 ? 0 : v < 0.3 ? 1 : v < 0.55 ? 2 : 3; };
const blinkAt = (t: number, seed = 0) => ((t + seed * 1.37) % 3.6) < 0.11;

// ============ Mythos-Check #1: Wikinger mit Hörnerhelmen ============
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
const W = (prefix: string, nth = 0) => {
  const m = timing.words.filter((w) => w.text.startsWith(prefix));
  return (m[nth] ?? m[0]).start;
};
const WL = (line: number, prefix: string) => timing.words.find((w) => w.line === line && w.text.startsWith(prefix))!.start;
export const VIKING_DURATION = timing.duration + 1.0;
type V3 = [number, number, number];
type SetName = 'fjord' | 'farm' | 'stage' | 'museum';

// ---------------- textures ----------------
function cTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function useTex() {
  return useMemo(() => {
    const shield = (a: string, b: string) => cTex(256, 256, (g) => {
      g.fillStyle = a; g.fillRect(0, 0, 256, 256);
      g.fillStyle = b;
      for (let k = 0; k < 4; k += 2) { g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 130, (k * Math.PI) / 2, ((k + 1) * Math.PI) / 2); g.fill(); }
      g.strokeStyle = '#3a2a1e'; g.lineWidth = 6;
      for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(0, k * 34); g.lineTo(256, k * 34 + 6); g.globalAlpha = 0.18; g.stroke(); }
      g.globalAlpha = 1;
    });
    const sail = cTex(256, 256, (g) => {
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#f3ead8' : '#c4302b'; g.fillRect(k * 32, 0, 32, 256); }
    });
    const grass = cTex(512, 512, (g) => {
      g.fillStyle = '#6faa4a'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2500; i++) { g.fillStyle = rnd(i) > 0.5 ? 'rgba(40,90,30,.16)' : 'rgba(200,240,150,.16)'; g.fillRect(rnd(i * 3) * 512, rnd(i * 7) * 512, 3, 6); }
    }, [16, 16]);
    const wood = cTex(512, 512, (g) => {
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#9a6236' : '#a86c3c'; g.fillRect(0, k * 64, 512, 64); g.fillStyle = 'rgba(60,30,10,.5)'; g.fillRect(0, k * 64, 512, 4); }
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(70,35,10,.12)'; g.fillRect(rnd(i) * 512, rnd(i * 5) * 512, 40 + rnd(i * 9) * 80, 2); }
    }, [4, 4]);
    const curtain = cTex(256, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 256, 0);
      for (let k = 0; k <= 8; k++) gr.addColorStop(k / 8, k % 2 ? '#7d0f1a' : '#b81d2a');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    }, [6, 1]);
    const painting = cTex(256, 192, (g) => {
      g.fillStyle = '#8fc4e8'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#2e5f88'; g.fillRect(0, 120, 256, 72);
      g.fillStyle = '#6a3a1c'; g.beginPath(); g.ellipse(128, 128, 70, 16, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#c4302b'; g.fillRect(118, 50, 26, 66); g.fillStyle = '#f3ead8'; g.fillRect(124, 50, 8, 66);
      g.fillStyle = '#e9d9b0'; g.beginPath(); g.arc(70, 96, 14, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#f1e6c8'; g.lineWidth = 6; g.beginPath(); g.arc(56, 82, 10, 0, Math.PI, true); g.stroke(); g.beginPath(); g.arc(84, 82, 10, 0, Math.PI, true); g.stroke();
    });
    const book = cTex(256, 320, (g) => {
      g.fillStyle = '#2f5d8a'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#e9b23a'; g.fillRect(20, 20, 216, 8); g.fillRect(20, 292, 216, 8);
      g.fillStyle = '#f1e6c8'; g.beginPath(); g.arc(128, 170, 44, Math.PI, 0); g.fill();
      g.strokeStyle = '#f1e6c8'; g.lineWidth = 12; g.beginPath(); g.arc(78, 128, 22, 0.2, Math.PI, true); g.stroke(); g.beginPath(); g.arc(178, 128, 22, 0, Math.PI - 0.2, true); g.stroke();
      g.fillStyle = '#fff'; g.font = '900 34px Inter, Arial'; g.textAlign = 'center'; g.fillText('VIKINGS', 128, 250);
    });
    const label = (txt: string, sub: string) => cTex(512, 160, (g) => {
      g.fillStyle = '#f5efe2'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#1b1620'; g.font = '900 54px Inter, Arial'; g.textAlign = 'center'; g.fillText(txt, 256, 70);
      g.font = '700 38px Inter, Arial'; g.fillStyle = '#7a5a3a'; g.fillText(sub, 256, 126);
    });
    return {sh1: shield('#c4302b', '#f3d36b'), sh2: shield('#2f6ea8', '#f3ead8'), sh3: shield('#3d8a4a', '#e9b23a'), sail, grass, wood, curtain, painting, book,
      bronze: label('VEKSØ · DENMARK', 'about 900 BC'), iron: label('GJERMUNDBU · NORWAY', 'Viking Age · 10th century')};
  }, []);
}

// ---------------- helmets ----------------
const Horn: React.FC<{side: number; color?: string; len?: number; curl?: number}> = ({side, color = '#f1e6c8', len = 1, curl = 1}) => (
  <group position={[side * 0.6, 0.18, 0.02]} scale={[1.05 * len * (curl > 1.5 ? 1.15 : 1), 1.05 * len, 1.05 * len]}>
    <T geo={side > 0 ? HORN_R : HORN_L} color={color} o={0.012} />
    <T geo={GEO.sphere} color={color} p={[0, 0, 0]} s={0.17} o={0.012} />
  </group>
);
const HornOld: React.FC<{side: number; color?: string; len?: number; curl?: number}> = ({side, color = '#f1e6c8', len = 1, curl = 1}) => (
  <group>
    {Array.from({length: 21}).map((_, i) => {
      const u = i / 20;
      const x = side * (0.62 + 0.55 * u * len + 0.12 * Math.sin(u * 3) * curl);
      const y = 0.2 + 0.95 * Math.pow(u, 1.5) * len;
      const z = 0.05 - 0.15 * u * curl;
      return <T key={i} geo={GEO.sphere} color={i > 17 ? '#fff8e6' : color} p={[x, y, z]} s={0.17 * (1 - u * 0.8)} o={0.014} />;
    })}
  </group>
);

// classic opera helmet: steel cap, gold band, cow horns
const HornHelmet: React.FC<{off?: number}> = ({off = 0}) => (
  <group>
    <M geo={GEO.half} color="#a9b0bb" p={[0, 0.22, -0.02]} s={[0.84, 0.72, 0.8]} o={0.03} />
    <M geo={GEO.torus} color="#e0b04a" p={[0, 0.24, -0.02]} r={[Math.PI / 2, 0, 0]} s={[0.82, 0.78, 0.5]} o={0.012} />
    <M geo={GEO.box} color="#e0b04a" p={[0, 0.6, 0.28]} r={[0.5, 0, 0]} s={[0.1, 0.55, 0.06]} o={0.01} />
    {Array.from({length: 12}).map((_, i) => { const a = (i / 12) * Math.PI * 2; return <M key={'rv' + i} geo={GEO.sphere} color="#f3d36b" p={[Math.sin(a) * 0.84, 0.26, Math.cos(a) * 0.84 - 0.02]} s={0.045} o={0.004} />; })}
    {[-1, 1].map((sd) => (
      <group key={sd} position={[sd * off * 1.6, off * 2.6, off * 0.6]} rotation={[off * 2 * sd, 0, -sd * off * 5]}>
        <Horn side={sd} />
      </group>
    ))}
  </group>
);

// real Viking helmet (Gjermundbu type): round iron cap, cross bands, spectacle guard
const RealHelmet: React.FC = () => (
  <group>
    <M geo={GEO.half} color="#6f737c" p={[0, 0.2, -0.02]} s={[0.84, 0.78, 0.8]} o={0.03} />
    <M geo={GEO.torus} color="#55585f" p={[0, 0.22, -0.02]} r={[Math.PI / 2, 0, 0]} s={[0.82, 0.78, 0.45]} o={0.012} />
    <M geo={GEO.box} color="#55585f" p={[0, 0.6, -0.02]} r={[0, 0, 0]} s={[0.12, 0.08, 1.58]} o={0.01} />
    <M geo={GEO.box} color="#55585f" p={[0, 0.6, -0.02]} r={[0, 0, 0]} s={[1.66, 0.08, 0.12]} o={0.01} />
    <M geo={GEO.sphere} color="#55585f" p={[0, 0.98, -0.02]} s={0.08} o={0.01} />
    {Array.from({length: 12}).map((_, i) => { const a = (i / 12) * Math.PI * 2; return <M key={'rv' + i} geo={GEO.sphere} color="#8a8e96" p={[Math.sin(a) * 0.84, 0.24, Math.cos(a) * 0.84 - 0.02]} s={0.045} o={0.004} />; })}
    {/* spectacle guard */}
    {[-1, 1].map((sd) => <M key={sd} geo={GEO.torus} color="#55585f" p={[sd * 0.24, 0.08, 0.66]} r={[0, sd * 0.35, 0]} s={[0.17, 0.15, 0.25]} o={0.008} />)}
    <M geo={GEO.box} color="#55585f" p={[0, -0.02, 0.74]} s={[0.07, 0.34, 0.05]} o={0.008} />
  </group>
);

// Bronze Age horned helmet (Veksø type): bronze cap, long curved horns, little beak-face
const BronzeHelmet: React.FC = () => (
  <group>
    <M geo={GEO.half} color="#c48a3a" p={[0, 0, 0]} s={[0.84, 0.72, 0.8]} o={0.03} />
    <M geo={GEO.torus} color="#9a6a2a" p={[0, 0.02, 0]} r={[Math.PI / 2, 0, 0]} s={[0.84, 0.8, 0.5]} o={0.012} />
    {[-1, 1].map((sd) => <group key={sd} position={[0, -0.25, 0]}><Horn side={sd} color="#c48a3a" len={1.25} curl={2.2} /></group>)}
    {[-1, 1].map((sd) => <M key={sd} geo={GEO.sphere} color="#e8c070" p={[sd * 0.2, 0.32, 0.66]} s={0.09} o={0.01} />)}
    <M geo={GEO.cone} color="#9a6a2a" p={[0, 0.2, 0.78]} r={[Math.PI / 2, 0, 0]} s={[0.07, 0.22, 0.07]} o={0.01} />
  </group>
);

const WingHelmet: React.FC = () => (
  <group>
    <M geo={GEO.half} color="#d3d8df" p={[0, 0.22, -0.02]} s={[0.84, 0.72, 0.8]} o={0.03} />
    {[-1, 1].map((sd) => (
      <group key={sd} position={[sd * 0.7, 0.45, -0.1]} rotation={[0, 0, -sd * 0.5]}>
        {[0, 1, 2].map((k) => <T key={k} geo={GEO.sphere} color="#ffffff" p={[sd * (0.15 + k * 0.12), 0.25 + k * 0.2, 0]} s={[0.12, 0.38 - k * 0.07, 0.05]} r={[0, 0, -sd * 0.4]} o={0.012} />)}
      </group>
    ))}
  </group>
);

// ---------------- props ----------------
const Axe: React.FC = () => (
  <group position={[0, -0.08, 0.05]} rotation={[0.25, 0, 0]}>
    <T geo={GEO.cylLow} color="#7a5232" p={[0, 0.25, 0]} s={[0.035, 1.0, 0.035]} o={0.01} />
    <M geo={GEO.box} color="#c9ced6" p={[0, 0.68, 0.12]} r={[0, 0, 0]} s={[0.04, 0.26, 0.22]} o={0.01} />
  </group>
);
const Shovel: React.FC<{dig?: number}> = ({dig = 0}) => (
  <group position={[0, -0.05, 0.05]} rotation={[0.4 + dig * 0.6, 0, 0]}>
    <T geo={GEO.cylLow} color="#8a5a32" p={[0, 0.0, 0]} s={[0.03, 1.4, 0.03]} o={0.01} />
    <M geo={GEO.rbox} color="#9aa0aa" p={[0, -0.8, 0]} s={[0.26, 0.32, 0.04]} o={0.01} />
  </group>
);
const Baton: React.FC = () => <T geo={GEO.cylLow} color="#f5f0e6" p={[0, -0.1, 0.25]} r={[1.3, 0, 0]} s={[0.012, 0.45, 0.012]} o={0.006} />;
const Board: React.FC<{tex: THREE.Texture}> = ({tex}) => (
  <group position={[0.05, -0.05, 0.25]} rotation={[-0.5, 0, 0]}>
    <T geo={GEO.box} color="#c9a87a" s={[0.6, 0.45, 0.03]} o={0.01} />
    <mesh position={[0, 0, 0.02]}><planeGeometry args={[0.52, 0.38]} /><meshBasicMaterial map={tex} /></mesh>
  </group>
);
const RoundShield: React.FC<{tex: THREE.Texture; p: V3; r?: V3; s?: number}> = ({tex, p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.55, 0.55, 0.05, 32]} />
      <meshStandardMaterial attach="material-0" color="#5a3a22" />
      <meshStandardMaterial attach="material-1" map={tex} roughness={0.6} />
      <meshStandardMaterial attach="material-2" map={tex} roughness={0.6} />
    </mesh>
    <M geo={GEO.half} color="#b8bec9" p={[0, 0, 0.03]} r={[Math.PI / 2, 0, 0]} s={0.13} o={0.01} />
    <M geo={GEO.torus} color="#5a3a22" r={[0, 0, 0]} s={[0.55, 0.55, 0.25]} o={0} />
  </group>
);

// ---------------- characters ----------------
type Helm = 'horn' | 'real' | 'bronze' | 'wing' | 'none';
const Viking: React.FC<{
  p?: V3; ry?: number; s?: number; mood?: Mood; look?: number; bob?: number;
  tunic?: string; beard?: string; helm?: Helm; hornOff?: number; armR?: number; armL?: number; elbowR?: number; elbowL?: number;
  handR?: React.ReactNode; handL?: React.ReactNode; shield?: THREE.Texture; headTilt?: number; cape?: string; walk?: number; blink?: boolean; talk?: number;
}> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'stern', look = 0, bob = 0, tunic = '#4f7a3a', beard = '#d9792b', helm = 'horn', hornOff = 0, armR = 0.1, armL = 0.1, elbowR = 0.3, elbowL = 0.3, handR, handL, shield, headTilt = 0, cape, walk = 0, blink = false, talk = 0}) => {
  const b = Math.sin(bob * Math.PI * 2) * 0.015;
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <group position={[0, b, 0]}>
        <StickBody robe={tunic} trim="#6b4426" skin="#f0bf98" armR={armR} armL={armL} elbowR={elbowR} elbowL={elbowL} handR={handR} handL={handL} walk={walk} />
        {/* belt + fur collar */}
        <T geo={GEO.torus} color="#3a2618" p={[0, 1.5, 0]} r={[Math.PI / 2, 0, 0]} s={[0.33, 0.27, 0.6]} o={0.01} />
        <M geo={GEO.box} color="#e0b04a" p={[0, 1.5, 0.3]} s={[0.1, 0.08, 0.04]} o={0.006} />
        <T geo={GEO.torus} color="#8a6a4a" p={[0, 1.98, 0]} r={[Math.PI / 2, 0, 0]} s={[0.3, 0.26, 1.4]} o={0.012} />
        {cape ? <T geo={GEO.box} color={cape} p={[0, 1.5, -0.28]} r={[0.08, 0, 0]} s={[0.62, 1.0, 0.04]} o={0.012} /> : null}
        {shield ? <RoundShield tex={shield} p={[-0.52, 1.35, 0.28]} r={[0, -0.5, 0]} s={0.9} /> : null}
      </group>
      <group position={[0, HEAD_Y + b * 1.6, 0]} rotation={[0, 0, headTilt + Math.sin(bob * Math.PI * 2 + 1) * 0.03]}>
        <Head skin="#f0bf98" mood={mood} look={look} hair={beard} hairStyle={helm === 'none' ? 'curly' : 'none'} blink={blink} talk={talk} />
        {/* beard below the mouth + braids */}
        <T geo={GEO.sphere} color={beard} p={[0, -0.56, 0.36]} s={[0.46, 0.3, 0.3]} o={0.02} />
        {[-1, 1].map((sd) => <T key={sd} geo={GEO.cap} color={beard} p={[sd * 0.18, -0.8, 0.42]} s={[0.1, 0.14, 0.1]} o={0.012} />)}
        {helm !== 'none' ? [-1, 1].map((sd) => <T key={'h' + sd} geo={GEO.sphere} color={beard} p={[sd * 0.66, -0.15, -0.2]} s={[0.16, 0.3, 0.3]} o={0.015} />) : null}
        {helm === 'horn' ? <HornHelmet off={hornOff} /> : null}
        {helm === 'real' ? <RealHelmet /> : null}
        {helm === 'wing' ? <WingHelmet /> : null}
        {helm === 'bronze' ? <group position={[0, 0.22, 0]}><BronzeHelmet /></group> : null}
      </group>
    </group>
  );
};

// generic 19th/20th century person
const Person: React.FC<{
  p?: V3; ry?: number; s?: number; mood?: Mood; look?: number; bob?: number; coat: string; skin?: string; hair?: string;
  hat?: 'cap' | 'beret' | 'none'; whiskers?: string; mustache?: string; armR?: number; armL?: number; elbowR?: number; elbowL?: number; handR?: React.ReactNode; handL?: React.ReactNode; hairStyle?: 'caesar' | 'bald' | 'curly' | 'none';
}> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'calm', look = 0, bob = 0, coat, skin = '#f2c4a0', hair = '#4a3020', hat = 'none', whiskers, mustache, armR = 0.1, armL = 0.1, elbowR = 0.3, elbowL = 0.3, handR, handL, hairStyle = 'caesar'}) => {
  const b = Math.sin(bob * Math.PI * 2) * 0.015;
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <group position={[0, b, 0]}>
        <StickBody robe={coat} trim="#222" skin={skin} armR={armR} armL={armL} elbowR={elbowR} elbowL={elbowL} handR={handR} handL={handL} />
        <T geo={GEO.box} color="#ffffff" p={[0, 1.88, 0.2]} r={[0.3, 0, 0]} s={[0.16, 0.16, 0.04]} o={0.006} />
      </group>
      <group position={[0, HEAD_Y + b * 1.6, 0]}>
        <Head skin={skin} mood={mood} look={look} hair={hair} hairStyle={hairStyle} />
        {whiskers ? [-1, 1].map((sd) => <T key={sd} geo={GEO.sphere} color={whiskers} p={[sd * 0.62, -0.42, 0.18]} s={[0.16, 0.3, 0.2]} o={0.015} />) : null}
        {mustache ? <T geo={GEO.sphere} color={mustache} p={[0, -0.3, 0.66]} s={[0.24, 0.06, 0.08]} o={0.01} /> : null}
        {hat === 'cap' ? (
          <group position={[0, 0.42, 0]} rotation={[-0.15, 0, 0]}>
            <T geo={GEO.sphere} color="#6b6458" s={[0.8, 0.26, 0.78]} o={0.02} />
            <T geo={GEO.box} color="#5a5448" p={[0, -0.05, 0.72]} r={[0.25, 0, 0]} s={[0.7, 0.05, 0.36]} o={0.012} />
          </group>
        ) : null}
        {hat === 'beret' ? <T geo={GEO.sphere} color="#1d1a22" p={[-0.1, 0.5, -0.05]} r={[-0.2, 0, 0.25]} s={[0.86, 0.24, 0.84]} o={0.02} /> : null}
      </group>
    </group>
  );
};

// ---------------- sets ----------------
const skyTex = (() => { let c: THREE.Texture | null = null; return () => c ?? (c = cTex(16, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#3f8fd8'); gr.addColorStop(0.45, '#8cc8f0'); gr.addColorStop(0.62, '#d8eefa'); gr.addColorStop(1, '#f4f1e4'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); })); })();
const Sky: React.FC<{top?: string}> = ({top = '#9fd4f2'}) => (
  <>
    <color attach="background" args={[top]} />
    <fog attach="fog" args={['#cfe6f6', 35, 120]} />
    <mesh scale={150}><sphereGeometry args={[1, 32, 24]} /><meshBasicMaterial map={skyTex()} side={THREE.BackSide} fog={false} /></mesh>
  </>
);
const Cloud: React.FC<{p: V3; s: number; t: number}> = ({p, s, t}) => (
  <group position={[p[0] + t * 0.15, p[1], p[2]]} scale={s}>
    {[[-1.1, 0, 0, 0.75], [0, 0.35, 0.1, 1], [1.1, 0.05, 0, 0.8], [0.5, -0.25, 0.4, 0.7], [-0.5, -0.25, 0.4, 0.7]].map(([x, y, z, r], k) => (
      <mesh key={k} position={[x, y, z]} scale={[r, r * 0.8, r * 0.75]}><sphereGeometry args={[1, 20, 14]} /><meshLambertMaterial color="#ffffff" emissive="#dfe8f2" emissiveIntensity={0.55} fog={false} /></mesh>
    ))}
  </group>
);
const Lights: React.FC<{warm?: boolean; dim?: number}> = ({warm, dim = 1}) => (
  <>
    <hemisphereLight args={['#f4fbff', warm ? '#6a3a2a' : '#7a9a6a', 1.1 * dim]} />
    <ambientLight intensity={0.2 * dim} />
    <directionalLight position={[8, 14, 10]} intensity={2.6 * dim} color={warm ? '#ffd9a0' : '#fff6e4'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0004} shadow-radius={5} />
    <directionalLight position={[-6, 6, 8]} intensity={0.9 * dim} color="#e8f0ff" />
    <directionalLight position={[-3, 7, -12]} intensity={1.8 * dim} color="#fff0d8" />
  </>
);

const Longship: React.FC<{p: V3; ry?: number; t: number; tex: ReturnType<typeof useTex>; s?: number}> = ({p, ry = 0, t, tex, s = 1}) => (
  <group position={[p[0], p[1] + Math.sin(t * 1.6) * 0.08, p[2]]} rotation={[Math.sin(t * 1.3) * 0.03, ry, Math.sin(t * 1.1) * 0.04]} scale={s}>
    <T geo={GEO.sphere} color="#7a4a26" p={[0, 0.3, 0]} s={[3.6, 0.7, 0.9]} o={0.04} />
    <T geo={GEO.box} color="#5e3a1e" p={[0, 0.72, 0]} s={[6.6, 0.1, 1.5]} o={0.02} />
    {/* dragon prow + stern */}
    <T geo={GEO.cap} color="#7a4a26" p={[3.5, 1.2, 0]} r={[0, 0, -0.5]} s={[0.24, 1.0, 0.24]} o={0.02} />
    <T geo={GEO.sphere} color="#7a4a26" p={[3.85, 1.95, 0]} s={[0.36, 0.24, 0.22]} o={0.02} />
    <T geo={GEO.sphere} color="#f3d36b" p={[4.0, 2.02, 0.15]} s={0.05} o={0.005} />
    <T geo={GEO.cap} color="#7a4a26" p={[-3.5, 1.2, 0]} r={[0, 0, 0.5]} s={[0.24, 1.0, 0.24]} o={0.02} />
    {/* shields along the side */}
    {Array.from({length: 7}).map((_, i) => <RoundShield key={i} tex={[tex.sh1, tex.sh2, tex.sh3][i % 3]} p={[-2.4 + i * 0.8, 0.68, 0.82]} s={0.55} />)}
    {/* mast + striped sail */}
    <T geo={GEO.cylLow} color="#6b4426" p={[0, 3.0, 0]} s={[0.08, 4.6, 0.08]} o={0.01} />
    <T geo={GEO.cylLow} color="#6b4426" p={[0, 4.6, 0.05]} r={[0, 0, Math.PI / 2]} s={[0.05, 3.4, 0.05]} o={0.01} />
    <mesh position={[0, 3.15, 0.12]} rotation={[0.05 + Math.sin(t * 2) * 0.02, 0, 0]} castShadow>
      <planeGeometry args={[3.2, 2.9, 8, 8]} />
      <meshStandardMaterial map={tex.sail} side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  </group>
);

const SEA_W = 220, SEA_D = 80, SEA_X = 110, SEA_Z = 60;
const Sea: React.FC<{t: number}> = ({t}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SEA_W, SEA_D, SEA_X, SEA_Z);
    g.rotateX(-Math.PI / 2);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    return g;
  }, []);
  const pos = geo.attributes.position as THREE.BufferAttribute, col = geo.attributes.color as THREE.BufferAttribute;
  const deep = new THREE.Color('#1f5f9a'), mid = new THREE.Color('#2f86c4'), crest = new THREE.Color('#bfe6ff');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = 0.12 * Math.sin(x * 0.35 + t * 1.6) + 0.09 * Math.sin(z * 0.5 - t * 1.2 + x * 0.12) + 0.05 * Math.sin((x + z) * 0.9 + t * 2.3);
    pos.setY(i, h);
    const k = Math.max(0, Math.min(1, (h + 0.18) / 0.4));
    c.copy(deep).lerp(mid, Math.min(1, k * 1.4));
    if (k > 0.82) c.lerp(crest, (k - 0.82) * 4);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} position={[0, -0.2, -40]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.75} metalness={0} flatShading />
    </mesh>
  );
};
const Tuft: React.FC<{p: V3; s?: number; t: number}> = ({p, s = 1, t}) => (
  <group position={p} scale={s}>
    {[-0.25, -0.1, 0.05, 0.2, 0.3].map((x, k) => (
      <mesh key={k} position={[x, 0.22, (k % 2) * 0.08]} rotation={[0, 0, -x * 1.4 + Math.sin(t * 2 + p[0] + k) * 0.06]} castShadow>
        <coneGeometry args={[0.06, 0.5 + (k % 3) * 0.12, 5]} /><meshStandardMaterial color={k % 2 ? '#4f8f36' : '#5fa043'} roughness={1} />
      </mesh>
    ))}
  </group>
);
const Fjord: React.FC<{t: number; tex: ReturnType<typeof useTex>; children?: React.ReactNode; shipX: number}> = ({t, tex, children, shipX}) => (
  <>
    <Sky />
    <Lights />
    <mesh position={[-25, 30, -90]}><sphereGeometry args={[5, 24, 16]} /><meshBasicMaterial color="#fff6c8" /></mesh>
    {[[-24, 24, -70, 4.5], [10, 30, -80, 6], [32, 22, -68, 4], [-8, 36, -95, 6.5]].map(([x, y, z, s], i) => <Cloud key={i} p={[x, y, z]} s={s} t={t} />)}
    {/* sea */}
    <Sea t={t} />
    {Array.from({length: 30}).map((_, i) => {
      const x = -30 + rnd(i) * 60, z = -4 - rnd(i * 3) * 30, ph = rnd(i * 7) * 6;
      const k = 0.5 + 0.5 * Math.sin(t * 1.6 + ph);
      return <mesh key={i} position={[x + Math.sin(t * 0.5 + ph) * 0.5, -0.17, z]} scale={[0.9 * k + 0.2, 0.02, 0.12]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#d8efff" /></mesh>;
    })}
    {/* mountains on both sides of the fjord */}
    {[[-26, -40, 14, 18], [-14, -55, 12, 15], [22, -45, 15, 20], [36, -30, 12, 14], [6, -70, 16, 13]].map(([x, z, r, h], i) => (
      <group key={i} position={[x, -0.2, z]}>
        <T geo={GEO.cone} color={i % 2 ? '#5f7f5a' : '#6d8d62'} p={[0, h / 2, 0]} s={[r, h, r]} o={0} />
        <T geo={GEO.cone} color="#f4f7fb" p={[0, h * 0.86, 0]} s={[r * 0.3, h * 0.28, r * 0.3]} o={0} />
      </group>
    ))}
    {/* shore */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 20]} receiveShadow><planeGeometry args={[220, 40]} /><meshStandardMaterial map={tex.grass} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.4]}><planeGeometry args={[220, 1.2]} /><meshStandardMaterial color="#b9a888" roughness={1} /></mesh>
    {[[-7, -0.5, 0.9], [8, 0.6, 1.2], [-11, 2, 0.7]].map(([x, z, s], i) => <T key={i} geo={GEO.sphere} color="#8f8a82" p={[x, s * 0.3, z]} s={[s, s * 0.6, s * 0.8]} o={0.03} />)}
    {Array.from({length: 26}).map((_, i) => <Tuft key={'tf' + i} t={t} p={[-8 + rnd(i * 11) * 16, 0, 1.4 + rnd(i * 13) * 9]} s={0.7 + rnd(i * 17) * 0.6} />)}
    {Array.from({length: 14}).map((_, i) => <T key={'pb' + i} geo={GEO.sphere} color={i % 2 ? '#a39c90' : '#8f887e'} p={[-9 + rnd(i * 19) * 18, 0.03, 0.2 + rnd(i * 23) * 0.9]} s={[0.12 + rnd(i) * 0.1, 0.06, 0.1]} o={0.008} />)}
    {Array.from({length: 8}).map((_, i) => (
      <group key={i} position={[(i % 2 ? 1 : -1) * (7 + (i >> 1) * 2.6 + rnd(i) * 1.5), 0, 3 + rnd(i * 5) * 5]}>
        <T geo={GEO.cylLow} color="#6b4426" p={[0, 0.6, 0]} s={[0.15, 1.2, 0.15]} o={0.01} />
        <T geo={GEO.cone} color="#2f6a3a" p={[0, 2.0, 0]} s={[0.9, 2.2, 0.9]} o={0.02} />
        <T geo={GEO.cone} color="#3a7a44" p={[0, 2.9, 0]} s={[0.65, 1.6, 0.65]} o={0.02} />
      </group>
    ))}
    <Longship p={[shipX, 0, -7]} t={t} tex={tex} />
    <Longship p={[shipX - 12, 0, -16]} t={t + 1.3} tex={tex} s={0.85} />
    {children}
  </>
);

const Farm: React.FC<{t: number; tex: ReturnType<typeof useTex>; dig: number; helmetUp: number; shine: number}> = ({t, tex, dig, helmetUp, shine}) => (
  <>
    <Sky top="#b8d2e4" />
    <Lights dim={0.95} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial map={tex.grass} color="#cfe0b0" roughness={1} /></mesh>
    {/* distant hills + farmhouse */}
    {[[-30, -60, 30], [20, -70, 36], [50, -50, 22]].map(([x, z, r], i) => <T key={i} geo={GEO.sphere} color={i % 2 ? '#6d8d62' : '#7a9a6a'} p={[x, 0, z]} s={[r, r * 0.35, r * 0.6]} o={0} />)}
    <group position={[-9, 0, -14]} rotation={[0, 0.4, 0]}>
      <T geo={GEO.box} color="#a8322a" p={[0, 1.5, 0]} s={[5, 3, 3.6]} o={0.03} />
      <T geo={GEO.box} color="#3a3a3a" p={[0, 3.6, 0]} r={[0, 0, Math.PI / 4]} s={[2.9, 2.9, 3.8]} o={0.03} />
      <T geo={GEO.box} color="#f3ead8" p={[1, 1.4, 1.81]} s={[0.8, 1.0, 0.04]} o={0.01} />
      <T geo={GEO.box} color="#f3ead8" p={[-1.2, 1.0, 1.81]} s={[0.9, 2.0, 0.04]} o={0.01} />
    </group>
    {/* the burial mound with an opened front */}
    <T geo={GEO.half} color="#6a9a4a" p={[0, -0.1, -3]} s={[4.6, 2.2, 3.4]} o={0} />
    <mesh position={[0, 0.02, 0.38]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6 * Math.min(1, dig + 0.3), 1, 1]}>
      <circleGeometry args={[1, 32]} /><meshStandardMaterial color="#5a3d26" roughness={1} />
    </mesh>
    {Array.from({length: 9}).map((_, i) => <T key={i} geo={GEO.sphere} color="#6b4a30" p={[2.2 + rnd(i) * 1.2, 0.1, 1.2 + rnd(i * 3) * 1.4]} s={[0.35 * Math.min(1, dig * 1.5), 0.2 * Math.min(1, dig * 1.5), 0.3]} o={0.012} />)}
    {/* the helmet rising out of the earth */}
    <group position={[0, -1.4 + helmetUp * 3.4, 0.4]} rotation={[0.35, Math.sin(t * 0.8) * 0.5 * helmetUp, 0]} scale={0.9}>
      <RealHelmet />
      {shine > 0 ? <pointLight position={[0, 0.5, 1.2]} intensity={6 * shine} distance={6} color="#fff2c0" /> : null}
    </group>
    {shine > 0 ? Array.from({length: 10}).map((_, i) => {
      const a = (i / 10) * Math.PI * 2 + t * 0.4;
      return <mesh key={i} position={[Math.cos(a) * 1.4, 2.4 + Math.sin(a) * 1.4, 0.2]} rotation={[0, 0, a]} scale={[0.6 * shine, 0.05, 0.02]} castShadow={false}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#fff2c0" transparent opacity={0.7 * shine} /></mesh>;
    }) : null}
    <Person p={[2.6, 0, 0.6]} ry={-0.55 + helmetUp * 0.2} coat="#3f5d86" hat="cap" mood={helmetUp > 0.3 ? 'shock' : 'calm'} look={-0.5} bob={t * 0.8} hair="#6a4a2a" mustache="#6a4a2a"
      armR={0.3 + Math.max(0, Math.sin(t * 5)) * 0.5 * (1 - helmetUp)} elbowR={0.6} armL={0.4} elbowL={0.8} handR={<Shovel dig={Math.max(0, Math.sin(t * 5)) * (1 - helmetUp)} />} />
  </>
);

const Stage: React.FC<{t: number; tex: ReturnType<typeof useTex>; open: number; children?: React.ReactNode; clap: number}> = ({t, tex, open, children, clap}) => (
  <>
    <color attach="background" args={['#1a0f14']} />
    <hemisphereLight args={['#ffe8c8', '#3a1a18', 0.7]} />
    <ambientLight intensity={0.25} />
    <spotLight position={[0, 9, 7]} angle={0.55} penumbra={0.6} intensity={140} color="#fff1d0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} target-position={[0, 0, -1]} />
    <spotLight position={[-6, 7, 5]} angle={0.5} penumbra={0.7} intensity={60} color="#ffd29a" />
    <spotLight position={[6, 7, 5]} angle={0.5} penumbra={0.7} intensity={60} color="#c8d8ff" />
    {/* stage floor */}
    <mesh position={[0, -0.5, -1.5]} receiveShadow><boxGeometry args={[16, 1, 8]} /><meshStandardMaterial map={tex.wood} roughness={0.7} /></mesh>
    {/* backdrop: painted fjord */}
    <mesh position={[0, 4, -5.4]}><planeGeometry args={[16, 9]} /><meshStandardMaterial color="#3a5a7a" roughness={1} /></mesh>
    {[[-5, 3.5], [0, 5], [5, 3.8]].map(([x, h], i) => <mesh key={i} position={[x, h / 2, -5.3]}><coneGeometry args={[3, h, 3]} /><meshStandardMaterial color="#2a4058" roughness={1} /></mesh>)}
    <mesh position={[3.5, 6.2, -5.3]}><circleGeometry args={[0.8, 24]} /><meshBasicMaterial color="#f3e2b8" /></mesh>
    {/* proscenium */}
    <M geo={GEO.box} color="#c9a03a" p={[0, 8.2, 2.2]} s={[18, 1.2, 0.4]} o={0.02} />
    {[-1, 1].map((sd) => <M key={sd} geo={GEO.box} color="#c9a03a" p={[sd * 8.2, 4, 2.2]} s={[1.2, 9, 0.4]} o={0.02} />)}
    {/* side curtains: open from the middle */}
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[sd * (2 + open * 4.2), 4, 1.8]} scale={[4.2 - open * 2.2, 8.4, 0.3]} castShadow>
        <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial map={tex.curtain} roughness={0.9} />
      </mesh>
    ))}
    <mesh position={[0, 7.4, 1.9]} scale={[16, 1.1, 0.3]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial map={tex.curtain} roughness={0.9} /></mesh>
    {/* footlights */}
    {Array.from({length: 13}).map((_, i) => (
      <group key={i} position={[-6 + i, 0.05, 2.3]}>
        <M geo={GEO.half} color="#5a4a2a" s={[0.18, 0.12, 0.18]} o={0.006} />
        <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.08, 12, 8]} /><meshBasicMaterial color="#fff2b0" /></mesh>
      </group>
    ))}
    {/* orchestra pit edge + audience rows (backs of heads) */}
    <mesh position={[0, -1.2, 3.6]}><boxGeometry args={[18, 0.6, 2.2]} /><meshStandardMaterial color="#2a1a14" /></mesh>
    {Array.from({length: 4}).map((_, r) =>
      Array.from({length: 11}).map((__, c) => {
        const x = -7.5 + c * 1.5 + (r % 2) * 0.6, z = 6 + r * 1.5, y = 0.4 + r * 0.35;
        const hop = clap * Math.max(0, Math.sin(t * 9 + c * 1.7 + r)) * 0.12;
        const col = ['#2a2230', '#3a2a22', '#22303a', '#3a2232'][(c + r) % 4];
        return (
          <group key={r + '-' + c} position={[x, y + hop, z]}>
            <T geo={GEO.sphere} color={col} p={[0, 0, 0]} s={[0.5, 0.45, 0.4]} o={0.015} />
            <T geo={GEO.sphere} color={(c + r) % 3 ? '#4a3020' : '#8a6a40'} p={[0, 0.72, 0]} s={0.32} o={0.015} />
            {clap > 0 ? [-1, 1].map((sd) => <T key={sd} geo={GEO.sphere} color="#f2c4a0" p={[sd * (0.12 + 0.08 * Math.abs(Math.sin(t * 14 + c))), 1.15, 0.1]} s={0.09} o={0.006} />) : null}
          </group>
        );
      }),
    )}
    {children}
  </>
);

const Museum: React.FC<{t: number; tex: ReturnType<typeof useTex>}> = ({t, tex}) => (
  <>
    <color attach="background" args={['#14161c']} />
    <hemisphereLight args={['#d8e4ff', '#201a18', 0.5]} />
    <ambientLight intensity={0.15} />
    <spotLight position={[0, 8, 4]} angle={0.4} penumbra={0.6} intensity={180} color="#fff1d6" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#3a3530" roughness={0.6} /></mesh>
    <mesh position={[0, 6, -4]}><planeGeometry args={[40, 14]} /><meshStandardMaterial color="#26303c" roughness={1} /></mesh>
    {/* pedestal + glass case */}
    <T geo={GEO.box} color="#efe9df" p={[0, 0.7, 0]} s={[4.2, 1.4, 2.0]} o={0.02} />
    <mesh position={[0, 2.6, 0]}>
      <boxGeometry args={[4.0, 2.4, 1.8]} />
      <meshStandardMaterial color="#cfe6ff" transparent opacity={0.12} roughness={0.05} metalness={0.2} depthWrite={false} />
    </mesh>
    {[-1, 1].map((sd) => (
      <group key={sd} position={[sd * 1.0, 1.95 + Math.sin(t * 1.2 + sd) * 0.03, 0]} rotation={[0, sd * 0.35 + Math.sin(t * 0.6) * 0.08, 0]} scale={0.62}>
        <BronzeHelmet />
      </group>
    ))}
  </>
);

// ---------------- camera ----------------
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number; set: SetName};
const sh = (at: number, set: SetName, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov = 48): Shot => ({at, from, to, lookA, lookB, dur, fov, set});
const HERO: V3 = [0, 0, 2];
const SHOTS: Shot[] = [
  // 0 hook: push in on the horned hero
  sh(0, 'fjord', [0.6, 2.8, 11.5], [0.2, 3.0, 9.0], [0, 2.5, 2], [0, 2.8, 2], 2.6, 46),
  sh(W('But') - 0.1, 'fjord', [-1.6, 3.2, 6.2], [-1.2, 3.1, 5.6], [0, 2.9, 2], [0, 3.0, 2], 1.4, 44),
  // 1 the horns? close-up
  sh(L(1) - 0.1, 'fjord', [0, 3.6, 5.2], [0, 3.7, 4.7], [0, 3.4, 2], [0, 3.5, 2], 1.2, 40),
  // 2 never: horns fly off
  sh(L(2) - 0.1, 'fjord', [0.4, 3.0, 7.0], [0.2, 3.3, 7.6], [0, 3.0, 2], [0, 3.4, 2], 1.8, 46),
  // 3 longships set sail: wide
  sh(L(3) - 0.1, 'fjord', [-6, 5.5, 14], [2, 6.5, 13], [-4, 2, -8], [4, 2.5, -8], 5.5, 50),
  // 4 the real gear: three Vikings with axes and shields
  sh(L(4) - 0.1, 'fjord', [-2.4, 2.6, 9.5], [1.2, 2.6, 9.0], [-0.5, 2.0, 2.5], [0.8, 2.0, 2.5], 3.2, 46),
  // 5 horns are in the way (bonk)
  sh(L(5) - 0.1, 'fjord', [1.4, 2.9, 9.6], [1.1, 3.0, 8.6], [-0.8, 2.5, 2.0], [-0.6, 2.7, 2.0], 3.6, 44),
  // 6 the farm, 1943
  sh(L(6) - 0.1, 'farm', [-3.0, 3.4, 12.5], [-2.0, 3.6, 11.0], [1.2, 1.3, -0.5], [1.4, 1.4, -0.5], 3.0, 48),
  sh(W('farmer') - 0.1, 'farm', [3.6, 3.0, 10.0], [3.2, 2.9, 9.0], [2.3, 1.7, 0.5], [2.2, 1.6, 0.5], 2.2, 46),
  // 7 the helmet rises
  sh(L(7) - 0.1, 'farm', [0, 2.0, 8.2], [0, 2.2, 6.6], [0, 1.6, 0.4], [0, 2.0, 0.4], 4.0, 42),
  // 8 no horns
  sh(L(8) - 0.1, 'farm', [1.6, 2.4, 6.2], [1.1, 2.3, 5.5], [0, 2.0, 0.4], [0, 2.0, 0.4], 1.6, 40),
  // 9 where does the myth come from? hero in the dark
  sh(L(9) - 0.1, 'fjord', [0, 3.0, 8.6], [0, 3.0, 7.4], [0, 2.7, 2], [0, 2.8, 2], 2.0, 44),
  // 10 Bayreuth 1876: curtains open, wide from the audience
  sh(L(10) - 0.1, 'stage', [0, 4.2, 15.5], [0, 3.6, 13.5], [0, 2.6, -1], [0, 2.5, -1], 3.6, 48),
  // 11 Wagner conducts
  sh(L(11) - 0.1, 'stage', [-5.6, 3.0, -1.0], [-5.0, 2.9, -0.5], [-2.5, 1.5, 3.6], [-2.5, 1.5, 3.6], 2.4, 42),
  sh(WL(11, 'The') - 0.1, 'stage', [0, 3.4, 11], [0, 3.1, 9.6], [0, 2.6, -1], [0, 2.6, -1], 2.5, 48),
  // 12 Doepler designs, helmet drops on the singer
  sh(L(12) - 0.1, 'stage', [4.8, 2.9, 8.0], [4.4, 2.8, 7.4], [1.2, 2.3, 0], [1.4, 2.3, 0], 2.4, 44),
  sh(W('horned') - 0.6, 'stage', [-0.6, 3.2, 7.4], [-0.2, 3.3, 6.8], [-0.8, 3.0, -0.5], [-0.8, 3.1, -0.5], 2.6, 44),
  // 13 audience loves it + copies
  sh(L(13) - 0.1, 'stage', [0, 5.6, 16], [0, 5.0, 14.4], [0, 2.4, 0], [0, 2.2, 0], 2.0, 50),
  sh(W('Painters') - 0.1, 'stage', [0, 2.8, 8.8], [0, 2.7, 8.0], [0, 2.0, 0.5], [0, 2.0, 0.5], 3.0, 52),
  // 14/15 real horned helmets: bronze age museum
  sh(L(14) - 0.1, 'museum', [0, 3.0, 8.2], [0, 2.7, 6.9], [0, 2.2, 0], [0, 2.2, 0], 3.0, 46),
  sh(L(15) - 0.1, 'museum', [2.6, 2.4, 6.4], [1.8, 2.3, 6.4], [0, 2.0, 0], [0, 2.0, 0], 4.0, 48),
  // 16 twist: the famous Viking stands on an opera stage
  sh(L(16) - 0.1, 'stage', [0, 2.8, 5.0], [0, 3.4, 9.5], [0, 2.8, -0.5], [0, 2.4, -0.5], 3.2, 48),
  // 17/18 end card over a wide fjord
  sh(L(17) - 0.15, 'fjord', [-3, 5.5, 15], [3, 6.5, 16], [-2, 2.5, -6], [2, 2.5, -6], 7, 50),
];

function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to);
  pos[1] += Math.sin(t * 1.1 + 1) * 0.03;
  pos[0] += Math.sin(t * 0.7) * 0.03;
  return {pos, look: lp(s.lookA, s.lookB), fov: s.fov, cutAt: s.at, idx: i, set: s.set};
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
  const hot = /horn|viking|1943|1876|opera|bronze|never|no|made|1,500|wagner|doepler|germany/i;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1400, textAlign: 'center', transform: `scale(${0.82 + 0.18 * s})`}}>
      {chunk.map((w, k) => {
        const txt = w.text.replace(/[.,!?:]$/, '');
        const col = hot.test(txt) ? '#FFD23F' : '#fff';
        return <span key={k} style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, letterSpacing: -1, color: col, WebkitTextStroke: '16px #0e0b12', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.35)'}}>{(k ? ' ' : '') + txt.toUpperCase()}</span>;
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
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, letterSpacing: 8, color: '#fff', background: bg, padding: '14px 30px', borderRadius: 14}}>{text}</span>
    </div>
  );
};

const Stamp: React.FC<{text: string; at: number; until: number; t: number; frame: number; fps: number; color?: string; top?: number; rot?: number}> = ({text, at, until, t, frame, fps, color = '#ff3b3b', top = 520, rot = -10}) => {
  if (t < at || t > until + 0.25) return null;
  const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 9, stiffness: 260}});
  const o = interpolate(t, [until, until + 0.25], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o}}>
      <span style={{display: 'inline-block', transform: `rotate(${rot}deg) scale(${2.2 - 1.2 * s})`, fontFamily: FONT, fontWeight: 900, fontSize: 150, color, border: `16px solid ${color}`, borderRadius: 26, padding: '0 40px', letterSpacing: 6, background: 'rgba(255,255,255,.85)'}}>{text}</span>
    </div>
  );
};

// ---------------- main ----------------
export const VikingMyth: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const tex = useTex();

  // hero state
  const hornFly = interpolate(t, [W('ever') - 0.05, W('ever') + 0.9], [0, 1], cl);
  const hornsBack = t >= L(5) - 0.15;
  const hornOff = hornsBack ? 0 : hornFly;
  let heroMood: Mood = 'smug';
  if (t >= W('But') - 0.05) heroMood = 'grumpy';
  if (t >= L(1)) heroMood = 'stern';
  if (t >= L(2)) heroMood = 'shock';
  if (t >= L(9)) heroMood = 'shock';
  if (t >= L(16)) heroMood = 'grin';
  const heroArm = t < L(1) ? interpolate(t, [0, 0.5], [0.2, 2.3], cl) : 0.25;
  // bonk gag (line 5): hero turns, horn hits his buddy
  const turn = interpolate(t, [W('In') - 0.15, W('In') + 0.25, LE(5) - 0.2, LE(5) + 0.2], [0, 1, 1, 0], cl);
  const bonk = t > W('In') + 0.2 && t < LE(5) + 0.1;

  // farm
  const helmetUp = interpolate(t, [L(7) + 0.1, L(7) + 1.6], [0, 1], {...cl, easing: Easing.out(Easing.back(1.3))});
  const shine = interpolate(t, [L(7) + 0.6, L(7) + 1.2], [0, 1], cl);
  const dig = interpolate(t, [L(6), L(7)], [0, 1], cl);

  // stage
  const open = interpolate(t, [L(10) + 0.2, L(10) + 2.2], [0, 1], {...cl, easing: ease});
  const drop = interpolate(t, [W('horned') - 0.5, W('horned') + 0.1], [3.2, 0], {...cl, easing: Easing.bezier(0.5, 0, 0.9, 0.6)});
  const squash = t > W('horned') + 0.1 && t < W('horned') + 0.35 ? 0.08 * Math.sin((t - W('horned') - 0.1) * 26) : 0;
  const clap = t >= L(13) && t < L(14) ? 1 : t >= L(16) ? 1 : 0;
  const prop = (w: string) => spring({frame: frame - Math.round((W(w) - 0.05) * fps), fps, config: {damping: 10}});
  const shipX = -8 + t * 0.8;

  const punchAt = [W('horns?', 0), W('ever'), W('no', 0), L(8), L(16)];
  let punch = 0;
  for (const p of punchAt) punch = Math.max(punch, interpolate(t - p, [0, 0.12, 0.45], [0, 0.08, 0], cl));
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [0.2, 0], cl);
  const darken = interpolate(t, [L(9) - 0.15, L(9) + 0.2, LE(9) + 0.1, LE(9) + 0.3], [0, 0.45, 0.45, 0], cl);
  const endO = interpolate(t, [L(17) + 0.1, L(17) + 0.5], [0, 1], cl);
  const cardS = (k: number) => spring({frame: frame - Math.round((W('Goldfish') - 0.1 + k * (W('brain') - W('Goldfish'))) * fps), fps, config: {damping: 11}});
  const tlO = interpolate(t, [L(15) + 0.1, L(15) + 0.4, LE(15) + 0.3, LE(15) + 0.6], [0, 1, 1, 0], cl);
  const tlP = interpolate(t, [W('Over', 1) - 0.1, LE(15)], [0, 1], {...cl, easing: ease});
  const loopFlash = interpolate(t, [VIKING_DURATION - 0.25, VIKING_DURATION - 0.05], [0, 1], cl);

  const set = cam.set;
  return (
    <AbsoluteFill style={{backgroundColor: '#9fd4f2'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true}} camera={{fov: 48, near: 0.1, far: 300}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} punch={punch} />
        {set === 'fjord' ? (
          <Fjord t={t} tex={tex} shipX={shipX}>
            {t < L(4) || t >= L(5) - 0.15 ? (
              <>
                <Viking p={HERO} blink={blinkAt(t)} ry={turn * -1.1} mood={bonk ? 'grin' : heroMood} bob={t * 0.8} hornOff={hornOff} armR={heroArm} elbowR={0.2} handR={<Axe />} shield={tex.sh1} cape="#7a2a2a" />
                {t >= L(5) - 0.15 && t < L(6) ? (
                  <Viking p={[-1.75, 0, 2.2]} ry={0.5} helm="real" tunic="#5a6fa0" beard="#4a2e1a" mood={bonk ? 'shock' : 'grumpy'} bob={t * 0.8 + 0.3} headTilt={bonk ? 0.25 : 0} shield={tex.sh2} handR={<Axe />} />
                ) : null}
              </>
            ) : (
              <>
                <Viking p={[-1.6, 0, 2.6]} ry={0.25} helm="real" tunic="#5a6fa0" beard="#4a2e1a" mood="stern" bob={t * 0.8} shield={tex.sh2} handR={<Axe />} armR={0.6} elbowR={0.4} />
                <Viking p={[0, 0, 2.0]} helm="none" tunic="#8a5a2a" beard="#d9a03a" mood="grin" bob={t * 0.8 + 0.4} shield={tex.sh3} armR={interpolate(t, [W('spears') - 0.1, W('spears') + 0.2], [0.2, 2.4], cl)} elbowR={0.1}
                  handR={<group><T geo={GEO.cylLow} color="#7a5232" p={[0, 0.4, 0.05]} s={[0.03, 2.2, 0.03]} o={0.01} /><M geo={GEO.cone} color="#d6dae0" p={[0, 1.6, 0.05]} s={[0.06, 0.26, 0.06]} o={0.01} /></group>} />
                <Viking p={[1.6, 0, 2.6]} ry={-0.25} helm="real" tunic="#4f7a3a" beard="#e8e0d0" mood="smug" bob={t * 0.8 + 0.8} shield={tex.sh1} handR={<Axe />} armR={interpolate(t, [W('axes') - 0.1, W('axes') + 0.2], [0.2, 2.2], cl)} elbowR={0.2} />
              </>
            )}
            {bonk ? <T geo={GEO.sphere} color="#fff2b0" p={[-1.45, 3.4, 2.6]} s={0.12 + 0.05 * Math.sin(t * 30)} o={0.01} /> : null}
          </Fjord>
        ) : null}
        {set === 'farm' ? <Farm t={t} tex={tex} dig={dig} helmetUp={helmetUp} shine={shine} /> : null}
        {set === 'stage' ? (
          <Stage t={t} tex={tex} open={t >= L(10) ? open : 1} clap={clap}>
            {/* singers */}
            {t < L(16) ? (
              <>
                <Viking p={[-0.8, 0, -0.5]} s={1.05} mood={t >= W('horned') + 0.1 ? 'grin' : 'calm'} bob={t * 0.9} tunic="#6a2a6a" cape="#2a1a3a" beard="#3a2418"
                  helm={t >= W('horned') - 0.5 ? 'none' : 'none'} armL={1.2} elbowL={0.6} armR={t >= L(13) ? 2.0 : 0.6} elbowR={0.3} />
                {t >= W('horned') - 0.5 && t < L(16) ? (
                  <group position={[-0.8, HEAD_Y * 1.05 + drop * 1.0 + 0.05, -0.5]} scale={[1.05 + squash, 1.05 - squash, 1.05]}>
                    <HornHelmet />
                  </group>
                ) : null}
                <Viking p={[1.4, 0, -1.2]} helm="none" tunic="#d8d8e8" cape="#2a4a8a" beard="#e8c070" mood="calm" bob={t * 0.9 + 0.5} armR={0.8} elbowR={0.4} />
              </>
            ) : (
              <Viking p={[0, 0, -0.5]} s={1.1} mood={heroMood} bob={t * 0.9} armR={interpolate(t, [L(16) + 0.3, L(16) + 0.8], [0.2, 2.6], cl)} armL={interpolate(t, [L(16) + 0.3, L(16) + 0.8], [0.2, 2.6], cl)} elbowR={0.2} elbowL={0.2} shield={undefined} cape="#7a2a2a" handR={<Axe />} />
            )}
            {/* Wagner in the pit */}
            <Person p={[-2.5, -0.9, 3.6]} ry={Math.PI + 0.3} coat="#1d1a22" hat="beret" whiskers="#c8c0b0" hair="#c8c0b0" hairStyle="none" mood="stern" bob={t}
              armR={1.4 + Math.sin(t * 6) * 0.5} elbowR={0.5} armL={1.0 + Math.sin(t * 6 + 1) * 0.3} handR={<Baton />} />
            {/* Doepler with his drawing board */}
            {t >= L(12) && t < L(13) ? (
              <Person p={[2.6, 0, 1.4]} ry={0.45} coat="#6a4a2a" hair="#5a3a22" mustache="#5a3a22" mood="smug" look={-0.4} bob={t * 0.8} armR={0.9} elbowR={1.2} armL={0.7} elbowL={1.3} handL={<Board tex={tex.painting} />} />
            ) : null}
            {/* copies: painting, book, film reel */}
            {t >= L(13) && t < L(14) ? (
              <>
                <group position={[-3.6, 2.0, 1.0]} scale={prop('Painters')} rotation={[0, 0.3, 0]}>
                  <T geo={GEO.box} color="#c9a03a" s={[1.9, 1.5, 0.1]} o={0.02} />
                  <mesh position={[0, 0, 0.06]}><planeGeometry args={[1.6, 1.2]} /><meshBasicMaterial map={tex.painting} /></mesh>
                </group>
                <group position={[0, 2.6, 1.2]} scale={prop('books')}>
                  <T geo={GEO.box} color="#2f5d8a" s={[1.1, 1.4, 0.25]} o={0.02} />
                  <mesh position={[0, 0, 0.13]}><planeGeometry args={[1.0, 1.3]} /><meshBasicMaterial map={tex.book} /></mesh>
                </group>
                <group position={[3.6, 2.0, 1.0]} scale={prop('movies')} rotation={[Math.PI / 2, 0, t * 2]}>
                  <M geo={GEO.cyl} color="#3a3d44" s={[0.8, 0.15, 0.8]} o={0.02} />
                  {Array.from({length: 5}).map((_, k) => <mesh key={k} position={[Math.cos(k * 1.256) * 0.45, 0.09, Math.sin(k * 1.256) * 0.45]}><cylinderGeometry args={[0.14, 0.14, 0.05, 16]} /><meshBasicMaterial color="#14161c" /></mesh>)}
                </group>
              </>
            ) : null}
          </Stage>
        ) : null}
        {set === 'museum' ? <Museum t={t} tex={tex} /> : null}
        {FX ? (
          <EffectComposer multisampling={4}>
            <DepthOfField target={cam.look} focalLength={0.045} bokehScale={3.2} />
            <Bloom intensity={0.35} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur />
            <HueSaturation saturation={0.12} />
            <BrightnessContrast contrast={0.06} />
            <Vignette offset={0.32} darkness={0.42} />
          </EffectComposer>
        ) : null}
      </ThreeCanvas>

      <AbsoluteFill style={{background: '#000', opacity: darken}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(10,10,20,.35) 100%)'}} />

      {/* series chip */}
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', opacity: endO > 0.5 ? 0 : 1}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: 6, color: '#0e0b12', background: '#FFD23F', padding: '12px 28px', borderRadius: 999}}>MYTH CHECK #1</span>
      </div>
      {t < L(1) ? (
        <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', transform: `scale(${spring({frame, fps, config: {damping: 12}})})`}}>
          <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', WebkitTextStroke: '12px #0e0b12', paintOrder: 'stroke fill'}}>REAL OR FAKE?</span>
        </div>
      ) : null}
      <Stamp text="FAKE" at={W('made') - 0.05} until={L(1) - 0.1} t={t} frame={frame} fps={fps} top={560} />
      <Stamp text="NEVER" at={W('ever') - 0.05} until={LE(2) + 0.1} t={t} frame={frame} fps={fps} top={560} rot={8} />
      <Pill text="VIKING AGE · ~800–1050 AD" at={L(3) + 0.2} until={LE(3)} t={t} frame={frame} fps={fps} />
      <Pill text="💥 BONK" at={W('In') + 0.2} until={LE(5)} t={t} frame={frame} fps={fps} top={430} bg="rgba(232,52,58,.9)" />
      <Pill text="NORWAY · 1943" at={L(6) + 0.2} until={LE(6)} t={t} frame={frame} fps={fps} />
      <Pill text="GJERMUNDBU HELMET · 10TH CENTURY" at={L(7) + 0.4} until={LE(8)} t={t} frame={frame} fps={fps} />
      <Stamp text="NO HORNS" at={L(8)} until={LE(8) + 0.2} t={t} frame={frame} fps={fps} color="#1f9d55" top={520} rot={-6} />
      {t >= L(9) && t < L(10) ? (
        <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 260, color: '#FFD23F', WebkitTextStroke: '14px #0e0b12', paintOrder: 'stroke fill', transform: `scale(${spring({frame: frame - Math.round(L(9) * fps), fps, config: {damping: 9}})}) rotate(${Math.sin(t * 6) * 6}deg)`}}>?</div>
      ) : null}
      <Pill text="BAYREUTH · 1876" at={L(10) + 0.2} until={LE(10)} t={t} frame={frame} fps={fps} />
      <Pill text="WAGNER · DER RING DES NIBELUNGEN" at={L(11) + 0.2} until={LE(11)} t={t} frame={frame} fps={fps} />
      <Pill text="COSTUMES: CARL EMIL DOEPLER" at={L(12) + 0.2} until={LE(12)} t={t} frame={frame} fps={fps} />
      <Pill text="👏 SENSATION" at={L(13) + 0.1} until={W('Painters') - 0.1} t={t} frame={frame} fps={fps} />
      <Pill text="VEKSØ HELMETS · DENMARK" at={L(14) + 0.2} until={LE(14)} t={t} frame={frame} fps={fps} />
      {tlO > 0 ? (
        <div style={{position: 'absolute', top: 330, left: 70, right: 70, height: 250, opacity: tlO, background: 'rgba(14,11,18,.78)', borderRadius: 30, fontFamily: FONT, color: '#fff'}}>
          <div style={{position: 'absolute', top: 120, left: 60, right: 60, height: 10, background: '#555', borderRadius: 5}} />
          <div style={{position: 'absolute', top: 120, left: 60, width: `calc((100% - 120px) * ${tlP})`, height: 10, background: '#FFD23F', borderRadius: 5}} />
          <div style={{position: 'absolute', top: 100, left: 44, width: 50, height: 50, borderRadius: 25, background: '#c48a3a', border: '6px solid #fff'}} />
          <div style={{position: 'absolute', top: 100, right: 44, width: 50, height: 50, borderRadius: 25, background: tlP > 0.98 ? '#4FB3FF' : '#555', border: '6px solid #fff'}} />
          <div style={{position: 'absolute', top: 24, left: 40, fontWeight: 900, fontSize: 40}}>BRONZE AGE</div>
          <div style={{position: 'absolute', top: 24, right: 40, fontWeight: 900, fontSize: 40, opacity: tlP > 0.95 ? 1 : 0.3}}>VIKINGS</div>
          <div style={{position: 'absolute', top: 172, left: 40, fontWeight: 700, fontSize: 36, color: '#e8c070'}}>~900 BC</div>
          <div style={{position: 'absolute', top: 172, right: 40, fontWeight: 700, fontSize: 36, color: '#9fd4f2', opacity: tlP > 0.95 ? 1 : 0.3}}>~800 AD</div>
          <div style={{position: 'absolute', top: 166, left: 0, right: 0, textAlign: 'center', fontWeight: 900, fontSize: 44, color: '#FFD23F'}}>{Math.round(1700 * tlP).toLocaleString('en-US')} YEARS</div>
        </div>
      ) : null}
      <Pill text="MADE IN 1876 🎭" at={L(16) + 0.4} until={LE(16)} t={t} frame={frame} fps={fps} />

      {endO > 0 ? (
        <AbsoluteFill style={{background: `rgba(8,14,28,${0.6 * endO})`}}>
          <div style={{position: 'absolute', top: 300, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 84, lineHeight: 1.05, color: '#fff', opacity: endO}}>NEXT MYTH<br /><span style={{fontSize: 56, color: '#FFD23F'}}>YOU DECIDE</span></div>
          {[['🐟', 'GOLDFISH MEMORY', '#ffcf3a'], ['🧠', '10% BRAIN', '#ff6b5b']].map(([e, txt, col], k) => (
            <div key={txt} style={{position: 'absolute', left: 100, right: 100, top: 640 + k * 190, height: 150, borderRadius: 30, background: '#fff', border: `8px solid ${col}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', transform: `scale(${cardS(k)})`, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: '#0e0b12'}}>
              <span style={{fontSize: 76}}>{e}</span>{txt}
            </div>
          ))}
          <div style={{position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center', transform: `scale(${cardS(2)})`}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', background: '#e8343a', padding: '20px 44px', borderRadius: 999}}>💬 COMMENT</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {t < L(17) ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(cam.cutAt > 0 ? flash : 0, loopFlash)}} />
      <Audio src={staticFile('viking_voice.wav')} />
      <Audio src={staticFile('viking_music.wav')} />
    </AbsoluteFill>
  );
};
