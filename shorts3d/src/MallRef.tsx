// Final Call Stories – Folge 3 „Closing Time“: leeres Weihnachts-Kaufhaus nach Ladenschluss.
// Referenzbilder (Totale + Nahaufnahme Gegenspieler). Eigene Figuren, keine echten Marken.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {GEO, HEAD_Y, M, Roman, T} from './hd';
import {Cam, Halo, Traveler} from './NightGate';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const GREEN = '#5dff9a';

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const floorTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = '#3a3633'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#2a2725'; g.fillRect(0, 0, 256, 256); g.fillRect(256, 256, 256, 256);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 256); g.strokeRect(256, 256, 256, 256); g.strokeRect(256, 0, 256, 256); g.strokeRect(0, 256, 256, 256);
}, [10, 16]);
const shutterTex = () => canvasTex(256, 512, (g) => {
  for (let y = 0; y < 512; y += 16) { g.fillStyle = y % 32 ? '#5a5f68' : '#4a4f57'; g.fillRect(0, y, 256, 16); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, y + 13, 256, 3); }
});
const signTex = (txt: string, bg: string, fg: string) => canvasTex(1024, 256, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = fg; g.font = '800 130px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 512, 136);
});
const boardTex = (mode = 1) => canvasTex(1024, 512, (g) => {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#ff4b4b'; g.font = '700 70px "Courier New", monospace'; g.textAlign = 'center';
  g.fillText('STORE CLOSED', 512, 150);
  g.fillStyle = '#e8eef5'; g.font = '700 56px "Courier New", monospace';
  if (mode) g.fillText('PLEASE STAND STILL', 512, 270);
  g.fillStyle = GREEN; g.fillText('00:00', 512, 400);
});

// ---------- Gegenspieler: „The Greeter“ ----------
// gesichtslos, glänzender dunkler Kopf, EIN grüner Lichtschlitz, dunkelroter Samtmantel mit Fellbesatz, Zipfelmütze, Glocke.
const Bell: React.FC = () => (
  <group position={[0, -0.12, 0.02]}>
    <M geo={GEO.cyl} color="#3b2a18" p={[0, 0.06, 0]} s={[0.025, 0.12, 0.025]} o={0} />
    <M geo={GEO.half} color="#d9a83a" p={[0, -0.02, 0]} r={[Math.PI, 0, 0]} s={[0.09, 0.12, 0.09]} o={0.006} />
    <M geo={GEO.sphere} color="#b8892a" p={[0, -0.13, 0]} s={0.025} o={0} />
  </group>
);
export const Greeter: React.FC<{p: V3; ry?: number; s?: number; glow?: number; tilt?: number; ring?: number; armUp?: number}> = ({p, ry = 0, s = 1, glow = 1, tilt = 0, ring = 0, armUp = 0}) => {
  const slit = new THREE.Color(GREEN).multiplyScalar(1.4 + glow);
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <Roman robe="#5a0f18" trim="#ece6da" skin="#f1efe8" hairStyle="none" mood="calm" armR={0.05 + armUp} armL={0.12} elbowR={0.9 - armUp * 0.5} handR={<group rotation={[0, 0, Math.sin(ring * Math.PI * 2) * 0.6]}><Bell /></group>} />
      {/* langer Mantel bis übers Knie + Fellsaum */}
      <T geo={GEO.tunic} color="#5a0f18" p={[0, 1.02, 0]} s={[1.18, 0.62, 0.96]} o={0.02} />
      <T geo={GEO.torus} color="#ece6da" p={[0, 0.72, 0]} r={[Math.PI / 2, 0, 0]} s={[0.47, 0.4, 0.9]} o={0.01} />
      {/* Fellstreifen vorne + Messingknöpfe */}
      <T geo={GEO.box} color="#ece6da" p={[0, 1.35, 0.33]} r={[0.12, 0, 0]} s={[0.1, 1.2, 0.04]} o={0.006} />
      {[0, 1, 2, 3].map((k) => <M key={k} geo={GEO.sphere} color="#d9a83a" p={[0.09, 1.86 - k * 0.17, 0.3 - k * 0.012]} s={0.028} o={0} />)}
      {/* Gürtel + Schnalle */}
      <T geo={GEO.torus} color="#121216" p={[0, 1.4, 0]} r={[Math.PI / 2, 0, 0]} s={[0.33, 0.28, 0.9]} o={0.006} />
      <M geo={GEO.box} color="#e0b34a" p={[0, 1.4, 0.3]} s={[0.13, 0.1, 0.03]} o={0.004} />
      <T geo={GEO.box} color="#121216" p={[0, 1.4, 0.315]} s={[0.07, 0.05, 0.01]} o={0} />
      {/* Fellkragen */}
      <T geo={GEO.torus} color="#ece6da" p={[0, 2.0, 0]} r={[Math.PI / 2, 0, 0]} s={[0.24, 0.22, 1.8]} o={0.008} />
      {/* Namensschild (leer) */}
      <M geo={GEO.box} color="#d9a83a" p={[-0.16, 1.78, 0.29]} s={[0.12, 0.05, 0.02]} o={0} />
      {/* gesichtsloser, glänzender Kopf */}
      <group position={[0, HEAD_Y, 0]} rotation={[0, 0, tilt]}>
        <mesh scale={[0.86, 0.8, 0.8]} castShadow>
          <sphereGeometry args={[1, 48, 32]} />
          <meshPhysicalMaterial color="#1c1e24" roughness={0.12} metalness={0.4} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        <mesh scale={[0.89, 0.83, 0.83]}><sphereGeometry args={[1, 32, 24]} /><meshBasicMaterial color="#000" side={THREE.BackSide} /></mesh>
        {/* EIN Licht-Merkmal: schmaler grüner Schlitz + zwei Halos */}
        <mesh position={[0, 0.04, 0.79]} scale={[0.44, 0.032, 0.04]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={slit} toneMapped={false} /></mesh>
        <Halo p={[0, 0.04, 0.82]} s={0.55} color={GREEN} o={Math.min(0.8, 0.5 * glow)} />
        <Halo p={[0, 0.04, 0.85]} s={1.0} color={GREEN} o={Math.min(0.22, 0.1 * glow)} />
        {/* Zipfelmütze mit Fellrand + Bommel, nach hinten gekippt */}
        <T geo={GEO.torus} color="#ece6da" p={[0, 0.6, -0.04]} r={[Math.PI / 2 + 0.12, 0, 0]} s={[0.7, 0.68, 1.6]} o={0.01} />
        <group position={[0, 0.67, -0.06]} rotation={[-0.55, 0, 0.25]}>
          <T geo={GEO.cone} color="#5a0f18" p={[0, 0.5, 0]} s={[0.6, 1.05, 0.6]} o={0.014} />
          <T geo={GEO.sphere} color="#ece6da" p={[0, 1.04, 0]} s={0.14} o={0.008} />
        </group>
      </group>
      {/* kaltes Gegenlicht für die Silhouette */}
      <pointLight position={[0.2, 3.4, -1.4]} color="#7fa4ff" intensity={6} distance={4} />
    </group>
  );
};

// ---------- Kaufhaus-Set ----------
const Mannequin: React.FC<{p: V3; ry: number; robe: string; headTurn?: number}> = ({p, ry, robe, headTurn = 0}) => (
  <group position={p} rotation={[0, ry, 0]} scale={0.66}>
    <Roman robe={robe} trim="#d8d2c8" skin="#e9e4da" hairStyle="none" armR={0.1} armL={0.35} />
    <group position={[0, HEAD_Y, 0]} rotation={[0, headTurn, 0]}>
      <T geo={GEO.sphere} color="#efebe3" s={[0.8, 0.76, 0.76]} o={0.02} />
    </group>
    <M geo={GEO.cyl} color="#9aa0aa" p={[0, 0.02, 0]} s={[0.4, 0.04, 0.4]} o={0} />
  </group>
);

const ShopFront: React.FC<{p: V3; side: 1 | -1; name: string; color: string; lit?: boolean; mannequins?: {robe: string; turn?: number}[]; flicker?: number}> = ({p, side, name, color, lit, mannequins = [], flicker = 1}) => {
  const sign = useMemo(() => signTex(name, '#0b0c10', color), [name, color]);
  const shut = useMemo(shutterTex, []);
  return (
    <group position={p} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
      {/* Pfeiler + Sturz */}
      <T geo={GEO.box} color="#1b1c22" p={[-1.9, 1.75, 0]} s={[0.25, 3.5, 0.4]} o={0.006} />
      <T geo={GEO.box} color="#1b1c22" p={[1.9, 1.75, 0]} s={[0.25, 3.5, 0.4]} o={0.006} />
      <T geo={GEO.box} color="#15161b" p={[0, 3.55, 0]} s={[4.05, 0.9, 0.4]} o={0.006} />
      <mesh position={[0, 3.55, 0.21]}><planeGeometry args={[3.2, 0.62]} /><meshBasicMaterial map={sign} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(0.55 + 0.45 * flicker)} /></mesh>
      {lit ? (
        <group>
          <mesh position={[0, 1.55, -0.6]}><planeGeometry args={[3.6, 3.1]} /><meshStandardMaterial color="#2a2216" emissive="#3a2a12" emissiveIntensity={0.6} /></mesh>
          {mannequins.map((m, i) => <Mannequin key={i} p={[-0.9 + i * 1.8 / Math.max(1, mannequins.length - 1), 0.05, -0.25]} ry={0} robe={m.robe} headTurn={m.turn} />)}
          <pointLight position={[0, 2.8, 0.4]} color="#ffcf8a" intensity={4} distance={4.5} />
          <mesh position={[0, 1.6, 0.18]}><planeGeometry args={[3.55, 3.2]} /><meshPhysicalMaterial color="#9fb6d6" transparent opacity={0.12} roughness={0.02} metalness={0.2} /></mesh>
        </group>
      ) : (
        <mesh position={[0, 1.6, 0.05]}><planeGeometry args={[3.55, 3.2]} /><meshStandardMaterial map={shut} metalness={0.55} roughness={0.45} /></mesh>
      )}
    </group>
  );
};

const TREE_LAYERS = 6;
const treeR = (y: number) => Math.max(0.15, 2.7 * (1 - (y - 0.5) / 7.1));
const XmasTree: React.FC<{p: V3; t: number; light?: number}> = ({p, t, light = 1}) => {
  const lights = useMemo(() => Array.from({length: 190}).map((_, i) => {
    const u = i / 190; const y = 0.75 + u * 6.2; const a = u * 52 + rnd(i) * 0.3; const r = treeR(y) * 0.86;
    return {pos: [Math.sin(a) * r, y, Math.cos(a) * r] as V3, c: ['#ffcf6a', '#ff5a4a', '#ffe9b0', '#7fd6ff'][i % 4], ph: rnd(i + 7) * 6.28};
  }), []);
  const baubles = useMemo(() => Array.from({length: 46}).map((_, i) => {
    const y = 1.0 + rnd(i + 3) * 5.4; const a = rnd(i + 9) * 6.28; const r = treeR(y) * 0.82;
    return {pos: [Math.sin(a) * r, y, Math.cos(a) * r] as V3, c: ['#b0142a', '#d9a83a', '#c9ced6', '#1f6f5a'][i % 4]};
  }), []);
  return (
    <group position={p}>
      <T geo={GEO.cyl} color="#3a2414" p={[0, 0.4, 0]} s={[0.28, 0.8, 0.28]} o={0.01} />
      {Array.from({length: TREE_LAYERS}).map((_, i) => {
        const y = 0.7 + i * 1.08; const r = treeR(y);
        return <T key={i} geo={GEO.cone} color={i % 2 ? '#123a26' : '#0f3220'} p={[0, y + 0.95, 0]} s={[r, 1.9, r]} o={0.02} />;
      })}
      {Array.from({length: TREE_LAYERS}).map((_, i) => {
        const y = 0.7 + i * 1.08; const r = treeR(y); const n = 16 - i * 2;
        return Array.from({length: n}).map((__, k) => {
          const a = (k / n) * Math.PI * 2 + i * 0.4;
          return <T key={'tf' + i + '-' + k} geo={GEO.cone} color={k % 2 ? '#174a30' : '#0f3a24'} p={[Math.sin(a) * r * 0.82, y + 0.18, Math.cos(a) * r * 0.82]} r={[Math.cos(a) * 1.9, 0, -Math.sin(a) * 1.9]} s={[0.32, 0.9, 0.32]} o={0.012} />;
        });
      })}
      {baubles.map((b, i) => <M key={'b' + i} geo={GEO.sphere} color={b.c} p={b.pos} s={0.13} o={0.006} />)}
      {lights.map((l, i) => {
        const on = 0.6 + 0.4 * Math.sin(t * 2.2 + l.ph);
        return <mesh key={'l' + i} position={l.pos} scale={0.055}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={new THREE.Color(l.c).multiplyScalar((1 + on * 1.4) * (0.08 + 0.92 * light))} toneMapped={false} /></mesh>;
      })}
      {/* Stern */}
      <group position={[0, 7.75, 0]}>
        <mesh scale={0.5}><octahedronGeometry args={[1, 0]} /><meshBasicMaterial color={new THREE.Color('#ffd27a').multiplyScalar(2.2)} toneMapped={false} /></mesh>
        <Halo p={[0, 0, 0.2]} s={2.8} color="#ffcf6a" o={0.55} />
      </group>
      <Halo p={[0, 3.6, 1.2]} s={9} color="#ff9a3c" o={0.16} />
      <pointLight position={[0, 3.2, 2.4]} color="#ffab55" intensity={22 * light} distance={12} decay={1.6} castShadow />
      <pointLight position={[0, 6.5, 1.6]} color="#ffcf8a" intensity={8 * light} distance={8} />
      {/* Geschenke */}
      {[[-1.4, 0.9, '#b0142a', '#d9a83a'], [1.3, 1.1, '#1f5fd0', '#ece6da'], [0.2, 1.8, '#1f6f5a', '#e8343a'], [-0.7, 1.9, '#d9a83a', '#5a0f18'], [1.9, -0.3, '#6b2a8a', '#d9a83a']].map(([x, z, c, rb], i) => {
        const sz = 0.38 + rnd(i) * 0.3;
        return (
          <group key={'g' + i} position={[x as number, sz / 2, z as number]} rotation={[0, rnd(i + 2) * 1.2, 0]}>
            <T geo={GEO.rbox} color={c as string} s={sz} o={0.008} />
            <T geo={GEO.box} color={rb as string} s={[sz + 0.02, sz + 0.02, 0.07]} o={0} />
            <T geo={GEO.box} color={rb as string} s={[0.07, sz + 0.02, sz + 0.02]} o={0} />
            <T geo={GEO.torus} color={rb as string} p={[0, sz / 2 + 0.04, 0]} s={[0.07, 0.07, 0.4]} o={0} />
          </group>
        );
      })}
      {/* warmer Lichtfleck auf dem Boden */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 2.4]} scale={[4.5, 3.6, 1]}><circleGeometry args={[1, 40]} /><meshBasicMaterial color="#ff9a3c" transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
    </group>
  );
};

// Lichterkette als Kettenlinie zwischen zwei Punkten
const Garland: React.FC<{a: V3; b: V3; sag: number; n: number; t: number; seed: number}> = ({a, b, sag, n, t, seed}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const u = i / (n - 1);
      const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      const c = ['#ffcf6a', '#ff5a4a', '#ffe9b0'][(i + seed) % 3];
      const on = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.9 + seed);
      return <mesh key={i} position={p} scale={0.06}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={new THREE.Color(c).multiplyScalar(0.8 + on * 1.4)} toneMapped={false} /></mesh>;
    })}
  </group>
);

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.42 : 1; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) s.lineTo(x, y); else s.moveTo(x, y); }
  s.closePath(); return s;
})();
const STAR_GEO = new THREE.ExtrudeGeometry(starShape, {depth: 0.15, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2});
const HangingStar: React.FC<{p: V3; s: number; t: number; ph: number}> = ({p, s, t, ph}) => (
  <group position={p}>
    <mesh position={[0, 1.5, 0]} scale={[0.01, 3, 0.01]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#555" /></mesh>
    <group rotation={[0, Math.sin(t * 0.4 + ph) * 0.6, 0]} scale={s}>
      <mesh geometry={STAR_GEO} castShadow><meshStandardMaterial color="#e8d8a0" emissive="#ffcf6a" emissiveIntensity={0.9} metalness={0.5} roughness={0.3} /></mesh>
    </group>
    <Halo p={[0, 0, 0.3]} s={s * 3.5} color="#ffcf6a" o={0.22} />
  </group>
);

export const MallSet: React.FC<{t: number; glow?: number; greeter?: {p: V3; ry: number}; traveler?: {p: V3; ry: number; mood: any; look: number}; light?: number; boardMode?: number; esc?: number; children?: React.ReactNode}> = ({t, glow = 1, greeter, traveler, light = 1, boardMode = 1, esc = 0, children}) => {
  const floor = useMemo(floorTex, []);
  const board0 = useMemo(() => boardTex(0), []);
  const board1 = useMemo(() => boardTex(1), []);
  const board = boardMode ? board1 : board0;
  const exit = useMemo(() => signTex('EXIT', '#1f9d55', '#ffffff'), []);
  const flick = (Math.sin(t * 37) > 0.2 && Math.sin(t * 5.3) > -0.6) ? 1 : 0.15;
  const snow = useMemo(() => Array.from({length: 160}).map((_, i) => [rnd(i) * 14 - 7, rnd(i + 50), rnd(i + 99) * 22 - 16, rnd(i + 200)]), []);
  const shops: [string, string, boolean, number][] = [['GIFTS', '#ffcf6a', true, 3], ['TOYS', '#ff5a4a', false, -1], ['SHOES', '#9fd0ff', true, -5], ['CAFÉ', '#ffe9b0', false, -9], ['TOYS', '#ff5a4a', false, -13]];
  const shopsR: [string, string, boolean, number][] = [['WINTER', '#9fd0ff', false, 3], ['FASHION', '#ffcf6a', true, -1], ['BOOKS', '#ffe9b0', false, -5], ['SWEETS', '#ff8ab0', true, -9], ['HOME', '#9fd0ff', false, -13]];
  return (
    <>
      <color attach="background" args={['#04050a']} />
      <fog attach="fog" args={['#06070c', 10, 34]} />
      <ambientLight intensity={0.22 * (0.3 + 0.7 * light)} />
      <hemisphereLight args={['#33427a', '#1a100a', 0.45 * (0.3 + 0.7 * light)]} />
      {/* kaltes Notlicht von oben */}
      <spotLight position={[-0.6, 8.5, 6]} angle={0.42} penumbra={0.85} intensity={45 * light} distance={16} color="#bcd0ff" castShadow target-position={[-0.6, 0, 1.6]} shadow-mapSize={[2048, 2048]} />
      {/* Boden */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, -6]}><planeGeometry args={[16, 40]} /><meshStandardMaterial map={floor} roughness={0.42} metalness={0.15} /></mesh>
      {/* Decke + Oberlichter mit Nachthimmel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 9.4, -6]}><planeGeometry args={[16, 40]} /><meshStandardMaterial color="#0b0c11" /></mesh>
      {Array.from({length: 5}).map((_, i) => (
        <group key={'sk' + i} position={[0, 9.35, 4 - i * 4.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[4.4, 3.4]} /><meshBasicMaterial color="#0d1630" /></mesh>
          {[-1.4, 0, 1.4].map((x) => <T key={x} geo={GEO.box} color="#15171d" p={[x, -0.05, 0]} s={[0.08, 0.1, 3.4]} o={0} />)}
        </group>
      ))}
      {/* Wände */}
      <mesh position={[-7.5, 4.7, -6]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[40, 9.4]} /><meshStandardMaterial color="#121318" /></mesh>
      <mesh position={[7.5, 4.7, -6]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[40, 9.4]} /><meshStandardMaterial color="#121318" /></mesh>
      <mesh position={[0, 4.7, -19]}><planeGeometry args={[16, 9.4]} /><meshStandardMaterial color="#0e0f14" /></mesh>
      {/* Läden unten */}
      {shops.map(([n, c, lit, z], i) => <ShopFront key={'L' + i} p={[-7.1, 0, z]} side={-1} name={n} color={c} lit={lit} flicker={i === 1 ? flick : 1} mannequins={lit ? [{robe: '#6b2a8a'}, {robe: '#1f5fd0', turn: i === 0 ? 1.1 : 0}] : []} />)}
      {shopsR.map(([n, c, lit, z], i) => <ShopFront key={'R' + i} p={[7.1, 0, z]} side={1} name={n} color={c} lit={lit} mannequins={lit ? [{robe: '#b0142a'}, {robe: '#d9a83a'}] : []} />)}
      {/* Galerie oben: Balkone, Glasgeländer, Läden */}
      {[-1, 1].map((sd) => (
        <group key={'gal' + sd}>
          <T geo={GEO.box} color="#1a1b21" p={[sd * 5.6, 4.35, -6]} s={[3.8, 0.35, 40]} o={0.006} />
          <mesh position={[sd * 3.72, 4.55, -6]} scale={[0.02, 0.05, 40]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={new THREE.Color('#ffd9a0').multiplyScalar(1.6)} toneMapped={false} /></mesh>
          <mesh position={[sd * 3.72, 5.05, -6]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[40, 1.0]} /><meshPhysicalMaterial color="#9fb6d6" transparent opacity={0.16} roughness={0.05} side={THREE.DoubleSide} /></mesh>
          <M geo={GEO.box} color="#aab0ba" p={[sd * 3.72, 5.56, -6]} s={[0.07, 0.05, 40]} o={0} />
          {Array.from({length: 5}).map((_, i) => <ShopFront key={i} p={[sd * 7.1, 4.52, 3 - i * 4]} side={sd as 1 | -1} name={['DECOR', 'GAMES', 'TOYS', 'GIFTS', 'LIGHTS'][(i + (sd > 0 ? 2 : 0)) % 5]} color="#8a8f99" lit={false} flicker={0.3} />)}
          {/* Stützen */}
          {Array.from({length: 6}).map((_, i) => <T key={'c' + i} geo={GEO.cyl} color="#1d1f26" p={[sd * 4.2, 2.2, 5 - i * 4.4]} s={[0.22, 4.4, 0.22]} o={0.008} />)}
        </group>
      ))}
      {/* Rolltreppe rechts (aus) */}
      <group position={[2.6, 0, -9.5]}>
        <group rotation={[0.43, 0, 0]} position={[0, 2.25, 0]}>
          <T geo={GEO.box} color="#20232a" s={[1.3, 0.5, 10]} o={0.008} />
          {Array.from({length: 26}).map((_, i) => <M key={i} geo={GEO.box} color="#6b717c" p={[0, 0.27, -4.8 + (((i * 0.37 - esc) % 9.62) + 9.62) % 9.62]} s={[1.0, 0.02, 0.2]} o={0} />)}
          {[-0.62, 0.62].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.65, 0]}><boxGeometry args={[0.04, 0.8, 9.6]} /><meshPhysicalMaterial color="#b5c8e0" transparent opacity={0.18} roughness={0.05} /></mesh>
              <T geo={GEO.box} color="#0c0c10" p={[x, 1.07, 0]} s={[0.1, 0.07, 9.8]} o={0} />
            </group>
          ))}
        </group>
      </group>
      {/* Weihnachtsbaum im Atrium */}
      <XmasTree p={[-0.4, 0, -7.5]} t={t} light={light} />
      {/* Lichterketten + hängende Sterne */}
      {[0, 1, 2, 3].map((i) => <Garland key={'ga' + i} a={[-3.7, 7.6, 3 - i * 5]} b={[3.7, 7.6, 1 - i * 5]} sag={0.9} n={34} t={t} seed={i * 5} />)}
      <HangingStar p={[-2.3, 6.4, -2.5]} s={0.42} t={t} ph={0} />
      <HangingStar p={[2.0, 6.9, -5.5]} s={0.34} t={t} ph={2} />
      <HangingStar p={[-1.6, 7.0, -12]} s={0.36} t={t} ph={4} />
      {/* Info-Tafel „STORE CLOSED“ an der Rückwand */}
      <group position={[-3.6, 6.6, -18.9]}>
        <T geo={GEO.box} color="#121216" s={[3.0, 1.6, 0.15]} o={0.008} />
        <mesh position={[0, 0, 0.08]}><planeGeometry args={[2.8, 1.4]} /><meshBasicMaterial map={board} toneMapped={false} /></mesh>
      </group>
      {/* EXIT-Schild, weit weg */}
      {/* Podest oben an der Rolltreppe + Glastür mit EXIT */}
      <T geo={GEO.box} color="#1a1b21" p={[2.6, 4.46, -16.5]} s={[2.4, 0.3, 5]} o={0.006} />
      <group position={[2.6, 4.61, -18.9]}>
        <mesh position={[0, 1.2, 0.02]}><planeGeometry args={[1.7, 2.4]} /><meshStandardMaterial color="#2a3d52" emissive="#4a6a8a" emissiveIntensity={0.35} roughness={0.1} metalness={0.4} /></mesh>
        {[-0.88, 0.88].map((x) => <M key={x} geo={GEO.box} color="#8a8f99" p={[x, 1.2, 0.05]} s={[0.07, 2.45, 0.08]} o={0} />)}
        <M geo={GEO.box} color="#8a8f99" p={[0, 2.43, 0.05]} s={[1.83, 0.07, 0.08]} o={0} />
        <M geo={GEO.box} color="#c9ced6" p={[0, 1.15, 0.1]} s={[1.3, 0.05, 0.05]} o={0} />
        <mesh position={[0, 2.85, 0.05]}><planeGeometry args={[1.2, 0.3]} /><meshBasicMaterial map={exit} toneMapped={false} /></mesh>
        <Halo p={[0, 2.85, 0.3]} s={2.2} color="#2fdf81" o={0.35} />
        <pointLight position={[0, 2.6, 0.8]} color="#2fdf81" intensity={3} distance={4} />
      </group>
      {/* Deko-Schnee + Staub */}
      {snow.map(([x, ph, z, d], i) => (
        <mesh key={'s' + i} position={[x, 8.5 - ((ph * 8.5 + t * (0.25 + d * 0.3)) % 8.5), z]} scale={0.018 + d * 0.022}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#e8eeff" transparent opacity={0.55} toneMapped={false} /></mesh>
      ))}
      {/* Lichtkegel des Notlichts */}
      <mesh position={[-0.6, 4.6, 3.6]} rotation={[0.28, 0, 0]}><coneGeometry args={[2.2, 8.4, 32, 1, true]} /><meshBasicMaterial color="#cfdcff" transparent opacity={0.04} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.6, 0.012, 1.8]} scale={[1.9, 1.6, 1]}><circleGeometry args={[1, 40]} /><meshBasicMaterial color="#9fb2e6" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      {greeter ? <Greeter p={greeter.p} ry={greeter.ry} s={0.74} glow={glow} /> : null}
      {traveler ? <Traveler p={traveler.p} ry={traveler.ry} mood={traveler.mood} look={traveler.look} armR={0.15} /> : null}
      {children}
    </>
  );
};

// ---------- Overlays ----------
const FilmLook: React.FC<{t: number}> = ({t}) => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,.75) 100%)'}} />
    <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(t * 30)} /></filter><rect width="100%" height="100%" filter="url(#gr)" /></svg>
    </AbsoluteFill>
  </>
);
const Chips: React.FC = () => (
  <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
    {[['#e8343a', 'STAND STILL'], ['#2fbf71', 'RUN TO THE EXIT']].map(([c, txt]) => (
      <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#14161c', background: '#fff', borderRadius: 999, padding: '10px 22px 10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 6px 20px rgba(0,0,0,.5)'}}>
        <span style={{width: 24, height: 24, borderRadius: 12, background: c}} />{txt}
      </span>
    ))}
  </div>
);
const Hook: React.FC<{txt: string}> = ({txt}) => (
  <div style={{position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 68, color: '#fff', letterSpacing: 1, textShadow: '0 4px 22px rgba(0,0,0,.95)'}}>{txt}</div>
);
const Caption: React.FC<{txt: string}> = ({txt}) => (
  <div style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: 1, textShadow: '0 4px 18px rgba(0,0,0,.95), 0 0 40px rgba(0,0,0,.6)'}}>{txt}</div>
);

const GL = {antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.55};

// Totale: Du im Vordergrund, der Greeter steht hinter dir vor dem Baum
export const MallRef: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#04050a'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={GL} camera={{fov: 50, near: 0.1, far: 120}}>
        <Cam pos={[0.5 - t * 0.05, 1.15, 8.6 - t * 0.12]} look={[0.1, 3.1, -5]} fov={56} />
        <MallSet t={t} greeter={{p: [1.15, 0, -0.6], ry: -0.25}} traveler={{p: [-0.55, 0, 3.4], ry: 0.25, mood: 'shock', look: 0.6}} />
      </ThreeCanvas>
      <FilmLook t={t} />
      <Hook txt="WOULD YOU STAND STILL?" />
      <Chips />
      <Caption txt="DON'T MOVE." />
    </AbsoluteFill>
  );
};

// Nahaufnahme Gegenspieler
export const MallRefClose: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#04050a'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={GL} camera={{fov: 40, near: 0.1, far: 120}}>
        <Cam pos={[0.35, 1.95, 1.55]} look={[0.85, 1.7, -2.6]} fov={44} />
        <MallSet t={t} glow={1.2} greeter={{p: [0.9, 0, -2.6], ry: -0.15}} />
      </ThreeCanvas>
      <FilmLook t={t} />
      <Caption txt="PLEASE STAND STILL." />
    </AbsoluteFill>
  );
};
