import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import scenesData from './scenes.json';
import timing from './timing.json';
import {FPS} from './theme.js';
import {Title, Chapter} from './scenes/Title.jsx';
import {Photo} from './scenes/Photo.jsx';
import {Stat} from './scenes/Stat.jsx';
import {Chart} from './scenes/Chart.jsx';
import {Timeline} from './scenes/Timeline.jsx';
import {MapScene} from './scenes/MapScene.jsx';
import {Headline} from './scenes/Headline.jsx';
import {Compare} from './scenes/Compare.jsx';
import {ListScene} from './scenes/ListScene.jsx';
import {Quote} from './scenes/Quote.jsx';
import {Illustration} from './scenes/Illustration.jsx';
import {EndCard} from './scenes/EndCard.jsx';
import {Grain} from './scenes/common.jsx';
import {Scene3DTrack} from './scenes/Scene3D.jsx';

export const REGISTRY = {title: Title, chapter: Chapter, photo: Photo, stat: Stat, chart: Chart, timeline: Timeline, map: MapScene, headline: Headline, compare: Compare, list: ListScene, quote: Quote, illustration: Illustration, endcard: EndCard};
const OVERLAP = 9;   // frames: a beat keeps showing this long after its end so the next one cross-fades in

const Fade = ({children, first, last}) => {
  const f = useCurrentFrame(); const {durationInFrames} = useVideoConfig();
  const a = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], {extrapolateRight: 'clamp'});
  const b = last ? 1 : interpolate(f, [durationInFrames - OVERLAP, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const s = first ? 1 : 1 + 0.08 * (1 - a);
  return <AbsoluteFill style={{opacity: Math.min(a, b), transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

// scene -> list of beats [{from, dur, visual, scene}] in frames
export const buildBeats = () => {
  const byId = {}; for (const s of timing.scenes) byId[s.id] = s;
  const out = []; const list = scenesData.scenes || [];
  list.forEach((sc, si) => {
    const tm = byId[sc.id]; if (!tm) return;
    const start = Math.round(tm.start * FPS), end = Math.round(tm.end * FPS), total = Math.max(15, end - start);
    const beats = Array.isArray(sc.visual) ? sc.visual : [sc.visual || {type: 'title', text: sc.text}];
    let cuts = beats.map((b, i) => (b.at != null ? b.at : i / beats.length));
    cuts = cuts.map((c, i) => (i === 0 ? 0 : c));
    beats.forEach((b, bi) => {
      const a = Math.round(start + total * cuts[bi]);
      const z = bi + 1 < beats.length ? Math.round(start + total * cuts[bi + 1]) : end;
      out.push({key: `${sc.id}-${bi}`, from: a, dur: Math.max(10, z - a), visual: {tone: sc.tone, ...b}, si, bi});
    });
  });
  return out;
};

export const Doc = () => {
  const beats = React.useMemo(buildBeats, []);
  // scene3d beats render through a single persistent <Scene3DTrack> (one shared WebGL context for
  // the whole video, see scenes/Scene3D.jsx) instead of per-beat <Sequence> mount/unmount - the first
  // real render of this engine (22 Nov 2026, job 013) timed out partway through because each scene3d
  // beat was mounting its own <ThreeCanvas>, churning WebGL contexts.
  const beats3d = React.useMemo(() => beats.filter((b) => b.visual.type === 'scene3d').map((b) => ({from: b.from, dur: b.dur, ...b.visual})), [beats]);
  const flatBeats = beats.filter((b) => b.visual.type !== 'scene3d');
  const lastIdx = beats.length - 1;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Scene3DTrack beats={beats3d} />
      {flatBeats.map((b) => {
        const Comp = REGISTRY[b.visual.type] || Title;
        const i = beats.indexOf(b);
        const isLast = i === lastIdx;
        return (
          <Sequence key={b.key} from={b.from} durationInFrames={b.dur + (isLast ? 0 : OVERLAP)}>
            <Fade first={i === 0} last={isLast}><Comp {...b.visual} frames={b.dur} /></Fade>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 85% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,.35) 100%)', pointerEvents: 'none'}} />
      <Grain />
    </AbsoluteFill>
  );
};
