import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Scene3D} from './Scene3D';
import timing from './timing.json';
import {buildCurve, loopRange} from './track';

const ENTRY = (() => { const out: number[] = []; for (const m of [0, 1]) { const [a, b] = loopRange(buildCurve(m)); out.push(0.08 / (b - a + 0.16)); } return out; })();

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

const Captions: React.FC<{t: number}> = ({t}) => {
  const words = timing.words.filter((w) => {
    const ln = timing.lines[w.line];
    return t >= ln[0] - 0.1 && t <= ln[1] + 0.35;
  });
  // show max 3 words around the active one, TikTok style
  const active = words.findIndex((w) => t >= w.start && t < w.end + 0.05);
  const idx = active < 0 ? words.findIndex((w) => t < w.start) : active;
  if (!words.length) return null;
  const startIdx = Math.max(0, Math.floor((idx < 0 ? words.length - 1 : idx) / 3) * 3);
  const chunk = words.slice(startIdx, startIdx + 3);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1500, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 22px'}}>
      {chunk.map((w, i) => {
        const on = t >= w.start;
        const cur = t >= w.start && t < w.end + 0.05;
        const s = interpolate(t, [w.start, w.start + 0.12], [0.85, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <span key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.15, textTransform: 'uppercase', color: cur ? '#ffcf3a' : '#ffffff', opacity: on ? 1 : 0.35, transform: `scale(${on ? s : 0.85})`, WebkitTextStroke: '10px #120f2b', paintOrder: 'stroke fill', textShadow: '0 8px 24px rgba(0,0,0,.45)'}}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

const GMeter: React.FC<{t: number}> = ({t}) => {
  const [, l1, l2] = timing.lines;
  const show = interpolate(t, [l1[0] + 0.2, l1[0] + 0.6, l2[1] + 0.2, l2[1] + 0.5], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (show <= 0) return null;
  // g value: circle peaks at 6 g when the cart enters the loop, teardrop peaks much lower
  const bell = (x: number, c: number, w: number) => Math.exp(-((x - c) ** 2) / (2 * w * w));
  const e1 = l1[0] + 0.3 + (l1[1] + 0.2 - (l1[0] + 0.3)) * ENTRY[0];
  const e2 = l2[0] + 1.3 + (l2[1] + 0.5 - (l2[0] + 1.3)) * ENTRY[1];
  const g1 = 1 + 5 * bell(t, e1 + 0.1, 0.3);
  const g2 = 1 + 2.6 * bell(t, e2 + 0.1, 0.35);
  const g = t < l2[0] ? g1 : g2;
  const pct = (g - 1) / 5;
  const col = g > 4.5 ? '#ff4b4b' : g > 3 ? '#ffb340' : '#4fe07a';
  return (
    <div style={{position: 'absolute', right: 60, top: 260, width: 280, whiteSpace: 'nowrap', opacity: show, fontFamily: FONT}}>
      <div style={{background: 'rgba(18,15,43,.82)', border: '3px solid #3b3480', borderRadius: 26, padding: '22px 22px 18px'}}>
        <div style={{color: '#b9b2ff', fontWeight: 800, fontSize: 26, letterSpacing: 2}}>G-KRAFT</div>
        <div style={{color: col, fontWeight: 900, fontSize: 76, fontVariantNumeric: 'tabular-nums'}}>{g.toFixed(1)} g</div>
        <div style={{height: 22, borderRadius: 11, background: '#2a2460', overflow: 'hidden'}}>
          <div style={{width: `${Math.max(4, pct * 100)}%`, height: '100%', background: col}} />
        </div>
      </div>
    </div>
  );
};

export const Looping: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const [l0, l1, l2] = timing.lines;
  const pk = l1[0] + 0.3 + (l1[1] - l1[0] - 0.1) * ENTRY[0] + 0.1;
  const flash = interpolate(t, [pk - 0.05, pk + 0.05, pk + 0.4], [0, 0.18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const title = spring({frame: frame - Math.round(l0[0] * fps), fps, config: {damping: 14}});
  const titleOut = interpolate(t, [l0[1] + 0.1, l0[1] + 0.4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tag = (txt: string, at: number, top: number, left: number, col: string) => {
    const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 12}});
    const out = interpolate(t, [l2[1] + 0.2, l2[1] + 0.5], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <div style={{position: 'absolute', top, left, transform: `scale(${s})`, opacity: out, fontFamily: FONT, fontWeight: 900, fontSize: 48, color: '#120f2b', background: col, padding: '14px 26px', borderRadius: 999}}>{txt}</div>;
  };
  return (
    <AbsoluteFill style={{backgroundColor: '#120f2b'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, near: 0.1, far: 200}} gl={{antialias: true}}>
        <Scene3D />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,6,20,.55) 100%)'}} />
      <div style={{position: 'absolute', top: 250, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 104, lineHeight: 1.02, color: '#fff', transform: `scale(${title})`, opacity: titleOut, WebkitTextStroke: '12px #120f2b', paintOrder: 'stroke fill'}}>
        WARUM IST DAS<br /><span style={{color: '#ffcf3a'}}>NICHT RUND?</span>
      </div>
      {t > l2[0] ? tag('UNTEN WEIT', l2[0] + 1.9, 980, 120, '#4fe07a') : null}
      {t > l2[0] ? tag('OBEN ENG', l2[0] + 2.6, 300, 90, '#ffcf3a') : null}
      <GMeter t={t} />
      <Captions t={t} />
      <AbsoluteFill style={{background: '#ff3b3b', opacity: flash, mixBlendMode: 'screen'}} />
      <Audio src={staticFile('voice.wav')} />
      <Audio src={staticFile('music.wav')} volume={0.9} />
    </AbsoluteFill>
  );
};
