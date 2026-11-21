import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease, fmtNum} from '../util.js';
import {Bg, Lower} from './common.jsx';

// animated chart. params: kind:'line'|'bar', data:[{x,y}], title, unit, highlight:index, color:'accent'|'red'|'green', note, tone
export const Chart = ({kind = 'line', data = [], title, unit = '', highlight, color = 'accent', note, tone: tn = 'dark', lower, decimals = 0}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const col = color === 'red' ? '#ff5a45' : color === 'green' ? '#35d49b' : t.accent;
  const X0 = 250, X1 = 1760, Y0 = 820, Y1 = 280;           // plot box
  const ys = data.map((d) => d.y); const max = Math.max(...ys, 1) * 1.12, min = kind === 'bar' ? 0 : Math.min(0, ...ys);
  const px = (i) => data.length === 1 ? (X0 + X1) / 2 : X0 + (X1 - X0) * i / (data.length - 1);
  const py = (y) => Y0 - (Y0 - Y1) * (y - min) / (max - min || 1);
  const draw = prog(f, 6, 54, ease);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => min + (max - min) * g);
  let path = '';
  data.forEach((d, i) => { path += (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(d.y).toFixed(1); });
  const len = 4000;
  const bw = Math.min(150, (X1 - X0) / Math.max(1, data.length) * 0.62);
  return (
    <AbsoluteFill>
      <Bg tn={tn} glow={false} />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {title && <text x="250" y="170" fill={t.fg} fontFamily={F.display} fontSize="68" letterSpacing="1" style={{textTransform: 'uppercase'}} opacity={prog(f, 0, 14)}>{title}</text>}
        {unit && <text x="250" y="225" fill={t.sub} fontFamily={F.mono} fontSize="30" letterSpacing="3" opacity={prog(f, 0, 14)}>{unit}</text>}
        {grid.map((g, i) => (<g key={i} opacity={prog(f, 0, 12)}><line x1={X0} x2={X1} y1={py(g)} y2={py(g)} stroke={t.card} strokeWidth="2" /><text x={X0 - 18} y={py(g) + 10} textAnchor="end" fill={t.sub} fontFamily={F.mono} fontSize="28">{fmtNum(g, decimals)}</text></g>))}
        {kind === 'line' && <path d={path} fill="none" stroke={col} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />}
        {data.map((d, i) => {
          const appear = prog(f, 6 + (54 * i) / Math.max(1, data.length), 12);
          const isH = highlight === i;
          if (kind === 'bar') {
            const h = (Y0 - py(d.y)) * ease(prog(f, 6 + i * 4, 30));
            return (<g key={i}><rect x={px(i) - bw / 2} y={Y0 - h} width={bw} height={h} rx="8" fill={isH ? col : t.card} stroke={isH ? col : t.line} strokeWidth="2" /><text x={px(i)} y={Y0 - h - 16} textAnchor="middle" fill={t.fg} fontFamily={F.mono} fontSize="30" opacity={appear}>{fmtNum(d.y, decimals)}</text><text x={px(i)} y={Y0 + 50} textAnchor="middle" fill={t.sub} fontFamily={F.mono} fontSize="28">{d.x}</text></g>);
          }
          const show = draw * (data.length - 1) >= i - 0.01;
          return (<g key={i} opacity={show ? 1 : 0}><circle cx={px(i)} cy={py(d.y)} r={isH ? 17 : 9} fill={isH ? '#fff' : col} stroke={col} strokeWidth="5" />{(isH || data.length <= 7) && <text x={px(i)} y={py(d.y) - 28} textAnchor="middle" fill={t.fg} fontFamily={F.mono} fontSize="30">{fmtNum(d.y, decimals)}</text>}<text x={px(i)} y={Y0 + 50} textAnchor="middle" fill={t.sub} fontFamily={F.mono} fontSize="28">{d.x}</text></g>);
        })}
        {note && <text x="1760" y="960" textAnchor="end" fill={t.sub} fontFamily={F.sans} fontSize="30" opacity={prog(f, 50, 14)}>{note}</text>}
      </svg>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
