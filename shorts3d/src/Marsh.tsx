import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {LabSet, LabState} from './Lab';
import timing from './timing_marsh.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
const W = (prefix: string, nth = 0) => timing.words.filter((w) => w.text.startsWith(prefix))[nth].start;
export const MARSH_DURATION = timing.duration + 1.2;

type V3 = [number, number, number];
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number};
const sh = (at: number, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov: number): Shot => ({at, from, to, lookA, lookB, dur, fov});
const KID: V3 = [0, 1.6, 0.2];

const SHOTS: Shot[] = [
  sh(0, [0.9, 3.0, 6.4], [0.5, 2.8, 5.4], [0, 1.5, 0.2], [0, 1.5, 0.2], 3.0, 48),
  sh(L(1) - 0.1, [2.2, 3.2, 7.2], [1.8, 3.0, 6.4], [0.8, 1.9, 0.0], [0.8, 1.9, 0.0], 2.0, 50),
  sh(L(2) - 0.1, [0, 3.6, 7.6], [0, 3.4, 7.0], [1.2, 2.0, -0.5], [1.8, 2.0, -1], 2.0, 52),
  sh(L(3) - 0.1, [-1.5, 5.0, 9.0], [1.0, 4.4, 8.4], [0, 1.8, -0.5], [0, 1.8, -0.5], 4.0, 50),
  sh(L(4) - 0.1, [0, 2.6, 5.4], [0, 2.4, 4.6], KID, [0, 1.6, 0.3], 3.4, 48),
  sh(L(5) - 0.1, [0.6, 3.6, 5.6], [0.4, 3.8, 6.0], [0.3, 3.2, -1.5], [0.3, 3.0, -1.0], 5.0, 50),
  sh(L(6) - 0.1, [-3.0, 2.8, 5.6], [-3.0, 2.6, 5.0], [-3.0, 1.5, 0.2], [-3.0, 1.5, 0.2], 2.2, 48),
  sh(L(7) - 0.1, [-1.0, 4.4, 12.0], [1.0, 4.2, 11.0], [0, 1.6, 0], [0, 1.6, 0], 3.6, 56),
  sh(L(8) - 0.1, [0, 2.4, 6.0], [0, 2.2, 4.4], KID, KID, 1.2, 48),
  sh(L(9) - 0.1, [0.6, 3.0, 6.8], [0.2, 2.8, 6.0], [0, 2.1, 0], [0, 2.1, 0], 3.4, 48),
  sh(L(11) - 0.1, [0, 2.4, 4.8], [0, 2.4, 4.2], [0, 2.4, 0], [0, 2.5, 0], 1.4, 46),
  sh(L(12) - 0.1, [0, 2.4, 3.6], [0, 2.4, 3.4], [0, 2.4, 0], [0, 2.4, 0], 0.6, 44),
  sh(L(13) - 0.1, [-2.5, 4.8, 9.5], [2.5, 4.8, 9.5], [0, 1.8, -0.5], [0, 1.8, -0.5], 8.0, 52),
  sh(L(15) - 0.1, [1.6, 3.2, 7.0], [1.2, 3.0, 6.2], [1.2, 1.7, -0.8], [1.2, 1.7, -0.8], 4.0, 50),
  sh(L(16) - 0.2, [0, 4.4, 8.5], [0, 5.0, 9.5], [0, 1.6, 0], [0, 1.6, 0], 4.0, 50),
];

function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to);
  pos[1] += Math.sin(t * 1.1 + 1) * 0.02;
  return {pos, look: lp(s.lookA, s.lookB), fov: s.fov, cutAt: s.at, idx: i};
}

function stateAt(t: number): LabState {
  const r = (a: number, d: number) => interpolate(t, [a, a + d], [0, 1], cl);
  const st: LabState = {
    t, kidMood: 'calm', kidLook: 0, kidArms: [0.2, 0.2], bite: 0, plateCount: 1,
    researcher: {p: [1.6, 0, 0.4], ry: -0.6, walk: 0, armR: 0.3, mood: 'grin', visible: true},
    booths: false, grown: 0, clock: 0, dim: 0, notes: false,
  };
  if (t < L(2) - 0.1) {
    st.kidMood = t < L(1) ? 'shock' : 'grin';
    st.researcher.armR = t < L(1) ? 1.3 : 1.9;
    st.plateCount = t >= W('two') - 0.1 && t < LE(1) + 0.3 ? 2 : 1;
  } else if (t < L(6) - 0.1) {
    const w = r(L(2), 1.6);
    st.researcher.p = [1.6 + w * 1.9, 0, 0.4 - w * 3.0];
    st.researcher.ry = -0.6 + w * (Math.PI - 0.0);
    st.researcher.walk = w < 1 ? t * 1.6 : 0;
    st.researcher.visible = w < 0.98;
    st.kidMood = 'grumpy';
    st.kidLook = 0;
    st.clock = (t - L(2)) * 1.9;
  } else if (t < L(8) - 0.1) {
    st.booths = true; st.researcher.visible = false; st.clock = 10 + (t - L(6)); st.notes = t >= W('sang') - 0.2;
  } else if (t < L(9) - 0.1) {
    st.researcher.visible = false; st.kidMood = 'shock'; st.clock = 15;
  } else if (t < L(12) - 0.1) {
    st.researcher.visible = false; st.grown = 1; st.plateCount = 2;
  } else if (t < L(15) - 0.1) {
    st.researcher.visible = false; st.grown = t < L(13) - 0.1 ? 1 : 0; st.dim = t < L(13) - 0.1 ? 0.35 : 0.2; st.kidMood = 'calm';
  } else if (t < L(16) - 0.2) {
    st.researcher = {p: [3.6, 0, -2.2], ry: -0.2, walk: 0, armR: 0.25, mood: 'grin', visible: true};
    st.kidMood = 'grumpy'; st.kidLook = 1; st.bite = r(W('eat') - 0.3, 0.8); st.kidArms = [1.3, 0.2];
  } else {
    st.researcher.visible = false; st.kidMood = 'grin'; st.plateCount = 2;
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


const Bars: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => {
  const a = spring({frame: frame - Math.round((L(13) + 0.3) * fps), fps, config: {damping: 14}});
  const b = interpolate(t, [W('weaker') - 0.4, W('weaker') + 0.3], [0, 1], cl);
  return (
    <div style={{position: 'absolute', top: 300, left: 90, right: 90, background: 'rgba(255,255,255,.95)', borderRadius: 30, padding: '30px 40px', transform: `scale(${a})`, fontFamily: FONT, color: '#1f1a24'}}>
      <div style={{fontWeight: 900, fontSize: 44, marginBottom: 20}}>WAITING ↔ TEST SCORES</div>
      {[['ORIGINAL STUDIES', 0.9 * a, '#4fb0e8'], ['2018 STUDY', 0.22 * b + 0.001, '#ff7a59']].map(([l, w, c]) => (
        <div key={l as string} style={{marginBottom: 18}}>
          <div style={{fontWeight: 800, fontSize: 30, color: '#5a5566'}}>{l}</div>
          <div style={{height: 44, width: `${(w as number) * 100}%`, background: c as string, borderRadius: 10, marginTop: 6}} />
        </div>
      ))}
    </div>
  );
};

export const Marsh: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const st = stateAt(t);
  const flash = interpolate(t - cam.cutAt, [0, 0.12], [0.16, 0], cl);
  const darken = interpolate(t, [L(12) - 0.15, L(12) + 0.05, LE(12) + 0.3, LE(12) + 0.6], [0, 0.35, 0.35, 0], cl);
  const endO = interpolate(t, [L(16) + 0.2, L(16) + 0.6], [0, 1], cl);
  const cardS = (k: number) => spring({frame: frame - Math.round((W('Eat') + k * 0.5) * fps), fps, config: {damping: 11}});
  const aplus = spring({frame: frame - Math.round((W('better') - 0.2) * fps), fps, config: {damping: 10}});
  const chips = [['🏠', 'HOME LIFE'], ['💰', 'MONEY'], ['🤝', 'SUPPORT']];
  return (
    <AbsoluteFill style={{backgroundColor: '#f3e7d3'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true}} camera={{fov: 50, near: 0.1, far: 120}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <LabSet {...st} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#000', opacity: darken}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(40,25,10,.25) 100%)'}} />
      <Pill text="1 NOW   ·   2 IF YOU WAIT" at={W('two') - 0.2} until={LE(1) + 0.2} t={t} frame={frame} fps={fps} />
      <Pill text="STANFORD · LATE 1960s" at={W('Stanford') - 0.1} until={LE(3)} t={t} frame={frame} fps={fps} />
      <Pill text="AGE 4–5" at={W('four') - 0.1} until={LE(5)} t={t} frame={frame} fps={fps} />
      <Pill text="UP TO 15 MIN ⏱" at={W('fifteen') - 0.1} until={LE(5)} t={t} frame={frame} fps={fps} top={420} />
      <Pill text="YEARS LATER…" at={L(9)} until={LE(9)} t={t} frame={frame} fps={fps} />
      {t > W('better') - 0.2 && t < LE(10) + 0.3 ? (
        <div style={{position: 'absolute', top: 300, right: 90, transform: `scale(${aplus}) rotate(6deg)`, background: '#fff', border: '8px solid #1f1a24', borderRadius: 20, padding: '20px 40px', fontFamily: FONT, fontWeight: 900, fontSize: 110, color: '#2fa84f'}}>A+</div>
      ) : null}
      {t > L(11) && t < LE(11) + 0.3 ? <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontSize: 120}}>💪✨</div> : null}
      {t > L(13) && t < LE(13) + 0.3 ? <Bars t={t} frame={frame} fps={fps} /> : null}
      {t > L(14) && t < LE(14) + 0.3 ? chips.map(([e, txt], k) => {
        const s = spring({frame: frame - Math.round((L(14) + 0.3 + k * 0.35) * fps), fps, config: {damping: 11}});
        return <div key={txt} style={{position: 'absolute', top: 320 + k * 150, left: 150, right: 150, transform: `scale(${s})`, background: '#fff', border: '6px solid #1f1a24', borderRadius: 999, padding: '18px 30px', textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#1f1a24'}}>{e} {txt}</div>;
      }) : null}
      {endO > 0 ? (
        <AbsoluteFill style={{background: `rgba(20,16,30,${0.55 * endO})`}}>
          <div style={{position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: '#fff', opacity: endO}}>EAT IT NOW<br /><span style={{fontSize: 60, color: '#ffd6b0'}}>or</span><br />WAIT?</div>
          {[['😋', 'EAT IT NOW', '#ff7a59'], ['⏳', 'WAIT FOR TWO', '#4fb0e8']].map(([e, txt, col], k) => (
            <div key={txt} style={{position: 'absolute', left: 110, right: 110, top: 760 + k * 190, height: 150, borderRadius: 30, background: '#fff', border: `8px solid ${col}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', transform: `scale(${cardS(k)})`, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: '#0e0b12'}}>
              <span style={{fontSize: 76}}>{e}</span>{txt}
            </div>
          ))}
          <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `scale(${cardS(2)})`}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', background: '#e8343a', padding: '20px 44px', borderRadius: 999}}>💬 COMMENT</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {!(t > L(13) && t < LE(14) + 0.3) ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: cam.cutAt > 0 ? flash : 0}} />
      <Audio src={staticFile('marsh_voice.wav')} />
      <Audio src={staticFile('marsh_music.wav')} />
    </AbsoluteFill>
  );
};
