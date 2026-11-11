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
