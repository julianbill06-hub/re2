import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Banner, Brazier, GEO, Guard, HEAD_Y, M, Pillar, Roman, T, useTextures} from './hd';

type V3 = [number, number, number];
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export type FeastState = {
  t: number;
  ceilingOpen: number; // 0..1 panels swing down
  rain: number; // seconds since the flower rain started (<0 none)
  heap: number; // 0..1 height of the flower pile
  guestMood: 'grin' | 'shock' | 'calm' | 'grumpy';
  emperorMood: 'smug' | 'grin' | 'shock' | 'calm';
  cushion: number; // 0..1 deflation of the air cushion (gag)
  guards: number; // 0..1 guards advance toward the emperor (<0 hidden)
  dim: number; // 0..1 darker, moodier light
};

const PETAL_COLORS = ['#7b4fc9', '#9b6be0', '#c18ae8', '#f08cc0', '#6a3fb5'];

function heapTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8a5bd4'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = PETAL_COLORS[i % PETAL_COLORS.length];
    g.beginPath(); g.ellipse(rnd(i) * 512, rnd(i + 999) * 512, 9 + rnd(i * 3) * 8, 5 + rnd(i * 7) * 4, rnd(i * 11) * 3, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i < 300; i++) { g.beginPath(); g.arc(rnd(i * 5) * 512, rnd(i * 9) * 512, 2, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const Food: React.FC = () => (
  <group>
    {/* fruit bowls, roast, goblets, bread, grapes along the table */}
    {[-3.2, -1.1, 1.1, 3.2].map((x, i) => (
      <group key={i} position={[x, 1.02, 0]}>
        <M geo={GEO.half} color="#d9a83a" p={[0, 0.05, 0]} r={[Math.PI, 0, 0]} s={[0.35, 0.18, 0.35]} o={0.012} />
        {[0, 1, 2, 3].map((k) => <T key={k} geo={GEO.sphere} color={['#e8452f', '#f2a12b', '#7fbf3f', '#e8452f'][k]} p={[Math.cos(k * 1.6) * 0.14, 0.12 + (k === 3 ? 0.1 : 0), Math.sin(k * 1.6) * 0.14]} s={0.1} o={0.008} />)}
      </group>
    ))}
    <group position={[0, 1.02, 0.1]}>
      <M geo={GEO.cyl} color="#d9a83a" p={[0, 0.02, 0]} s={[0.6, 0.04, 0.4]} o={0.01} />
      <T geo={GEO.cap} color="#a5562a" p={[0, 0.18, 0]} r={[0, 0, Math.PI / 2]} s={[0.36, 0.42, 0.32]} o={0.012} />
    </group>
    {[-4.2, -2.2, -0.2, 2.1, 4.1].map((x, i) => (
      <group key={i} position={[x, 1.02, 0.45 * (i % 2 ? 1 : -1)]}>
        <M geo={GEO.cyl} color="#e0b04a" p={[0, 0.02, 0]} s={[0.08, 0.04, 0.08]} o={0.006} />
        <M geo={GEO.cyl} color="#e0b04a" p={[0, 0.12, 0]} s={[0.025, 0.2, 0.025]} o={0.006} />
        <M geo={GEO.cyl} color="#e0b04a" p={[0, 0.27, 0]} s={[0.09, 0.14, 0.09]} o={0.006} />
      </group>
    ))}
    {[-2.2, 2.2].map((x) => (
      <group key={x} position={[x, 1.05, 0.2]}>
        {Array.from({length: 9}).map((_, k) => <T key={k} geo={GEO.sphere} color="#6b2f8f" p={[(k % 3) * 0.07 - 0.07, 0.1 - Math.floor(k / 3) * 0.06, (k % 2) * 0.05]} s={0.045} o={0.004} />)}
      </group>
    ))}
    {[-0.6, 0.7].map((x) => <T key={x} geo={GEO.cap} color="#d8a35c" p={[x, 1.1, -0.35]} r={[0, 0, Math.PI / 2]} s={[0.16, 0.2, 0.14]} o={0.008} />)}
  </group>
);

const Petals: React.FC<{since: number; heapTop: number}> = ({since, heapTop}) => {
  if (since < 0) return null;
  const out: React.ReactNode[] = [];
  const N = 320;
  for (let i = 0; i < N; i++) {
    // start: a few first, then more and more
    const ts = Math.pow(rnd(i), 1.8) * 4.2;
    const tt = since - ts;
    if (tt < 0) continue;
    const x0 = -5.5 + rnd(i * 3) * 11, z0 = -2.2 + rnd(i * 7) * 4.4;
    const fall = 6.9 - tt * 2.2;
    const land = heapTop * (1 - Math.min(1, ((x0 / 6) ** 2 + (z0 / 3.4) ** 2))) + 0.02;
    const y = Math.max(land, fall);
    const sway = y > land ? Math.sin(tt * 3 + i) * 0.25 : 0;
    out.push(
      <mesh key={i} position={[x0 + sway, y, z0 + sway * 0.4]} rotation={[tt * 2 + i, i, tt * 1.4]} scale={[0.1, 0.022, 0.065]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color={PETAL_COLORS[i % PETAL_COLORS.length]} roughness={0.7} />
      </mesh>,
    );
  }
  return <>{out}</>;
};

export const FeastSet: React.FC<FeastState> = (st) => {
  const tx = useTextures();
  const heapTex = useMemo(heapTexture, []);
  const {t} = st;
  const light = 1 - 0.35 * st.dim;
  const heapH = 1.9 * st.heap;
  const guests: {p: V3; ry: number; hair: any; skin: string; robe: string}[] = [
    {p: [-3.9, 0, -1.25], ry: 0.1, hair: 'curly', skin: '#f3c7a2', robe: '#ffffff'},
    {p: [-2.0, 0, -1.3], ry: 0, hair: 'bald', skin: '#e0b08a', robe: '#cfe3f5'},
    {p: [-0.1, 0, -1.3], ry: 0, hair: 'caesar', skin: '#f6d2b5', robe: '#f6e3c8'},
    {p: [1.9, 0, -1.3], ry: 0, hair: 'curly', skin: '#d9a47c', robe: '#ffffff'},
    {p: [3.8, 0, -1.25], ry: -0.1, hair: 'caesar', skin: '#f3c9a4', robe: '#e7f2df'},
    {p: [-2.9, 0, 1.35], ry: Math.PI - 0.2, hair: 'caesar', skin: '#eab48e', robe: '#ffffff'},
    {p: [2.9, 0, 1.35], ry: Math.PI + 0.2, hair: 'bald', skin: '#f2c4a0', robe: '#f6e3c8'},
  ];
  return (
    <>
      <color attach="background" args={['#2a160e']} />
      <fog attach="fog" args={['#3a2214', 16, 40]} />
      <hemisphereLight args={['#fff3e0', '#8a6040', 1.2 * light]} />
      <ambientLight intensity={0.25 * light} />
      <directionalLight position={[-4, 10, 9]} intensity={2.2 * light} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004} shadow-radius={5} />
      <directionalLight position={[5, 4, 8]} intensity={1.0 * light} color="#ffd9a8" />
      {/* floor + walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={tx.floor} roughness={0.35} />
      </mesh>
      <mesh position={[0, 4.6, -6]} receiveShadow>
        <planeGeometry args={[60, 9.2]} />
        <meshStandardMaterial map={tx.wall} roughness={0.8} />
      </mesh>
      {[-7.5, -2.5, 2.5, 7.5].map((x) => <Banner key={x} p={[x, 7.4, -5.9]} />)}
      {[-9, -4.5, 4.5, 9].map((x) => <Pillar key={x} p={[x, 0, -4.8]} h={6.2} />)}
      <Brazier p={[-7, 0, -2]} t={t} />
      <Brazier p={[7, 0, -2]} t={t + 2} />
      {/* ceiling with two hinged panels above the table */}
      {/* ceiling around an opening above the table */}
      {[[0, -5.05, 40, 6], [0, 6.05, 40, 8], [-11.7, 0, 16.6, 4.1], [11.7, 0, 16.6, 4.1]].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 7.25, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#b98a52" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[-15, -9, 9, 15].map((x) => [-3, 3].map((z) => <T key={x + '' + z} geo={GEO.box} color="#8a5a32" p={[x, 7.15, z]} s={[2.6, 0.12, 1.6]} o={0.01} />))}
      {/* dark chamber above the opening */}
      <mesh position={[0, 8.2, 0]}>
        <boxGeometry args={[6.9, 2, 4.3]} />
        <meshStandardMaterial color="#1a0f0a" side={THREE.BackSide} />
      </mesh>
      <T geo={GEO.box} color="#6b3f22" p={[0, 7.2, -2.15]} s={[7.0, 0.3, 0.12]} o={0.01} />
      <T geo={GEO.box} color="#6b3f22" p={[0, 7.2, 2.15]} s={[7.0, 0.3, 0.12]} o={0.01} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.4, 7.15, 0]} rotation={[0, 0, side * st.ceilingOpen * 1.45]}>
          <group position={[-side * 1.7, 0, 0]}>
            <M geo={GEO.box} color="#e0b04a" s={[3.4, 0.16, 4.2]} o={0.03} />
            {[-1, 0, 1].map((k) => <T key={k} geo={GEO.box} color="#7a1f1d" p={[k * 1.05, -0.1, 0]} s={[0.85, 0.06, 3.6]} o={0.008} />)}
            {/* flower load on top of the panel */}
            {st.ceilingOpen < 0.95 ? <mesh position={[0, 0.22, 0]} scale={[1.5, 0.3, 1.9]}><sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial map={heapTex} roughness={0.8} /></mesh> : null}
          </group>
        </group>
      ))}
      {/* table */}
      <T geo={GEO.rbox} color="#7a4a26" p={[0, 0.95, 0]} s={[10, 0.12, 1.8]} o={0.02} />
      <T geo={GEO.box} color="#f4efe2" p={[0, 0.98, 0]} s={[10.1, 0.04, 1.4]} o={0.01} />
      {[-4.6, 4.6].map((x) => [-0.7, 0.7].map((z) => <T key={x + '' + z} geo={GEO.cyl} color="#6b3f22" p={[x, 0.45, z]} s={[0.09, 0.9, 0.09]} o={0.01} />))}
      <Food />
      {/* guests */}
      {guests.map((g, i) => (
        <Roman key={i} p={g.p} ry={g.ry} robe={g.robe} trim={i % 2 ? '#b8272b' : '#3f6f9a'} robeMap={tx.toga} skin={g.skin} hairStyle={g.hair} hair={['#5a3a22', '#bdb6ad', '#2e2016', '#8a5a32'][i % 4]}
          mood={st.guestMood} look={0.2} bob={t * 0.9 + i * 0.37} armR={st.guestMood === 'grin' ? 0.5 + 0.4 * Math.sin(t * 3 + i) : st.guestMood === 'shock' ? 2.2 : 0.2} armL={st.guestMood === 'shock' ? 2.0 : 0.2} />
      ))}
      {/* air-cushion gag: guest sitting on a cushion at the side */}
      <group position={[-6.4, 0, 1.6]}>
        <T geo={GEO.sphere} color="#b8272b" p={[0, 0.4 * (1 - 0.75 * st.cushion), 0]} s={[0.8, 0.4 * (1 - 0.75 * st.cushion) + 0.04, 0.8]} o={0.02} />
        <Roman p={[0, -0.55 - 0.3 * st.cushion, 0]} ry={0.6} robe="#ffffff" trim="#3f6f9a" robeMap={tx.toga} skin="#f2c4a0" hairStyle="curly" hair="#3a2618" mood={st.cushion > 0.2 ? 'shock' : 'grin'} bob={t} armR={st.cushion > 0.2 ? 2.4 : 0.4} armL={st.cushion > 0.2 ? 2.2 : 0.3} />
      </group>
      {/* the young emperor on a raised throne at the head of the table */}
      <group position={[6.6, 0, 0.2]}>
        <T geo={GEO.rbox} color="#6a2b9e" p={[0, 0.3, 0]} s={[2.2, 0.6, 2.2]} o={0.02} />
        <M geo={GEO.rbox} color="#e0b04a" p={[0.55, 1.9, 0]} s={[0.2, 2.6, 1.4]} o={0.015} />
        <Roman p={[0, 0.6, 0]} ry={-Math.PI / 2 + 0.35} s={1.1} robe="#e9b23a" trim="#6a2b9e" skin="#f3c9a4" hair="#4a2a16" hairStyle="curly" mood={st.emperorMood} look={-0.3} bob={t * 0.6} armR={st.emperorMood === 'shock' ? 2.3 : 1.0} armL={st.emperorMood === 'shock' ? 2.1 : 0.3} />
        <M geo={GEO.torus} color="#f2c230" p={[0, 0.6 + HEAD_Y * 1.1 + 0.42, 0]} r={[Math.PI / 2, 0, 0]} s={[0.7, 0.7, 0.9]} o={0.012} />
        {[0, 1, 2, 3, 4].map((k) => <M key={k} geo={GEO.cone} color="#f2c230" p={[Math.cos(k * 1.256) * 0.62, 0.6 + HEAD_Y * 1.1 + 0.6, Math.sin(k * 1.256) * 0.62]} s={[0.07, 0.25, 0.07]} o={0.008} />)}
      </group>
      {/* flower heap */}
      {heapH > 0.01 ? (
        <mesh position={[0, 0, 0]} scale={[6.3, heapH, 3.6]} receiveShadow>
          <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial map={heapTex} roughness={0.85} />
        </mesh>
      ) : null}
      <Petals since={st.rain} heapTop={heapH} />
      {/* guards marching in */}
      {st.guards >= 0 ? [0, 1, 2, 3].map((k) => (
        <Guard key={k} p={[9.6 + (k % 2) * 1.4, Math.abs(Math.sin(t * 6 + k)) * 0.05, -3.6 + st.guards * 3.2 + Math.floor(k / 2) * -1.4]} ry={-0.3} shield={tx.shield} mood="stern" />
      )) : null}
    </>
  );
};
