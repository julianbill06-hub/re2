import React from 'react';
import {Composition} from 'remotion';
import {Looping} from './Looping';
import timing from './timing.json';
import {Caligula} from './Caligula';
import {HdStill} from './HdStill';
import timingCal from './timing_caligula.json';

export const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Looping"
    component={Looping}
    durationInFrames={Math.ceil(timing.duration * FPS)}
    fps={FPS}
    width={1080}
    height={1920}
  />
  <Composition id="Caligula" component={Caligula} durationInFrames={Math.ceil(timingCal.duration * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="HdStill" component={HdStill} durationInFrames={60} fps={FPS} width={1080} height={1920} />
  </>
);
