// Final Call Stories – Folge 2 „Platform Zero“: Nachtzug-Set + detaillierte Figuren (HD-Version).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {GEO, Head, M, T, INK, Mood} from './hd';
import {Cam, Halo} from './NightGate';

type V3 = [number, number, number];
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------- helpers ----------------
const UP = new THREE.Vector3(0, 1, 0);
/** capsule from a to b (radius r) – for posable, detailed limbs */
export const Bone: React.FC<{a: V3; b: V3; r: number; color: string; o?: number; glossy?: boolean}> = ({a, b, r, color, o = 0.012, glossy}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va); const len = Math.max(0.001, d.length());
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
  const mid = va.add(vb).multiplyScalar(0.5);
  return (
    <group position={mid} quaternion={q}>
      {glossy ? <M geo={GEO.cap} color={color} s={[r * 2, len / 2, r * 2]} o={o} /> : <T geo={GEO.cap} color={color} s={[r * 2, len / 2, r * 2]} o={o} />}
    </group>
  );
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** glossy, outlined mesh (helmet-like heads, shoes) */
const Gloss: React.FC<{geo: THREE.BufferGeometry; color: string; p?: V3; r?: V3; s?: V3 | number; o?: number; rough?: number}> = ({geo, color, p, r, s = 1, o = 0.02, rough = 0.22}) => {
  const sc: V3 = typeof s === 'number' ? [s, s, s] : s;
  return (
    <group position={p} rotation={r} scale={sc}>
      <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial color={color} roughness={rough} metalness={0.25} /></mesh>
      {o ? <mesh geometry={geo} scale={1 + o * 2}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh> : null}
    </group>
  );
};

/** hand with palm, 4 fingers and thumb (fingers curl with `curl`) */
const Hand: React.FC<{at: V3; dir: V3; color: string; side: number; curl?: number}> = ({at, dir, color, side, curl = 0.5}) => {
  const d = new THREE.Vector3(...dir).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  return (
    <group position={at} quaternion={q}>
      <T geo={GEO.sphere} color={color} p={[0, -0.045, 0]} s={[0.05, 0.058, 0.03]} o={0.008} />
      {[-0.03, -0.01, 0.01, 0.03].map((x, i) => {
        const l = i === 0 || i === 3 ? 0.042 : 0.05;
        const b: V3 = [x, -0.095, 0], e: V3 = [x * 1.1, -0.095 - l * (1 - curl * 0.5), l * curl * 0.8];
        return <Bone key={i} a={b} b={e} r={0.0115} color={color} o={0.006} />;
      })}
      <Bone a={[side * 0.04, -0.035, 0.01]} b={[side * 0.07, -0.075, 0.03]} r={0.013} color={color} o={0.006} />
    </group>
  );
};

// ---------------- textures ----------------
function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}
const moquette = () => tex(256, 256, (g) => {
  g.fillStyle = '#4e1820'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) {
    const o = (y / 32) % 2 ? 16 : 0;
    g.fillStyle = '#6b2430'; g.beginPath(); g.moveTo(x + o + 16, y + 4); g.lineTo(x + o + 28, y + 16); g.lineTo(x + o + 16, y + 28); g.lineTo(x + o + 4, y + 16); g.closePath(); g.fill();
    g.fillStyle = 'rgba(201,162,74,.55)'; g.fillRect(x + o + 14, y + 14, 4, 4);
  }
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${rnd(i) * 0.18})`; g.fillRect(rnd(i + 3) * 256, rnd(i + 7) * 256, 1.5, 1.5); }
}, [2, 2]);
const floorT = () => tex(512, 512, (g) => {
  g.fillStyle = '#202226'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) { const v = 40 + rnd(i) * 50; g.fillStyle = `rgba(${v},${v},${v + 6},.5)`; g.fillRect(rnd(i + 1) * 512, rnd(i + 2) * 512, 2, 2); }
  g.fillStyle = '#2a2832'; g.fillRect(176, 0, 160, 512);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(176, 0); g.lineTo(176, 512); g.moveTo(336, 0); g.lineTo(336, 512); g.stroke();
}, [1, 6]);
const concreteT = () => tex(512, 512, (g) => {
  g.fillStyle = '#3a3936'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) { const v = 45 + rnd(i) * 40; g.fillStyle = `rgba(${v},${v},${v - 4},.45)`; g.fillRect(rnd(i + 5) * 512, rnd(i + 9) * 512, 3, 3); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
  for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
}, [3, 12]);
const ledCache = new Map<string, THREE.Texture>();
const ledT = (main = 'PLATFORM 0', sub = 'LAST STOP · ALL PASSENGERS EXIT') => { const k = main + '|' + sub; const hit = ledCache.get(k); if (hit) return hit; const tx = tex(1024, 192, (g) => {
  g.fillStyle = '#050505'; g.fillRect(0, 0, 1024, 192);
  g.fillStyle = '#ff9a2a'; g.font = '800 104px "IBM Plex Mono", monospace'; g.textBaseline = 'middle';
  if (main.length <= 2) { g.font = '900 170px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.fillText(main, 512, 100); g.textAlign = 'left'; } else g.fillText(main, 40, 70);
  if (sub) { g.font = '700 46px "IBM Plex Mono", monospace'; g.fillStyle = '#ffb347'; g.fillText(sub, 44, 152); }
  g.fillStyle = '#050505';
  for (let x = 0; x < 1024; x += 8) g.fillRect(x, 0, 2, 192);
  for (let y = 0; y < 192; y += 8) g.fillRect(0, y, 1024, 2);
}); ledCache.set(k, tx); return tx; };
const signT = () => tex(1024, 512, (g) => {
  g.fillStyle = '#0f2a4a'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#e9eef5'; g.beginPath(); g.arc(256, 256, 170, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0f2a4a'; g.font = '900 250px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0', 256, 270);
  g.fillStyle = '#e9eef5'; g.textAlign = 'left'; g.font = '800 110px Inter, Arial'; g.fillText('PLATFORM', 470, 220);
  g.font = '600 64px Inter, Arial'; g.globalAlpha = 0.7; g.fillText('NO EXIT', 474, 340);
});

// ---------------- characters ----------------
const HAIR = ['#2e2016', '#3d2a1c', '#24180f'];
const curls = (() => {
  const pts: {p: V3; s: number; c: string}[] = [];
  const N = 140;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.39996;
    const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
    if (y < -0.05) continue;
    if (z > 0.3 && y < 0.62) continue; // keep the face free
    if (Math.abs(x) > 0.86 && y < 0.25) continue; // keep ears free
    pts.push({p: [x * 0.8, y * 0.74 + 0.08, z * 0.78 - 0.03], s: 0.14 + rnd(i) * 0.08, c: HAIR[i % 3]});
  }
  return pts;
})();

export type Pal = {skin: string; parka: string; dark: string; fur: string; jeans: string; jeansD: string; shoe: string; sole: string; scarf: string; hair: string[]};
export const PAL_HERO: Pal = {skin: '#f2c4a0', parka: '#1f8a8a', dark: '#14605f', fur: '#d8c8aa', jeans: '#2b3a5c', jeansD: '#1f2a44', shoe: '#8a2b2b', sole: '#f1efe9', scarf: '#d9a33a', hair: HAIR};

/** Protagonist „Du“ – detailed: curly hair, parka with hood/fur/zipper/pockets, scarf, jeans, sneakers, real hands.
 *  walk = gait phase (cycles), run 0..1, headRy/headRoll turn & tilt the head, pocket 0..1 puts the right hand in the pocket. */
export const TravelerHD: React.FC<{p: V3; ry?: number; mood?: Mood; look?: number; sit?: boolean; breathe?: number; walk?: number; run?: number; headRy?: number; headRoll?: number; pocket?: number; pal?: Partial<Pal>; hairStyle?: 'curly' | 'caesar' | 'bald'; scarf?: boolean; s?: number}> = ({p, ry = 0, mood = 'calm', look = 0, sit = true, breathe = 0, walk = 0, run = 0, headRy = 0, headRoll = 0, pocket = 0, pal = {}, hairStyle = 'curly', scarf = true, s: scale = 1}) => {
  const C = {...PAL_HERO, ...pal};
  const moving = !sit && (walk !== 0 || run > 0);
  const ph = walk * Math.PI * 2, amp = moving ? 0.38 + run * 0.35 : 0;
  const bob = moving ? Math.abs(Math.sin(ph)) * 0.03 * (1 + run) : 0;
  const hipY = (sit ? 0.5 : 0.86) + bob, sh = hipY + 0.52 + Math.sin(breathe * Math.PI * 2) * 0.006, headY = sh + 0.36;
  const lean = run * 0.22;
  const leg = (s: number) => {
    if (sit) return {hip: [s * 0.1, hipY, 0] as V3, knee: [s * 0.12, hipY + 0.03, 0.42] as V3, ank: [s * 0.13, 0.11, 0.47] as V3};
    const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)) * amp;
    const back = Math.max(0, -Math.cos(ph + (s > 0 ? 0 : Math.PI))) * (moving ? 0.9 + run * 0.6 : 0);
    const hip: V3 = [s * 0.1, hipY, 0];
    const knee: V3 = [s * 0.1, hipY - 0.39 * Math.cos(sw), 0.39 * Math.sin(sw)];
    const b = sw - back;
    const ank: V3 = [s * 0.1, Math.max(0.1, knee[1] - 0.38 * Math.cos(b)), knee[2] + 0.38 * Math.sin(b)];
    return {hip, knee, ank};
  };
  const arm = (s: number) => {
    if (sit) return {sh: [s * 0.215, sh - 0.04, 0] as V3, el: [s * 0.28, hipY + 0.24, 0.1] as V3, wr: [s * 0.19, hipY + 0.1, 0.33] as V3};
    const c = -Math.sin(ph + (s > 0 ? 0 : Math.PI)) * amp * 0.9;
    const shp: V3 = [s * 0.215, sh - 0.04, 0];
    const el: V3 = [s * 0.25, sh - 0.04 - 0.3 * Math.cos(c), 0.3 * Math.sin(c)];
    const fa = c + 0.25 + run * 1.1;
    let wr: V3 = [s * 0.24, el[1] - 0.28 * Math.cos(fa), el[2] + 0.28 * Math.sin(fa)];
    let elb = el;
    if (s > 0 && pocket > 0) {
      wr = lerp3(wr, [0.12, hipY + 0.2, 0.17], pocket);
      elb = lerp3(el, [0.27, hipY + 0.36, 0.0], pocket);
    }
    return {sh: shp, el: elb, wr};
  };
  const upper = (
    <>
      {/* hips + parka */}
      <T geo={GEO.rbox} color={C.jeans} p={[0, hipY + 0.02, 0.01]} s={[0.3, 0.14, 0.26]} o={0.01} />
      <T geo={GEO.cyl} color={C.parka} p={[0, hipY + 0.14, 0]} s={[0.215, 0.2, 0.17]} o={0.014} />
      <T geo={GEO.cap} color={C.parka} p={[0, (hipY + sh) / 2 + 0.04, 0]} s={[0.42, 0.25, 0.3]} o={0.016} />
      <T geo={GEO.torus} color={C.dark} p={[0, hipY + 0.05, 0]} r={[Math.PI / 2, 0, 0]} s={[0.215, 0.17, 0.35]} o={0.008} />
      {[0.2, 0.32, 0.44].map((k) => <T key={k} geo={GEO.torus} color={C.dark} p={[0, hipY + k, 0]} r={[Math.PI / 2, 0, 0]} s={[0.205, 0.15, 0.12]} o={0} />)}
      <M geo={GEO.box} color="#1b2020" p={[0, (hipY + sh) / 2 + 0.03, 0.152]} s={[0.014, sh - hipY - 0.02, 0.01]} o={0} />
      <M geo={GEO.box} color="#c9a24a" p={[0.0, sh - 0.12, 0.162]} s={[0.022, 0.04, 0.008]} o={0} />
      {[-1, 1].map((s) => (
        <group key={'p' + s} position={[s * 0.11, hipY + 0.17, 0.14]} rotation={[0.1, s * 0.25, 0]}>
          <T geo={GEO.rbox} color={C.dark} s={[0.12, 0.11, 0.025]} o={0.006} />
          <T geo={GEO.rbox} color={C.parka} p={[0, 0.055, 0.012]} s={[0.13, 0.035, 0.02]} o={0.006} />
          <M geo={GEO.sphere} color="#c9a24a" p={[0, 0.05, 0.026]} s={0.009} o={0} />
        </group>
      ))}
      <T geo={GEO.cyl} color="#e9e2cf" p={[-0.1, sh - 0.12, 0.13]} r={[Math.PI / 2 - 0.2, 0, 0]} s={[0.032, 0.01, 0.032]} o={0.005} />
      <T geo={GEO.cyl} color={C.parka} p={[-0.092, sh - 0.115, 0.138]} r={[Math.PI / 2 - 0.2, 0, 0]} s={[0.026, 0.01, 0.026]} o={0} />
      {[-1, 1].map((s) => <T key={'s' + s} geo={GEO.sphere} color={C.parka} p={[s * 0.2, sh - 0.05, 0]} s={[0.1, 0.09, 0.1]} o={0.012} />)}
      <T geo={GEO.torus} color={C.parka} p={[0, sh + 0.04, -0.09]} r={[Math.PI / 2 + 0.5, 0, 0]} s={[0.17, 0.15, 0.9]} o={0.012} />
      {Array.from({length: 20}).map((_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return <T key={'f' + i} geo={GEO.sphere} color={i % 2 ? '#b8a888' : '#a39272'} p={[Math.cos(a) * 0.19, sh + 0.06 + Math.sin(a) * 0.06, -0.12 + Math.sin(a) * 0.1]} s={0.045} o={0} />;
      })}
      {scarf ? (
        <>
          <T geo={GEO.torus} color={C.scarf} p={[0, sh + 0.02, 0]} r={[Math.PI / 2, 0, 0]} s={[0.12, 0.12, 0.7]} o={0.01} />
          <T geo={GEO.rbox} color={C.scarf} p={[0.06, sh - 0.12, 0.13]} r={[0.15, 0, -0.12]} s={[0.07, 0.2, 0.03]} o={0.008} />
        </>
      ) : null}
      {[-1, 1].map((s) => {
        const A = arm(s);
        const wd: V3 = [A.wr[0] - A.el[0], A.wr[1] - A.el[1], A.wr[2] - A.el[2]];
        return (
          <group key={'a' + s}>
            <Bone a={A.sh} b={A.el} r={0.06} color={C.parka} />
            <T geo={GEO.sphere} color={C.parka} p={A.el} s={0.06} o={0} />
            <Bone a={A.el} b={lerp3(A.el, A.wr, 0.92)} r={0.055} color={C.parka} />
            {!(s > 0 && pocket > 0.8) ? <Hand at={A.wr} dir={wd} color={C.skin} side={-s} curl={moving ? 0.8 : 0.6} /> : null}
          </group>
        );
      })}
      <T geo={GEO.cyl} color={C.skin} p={[0, sh + 0.06, 0]} s={[0.055, 0.12, 0.055]} o={0.008} />
      <group position={[0, headY, 0.01]} rotation={[0, headRy, headRoll]} scale={0.31}>
        <Head skin={C.skin} mood={mood} look={look} hairStyle={hairStyle === 'curly' ? 'none' : hairStyle} hair={C.hair[0]} />
        {hairStyle === 'curly' ? curls.map((c, i) => <T key={i} geo={GEO.sphere} color={C.hair[i % C.hair.length]} p={c.p} s={c.s} o={0.018} />) : null}
        {hairStyle === 'curly' ? Array.from({length: 7}).map((_, i) => {
          const a = -0.7 + i * 0.23;
          return <T key={'fr' + i} geo={GEO.sphere} color={C.hair[i % 2]} p={[Math.sin(a) * 0.62, 0.55 - Math.abs(a) * 0.1, Math.cos(a) * 0.52]} s={[0.15, 0.12, 0.13]} o={0.016} />;
        }) : null}
      </group>
    </>
  );
  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {[-1, 1].map((s) => {
        const L = leg(s);
        return (
          <group key={'l' + s}>
            <Bone a={L.hip} b={L.knee} r={0.07} color={C.jeans} />
            <T geo={GEO.sphere} color={C.jeans} p={L.knee} s={0.07} o={0} />
            <Bone a={L.knee} b={L.ank} r={0.06} color={C.jeans} />
            <Bone a={add(L.knee, [s * 0.058, 0, 0])} b={add(L.ank, [s * 0.052, 0.04, 0])} r={0.006} color="#c9a24a" o={0} />
            <T geo={GEO.cyl} color={C.jeansD} p={add(L.ank, [0, 0.03, 0])} s={[0.066, 0.05, 0.066]} o={0.008} />
            <group position={add(L.ank, [0, -0.06, 0.06])}>
              <T geo={GEO.rbox} color={C.sole} p={[0, -0.02, 0.02]} s={[0.12, 0.045, 0.27]} o={0.01} />
              <T geo={GEO.rbox} color={C.shoe} p={[0, 0.035, 0]} s={[0.11, 0.08, 0.22]} o={0.01} />
              <T geo={GEO.sphere} color={C.sole} p={[0, 0.0, 0.12]} s={[0.058, 0.04, 0.05]} o={0.008} />
              {[0, 1, 2].map((k) => <M key={k} geo={GEO.box} color="#f4f1ea" p={[0, 0.078, 0.02 + k * 0.035]} s={[0.07, 0.008, 0.012]} o={0} />)}
            </group>
          </group>
        );
      })}
      <group position={[0, hipY, 0]} rotation={[lean, 0, 0]}><group position={[0, -hipY, 0]}>{upper}</group></group>
    </group>
  );
};

const coatGeo = new THREE.CylinderGeometry(0.19, 0.27, 1, 36);
const capGeo = new THREE.CylinderGeometry(0.215, 0.185, 1, 36);
const headGeo = new THREE.SphereGeometry(1, 48, 36);

/** Gegenspieler Folge 2: der Conductor – faceless, glossy head, ONE red light dot, long coat with brass buttons */
export const Conductor: React.FC<{p: V3; ry?: number; glow?: number; point?: number; s?: number; sit?: boolean}> = ({p, ry = 0, glow = 1, point = 1, s = 1, sit = false}) => {
  const C = {coat: '#1a1e29', coatD: '#11141c', red: '#7a1f2a', gold: '#c9a24a', glove: '#e7e3da', head: '#2b2e35', trou: '#151821'};
  const hip = 0.94, sh = 1.5;
  const pointArm = {sh: [0.22, sh - 0.04, 0] as V3, el: lerp3([0.27, sh - 0.32, 0.03], [0.48, sh - 0.06, -0.06], point), wr: lerp3([0.26, sh - 0.6, 0.06], [0.76, sh - 0.04, -0.22], point)};
  const restArm = {sh: [-0.22, sh - 0.04, 0] as V3, el: [-0.27, sh - 0.33, -0.02] as V3, wr: [-0.24, sh - 0.6, 0.07] as V3};
  const red = new THREE.Color('#ff2a2a').multiplyScalar(1.5 + glow * 2.5);
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {sit ? [-1, 1].map((k) => (
        <group key={k}>
          <Bone a={[k * 0.1, 0.5, 0]} b={[k * 0.11, 0.52, 0.45]} r={0.065} color={C.trou} />
          <Bone a={[k * 0.11, 0.52, 0.45]} b={[k * 0.12, 0.1, 0.5]} r={0.06} color={C.trou} />
          <Gloss geo={GEO.rbox} color="#0c0d10" p={[k * 0.12, 0.045, 0.56]} s={[0.12, 0.08, 0.28]} o={0.012} rough={0.12} />
        </group>
      )) : null}
      {/* legs: trousers with red piping, glossy shoes */}
      {!sit ? [-1, 1].map((k) => (
        <group key={k}>
          <Bone a={[k * 0.1, hip, 0]} b={[k * 0.1, 0.5, 0.02]} r={0.065} color={C.trou} />
          <Bone a={[k * 0.1, 0.5, 0.02]} b={[k * 0.1, 0.11, 0]} r={0.06} color={C.trou} />
          <Bone a={[k * 0.163, 0.86, 0]} b={[k * 0.158, 0.13, 0.01]} r={0.007} color={C.red} o={0} />
          <Gloss geo={GEO.rbox} color="#0c0d10" p={[k * 0.1, 0.045, 0.06]} s={[0.12, 0.08, 0.28]} o={0.012} rough={0.12} />
        </group>
      )) : null}
      <group position={[0, sit ? -0.44 : 0, 0]}>
      {/* long coat */}
      <T geo={coatGeo} color={C.coat} p={[0, 1.0, 0]} s={[1, 1.04, 0.8]} o={0.018} />
      <T geo={GEO.torus} color={C.coatD} p={[0, 0.49, 0]} r={[Math.PI / 2, 0, 0]} s={[0.268, 0.215, 0.12]} o={0} />
      <M geo={GEO.box} color={C.coatD} p={[0.0, 0.7, 0.21]} s={[0.012, 0.42, 0.012]} o={0} />
      {/* belt + buckle */}
      <T geo={GEO.cyl} color="#0d0e11" p={[0, 1.02, 0]} s={[0.215, 0.05, 0.175]} o={0.008} />
      <M geo={GEO.box} color={C.gold} p={[0, 1.02, 0.176]} s={[0.06, 0.045, 0.012]} o={0.004} />
      {/* lapels */}
      {[-1, 1].map((k) => <T key={'lp' + k} geo={GEO.box} color={C.coatD} p={[k * 0.06, sh - 0.14, 0.15]} r={[0.1, 0, k * 0.35]} s={[0.07, 0.2, 0.012]} o={0.005} />)}
      {/* double row of brass buttons */}
      {[-1, 1].map((k) => [0, 1, 2, 3].map((j) => <M key={k + '-' + j} geo={GEO.sphere} color={C.gold} p={[k * 0.065, sh - 0.22 - j * 0.11, 0.165 + j * 0.006]} s={0.016} o={0.004} />))}
      {/* name plate (blank) + whistle chain */}
      <M geo={GEO.box} color={C.gold} p={[-0.11, sh - 0.12, 0.155]} s={[0.07, 0.018, 0.006]} o={0.003} />
      <Bone a={[0.1, sh - 0.12, 0.16]} b={[0.14, sh - 0.24, 0.165]} r={0.003} color={C.gold} o={0} glossy />
      {/* stand-up collar + shoulders + epaulettes */}
      <T geo={GEO.cyl} color={C.coatD} p={[0, sh + 0.03, 0]} s={[0.1, 0.09, 0.1]} o={0.008} />
      <T geo={GEO.box} color={C.red} p={[0.07, sh + 0.03, 0.07]} r={[0, 0.8, 0]} s={[0.03, 0.05, 0.004]} o={0} />
      {[-1, 1].map((k) => (
        <group key={'ep' + k}>
          <T geo={GEO.sphere} color={C.coat} p={[k * 0.205, sh - 0.04, 0]} s={[0.1, 0.085, 0.1]} o={0.012} />
          <T geo={GEO.rbox} color={C.coatD} p={[k * 0.17, sh + 0.035, 0]} s={[0.13, 0.022, 0.09]} o={0.006} />
          {Array.from({length: 6}).map((_, j) => <M key={j} geo={GEO.sphere} color={C.gold} p={[k * 0.235, sh + 0.015, -0.04 + j * 0.016]} s={0.008} o={0} />)}
        </group>
      ))}
      {/* arms: coat sleeves, gold cuff stripe, white gloves */}
      {[pointArm, restArm].map((A, i) => {
        const wd: V3 = [A.wr[0] - A.el[0], A.wr[1] - A.el[1], A.wr[2] - A.el[2]];
        const cuff = lerp3(A.el, A.wr, 0.86);
        return (
          <group key={'arm' + i}>
            <Bone a={A.sh} b={A.el} r={0.06} color={C.coat} />
            <T geo={GEO.sphere} color={C.coat} p={A.el} s={0.06} o={0} />
            <Bone a={A.el} b={lerp3(A.el, A.wr, 0.9)} r={0.056} color={C.coat} />
            <T geo={GEO.sphere} color={C.gold} p={cuff} s={[0.062, 0.062, 0.062]} o={0} />
            <Hand at={A.wr} dir={i === 0 && point > 0.5 ? [wd[0], wd[1], wd[2]] : wd} color={C.glove} side={i === 0 ? -1 : 1} curl={i === 0 ? 0.05 + (1 - point) * 0.5 : 0.75} />
          </group>
        );
      })}
      {/* ticket punch in the resting hand */}
      <group position={add(restArm.wr, [0, -0.11, 0.04])} rotation={[0.3, 0, 0.2]}>
        <M geo={GEO.box} color="#9aa0aa" s={[0.025, 0.12, 0.03]} o={0.004} />
        <M geo={GEO.box} color="#9aa0aa" p={[0, 0.05, 0.03]} s={[0.025, 0.02, 0.05]} o={0.004} />
      </group>
      {/* faceless glossy head with ONE red light dot */}
      <Gloss geo={GEO.cyl} color={C.head} p={[0, sh + 0.12, 0]} s={[0.06, 0.12, 0.06]} o={0.01} />
      <Gloss geo={headGeo} color={C.head} p={[0, sh + 0.33, 0]} s={[0.17, 0.215, 0.185]} o={0.012} rough={0.18} />
      <mesh position={[0, sh + 0.35, 0.183]} scale={[0.022, 0.022, 0.01]}><sphereGeometry args={[1, 20, 14]} /><meshBasicMaterial color={red} toneMapped={false} /></mesh>
      <Halo p={[0, sh + 0.35, 0.215]} s={0.1 + glow * 0.06} color="#ff3030" o={0.95} />
      <Halo p={[0, sh + 0.35, 0.26]} s={0.32 + glow * 0.2} color="#ff2020" o={0.3} />
      <pointLight position={[0, sh + 0.1, 0.7]} color="#ff2a2a" intensity={1.1 * glow} distance={2.6} decay={1.6} />
      {/* cold rim light from behind so the silhouette reads */}
      <pointLight position={[0.3, 2.1, -0.9]} color="#9fc8ff" intensity={2.6} distance={2.4} decay={1.4} />
      {/* peaked cap: crown, red band, glossy visor, badge */}
      <T geo={capGeo} color={C.coat} p={[0, sh + 0.565, -0.01]} r={[-0.06, 0, 0]} s={[0.98, 0.11, 1]} o={0.012} />
      <T geo={GEO.cyl} color={C.red} p={[0, sh + 0.515, -0.005]} r={[-0.06, 0, 0]} s={[0.192, 0.035, 0.196]} o={0} />
      <Gloss geo={GEO.cyl} color="#08090b" p={[0, sh + 0.49, 0.14]} r={[0.28, 0, 0]} s={[0.15, 0.012, 0.11]} o={0.006} rough={0.08} />
      <M geo={GEO.cyl} color={C.gold} p={[0, sh + 0.565, 0.205]} r={[Math.PI / 2 - 0.06, 0, 0]} s={[0.032, 0.01, 0.032]} o={0.004} />
      {[-1, 1].map((k) => <M key={'w' + k} geo={GEO.box} color={C.gold} p={[k * 0.05, sh + 0.567, 0.2]} r={[0, k * 0.4, k * 0.2]} s={[0.05, 0.012, 0.004]} o={0} />)}
      </group>
    </group>
  );
};

// ---------------- set: night train carriage ----------------
const ROWS = [1.0, -0.1, -1.2, -2.3, -3.4, -4.5];
const DOOR: [number, number] = [-7.3, -6.0];

const DoubleSeat: React.FC<{p: V3; side: number; fab: THREE.Texture}> = ({p, side, fab}) => (
  <group position={p}>
    {/* plinth + chrome leg on the aisle */}
    <T geo={GEO.rbox} color="#17191d" p={[side * 0.08, 0.17, -0.02]} s={[0.78, 0.3, 0.4]} o={0.008} />
    <M geo={GEO.box} color="#aab0ba" p={[-side * 0.46, 0.2, 0.05]} s={[0.04, 0.4, 0.04]} o={0} />
    {[-0.25, 0.25].map((x) => (
      <group key={x}>
        <T geo={GEO.rbox} color="#ffffff" map={fab} p={[x, 0.42, 0.03]} s={[0.47, 0.13, 0.52]} o={0.01} />
        <T geo={GEO.rbox} color="#ffffff" map={fab} p={[x, 0.9, -0.24]} r={[-0.12, 0, 0]} s={[0.47, 0.8, 0.14]} o={0.01} />
        <T geo={GEO.rbox} color="#9d978a" p={[x, 1.2, -0.185]} r={[-0.12, 0, 0]} s={[0.34, 0.16, 0.025]} o={0.005} />
        {/* seat-back details: tray + pocket on the rear */}
        <T geo={GEO.rbox} color="#22252b" p={[x, 0.95, -0.33]} r={[-0.12, 0, 0]} s={[0.36, 0.22, 0.02]} o={0.004} />
        <T geo={GEO.rbox} color="#2c1418" p={[x, 0.66, -0.31]} r={[-0.12, 0, 0]} s={[0.38, 0.18, 0.025]} o={0.004} />
      </group>
    ))}
    {/* armrest on the aisle + grab handle */}
    <T geo={GEO.rbox} color="#22252b" p={[-side * 0.5, 0.62, 0.02]} s={[0.06, 0.06, 0.44]} o={0.006} />
    <M geo={GEO.torus} color="#c9ced6" p={[-side * 0.44, 1.32, -0.25]} r={[0, Math.PI / 2, 0]} s={[0.07, 0.07, 0.3]} o={0} />
  </group>
);

export type TrainProps = {t: number; flicker?: number; lightsOn?: number; led?: string; ledSub?: string; doorOpen?: number; outsideZ?: number; outsideOn?: number; platFlicker?: number; dark?: number};
export const TrainSet: React.FC<TrainProps> = ({t, flicker = 0, lightsOn = 12, led: ledMain = 'PLATFORM 0', ledSub = 'LAST STOP · ALL PASSENGERS EXIT', doorOpen = 1, outsideZ = 0, outsideOn = 1, platFlicker = 1, dark = 0}) => {
  const fab = useMemo(moquette, []);
  const floor = useMemo(floorT, []);
  const conc = useMemo(concreteT, []);
  const led = ledT(ledMain, ledSub);
  const pl = outsideOn * platFlicker;
  const dz = (DOOR[0] + DOOR[1]) / 2;
  const sign = useMemo(signT, []);
  const dust = useMemo(() => Array.from({length: 90}).map((_, i) => [rnd(i), rnd(i + 11), rnd(i + 23), rnd(i + 37)]), []);
  const zs = Array.from({length: 14}).map((_, i) => 6 - i * 1.1);
  const inDoor = (z: number) => z > DOOR[0] - 0.2 && z < DOOR[1] + 0.2;
  return (
    <>
      <color attach="background" args={['#040507']} />
      <fog attach="fog" args={['#05060a', 7, 24]} />
      <ambientLight intensity={0.22 * (1 - dark * 0.85)} />
      <hemisphereLight args={['#3a4a60', '#120c08', 0.4 * (1 - dark * 0.8)]} />
      {/* floor, aisle, ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow><planeGeometry args={[3, 15]} /><meshStandardMaterial map={floor} roughness={0.3} metalness={0.25} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.46, -1]}><planeGeometry args={[1.7, 15]} /><meshStandardMaterial color="#3e4541" roughness={0.85} /></mesh>
      {[-1, 1].map((s) => <mesh key={'cs' + s} position={[s * 1.18, 2.33, -1]} rotation={[0, 0, s * 0.33]}><boxGeometry args={[0.72, 0.03, 15]} /><meshStandardMaterial color="#353b38" roughness={0.9} /></mesh>)}
      {/* ceiling light diffusers (one dead, one flickering) */}
      {zs.slice(0, 12).map((z, i) => {
        const dead = i === 7, fl = i === 4 ? 1 - flicker : 1;
        const on = i >= lightsOn ? 0 : dead ? 0.04 : fl;
        return (
          <group key={'cl' + i} position={[0, 2.43, z - 0.3]}>
            <mesh scale={[0.32, 0.03, 0.85]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={new THREE.Color('#e4fff3').multiplyScalar(0.12 + 0.55 * on)} toneMapped={false} /></mesh>
            {on > 0.5 ? <Halo p={[0, -0.05, 0]} s={1.1} color="#d6ffef" o={0.12} /> : null}
            {i % 3 === 0 ? <pointLight position={[0, -0.25, 0]} color="#d8f2e8" intensity={2.6 * on} distance={4.8} decay={1.5} /> : null}
          </group>
        );
      })}
      {/* walls */}
      {[-1, 1].map((s) => (
        <group key={'w' + s}>
          {/* lower panel + heater grille */}
          {zs.map((z, i) => (s === 1 && inDoor(z - 0.55)) ? null : (
            <group key={i}>
              <T geo={GEO.box} color="#2d3633" p={[s * 1.5, 0.45, z - 0.55]} s={[0.06, 0.9, 1.1]} o={0} />
              <M geo={GEO.box} color="#3c4441" p={[s * 1.46, 0.16, z - 0.55]} s={[0.02, 0.12, 0.95]} o={0} />
              <T geo={GEO.box} color="#3a4440" p={[s * 1.5, 2.05, z - 0.55]} s={[0.06, 0.5, 1.1]} o={0} />
              {/* pier between windows */}
              <T geo={GEO.box} color="#343e3a" p={[s * 1.49, 1.33, z]} s={[0.08, 0.86, 0.26]} o={0.006} />
              {/* glass */}
              <mesh position={[s * 1.52, 1.33, z - 0.55]} rotation={[0, -s * Math.PI / 2, 0]}>
                <planeGeometry args={[0.86, 0.86]} />
                <meshStandardMaterial color={s === 1 ? '#0e1726' : '#04060a'} transparent opacity={s === 1 ? 0.28 : 0.92} roughness={0.04} metalness={0.7} />
              </mesh>
              {/* rubber frame */}
              <T geo={GEO.box} color="#121417" p={[s * 1.47, 0.89, z - 0.55]} s={[0.04, 0.04, 0.84]} o={0} />
              <T geo={GEO.box} color="#121417" p={[s * 1.47, 1.77, z - 0.55]} s={[0.04, 0.04, 0.84]} o={0} />
              {/* half drawn blind on a few windows */}
              {rnd(i * 3 + s) > 0.62 ? <T geo={GEO.box} color="#b9ab8c" p={[s * 1.45, 1.6, z - 0.55]} s={[0.012, 0.36, 0.82]} o={0.004} /> : null}
            </group>
          ))}
          {/* luggage rack: two chrome rails + glass shelf */}
          {[1.25, 1.05].map((x) => <M key={x} geo={GEO.cyl} color="#c9ced6" p={[s * x, 1.98, -0.6]} r={[Math.PI / 2, 0, 0]} s={[0.014, 11.6, 0.014]} o={0} />)}
          <mesh position={[s * 1.18, 1.99, -0.6]}><boxGeometry args={[0.3, 0.01, 11.6]} /><meshStandardMaterial color="#9fb4c0" transparent opacity={0.25} roughness={0.1} /></mesh>
          {ROWS.map((z) => <M key={'br' + z} geo={GEO.box} color="#aab0ba" p={[s * 1.33, 2.06, z - 0.5]} s={[0.3, 0.02, 0.025]} o={0} />)}
        </group>
      ))}
      {/* seats: everything faces the camera (+z) – the threat is always behind you */}
      {ROWS.map((z) => [-1, 1].map((s) => <DoubleSeat key={z + '-' + s} p={[s * 0.95, 0, z]} side={s} fab={fab} />))}
      {/* forgotten things: suitcase on rack, coffee cup, newspaper */}
      <T geo={GEO.rbox} color="#4a5a3a" p={[-1.18, 2.14, -1.3]} s={[0.26, 0.28, 0.62]} o={0.01} />
      <M geo={GEO.box} color="#c9ced6" p={[-1.18, 2.3, -1.3]} s={[0.04, 0.03, 0.2]} o={0} />
      <T geo={GEO.cyl} color="#e9e4d8" p={[1.2, 0.53, -1.13]} s={[0.035, 0.1, 0.035]} o={0.006} />
      <T geo={GEO.box} color="#d8d2c2" p={[0.7, 0.49, -2.26]} r={[0, 0.4, 0]} s={[0.26, 0.012, 0.34]} o={0.004} />
      {/* vestibule: grab poles, end wall, LED display, connecting door */}
      {[-1, 1].map((s) => <M key={'po' + s} geo={GEO.cyl} color="#c9ced6" p={[s * 0.5, 1.23, -5.35]} s={[0.022, 2.46, 0.022]} o={0} />)}
      <T geo={GEO.box} color="#2a3230" p={[0, 1.23, -8.0]} s={[3, 2.46, 0.08]} o={0} />
      <T geo={GEO.rbox} color="#3a4441" p={[0, 1.0, -7.94]} s={[0.84, 1.96, 0.05]} o={0.01} />
      <mesh position={[0, 1.42, -7.9]}><planeGeometry args={[0.44, 0.6]} /><meshBasicMaterial color="#0a1a14" /></mesh>
      <M geo={GEO.box} color="#c9ced6" p={[0.3, 1.0, -7.88]} s={[0.03, 0.26, 0.03]} o={0} />
      <mesh position={[0, 2.24, -7.89]}><planeGeometry args={[1.5, 0.28]} /><meshBasicMaterial map={led} toneMapped={false} /></mesh>
      <Halo p={[0, 2.24, -7.83]} s={1.6} color="#ff9a2a" o={0.25} />
      <T geo={GEO.cap} color="#b0222a" p={[-1.1, 0.5, -7.85]} s={[0.12, 0.13, 0.12]} o={0.008} />
      {/* left door (closed) */}
      <T geo={GEO.box} color="#3a4441" p={[-1.5, 1.05, (DOOR[0] + DOOR[1]) / 2]} s={[0.06, 2.1, 1.3]} o={0.008} />
      <mesh position={[-1.46, 1.4, (DOOR[0] + DOOR[1]) / 2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.9, 0.6]} /><meshStandardMaterial color="#04060a" roughness={0.05} metalness={0.7} /></mesh>
      {/* right door OPEN: frame with yellow edges, slid leaves, warm platform light spilling in */}
      {[DOOR[0], DOOR[1]].map((z) => <T key={'df' + z} geo={GEO.box} color="#e0b02a" p={[1.49, 1.05, z]} s={[0.1, 2.1, 0.05]} o={0.006} />)}
      {[0, 1].map((k) => {
        const zOpen = k ? DOOR[1] + 0.33 : DOOR[0] - 0.33, zShut = k ? DOOR[1] - 0.325 : DOOR[0] + 0.325;
        const z = zShut + (zOpen - zShut) * doorOpen;
        return (
          <group key={'leaf' + k} position={[1.53, 1.05, z]}>
            <T geo={GEO.box} color="#3a4441" s={[0.04, 2.1, 0.65]} o={0.006} />
            <mesh position={[-0.025, 0.35, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.45, 0.6]} /><meshStandardMaterial color="#0e1726" transparent opacity={0.4} roughness={0.05} metalness={0.7} /></mesh>
            <M geo={GEO.box} color="#e0b02a" p={[-0.03, 0, k ? -0.31 : 0.31]} s={[0.02, 2.1, 0.03]} o={0} />
          </group>
        );
      })}
      <M geo={GEO.box} color="#e0b02a" p={[1.35, 0.005, (DOOR[0] + DOOR[1]) / 2]} s={[0.3, 0.012, 1.3]} o={0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.9, 0.01, (DOOR[0] + DOOR[1]) / 2 + 0.1]} scale={[1.2, 1.6, 1]}><circleGeometry args={[1, 32]} /><meshBasicMaterial color="#ff9a3c" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0.16 * doorOpen * pl} /></mesh>
      <spotLight position={[3.4, 2.6, (DOOR[0] + DOOR[1]) / 2]} angle={0.6} penumbra={0.7} intensity={26 * doorOpen * pl} distance={8} color="#ff9a3c" target-position={[0.3, 0, -6.6]} castShadow />
      {/* carriage exterior: roof, stripe, end wall, next carriage */}
      <T geo={GEO.rbox} color="#20262a" p={[0, 2.72, -1]} s={[3.14, 0.5, 14.2]} o={0.01} />
      <M geo={GEO.box} color="#7a1f2a" p={[1.535, 0.93, -1]} s={[0.012, 0.05, 14.1]} o={0} />
      <M geo={GEO.box} color="#c9c2b0" p={[1.535, 2.24, -1]} s={[0.012, 0.03, 14.1]} o={0} />
      <T geo={GEO.box} color="#2a3230" p={[0, 1.23, 6.08]} s={[3.1, 2.46, 0.08]} o={0} />
      <group position={[0, 0, -16.6]}>
        <T geo={GEO.rbox} color="#262d2b" p={[0, 1.45, 0]} s={[3.1, 2.9, 16.6]} o={0.01} />
        {Array.from({length: 12}).map((_, i) => <mesh key={i} position={[1.56, 1.33, 7 - i * 1.25]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.85, 0.8]} /><meshBasicMaterial color={i % 4 === 2 ? '#0a0c0c' : '#5d7268'} toneMapped={false} /></mesh>)}
      </group>
      {/* outside: the platform that is on no map */}
      <group position={[0, 0, outsideZ]} visible={outsideOn > 0.01}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.2, -0.02, -3]}><planeGeometry args={[7.2, 30]} /><meshStandardMaterial map={conc} roughness={0.7} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.98, -0.01, -3]}><planeGeometry args={[0.12, 30]} /><meshStandardMaterial color="#d9b42a" roughness={0.6} /></mesh>
      <T geo={GEO.box} color="#1a1c1f" p={[8.8, 2, -3]} s={[0.2, 4, 30]} o={0} />
      {[-11, -6.6, -2, 2.6].map((z, i) => (
        <group key={'lp' + i} position={[3.8, 0, z]}>
          <M geo={GEO.cyl} color="#2a2d32" p={[0, 1.6, 0]} s={[0.05, 3.2, 0.05]} o={0.006} />
          <T geo={GEO.rbox} color="#2a2d32" p={[-0.25, 3.2, 0]} s={[0.6, 0.08, 0.16]} o={0.006} />
          <mesh position={[-0.42, 3.14, 0]} scale={[0.24, 0.03, 0.12]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={new THREE.Color('#ffb060').multiplyScalar(0.15 + 1.85 * pl)} toneMapped={false} /></mesh>
          <Halo p={[-0.42, 3.05, 0]} s={2.6} color="#ff9a3c" o={0.4 * pl} />
          {i === 1 || i === 2 ? <pointLight position={[-0.42, 2.9, 0]} color="#ff9a3c" intensity={8.5 * pl} distance={8} decay={1.5} /> : null}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0.0, 0]} scale={[1.8, 1.8, 1]}><circleGeometry args={[1, 32]} /><meshBasicMaterial color="#ff9a3c" transparent opacity={0.12 * pl} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
        </group>
      ))}
      {/* platform sign + bench outside */}
      <group position={[3.1, 2.55, -6.65]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><planeGeometry args={[1.6, 0.8]} /><meshBasicMaterial map={sign} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        {[-0.6, 0.6].map((x) => <M key={x} geo={GEO.cyl} color="#2a2d32" p={[x, 0.7, 0]} s={[0.012, 0.6, 0.012]} o={0} />)}
      </group>
      <group position={[5.6, 0, -4.4]} rotation={[0, -Math.PI / 2, 0]}>
        <T geo={GEO.rbox} color="#3a2a20" p={[0, 0.45, 0]} s={[1.6, 0.06, 0.4]} o={0.008} />
        <T geo={GEO.rbox} color="#3a2a20" p={[0, 0.8, -0.18]} s={[1.6, 0.4, 0.05]} o={0.008} />
      </group>
      </group>
      {/* dust drifting in the light */}
      {dust.map(([a, b, c, d], i) => (
        <mesh key={'d' + i} position={[-1.3 + a * 2.6, 0.3 + ((b * 2.1 + t * 0.08 * (0.4 + d)) % 2.1), 2.2 - c * 9]} scale={0.004 + d * 0.005}>
          <sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#fff1d0" transparent opacity={0.35} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
};

// ---------------- film overlays (shared) ----------------
export const FilmLook: React.FC<{frame: number}> = ({frame}) => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,.74) 100%)'}} />
    <AbsoluteFill style={{opacity: 0.085, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%"><filter id={'g' + (frame % 6)}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 6} /></filter><rect width="100%" height="100%" filter={`url(#g${frame % 6})`} /></svg>
    </AbsoluteFill>
  </>
);
export const Chips: React.FC<{a: string; b: string; active?: 0 | 1 | null; top?: number}> = ({a, b, active = null, top = 120}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
    {[['#e8343a', a], ['#2fbf71', b]].map(([c, txt], i) => (
      <span key={txt} style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#14161c', background: '#fff', borderRadius: 999, padding: '10px 22px 10px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: active === null || active === i ? 1 : 0.35, boxShadow: '0 6px 24px rgba(0,0,0,.45)'}}>
        <span style={{width: 24, height: 24, borderRadius: 12, background: c}} />{txt}
      </span>
    ))}
  </div>
);
export const Caption: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 76, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', textShadow: '0 4px 22px rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,.8)'}}>{text}</div>
);

// ---------------- reference frame ----------------
export const TrainRef: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#040507'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5}} camera={{fov: 40, near: 0.05, far: 120}}>
        <Cam pos={[0.12, 1.42, 4.35]} look={[-0.32, 1.12, -4]} fov={54} />
        <TrainSet t={t} />
        <TravelerHD p={[-0.7, 0, 0.98]} ry={0.18} mood="shock" look={0.8} sit />
        <T geo={GEO.rbox} color="#7a2f2a" p={[-1.2, 0.72, 1.02]} r={[0, 0.3, 0.08]} s={[0.32, 0.42, 0.2]} o={0.012} />
        <Conductor p={[0.04, 0, -5.25]} ry={-0.12} glow={1} point={1} s={1.08} />
      </ThreeCanvas>
      <FilmLook frame={frame} />
      <Chips a="STAY ON THE TRAIN" b="GET OFF" />
      <Caption text="NO FACE." />
    </AbsoluteFill>
  );
};

export const TrainRefClose: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#040507'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={1.5} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5}} camera={{fov: 40, near: 0.05, far: 120}}>
        <Cam pos={[-0.25, 1.75, -2.9]} look={[0.05, 1.55, -5.25]} fov={46} />
        <TrainSet t={frame / fps} />
        <Conductor p={[0.04, 0, -5.25]} ry={-0.12} glow={1} point={1} s={1.08} />
      </ThreeCanvas>
      <FilmLook frame={frame} />
      <Caption text="ONE RED LIGHT." />
    </AbsoluteFill>
  );
};
