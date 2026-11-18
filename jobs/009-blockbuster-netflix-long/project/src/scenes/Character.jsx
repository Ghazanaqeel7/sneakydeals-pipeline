import React from 'react';
import {useCurrentFrame} from 'remotion';
import {F} from '../theme.js';
import {prog, ease, rnd} from '../util.js';

// Original cartoon cast member (generic, never a real person's likeness).
// props: mood 'laugh'|'smug'|'shock'|'worried'|'talk'|'happy'|'angry', outfit 'suit'|'hoodie',
//        suit/tie/skin/hair colours, label (name tag under the feet), size (px height), flip, delay (frames), seed
const MOODS = {
  laugh: {brow: [-8, 8], browY: -4, mouth: 'laugh', eye: 'squint'},
  smug: {brow: [10, -4], browY: 0, mouth: 'smirk', eye: 'half'},
  shock: {brow: [-4, 4], browY: -12, mouth: 'o', eye: 'wide'},
  worried: {brow: [-14, 14], browY: -6, mouth: 'frown', eye: 'open'},
  talk: {brow: [0, 0], browY: -2, mouth: 'talk', eye: 'open'},
  happy: {brow: [-4, 4], browY: -4, mouth: 'smile', eye: 'open'},
  angry: {brow: [16, -16], browY: 2, mouth: 'grit', eye: 'open'},
};

export const Character = ({mood = 'talk', outfit = 'suit', suit = '#1f2a44', tie = '#e0432f', skin = '#f1c8a2', hair = '#2b1d14', label, labelColor = '#f2b134', size = 520, flip = false, delay = 0, seed = 1}) => {
  const f0 = useCurrentFrame(); const f = f0 - delay;
  const m = MOODS[mood] || MOODS.talk;
  const enter = prog(f, 0, 16, ease);
  const ph = rnd(seed) * 100;
  const bob = Math.sin((f + ph) / 9) * 3;
  const laughShake = mood === 'laugh' ? Math.sin(f * 1.6) * 4 : 0;
  const tilt = mood === 'laugh' ? -6 + Math.sin(f * 0.8) * 3 : mood === 'shock' ? 0 : Math.sin((f + ph) / 30) * 2;
  const blink = ((f + Math.round(ph)) % 96) < 4 && m.eye !== 'squint';
  const talkOpen = mood === 'talk' ? 4 + Math.abs(Math.sin(f * 0.55)) * 12 : 0;
  const darker = 'rgba(0,0,0,.22)';

  const eyes = [80, 120].map((x, i) => {
    if (blink || m.eye === 'squint') return <path key={i} d={`M${x - 10} 102 Q${x} ${m.eye === 'squint' ? 94 : 104} ${x + 10} 102`} stroke="#1a1410" strokeWidth="4" fill="none" strokeLinecap="round" />;
    const ry = m.eye === 'wide' ? 14 : m.eye === 'half' ? 6 : 11;
    return (
      <g key={i}>
        <ellipse cx={x} cy={102} rx={m.eye === 'wide' ? 12 : 10} ry={ry} fill="#fff" />
        <circle cx={x + (flip ? -2 : 2)} cy={103} r={m.eye === 'wide' ? 4 : 5} fill="#1a1410" />
        {m.eye === 'half' && <rect x={x - 12} y={93} width={24} height={9} fill={skin} />}
      </g>
    );
  });
  const brows = [80, 120].map((x, i) => (
    <line key={i} x1={x - 12} x2={x + 12} y1={86 + m.browY} y2={86 + m.browY} stroke={hair} strokeWidth="6" strokeLinecap="round" transform={`rotate(${m.brow[i]} ${x} ${86 + m.browY})`} />
  ));
  let mouth;
  switch (m.mouth) {
    case 'laugh': mouth = <g><path d="M76 128 Q100 168 124 128 Z" fill="#3a1410" /><path d="M78 129 L122 129 L119 136 L81 136 Z" fill="#fff" /><ellipse cx="100" cy="152" rx="10" ry="5" fill="#e0675a" /></g>; break;
    case 'smirk': mouth = <path d="M84 138 Q102 146 120 130" stroke="#3a1410" strokeWidth="5" fill="none" strokeLinecap="round" />; break;
    case 'o': mouth = <ellipse cx="100" cy="140" rx="10" ry="14" fill="#3a1410" />; break;
    case 'frown': mouth = <path d="M84 144 Q100 132 116 144" stroke="#3a1410" strokeWidth="5" fill="none" strokeLinecap="round" />; break;
    case 'smile': mouth = <path d="M82 132 Q100 152 118 132" stroke="#3a1410" strokeWidth="5" fill="none" strokeLinecap="round" />; break;
    case 'grit': mouth = <g><rect x="82" y="132" width="36" height="12" rx="3" fill="#fff" stroke="#3a1410" strokeWidth="3" /><path d="M94 132v12M106 132v12" stroke="#3a1410" strokeWidth="2" /></g>; break;
    default: mouth = <ellipse cx="100" cy="138" rx="12" ry={talkOpen / 2 + 2} fill="#3a1410" />;
  }

  const body = outfit === 'hoodie' ? (
    <g>
      <path d="M38 300 L48 196 Q100 168 152 196 L162 300 Z" fill={suit} />
      <path d="M70 178 Q100 214 130 178" stroke={darker} strokeWidth="10" fill="none" />
      <path d="M92 196 L90 236 M108 196 L110 236" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <rect x="72" y="250" width="56" height="30" rx="8" fill={darker} />
    </g>
  ) : (
    <g>
      <path d="M38 300 L48 196 Q100 168 152 196 L162 300 Z" fill={suit} />
      <path d="M84 178 L100 236 L116 178 Z" fill="#fff" />
      <path d="M96 186 L104 186 L109 238 L100 252 L91 238 Z" fill={tie} />
      <path d="M84 178 L70 196 L92 230 L100 236 Z" fill={darker} />
      <path d="M116 178 L130 196 L108 230 L100 236 Z" fill={darker} />
    </g>
  );
  const armL = mood === 'laugh' ? 'M52 206 Q40 250 84 262' : mood === 'shock' ? 'M52 206 Q30 160 52 120' : 'M52 206 Q36 250 46 290';
  const armR = mood === 'laugh' ? 'M148 206 Q168 240 120 262' : mood === 'shock' ? 'M148 206 Q170 160 148 120' : mood === 'talk' ? `M148 206 Q178 ${200 + Math.sin(f / 6) * 10} 172 ${170 + Math.sin(f / 6) * 12}` : 'M148 206 Q164 250 154 290';
  const handAt = (d) => { const p = d.trim().split(/\s+/).slice(-2); return p.map(Number); };

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: enter, transform: `translateY(${(1 - enter) * 120 + bob}px) translateX(${laughShake}px)`}}>
      <svg width={size * 200 / 300} height={size} viewBox="0 0 200 300" style={{overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined}}>
        <ellipse cx="100" cy="298" rx="70" ry="8" fill="rgba(0,0,0,.25)" />
        {body}
        {[armL, armR].map((d, i) => { const [hx, hy] = handAt(d); return <g key={i}><path d={d} stroke={suit} strokeWidth="20" fill="none" strokeLinecap="round" /><circle cx={hx} cy={hy} r="11" fill={skin} /></g>; })}
        <g transform={`rotate(${tilt} 100 170)`}>
          <rect x="88" y="150" width="24" height="32" fill={skin} />
          <circle cx="48" cy="108" r="10" fill={skin} /><circle cx="152" cy="108" r="10" fill={skin} />
          <ellipse cx="100" cy="106" rx="52" ry="58" fill={skin} />
          <path d="M48 98 Q46 44 100 44 Q156 44 152 98 Q140 66 100 64 Q66 64 48 98 Z" fill={hair} />
          <ellipse cx="72" cy="124" rx="9" ry="5" fill="rgba(230,110,90,.35)" /><ellipse cx="128" cy="124" rx="9" ry="5" fill="rgba(230,110,90,.35)" />
          {brows}{eyes}{mouth}
          {mood === 'shock' && <g fill="#9fd3ff">{[0, 1].map((i) => <path key={i} d={`M${150 + i * 10} ${70 + i * 8} q4 8 0 12 q-4 -4 0 -12z`} />)}</g>}
        </g>
      </svg>
      {label && <div style={{marginTop: 10, background: labelColor, color: '#120c02', fontFamily: F.display, fontSize: size * 0.07, letterSpacing: 1.5, padding: '6px 18px', textTransform: 'uppercase', borderRadius: 6, boxShadow: '0 8px 20px rgba(0,0,0,.35)', whiteSpace: 'nowrap'}}>{label}</div>}
    </div>
  );
};

// cast placed at the sides/bottom of a scene. cast: [{side:'left'|'right'|'center', ...Character props}]
export const Cast = ({cast = [], size = 520, bottom = 40}) => (
  <>
    {cast.map((c, i) => {
      const side = c.side || (i % 2 ? 'right' : 'left');
      const pos = side === 'left' ? {left: 70} : side === 'right' ? {right: 70} : {left: '50%', transform: 'translateX(-50%)'};
      return <div key={i} style={{position: 'absolute', bottom, ...pos}}><Character size={c.size || size} delay={c.delay != null ? c.delay : 8 + i * 6} seed={i + 1} flip={side === 'right'} {...c} /></div>;
    })}
  </>
);
