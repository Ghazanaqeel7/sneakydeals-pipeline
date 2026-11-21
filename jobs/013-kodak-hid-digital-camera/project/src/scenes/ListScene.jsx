import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg, Lower} from './common.jsx';
import {Icon} from './icons.jsx';

// ranked / bullet list, items pop in. params: title, items:[{title,sub,icon}], numbered:true, tone
export const ListScene = ({title, items = [], numbered = true, tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn); const n = Math.max(1, items.length); const step = Math.min(18, 70 / n);
  const rowH = Math.min(170, 700 / n);
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      {title && <div style={{position: 'absolute', left: 170, top: 100, fontFamily: F.display, fontSize: 68, color: t.fg, textTransform: 'uppercase', opacity: prog(f, 0, 14)}}>{title}</div>}
      <div style={{position: 'absolute', left: 170, right: 170, top: 240}}>
        {items.map((it, i) => {
          const k = prog(f, 8 + i * step, 14, ease);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34, height: rowH, opacity: k, transform: `translateX(${(1 - k) * 90}px)`}}>
              {numbered ? <div style={{width: 96, textAlign: 'center', fontFamily: F.display, fontSize: Math.min(110, rowH * 0.75), color: t.accent}}>{i + 1}</div> : <Icon name={it.icon || 'check'} size={84} color={t.accent} />}
              <div><div style={{fontFamily: F.display, fontSize: Math.min(64, rowH * 0.42), color: t.fg, textTransform: 'uppercase', letterSpacing: 1}}>{it.title}</div>{it.sub && <div style={{fontFamily: F.sans, fontSize: Math.min(36, rowH * 0.24), color: t.sub, marginTop: 4}}>{it.sub}</div>}</div>
            </div>
          );
        })}
      </div>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
