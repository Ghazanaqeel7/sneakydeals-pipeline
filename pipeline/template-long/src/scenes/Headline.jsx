import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg, Lower} from './common.jsx';

// A news headline as OUR OWN graphic (generic paper card, no real masthead). Use for "in the news this week" hooks.
// params: kicker ("BREAKING · 10 NOV 2026"), text (the headline wording as a plain fact), source ("Reported by Reuters"), tone
export const Headline = ({kicker = 'IN THE NEWS', text = '', source, tone: tn = 'dark', lower, rotate = -2}) => {
  const f = useCurrentFrame(); const k = prog(f, 2, 20, ease); const k2 = prog(f, 14, 18);
  const fs = text.length > 90 ? 64 : text.length > 60 ? 76 : 92;
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{width: 1440, background: 'linear-gradient(180deg,#f7f0de,#ebdfc0)', color: '#15110a', padding: '56px 80px 64px', borderRadius: 6, boxShadow: '0 50px 110px rgba(0,0,0,.65)', transform: `rotate(${rotate * k}deg) translateY(${(1 - k) * 120}px) scale(${0.94 + 0.06 * k})`, opacity: k}}>
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '4px double #15110a', paddingBottom: 14, fontFamily: F.mono, fontSize: 28, letterSpacing: 4, textTransform: 'uppercase'}}><span>{kicker}</span><span>●●●</span></div>
          <div style={{fontFamily: F.serif, fontWeight: 700, fontSize: fs, lineHeight: 1.1, marginTop: 36, opacity: k2}}>{text}</div>
          {source && <div style={{marginTop: 36, fontFamily: F.sans, fontSize: 30, color: '#6b5d3e', opacity: prog(f, 28, 14)}}>{source}</div>}
        </div>
      </AbsoluteFill>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
