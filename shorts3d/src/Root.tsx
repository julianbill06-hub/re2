import React from 'react';
import {Composition} from 'remotion';
import {Looping} from './Looping';
import timing from './timing.json';

export const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Looping"
    component={Looping}
    durationInFrames={Math.ceil(timing.duration * FPS)}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
