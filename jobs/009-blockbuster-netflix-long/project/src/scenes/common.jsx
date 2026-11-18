import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, F, tone} from '../theme.js';
import {prog, ease} from '../util.js';

// full-frame background of a scene (tone decides colour); soft moving glow so flat scenes are never static
export const Bg = ({tn = 'dark', glow = true}) => {
  const t = tone(tn); const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 140) * 12, y = 40 + Math.cos(f / 170) * 10;
  return (
    <AbsoluteFill style={{background: t.bg}}>
      {glow && <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at ${x}% ${y}%, ${tn === 'paper' ? 'rgba(255,255,255,.55)' : 'rgba(80,110,190,.20)'} 0%, rgba(0,0,0,0) 70%)`}} />}
    </AbsoluteFill>
  );
};

// small key phrase bar at the bottom-left, slides in
export const Lower = ({text, tn = 'dark', delay = 6}) => {
  const f = useCurrentFrame(); if (!text) return null;
  const k = prog(f, delay, 14); const t = tone(tn);
  return (
    <div style={{position: 'absolute', left: 90, bottom: 86, transform: `translateX(${(1 - k) * -60}px)`, opacity: k}}>
      <div style={{display: 'inline-block', background: t.accent, color: tn === 'paper' ? '#fff' : '#1a1203', fontFamily: F.display, fontSize: 40, letterSpacing: 1.5, padding: '10px 26px', textTransform: 'uppercase', boxShadow: '0 10px 30px rgba(0,0,0,.35)'}}>{text}</div>
    </div>
  );
};

// local image from the resolved asset (fetch_assets.py fills image.resolved); returns null if missing
export const resolvedSrc = (image) => (image && image.resolved && image.resolved.file ? staticFile(image.resolved.file) : null);
export const SafeImg = ({image, style}) => {
  const src = resolvedSrc(image);
  if (!src) return null;
  return <Img src={src} style={style} />;
};

// ---- motion FX shared by scenes ----
// camera shake that decays after `at` (frames). returns css transform string
export const shake = (f, at, power = 18, len = 12) => {
  const t = f - at; if (t < 0 || t > len) return 'translate(0px,0px)';
  const k = (1 - t / len) * power;
  return `translate(${Math.sin(t * 2.7) * k}px, ${Math.cos(t * 3.1) * k * 0.7}px)`;
};

// slow rotating light rays + floating dust; makes flat dark scenes feel alive
export const Rays = ({color = 'rgba(242,177,52,.10)', cx = 50, cy = 45}) => {
  const f = useCurrentFrame(); const rot = f * 0.12;
  const rays = Array.from({length: 14}, (_, i) => `${color} ${i * (360 / 14)}deg ${i * (360 / 14) + 9}deg, transparent ${i * (360 / 14) + 9}deg ${(i + 1) * (360 / 14)}deg`).join(',');
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 3200, height: 3200, marginLeft: -1600, marginTop: -1600, background: `conic-gradient(from ${rot}deg, ${rays})`, maskImage: 'radial-gradient(circle, #000 0%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 55%)'}} />
      <Dust />
    </AbsoluteFill>
  );
};

export const Dust = ({n = 40, color = 'rgba(255,255,255,.35)'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: n}, (_, i) => {
        const r1 = (Math.sin(i * 91.7) + 1) / 2, r2 = (Math.sin(i * 37.3) + 1) / 2, r3 = (Math.sin(i * 13.1) + 1) / 2;
        const x = (r1 * 1920 + f * (0.3 + r3)) % 1960 - 20, y = (r2 * 1080 - f * (0.4 + r3 * 0.8) + 2000) % 1100 - 10;
        const s = 2 + r3 * 4;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: 0.3 + 0.5 * Math.abs(Math.sin((f + i * 20) / 30))}} />;
      })}
    </AbsoluteFill>
  );
};

// film grain + vignette over the whole film (deterministic noise seed per frame)
export const Grain = ({opacity = 0.09}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width="1920" height="1080"><filter id={`g${f % 6}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 6} /></filter><rect width="1920" height="1080" filter={`url(#g${f % 6})`} /></svg>
    </AbsoluteFill>
  );
};
