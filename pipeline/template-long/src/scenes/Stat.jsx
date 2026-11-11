import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease, fmtNum, lerp} from '../util.js';
import {Bg, Lower} from './common.jsx';

// big number counting up. params: from, to, prefix, suffix, decimals, label, sub, color:'accent'|'red'|'green', tone
export const Stat = ({from = 0, to = 0, prefix = '', suffix = '', decimals = 0, label, sub, color = 'accent', tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const k = prog(f, 4, 48, ease); const v = lerp(from, to, k);
  const col = color === 'red' ? '#ff5a45' : color === 'green' ? '#35d49b' : t.accent;
  const pop = 1 + 0.04 * Math.sin(Math.min(1, prog(f, 50, 10)) * Math.PI);
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        {label && <div style={{fontFamily: F.mono, fontSize: 40, letterSpacing: 6, color: t.sub, textTransform: 'uppercase', marginBottom: 20, opacity: prog(f, 0, 14)}}>{label}</div>}
        <div style={{fontFamily: F.display, fontSize: 330, lineHeight: 1, color: col, transform: `scale(${pop})`, textShadow: '0 12px 50px rgba(0,0,0,.35)', letterSpacing: 2}}>{prefix}{fmtNum(v, decimals)}{suffix}</div>
        {sub && <div style={{marginTop: 30, fontFamily: F.sans, fontSize: 48, color: t.fg, opacity: prog(f, 36, 16), maxWidth: 1400, textAlign: 'center'}}>{sub}</div>}
      </AbsoluteFill>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
