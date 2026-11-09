import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Column, G, Horse, Person, Toon} from './toon';
import timing from './timing_caligula.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const ease = Easing.bezier(0.45, 0, 0.55, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Shot = {at: number; pos: [number, number, number]; look: [number, number, number]};

function useShots(): Shot[] {
  const [l0, l1, l2] = timing.lines;
  return [
    {at: 0, pos: [0.5, 5.2, 15], look: [0, 1.6, 0]},
    {at: l0[0] + 0.2, pos: [1.2, 3.6, 10.5], look: [0.2, 1.5, 0]}, // slow push-in
    {at: l1[0] - 0.2, pos: [5.4, 3.0, 7.4], look: [2.0, 1.4, -1.4]}, // stall + manger
    {at: l1[0] + 2.6, pos: [5.6, 2.4, 3.6], look: [3.4, 1.0, -2.4]}, // close on the ivory manger
    {at: l2[0] - 0.2, pos: [-6.5, 2.6, 6.2], look: [-3.4, 1.6, 2.2]}, // senators
    {at: l2[0] + 1.6, pos: [-2.4, 2.2, 7.2], look: [-3.0, 1.6, 2.2]}, // dolly along the row
  ];
}

const Rig: React.FC<{t: number; shots: Shot[]}> = ({t, shots}) => {
  const {camera} = useThree();
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (t >= shots[k].at) i = k;
  const a = shots[Math.max(0, i - 1)], b = shots[i];
  const dur = i === 1 ? 4 : 1.1; // first move is a slow push, the rest are quick cuts-with-motion
  const p = i === 0 ? 1 : ease(Math.min(1, (t - b.at) / dur));
  const pos = new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), p);
  const look = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), p);
  // gentle handheld drift
  pos.x += Math.sin(t * 0.7) * 0.08;
  pos.y += Math.sin(t * 0.9 + 1) * 0.05;
  camera.position.copy(pos);
  camera.lookAt(look);
  return null;
};

function useFloorTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? '#e8dcc6' : '#d6c4a6';
        g.fillRect(x * 64, y * 64, 64, 64);
      }
    g.strokeStyle = 'rgba(80,60,40,.35)';
    g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke();
      g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const shots = useShots();
  const floor = useFloorTexture();
  const [, l1, l2] = timing.lines;
  const eat = interpolate(t, [l1[0] + 2.2, l1[0] + 2.8], [0, 1], cl);
  const chew = eat * Math.abs(Math.sin(t * 9));
  const pat = interpolate(t, [l1[0] + 0.6, l1[0] + 1.0, l1[0] + 2.0, l1[0] + 2.4], [0, 1, 1, 0], cl) * (0.9 + 0.25 * Math.sin(t * 14));
  const shocked = t > l2[0] + 2.1;
  return (
    <>
      <Rig t={t} shots={shots} />
      <color attach="background" args={['#f6d9a8']} />
      <fog attach="fog" args={['#f6d9a8', 16, 34]} />
      <hemisphereLight args={['#fff4e0', '#a07850', 1.1]} />
      <directionalLight position={[6, 10, 7]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      {/* marble floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshToonMaterial map={floor} />
      </mesh>
      {/* back wall + columns */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <boxGeometry args={[40, 8, 0.4]} />
        <meshToonMaterial color="#e3c79a" />
      </mesh>
      <mesh position={[0, 7.4, -5.7]}>
        <boxGeometry args={[40, 0.5, 0.3]} />
        <meshToonMaterial color="#b0302a" />
      </mesh>
      {[-9, -6, -3, 3, 6, 9].map((x) => (
        <Column key={x} position={[x, 0, -4.8]} h={5.2} />
      ))}
      {/* marble stall: low walls with veins */}
      <group position={[2.4, 0, -1.6]}>
        <Toon geo={G.box} color="#f2f0ec" position={[0, 0.7, -1.6]} scale={[4.6, 1.4, 0.25]} />
        <Toon geo={G.box} color="#f2f0ec" position={[2.2, 0.7, 0]} scale={[0.25, 1.4, 3.4]} />
        {[[-1.4, 0.9], [-0.2, 0.5], [1.1, 1.0]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, -1.46]} rotation={[0, 0, 0.5 + i * 0.4]} scale={[0.7, 0.03, 0.02]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#9aa0aa" />
          </mesh>
        ))}
        {/* ivory manger with hay */}
        <Toon geo={G.box} color="#f4e9cf" position={[1.3, 0.55, -1.15]} scale={[1.4, 0.5, 0.6]} />
        {Array.from({length: 9}).map((_, i) => (
          <Toon key={i} geo={G.box} color="#e7c04a" position={[0.75 + (i % 5) * 0.27, 0.84, -1.2 + Math.floor(i / 5) * 0.2]} rotation={[0.3 * i, 0.5 * i, 0.2]} scale={[0.32, 0.04, 0.05]} outline={0.01} />
        ))}
      </group>
      <Horse position={[2.2, 0, -1.3]} rotY={-0.25} chew={chew} headDip={eat} />
      {/* the emperor */}
      <Person position={[-0.4, 0, 0.2]} rotY={0.35} robe="#6b2fa0" stripe="#f1b733" hair="#2a1a10" mood="smug" laurel bob={t * 0.8} armWave={pat * 1.6} look={[1, 0]} scale={1.05} />
      {/* senators */}
      {[-6, -4.6, -3.2, -1.8].map((x, i) => (
        <Person key={i} position={[x, 0, 2.2 - (i % 2) * 0.5]} rotY={0.5} robe="#f7f4ec" stripe="#c0392b" hair={['#5a4632', '#c8c8c8', '#2e2016', '#8a8a8a'][i]} skin={['#f3c9a4', '#e0b08a', '#f6d2b5', '#d9a47c'][i]} mood={shocked && i === 2 ? 'shock' : 'grumpy'} bob={t * 0.6 + i * 0.3} look={[1, 0]} scale={0.92} />
      ))}
    </>
  );
};

const Captions: React.FC<{t: number}> = ({t}) => {
  const words = timing.words.filter((w) => {
    const ln = timing.lines[w.line];
    return t >= ln[0] - 0.1 && t <= ln[1] + 0.35;
  });
  if (!words.length) return null;
  const active = words.findIndex((w) => t >= w.start && t < w.end + 0.05);
  const next = words.findIndex((w) => t < w.start);
  const idx = active >= 0 ? active : next > 0 ? next - 1 : next === 0 ? 0 : words.length - 1;
  const chunk = words.slice(Math.floor(idx / 2) * 2, Math.floor(idx / 2) * 2 + 2);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1330, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap'}}>
      {chunk.map((w, i) => {
        const cur = t >= w.start && t < w.end + 0.05;
        const s = interpolate(t, [w.start, w.start + 0.1], [0.8, 1], cl);
        return (
          <span key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: 100, color: cur ? '#ffd23f' : '#fff', opacity: t >= w.start ? 1 : 0.4, transform: `scale(${t >= w.start ? s : 0.8}) rotate(${cur ? -2 : 0}deg)`, WebkitTextStroke: '12px #1a1320', paintOrder: 'stroke fill'}}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

export const Caligula: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const [l0, l1] = timing.lines;
  const pill = (txt: string, at: number, until: number, top: number, left: number, bg: string) => {
    const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 11}});
    const o = interpolate(t, [until, until + 0.25], [1, 0], cl);
    if (t < at) return null;
    return <div style={{position: 'absolute', top, left, transform: `scale(${s}) rotate(-3deg)`, opacity: o, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: '#1a1320', background: bg, border: '6px solid #1a1320', padding: '12px 28px', borderRadius: 22}}>{txt}</div>;
  };
  const titleS = spring({frame: frame - 8, fps, config: {damping: 12}});
  const titleO = interpolate(t, [l0[1] + 0.1, l0[1] + 0.4], [1, 0], cl);
  const vign = 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(40,20,10,.35) 100%)';
  return (
    <AbsoluteFill style={{backgroundColor: '#f6d9a8'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 45, near: 0.1, far: 100}} gl={{antialias: true}}>
        <World />
      </ThreeCanvas>
      <AbsoluteFill style={{background: vign}} />
      <div style={{position: 'absolute', top: 230, left: 40, right: 40, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 108, lineHeight: 1.02, color: '#fff', transform: `scale(${titleS})`, opacity: titleO, WebkitTextStroke: '14px #1a1320', paintOrder: 'stroke fill'}}>
        SEIN PFERD<br /><span style={{color: '#ffd23f'}}>ALS KONSUL?</span>
      </div>
      {pill('MARMOR', timing.words.find((w) => w.text.startsWith('Marmor'))!.start, l1[1] + 0.3, 330, 90, '#f2f0ec')}
      {pill('ELFENBEIN', timing.words.find((w) => w.text.startsWith('Elfenbein'))!.start, l1[1] + 0.3, 470, 470, '#f4e9cf')}
      <Captions t={t} />
      <Audio src={staticFile('caligula_voice.wav')} />
      <Audio src={staticFile('caligula_music.wav')} />
    </AbsoluteFill>
  );
};
