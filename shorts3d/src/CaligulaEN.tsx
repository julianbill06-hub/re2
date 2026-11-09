import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Hall} from './HdStill';
import timing from './timing_en.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const W = (prefix: string, nth = 0) => timing.words.filter((w) => w.text.startsWith(prefix))[nth].start;

type V3 = [number, number, number];
type Shot = {at: number; from: {pos: V3; look: V3}; to: {pos: V3; look: V3}; dur: number; fov: number};

const SHOTS: Shot[] = [
  // establishing: slow descent over the guards
  {at: 0, from: {pos: [0.3, 10.8, 14.5], look: [0.5, 1.7, -1.5]}, to: {pos: [0.3, 8.7, 11.8], look: [0.5, 1.4, -0.1]}, dur: 2.4, fov: 47},
  // Emperor Caligula
  {at: W('Emperor') - 0.15, from: {pos: [-0.2, 4.7, 8.6], look: [-0.9, 2.6, 3.4]}, to: {pos: [-0.5, 3.8, 7.4], look: [-0.9, 2.8, 3.5]}, dur: 1.6, fov: 42},
  // Not a general.
  {at: W('Not', 0) - 0.1, from: {pos: [-0.8, 3.0, -0.6], look: [-0.6, 2.6, -4.5]}, to: {pos: [0.9, 3.0, -0.6], look: [1.1, 2.6, -4.5]}, dur: 0.9, fov: 44},
  // Not a senator.
  {at: W('Not', 1) - 0.1, from: {pos: [-2.1, 3.0, 4.0], look: [-2.7, 2.4, 1.0]}, to: {pos: [-2.25, 2.9, 3.5], look: [-2.7, 2.5, 1.0]}, dur: 0.9, fov: 42},
  // His horse.
  {at: W('His') - 0.1, from: {pos: [1.3, 3.7, 6.4], look: [1.6, 2.9, 2.4]}, to: {pos: [1.05, 3.4, 5.5], look: [1.6, 3.0, 2.4]}, dur: 1.6, fov: 40},
];

function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lerp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lerp(s.from.pos, s.to.pos);
  pos[0] += Math.sin(t * 0.8) * 0.04; // tiny handheld float
  pos[1] += Math.sin(t * 1.1 + 1) * 0.03;
  return {pos, look: lerp(s.from.look, s.to.look), fov: s.fov, cutAt: s.at};
}

const Captions: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => {
  // 1-2 words at a time, current word pops in
  const ws = timing.words;
  let i = ws.findIndex((w) => t >= w.start && t < w.end + 0.08);
  if (i < 0) { const nx = ws.findIndex((w) => t < w.start); i = nx > 0 ? nx - 1 : nx === 0 ? -1 : ws.length - 1; }
  if (i < 0) return null;
  const line = timing.lines[ws[i].line];
  if (t > line[1] + 0.3) return null;
  const pairStart = ws[i].text.length <= 3 && i + 1 < ws.length && ws[i + 1].line === ws[i].line ? i : i > 0 && ws[i - 1].text.length <= 3 && ws[i - 1].line === ws[i].line && t < ws[i].end ? i - 1 : i;
  const chunk = ws.slice(pairStart, pairStart + (ws[pairStart].text.length <= 3 ? 2 : 1));
  const s = spring({frame: frame - Math.round(ws[i].start * fps), fps, config: {damping: 13, stiffness: 220}});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1480, textAlign: 'center', transform: `scale(${0.82 + 0.18 * s})`}}>
      <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 112, letterSpacing: -1, color: '#fff', WebkitTextStroke: '16px #0e0b12', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.35)'}}>
        {chunk.map((w) => w.text.replace(/[.,]$/, '')).join(' ').toLowerCase()}
      </span>
    </div>
  );
};

export const CaligulaEN: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const horseTime = t >= W('His');
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [0.22, 0], cl);
  const grin = t >= W('Emperor') ? 'grin' : 'smug';
  const armR = interpolate(t, [W('His') - 0.1, W('His') + 0.3], [0.2, 1.3], cl);
  const titleS = spring({frame: frame - 10, fps, config: {damping: 14}});
  const titleO = interpolate(t, [timing.lines[0][1] + 0.15, timing.lines[0][1] + 0.45], [1, 0], cl);
  return (
    <AbsoluteFill style={{backgroundColor: '#3a2216'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={2} gl={{antialias: true}} camera={{fov: 45, near: 0.1, far: 100}}>
        <Hall t={t} cam={cam} emperorMood={grin} armR={armR} horseMood={horseTime ? 'smug' : 'calm'} emperorLook={horseTime ? 1 : 0.2} headDip={horseTime ? interpolate(t, [W('His'), W('His') + 0.5], [0, -0.35], cl) : 0} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(30,12,4,.3) 100%)'}} />
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: titleO, transform: `scale(${titleS})`}}>
        <div style={{display: 'inline-block', fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: 10, color: '#fff', background: 'rgba(14,11,18,.55)', padding: '14px 30px', borderRadius: 14}}>ROME · 37 AD</div>
      </div>
      <Captions t={t} frame={frame} fps={fps} />
      <AbsoluteFill style={{background: '#fff', opacity: cam.cutAt > 0 ? flash : 0}} />
      <Audio src={staticFile('en_voice.wav')} />
      <Audio src={staticFile('en_music.wav')} />
    </AbsoluteFill>
  );
};
