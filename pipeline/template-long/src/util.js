import {Easing, interpolate} from 'remotion';
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const ease = Easing.bezier(0.22, 0.61, 0.36, 1);        // smooth out
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (frame, from, dur, e = ease) => interpolate(frame, [from, from + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmtNum = (n, decimals = 0) => Number(n).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
// stable pseudo random in [0,1) from a string/number (no Math.random: frames must be deterministic)
export const rnd = (seed) => { let h = 2166136261; const s = String(seed); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };
// split text into words, mark the ones listed in accent (case-insensitive, punctuation ignored)
export const wordsWithAccent = (text, accent = []) => {
  const set = new Set((accent || []).map((a) => String(a).toLowerCase()));
  return String(text || '').split(/\s+/).filter(Boolean).map((w) => ({w, a: set.has(w.toLowerCase().replace(/[^a-z0-9$%.]/g, ''))}));
};
