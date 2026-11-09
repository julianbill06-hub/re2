import React from 'react';
import {Composition} from 'remotion';
import {Looping} from './Looping';
import timing from './timing.json';
import {Caligula} from './Caligula';
import {HdStill} from './HdStill';
import {CaligulaEN} from './CaligulaEN';
import {OceanWar} from './OceanWar';
import {Ocean60, OCEAN60_DURATION} from './Ocean60';
import {Flowers, FLOWERS_DURATION} from './Flowers';
import timingOcean from './timing_ocean.json';
import timingEn from './timing_en.json';
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
  <Composition id="CaligulaEN" component={CaligulaEN} durationInFrames={Math.ceil(timingEn.duration * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="OceanWar" component={OceanWar} durationInFrames={Math.ceil(timingOcean.duration * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="Ocean60" component={Ocean60} durationInFrames={Math.ceil(OCEAN60_DURATION * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="Flowers" component={Flowers} durationInFrames={Math.ceil(FLOWERS_DURATION * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
