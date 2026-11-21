import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease, fmtNum, lerp} from '../util.js';
import {Bg, Lower, Rays, shake} from './common.jsx';
import {Icon} from './icons.jsx';
import {Cast} from './Character.jsx';

// little cartoon shop (own drawing): striped awning in the given colours
export const MiniStore = ({w = 90, a = '#1f4ea8', b = '#f2c230', sign}) => (
  <svg width={w} height={w * 0.9} viewBox="0 0 100 90">
    <rect x="10" y="30" width="80" height="58" rx="3" fill="#f4efe6" />
    <rect x="6" y="22" width="88" height="12" rx="2" fill={a} />
    {Array.from({length: 6}, (_, i) => <path key={i} d={`M${8 + i * 14.4} 34 h14.4 v8 a7.2 7.2 0 0 1 -14.4 0z`} fill={i % 2 ? b : a} />)}
    <rect x="18" y="52" width="30" height="22" rx="2" fill="#9fd3ff" /><rect x="58" y="52" width="22" height="36" rx="2" fill={a} />
    <circle cx="75" cy="70" r="2" fill={b} />
    <rect x="6" y="86" width="88" height="4" fill="rgba(0,0,0,.25)" />
  </svg>
);

// big number counting up, optionally over a swarm of icons that pop in as it counts (the count made visible).
// params: from, to, prefix, suffix, decimals, label, sub, color, tone,
//         icon ('store' draws cartoon shops; any icons.jsx name otherwise), swarm (how many icons, default 96),
//         brand: {a, b} colours for shops, per ("1 icon = 100 stores" note), cast
export const Stat = ({from = 0, to = 0, prefix = '', suffix = '', decimals = 0, label, sub, color = 'accent', tone: tn = 'dark', lower, icon, swarm = 96, brand = {}, per, cast}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const k = prog(f, 4, 54, ease); const v = lerp(from, to, k);
  const col = color === 'red' ? '#ff5a45' : color === 'green' ? '#35d49b' : t.accent;
  const done = 58; const pop = 1 + 0.08 * Math.sin(prog(f, done, 8) * Math.PI);
  const cols = 16, rows = Math.ceil(swarm / cols), cell = 1920 / cols;
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      {!icon && <Rays color="rgba(120,160,255,.08)" />}
      {icon && (
        <AbsoluteFill style={{opacity: 0.9}}>
          {Array.from({length: swarm}, (_, i) => {
            const r = Math.floor(i / cols), c = i % cols;
            const order = ((i * 47) % swarm) / swarm;           // scattered pop-in order
            const at = 4 + order * 50; const p = prog(f, at, 8, ease);
            const x = c * cell + (r % 2 ? cell / 2 : 0) - 20, y = 60 + r * (1000 / rows);
            const dist = Math.hypot(x + cell / 2 - 960, y - 520) / 900;
            return (
              <div key={i} style={{position: 'absolute', left: x, top: y, transform: `scale(${p * (1.15 - 0.2 * p)})`, opacity: p * (0.25 + 0.75 * Math.min(1, dist))}}>
                {icon === 'store' ? <MiniStore w={cell * 0.78} a={brand.a} b={brand.b} /> : <Icon name={icon} size={cell * 0.7} color={col} stroke={1.6} />}
              </div>
            );
          })}
          <AbsoluteFill style={{background: `radial-gradient(ellipse 48% 42% at 50% 50%, ${t.bg}f2 0%, ${t.bg}c0 55%, ${t.bg}00 100%)`}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: shake(f, done, 12, 10)}}>
        {label && <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 38, letterSpacing: 8, color: t.sub, textTransform: 'uppercase', marginBottom: 6, opacity: prog(f, 0, 14)}}>{label}</div>}
        <div style={{fontFamily: F.display, fontSize: 300, lineHeight: 1.05, transform: `scale(${pop})`, letterSpacing: 2, background: `linear-gradient(180deg, #fff 0%, ${col} 70%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 14px 40px rgba(0,0,0,.6)) drop-shadow(0 0 30px ${col}55)`}}>{prefix}{fmtNum(v, decimals)}{suffix}</div>
        {sub && <div style={{marginTop: 16, fontFamily: F.sans, fontWeight: 800, fontSize: 46, color: t.fg, opacity: prog(f, 40, 16), maxWidth: 1400, textAlign: 'center', background: 'rgba(0,0,0,.35)', padding: '8px 28px', borderRadius: 10}}>{sub}</div>}
        {per && <div style={{marginTop: 18, fontFamily: F.mono, fontSize: 26, color: t.sub, opacity: prog(f, 50, 12)}}>{per}</div>}
      </AbsoluteFill>
      {cast && <Cast cast={cast} size={420} />}
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
