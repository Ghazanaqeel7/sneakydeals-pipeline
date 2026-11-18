import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {geoAlbersUsa, geoNaturalEarth1, geoPath, geoInterpolate} from 'd3-geo';
import {feature} from 'topojson-client';
import usTopo from 'us-atlas/states-10m.json';
import worldTopo from 'world-atlas/countries-110m.json';
import {F, tone} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg, Lower} from './common.jsx';

const US = feature(usTopo, usTopo.objects.states).features;
const WORLD = feature(worldTopo, worldTopo.objects.countries).features;
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// Animated map. params: region:'us'|'world', highlight:['Texas','France'], pins:[{lon,lat,label}], arcs:[{from:[lon,lat],to:[lon,lat],label}], title, tone
export const MapScene = ({region = 'us', highlight = [], pins = [], arcs = [], title, tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const {proj, shapes} = useMemo(() => {
    const p = region === 'world' ? geoNaturalEarth1().fitExtent([[120, 150], [1800, 1000]], {type: 'FeatureCollection', features: WORLD}) : geoAlbersUsa().fitExtent([[190, 150], [1730, 1000]], {type: 'FeatureCollection', features: US});
    return {proj: p, shapes: region === 'world' ? WORLD : US};
  }, [region]);
  const path = useMemo(() => geoPath(proj), [proj]);
  const hi = new Set(highlight.map(norm));
  const place = (c) => proj(c);
  return (
    <AbsoluteFill>
      <Bg tn={tn} glow={false} />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <g opacity={prog(f, 0, 16)}>
          {shapes.map((s, i) => {
            const on = hi.has(norm(s.properties.name));
            const k = on ? prog(f, 10, 22) : 0;
            return <path key={i} d={path(s)} fill={on ? t.accent : t.card} fillOpacity={on ? 0.35 + 0.65 * k : 1} stroke={t.bg} strokeWidth={region === 'world' ? 1 : 1.6} />;
          })}
        </g>
        {arcs.map((a, i) => {
          const A = place(a.from), B = place(a.to); if (!A || !B) return null;
          const k = prog(f, 22 + i * 14, 34, ease); const mx = (A[0] + B[0]) / 2, my = Math.min(A[1], B[1]) - Math.hypot(A[0] - B[0], A[1] - B[1]) * 0.25;
          const d = `M${A[0]} ${A[1]} Q${mx} ${my} ${B[0]} ${B[1]}`;
          return (<g key={i}><path d={d} fill="none" stroke={t.accent} strokeWidth="6" strokeDasharray="1200" strokeDashoffset={1200 * (1 - k)} strokeLinecap="round" opacity={0.9} />{a.label && <text x={mx} y={my - 16} textAnchor="middle" fill={t.fg} fontFamily={F.sans} fontSize="30" opacity={k}>{a.label}</text>}</g>);
        })}
        {pins.map((p, i) => {
          const P = place([p.lon, p.lat]); if (!P) return null; const k = prog(f, 16 + i * 10, 12); const pulse = (f % 45) / 45;
          return (
            <g key={i} opacity={k}>
              <circle cx={P[0]} cy={P[1]} r={14 + 34 * pulse} fill="none" stroke={t.accent} strokeWidth="4" opacity={1 - pulse} />
              <circle cx={P[0]} cy={P[1]} r="14" fill={t.accent} stroke="#fff" strokeWidth="4" />
              {p.label && <text x={P[0] + 26} y={P[1] + 10} fill={t.fg} fontFamily={F.display} fontSize="40" letterSpacing="1" stroke={t.bg} strokeWidth="8" paintOrder="stroke" style={{textTransform: 'uppercase'}}>{p.label}</text>}
            </g>
          );
        })}
        {title && <text x="190" y="110" fill={t.fg} fontFamily={F.display} fontSize="64" letterSpacing="1" style={{textTransform: 'uppercase'}} opacity={prog(f, 0, 14)}>{title}</text>}
      </svg>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
