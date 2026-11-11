import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg, Lower} from './common.jsx';

// events on a line, appear one by one. params: title, events:[{year,label}], tone
export const Timeline = ({title, events = [], tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn); const n = Math.max(1, events.length);
  const X0 = 190, X1 = 1730, Y = 560; const step = 52 / n;
  const line = prog(f, 4, 18, ease);
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      {title && <div style={{position: 'absolute', left: 190, top: 130, fontFamily: F.display, fontSize: 68, color: t.fg, textTransform: 'uppercase', opacity: prog(f, 0, 14)}}>{title}</div>}
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <line x1={X0} x2={X0 + (X1 - X0) * line} y1={Y} y2={Y} stroke={t.line || t.card} strokeWidth="8" strokeLinecap="round" />
        {events.map((e, i) => {
          const x = n === 1 ? (X0 + X1) / 2 : X0 + (X1 - X0) * i / (n - 1); const k = prog(f, 14 + i * step, 12); const up = i % 2 === 0;
          return (
            <g key={i} opacity={k} transform={`translate(0 ${(1 - k) * 18})`}>
              <line x1={x} x2={x} y1={Y} y2={up ? Y - 120 : Y + 120} stroke={t.accent} strokeWidth="4" />
              <circle cx={x} cy={Y} r="20" fill={t.accent} stroke={t.bg} strokeWidth="6" />
              <text x={x} y={up ? Y - 150 : Y + 190} textAnchor="middle" fill={t.accent} fontFamily={F.display} fontSize="64" letterSpacing="1">{e.year}</text>
              <foreignObject x={x - 190} y={up ? Y - 330 : Y + 205} width="380" height="130"><div xmlns="http://www.w3.org/1999/xhtml" style={{fontFamily: F.sans, fontSize: 32, color: t.fg, textAlign: 'center', lineHeight: 1.2, display: 'flex', alignItems: up ? 'flex-end' : 'flex-start', justifyContent: 'center', height: '100%'}}>{e.label}</div></foreignObject>
            </g>
          );
        })}
      </svg>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
