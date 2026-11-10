import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Roman} from './hd';
import {Ball, Bratwurst, Croc, Founder, Goal, Grill, Kevin, Manni, OpaHorst, SvWorld, SV_BLUE, SV_YELLOW} from './series/svmatsch';
import timing from './timing_sv10.json';

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const L = (i: number) => timing.lines[i][0];
const LE = (i: number) => timing.lines[i][1];
export const SV10_DURATION = timing.duration + 1.0;
const FANS = 590;

type V3 = [number, number, number];
type Shot = {at: number; from: V3; to: V3; lookA: V3; lookB: V3; dur: number; fov: number};
const sh = (at: number, from: V3, to: V3, lookA: V3, lookB: V3, dur: number, fov: number): Shot => ({at, from, to, lookA, lookB, dur, fov});
const TRIB: V3 = [0, 1.6, -9.6];
const SHOTS: Shot[] = [
  sh(0, [0.6, 3.4, 6.5], [0.4, 3.6, 4.5], TRIB, TRIB, 4.0, 54),
  sh(L(1) - 0.1, [-1.0, 3.4, 9.6], [-1.4, 3.2, 8.8], [-2.6, 2.0, 1.6], [-2.6, 2.0, 1.6], 3.0, 50),
  sh(L(2) - 0.1, [-1.8, 3.0, 7.8], [-2.0, 3.0, 7.2], [-2.6, 2.2, 1.6], [-2.6, 2.3, 1.6], 1.4, 48),
  sh(L(3) - 0.1, [0, 4.4, 9.5], [0.8, 4.2, 9.0], [2.4, 1.2, -0.4], [3.2, 1.0, -1.0], 4.4, 50),
  sh(L(4) - 0.1, [0.8, 3.0, 3.0], [0.6, 3.3, 1.2], TRIB, TRIB, 6.4, 54),
  sh(L(6) - 0.1, [0, 3.4, 8.0], [0, 3.2, 7.2], [0, 1.8, 0.4], [0, 1.8, 0.4], 2.0, 50),
  sh(L(7) - 0.1, [3.4, 4.2, 4.4], [3.0, 4.0, 3.6], [0, 1.4, -2.2], [0, 1.4, -2.4], 2.0, 52),
  sh(L(8) - 0.1, [0.6, 2.5, -1.0], [0.4, 2.5, -1.6], [0, 2.3, -4.4], [0, 2.3, -4.4], 2.0, 46),
  sh(L(9) - 0.1, [-2.0, 3.4, 11.0], [2.0, 3.4, 11.0], [-1.0, 1.4, 1.5], [2.0, 1.4, 1.5], 3.6, 56),
  sh(L(11) - 0.1, [-1, 3.2, 8.5], [0, 3.1, 8.0], [1.0, 1.8, 1.0], [2.0, 1.8, 1.0], 4.0, 52),
  sh(L(13) - 0.1, [0, 3.2, 8.5], [0, 3.0, 7.6], [0, 1.9, 0.5], [0, 1.9, 0.5], 3.0, 50),
  sh(L(14) - 0.1, [-4.0, 2.8, 2.8], [-4.4, 2.7, 2.2], [-7.0, 1.6, -3.6], [-7.4, 1.6, -3.8], 3.4, 50),
  sh(L(15) - 0.1, [0, 3.6, 9.0], [0, 4.0, 10.0], [0, 1.8, -2], [0, 1.8, -2], 8.0, 54),
  sh(L(19) - 0.1, [0, 3.0, 4.0], [0, 3.4, 2.4], TRIB, TRIB, 4.0, 52),
];
function camAt(t: number) {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].at) i = k;
  const s = SHOTS[i];
  const p = ease(Math.min(1, (t - s.at) / s.dur));
  const lp = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  const pos = lp(s.from, s.to); pos[1] += Math.sin(t * 1.1 + 1) * 0.02;
  return {pos, look: lp(s.lookA, s.lookB), fov: s.fov, cutAt: s.at};
}
const Cam: React.FC<{pos: V3; look: V3; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos); (camera as THREE.PerspectiveCamera).fov = fov; camera.updateProjectionMatrix(); camera.lookAt(...look);
  return null;
};

const arc = (a: V3, b: V3, p: number, h: number): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p + 4 * h * p * (1 - p), a[2] + (b[2] - a[2]) * p];

const Scene: React.FC<{t: number}> = ({t}) => {
  const r = (a: number, d: number) => interpolate(t, [a, a + d], [0, 1], cl);
  const cheer = (t < L(1) || (t > L(2) && t < L(3)) || (t > L(4) && t < L(6)) || (t > L(13) && t < L(14)) || t > L(19)) ? 1 : 0.2;
  // the interested buyer walks off and falls into a puddle
  const wk = r(L(3) + 1.2, 2.4);
  const buyerFall = r(L(3) + 3.4, 0.4);
  const buyer: V3 = [1.4 + wk * 2.2, -buyerFall * 0.5, 0.4 - wk * 1.9];
  // penalty
  const shot = r(L(8) - 0.6, 0.7);
  const ballPos: V3 = t < L(8) - 0.6 ? [0, 0.22, -0.6] : arc([0, 0.22, -0.6], [0, 2.75, -4.3], shot, 0.6);
  const bounce = t > L(8) + 0.1 ? arc([0, 2.75, -4.3], [1.4, 0.22, -2.4], r(L(8) + 0.1, 0.8), 1.2) : null;
  // sprint
  const run = r(L(9) + 0.3, 3.2);
  const kevX = -4 + run * 8;
  const crocsOff = t > L(10) + 0.2 && t < L(13) - 0.1;
  const cf = r(L(10) + 0.2, 0.9);
  // bratwurst throw
  const th = r(L(11) + 0.9, 1.1);
  const caught = t > L(11) + 2.0;
  const eaten = t > L(12) + 1.4;
  const lineup = t >= L(13) - 0.1 && t < L(14) - 0.1;
  return (
    <>
      <SvWorld t={t} fans={FANS} cheer={cheer} />
      <Goal p={[0, 0, -4.9]} />
      <Grill p={[4.2, 0, -3.8]} t={t} />
      {/* main cast */}
      {t < L(7) - 0.1 || lineup || t >= L(14) - 0.1 ? (
        <Founder p={lineup ? [-2.2, 0, 0.6] : t >= L(14) - 0.1 && t < L(15) - 0.1 ? [-6.0, 0, -1.6] : [-2.6, 0, 1.6]} ry={t >= L(14) - 0.1 && t < L(15) - 0.1 ? -0.5 : lineup ? 0 : 0.35}
          mood={t >= L(14) - 0.1 && t < L(15) - 0.1 ? 'calm' : t >= L(2) - 0.1 && t < L(3) ? 'grin' : 'smug'} armR={t >= L(2) - 0.1 && t < L(3) + 0.5 ? 2.5 : t > L(19) ? 2.3 : 0.4} bob={t} />
      ) : null}
      {t >= L(3) - 0.1 && t < L(4) - 0.1 ? (
        <group position={buyer} rotation={[0, -0.6 + Math.PI * 0, -buyerFall * 1.4]}>
          <Roman p={[0, 0, 0]} ry={2.4} robe="#3a3f4f" trim="#b8272b" skin="#eab48e" hairStyle="caesar" hair="#2e2016" mood={buyerFall > 0.2 ? 'shock' : 'grumpy'} walk={wk > 0 && wk < 1 ? t * 1.8 : 0} bob={t} />
        </group>
      ) : null}
      <OpaHorst p={lineup ? [-0.7, 0, 0.9] : [0, 0, -4.3]} ry={0} mood={t > L(8) + 0.05 && t < L(9) ? 'shock' : lineup ? 'grin' : 'stern'} armR={t >= L(7) && t < L(9) ? 1.4 : 0.3} armL={t >= L(7) && t < L(9) ? 1.4 : 0.3} bob={t} />
      <Kevin p={lineup ? [0.8, 0, 0.9] : t >= L(9) - 0.1 && t < L(11) - 0.1 ? [kevX, 0, 1.5] : [-3.2, 0, -2.2]} ry={t >= L(9) - 0.1 && t < L(11) - 0.1 ? Math.PI / 2 : 0.4} walk={run > 0 && run < 1 && t < L(11) ? t * 2.6 : 0}
        mood={crocsOff ? 'shock' : 'grin'} crocsOff={crocsOff} bob={t} />
      <Manni p={lineup ? [2.3, 0, 0.6] : [4.6, 0, 0.8]} ry={lineup ? 0 : -0.5} mood={eaten ? 'grin' : 'calm'} armR={t > L(11) + 1.6 && t < L(13) ? 2.2 : 0.4} bob={t}
        handR={caught && !eaten ? <Bratwurst p={[0, -0.15, 0.05]} r={1.2} /> : undefined} />
      {/* trial fans (generic, no real people) */}
      {[[-1.5, '#e8343a', 'curly'], [-0.1, '#7a3fb5', 'caesar'], [1.3, '#2fa84f', 'curly']].map(([x, c, h], i) => {
        const stage = t >= L(6) - 0.1 && t < L(7) - 0.1;
        const kicker = i === 1 && t >= L(7) - 0.1 && t < L(9) - 0.1;
        const thrower = i === 0 && t >= L(11) - 0.1 && t < L(13) - 0.1;
        if (!stage && !kicker && !thrower && !lineup) return null;
        const p: V3 = lineup ? [3.8 + i * 1.1, 0, 0.2] : kicker ? [0.3, 0, 0.4] : thrower ? [-1.0, 0, 1.0] : [x as number, 0, 1.2];
        return <Roman key={i} p={p} ry={kicker ? Math.PI : thrower ? Math.PI / 2 : 0} s={0.9} robe={c as string} trim={c as string} skin={['#f3c9a4', '#d9a47c', '#e0b08a'][i]} hairStyle={h as any} hair={['#2e2016', '#6b4426', '#1a1a1a'][i]}
          mood={lineup ? 'grin' : 'grin'} armR={thrower ? (th > 0 ? 2.6 : 1.2) : lineup ? 2.4 : 0.4} bob={t + i} />;
      })}
      {t >= L(7) - 0.1 && t < L(9) ? <Ball p={bounce ?? ballPos} r={t * 6} /> : null}
      {t >= L(10) && t < L(11) - 0.1 ? (
        <>
          <Croc p={arc([kevX - 0.4, 0.1, 1.5], [kevX - 2.4, 0.1, 2.6], cf, 1.4)} r={cf * 9} />
          <Croc p={arc([kevX - 0.4, 0.1, 1.5], [kevX - 1.4, 0.1, 0.2], cf, 1.8)} r={cf * 7} />
        </>
      ) : null}
      {t >= L(11) + 0.9 && !caught ? <Bratwurst p={arc([-0.6, 2.2, 1.0], [4.6, 2.4, 0.9], th, 2.0)} r={th * 10} /> : null}
    </>
  );
};

const Captions: React.FC<{t: number; frame: number; fps: number}> = ({t, frame, fps}) => {
  const ws = timing.words;
  let i = ws.findIndex((w) => t >= w.start && t < w.end + 0.08);
  if (i < 0) { const nx = ws.findIndex((w) => t < w.start); i = nx > 0 ? nx - 1 : nx === 0 ? -1 : ws.length - 1; }
  if (i < 0) return null;
  const line = timing.lines[ws[i].line];
  if (t > line[1] + 0.25) return null;
  const short = (k: number) => ws[k].text.replace(/[^A-Za-zÄÖÜäöüß0-9]/g, '').length <= 3;
  let start = i;
  if (i > 0 && short(i - 1) && ws[i - 1].line === ws[i].line && !(i > 1 && short(i - 2) && ws[i - 2].line === ws[i].line)) start = i - 1;
  const chunk = [ws[start], ...(short(start) && start + 1 < ws.length && ws[start + 1].line === ws[start].line ? [ws[start + 1]] : [])];
  const s = spring({frame: frame - Math.round(ws[i].start * fps), fps, config: {damping: 13, stiffness: 220}});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1320, textAlign: 'center', transform: `scale(${0.82 + 0.18 * s})`}}>
      {chunk.map((w, k) => (
        <span key={k} style={{fontFamily: FONT, fontWeight: 900, fontSize: 104, textTransform: 'uppercase', letterSpacing: -1, color: w === ws[i] ? SV_YELLOW : '#fff', WebkitTextStroke: '16px #14161c', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(20,22,28,.55)', marginRight: 24}}>
          {w.text.replace(/[.,!?:]$/, '')}
        </span>
      ))}
    </div>
  );
};
const Chip: React.FC<{text: string; at: number; until: number; t: number; frame: number; fps: number; top: number; bg?: string; fg?: string; size?: number; rot?: number}> = ({text, at, until, t, frame, fps, top, bg = '#fff', fg = '#14161c', size = 54, rot = -2}) => {
  if (t < at || t > until + 0.3) return null;
  const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 11}});
  const o = interpolate(t, [until, until + 0.25], [1, 0], cl);
  return <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `scale(${s}) rotate(${rot}deg)`}}><span style={{display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: size, color: fg, background: bg, border: '7px solid #14161c', borderRadius: 26, padding: '14px 30px'}}>{text}</span></div>;
};

export const SvTag10: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const flash = interpolate(t - cam.cutAt, [0, 0.1], [0.28, 0], cl) * (cam.cutAt > 0 ? 1 : 0) + interpolate(t, [timing.duration + 0.8, timing.duration + 1.0], [0, 1], cl);
  const votes = [['🏠', 'TRIKOT-FLOHMARKT', 'IM VEREINSHEIM', 16], ['🌭', 'MANNI GRILLT', 'FÜR GELD', 17], ['👓', 'OPA HORSTS BRILLE', 'VERKAUFEN', 18]] as const;
  return (
    <AbsoluteFill style={{backgroundColor: '#0d1530'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true}} camera={{fov: 50, near: 0.1, far: 120}}>
        <Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
        <Scene t={t} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(5,8,20,.45) 100%)'}} />
      {/* series chip */}
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}><span style={{fontFamily: FONT, fontWeight: 900, fontSize: 40, color: SV_YELLOW, background: SV_BLUE, border: '6px solid #14161c', borderRadius: 999, padding: '10px 28px'}}>SV MATSCH 04 · TAG 10</span></div>
      <Chip text={`FANS: ${FANS}`} at={0.9} until={LE(0)} t={t} frame={frame} fps={fps} top={300} bg={SV_YELLOW} size={70} />
      <Chip text="💰 GELD   vs   ❤️ BEHALTEN" at={L(1) + 0.6} until={LE(1)} t={t} frame={frame} fps={fps} top={320} />
      <Chip text="✅ BEHALTEN!" at={L(2) + 0.6} until={LE(2) + 0.2} t={t} frame={frame} fps={fps} top={320} bg="#5BD47A" size={86} rot={-6} />
      <Chip text="NICHT VERKÄUFLICH 🙅" at={L(3) + 0.8} until={LE(3)} t={t} frame={frame} fps={fps} top={320} />
      <Chip text="„ICH WILL MITSPIELEN!“" at={L(4) + 0.4} until={LE(4)} t={t} frame={frame} fps={fps} top={300} size={46} />
      <Chip text="„NIMM MICH!“" at={L(4) + 1.2} until={LE(4)} t={t} frame={frame} fps={fps} top={420} size={46} rot={3} />
      <Chip text="📣 CAPO" at={L(5) + 0.4} until={LE(5)} t={t} frame={frame} fps={fps} top={300} />
      <Chip text="🍺 BIERBUDE" at={L(5) + 1.4} until={LE(5)} t={t} frame={frame} fps={fps} top={420} rot={2} />
      <Chip text="🔟 NUMMER 10" at={L(5) + 2.4} until={LE(5)} t={t} frame={frame} fps={fps} top={540} rot={-3} />
      <Chip text="PROBETRAINING FÜR FANS" at={L(6) + 0.3} until={LE(6)} t={t} frame={frame} fps={fps} top={320} bg={SV_YELLOW} />
      <Chip text="STATION 1: ELFMETER" at={L(7) + 0.2} until={LE(7)} t={t} frame={frame} fps={fps} top={320} />
      <Chip text="BOING! 😵" at={L(8) - 0.05} until={LE(8)} t={t} frame={frame} fps={fps} top={320} bg="#FF4B4B" fg="#fff" size={80} rot={-8} />
      <Chip text="STATION 2: MATSCH-SPRINT" at={L(9) + 0.2} until={LE(9)} t={t} frame={frame} fps={fps} top={320} />
      <Chip text="STATION 3: BRATWURST-WEITWURF" at={L(11) + 0.2} until={LE(12)} t={t} frame={frame} fps={fps} top={320} size={46} />
      <Chip text="✅ ALLE BESTANDEN" at={L(13) + 0.5} until={LE(13)} t={t} frame={frame} fps={fps} top={320} bg="#5BD47A" size={70} />
      <Chip text="VEREINSKASSE: LEER 🪫" at={L(14) + 1.4} until={LE(14)} t={t} frame={frame} fps={fps} top={320} bg="#FF4B4B" fg="#fff" />
      {t >= L(15) - 0.1 && t < L(19) + 0.2 ? votes.map(([e, a, b, li], k) => {
        const s = spring({frame: frame - Math.round((L(li) - 0.05) * fps), fps, config: {damping: 11}});
        if (t < L(li) - 0.05) return null;
        return (
          <div key={k} style={{position: 'absolute', left: 90, right: 90, top: 330 + k * 250, height: 210, transform: `scale(${s}) rotate(${(k - 1) * 1.5}deg)`, background: '#fff', border: '8px solid #14161c', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', fontFamily: FONT}}>
            <div style={{width: 96, height: 96, borderRadius: 48, background: SV_BLUE, color: SV_YELLOW, fontWeight: 900, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid #14161c'}}>{k + 1}</div>
            <div style={{fontSize: 74}}>{e}</div>
            <div><div style={{fontWeight: 900, fontSize: 50, color: '#14161c'}}>{a}</div><div style={{fontWeight: 800, fontSize: 34, color: '#5a6070'}}>{b}</div></div>
          </div>
        );
      }) : null}
      {t >= L(19) - 0.1 ? (
        <>
          <Chip text="💬 TOP-KOMMENTAR ENTSCHEIDET" at={L(19)} until={timing.duration + 1} t={t} frame={frame} fps={fps} top={330} bg={SV_YELLOW} size={50} />
          <Chip text="FOLGEN = PLATZ AUF DER TRIBÜNE 🏟️" at={L(19) + 1.6} until={timing.duration + 1} t={t} frame={frame} fps={fps} top={470} size={42} rot={2} />
        </>
      ) : null}
      {!(t >= L(15) - 0.1 && t < L(19)) ? <Captions t={t} frame={frame} fps={fps} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, flash)}} />
      <Audio src={staticFile('sv10_voice.wav')} />
      <Audio src={staticFile('sv10_music.wav')} />
    </AbsoluteFill>
  );
};
