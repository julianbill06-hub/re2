import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {FeastSet, FeastState} from './Feast';
import timing from './timing_flowers.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
const W = (prefix: string, nth = 0) => timing.words.filter((w) => w.text.startsWith(prefix))[nth].start;
const WX = (word: string) => timing.words.filter((w) => w.text.replace(/[^A-Za-z0-9]/g, '') === word)[0].start;
export const FLOWERS_DURATION = timing.duration + 1.8;

type V3 = [number, number, number];
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number};
const sh = (at: number, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov: number): Shot => ({at, from, to, lookA, lookB, dur, fov});
const EMP: V3 = [6.6, 3.4, 0.2];

const SHOTS: Shot[] = [
  sh(0, [0, 4.6, 11.5], [0, 4.0, 9.5], [0, 1.9, -0.5], [0, 1.9, -0.5], 4.0, 50),
  sh(L(1) - 0.1, [0, 2.4, 9.5], [0, 2.2, 8.8], [0, 5.6, -0.3], [0, 5.8, -0.3], 1.4, 58),
  sh(L(2) - 0.1, [3, 4.2, 10], [2, 4.6, 11], [0, 2.6, 0], [0, 2.4, 0], 1.6, 52),
  sh(L(3) - 0.1, [0, 6, 11], [0, 8, 14.5], [0, 1.8, 0], [0, 1.6, 0], 3.0, 52),
  sh(L(4) - 0.2, [-1, 2.9, 5.6], [-1.2, 2.8, 5.0], [-1, 2.4, -1.3], [-1, 2.4, -1.3], 1.6, 48),
  sh(L(5) - 0.1, [3.4, 3.3, 5.4], [3.9, 3.2, 4.6], EMP, [6.6, 3.5, 0.2], 4.0, 46),
  sh(L(6) - 0.1, [4.4, 3.2, 3.9], [4.6, 3.2, 3.5], EMP, [6.6, 3.6, 0.2], 2.4, 44),
  sh(L(7) - 0.1, [-2.5, 5, 11], [2.5, 5, 11], [0, 1.8, 0], [0, 1.8, 0], 2.0, 52),
  sh(L(8) - 0.1, [-3.4, 2.6, 6.4], [-3.8, 2.4, 5.8], [-6.4, 1.3, 1.6], [-6.4, 1.2, 1.6], 3.6, 46),
  sh(L(9) - 0.1, [1.5, 2.4, 9.5], [1.0, 2.2, 8.6], [0, 5.6, 0], [0, 5.8, 0], 3.8, 58),
  sh(L(10) - 0.1, [2.4, 3.6, 8.5], [2.0, 3.8, 7.8], [-1.2, 6.0, 0], [-1.2, 5.6, 0], 2.6, 52),
  sh(L(11) - 0.1, [0, 5.5, 11], [0, 6.2, 13], [0, 1.4, 0], [0, 1.4, 0], 2.6, 52),
  sh(L(12) - 0.15, [4.4, 3.2, 3.8], [4.6, 3.3, 3.4], EMP, [6.6, 3.6, 0.2], 1.6, 44),
  sh(L(13) - 0.1, [-3, 4.5, 10], [3, 4.5, 10], [0, 1.8, 0], [0, 1.8, 0], 4.0, 52),
  sh(L(14) - 0.1, [3.6, 3.3, 5.2], [4.0, 3.2, 4.6], EMP, [6.6, 3.5, 0.2], 3.0, 46),
  sh(L(15) - 0.1, [-1, 3.8, 8.0], [1, 3.5, 7.0], [7.0, 2.4, -0.6], [7.2, 2.6, -0.4], 3.2, 50),
  sh(L(16) - 0.2, [0, 6, 13], [0, 7.5, 15], [0, 1.8, 0], [0, 1.6, 0], 5.0, 52),
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

function stateAt(t: number): FeastState {
  const ramp = (a: number, d: number) => interpolate(t, [a, a + d], [0, 1], cl);
  const st: FeastState = {t, ceilingOpen: 0, rain: -1, heap: 0, guestMood: 'grin', emperorMood: 'smug', cushion: 0, guards: -1, dim: 0};
  if (t >= L(1) - 0.1 && t < L(5) - 0.2) {
    st.ceilingOpen = ramp(L(1) + 0.3, 0.8);
    st.rain = t >= L(2) - 0.1 ? t - (L(2) - 0.1) : -1;
    st.heap = 0.75 * ramp(L(3), LE(4) - L(3));
    st.guestMood = t >= L(4) - 0.2 ? 'shock' : 'grin';
    st.emperorMood = 'grin';
  }
  if (t >= L(8) - 0.2 && t < L(9) - 0.2) st.cushion = ramp(W('flat') - 0.2, 0.35);
  if (t >= L(9) - 0.2 && t < L(15) - 0.2) {
    st.ceilingOpen = ramp(L(9) + 1.0, 1.0);
    st.rain = t >= L(10) - 0.2 ? t - (L(10) - 0.2) : -1;
    st.heap = 0.95 * ramp(L(10) + 0.4, LE(11) - L(10));
    st.guestMood = t >= L(10) ? 'shock' : 'grin';
    st.emperorMood = t >= L(12) - 0.2 ? 'calm' : 'grin';
    st.dim = t >= L(11) - 0.1 ? 0.45 : 0;
  }
  if (t >= L(15) - 0.2 && t < L(16) - 0.2) {
    st.guards = ramp(L(15), 2.6);
    st.emperorMood = 'shock';
    st.guestMood = 'shock';
    st.dim = 0.3;
  }
  if (t >= L(16) - 0.2) {
    st.ceilingOpen = 1; st.rain = t - (L(16) - 0.2); st.heap = 0.35 * ramp(L(16), 3); st.guestMood = 'calm'; st.emperorMood = 'smug';
  }
  return st;
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


export const Flowers: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const st = stateAt(t);
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [0.18, 0], cl);
  const darken = interpolate(t, [L(12) - 0.2, L(12) + 0.2, LE(12) + 0.2, LE(12) + 0.5], [0, 0.3, 0.3, 0], cl);
  const endO = interpolate(t, [L(16) + 0.2, L(16) + 0.6], [0, 1], cl);
  const cardS = (k: number) => spring({frame: frame - Math.round((W('True') + k * 0.5) * fps), fps, config: {damping: 11}});
  const haS = spring({frame: frame - Math.round((L(13) + 0.3) * fps), fps, config: {damping: 12}});
  const haO = interpolate(t, [LE(13) + 0.1, LE(13) + 0.4], [1, 0], cl);
  return (
    <AbsoluteFill style={{backgroundColor: '#2a160e'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true}} camera={{fov: 50, near: 0.1, far: 200}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <FeastSet {...st} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#000', opacity: darken}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(30,10,4,.35) 100%)'}} />
      <Pill text="ROME · ~220 AD" at={L(5) + 0.4} until={LE(5)} t={t} frame={frame} fps={fps} />
      <Pill text="EMPEROR AT 14" at={W('fourteen') - 0.1} until={LE(6)} t={t} frame={frame} fps={fps} />
      <Pill text="218 – 222 AD" at={WX('four') - 0.1} until={LE(14)} t={t} frame={frame} fps={fps} />
      {t > L(13) + 0.3 && t < LE(13) + 0.45 ? (
        <div style={{position: 'absolute', top: 360, left: 90, right: 90, opacity: haO, transform: `scale(${haS})`, background: '#f6ecd2', border: '10px solid #6b4626', borderRadius: 30, padding: '34px 30px', textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 90}}>📜</div>
          <div style={{fontWeight: 900, fontSize: 64, color: '#3a2216'}}>HISTORIA AUGUSTA</div>
          <div style={{fontWeight: 800, fontSize: 40, color: '#b8272b', marginTop: 10, transform: 'rotate(-3deg)'}}>KNOWN TO EXAGGERATE</div>
        </div>
      ) : null}
      {endO > 0 ? (
        <AbsoluteFill style={{background: `rgba(20,8,24,${0.55 * endO})`}}>
          <div style={{position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: '#fff', opacity: endO}}>TRUE STORY<br /><span style={{fontSize: 60, color: '#d6b4f0'}}>or</span><br />LEGEND?</div>
          {[['✅', 'TRUE STORY', '#4fe07a'], ['🧙', 'LEGEND', '#c18ae8']].map(([e, txt, col], k) => (
            <div key={txt} style={{position: 'absolute', left: 110, right: 110, top: 760 + k * 190, height: 150, borderRadius: 30, background: '#fff', border: `8px solid ${col}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', transform: `scale(${cardS(k)})`, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#0e0b12'}}>
              <span style={{fontSize: 76}}>{e}</span>{txt}
            </div>
          ))}
          <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `scale(${cardS(2)})`}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', background: '#e8343a', padding: '20px 44px', borderRadius: 999}}>💬 COMMENT</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {!(t > L(13) + 0.3 && t < LE(13) + 0.45) ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: cam.cutAt > 0 ? flash : 0}} />
      <Audio src={staticFile('flowers_voice.wav')} />
      <Audio src={staticFile('flowers_music.wav')} />
    </AbsoluteFill>
  );
};
