import React, {useMemo} from 'react';
import * as THREE from 'three';
import {GEO, HEAD_Y, M, Roman, T} from './hd';

type V3 = [number, number, number];

function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#c9935a' : '#bf8850';
    g.fillRect(0, i * 64, 512, 64);
    g.strokeStyle = 'rgba(90,50,20,.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke();
    g.beginPath(); g.moveTo(((i * 173) % 512), i * 64); g.lineTo(((i * 173) % 512), i * 64 + 64); g.stroke();
    for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(120,70,30,.12)'; g.beginPath(); g.moveTo(0, i * 64 + 10 + k * 9); g.bezierCurveTo(170, i * 64 + 4 + k * 9, 340, i * 64 + 16 + k * 9, 512, i * 64 + 8 + k * 9); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const Marshmallow: React.FC<{p: V3; s?: number; bite?: number}> = ({p, s = 1, bite = 0}) => (
  <group position={p} scale={s}>
    <T geo={GEO.cyl} color="#fbf7f0" p={[0, 0.11, 0]} s={[0.13 * (1 - bite * 0.4), 0.22, 0.13]} o={0.01} />
    <T geo={GEO.sphere} color="#fbf7f0" p={[0, 0.22, 0]} s={[0.13 * (1 - bite * 0.4), 0.03, 0.13]} o={0} />
  </group>
);

const Plate: React.FC<{p: V3; count: number; bite?: number}> = ({p, count, bite = 0}) => (
  <group position={p}>
    <T geo={GEO.cyl} color="#ffffff" s={[0.42, 0.04, 0.42]} o={0.01} />
    <T geo={GEO.cyl} color="#e9eef5" p={[0, 0.025, 0]} s={[0.3, 0.01, 0.3]} o={0} />
    {count >= 1 && bite < 1 ? <Marshmallow p={[count >= 2 ? -0.13 : 0, 0.03, 0]} bite={bite} /> : null}
    {count >= 2 ? <Marshmallow p={[0.15, 0.03, 0.02]} /> : null}
  </group>
);

const Glasses: React.FC = () => (
  <group position={[0, HEAD_Y + 0.04, 0.68]}>
    {[-0.26, 0.26].map((x) => <mesh key={x} position={[x, 0, 0.02]} scale={[0.19, 0.17, 0.19]}><torusGeometry args={[1, 0.11, 10, 30]} /><meshStandardMaterial color="#1f1a24" /></mesh>)}
    <mesh position={[0, 0.02, 0.03]} scale={[0.14, 0.025, 0.03]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#1f1a24" /></mesh>
  </group>
);

const GradCap: React.FC = () => (
  <group position={[0, HEAD_Y + 0.62, -0.05]} rotation={[-0.15, 0, 0]}>
    <T geo={GEO.cyl} color="#1f1a24" s={[0.5, 0.22, 0.5]} o={0.015} />
    <T geo={GEO.box} color="#1f1a24" p={[0, 0.14, 0]} r={[0, Math.PI / 4, 0]} s={[1.2, 0.06, 1.2]} o={0.015} />
    <M geo={GEO.cyl} color="#f2c230" p={[0.48, -0.08, 0.25]} s={[0.02, 0.4, 0.02]} o={0.005} />
  </group>
);

type Kid = {p: V3; ry?: number; shirt: string; hair: 'curly' | 'caesar'; hairColor: string; skin: string; mood: any; look?: number; armR?: number; armL?: number; elbow?: number; s?: number; bob?: number};
export const KidFig: React.FC<Kid> = ({p, ry = 0, shirt, hair, hairColor, skin, mood, look = 0, armR = 0, armL = 0, s = 0.72, bob = 0}) => (
  <Roman p={p} ry={ry} s={s} robe={shirt} trim={shirt} skin={skin} hairStyle={hair} hair={hairColor} mood={mood} look={look} armR={armR} armL={armL} bob={bob} />
);

export type LabState = {
  t: number;
  kidMood: any; kidLook: number; kidArms: [number, number]; bite: number; plateCount: number;
  researcher: {p: V3; ry: number; walk: number; armR: number; mood: any; visible: boolean};
  booths: boolean; // show the three-booth row
  grown: number; // 0 = kid, 1 = grown-up with graduation cap
  clock: number; // minutes on the wall clock
  dim: number;
  notes: boolean; // music notes for the singing kid
};

const Booth: React.FC<{x: number; t: number; kind: 'eat' | 'eyes' | 'away'; skin: string; shirt: string; hairColor: string; hair: 'curly' | 'caesar'}> = ({x, t, kind, skin, shirt, hairColor, hair}) => {
  const chew = kind === 'eat' ? Math.min(1, Math.max(0, (t % 6) / 2)) : 0;
  return (
    <group position={[x, 0, 0]}>
      <T geo={GEO.box} color="#e9dcc6" p={[-1.45, 1.4, -0.4]} s={[0.08, 2.8, 3.2]} o={0.015} />
      <T geo={GEO.rbox} color="#9a6a3c" p={[0, 1.15, 0.5]} s={[1.6, 0.1, 1.0]} o={0.015} />
      <T geo={GEO.cylLow} color="#7a4c28" p={[0, 0.57, 0.5]} s={[0.07, 1.15, 0.07]} o={0.01} />
      <Plate p={[0, 1.22, 0.65]} count={kind === 'eat' ? 0 : 1} />
      <KidFig p={[0, 0, -0.1]} ry={kind === 'away' ? Math.PI * 0.85 : 0} shirt={shirt} hair={hair} hairColor={hairColor} skin={skin}
        mood={kind === 'eat' ? 'grin' : kind === 'eyes' ? 'grumpy' : 'calm'} look={0}
        armR={kind === 'eyes' ? 2.6 : kind === 'eat' ? 1.4 + 0.3 * Math.sin(t * 8) * chew : 0.2} armL={kind === 'eyes' ? 2.6 : 0.2} bob={t} />
    </group>
  );
};

export const LabSet: React.FC<LabState> = (st) => {
  const wood = useMemo(woodTexture, []);
  const {t} = st;
  const light = 1 - 0.4 * st.dim;
  const hand = (st.clock / 60) * Math.PI * 2;
  return (
    <>
      <color attach="background" args={['#f3e7d3']} />
      <hemisphereLight args={['#fffaf0', '#b58c64', 1.3 * light]} />
      <ambientLight intensity={0.3 * light} />
      <directionalLight position={[-6, 9, 8]} intensity={2.0 * light} color="#fff5e6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.0004} shadow-radius={5} />
      <directionalLight position={[6, 4, 6]} intensity={0.8 * light} color="#dbe9ff" />
      {/* floor + walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={wood} roughness={0.5} /></mesh>
      <mesh position={[0, 4, -3]} receiveShadow><planeGeometry args={[40, 8]} /><meshStandardMaterial color="#cfe6e0" roughness={0.9} /></mesh>
      <mesh position={[0, 0.6, -2.98]}><planeGeometry args={[40, 1.2]} /><meshStandardMaterial color="#9cc7bd" roughness={0.9} /></mesh>
      <mesh position={[0, 1.22, -2.97]}><planeGeometry args={[40, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {/* window */}
      <group position={[-3.2, 3.2, -2.95]}>
        <T geo={GEO.box} color="#ffffff" s={[2.2, 1.7, 0.08]} o={0.015} />
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[1.95, 1.45]} /><meshBasicMaterial color="#9fd4f2" /></mesh>
        <mesh position={[0.4, 0.2, 0.06]} scale={[0.5, 0.25, 1]}><circleGeometry args={[1, 24]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <T geo={GEO.box} color="#ffffff" p={[0, 0, 0.07]} s={[0.06, 1.5, 0.04]} o={0} />
        <T geo={GEO.box} color="#ffffff" p={[0, 0, 0.07]} s={[2.0, 0.06, 0.04]} o={0} />
      </group>
      {/* door */}
      <group position={[3.6, 0, -2.95]}>
        <T geo={GEO.box} color="#ffffff" p={[0, 1.5, 0]} s={[1.5, 3.1, 0.06]} o={0.015} />
        <T geo={GEO.box} color="#a36a3a" p={[0, 1.45, 0.05]} s={[1.3, 2.9, 0.06]} o={0.015} />
        <M geo={GEO.sphere} color="#e0b04a" p={[0.5, 1.4, 0.12]} s={0.07} o={0.008} />
      </group>
      {/* wall clock */}
      <group position={[0.4, 4.2, -2.93]}>
        <T geo={GEO.cyl} color="#ffffff" r={[Math.PI / 2, 0, 0]} s={[0.55, 0.08, 0.55]} o={0.025} />
        {Array.from({length: 12}).map((_, k) => <mesh key={k} position={[Math.sin(k / 12 * Math.PI * 2) * 0.44, Math.cos(k / 12 * Math.PI * 2) * 0.44, 0.06]} scale={[0.03, 0.07, 0.01]} rotation={[0, 0, -k / 12 * Math.PI * 2]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#1f1a24" /></mesh>)}
        <mesh position={[Math.sin(hand) * 0.18, Math.cos(hand) * 0.18, 0.08]} rotation={[0, 0, -hand]} scale={[0.04, 0.38, 0.01]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#e8343a" /></mesh>
        <mesh position={[Math.sin(hand / 12) * 0.12, Math.cos(hand / 12) * 0.12, 0.08]} rotation={[0, 0, -hand / 12]} scale={[0.05, 0.26, 0.01]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#1f1a24" /></mesh>
      </group>
      {/* main table, chair, plate */}
      {!st.booths ? (
        <group>
          <T geo={GEO.rbox} color="#9a6a3c" p={[0, 1.15, 0.5]} s={[1.8, 0.1, 1.1]} o={0.015} />
          {[[-0.75, 0.1], [0.75, 0.1], [-0.75, 0.9], [0.75, 0.9]].map(([x, z], i) => <T key={i} geo={GEO.cylLow} color="#7a4c28" p={[x, 0.57, z]} s={[0.05, 1.15, 0.05]} o={0.01} />)}
          <Plate p={[0, 1.22, 0.65]} count={st.plateCount} bite={st.bite} />
          {st.grown < 0.5 ? (
            <KidFig p={[0, 0, -0.15]} shirt="#ff7a59" hair="curly" hairColor="#6b3a1e" skin="#f3c7a2" mood={st.kidMood} look={st.kidLook} armR={st.kidArms[0]} armL={st.kidArms[1]} bob={t} />
          ) : (
            <group position={[0, 0, -0.15]}>
              <Roman p={[0, 0, 0]} s={1.0} robe="#2d3e63" trim="#2d3e63" skin="#f3c7a2" hairStyle="curly" hair="#6b3a1e" mood="grin" armR={1.6 + 0.2 * Math.sin(t * 3)} bob={t} />
              <GradCap />
            </group>
          )}
        </group>
      ) : (
        <group>
          <Booth x={-3.0} t={t} kind="eat" skin="#e0b08a" shirt="#4fb0e8" hairColor="#2e2016" hair="caesar" />
          <Booth x={0} t={t} kind="eyes" skin="#f3c7a2" shirt="#ff7a59" hairColor="#6b3a1e" hair="curly" />
          <Booth x={3.0} t={t} kind="away" skin="#d9a47c" shirt="#7fd06a" hairColor="#3a2416" hair="curly" />
          {st.notes ? [0, 1, 2].map((k) => {
            const u = (t * 0.6 + k / 3) % 1;
            return <mesh key={k} position={[3.0 + Math.sin(u * 6 + k) * 0.4, 2.6 + u * 1.6, 0.2]} scale={0.12 * (1 - u * 0.5)}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#8a5cd6" transparent opacity={1 - u} /></mesh>;
          }) : null}
        </group>
      )}
      {/* researcher */}
      {st.researcher.visible ? (
        <group position={st.researcher.p} rotation={[0, st.researcher.ry, 0]}>
          <Roman p={[0, 0, 0]} s={1.05} robe="#ffffff" trim="#cfd6e0" skin="#eab48e" hairStyle="caesar" hair="#4a3a2e" mood={st.researcher.mood} armR={st.researcher.armR} walk={st.researcher.walk} bob={t} />
          <group scale={1.05}><Glasses /></group>
        </group>
      ) : null}
    </>
  );
};
