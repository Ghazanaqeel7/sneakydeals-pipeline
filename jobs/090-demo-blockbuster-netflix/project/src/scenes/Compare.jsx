import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, tone} from '../theme.js';
import {prog, ease, fmtNum} from '../util.js';
import {Bg, Lower, Dust, shake} from './common.jsx';
import {Icon} from './icons.jsx';
import {Character} from './Character.jsx';
import {MiniStore} from './Stat.jsx';

// Split-screen A vs B with a VS badge.
// params: title, a/b: {name, color, icon (icons.jsx name or 'store'), char (Character props)},
//         rows: [{label, a, b, unit, dec, win:'a'|'b'}]  values may be numbers (count up + bars) OR short text (checks/crosses),
//         tone
const isNum = (x) => typeof x === 'number' && isFinite(x);

const Side = ({p, color, f, delay, left}) => {
  const k = prog(f, delay, 14, ease);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, flexDirection: left ? 'row' : 'row-reverse', opacity: k, transform: `translateX(${(1 - k) * (left ? -200 : 200)}px)`}}>
      <div style={{width: 150, height: 150, borderRadius: 30, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 18px 40px ${color}66`, transform: `rotate(${left ? -4 : 4}deg)`}}>
        {p.icon === 'store' ? <MiniStore w={110} a="#ffffff" b={p.accent || '#f2c230'} /> : p.char ? <Character size={150} delay={delay} {...p.char} /> : <Icon name={p.icon || 'question'} size={96} color="#fff" stroke={1.8} />}
      </div>
      <div style={{fontFamily: F.display, fontSize: 92, color, textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 6px 0 rgba(0,0,0,.08)'}}>{p.name}</div>
    </div>
  );
};

const Val = ({v, other, unit = '', dec = 0, k, color, win, align, fg}) => {
  if (isNum(v)) {
    const mx = Math.max(Math.abs(v), isNum(other) ? Math.abs(other) : 0, 1);
    return (
      <div style={{width: '100%', opacity: k, display: 'flex', flexDirection: align === 'right' ? 'row-reverse' : 'row', alignItems: 'center', gap: 18, justifyContent: 'flex-start'}}>
        <div style={{height: 70, width: `${(Math.abs(v) / mx) * 55 * k}%`, background: color, borderRadius: 10, boxShadow: `0 8px 24px ${color}55`}} />
        <span style={{fontFamily: F.display, fontSize: 84, color: fg}}>{fmtNum(v * k, dec)}{unit}</span>
      </div>
    );
  }
  const good = win == null ? null : win;
  return (
    <div style={{display: 'flex', flexDirection: align === 'right' ? 'row-reverse' : 'row', alignItems: 'center', gap: 18, opacity: k, transform: `scale(${0.8 + 0.2 * k})`}}>
      {good != null && <div style={{width: 78, height: 78, borderRadius: 39, background: good ? '#22b07d' : '#e0432f', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'}}><Icon name={good ? 'check' : 'cross'} size={54} color="#fff" stroke={3} /></div>}
      <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 68, color: fg, background: `${color}1f`, border: `3px solid ${color}`, borderRadius: 14, padding: '6px 26px'}}>{String(v)}</span>
    </div>
  );
};

export const Compare = ({title, a = {name: 'A'}, b = {name: 'B'}, rows = [], tone: tn = 'dark', lower}) => {
  const f = useCurrentFrame(); const t = tone(tn);
  const ca = a.color || t.accent, cb = b.color || '#ff5a45';
  const vs = prog(f, 12, 8, ease);
  return (
    <AbsoluteFill>
      <Bg tn={tn} glow={false} />
      <AbsoluteFill style={{background: `linear-gradient(90deg, ${ca}26 0%, ${ca}10 49.8%, ${cb}10 50.2%, ${cb}26 100%)`}} />
      <div style={{position: 'absolute', left: '50%', top: 110, bottom: 0, width: 6, marginLeft: -3, background: `linear-gradient(180deg, ${ca}, ${cb})`, transform: `scaleY(${prog(f, 4, 16, ease)})`, transformOrigin: 'top', opacity: 0.6}} />
      {tn !== 'paper' && <Dust n={20} />}
      <AbsoluteFill style={{transform: shake(f, 14, 10, 8)}}>
        {title && <div style={{position: 'absolute', left: 0, right: 0, top: 54, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: t.sub, textTransform: 'uppercase', opacity: prog(f, 0, 12)}}>{title}</div>}
        <div style={{position: 'absolute', left: 110, right: 110, top: 120, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Side p={a} color={ca} f={f} delay={2} left />
          <Side p={b} color={cb} f={f} delay={6} />
        </div>
        <div style={{position: 'absolute', left: '50%', top: 196, width: 150, height: 150, marginLeft: -75, borderRadius: 75, background: '#111', color: '#fff', fontFamily: F.display, fontSize: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${vs * (1 + 0.3 * Math.sin(prog(f, 12, 10) * Math.PI))}) rotate(${(1 - vs) * 180}deg)`, boxShadow: '0 0 0 8px #f2b134, 0 20px 50px rgba(0,0,0,.5)', zIndex: 2}}>VS</div>
        <div style={{position: 'absolute', left: 90, right: 90, top: 430}}>
          {rows.map((r, i) => {
            const at = 22 + i * 14; const k = prog(f, at, 16, ease); const kl = prog(f, at - 4, 10);
            const winA = r.win ? r.win === 'a' : null;
            return (
              <div key={i} style={{display: 'grid', gridTemplateColumns: '1fr 300px 1fr', alignItems: 'center', marginBottom: 70}}>
                <div style={{display: 'flex', justifyContent: 'flex-end', transform: `translateX(${(1 - k) * -80}px)`}}><Val v={r.a} other={r.b} unit={r.unit} dec={r.dec} k={k} color={ca} win={winA} align="right" fg={t.fg} /></div>
                <div style={{textAlign: 'center', opacity: kl}}><span style={{display: 'inline-block', fontFamily: F.mono, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: tn === 'paper' ? '#fff' : '#120c02', background: tn === 'paper' ? '#15110a' : t.accent, padding: '10px 24px', borderRadius: 30, textTransform: 'uppercase'}}>{r.label}</span></div>
                <div style={{transform: `translateX(${(1 - k) * 80}px)`}}><Val v={r.b} other={r.a} unit={r.unit} dec={r.dec} k={k} color={cb} win={winA == null ? null : !winA} align="left" fg={t.fg} /></div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Lower text={lower} tn={tn} />
    </AbsoluteFill>
  );
};
