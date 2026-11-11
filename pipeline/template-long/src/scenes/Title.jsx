import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, wordsWithAccent} from '../util.js';
import {Bg, Lower} from './common.jsx';

// big statement. params: text, sub, accent:[words], align:'center'|'left', tone, size
export const Title = ({text, sub, accent, align = 'center', tone: tn = 'dark', size = 128, lower}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const ws = wordsWithAccent(text, accent);
  const fs = ws.length > 9 ? size * 0.72 : ws.length > 5 ? size * 0.88 : size;
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: align === 'left' ? 'flex-start' : 'center', padding: '0 150px'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'left' ? 'flex-start' : 'center', gap: `0 ${fs * 0.28}px`, maxWidth: 1620, textAlign: align}}>
          {ws.map((x, i) => {
            const k = prog(f, 4 + i * 3, 12);
            return <span key={i} style={{fontFamily: F.display, fontSize: fs, lineHeight: 1.08, letterSpacing: 1, color: x.a ? t.accent : t.fg, textTransform: 'uppercase', opacity: k, transform: `translateY(${(1 - k) * 36}px)`, display: 'inline-block'}}>{x.w}</span>;
          })}
        </div>
        {sub && <div style={{marginTop: 38, fontFamily: F.sans, fontSize: 44, color: t.sub, opacity: prog(f, 4 + ws.length * 3 + 6, 14), textAlign: align, maxWidth: 1400}}>{sub}</div>}
      </AbsoluteFill>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};

// chapter card. params: number, title, tone
export const Chapter = ({number, title, tone: tn = 'dark'}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const k = prog(f, 0, 18), k2 = prog(f, 10, 16), line = prog(f, 4, 22);
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        {number != null && <div style={{fontFamily: F.mono, fontSize: 36, letterSpacing: 10, color: t.accent, opacity: k, textTransform: 'uppercase'}}>Part {number}</div>}
        <div style={{width: 420 * line, height: 4, background: t.accent, margin: '26px 0'}} />
        <div style={{fontFamily: F.display, fontSize: 118, color: t.fg, textTransform: 'uppercase', letterSpacing: 2, opacity: k2, transform: `translateY(${(1 - k2) * 30}px)`, textAlign: 'center', padding: '0 120px', lineHeight: 1.05}}>{title}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
