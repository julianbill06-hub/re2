// "Flight 404" — 60 s story in the dark night-liminal style (original story + characters).
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Cam} from './NightGate';
import timing from './timing_f404_de.json';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
export const F404DE_DURATION = timing.duration + 3.0;

import {NightWorld, World} from './NightStory';

// ---------- story timeline ----------
type Shot = {at: number; from: V3; to: V3; la: V3; lb: V3; dur: number; fov: number; follow?: boolean};
const S = (at: number, from: V3, to: V3, la: V3, lb: V3, dur: number, fov: number, follow = false): Shot => ({at, from, to, la, lb, dur, fov, follow});
const TRAV_SEAT: V3 = [-1.28, 0, 0.8];
const SHOTS: Shot[] = [
  S(0, [-0.2, 1.7, 4.4], [-0.35, 1.6, 3.7], [-1.25, 1.0, 0.75], [-1.25, 1.0, 0.75], 2.4, 44),
  S(L(1) - 0.1, [-0.2, 2.6, 8.6], [-0.2, 2.9, 9.6], [0.5, 1.2, -2.6], [0.5, 1.2, -2.6], 2.0, 52),
  S(L(2) - 0.15, [0.3, 2.9, 1.6], [0.5, 3.0, 0.8], [1.65, 3.4, -5.2], [1.65, 3.4, -5.2], 2.6, 50),
  S(L(3) - 0.1, [0.9, 3.2, -0.6], [1.05, 3.25, -1.2], [1.7, 3.35, -5.2], [1.7, 3.3, -5.2], 1.6, 46),
  S(L(4) - 0.15, [2.6, 3.4, 4.6], [2.4, 3.7, 4.0], [1.6, 5.2, 1.9], [1.6, 5.25, 1.9], 3.2, 46),
  S(L(5) - 0.15, [0.4, 1.7, 2.0], [0.9, 1.6, -0.6], [1.5, 1.5, -5.3], [1.5, 1.6, -5.3], 2.4, 44),
  S(L(6) - 0.1, [-0.2, 2.8, 9.0], [-0.2, 3.0, 9.6], [0.4, 1.2, -2.6], [0.4, 1.2, -2.6], 2.0, 52),
  S(L(7) - 0.1, [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], 1, 50, true),
  S(L(8) - 0.1, [2.2, 2.6, -3.3], [2.1, 2.5, -3.55], [1.42, 1.12, -4.15], [1.42, 1.12, -4.2], 2.4, 44),
  S(L(9) - 0.1, [1.2, 2.0, -3.4], [1.0, 2.1, -3.0], [-0.6, 1.4, 4.0], [-0.6, 1.4, 4.0], 2.6, 54),
  S(L(10) - 0.1, [-0.2, 1.8, -2.4], [-0.9, 1.7, -3.4], [-2.6, 1.4, -6.5], [-2.6, 1.4, -6.5], 3.0, 48),
  S(L(12) - 0.1, [-0.6, 1.7, 3.4], [-0.75, 1.6, 3.0], [-1.25, 1.0, 0.75], [-1.25, 1.0, 0.75], 1.4, 44),
  S(L(13) - 0.1, [-0.9, 2.3, 5.6], [-1.0, 2.2, 5.2], [-0.4, 1.2, -2.5], [-0.4, 1.2, -2.5], 6.0, 50),
  S(L(15) - 0.1, [-0.6, 1.5, 2.9], [-0.7, 1.45, 2.6], [-1.25, 1.0, 0.75], [-1.25, 1.0, 0.75], 2.0, 40),
  S(L(16) - 0.1, [-0.2, 2.6, 8.6], [-0.2, 2.8, 9.2], [0.4, 1.2, -2.6], [0.4, 1.2, -2.6], 3.4, 52),
  S(L(17) - 0.1, [1.2, 3.3, -2.0], [1.3, 3.4, -2.6], [1.65, 3.6, -5.2], [1.65, 3.6, -5.2], 2.6, 44),
  S(L(18) - 0.1, [0.4, 1.9, 4.4], [0.3, 1.85, 4.0], [-0.8, 1.0, 0.8], [-0.8, 1.0, 0.8], 2.0, 52),
  S(L(19) - 0.1, [-0.2, 2.8, 9.0], [-0.2, 3.2, 10.0], [0.4, 1.2, -2.6], [0.4, 1.2, -2.6], 5.0, 52),
];

const WALK_PTS: V3[] = [TRAV_SEAT, [-1.28, 0, 1.6], [2.1, 0, 1.6], [2.1, 0, -2.2], [0.8, 0, -3.0]];
function walkPos(u: number): {p: V3; ry: number} {
  const segs = WALK_PTS.length - 1; const x = Math.min(segs - 0.0001, Math.max(0, u * segs)); const i = Math.floor(x); const f = x - i;
  const a = WALK_PTS[i], b = WALK_PTS[i + 1];
  return {p: [a[0] + (b[0] - a[0]) * f, 0, a[2] + (b[2] - a[2]) * f], ry: Math.atan2(b[0] - a[0], b[2] - a[2])};
}

function stateAt(t: number): {w: World; cam: {pos: V3; look: V3; fov: number; cutAt: number}} {
  const r = (a: number, d: number) => interpolate(t, [a, a + d], [0, 1], cl);
  const w: World = {
    t, morning: false, lightsOn: 0, flickerBlack: false,
    attendant: {p: [1.5, 0, -5.3], ry: -0.2, glow: 0.7 + 0.3 * Math.sin(t * 2), visible: true},
    traveler: {p: TRAV_SEAT, ry: 0.45, sit: true, walk: 0, mood: t < 1.2 ? 'calm' : 'stern', look: t > 1.2 ? Math.sin((t - 1.2) * 1.6) * 0.9 : 0, holdPass: false},
    passOnDesk: 0, doorOpen: 0, crowd: false,
  };
  // path A: walk to the desk
  if (t >= L(7) - 0.1 && t < L(11) - 0.1) {
    const u = r(L(7) - 0.1, LE(7) - L(7) + 1.2);
    const wp = walkPos(u);
    w.traveler = {p: wp.p, ry: u < 1 ? wp.ry : Math.PI, sit: false, walk: u < 1 ? t * 2.2 : 0, mood: 'stern', look: 0, holdPass: t > LE(8) - 0.3};
    w.passOnDesk = t < LE(8) - 0.3 ? r(L(8) + 0.2, 0.8) : 0;
    w.lightsOn = Math.floor(interpolate(t, [L(9) + 0.2, LE(9) + 0.4], [0, 6.99], cl));
    w.doorOpen = r(L(10) + 0.2, 1.4);
    w.attendant.glow = t > L(10) ? 1.5 : w.attendant.glow;
    if (t >= L(10) - 0.1) w.traveler.ry = Math.PI + 0.6;
  }
  // path B: stay seated, flickers bring him closer
  if (t >= L(12) - 0.1 && t < L(16) - 0.1) {
    const step = t < L(13) + 1.4 ? 0 : t < L(14) + 0.3 ? 1 : 2;
    const pts: V3[] = [[1.5, 0, -5.3], [2.1, 0, -2.6], [2.1, 0, -0.6]];
    w.attendant.p = pts[step]; w.attendant.ry = step ? -Math.PI / 2 - 0.3 : -0.2; w.attendant.glow = 1.1;
    w.flickerBlack = (t > L(13) + 1.1 && t < L(13) + 1.45) || (t > L(14) + 0.05 && t < L(14) + 0.35);
    w.traveler.mood = t > L(15) - 0.1 ? 'calm' : 'shock'; w.traveler.look = 0.7;
  }
  // morning
  if (t >= L(16) - 0.1 && t < L(19) - 0.1) {
    w.morning = true; w.crowd = true; w.attendant.visible = false;
    w.traveler.mood = t > L(18) ? 'shock' : 'stern'; w.traveler.look = 0.4;
    w.traveler.holdPass = t > L(18) + 0.3;
  }
  // camera
  let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i]; const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  let pos = lp(s.from, s.to), look = lp(s.la, s.lb);
  if (s.follow) { const tp = w.traveler.p; pos = [tp[0] + 1.8, 3.0, tp[2] + 4.6]; look = [tp[0] - 0.2, 1.1, tp[2] - 2.5]; }
  pos[0] += Math.sin(t * 0.9) * 0.01; pos[1] += Math.sin(t * 1.3 + 1) * 0.008;
  return {w, cam: {pos, look, fov: s.fov, cutAt: s.at}};
}

const Caption: React.FC<{t: number}> = ({t}) => {
  const ws = timing.words;
  let i = ws.findIndex((w) => t >= w.start && t < w.end + 0.1);
  if (i < 0) { const nx = ws.findIndex((w) => t < w.start); i = nx > 0 ? nx - 1 : nx === 0 ? -1 : ws.length - 1; }
  if (i < 0) return null;
  const ln = timing.lines[ws[i].line];
  if (t > ln[1] + 0.3) return null;
  const short = (k: number) => ws[k].text.replace(/[^A-Za-zÄÖÜäöüß0-9]/g, '').length <= 3;
  let start = i;
  if (i > 0 && short(i - 1) && ws[i - 1].line === ws[i].line && !(i > 1 && short(i - 2) && ws[i - 2].line === ws[i].line)) start = i - 1;
  const chunk = [ws[start], ...(short(start) && start + 1 < ws.length && ws[start + 1].line === ws[start].line ? [ws[start + 1]] : [])];
  return <div style={{position: 'absolute', top: 1060, left: 40, right: 40, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 66, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', textShadow: '0 4px 18px rgba(0,0,0,.9)'}}>{chunk.map((w) => w.text).join(' ')}</div>;
};

const Chips: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => {
  if (t < L(6) - 0.1) return null;
  const active = t >= L(7) - 0.1 && t < L(11) - 0.1 ? 'walk' : t >= L(12) - 0.1 && t < L(19) - 0.1 ? 'stay' : 'both';
  const big = t >= L(19) - 0.1;
  const s = spring({frame: frame - Math.round((L(6) + 0.3) * fps), fps, config: {damping: 14}});
  const items = [['#e8343a', 'STAY SEATED', 'stay'], ['#2fbf71', 'WALK TO THE DESK', 'walk']].filter(([, , k]) => active === 'both' || active === k);
  return (
    <div style={{position: 'absolute', top: big ? 820 : 120, left: 0, right: 0, display: 'flex', flexDirection: big ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: big ? 24 : 18, transform: `scale(${s})`}}>
      {items.map(([c, txt]) => (
        <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: big ? 44 : 26, color: '#14161c', background: '#fff', borderRadius: 999, padding: big ? '14px 32px 14px 20px' : '8px 18px 8px 12px', display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{width: big ? 32 : 22, height: big ? 32 : 22, borderRadius: 16, background: c}} />{txt}
        </span>
      ))}
    </div>
  );
};

export const Flight404DE: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const {w, cam} = stateAt(t);
  const fadeIn = interpolate(t, [0, 0.6], [1, 0], cl);
  const ce1 = LE(15) + 0.25, ce2 = Math.max(ce1 + 0.05, L(16) - 0.15);
  const closeEyes = interpolate(t, [LE(15) - 0.2, ce1, ce2, ce2 + 0.3], [0, 1, 1, 0], cl);
  const doorBlack = interpolate(t, [LE(10) + 0.3, LE(10) + 0.8], [0, 1], cl) * (t < L(11) + 0.1 ? 1 : 0);
  const rewind = t >= L(11) - 0.1 && t < L(12) - 0.1;
  const endBlack = interpolate(t, [L(19) - 0.3, L(19)], [0, 0.55], cl);
  return (
    <AbsoluteFill style={{backgroundColor: '#050608'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: w.morning ? 1.15 : 1.65}} camera={{fov: 44, near: 0.05, far: 140}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <NightWorld {...w} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 48%, rgba(0,0,0,${w.morning ? 0.35 : 0.7}) 100%)`}} />
      {rewind ? (
        <AbsoluteFill style={{background: 'rgba(10,10,14,.55)'}}>
          <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 2px, transparent 2px 6px)', transform: `translateY(${(t * 400) % 6}px)`}} />
          <div style={{position: 'absolute', top: 160, left: 70, fontFamily: FONT, fontWeight: 900, fontSize: 90, color: '#fff'}}>◀◀</div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, closeEyes, doorBlack, endBlack)}} />
      <Chips t={t} frame={frame} fps={fps} />
      {t >= L(19) - 0.1 ? <div style={{position: 'absolute', top: 640, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 70, lineHeight: 1.1, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.9)'}}>WHAT WOULD<br />YOU DO?</div> : null}
      {t < L(19) - 0.1 ? <Caption t={t} /> : null}
      <Audio src={staticFile('f404_el.mp3')} />
      <Audio src={staticFile('f404de_music.wav')} volume={0.85} />
    </AbsoluteFill>
  );
};
