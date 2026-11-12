import React from 'react';
import {AbsoluteFill} from 'remotion';
import thumb from './thumb.json';
import {C, F} from './theme.js';
import {SafeImg, resolvedSrc} from './scenes/common.jsx';
import {Icon} from './scenes/icons.jsx';

// 1280x720 thumbnail. thumb.json: {image:{q,resolved}, icon, line1, line2, box, box_color, line_color}
export const Thumb = () => {
  const has = !!resolvedSrc(thumb.image);
  const lc = thumb.line_color || C.gold;
  const stroke = {WebkitTextStroke: '14px #0b0f1a', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,.4)'};
  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, ${C.slate}, ${C.ink})`}}>
      {has && <SafeImg image={thumb.image} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.12) saturate(1.1) brightness(.78)'}} />}
      {!has && thumb.icon && <div style={{position: 'absolute', right: 70, top: 120, opacity: 0.9}}><Icon name={thumb.icon} size={420} color={C.gold} stroke={1.1} /></div>}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,7,12,.85) 0%, rgba(5,7,12,.25) 62%, rgba(5,7,12,0) 100%)'}} />
      {thumb.box && <div style={{position: 'absolute', left: 54, top: 50, background: thumb.box_color || C.red, color: '#fff', fontFamily: F.display, fontSize: 84, padding: '6px 34px', letterSpacing: 2, textTransform: 'uppercase', transform: 'rotate(-3deg)', boxShadow: '0 12px 30px rgba(0,0,0,.5)'}}>{thumb.box}</div>}
      <div style={{position: 'absolute', left: 54, bottom: 56, maxWidth: 1000}}>
        {[thumb.line1, thumb.line2].filter(Boolean).map((l, i) => (
          <div key={i} style={{fontFamily: F.display, fontSize: i === 0 ? 150 : 128, lineHeight: 1.0, color: i === 0 ? '#fff' : lc, textTransform: 'uppercase', letterSpacing: 1, ...stroke}}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
