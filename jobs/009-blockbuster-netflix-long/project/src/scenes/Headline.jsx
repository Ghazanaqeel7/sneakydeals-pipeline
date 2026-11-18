import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F} from '../theme.js';
import {prog, ease} from '../util.js';
import {Bg, Lower, Dust, shake} from './common.jsx';
import {Character} from './Character.jsx';

// A news front page as OUR OWN graphic (invented masthead, never a real paper's).
// params: kicker, text (headline as a plain fact), source (real attribution only, e.g. "Reported by Reuters"; omit if none),
//         stamp ("DEAL REJECTED", slams on at ~1 s), art: Character props for the photo box (e.g. {mood:'laugh', suit:'#1f4ea8'}),
//         caption (under the photo box), masthead (default "THE DAILY LEDGER"), tone
const isReal = (s) => s && !/reconstruct|sneaky deals|our take|illustrat/i.test(s);
export const Headline = ({kicker = 'IN THE NEWS', text = '', source, stamp, art, caption, masthead = 'The Daily Ledger', tone: tn = 'dark', lower, rotate = -2}) => {
  const f = useCurrentFrame(); const k = prog(f, 0, 12, ease); const k2 = prog(f, 8, 14);
  const stampAt = 26; const sk = prog(f, stampAt, 5, ease);
  const push = 1 + prog(f, 0, 240) * 0.06;
  const fs = text.length > 90 ? 64 : text.length > 60 ? (art ? 70 : 80) : (art ? 84 : 96);
  const bars = (n, w0) => Array.from({length: n}, (_, i) => <div key={i} style={{height: 12, width: `${w0 - ((i * 37) % 30)}%`, background: 'rgba(21,17,10,.16)', borderRadius: 3, marginBottom: 12}} />);
  return (
    <AbsoluteFill>
      <Bg tn={tn} />
      <Dust n={25} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `${stamp && f >= stampAt ? shake(f, stampAt, 22, 12) : shake(f, 10, 14, 10)} scale(${push})`}}>
        <div style={{position: 'relative', width: 1500, background: 'linear-gradient(180deg,#f8f1df,#eadcbc)', color: '#15110a', padding: '34px 70px 48px', borderRadius: 4, boxShadow: '0 60px 120px rgba(0,0,0,.7)', transform: `rotate(${rotate + (1 - k) * -14}deg) translateY(${(1 - k) * 700}px) scale(${1.25 - 0.25 * k})`, opacity: Math.min(1, k * 2)}}>
          <div style={{textAlign: 'center', fontFamily: F.serif, fontWeight: 900, fontSize: 62, letterSpacing: 1, borderBottom: '3px solid #15110a', paddingBottom: 8}}>{masthead}</div>
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '6px double #15110a', padding: '10px 0', fontFamily: F.mono, fontSize: 24, letterSpacing: 4, textTransform: 'uppercase'}}><span>{kicker}</span><span>Final edition</span></div>
          <div style={{display: 'flex', gap: 46, marginTop: 30}}>
            <div style={{flex: 1}}>
              <div style={{fontFamily: F.serif, fontWeight: 900, fontSize: fs, lineHeight: 1.04, opacity: k2}}>{text}</div>
              <div style={{marginTop: 30, columnCount: 2, columnGap: 30, opacity: prog(f, 14, 12)}}>{bars(8, 100)}</div>
            </div>
            {art && (
              <div style={{width: 430, opacity: prog(f, 10, 12)}}>
                <div style={{height: 400, background: 'radial-gradient(circle at 50% 40%, #d8ccb0, #a99877)', border: '3px solid #15110a', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', filter: 'grayscale(1) contrast(1.15)'}}>
                  <Character size={400} delay={10} {...art} label={undefined} />
                </div>
                {caption && <div style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 24, marginTop: 10, color: '#3d3322'}}>{caption}</div>}
              </div>
            )}
          </div>
          {isReal(source) && <div style={{marginTop: 18, fontFamily: F.sans, fontWeight: 600, fontSize: 24, color: '#6b5d3e', opacity: prog(f, 24, 14)}}>{source}</div>}
          {stamp && (
            <div style={{position: 'absolute', right: art ? 560 : 120, bottom: 70, transform: `rotate(-14deg) scale(${3 - 2 * sk})`, opacity: sk, border: '10px solid #d62f22', color: '#d62f22', fontFamily: F.display, fontSize: 104, letterSpacing: 6, padding: '6px 34px', textTransform: 'uppercase', mixBlendMode: 'multiply', borderRadius: 14}}>{stamp}</div>
          )}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: f >= stampAt && f < stampAt + 3 && stamp ? 0.25 : 0}} />
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
