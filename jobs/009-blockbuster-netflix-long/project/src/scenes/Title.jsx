import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease, wordsWithAccent} from '../util.js';
import {Bg, Lower, Rays, shake} from './common.jsx';
import {Cast} from './Character.jsx';

// big statement / hook. params: text, sub, accent:[words], align, tone, size, cast:[Character props + side]
// words SLAM in one by one (scale + shake), accent words get a marker highlight that wipes in behind them
export const Title = ({text, sub, accent, align = 'center', tone: tn = 'dark', size = 128, lower, cast}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const ws = wordsWithAccent(text, accent);
  const fs = ws.length > 9 ? size * 0.72 : ws.length > 5 ? size * 0.9 : size * 1.05;
  const step = 4; const lastHit = 3 + (ws.length - 1) * step;
  const hasCast = cast && cast.length;
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      {tn !== 'paper' && <Rays />}
      <AbsoluteFill style={{justifyContent: hasCast ? 'flex-start' : 'center', alignItems: align === 'left' ? 'flex-start' : 'center', padding: hasCast ? '150px 150px 0' : '0 150px', transform: shake(f, lastHit, 10, 10)}}>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'left' ? 'flex-start' : 'center', gap: `0 ${fs * 0.26}px`, maxWidth: hasCast ? 1500 : 1620, textAlign: align}}>
          {ws.map((x, i) => {
            const at = 3 + i * step; const k = prog(f, at, 6, ease);
            const sc = 1 + (1 - k) * 1.4; const hl = prog(f, lastHit + 4, 10, ease);
            return (
              <span key={i} style={{position: 'relative', display: 'inline-block', fontFamily: F.display, fontSize: fs, lineHeight: 1.12, letterSpacing: 1, color: x.a ? '#120c02' : t.fg, textTransform: 'uppercase', opacity: k, transform: `scale(${sc}) rotate(${x.a ? -2 : 0}deg)`, textShadow: x.a ? 'none' : '0 8px 30px rgba(0,0,0,.45)'}}>
                {x.a && <span style={{position: 'absolute', left: -14, right: -14, top: '12%', bottom: '6%', background: t.accent, transformOrigin: 'left', transform: `scaleX(${hl})`, zIndex: -1, borderRadius: 6, boxShadow: '0 10px 40px rgba(242,177,52,.45)'}} />}
                <span style={{position: 'relative', color: x.a ? (hl > 0.5 ? '#120c02' : t.accent) : t.fg}}>{x.w}</span>
              </span>
            );
          })}
        </div>
        {sub && <div style={{marginTop: 38, fontFamily: F.sans, fontWeight: 600, fontSize: 44, color: t.sub, opacity: prog(f, lastHit + 8, 14), textAlign: align, maxWidth: 1400}}>{sub}</div>}
      </AbsoluteFill>
      {hasCast && <Cast cast={cast} size={640} bottom={10} />}
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
