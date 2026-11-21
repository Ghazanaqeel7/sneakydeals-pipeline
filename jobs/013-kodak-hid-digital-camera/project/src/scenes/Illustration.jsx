import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg, Lower} from './common.jsx';
import {Icon} from './icons.jsx';

// icon scene for abstract ideas. params: icons:[{name,label}], title, arrows:true, tone
export const Illustration = ({icons = [], title, arrows = true, tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn); const n = Math.max(1, icons.length);
  const size = n <= 2 ? 360 : n === 3 ? 300 : n === 4 ? 250 : 200;
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      {title && <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: F.display, fontSize: 72, color: t.fg, textTransform: 'uppercase', opacity: prog(f, 0, 14)}}>{title}</div>}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 40, paddingTop: title ? 90 : 0}}>
        {icons.map((ic, i) => {
          const k = prog(f, 4 + i * 14, 16, ease);
          return (
            <React.Fragment key={i}>
              {i > 0 && arrows && <div style={{fontFamily: F.display, fontSize: 90, color: t.sub, opacity: k}}>→</div>}
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * 50}px) scale(${0.85 + 0.15 * k})`}}>
                <div style={{width: size + 70, height: size + 70, borderRadius: 40, background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.35)'}}><Icon name={ic.name} size={size} color={ic.color || t.accent} stroke={1.3} /></div>
                {ic.label && <div style={{marginTop: 26, fontFamily: F.display, fontSize: 50, color: t.fg, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', maxWidth: size + 120}}>{ic.label}</div>}
              </div>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
