import React, {useMemo} from 'react';
import * as THREE from 'three';
import {GEO, Guard, M, Roman, T, useTextures} from './hd';

type V3 = [number, number, number];
const SHORE = -7; // sea for z < SHORE

const seaMat = () =>
  new THREE.ShaderMaterial({
    uniforms: {uT: {value: 0}},
    vertexShader: `
      uniform float uT; varying vec3 vW;
      void main(){
        vec3 p = position;
        vec4 w = modelMatrix * vec4(p,1.0);
        w.y += 0.12*sin(w.x*0.6 + uT*1.4) + 0.09*sin(w.z*0.9 - uT*1.9);
        vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uT; varying vec3 vW;
      void main(){
        float d = clamp((${SHORE.toFixed(1)} - vW.z)/40.0, 0.0, 1.0);
        vec3 shallow = vec3(0.36,0.80,0.86), deep = vec3(0.10,0.38,0.66);
        vec3 c = mix(shallow, deep, pow(d,0.6));
        float bands = sin(vW.z*2.2 + uT*1.6 + sin(vW.x*0.7)*1.2);
        c += vec3(0.08) * smoothstep(0.86, 0.98, bands) * (1.0-d);
        float foam = smoothstep(1.4, 0.0, ${SHORE.toFixed(1)} - vW.z + 0.25*sin(uT*1.5 + vW.x*0.8));
        c = mix(c, vec3(0.97,0.98,1.0), foam*0.9);
        gl_FragColor = vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
  });

function sandTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ead1a0'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const r = Math.sin(i * 12.9898) * 43758.5453; const f = r - Math.floor(r);
    const r2 = Math.sin(i * 78.233) * 12345.678; const f2 = r2 - Math.floor(r2);
    g.fillStyle = f > 0.5 ? 'rgba(170,130,80,.10)' : 'rgba(255,245,220,.18)';
    g.fillRect(f * 512, f2 * 512, 2 + f * 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const Shell: React.FC<{p: V3; r?: number; s?: number; color?: string}> = ({p, r = 0, s = 1, color = '#f6c6b8'}) => (
  <group position={p} rotation={[0, r, 0]} scale={s}>
    <T geo={GEO.half} color={color} s={[0.16, 0.08, 0.13]} o={0.01} />
    {[-0.08, 0, 0.08].map((x, i) => <mesh key={i} position={[x, 0.05, 0.02]} rotation={[0, 0, x * 3]} scale={[0.008, 0.06, 0.1]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#c98f80" /></mesh>)}
  </group>
);
export const ShellInHand: React.FC = () => <group position={[0, -0.12, 0.06]} rotation={[0.5, 0, 0]}><Shell p={[0, 0, 0]} s={1.2} /></group>;
export const Sword: React.FC = () => (
  <group position={[0, -0.08, 0]} rotation={[0, 0, 0]}>
    <T geo={GEO.box} color="#6b3f22" p={[0, 0, 0]} s={[0.05, 0.16, 0.05]} o={0.008} />
    <M geo={GEO.box} color="#e0b04a" p={[0, -0.09, 0]} s={[0.2, 0.04, 0.06]} o={0.008} />
    <M geo={GEO.box} color="#dfe4ea" p={[0, -0.48, 0]} s={[0.07, 0.72, 0.025]} o={0.008} />
  </group>
);

const Catapult: React.FC<{p: V3; ry?: number; arm?: number}> = ({p, ry = 0, arm = 0}) => (
  <group position={p} rotation={[0, ry, 0]}>
    {[-0.55, 0.55].map((z) => (
      <group key={z}>
        <T geo={GEO.box} color="#8a5a32" p={[0, 0.3, z]} s={[2.2, 0.16, 0.16]} o={0.012} />
        <T geo={GEO.box} color="#7a4c28" p={[0.1, 0.9, z]} r={[0, 0, 0.25]} s={[0.16, 1.3, 0.16]} o={0.012} />
      </group>
    ))}
    {[-0.9, 0.9].map((x) => (
      <T key={x} geo={GEO.cyl} color="#5a3b22" p={[x, 0.3, 0]} r={[Math.PI / 2, 0, 0]} s={[0.3, 1.4, 0.3]} o={0.012} />
    ))}
    <T geo={GEO.box} color="#7a4c28" p={[0.1, 1.45, 0]} s={[0.16, 0.16, 1.2]} o={0.012} />
    <group position={[0.1, 1.45, 0]} rotation={[0, 0, -0.9 + arm]}>
      <T geo={GEO.box} color="#9a6a3c" p={[-0.9, 0, 0]} s={[1.9, 0.14, 0.14]} o={0.012} />
      <T geo={GEO.half} color="#6b4626" p={[-1.85, 0.05, 0]} s={[0.3, 0.18, 0.3]} o={0.012} />
      <T geo={GEO.sphere} color="#8e8e8e" p={[-1.85, 0.22, 0]} s={0.2} o={0.012} />
    </group>
  </group>
);

const Standard: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <T geo={GEO.cylLow} color="#7a5232" p={[0, 2.0, 0]} s={[0.04, 4.0, 0.04]} o={0.01} />
    <M geo={GEO.box} color="#e0b04a" p={[0, 3.6, 0.02]} s={[0.7, 0.06, 0.06]} o={0.01} />
    <T geo={GEO.box} color="#a3241f" p={[0, 3.15, 0.04]} s={[0.62, 0.8, 0.03]} o={0.01} />
    <M geo={GEO.sphere} color="#e0b04a" p={[0, 4.15, 0]} s={[0.22, 0.18, 0.12]} o={0.01} />
    <M geo={GEO.box} color="#e0b04a" p={[-0.25, 4.2, 0]} r={[0, 0, 0.5]} s={[0.36, 0.08, 0.04]} o={0.01} />
    <M geo={GEO.box} color="#e0b04a" p={[0.25, 4.2, 0]} r={[0, 0, -0.5]} s={[0.36, 0.08, 0.04]} o={0.01} />
  </group>
);


const HelmetFull: React.FC<{p: V3; r?: number}> = ({p, r = 0}) => (
  <group position={p} rotation={[0, r, 0]}>
    <M geo={GEO.half} color="#c3cad6" p={[0, 0.38, 0]} r={[Math.PI, 0, 0]} s={[0.42, 0.38, 0.4]} o={0.015} />
    <T geo={GEO.rbox} color="#c4232b" p={[0, 0.06, 0.3]} r={[Math.PI / 2, 0, 0]} s={[0.07, 0.14, 0.5]} o={0.01} />
    {[[-0.12, 0.42, 0.05], [0.1, 0.44, -0.08], [0.0, 0.48, 0.1], [-0.05, 0.5, -0.05], [0.14, 0.4, 0.12]].map((q, i) => <Shell key={i} p={q as V3} r={i * 1.7} s={0.9} color={i % 2 ? '#fbe7c6' : '#f6c6b8'} />)}
  </group>
);

const Tower: React.FC<{p: V3; k: number; t: number}> = ({p, k, t}) => {
  if (k <= 0.001) return null;
  const f = 0.9 + 0.1 * Math.sin(t * 15);
  return (
    <group position={p} scale={[1, k, 1]}>
      {[0, 1, 2, 3].map((i) => <T key={i} geo={GEO.cyl} color={i % 2 ? '#d8cbb2' : '#cbbda2'} p={[0, 1.2 + i * 2.4, 0]} s={[1.5 - i * 0.18, 2.4, 1.5 - i * 0.18]} o={0.04} />)}
      {[0, 1, 2, 3].map((i) => <T key={'r' + i} geo={GEO.cyl} color="#b9a98c" p={[0, 2.4 + i * 2.4, 0]} s={[1.6 - i * 0.18, 0.2, 1.6 - i * 0.18]} o={0.02} />)}
      <T geo={GEO.cyl} color="#8a7a62" p={[0, 9.9, 0]} s={[1.0, 0.3, 1.0]} o={0.02} />
      <mesh position={[0, 10.6, 0]} scale={[0.6 * f, 1.1 * f, 0.6 * f]}><coneGeometry args={[1, 1, 14]} /><meshBasicMaterial color="#ffa733" /></mesh>
      <mesh position={[0, 10.45, 0]} scale={[0.35, 0.7 * f, 0.35]}><coneGeometry args={[1, 1, 14]} /><meshBasicMaterial color="#fff1a8" /></mesh>
    </group>
  );
};

const Ship: React.FC<{p: V3; t: number; r?: number}> = ({p, t, r = 0}) => (
  <group position={[p[0], p[1] + Math.sin(t * 1.6 + p[0]) * 0.08, p[2]]} rotation={[Math.sin(t * 1.3 + p[0]) * 0.03, r, Math.sin(t * 1.1) * 0.04]}>
    <T geo={GEO.rbox} color="#8a5a32" p={[0, 0.3, 0]} s={[4.2, 0.9, 1.5]} o={0.03} />
    <T geo={GEO.rbox} color="#6b4626" p={[2.1, 0.75, 0]} r={[0, 0, 0.5]} s={[0.9, 0.4, 0.9]} o={0.02} />
    <T geo={GEO.cylLow} color="#5a3b22" p={[0, 2.6, 0]} s={[0.08, 4.0, 0.08]} o={0.012} />
    <T geo={GEO.box} color="#f3ead6" p={[0, 3.0, 0.1]} s={[2.2, 2.0, 0.05]} o={0.015} />
    <T geo={GEO.box} color="#b8272b" p={[0, 3.0, 0.13]} s={[2.2, 0.35, 0.02]} o={0} />
    {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => <T key={x} geo={GEO.cylLow} color="#7a5232" p={[x, 0.15, 1.0]} r={[0.9, 0, 0]} s={[0.04, 1.2, 0.04]} o={0.008} />)}
  </group>
);

const Coins: React.FC<{since: number}> = ({since}) => {
  if (since < 0) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const r1 = Math.sin(i * 12.9898) * 43758.5453, r2 = Math.sin(i * 78.233) * 12345.678, r3 = Math.sin(i * 39.1) * 9876.5;
    const fx = r1 - Math.floor(r1), fz = r2 - Math.floor(r2), fd = r3 - Math.floor(r3);
    const tt = since - fd * 1.6;
    if (tt < 0) continue;
    const y = Math.max(0.03, 9 - 4.9 * tt * tt);
    out.push(
      <group key={i} position={[-9.5 + fx * 15, y, -2.6 + fz * 7.5]} rotation={[tt * 6 + i, tt * 4, 0]}>
        <M geo={GEO.cyl} color="#f2c230" s={[0.17, 0.035, 0.17]} o={0.008} />
      </group>,
    );
  }
  return <>{out}</>;
};

const Britain: React.FC = () => (
  <group position={[-6, 0, -78]}>
    {[[-12, 4.5, 9], [-2, 5.5, 11], [9, 4.8, 10], [18, 4, 8]].map(([x, h, w], i) => (
      <group key={i} position={[x, 0, 0]}>
        <mesh position={[0, h / 2 - 0.5, 0]} scale={[w, h, 4]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#f2f0ea" roughness={0.9} /></mesh>
        <mesh position={[0, h - 0.4, 0]} scale={[w * 1.02, 0.6, 4.1]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#7fae5a" roughness={1} /></mesh>
      </group>
    ))}
  </group>
);

export type BeachProps = {
  t: number;
  guardMood: 'stern' | 'shock' | 'grumpy';
  shells: boolean; // shells in soldiers' hands
  emperor: {mood: any; armR: number; elbowR: number; hold: 'sword' | 'shell'; look: number};
  catapultArm: number;
  bare?: boolean; // soldiers took their helmets off
  helmetsWithShells?: boolean;
  turn?: number; // 0..1 soldiers look at each other
  tower?: number; // 0..1 tower rises
  coins?: number; // seconds since coin rain started (<0 = none)
  horns?: number; // 0..1 trumpets raised (undefined = none)
};

export const BeachSet: React.FC<BeachProps> = ({t, guardMood, shells, emperor, catapultArm, bare = false, helmetsWithShells = false, turn = 0, tower = 0, coins = -1, horns}) => {
  const tx = useTextures();
  const sand = useMemo(sandTexture, []);
  const sea = useMemo(seaMat, []);
  sea.uniforms.uT.value = t;
  const cols = 8, rows = 5;
  return (
    <>
      <color attach="background" args={['#9fd4f2']} />
      <fog attach="fog" args={['#bfe3f5', 30, 90]} />
      <hemisphereLight args={['#f4fbff', '#c8a878', 1.2]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 14, 8]} intensity={2.6} color="#fff6e4" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-bias={-0.0004} shadow-radius={5} />
      <directionalLight position={[-4, 7, -14]} intensity={1.3} color="#fff4e6" />
      {/* sun + distant clouds */}
      <mesh position={[-30, 22, -80]}><sphereGeometry args={[5, 24, 16]} /><meshBasicMaterial color="#fff6c8" /></mesh>
      {[[-20, 14, -70, 6], [8, 17, -75, 8], [30, 12, -70, 5]].map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]}>
          {[0, 1, 2].map((k) => <mesh key={k} position={[k * s * 0.7 - s * 0.7, k === 1 ? s * 0.35 : 0, 0]} scale={[s * 0.7, s * 0.45, s * 0.4]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
        </group>
      ))}
      {/* sea and sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, SHORE - 60]} material={sea}>
        <planeGeometry args={[200, 120, 120, 80]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, SHORE + 40]} receiveShadow>
        <planeGeometry args={[200, 80]} />
        <meshStandardMaterial map={sand} roughness={1} />
      </mesh>
      {/* wet sand strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, SHORE + 0.8]}>
        <planeGeometry args={[200, 1.8]} />
        <meshStandardMaterial color="#c9ab78" roughness={0.6} />
      </mesh>
      {/* cliffs on the right */}
      {[[18, -4, 4], [22, 2, 5], [16, -12, 3.5]].map(([x, z, s], i) => (
        <T key={i} geo={GEO.sphere} color={i % 2 ? '#a99a84' : '#b7a88f'} p={[x, s * 0.4, z]} s={[s, s * 0.9, s * 1.1]} o={0.05} />
      ))}
      {/* rocks + shells on the beach */}
      {[[-6, -5.6, 0.5], [9, -4.2, 0.35], [-11, -3.5, 0.6]].map(([x, z, s], i) => <T key={i} geo={GEO.sphere} color="#9b8f7d" p={[x, s * 0.3, z]} s={[s, s * 0.6, s * 0.8]} o={0.02} />)}
      {Array.from({length: 26}).map((_, i) => {
        const r1 = Math.sin(i * 91.7) * 4375.5, r2 = Math.sin(i * 47.3) * 1234.5;
        const fx = r1 - Math.floor(r1), fz = r2 - Math.floor(r2);
        return <Shell key={i} p={[-14 + fx * 28, 0.02, -6.5 + fz * 4.5]} r={fx * 6} s={0.8 + fz * 0.6} color={i % 3 ? '#f6c6b8' : '#fbe7c6'} />;
      })}
      {/* the army: ranks facing the sea (-z) */}
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((__, c) => {
          const x = -9.0 + c * 1.8 + (r % 2) * 0.9, z = -2.2 + r * 1.6;
          const bob = Math.max(0, Math.sin(t * 2.1 + c * 0.7 + r)) * 0.02;
          return (
            <group key={r + '-' + c}>
              <Guard p={[x, bob, z]} ry={Math.PI + turn * 0.7 * Math.sin(c * 2.1 + r * 1.3 + 0.6) + turn * 0.12 * Math.sin(t * 3 + c)} shield={tx.shield} bare={bare} mood={guardMood === 'shock' && (c + r) % 3 === 0 ? 'grumpy' : guardMood} />
              {shells && !helmetsWithShells ? <Shell p={[x - 0.15, 0.03, z - 0.75]} r={c} s={1.4} /> : null}
              {helmetsWithShells ? <HelmetFull p={[x + 0.1, 0, z - 0.85]} r={c * 0.7} /> : null}
            </group>
          );
        }),
      )}
      <Britain />
      <Ship p={[-6, -0.1, -10.5]} t={t} r={0.08} />
      <Ship p={[3, -0.1, -11.2]} t={t + 1} r={-0.1} />
      <Tower p={[15.5, 0, -6.5]} k={tower} t={t} />
      <Coins since={coins} />
      {horns !== undefined ? (
        <>
          <Guard p={[5.4, 0, -2.4]} ry={Math.PI + 0.5} shield={tx.shield} mood="stern" horn={horns} />
          <Guard p={[11.0, 0, -0.8]} ry={Math.PI - 0.5} shield={tx.shield} mood="stern" horn={horns} />
        </>
      ) : null}
      <Standard p={[-10.6, 0, -1.2]} />
      <Standard p={[5.6, 0, -1.2]} />
      <Catapult p={[-13.8, 0, -3.5]} ry={Math.PI / 2} arm={catapultArm} />
      <Catapult p={[12.2, 0, -3.5]} ry={Math.PI / 2} arm={catapultArm} />
      {/* emperor on a platform, right of the army, facing the sea */}
      <group position={[8.2, 0, 1.0]}>
        <T geo={GEO.rbox} color="#8a5a32" p={[0, 0.6, 0]} s={[2.6, 1.2, 2.2]} o={0.02} />
        <T geo={GEO.box} color="#6a2b9e" p={[0, 0.65, 1.12]} s={[1.6, 0.9, 0.03]} o={0.01} />
        <M geo={GEO.box} color="#e0b04a" p={[0, 1.02, 1.13]} s={[1.7, 0.08, 0.03]} o={0.008} />
        <Roman p={[0, 1.2, 0]} ry={Math.PI + 0.55} s={1.15} robe="#6a2b9e" trim="#e9b23a" mood={emperor.mood} look={emperor.look} laurel armR={emperor.armR} elbowR={emperor.elbowR} bob={t * 0.8} hair="#2a1a10"
          handR={emperor.hold === 'sword' ? <Sword /> : <ShellInHand />} />
      </group>
    </>
  );
};
