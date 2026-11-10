import React, {useMemo} from 'react';
import * as THREE from 'three';

// ---- cel shading: 3-step gradient + inverted-hull outline
let gradient: THREE.DataTexture | null = null;
function toonGradient() {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const INK = '#1a1320';

type MeshProps = {
  geo: THREE.BufferGeometry;
  color: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  outline?: number; // outline thickness in local units, 0 = none
};

export const Toon: React.FC<MeshProps> = ({geo, color, position, rotation, scale, outline = 0.035}) => {
  const s = typeof scale === 'number' ? [scale, scale, scale] : scale ?? [1, 1, 1];
  // outline: same geometry, back faces only, pushed out along the normals
  const hull = useMemo(() => {
    if (!outline) return null;
    const g = geo.clone();
    const pos = g.attributes.position as THREE.BufferAttribute;
    const nor = g.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) + nor.getX(i) * outline, pos.getY(i) + nor.getY(i) * outline, pos.getZ(i) + nor.getZ(i) * outline);
    }
    return g;
  }, [geo, outline]);
  return (
    <group position={position} rotation={rotation} scale={s as [number, number, number]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshToonMaterial color={color} gradientMap={toonGradient()} />
      </mesh>
      {hull ? (
        <mesh geometry={hull}>
          <meshBasicMaterial color={INK} side={THREE.BackSide} />
        </mesh>
      ) : null}
    </group>
  );
};

// shared geometries
export const G = {
  sphere: new THREE.SphereGeometry(1, 32, 24),
  capsule: new THREE.CapsuleGeometry(0.5, 0.7, 12, 24),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.12, 12, 40),
  cone: new THREE.ConeGeometry(1, 1, 20),
  halfSphere: new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
  leaf: new THREE.SphereGeometry(1, 12, 8),
};

export type Mood = 'smug' | 'grumpy' | 'happy' | 'shock';

// ---- original character: round "bean" person in a toga
export const Person: React.FC<{
  position?: [number, number, number];
  rotY?: number;
  robe: string;
  stripe: string;
  skin?: string;
  hair?: string;
  mood?: Mood;
  laurel?: boolean;
  bob?: number; // 0..1 idle bounce phase
  armWave?: number; // radians, right arm raised
  look?: [number, number];
  scale?: number;
}> = ({position = [0, 0, 0], rotY = 0, robe, stripe, skin = '#f3c9a4', hair = '#3b2618', mood = 'happy', laurel = false, bob = 0, armWave = 0, look = [0, 0], scale = 1}) => {
  const squash = 1 + 0.03 * Math.sin(bob * Math.PI * 2);
  const lidDrop = mood === 'smug' ? 0.55 : mood === 'grumpy' ? 0.45 : 0;
  const browTilt = mood === 'grumpy' ? 0.35 : mood === 'smug' ? -0.15 : mood === 'shock' ? -0.25 : 0;
  const eyeScale = mood === 'shock' ? 1.25 : 1;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[scale, scale * squash, scale]}>
      {/* feet */}
      <Toon geo={G.sphere} color="#7a4a2a" position={[-0.22, 0.08, 0.1]} scale={[0.17, 0.09, 0.24]} />
      <Toon geo={G.sphere} color="#7a4a2a" position={[0.22, 0.08, 0.1]} scale={[0.17, 0.09, 0.24]} />
      {/* body (toga) */}
      <Toon geo={G.capsule} color={robe} position={[0, 0.72, 0]} scale={[1.05, 0.95, 0.95]} />
      {/* toga sash */}
      <Toon geo={G.torus} color={stripe} position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0.55, 0]} scale={[0.56, 0.5, 0.6]} outline={0.02} />
      {/* arms: mitten hands on short sleeves */}
      <group position={[-0.55, 0.95, 0]} rotation={[0, 0, -0.35]}>
        <Toon geo={G.capsule} color={robe} position={[0, -0.18, 0]} scale={[0.32, 0.4, 0.32]} />
        <Toon geo={G.sphere} color={skin} position={[0, -0.45, 0]} scale={0.13} />
      </group>
      <group position={[0.55, 0.95, 0]} rotation={[0, 0, 0.35 + armWave]}>
        <Toon geo={G.capsule} color={robe} position={[0, -0.18, 0]} scale={[0.32, 0.4, 0.32]} />
        <Toon geo={G.sphere} color={skin} position={[0, -0.45, 0]} scale={0.13} />
      </group>
      {/* head: slightly wide oval */}
      <group position={[0, 1.72, 0]}>
        <Toon geo={G.sphere} color={skin} scale={[0.6, 0.55, 0.56]} />
        {/* ears */}
        <Toon geo={G.sphere} color={skin} position={[-0.58, -0.02, 0]} scale={[0.1, 0.14, 0.08]} outline={0.02} />
        <Toon geo={G.sphere} color={skin} position={[0.58, -0.02, 0]} scale={[0.1, 0.14, 0.08]} outline={0.02} />
        {/* hair cap */}
        <Toon geo={G.halfSphere} color={hair} position={[0, 0.06, -0.03]} scale={[0.62, 0.52, 0.58]} rotation={[-0.25, 0, 0]} />
        {/* eyes: small almond shapes, dark iris */}
        {[-0.2, 0.2].map((x, i) => (
          <group key={i} position={[x, 0.04, 0.47]}>
            <mesh scale={[0.12 * eyeScale, 0.1 * eyeScale, 0.05]}>
              <sphereGeometry args={[1, 20, 14]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[look[0] * 0.04, look[1] * 0.03, 0.04]} scale={[0.055, 0.06, 0.03]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshBasicMaterial color={INK} />
            </mesh>
            {lidDrop > 0 ? (
              <mesh position={[0, 0.1 - lidDrop * 0.1, 0.02]} scale={[0.135, 0.07, 0.06]}>
                <sphereGeometry args={[1, 16, 12]} />
                <meshToonMaterial color={skin} gradientMap={toonGradient()} />
              </mesh>
            ) : null}
            {/* brow */}
            <mesh position={[0, 0.17, 0.03]} rotation={[0, 0, (i === 0 ? -1 : 1) * browTilt]} scale={[0.14, 0.025, 0.03]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color={hair} />
            </mesh>
          </group>
        ))}
        {/* nose */}
        <Toon geo={G.sphere} color="#e8a984" position={[0, -0.1, 0.55]} scale={[0.07, 0.06, 0.05]} outline={0.015} />
        {/* mouth */}
        <mesh position={[0, -0.27, 0.5]} rotation={[0, 0, mood === 'grumpy' ? 0 : Math.PI]} scale={[0.12, mood === 'shock' ? 0.16 : 0.08, 0.05]}>
          {mood === 'shock' ? <sphereGeometry args={[0.6, 16, 12]} /> : <torusGeometry args={[1, 0.22, 8, 20, Math.PI]} />}
          <meshBasicMaterial color={mood === 'shock' ? '#6a1f2a' : INK} />
        </mesh>
        {/* laurel wreath */}
        {laurel ? (
          <group position={[0, 0.3, 0]} rotation={[-0.2, 0, 0]}>
            <Toon geo={G.torus} color="#3f8f3a" scale={[0.6, 0.6, 0.6]} rotation={[Math.PI / 2, 0, 0]} outline={0.015} />
            {Array.from({length: 14}).map((_, k) => {
              const a = (k / 14) * Math.PI * 2;
              return <Toon key={k} geo={G.leaf} color="#5fbf4f" position={[Math.cos(a) * 0.6, 0.05, Math.sin(a) * 0.6]} rotation={[0, -a, 0.6]} scale={[0.13, 0.05, 0.07]} outline={0.012} />;
            })}
          </group>
        ) : null}
      </group>
    </group>
  );
};

// ---- original character: chunky toy horse
export const Horse: React.FC<{position?: [number, number, number]; rotY?: number; chew?: number; headDip?: number; scale?: number}> = ({position = [0, 0, 0], rotY = 0, chew = 0, headDip = 0, scale = 1}) => {
  const coat = '#f6f1e7';
  const mane = '#8a5a3a';
  const gold = '#f1b733';
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {/* legs */}
      {[[-0.55, 0.32], [0.55, 0.32], [-0.55, -0.32], [0.55, -0.32]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Toon geo={G.cyl} color={coat} position={[0, 0.42, 0]} scale={[0.13, 0.84, 0.13]} />
          <Toon geo={G.cyl} color="#4a3426" position={[0, 0.06, 0]} scale={[0.15, 0.12, 0.15]} />
        </group>
      ))}
      {/* body */}
      <Toon geo={G.capsule} color={coat} position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1.05, 1.3, 1]} />
      {/* royal purple blanket with gold trim */}
      <Toon geo={G.sphere} color={gold} position={[0, 1.5, 0]} scale={[0.82, 0.2, 0.58]} outline={0.012} />
      <Toon geo={G.sphere} color="#6b2fa0" position={[0, 1.54, 0]} scale={[0.76, 0.19, 0.55]} />
      {/* tail */}
      <Toon geo={G.capsule} color={mane} position={[-1.05, 1.0, 0]} rotation={[0, 0, -0.5]} scale={[0.25, 0.6, 0.25]} />
      {/* neck + head */}
      <group position={[0.85, 1.35, 0]} rotation={[0, 0, -0.55 - headDip * 0.5]}>
        <Toon geo={G.capsule} color={coat} position={[0, 0.5, 0]} scale={[0.6, 0.85, 0.55]} />
        {/* mane */}
        {[0, 1, 2, 3].map((k) => (
          <Toon key={k} geo={G.sphere} color={mane} position={[-0.22, 0.2 + k * 0.22, 0]} scale={[0.1, 0.13, 0.12]} outline={0.015} />
        ))}
        {/* jeweled collar */}
        <Toon geo={G.torus} color={gold} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.33, 0.3, 0.6]} outline={0.015} />
        {[-0.2, 0, 0.2].map((z, k) => (
          <mesh key={k} position={[0.28, 0.25, z]} scale={0.06}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color={k === 1 ? '#3fd0ff' : '#ff3b5c'} />
          </mesh>
        ))}
        <group position={[0.12, 0.95, 0]} rotation={[0, 0, -1.9 - headDip * 0.45]}>
          <Toon geo={G.capsule} color={coat} position={[0, 0.25, 0]} scale={[0.62, 0.75, 0.55]} />
          {/* muzzle */}
          <Toon geo={G.sphere} color="#e9d9c4" position={[0, 0.62 + chew * 0.02, 0]} scale={[0.27, 0.22, 0.25]} />
          <mesh position={[0, 0.8, 0.1]} scale={0.035}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={INK} /></mesh>
          <mesh position={[0, 0.8, -0.1]} scale={0.035}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={INK} /></mesh>
          {/* eyes */}
          {[0.24, -0.24].map((z, k) => (
            <group key={k} position={[-0.17, 0.2, z]}>
              <mesh scale={[0.09, 0.1, 0.05]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#fff" /></mesh>
              <mesh position={[-0.02, 0.02, z > 0 ? 0.03 : -0.03]} scale={[0.05, 0.06, 0.03]}><sphereGeometry args={[1, 12, 10]} /><meshBasicMaterial color={INK} /></mesh>
            </group>
          ))}
          {/* ears */}
          <Toon geo={G.cone} color={coat} position={[-0.26, -0.3, 0.17]} rotation={[0, 0, Math.PI / 2 + 0.6]} scale={[0.09, 0.24, 0.09]} outline={0.015} />
          <Toon geo={G.cone} color={coat} position={[-0.26, -0.3, -0.17]} rotation={[0, 0, Math.PI / 2 + 0.6]} scale={[0.09, 0.24, 0.09]} outline={0.015} />
        </group>
      </group>
    </group>
  );
};

// ---- marble column
export const Column: React.FC<{position: [number, number, number]; h?: number}> = ({position, h = 4.2}) => (
  <group position={position}>
    <Toon geo={G.box} color="#e9e3d6" position={[0, 0.12, 0]} scale={[0.95, 0.24, 0.95]} />
    <Toon geo={G.cyl} color="#f4efe4" position={[0, h / 2, 0]} scale={[0.34, h, 0.34]} />
    <Toon geo={G.box} color="#e9e3d6" position={[0, h + 0.12, 0]} scale={[0.95, 0.24, 0.95]} />
  </group>
);
