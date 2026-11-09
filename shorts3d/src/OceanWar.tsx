import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BeachSet} from './Beach';
import timing from './timing_ocean.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const W = (prefix: string, nth = 0) => timing.words.filter((w) => w.text.startsWith(prefix))[nth].start;

type V3 = [number, number, number];
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number};
const sh = (at: number, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov: number): Shot => ({at, from, to, lookA, lookB, dur, fov});

const SHOTS: Shot[] = [
  // hook: low behind the ranks, pushing toward the sea
  sh(0, [-2.0, 2.0, 16], [-2.0, 2.5, 11.5], [-1.0, 2.4, -12], [-1.0, 2.6, -12], 2.2, 50),
  // catapult fires
  sh(W('Catapults') - 0.1, [-10.6, 2.6, 3.4], [-11.0, 2.4, 2.6], [-13.8, 1.4, -3.5], [-13.8, 1.6, -3.5], 1.2, 50),
  // the emperor raises his sword (front, low angle)
  sh(W('An') - 0.1, [4.6, 2.2, -6.6], [5.2, 2.4, -5.6], [8.2, 3.6, 1.0], [8.2, 3.8, 1.0], 1.8, 48),
  // the enemy? -> the army facing us
  sh(L(1) - 0.15, [-2.0, 3.0, -13], [-2.0, 3.0, -11.5], [-2.0, 2.6, 0], [-2.0, 2.6, 0], 1.6, 50),
  // the ocean. -> huge empty sea
  sh(L(2) - 0.35, [0, 6.5, 10], [0, 8.5, 12], [0, 1.0, -30], [0, 1.6, -40], 2.4, 56),
  // establishing aerial with place/date
  sh(L(3) - 0.1, [17, 17, 19], [13, 15, 16], [0, 0, -2], [0, 0.5, -2.5], 3.2, 42),
  // the order
  sh(L(4) - 0.1, [5.0, 2.6, -6.0], [5.4, 2.7, -5.2], [8.2, 3.7, 1.0], [8.2, 3.8, 1.0], 1.2, 48),
  // soldiers with shells
  sh(W('collect') - 0.05, [-4.2, 2.6, -9.0], [-3.2, 2.4, -8.0], [-3.0, 1.8, 0.5], [-2.8, 1.8, 0.5], 1.6, 48),
  // spoils of the ocean: emperor lifts a shell
  sh(L(5) - 0.1, [4.8, 2.8, -6.4], [5.4, 3.0, -5.4], [8.2, 3.8, 1.0], [8.2, 4.1, 1.0], 3.0, 48),
];

function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to);
  pos[1] += Math.sin(t * 1.1 + 1) * 0.03;
  return {pos, look: lp(s.lookA, s.lookB), fov: s.fov, cutAt: s.at, idx: i};
}

const Cam: React.FC<{pos: V3; look: V3; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  camera.updateProjectionMatrix();
  camera.lookAt(...look);
  return null;
};

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
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1440, textAlign: 'center', transform: `scale(${0.82 + 0.18 * s})`}}>
      <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, letterSpacing: -1, color: '#fff', WebkitTextStroke: '16px #0e0b12', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.35)'}}>
        {chunk.map((w) => w.text.replace(/[.,!?:]$/, '')).join(' ').toLowerCase()}
      </span>
    </div>
  );
};

export const OceanWar: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const fire = interpolate(t, [W('Catapults') + 0.35, W('Catapults') + 0.6], [0, 1.6], cl);
  const swordUp = interpolate(t, [W('attack') - 0.2, W('attack') + 0.15], [0.3, 2.5], cl);
  const point = interpolate(t, [L(4) + 0.2, L(4) + 0.5], [0.3, 1.45], cl);
  const shellUp = interpolate(t, [L(5) + 0.4, L(5) + 0.9], [0.3, 2.6], cl);
  const emperor =
    t < L(4) ? {mood: t < W('An') ? 'stern' : 'grin', armR: swordUp, elbowR: 0.15, hold: 'sword' as const, look: 0}
      : t < L(5) ? {mood: 'grin', armR: point, elbowR: 0.05, hold: 'sword' as const, look: 0}
      : {mood: 'smug', armR: shellUp, elbowR: 0.2, hold: 'shell' as const, look: 0.4};
  const guardMood = t >= W('collect') ? (t >= L(5) ? 'grumpy' : 'shock') : 'stern';
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [cam.idx === 4 ? 0 : 0.2, 0], cl);
  const oceanS = spring({frame: frame - Math.round(L(2) * fps), fps, config: {damping: 10}});
  const oceanO = interpolate(t, [L(2), L(2) + 0.1, L(3) - 0.35, L(3) - 0.1], [0, 1, 1, 0], cl);
  const pillS = spring({frame: frame - Math.round((L(3) + 0.3) * fps), fps, config: {damping: 12}});
  const pillO = interpolate(t, [L(4) - 0.4, L(4) - 0.15], [1, 0], cl);
  const darken = interpolate(t, [L(1) - 0.2, L(1) + 0.2, L(2) - 0.2, L(2)], [0, 0.25, 0.25, 0], cl);
  return (
    <AbsoluteFill style={{backgroundColor: '#9fd4f2'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={2} gl={{antialias: true}} camera={{fov: 50, near: 0.1, far: 300}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <BeachSet t={t} guardMood={guardMood as any} shells={t >= W('collect')} emperor={emperor} catapultArm={fire} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#000', opacity: darken}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(10,20,40,.28) 100%)'}} />
      {oceanO > 0 ? (
        <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: oceanO, transform: `scale(${0.6 + 0.4 * oceanS})`, fontFamily: FONT, fontWeight: 900, fontSize: 150, color: '#fff', WebkitTextStroke: '18px #0e2440', paintOrder: 'stroke fill', letterSpacing: 2}}>THE OCEAN.</div>
      ) : null}
      {t > L(3) + 0.3 ? (
        <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: pillO, transform: `scale(${pillS})`}}>
          <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 42, letterSpacing: 10, color: '#fff', background: 'rgba(14,11,18,.55)', padding: '14px 30px', borderRadius: 14}}>GAUL · 40 AD</span>
        </div>
      ) : null}
      {t < L(2) || t > L(3) - 0.1 ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: cam.cutAt > 0 ? flash : 0}} />
      <Audio src={staticFile('ocean_voice.wav')} />
      <Audio src={staticFile('ocean_music.wav')} />
    </AbsoluteFill>
  );
};
