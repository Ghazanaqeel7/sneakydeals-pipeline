import React from 'react';
import {Composition, Still} from 'remotion';
import {Doc} from './Doc.jsx';
import {Thumb} from './Thumb.jsx';
import timing from './timing.json';
import {W, H, FPS} from './theme.js';
export const Root = () => (
  <>
    <Composition id="Doc" component={Doc} width={W} height={H} fps={FPS} durationInFrames={Math.max(30, Math.round(timing.duration * FPS))} />
    <Still id="Thumb" component={Thumb} width={1280} height={720} />
  </>
);
