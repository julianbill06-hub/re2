import React, {useMemo} from 'react';
import * as THREE from 'three';

// ===================== shared look =====================
export const INK = '#17111c';
let grad: THREE.DataTexture | null = null;
export function toonGrad() {
  if (grad) return grad;
  const d = new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  grad = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter;
  grad.needsUpdate = true;
  return grad;
}

const hullCache = new WeakMap<THREE.BufferGeometry, Map<number, THREE.BufferGeometry>>();
function hullOf(geo: THREE.BufferGeometry, w: number) {
  let m = hullCache.get(geo);
  if (!m) hullCache.set(geo, (m = new Map()));
  let g = m.get(w);
  if (!g) {
    g = geo.clone();
    const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * w, p.getY(i) + n.getY(i) * w, p.getZ(i) + n.getZ(i) * w);
    m.set(w, g);
  }
  return g;
}

type V3 = [number, number, number];
export const T: React.FC<{geo: THREE.BufferGeometry; color?: string; map?: THREE.Texture; p?: V3; r?: V3; s?: V3 | number; o?: number; shadow?: boolean}> = ({geo, color = '#fff', map, p, r, s = 1, o = 0.03, shadow = true}) => {
  const sc: V3 = typeof s === 'number' ? [s, s, s] : s;
  return (
    <group position={p} rotation={r} scale={sc}>
      <mesh geometry={geo} castShadow={shadow} receiveShadow>
        <meshToonMaterial color={color} map={map} gradientMap={toonGrad()} />
      </mesh>
      {o ? (
        <mesh geometry={hullOf(geo, o)}>
          <meshBasicMaterial color={INK} side={THREE.BackSide} />
        </mesh>
      ) : null}
    </group>
  );
};

export const GEO = {
  sphere: new THREE.SphereGeometry(1, 40, 28),
  cap: new THREE.CapsuleGeometry(0.5, 1, 12, 24),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 28),
  cylLow: new THREE.CylinderGeometry(1, 1, 1, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
  rbox: roundedBox(1, 1, 1, 0.12),
  torus: new THREE.TorusGeometry(1, 0.14, 14, 48),
  cone: new THREE.ConeGeometry(1, 1, 24),
  half: new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
  // face patch: front part of a sphere, UVs span the patch
  face: new THREE.SphereGeometry(1, 48, 36, Math.PI / 2 - 1.05, 2.1, Math.PI / 2 - 0.95, 1.9),
};

function roundedBox(w: number, h: number, d: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(shape, {depth: d - 2 * r, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 4, curveSegments: 6});
  g.translate(0, 0, -(d - 2 * r) / 2);
  g.computeVertexNormals();
  return g;
}

// ===================== canvas textures =====================
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rand = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export type Mood = 'smug' | 'grin' | 'stern' | 'grumpy' | 'shock' | 'calm';
const faceCache = new Map<string, THREE.Texture>();
// Hand-drawn style face: thick-outlined eyes, heavy brows, expressive mouth
export function faceTex(mood: Mood, lookX = 0, blush = true) {
  const key = mood + lookX + blush;
  const hit = faceCache.get(key);
  if (hit) return hit;
  const t = canvasTex(1024, 1024, (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const E = (cx: number, side: number) => {
      const lid = mood === 'smug' ? 0.42 : mood === 'stern' ? 0.36 : mood === 'grumpy' ? 0.3 : mood === 'calm' ? 1 : 0;
      const ry = mood === 'shock' ? 88 : 74, rx = mood === 'shock' ? 70 : 60;
      const cy = 470;
      if (lid >= 1) { // closed, content eyes
        g.strokeStyle = INK; g.lineWidth = 22;
        g.beginPath(); g.arc(cx, cy - 10, 52, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
        return;
      }
      g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 20;
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
      g.save(); g.clip();
      g.fillStyle = INK;
      g.beginPath(); g.ellipse(cx + lookX * 22 + side * 4, cy + 10, 30, 36, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(cx + lookX * 22 + 10, cy - 6, 9, 0, Math.PI * 2); g.fill();
      if (lid > 0) { // upper eyelid in skin tone with a line
        g.fillStyle = '#f2c4a0';
        g.fillRect(cx - rx - 5, cy - ry - 5, rx * 2 + 10, ry * 2 * lid + 5);
        g.restore();
        g.strokeStyle = INK; g.lineWidth = 18;
        g.beginPath(); g.moveTo(cx - rx + 4, cy - ry + ry * 2 * lid); g.lineTo(cx + rx - 4, cy - ry + ry * 2 * lid); g.stroke();
      } else g.restore();
      g.strokeStyle = INK; g.lineWidth = 20;
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    };
    E(392, -1); E(632, 1);
    // brows
    g.strokeStyle = INK; g.lineWidth = 30;
    const tilt = mood === 'grumpy' || mood === 'stern' ? 34 : mood === 'smug' ? -14 : mood === 'shock' ? -26 : mood === 'grin' ? 20 : 0;
    const by = mood === 'shock' ? 340 : 368;
    g.beginPath(); g.moveTo(322, by - tilt); g.quadraticCurveTo(392, by - 26, 452, by + tilt); g.stroke();
    g.beginPath(); g.moveTo(572, by + tilt); g.quadraticCurveTo(632, by - 26, 702, by - tilt); g.stroke();
    // nose hint
    g.lineWidth = 14; g.strokeStyle = 'rgba(120,60,40,.55)';
    g.beginPath(); g.moveTo(500, 600); g.quadraticCurveTo(522, 622, 500, 640); g.stroke();
    // blush
    if (blush) {
      g.fillStyle = 'rgba(240,120,110,.28)';
      g.beginPath(); g.ellipse(300, 640, 58, 34, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(724, 640, 58, 34, 0, 0, Math.PI * 2); g.fill();
    }
    // mouth
    g.strokeStyle = INK; g.lineWidth = 18; g.fillStyle = '#7a2230';
    if (mood === 'grin' || mood === 'smug') {
      const w = mood === 'grin' ? 150 : 120, lift = mood === 'smug' ? 26 : 0;
      g.beginPath(); g.moveTo(512 - w, 690 - lift); g.quadraticCurveTo(512, 820, 512 + w, 690 + lift * 0.2);
      g.quadraticCurveTo(512, 735, 512 - w, 690 - lift); g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(380, 690, 270, 46);
      g.strokeStyle = 'rgba(23,17,28,.6)'; g.lineWidth = 6;
      for (let x = 420; x < 620; x += 40) { g.beginPath(); g.moveTo(x, 690); g.lineTo(x, 736); g.stroke(); }
      g.restore(); g.lineWidth = 18;
      g.beginPath(); g.moveTo(512 - w, 690 - lift); g.quadraticCurveTo(512, 820, 512 + w, 690 + lift * 0.2);
      g.quadraticCurveTo(512, 735, 512 - w, 690 - lift); g.closePath(); g.stroke();
    } else if (mood === 'shock') {
      g.beginPath(); g.ellipse(512, 735, 52, 66, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    } else if (mood === 'calm') {
      g.beginPath(); g.moveTo(452, 700); g.quadraticCurveTo(512, 748, 572, 700); g.stroke();
    } else {
      const d = mood === 'grumpy' ? -22 : -4;
      g.beginPath(); g.moveTo(450, 730); g.quadraticCurveTo(512, 730 + d, 574, 730); g.stroke();
    }
  });
  faceCache.set(key, t);
  return t;
}

export function useTextures() {
  return useMemo(() => {
    const floor = canvasTex(1024, 1024, (g) => {
      const n = 6, s = 1024 / n;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const k = rand(x * 13 + y * 7);
          const base = (x + y) % 2 ? [226, 205, 165] : [214, 186, 140];
          g.fillStyle = `rgb(${base[0] + k * 14},${base[1] + k * 12},${base[2] + k * 10})`;
          g.fillRect(x * s, y * s, s, s);
          for (let i = 0; i < 40; i++) { // speckle
            g.fillStyle = `rgba(120,90,60,${0.05 + rand(i + x * 99 + y * 7) * 0.08})`;
            g.fillRect(x * s + rand(i * 3 + x) * s, y * s + rand(i * 5 + y) * s, 3, 3);
          }
          g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x * s + 6, y * s + 6, s - 12, 6);
        }
      g.strokeStyle = '#8f6f4c'; g.lineWidth = 7;
      for (let i = 0; i <= n; i++) {
        g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 1024); g.stroke();
        g.beginPath(); g.moveTo(0, i * s); g.lineTo(1024, i * s); g.stroke();
      }
    }, [12, 12]);
    const wall = canvasTex(1024, 512, (g) => {
      g.fillStyle = '#e8b974'; g.fillRect(0, 0, 1024, 512);
      g.fillStyle = '#9c2f25'; g.fillRect(0, 330, 1024, 182); // painted dado
      g.fillStyle = '#2b2422'; g.fillRect(0, 318, 1024, 14);
      for (let i = 0; i < 4; i++) { // panels with thin frames
        g.strokeStyle = '#8a4a26'; g.lineWidth = 6; g.strokeRect(i * 256 + 30, 40, 196, 240);
        g.strokeStyle = '#f6e0b0'; g.lineWidth = 3; g.strokeRect(i * 256 + 44, 54, 168, 212);
        g.fillStyle = '#3f6f5a'; g.beginPath(); g.arc(i * 256 + 128, 160, 22, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#d9a53a'; g.lineWidth = 6; g.beginPath(); g.moveTo(i * 256 + 128, 190); g.lineTo(i * 256 + 128, 250); g.stroke();
        g.strokeStyle = '#d9a53a'; g.lineWidth = 4; g.strokeRect(i * 256 + 30, 360, 196, 120);
      }
    }, [3, 1]);
    const rug = canvasTex(512, 1024, (g) => {
      g.fillStyle = '#8f2a26'; g.fillRect(0, 0, 512, 1024);
      g.fillStyle = '#d99a2b'; g.fillRect(24, 24, 464, 976);
      g.fillStyle = '#7a1f1d'; g.fillRect(48, 48, 416, 928);
      for (let y = 90; y < 960; y += 120) for (let x = 110; x < 420; x += 145) { // diamonds
        g.fillStyle = (x + y) % 2 ? '#e7b84a' : '#f3e2b8';
        g.beginPath(); g.moveTo(x + 40, y); g.lineTo(x + 80, y + 50); g.lineTo(x + 40, y + 100); g.lineTo(x, y + 50); g.closePath(); g.fill();
      }
      g.fillStyle = '#3b6e5a'; for (let y = 60; y < 980; y += 30) { g.fillRect(30, y, 10, 14); g.fillRect(472, y, 10, 14); }
    });
    const toga = canvasTex(256, 256, (g) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(150,140,120,.25)'; g.lineWidth = 6;
      for (let x = -20; x < 300; x += 34) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 20, 128, x - 10, 256); g.stroke(); }
    }, [2, 2]);
    const shield = canvasTex(256, 384, (g) => {
      g.fillStyle = '#a3241f'; g.fillRect(0, 0, 256, 384);
      g.strokeStyle = '#e2b13c'; g.lineWidth = 14; g.strokeRect(14, 14, 228, 356);
      g.fillStyle = '#e2b13c'; // boss + wings + bolts
      g.beginPath(); g.arc(128, 192, 34, 0, Math.PI * 2); g.fill();
      for (const sx of [-1, 1]) {
        g.beginPath(); g.moveTo(128 + sx * 30, 180); g.quadraticCurveTo(128 + sx * 90, 120, 128 + sx * 105, 150); g.quadraticCurveTo(128 + sx * 80, 175, 128 + sx * 30, 205); g.fill();
        g.beginPath(); g.moveTo(128 + sx * 10, 230); g.lineTo(128 + sx * 40, 330); g.lineTo(128 + sx * 25, 330); g.lineTo(128 + sx * 2, 240); g.fill();
      }
    });
    return {floor, wall, rug, toga, shield};
  }, []);
}

// ===================== characters =====================
export const Head: React.FC<{p?: V3; skin: string; mood: Mood; look?: number; hair?: string; hairStyle?: 'caesar' | 'bald' | 'curly' | 'none'; scale?: number}> = ({p = [0, 0, 0], skin, mood, look = 0, hair = '#3a2416', hairStyle = 'caesar', scale = 1}) => (
  <group position={p} scale={scale}>
    <T geo={GEO.sphere} color={skin} s={[0.78, 0.72, 0.72]} o={0.03} />
    <mesh geometry={GEO.face} scale={[0.782, 0.722, 0.722]}>
      <meshBasicMaterial map={faceTex(mood, look)} transparent depthWrite={false} />
    </mesh>
    {/* ears */}
    <T geo={GEO.sphere} color={skin} p={[-0.77, -0.04, 0]} s={[0.12, 0.17, 0.1]} o={0.025} />
    <T geo={GEO.sphere} color={skin} p={[0.77, -0.04, 0]} s={[0.12, 0.17, 0.1]} o={0.025} />
    {hairStyle === 'caesar' ? (
      <group>
        <T geo={GEO.half} color={hair} p={[0, 0.06, -0.04]} r={[-0.32, 0, 0]} s={[0.8, 0.7, 0.74]} o={0.03} />
        {/* forward-combed fringe locks */}
        {Array.from({length: 9}).map((_, i) => {
          const a = -0.95 + i * 0.24;
          return <T key={i} geo={GEO.sphere} color={hair} p={[Math.sin(a) * 0.66, 0.36 - Math.abs(a) * 0.08, Math.cos(a) * 0.5]} s={[0.13, 0.1, 0.12]} o={0.02} />;
        })}
      </group>
    ) : null}
    {hairStyle === 'curly' ? (
      <group>
        {Array.from({length: 26}).map((_, i) => {
          const a = (i / 26) * Math.PI * 2, ring = i % 2;
          return <T key={i} geo={GEO.sphere} color={hair} p={[Math.cos(a) * (0.62 - ring * 0.25), 0.42 + ring * 0.2, Math.sin(a) * (0.58 - ring * 0.25) - 0.08]} s={0.2} o={0.02} />;
        })}
      </group>
    ) : null}
    {hairStyle === 'bald' ? (
      <group>
        <T geo={GEO.sphere} color={hair} p={[-0.7, 0.05, -0.15]} s={[0.12, 0.25, 0.3]} o={0.02} />
        <T geo={GEO.sphere} color={hair} p={[0.7, 0.05, -0.15]} s={[0.12, 0.25, 0.3]} o={0.02} />
      </group>
    ) : null}
  </group>
);

export const Laurel: React.FC<{p?: V3}> = ({p = [0, 0, 0]}) => (
  <group position={p} rotation={[-0.25, 0, 0]}>
    {Array.from({length: 22}).map((_, k) => {
      const a = (k / 22) * Math.PI * 2;
      if (Math.abs(Math.sin(a / 2 - Math.PI / 2)) < 0.12) return null; // gap at the back
      return <T key={k} geo={GEO.sphere} color={k % 2 ? '#4f9a3c' : '#6dbb4a'} p={[Math.cos(a) * 0.8, 0.02 * (k % 2), Math.sin(a) * 0.76]} r={[0, -a, 0.7]} s={[0.17, 0.06, 0.09]} o={0.015} />;
    })}
    <T geo={GEO.sphere} color="#e8b33a" p={[0, 0, 0.78]} s={0.07} o={0.015} />
  </group>
);

// Chibi Roman in a toga: big head, small round body, short legs with sandals
export const Roman: React.FC<{
  p?: V3; ry?: number; s?: number;
  robe: string; trim: string; skin?: string; hair?: string; hairStyle?: 'caesar' | 'bald' | 'curly' | 'none';
  mood?: Mood; look?: number; laurel?: boolean;
  armR?: number; armL?: number; bob?: number; robeMap?: THREE.Texture;
}> = ({p = [0, 0, 0], ry = 0, s = 1, robe, trim, skin = '#f2c4a0', hair = '#3a2416', hairStyle = 'caesar', mood = 'calm', look = 0, laurel, armR = 0, armL = 0, bob = 0, robeMap}) => {
  const b = Math.sin(bob * Math.PI * 2) * 0.02;
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {/* legs + sandals */}
      {[-0.2, 0.2].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <T geo={GEO.cap} color={skin} p={[0, 0.25, 0]} s={[0.17, 0.22, 0.17]} o={0.02} />
          <T geo={GEO.rbox} color="#6b3f22" p={[0, 0.05, 0.06]} s={[0.22, 0.1, 0.34]} o={0.02} />
          <T geo={GEO.box} color="#4a2a16" p={[0, 0.2, 0.02]} s={[0.19, 0.03, 0.19]} o={0} />
        </group>
      ))}
      {/* tunic + draped toga */}
      <group position={[0, 0.88 + b, 0]}>
        <T geo={GEO.cap} color={robe} map={robeMap} s={[0.95, 0.62, 0.8]} o={0.03} />
        <T geo={GEO.cyl} color={trim} p={[0, -0.47, 0]} s={[0.46, 0.08, 0.4]} o={0.015} />
        {/* diagonal drape */}
        <T geo={GEO.torus} color={trim} p={[0, 0.08, 0]} r={[Math.PI / 2 + 0.15, 0.62, 0]} s={[0.5, 0.48, 1.3]} o={0.015} />
        {/* arms */}
        <group position={[-0.5, 0.2, 0]} rotation={[0, 0, -0.4 - armL]}>
          <T geo={GEO.cap} color={robe} map={robeMap} p={[0, -0.18, 0]} s={[0.26, 0.28, 0.26]} o={0.02} />
          <T geo={GEO.sphere} color={skin} p={[0, -0.45, 0]} s={0.13} o={0.02} />
        </group>
        <group position={[0.5, 0.2, 0]} rotation={[0, 0, 0.4 + armR]}>
          <T geo={GEO.cap} color={robe} map={robeMap} p={[0, -0.18, 0]} s={[0.26, 0.28, 0.26]} o={0.02} />
          <T geo={GEO.sphere} color={skin} p={[0, -0.45, 0]} s={0.13} o={0.02} />
        </group>
      </group>
      <group position={[0, 1.95 + b * 1.5, 0]}>
        <Head skin={skin} mood={mood} look={look} hair={hair} hairStyle={hairStyle} />
        {laurel ? <Laurel p={[0, 0.3, 0]} /> : null}
      </group>
    </group>
  );
};

// Praetorian guard: steel helmet with crest + cheek guards, curved red shield, spear
export const Guard: React.FC<{p: V3; ry?: number; shield: THREE.Texture; mood?: Mood; s?: number}> = ({p, ry = 0, shield, mood = 'stern', s = 1}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Roman robe="#b2302a" trim="#8a7a6a" mood={mood} hairStyle="none" skin="#eab48e" />
    {/* segmented armor bands */}
    {[0, 1, 2].map((k) => (
      <T key={k} geo={GEO.cyl} color="#aeb4bf" p={[0, 1.05 - k * 0.14, 0]} s={[0.47 - k * 0.01, 0.1, 0.4]} o={0.012} />
    ))}
    <group position={[0, 1.95, 0]}>
      <T geo={GEO.half} color="#b9c3d0" p={[0, 0.3, -0.04]} s={[0.84, 0.66, 0.8]} o={0.03} />
      <T geo={GEO.torus} color="#d9a83a" p={[0, 0.32, -0.04]} r={[Math.PI / 2, 0, 0]} s={[0.82, 0.78, 0.6]} o={0.012} />
      {/* crest: front-to-back brush */}
      <T geo={GEO.rbox} color="#c4232b" p={[0, 1.02, -0.05]} s={[0.14, 0.26, 0.95]} o={0.02} />
      <T geo={GEO.box} color="#d9a83a" p={[0, 0.9, -0.05]} s={[0.1, 0.06, 0.7]} o={0.01} />
      {/* cheek guards */}
      <T geo={GEO.rbox} color="#c9ced6" p={[-0.72, -0.15, 0.18]} r={[0, 0.5, 0]} s={[0.07, 0.42, 0.3]} o={0.015} />
      <T geo={GEO.rbox} color="#c9ced6" p={[0.72, -0.15, 0.18]} r={[0, -0.5, 0]} s={[0.07, 0.42, 0.3]} o={0.015} />
    </group>
    {/* spear */}
    <T geo={GEO.cylLow} color="#7a5232" p={[0.62, 1.6, 0.05]} s={[0.035, 3.2, 0.035]} o={0.012} />
    <T geo={GEO.cone} color="#d6dae0" p={[0.62, 3.32, 0.05]} s={[0.07, 0.28, 0.07]} o={0.012} />
    {/* curved shield */}
    <group position={[-0.45, 0.95, 0.45]} rotation={[0, 0.35, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.95, 0.95, 1.25, 24, 1, true, -0.55, 1.1]} />
        <meshToonMaterial map={shield} gradientMap={toonGrad()} side={THREE.DoubleSide} />
      </mesh>
    </group>
  </group>
);

// Toy-like horse with its own face
export const Steed: React.FC<{p?: V3; ry?: number; s?: number; headDip?: number; mood?: Mood}> = ({p = [0, 0, 0], ry = 0, s = 1, headDip = 0, mood = 'calm'}) => {
  const coat = '#f7f2ea', mane = '#9a6a45', gold = '#e9b23a';
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {[[-0.6, 0.33], [0.6, 0.33], [-0.6, -0.33], [0.6, -0.33]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <T geo={GEO.cap} color={coat} p={[0, 0.48, 0]} s={[0.24, 0.62, 0.24]} o={0.02} />
          <T geo={GEO.cyl} color="#5a3b28" p={[0, 0.07, 0]} s={[0.15, 0.14, 0.15]} o={0.015} />
        </group>
      ))}
      <T geo={GEO.cap} color={coat} p={[0, 1.2, 0]} r={[0, 0, Math.PI / 2]} s={[1.1, 1.15, 1.0]} o={0.03} />
      {/* blanket */}
      <T geo={GEO.sphere} color={gold} p={[0, 1.62, 0]} s={[0.86, 0.2, 0.6]} o={0.015} />
      <T geo={GEO.sphere} color="#6a2b9e" p={[0, 1.66, 0]} s={[0.8, 0.19, 0.57]} o={0.02} />
      {/* tail */}
      <T geo={GEO.cap} color={mane} p={[-1.12, 1.1, 0]} r={[0, 0, -0.6]} s={[0.26, 0.5, 0.26]} o={0.02} />
      {/* neck */}
      <group position={[0.9, 1.45, 0]} rotation={[0, 0, -0.5 - headDip * 0.5]}>
        <T geo={GEO.cap} color={coat} p={[0, 0.45, 0]} s={[0.62, 0.62, 0.56]} o={0.03} />
        {[0, 1, 2, 3, 4].map((k) => (
          <T key={k} geo={GEO.sphere} color={mane} p={[-0.26, 0.15 + k * 0.17, 0]} s={[0.11, 0.12, 0.12]} o={0.015} />
        ))}
        <T geo={GEO.torus} color={gold} p={[0, 0.2, 0]} r={[Math.PI / 2, 0, 0]} s={[0.34, 0.31, 0.7]} o={0.015} />
        {[-0.18, 0, 0.18].map((z, k) => (
          <mesh key={k} position={[0.3, 0.2, z]} scale={0.065}><sphereGeometry args={[1, 14, 10]} /><meshBasicMaterial color={k === 1 ? '#3fd0ff' : '#ff3b5c'} /></mesh>
        ))}
        {/* head: big, facing the camera side */}
        <group position={[0.15, 1.0, 0]} rotation={[0, 0, 0.5 + headDip * 0.5]}>
          <group rotation={[0, Math.PI / 2 - 0.35, 0]}>
            <T geo={GEO.sphere} color={coat} s={[0.55, 0.52, 0.52]} o={0.03} />
            <mesh geometry={GEO.face} scale={[0.552, 0.522, 0.522]} position={[0, 0.06, 0]}>
              <meshBasicMaterial map={faceTex(mood, 0.4, false)} transparent depthWrite={false} />
            </mesh>
            {/* muzzle */}
            <T geo={GEO.sphere} color="#eadbc6" p={[0, -0.3, 0.32]} s={[0.36, 0.26, 0.3]} o={0.02} />
            <mesh position={[-0.12, -0.27, 0.6]} scale={0.04}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={INK} /></mesh>
            <mesh position={[0.12, -0.27, 0.6]} scale={0.04}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={INK} /></mesh>
            {/* ears */}
            <T geo={GEO.cone} color={coat} p={[-0.3, 0.55, -0.05]} r={[0, 0, 0.25]} s={[0.12, 0.3, 0.1]} o={0.02} />
            <T geo={GEO.cone} color={coat} p={[0.3, 0.55, -0.05]} r={[0, 0, -0.25]} s={[0.12, 0.3, 0.1]} o={0.02} />
            {/* forelock */}
            <T geo={GEO.sphere} color={mane} p={[0, 0.48, 0.12]} s={[0.17, 0.12, 0.14]} o={0.015} />
          </group>
        </group>
      </group>
    </group>
  );
};

// ===================== set pieces =====================
export const Pillar: React.FC<{p: V3; h?: number}> = ({p, h = 5}) => (
  <group position={p}>
    <T geo={GEO.rbox} color="#efe6d4" p={[0, 0.15, 0]} s={[1.0, 0.3, 1.0]} o={0.02} />
    <T geo={GEO.cyl} color="#f6efe2" p={[0, h / 2 + 0.3, 0]} s={[0.38, h, 0.38]} o={0.025} />
    {Array.from({length: 8}).map((_, i) => { // flutes
      const a = (i / 8) * Math.PI * 2;
      return <mesh key={i} position={[Math.cos(a) * 0.37, h / 2 + 0.3, Math.sin(a) * 0.37]} scale={[0.03, h * 0.94, 0.03]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#d8ccb4" /></mesh>;
    })}
    <T geo={GEO.rbox} color="#efe6d4" p={[0, h + 0.45, 0]} s={[1.05, 0.3, 1.05]} o={0.02} />
  </group>
);

export const Brazier: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const f = 0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 7.3);
  return (
    <group position={p}>
      <T geo={GEO.cylLow} color="#5a4a3a" p={[0, 0.7, 0]} s={[0.07, 1.4, 0.07]} o={0.015} />
      <T geo={GEO.half} color="#c8902e" p={[0, 1.4, 0]} r={[Math.PI, 0, 0]} s={[0.45, 0.3, 0.45]} o={0.02} />
      <mesh position={[0, 1.55, 0]} scale={[0.32 * f, 0.5 * f, 0.32 * f]}><coneGeometry args={[1, 1, 12]} /><meshBasicMaterial color="#ffb02e" /></mesh>
      <mesh position={[0, 1.5, 0]} scale={[0.2, 0.3 * f, 0.2]}><coneGeometry args={[1, 1, 12]} /><meshBasicMaterial color="#fff2a8" /></mesh>
      <pointLight position={[0, 2.0, 0]} color="#ff9a3c" intensity={10 * f} distance={7} decay={1.6} />
    </group>
  );
};

export const Banner: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <T geo={GEO.cylLow} color="#d9a83a" p={[0, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.05, 1.5, 0.05]} o={0.012} />
    <T geo={GEO.box} color="#9e1f22" p={[0, -1.2, 0]} s={[1.3, 2.3, 0.05]} o={0.015} />
    <T geo={GEO.sphere} color="#d9a83a" p={[0, -1.0, 0.05]} s={[0.28, 0.28, 0.04]} o={0.012} />
    <T geo={GEO.cone} color="#9e1f22" p={[-0.32, -2.55, 0]} r={[Math.PI, 0, 0]} s={[0.33, 0.4, 0.03]} o={0.012} />
    <T geo={GEO.cone} color="#9e1f22" p={[0.32, -2.55, 0]} r={[Math.PI, 0, 0]} s={[0.33, 0.4, 0.03]} o={0.012} />
  </group>
);
