import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg} from './common.jsx';

// last scene. params: title ("Next: ..."), sub
export const EndCard = ({title = 'A new sneaky deal every week', sub = 'Subscribe to Sneaky Deals', tone: tn = 'dark'}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: F.display, fontSize: 96, color: t.fg, textTransform: 'uppercase', textAlign: 'center', padding: '0 160px', opacity: prog(f, 0, 16), transform: `translateY(${(1 - prog(f, 0, 16)) * 30}px)`}}>{title}</div>
        <div style={{marginTop: 48, fontFamily: F.display, fontSize: 56, background: t.accent, color: '#1a1203', padding: '14px 44px', borderRadius: 12, textTransform: 'uppercase', opacity: prog(f, 14, 14), transform: `scale(${0.8 + 0.2 * ease(prog(f, 14, 14))})`}}>{sub}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
