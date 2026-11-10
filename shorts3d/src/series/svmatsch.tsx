// SV Matsch 04 — reusable 3D world + recurring characters (stick-figure cartoon style)
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {GEO, HEAD_Y, M, Roman, T} from '../hd';

type V3 = [number, number, number];
export const SV_BLUE = '#1f5fd0';
export const SV_YELLOW = '#FFD23F';
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const numCache = new Map<string, THREE.Texture>();
function numberTex(n: number, fg: string) {
  const k = n + fg; let t = numCache.get(k);
  if (!t) {
    t = canvasTex(256, 256, (g) => {
      g.font = '900 190px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 18; g.strokeStyle = '#14161c'; g.strokeText(String(n), 128, 140); g.fillStyle = fg; g.fillText(String(n), 128, 140);
    });
    numCache.set(k, t);
  }
  return t;
}
function signTex(lines: string[], bg: string, fg: string, w = 1024, h = 256) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#14161c'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => { g.font = `900 ${i === 0 ? 120 : 64}px Inter, Arial, sans-serif`; g.fillText(l, w / 2, h / (lines.length + 1) * (i + 1) + (i === 0 ? 6 : 0)); });
  });
}

// ---------- accessories placed relative to a figure (inside its scaled group) ----------
const Glasses: React.FC = () => (
  <group position={[0, HEAD_Y + 0.04, 0.7]}>
    {[-0.26, 0.26].map((x) => <mesh key={x} position={[x, 0, 0.02]} scale={[0.19, 0.17, 0.19]}><torusGeometry args={[1, 0.11, 10, 30]} /><meshStandardMaterial color="#1f1a24" /></mesh>)}
    <mesh position={[0, 0.02, 0.03]} scale={[0.14, 0.025, 0.03]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#1f1a24" /></mesh>
  </group>
);
const Beard: React.FC<{color: string}> = ({color}) => (
  <group position={[0, HEAD_Y, 0]}>
    <T geo={GEO.sphere} color={color} p={[0, -0.5, 0.28]} s={[0.55, 0.3, 0.42]} o={0.02} />
    <T geo={GEO.sphere} color={color} p={[-0.48, -0.28, 0.2]} s={[0.18, 0.3, 0.28]} o={0.015} />
    <T geo={GEO.sphere} color={color} p={[0.48, -0.28, 0.2]} s={[0.18, 0.3, 0.28]} o={0.015} />
  </group>
);
const Cap: React.FC = () => (
  <group position={[0, HEAD_Y + 0.2, 0]}>
    <T geo={GEO.half} color="#1d2a4a" s={[0.8, 0.62, 0.76]} o={0.025} />
    <T geo={GEO.cyl} color={SV_YELLOW} p={[0, 0.02, 0.72]} s={[0.42, 0.05, 0.3]} o={0.015} />
    <T geo={GEO.sphere} color={SV_YELLOW} p={[0, 0.6, 0]} s={0.07} o={0.01} />
  </group>
);
const Scarf: React.FC = () => (
  <group position={[0, 1.98, 0]}>
    <T geo={GEO.torus} color={SV_YELLOW} r={[Math.PI / 2, 0, 0]} s={[0.28, 0.28, 1.4]} o={0.012} />
    {[0, 1, 2].map((k) => <T key={k} geo={GEO.box} color={k % 2 ? SV_BLUE : SV_YELLOW} p={[0.14, -0.18 - k * 0.14, 0.24]} s={[0.12, 0.14, 0.05]} o={0.008} />)}
  </group>
);
const Number: React.FC<{n: number; fg?: string}> = ({n, fg = '#ffffff'}) => {
  const tex = useMemo(() => numberTex(n, fg), [n, fg]);
  return <mesh position={[0, 1.62, 0.36]}><planeGeometry args={[0.32, 0.32]} /><meshBasicMaterial map={tex} transparent depthWrite={false} /></mesh>;
};
const Crocs: React.FC<{off?: boolean}> = ({off}) => (off ? null : (
  <group>
    {[-0.12, 0.12].map((x) => <T key={x} geo={GEO.rbox} color="#3fbf4a" p={[x, 0.06, 0.08]} s={[0.2, 0.13, 0.36]} o={0.012} />)}
  </group>
));

type Pose = {p?: V3; ry?: number; s?: number; mood?: any; look?: number; armR?: number; armL?: number; walk?: number; bob?: number; handR?: React.ReactNode};

export const Founder: React.FC<Pose> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'grin', look = 0, armR = 0.3, armL = 0.2, walk = 0, bob = 0, handR}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Roman robe={SV_BLUE} trim="#174aa6" skin="#f2c4a0" hairStyle="none" hair="#5a3a22" mood={mood} look={look} armR={armR} armL={armL} walk={walk} bob={bob} handR={handR} />
    <Beard color="#6b4426" /><Cap /><Scarf />
  </group>
);
export const OpaHorst: React.FC<Pose> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'calm', look = 0, armR = 0.3, armL = 0.3, walk = 0, bob = 0}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Roman robe="#2f8a3a" trim="#226b2c" skin="#eab48e" hairStyle="bald" hair="#c9c4bb" mood={mood} look={look} armR={armR} armL={armL} walk={walk} bob={bob} />
    <Beard color="#d8d4cc" /><Glasses /><Number n={1} />
  </group>
);
export const Kevin: React.FC<Pose & {crocsOff?: boolean}> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'grin', look = 0, armR = 0.3, armL = 0.3, walk = 0, bob = 0, crocsOff}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Roman robe={SV_BLUE} trim={SV_YELLOW} skin="#f3c9a4" hairStyle="caesar" hair="#e8c45a" mood={mood} look={look} armR={armR} armL={armL} walk={walk} bob={bob} />
    <Number n={4} fg={SV_YELLOW} /><Crocs off={crocsOff} />
  </group>
);
export const Manni: React.FC<Pose> = ({p = [0, 0, 0], ry = 0, s = 1, mood = 'grin', look = 0, armR = 0.4, armL = 0.3, walk = 0, bob = 0, handR}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Roman robe={SV_BLUE} trim={SV_YELLOW} skin="#e9b892" hairStyle="caesar" hair="#2e2016" mood={mood} look={look} armR={armR} armL={armL} walk={walk} bob={bob}
      handR={handR ?? <group position={[0, -0.12, 0.05]}><M geo={GEO.box} color="#c3cad6" p={[0.03, -0.2, 0]} r={[0, 0, 0.1]} s={[0.03, 0.42, 0.04]} o={0.006} /><M geo={GEO.box} color="#c3cad6" p={[-0.03, -0.2, 0]} r={[0, 0, -0.1]} s={[0.03, 0.42, 0.04]} o={0.006} /></group>} />
    <T geo={GEO.sphere} color={SV_BLUE} p={[0, 1.38, 0.18]} s={[0.42, 0.4, 0.38]} o={0.02} />
    <group position={[0, 0, 0.3]}><Number n={9} fg={SV_YELLOW} /></group>
    <Beard color="#2e2016" />
  </group>
);
// generic fan for the tribune
export const Fan: React.FC<{p: V3; i: number; t: number; cheer?: number}> = ({p, i, t, cheer = 0}) => {
  const jump = cheer * Math.max(0, Math.sin(t * 8 + i)) * 0.15;
  const skin = ['#f3c9a4', '#e0b08a', '#d9a47c', '#f6d2b5', '#c98f68'][i % 5];
  return (
    <group position={[p[0], p[1] + jump, p[2]]} scale={0.42}>
      <T geo={GEO.cap} color={i % 3 ? SV_BLUE : SV_YELLOW} p={[0, 0.7, 0]} s={[0.7, 0.55, 0.6]} o={0.03} />
      <T geo={GEO.sphere} color={skin} p={[0, 1.55, 0]} s={0.48} o={0.03} />
      <T geo={GEO.half} color={['#2e2016', '#6b4426', '#e8c45a', '#1a1a1a'][i % 4]} p={[0, 1.62, -0.04]} r={[-0.3, 0, 0]} s={[0.5, 0.42, 0.48]} o={0.02} />
      <mesh position={[-0.15, 1.6, 0.44]} scale={0.06}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#14161c" /></mesh>
      <mesh position={[0.15, 1.6, 0.44]} scale={0.06}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#14161c" /></mesh>
      {cheer > 0.5 ? <T geo={GEO.cap} color={skin} p={[0.5, 1.3, 0]} r={[0, 0, 0.5]} s={[0.12, 0.3, 0.12]} o={0.02} /> : null}
    </group>
  );
};

// ---------- props ----------
export const Ball: React.FC<{p: V3; r?: number}> = ({p, r = 0}) => (
  <group position={p} rotation={[r, r * 0.7, 0]}>
    <T geo={GEO.sphere} color="#ffffff" s={0.22} o={0.012} />
    {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[Math.cos(k * 1.256) * 0.17, Math.sin(k * 1.256) * 0.17 * 0.6, 0.13]} scale={0.06}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#14161c" /></mesh>)}
  </group>
);
export const Bratwurst: React.FC<{p: V3; r?: number}> = ({p, r = 0}) => (
  <group position={p} rotation={[0, 0, r]}><T geo={GEO.cap} color="#a5562a" r={[0, 0, Math.PI / 2]} s={[0.14, 0.26, 0.14]} o={0.01} /></group>
);
export const Croc: React.FC<{p: V3; r?: number}> = ({p, r = 0}) => <group position={p} rotation={[r, r, r * 0.5]}><T geo={GEO.rbox} color="#3fbf4a" s={[0.2, 0.13, 0.36]} o={0.012} /></group>;
export const Goal: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => (
  <group position={p} rotation={[0, ry, 0]}>
    {[-1.8, 1.8].map((x) => <T key={x} geo={GEO.cylLow} color="#f4f4f4" p={[x, 1.1, 0]} s={[0.07, 2.2, 0.07]} o={0.01} />)}
    <T geo={GEO.cylLow} color="#f4f4f4" p={[0, 2.2, 0]} r={[0, 0, Math.PI / 2]} s={[0.07, 3.7, 0.07]} o={0.01} />
    {Array.from({length: 9}).map((_, k) => <mesh key={k} position={[-1.8 + k * 0.45, 1.1, -0.6]} scale={[0.012, 2.2, 0.012]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#d8dde6" /></mesh>)}
    {Array.from({length: 5}).map((_, k) => <mesh key={'h' + k} position={[0, 0.2 + k * 0.45, -0.6]} scale={[3.6, 0.012, 0.012]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#d8dde6" /></mesh>)}
  </group>
);
export const Grill: React.FC<{p: V3; t: number}> = ({p, t}) => (
  <group position={p}>
    {[-0.3, 0.3].map((x) => <T key={x} geo={GEO.cylLow} color="#3a3a3a" p={[x, 0.45, 0]} s={[0.03, 0.9, 0.03]} o={0.006} />)}
    <T geo={GEO.half} color="#2a2a2a" p={[0, 0.95, 0]} r={[Math.PI, 0, 0]} s={[0.5, 0.3, 0.35]} o={0.015} />
    {[0, 1, 2].map((k) => <Bratwurst key={k} p={[-0.2 + k * 0.2, 0.98, 0]} r={0.1} />)}
    {[0, 1, 2].map((k) => { const u = (t * 0.5 + k / 3) % 1; return <mesh key={'s' + k} position={[Math.sin(u * 5 + k) * 0.15, 1.2 + u * 1.4, 0]} scale={0.18 + u * 0.3}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#d6d6d6" transparent opacity={0.5 * (1 - u)} /></mesh>; })}
  </group>
);

// ---------- world ----------
export type WorldProps = {t: number; fans: number; cheer?: number; floodlight?: number};
export const SvWorld: React.FC<WorldProps> = ({t, fans, cheer = 0, floodlight = 1}) => {
  const grass = useMemo(() => canvasTex(512, 512, (g) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#3f6e3a' : '#477a40'; g.fillRect(0, i * 64, 512, 64); }
    for (let i = 0; i < 900; i++) { g.fillStyle = rnd(i) > 0.5 ? 'rgba(20,40,20,.25)' : 'rgba(120,90,50,.25)'; g.fillRect(rnd(i * 3) * 512, rnd(i * 7) * 512, 3, 6); }
  }), []);
  useMemo(() => { grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(6, 6); }, [grass]);
  const heim = useMemo(() => signTex(['SV MATSCH 04', 'VEREINSHEIM'], SV_YELLOW, '#14161c'), []);
  const fanSign = useMemo(() => signTex([`FANS ${fans}`], SV_BLUE, '#ffffff', 512, 160), [fans]);
  const shown = Math.min(fans, 60);
  const seats: V3[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) seats.push([-4.2 + c * 0.6 + (r % 2) * 0.3, 0.55 + r * 0.45, -9.0 - r * 0.6]);
  return (
    <>
      <color attach="background" args={['#0d1530']} />
      <fog attach="fog" args={['#121c38', 14, 38]} />
      <hemisphereLight args={['#9fb4e6', '#2a3a2a', 0.7]} />
      <ambientLight intensity={0.25} />
      {/* floodlight as the key light */}
      <directionalLight position={[6, 12, 6]} intensity={2.2 * floodlight} color="#fff6e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004} shadow-radius={5} />
      <directionalLight position={[-5, 4, 8]} intensity={0.9} color="#c8d8ff" />
      {/* stars + moon */}
      {Array.from({length: 40}).map((_, i) => <mesh key={i} position={[-30 + rnd(i) * 60, 10 + rnd(i + 9) * 14, -30]} scale={0.06 + rnd(i * 3) * 0.06}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
      <mesh position={[-12, 18, -32]}><sphereGeometry args={[1.6, 20, 14]} /><meshBasicMaterial color="#f6f1d8" /></mesh>
      {/* pitch, mud and puddles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial map={grass} roughness={0.95} /></mesh>
      {[[0, 1.2, 4.5, 2.6], [-3.5, -2.5, 2.4, 1.4], [3.6, -1.5, 2.2, 1.3], [-1.5, 4.2, 2.8, 1.5]].map(([x, z, w, d], i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.008, z]} scale={[w, d, 1]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#6b4a2c" roughness={1} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + 0.2, 0.016, z]} scale={[w * 0.6, d * 0.55, 1]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#6f86b8" roughness={0.1} metalness={0.3} /></mesh>
        </group>
      ))}
      {/* fence */}
      {Array.from({length: 13}).map((_, k) => <T key={k} geo={GEO.cylLow} color="#9aa3b5" p={[-12 + k * 2, 0.55, -6.6]} s={[0.04, 1.1, 0.04]} o={0} />)}
      {[0.4, 1.0].map((y) => <T key={y} geo={GEO.cylLow} color="#9aa3b5" p={[0, y, -6.6]} r={[0, 0, Math.PI / 2]} s={[0.03, 24, 0.03]} o={0} />)}
      {/* floodlight mast */}
      <group position={[7.5, 0, -7.5]}>
        <T geo={GEO.cylLow} color="#8a90a0" p={[0, 4.5, 0]} s={[0.12, 9, 0.12]} o={0.012} />
        <T geo={GEO.box} color="#5a6070" p={[0, 9.1, 0]} s={[1.4, 0.8, 0.3]} o={0.015} />
        {[-0.4, 0, 0.4].map((x) => <mesh key={x} position={[x, 9.1, 0.18]} scale={0.18}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color={floodlight > 0.5 ? '#fffbe0' : '#555'} /></mesh>)}
        {floodlight > 0.5 ? <mesh position={[-2.5, 5, 3]} rotation={[0.5, 0, 0.45]}><coneGeometry args={[3.2, 9, 24, 1, true]} /><meshBasicMaterial color="#fff8d0" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} /></mesh> : null}
      </group>
      {/* tribune with fans */}
      <group>
        {[0, 1, 2, 3].map((r) => <T key={r} geo={GEO.box} color="#8a90a0" p={[0, 0.25 + r * 0.45, -9.0 - r * 0.6]} s={[9.8, 0.5 + r * 0.9, 0.6]} o={0.015} />)}
        {seats.map((p, i) => i < shown ? <Fan key={i} p={p} i={i} t={t} cheer={cheer} /> : <T key={i} geo={GEO.rbox} color="#4a5468" p={[p[0], p[1] + 0.12, p[2]]} s={[0.36, 0.22, 0.3]} o={0.008} />)}
        <mesh position={[0, 3.4, -11.2]}><planeGeometry args={[3.2, 1.0]} /><meshBasicMaterial map={fanSign} /></mesh>
      </group>
      {/* clubhouse container + beer bench */}
      <group position={[-8.5, 0, -4.5]} rotation={[0, 0.5, 0]}>
        <T geo={GEO.box} color="#2f7a46" p={[0, 1.3, 0]} s={[4.6, 2.6, 2.4]} o={0.025} />
        {Array.from({length: 9}).map((_, k) => <mesh key={k} position={[-2.0 + k * 0.5, 1.3, 1.21]} scale={[0.06, 2.4, 0.02]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#25633a" /></mesh>)}
        <mesh position={[0, 2.25, 1.24]}><planeGeometry args={[3.2, 0.8]} /><meshBasicMaterial map={heim} /></mesh>
        <T geo={GEO.box} color="#c9a26a" p={[1.3, 1.0, 1.25]} s={[0.9, 1.8, 0.05]} o={0.012} />
      </group>
      <group position={[-5.6, 0, -2.6]} rotation={[0, 0.3, 0]}>
        <T geo={GEO.box} color="#b07a46" p={[0, 0.75, 0]} s={[2.4, 0.08, 0.6]} o={0.012} />
        {[-1, 1].map((x) => <T key={x} geo={GEO.box} color="#8a5a32" p={[x, 0.37, 0]} s={[0.08, 0.74, 0.5]} o={0.008} />)}
      </group>
      {/* rain */}
      {Array.from({length: 140}).map((_, i) => {
        const x = -10 + rnd(i) * 20, z = -9 + rnd(i + 50) * 16, sp = 9 + rnd(i * 3) * 4;
        const y = 12 - (((t * sp) + rnd(i * 7) * 12) % 12);
        return <mesh key={'r' + i} position={[x, y, z]} rotation={[0, 0, 0.12]} scale={[0.012, 0.32, 0.012]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#b9c8e8" transparent opacity={0.55} /></mesh>;
      })}
    </>
  );
};
