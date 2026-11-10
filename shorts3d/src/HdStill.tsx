import React from 'react';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Banner, Brazier, Guard, Pillar, Roman, Steed, useTextures} from './hd';

const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  camera.updateProjectionMatrix();
  camera.lookAt(...look);
  return null;
};

export const Hall: React.FC<{t: number; cam: {pos: [number, number, number]; look: [number, number, number]; fov: number}; emperorMood?: any; senatorMood?: any; armR?: number; headDip?: number; horseMood?: any; emperorLook?: number}> = ({t, cam, emperorMood = 'grin', senatorMood = 'grumpy', armR = 0.9, headDip = 0, horseMood = 'calm', emperorLook = 0.6}) => {
  const tx = useTextures();
  return (
    <>
      <Cam {...cam} />
      <color attach="background" args={['#3a2216']} />
      <fog attach="fog" args={['#5a3520', 18, 40]} />
      <hemisphereLight args={['#fff3e0', '#8a6040', 1.25]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-5, 11, 9]} intensity={2.4} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0004} shadow-radius={6} />
      <directionalLight position={[6, 5, -8]} intensity={1.1} color="#ffb070" />
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={tx.floor} roughness={0.35} metalness={0} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 5, -9]} receiveShadow>
        <planeGeometry args={[60, 10]} />
        <meshStandardMaterial map={tx.wall} roughness={0.8} />
      </mesh>
      {[-10, -5, 0, 5, 10].map((x) => <Banner key={x} p={[x + 2.5, 7.6, -8.9]} />)}
      {[-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].map((x) => <Pillar key={x} p={[x, 0, -7.6]} h={6.6} />)}
      <Pillar p={[-5.6, 0, 1.4]} h={6.6} />
      <Pillar p={[7.4, 0, 0.6]} h={6.6} />
      <Brazier p={[-3.6, 0, -3.4]} t={t} />
      <Brazier p={[5.6, 0, -3.8]} t={t + 3} />
      {/* praetorian formation */}
      {Array.from({length: 3}).map((_, row) =>
        Array.from({length: 8}).map((__, i) => (
          <Guard key={row + '-' + i} p={[-7 + i * 1.75 + (row % 2) * 0.85, Math.max(0, Math.sin(t * 2.2 + i * 0.9 + row)) * 0.025, -6.4 + row * 1.35]} shield={tx.shield} mood={(i + row) % 4 === 1 ? 'grumpy' : 'stern'} />
        )),
      )}
      {/* rug + horse */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2 - 2.15]} position={[2.6, 0.012, 0.9]} receiveShadow>
        <planeGeometry args={[3.0, 5.6]} />
        <meshStandardMaterial map={tx.rug} roughness={0.95} />
      </mesh>
      <Steed p={[2.6, 0, 0.9]} ry={-2.15} s={1.2} headDip={headDip} mood={horseMood} />
      {/* emperor */}
      <Roman p={[-0.9, 0, 3.6]} ry={0.55} s={1.25} robe="#6a2b9e" trim="#e9b23a" mood={emperorMood} look={emperorLook} laurel armR={armR} bob={t * 0.7} hair="#2a1a10" />
      {/* senators */}
      <Roman p={[-2.7, 0, 1.0]} ry={0.45} robe="#ffffff" trim="#b8272b" robeMap={tx.toga} mood={senatorMood} bob={t * 0.6 + 0.3} hairStyle="bald" hair="#bdb6ad" skin="#e9b892" look={0.8} />
      <Roman p={[-0.4, 0, 0.4]} ry={0.25} robe="#ffffff" trim="#b8272b" robeMap={tx.toga} mood="stern" bob={t * 0.6 + 0.7} hairStyle="curly" hair="#5a3a22" skin="#f3c7a2" look={0.8} />
    </>
  );
};

export const HdStill: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#3a2216'}}>
      <ThreeCanvas width={width} height={height} shadows dpr={2} gl={{antialias: true}} camera={{fov: 40, near: 0.1, far: 100}}>
        <Hall t={frame / fps} cam={{pos: [0.3, 8.4, 11.8], look: [0.5, 1.1, -0.1], fov: 47}} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(30,12,4,.35) 100%)'}} />
    </AbsoluteFill>
  );
};
