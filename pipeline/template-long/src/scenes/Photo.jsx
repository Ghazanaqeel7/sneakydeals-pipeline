import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, tone} from '../theme.js';
import {prog, lerp, easeInOut} from '../util.js';
import {Bg, Lower, SafeImg, resolvedSrc} from './common.jsx';
import {Icon} from './icons.jsx';

const DIRS = {in: [1, 1.14, 0, 0, 0, 0], out: [1.16, 1, 0, 0, 0, 0], left: [1.12, 1.12, 40, -40, 0, 0], right: [1.12, 1.12, -40, 40, 0, 0], up: [1.12, 1.12, 0, 0, 30, -30], down: [1.12, 1.12, 0, 0, -30, 30]};

// Real photo with slow Ken Burns move. params: image:{q|file, resolved}, move:'in'|'out'|'left'|'right'|'up'|'down',
// grade:'archive'|'bw'|'none', caption, lower, fallback:{icon,label}, frame:true (white photo border)
export const Photo = ({image, move = 'in', grade = 'archive', caption, lower, fallback, frames = 150, tone: tn = 'dark', frame: framed}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig();
  const src = resolvedSrc(image);
  const d = DIRS[move] || DIRS.in; const k = prog(f, 0, Math.max(30, frames), easeInOut);
  const sc = lerp(d[0], d[1], k), tx = lerp(d[2], d[3], k), ty = lerp(d[4], d[5], k);
  const filt = grade === 'bw' ? 'grayscale(1) contrast(1.1) brightness(.95)' : grade === 'archive' ? 'sepia(.35) contrast(1.06) saturate(.9) brightness(.96)' : 'none';
  if (!src) {
    const t = tone(tn); const fb = fallback || {};
    return (
      <AbsoluteFill>
        <Bg tn={tn} />
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{opacity: prog(f, 0, 14), transform: `scale(${0.9 + 0.1 * prog(f, 0, 18)})`}}><Icon name={fb.icon || 'document'} size={300} color={t.accent} stroke={1.2} /></div>
          {fb.label && <div style={{marginTop: 30, fontFamily: F.display, fontSize: 64, color: t.fg, textTransform: 'uppercase', letterSpacing: 2}}>{fb.label}</div>}
        </AbsoluteFill>
        <Lower text={lower || caption} tn={tn} />
      </AbsoluteFill>
    );
  }
  const imgStyle = framed
    ? {position: 'absolute', left: '50%', top: '50%', height: height * 0.8, width: 'auto', maxWidth: width * 0.8, objectFit: 'contain', transform: `translate(-50%,-50%) scale(${sc}) translate(${tx}px,${ty}px)`, filter: filt, border: '14px solid #f6f1e4', boxShadow: '0 40px 90px rgba(0,0,0,.6)'}
    : {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${sc}) translate(${tx}px,${ty}px)`, filter: filt};
  return (
    <AbsoluteFill style={{background: C.black}}>
      {framed && <Bg tn={tn} />}
      <SafeImg image={image} style={imgStyle} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.55) 100%)'}} />
      <Lower text={lower || caption} tn={tn} />
    </AbsoluteFill>
  );
};
