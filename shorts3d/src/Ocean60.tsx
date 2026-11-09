import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BeachSet} from './Beach';
import {Hall} from './HdStill';
import timing from './timing_ocean60.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
const W = (prefix: string, nth = 0) => timing.words.filter((w) => w.text.startsWith(prefix))[nth].start;
export const OCEAN60_DURATION = timing.duration + 1.6;

type V3 = [number, number, number];
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number; set?: 'beach' | 'hall'};
const sh = (at: number, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov: number, set: 'beach' | 'hall' = 'beach'): Shot => ({at, from, to, lookA, lookB, dur, fov, set});
const EMP: V3 = [8.2, 3.8, 1.0];

const SHOTS: Shot[] = [
  sh(0, [-2.0, 2.0, 16], [-2.0, 2.5, 11.5], [-1.0, 2.4, -12], [-1.0, 2.6, -12], 2.2, 50),
  sh(W('Catapults') - 0.1, [-10.6, 2.6, 3.4], [-11.0, 2.4, 2.6], [-13.8, 1.4, -3.5], [-13.8, 1.6, -3.5], 1.2, 50),
  sh(W('An') - 0.1, [4.6, 2.2, -6.6], [5.2, 2.4, -5.6], EMP, [8.2, 4.0, 1.0], 1.8, 48),
  sh(L(1) - 0.15, [-2.0, 3.0, -13], [-2.0, 3.0, -11.5], [-2.0, 2.6, 0], [-2.0, 2.6, 0], 1.6, 50),
  sh(L(2) - 0.35, [0, 6.5, 10], [0, 8.5, 12], [0, 1.0, -30], [0, 1.6, -40], 2.4, 56),
  sh(L(3) - 0.1, [17, 17, 19], [13, 15, 16], [0, 0, -2], [0, 0.5, -2.5], 3.4, 42),
  // Britain on the horizon
  sh(L(4) - 0.1, [-3, 6.4, 11], [-3, 5.6, 8.5], [-4, 1.6, -60], [-4, 2.0, -70], 3.6, 46),
  // full armor: dolly along the front rank
  sh(L(5) - 0.1, [-9.5, 2.6, -7.5], [-2.5, 2.6, -7.5], [-8.0, 2.2, -1.5], [-1.0, 2.2, -1.5], 3.6, 46),
  // trumpets
  sh(L(6) - 0.1, [2.6, 2.4, -8.2], [3.2, 2.6, -7.4], [6.6, 2.8, -1.0], [6.8, 3.0, -0.8], 1.6, 48),
  // the order
  sh(L(7) - 0.1, [5.0, 2.6, -6.0], [5.4, 2.7, -5.2], EMP, [8.2, 3.9, 1.0], 1.0, 48),
  sh(W('collect') - 0.05, [-4.2, 3.2, -11.0], [-3.6, 3.0, -10.0], [-3.0, 1.9, 0.5], [-2.8, 1.9, 0.5], 1.6, 50),
  // looking at each other
  sh(L(8) - 0.1, [-4.5, 2.8, -8.0], [-3.0, 2.7, -7.6], [-3.5, 2.1, 0], [-2.5, 2.1, 0], 2.8, 46),
  // helmets full of shells
  sh(L(9) - 0.1, [-1.0, 1.6, -7.2], [-2.6, 1.5, -6.6], [-1.5, 0.8, -1.5], [-2.5, 0.9, -1.5], 3.0, 48),
  // spoils of the ocean
  sh(L(10) - 0.1, [4.8, 2.8, -6.4], [5.4, 3.0, -5.4], EMP, [8.2, 4.1, 1.0], 3.2, 48),
  // the tower rises
  sh(L(11) - 0.1, [0, 5.0, 15], [2, 6.0, 13], [11, 4.5, -6], [12, 5.5, -6], 3.4, 50),
  // reward: coin rain
  sh(L(12) - 0.1, [-2.5, 5.5, -13.5], [-2.0, 5.0, -12.0], [-2.0, 1.6, 0.5], [-2.0, 1.4, 0.5], 2.4, 50),
  // back to Rome
  sh(L(13) - 0.1, [0.6, 6.4, 13.0], [0.3, 8.4, 11.8], [0.5, 1.6, -1.0], [0.5, 1.4, -0.1], 2.6, 47, 'hall'),
  // was he really mad?
  sh(L(14) - 0.15, [5.6, 3.2, -4.6], [6.0, 3.4, -3.8], EMP, [8.2, 4.0, 1.0], 1.6, 46),
  // historians: empty ships, soldiers who refused
  sh(L(15) - 0.1, [-18, 4.2, -2.0], [-16, 4.0, -3.0], [-4, 1.4, -5], [-2, 1.4, -5], 4.0, 52),
  // punishment
  sh(L(16) - 0.1, [-2.0, 2.4, -8.6], [-2.0, 2.3, -7.6], [-2.2, 1.6, 0.0], [-2.2, 1.7, 0.0], 2.4, 46),
  // CTA: wide calm sea shot
  sh(L(17) - 0.2, [-1, 7, 16], [-1, 9, 19], [-1, 1.2, -10], [-1, 1.5, -12], 5.0, 50),
];

function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to);
  pos[1] += Math.sin(t * 1.1 + 1) * 0.03;
  return {pos, look: lp(s.lookA, s.lookB), fov: s.fov, cutAt: s.at, idx: i, set: s.set};
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

const Pill: React.FC<{text: string; at: number; until: number; t: number; frame: number; fps: number; top?: number}> = ({text, at, until, t, frame, fps, top = 300}) => {
  if (t < at || t > until + 0.3) return null;
  const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 12}});
  const o = interpolate(t, [until, until + 0.25], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${s})`}}>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 42, letterSpacing: 10, color: '#fff', background: 'rgba(14,11,18,.55)', padding: '14px 30px', borderRadius: 14}}>{text}</span>
    </div>
  );
};

export const Ocean60: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const fire = interpolate(t, [W('Catapults') + 0.35, W('Catapults') + 0.6], [0, 1.6], cl);
  const swordUp = interpolate(t, [W('attack') - 0.2, W('attack') + 0.15], [0.3, 2.5], cl);
  const point = interpolate(t, [L(7) + 0.4, L(7) + 0.7], [0.3, 1.45], cl);
  const shellUp = interpolate(t, [L(10) + 0.4, L(10) + 0.9], [0.3, 2.6], cl);
  let emperor: any = {mood: t < W('An') ? 'stern' : 'grin', armR: swordUp, elbowR: 0.15, hold: 'sword', look: 0};
  if (t >= L(7)) emperor = {mood: 'grin', armR: point, elbowR: 0.05, hold: 'sword', look: 0};
  if (t >= L(10)) emperor = {mood: 'smug', armR: shellUp, elbowR: 0.2, hold: 'shell', look: 0.4};
  if (t >= L(14)) emperor = {mood: 'calm', armR: 0.2, elbowR: 0.3, hold: 'shell', look: 0};
  const guardMood = t >= L(16) ? 'grumpy' : t >= L(15) ? 'grumpy' : t >= L(12) ? 'grin' : t >= L(10) ? 'grumpy' : t >= W('collect') ? 'shock' : 'stern';
  const turn = interpolate(t, [L(8), L(8) + 0.5, LE(8), LE(8) + 0.4], [0, 1, 1, 0], cl);
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [cam.idx === 4 ? 0 : 0.18, 0], cl);
  const oceanS = spring({frame: frame - Math.round(L(2) * fps), fps, config: {damping: 10}});
  const oceanO = interpolate(t, [L(2), L(2) + 0.1, L(3) - 0.35, L(3) - 0.1], [0, 1, 1, 0], cl);
  const darken = interpolate(t, [L(1) - 0.2, L(1) + 0.2, L(2) - 0.2, L(2)], [0, 0.25, 0.25, 0], cl) + interpolate(t, [L(14) - 0.2, L(14) + 0.2, LE(14) + 0.2, LE(14) + 0.5], [0, 0.3, 0.3, 0], cl);
  const endO = interpolate(t, [L(17) + 0.2, L(17) + 0.6], [0, 1], cl);
  const cardS = (k: number) => spring({frame: frame - Math.round((W('Madness') + k * 0.5) * fps), fps, config: {damping: 11}});
  const hall = cam.set === 'hall';
  return (
    <AbsoluteFill style={{backgroundColor: '#9fd4f2'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true}} camera={{fov: 50, near: 0.1, far: 300}}>
        {hall ? (
          <Hall t={t} cam={cam} emperorMood="grin" armR={interpolate(t, [L(13) + 0.3, L(13) + 0.8], [0.3, 2.4], cl)} horseMood="smug" emperorLook={0.3} />
        ) : (
          <>
            <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
            <BeachSet t={t} guardMood={guardMood as any} shells={t >= W('collect') && t < L(9)} emperor={emperor} catapultArm={fire}
              bare={t >= L(9) - 0.2 && t < L(15)} helmetsWithShells={t >= L(9) - 0.2 && t < L(15)} turn={turn}
              tower={interpolate(t, [L(11) + 0.3, L(11) + 2.6], [0, 1], {...cl, easing: Easing.out(Easing.back(1.4))})}
              coins={t >= L(12) && t < LE(12) + 1.2 ? t - L(12) : -1}
              horns={t >= L(6) - 0.1 && t < L(7) + 0.5 ? interpolate(t, [L(6), L(6) + 0.3], [0, 1], cl) : undefined} />
          </>
        )}
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#000', opacity: darken}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(10,20,40,.28) 100%)'}} />
      {oceanO > 0 ? (
        <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: oceanO, transform: `scale(${0.6 + 0.4 * oceanS})`, fontFamily: FONT, fontWeight: 900, fontSize: 150, color: '#fff', WebkitTextStroke: '18px #0e2440', paintOrder: 'stroke fill', letterSpacing: 2}}>THE OCEAN.</div>
      ) : null}
      <Pill text="GAUL · 40 AD" at={L(3) + 0.3} until={LE(3)} t={t} frame={frame} fps={fps} />
      <Pill text="BRITAIN →" at={W('Britain') - 0.1} until={LE(4)} t={t} frame={frame} fps={fps} top={420} />
      <Pill text="ROME" at={L(13) + 0.2} until={LE(13)} t={t} frame={frame} fps={fps} />
      {endO > 0 ? (
        <AbsoluteFill style={{background: `rgba(8,14,28,${0.55 * endO})`}}>
          <div style={{position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: '#fff', opacity: endO}}>MADNESS<br /><span style={{fontSize: 60, color: '#9fb4d6'}}>or</span><br />PUNISHMENT?</div>
          {[['🤪', 'MADNESS', '#ffcf3a'], ['⚔️', 'PUNISHMENT', '#ff6b5b']].map(([e, txt, col], k) => (
            <div key={txt} style={{position: 'absolute', left: 110, right: 110, top: 760 + k * 190, height: 150, borderRadius: 30, background: '#fff', border: `8px solid ${col}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', transform: `scale(${cardS(k)})`, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#0e0b12'}}>
              <span style={{fontSize: 76}}>{e}</span>{txt}
            </div>
          ))}
          <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `scale(${cardS(2)})`}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', background: '#e8343a', padding: '20px 44px', borderRadius: 999}}>💬 COMMENT</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {(t < L(2) || t > L(3) - 0.1) ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: cam.cutAt > 0 ? flash : 0}} />
      <Audio src={staticFile('ocean60_voice.wav')} />
      <Audio src={staticFile('ocean60_music.wav')} />
    </AbsoluteFill>
  );
};
