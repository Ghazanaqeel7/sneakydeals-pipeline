import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog} from '../util.js';
import {Bg} from './common.jsx';

// ONLY for a quote that is in a cited source (exact words). params: text, who, source, tone
export const Quote = ({text = '', who, source, tone: tn = 'dark'}) => {
  const f = useCurrentFrame(); const t = tone(tn); const k = prog(f, 0, 20);
  const fs = text.length > 140 ? 56 : text.length > 80 ? 70 : 88;
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 220px'}}>
        <div style={{fontFamily: F.display, fontSize: 280, lineHeight: 0.6, color: t.accent, opacity: k, alignSelf: 'flex-start', marginLeft: -40}}>“</div>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: fs, lineHeight: 1.25, color: t.fg, opacity: prog(f, 6, 18), transform: `translateY(${(1 - prog(f, 6, 18)) * 26}px)`}}>{text}</div>
        {who && <div style={{marginTop: 44, fontFamily: F.mono, fontSize: 34, letterSpacing: 4, color: t.accent, textTransform: 'uppercase', opacity: prog(f, 24, 14), alignSelf: 'flex-start'}}>— {who}{source ? <span style={{color: t.sub}}> · {source}</span> : null}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
