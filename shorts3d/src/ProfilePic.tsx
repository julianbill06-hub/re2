import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Attendant, Cam, Halo} from './NightGate';

export const ProfilePic: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 46%, #2a1a10 0%, #0b0a0c 55%, #030304 100%)'}}>
    <ThreeCanvas width={1080} height={1080} dpr={2} gl={{antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5}} camera={{fov: 30, near: 0.05, far: 50}}>
      <Cam pos={[0, 2.0, 3.9]} look={[0, 2.0, 0]} fov={30} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#3a4a70', '#1a120a', 0.6]} />
      <pointLight position={[1.1, 2.7, 1.6]} color="#ff9a3c" intensity={2.2} distance={6} />
      <pointLight position={[-1.4, 2.4, 0.9]} color="#6f8cff" intensity={2.4} distance={6} />
      <directionalLight position={[0, 4, 3]} intensity={0.6} color="#ffffff" />
      <Attendant p={[0, 0, 0]} ry={0} s={0.72} glow={1.4} />
      <Halo p={[0, 1.99, 0.6]} s={0.9} color="#ffb347" o={0.45} />
    </ThreeCanvas>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,.65) 72%)'}} />
  </AbsoluteFill>
);
