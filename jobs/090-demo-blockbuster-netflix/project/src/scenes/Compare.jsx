import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease, fmtNum} from '../util.js';
import {Bg, Lower} from './common.jsx';

// A vs B. params: title, a:{name,color}, b:{name,color}, rows:[{label,a,b,unit}] (a and b numbers), tone
export const Compare = ({title, a = {name: 'A'}, b = {name: 'B'}, rows = [], tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const ca = a.color || t.accent, cb = b.color || '#ff5a45';
  return (
    <AbsoluteFill>
      <Bg tn={tn} glow={false} />
      {title && <div style={{position: 'absolute', left: 150, top: 90, fontFamily: F.display, fontSize: 64, color: t.fg, textTransform: 'uppercase', opacity: prog(f, 0, 14)}}>{title}</div>}
      <div style={{position: 'absolute', left: 150, right: 150, top: 220, display: 'flex', justifyContent: 'space-between', fontFamily: F.display, fontSize: 70, textTransform: 'uppercase'}}>
        <span style={{color: ca, opacity: prog(f, 2, 14)}}>{a.name}</span><span style={{color: cb, opacity: prog(f, 6, 14)}}>{b.name}</span>
      </div>
      <div style={{position: 'absolute', left: 150, right: 150, top: 340}}>
        {rows.map((r, i) => {
          const k = prog(f, 14 + i * 12, 26, ease); const mx = Math.max(r.a, r.b, 1);
          return (
            <div key={i} style={{marginBottom: 46, opacity: prog(f, 12 + i * 12, 10)}}>
              <div style={{textAlign: 'center', fontFamily: F.mono, fontSize: 30, letterSpacing: 4, color: t.sub, textTransform: 'uppercase', marginBottom: 10}}>{r.label}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
                <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18}}><span style={{fontFamily: F.display, fontSize: 52, color: t.fg}}>{fmtNum(r.a * k, r.dec || 0)}{r.unit || ''}</span><div style={{height: 46, width: `${(r.a / mx) * 62 * k}%`, background: ca, borderRadius: 6}} /></div>
                <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 18}}><div style={{height: 46, width: `${(r.b / mx) * 62 * k}%`, background: cb, borderRadius: 6}} /><span style={{fontFamily: F.display, fontSize: 52, color: t.fg}}>{fmtNum(r.b * k, r.dec || 0)}{r.unit || ''}</span></div>
              </div>
            </div>
          );
        })}
      </div>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
