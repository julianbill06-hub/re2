import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {interpolate, Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildCurve, loopRange} from './track';
import timing from './timing.json';

const TRACK = '#f4f1ff';
const TIE = '#7c6cff';
const CART = '#ffcf3a';

const ease = Easing.bezier(0.45, 0, 0.55, 1);

export function useStory() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [l0, l1, l2] = timing.lines;
  // morph circle -> teardrop at the start of line 2
  const morph = interpolate(t, [l2[0] - 0.2, l2[0] + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  // ride progress (0..1 along the loop) for line 1 and line 2
  const ride1 = interpolate(t, [l1[0] + 0.3, l1[1] + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ride2 = interpolate(t, [l2[0] + 1.3, l2[1] + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const riding = t < l2[0] ? ride1 : ride2;
  return {t, morph, riding, l0, l1, l2};
}

const Rig: React.FC<{t: number; l1: number[]; l2: number[]}> = ({t, l1, l2}) => {
  const {camera} = useThree();
  // wide establishing orbit -> closer, lower during the 6 g ride -> side-on for the teardrop
  const k1 = interpolate(t, [l1[0] - 0.3, l1[0] + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const k2 = interpolate(t, [l2[0] - 0.3, l2[0] + 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const ang = -0.55 + t * 0.06 + k1 * 0.35 - k2 * 0.55;
  const dist = 21 - k1 * 5 + k2 * 2;
  const h = 4.5 - k1 * 2.2 + k2 * 1.4;
  const shake = k1 * (1 - k2) * 0.05 * Math.sin(t * 47) * (t > l1[0] + 1.6 && t < l1[0] + 2.6 ? 1 : 0);
  camera.position.set(Math.sin(ang) * dist + shake, h + shake, Math.cos(ang) * dist);
  camera.lookAt(0, 3.2 - k1 * 0.6 + k2 * 0.6, 0.5);
  return null;
};

export const Scene3D: React.FC = () => {
  const {t, morph, riding, l1, l2} = useStory();
  const m = Math.round(morph * 40) / 40;
  const {rails, ties, curve, range} = useMemo(() => {
    const curve = buildCurve(m);
    const range = loopRange(curve);
    const rails = [-0.38, 0.38].map((dz) => {
      const pts = curve.getSpacedPoints(500).map((p) => p.clone().add(new THREE.Vector3(0, 0, dz)));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 500, 0.09, 10, false);
    });
    const ties: {pos: THREE.Vector3; rot: number}[] = [];
    const n = 150;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      ties.push({pos: p, rot: Math.atan2(tg.y, tg.x)});
    }
    return {rails, ties, curve, range};
  }, [m]);

  // cart on the track
  const u = range[0] - 0.08 + riding * (range[1] - range[0] + 0.16);
  const cu = Math.min(0.999, Math.max(0.001, u));
  const cp = curve.getPointAt(cu), ct = curve.getTangentAt(cu);
  const nrm = new THREE.Vector3(-ct.y, ct.x, 0).normalize();
  const cartPos = cp.clone().add(nrm.multiplyScalar(0.42));
  const cartRot = Math.atan2(ct.y, ct.x);

  return (
    <>
      <Rig t={t} l1={l1} l2={l2} />
      <color attach="background" args={['#120f2b']} />
      <fog attach="fog" args={['#120f2b', 22, 48]} />
      <hemisphereLight args={['#c9c2ff', '#1a1430', 0.9]} />
      <directionalLight position={[6, 12, 9]} intensity={1.6} />
      <pointLight position={[0, 4, 4]} intensity={30} color="#ff7ad9" distance={18} />
      {/* floor grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1b1640" roughness={1} />
      </mesh>
      <gridHelper args={[80, 40, '#3b3480', '#2a2460']} position={[0, -0.59, 0]} />
      {rails.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={TRACK} metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
      {ties.map((tie, i) => (
        <mesh key={i} position={tie.pos} rotation={[0, 0, tie.rot]}>
          <boxGeometry args={[0.12, 0.08, 0.95]} />
          <meshStandardMaterial color={TIE} roughness={0.6} />
        </mesh>
      ))}
      {/* support pillars under the approach and exit */}
      {[-12, -8, -4, 4, 8, 12].map((x) => (
        <mesh key={x} position={[x, -0.3, x > 0 ? 1.1 : 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
          <meshStandardMaterial color="#4a43a0" />
        </mesh>
      ))}
      {/* cart */}
      <group position={cartPos} rotation={[0, 0, cartRot]}>
        <mesh>
          <boxGeometry args={[1.1, 0.5, 0.9]} />
          <meshStandardMaterial color={CART} metalness={0.2} roughness={0.35} />
        </mesh>
        <mesh position={[0.15, 0.35, 0]}>
          <boxGeometry args={[0.5, 0.25, 0.8]} />
          <meshStandardMaterial color="#ff6b5b" />
        </mesh>
        <mesh position={[-0.2, 0.55, 0]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshStandardMaterial color="#ffd6b0" />
        </mesh>
      </group>
    </>
  );
};
