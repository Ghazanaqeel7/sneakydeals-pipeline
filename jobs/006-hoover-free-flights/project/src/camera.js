import * as THREE from 'three';
import timing from './timing.json';

// monotone cubic time warp: beat times per path key -> path position 0..1 (ease in/out)
export function warpU(T, t) {
  const n = T.length; if (t <= T[0]) return 0; if (t >= T[n - 1]) return 1;
  const sec = []; for (let i = 0; i < n - 1; i++) sec.push((1 / (n - 1)) / (T[i + 1] - T[i]));
  const m = [0]; for (let i = 1; i < n - 1; i++) m.push(2 * sec[i - 1] * sec[i] / (sec[i - 1] + sec[i])); m.push(0);
  let i = 0; while (t > T[i + 1]) i++;
  const h = T[i + 1] - T[i], x = (t - T[i]) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] + (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1];
}

const S = Object.fromEntries(timing.shots.map((s) => [s.key, s]));
const keys = timing.shots.map((s) => s.key);
// cut = midway between the end of one sentence and the start of the next
export const CUTS = keys.map((k, i) => (i === 0 ? 0 : (timing.shots[i - 1].end + timing.shots[i].start) / 2));
export const END = timing.duration;
// word time: proportional position of word index (0-based) inside a sentence
export const wordT = (key, idx) => S[key].start + (S[key].end - S[key].start) * idx / S[key].words;

// light presets
const office = {sun: '#fff4e4', si: 1.6, sky: '#f4fbff', gnd: '#b48a62', hi: 1.05, fog: '#efe2cb', near: 40, far: 120, sunOff: [-6, 9, 7], shadow: 10, top: '#7fb7e6', hor: '#d6ecf6', pt: {c: '#ffc77a', i: 7, p: [-2.5, 3.6, 0.5], d: 14}};
export const LIGHTS = {
  office,
  hall: {...office, shadow: 15, pt: {c: '#ffd9a0', i: 9, p: [0, 5, 0], d: 20}},
  board: {...office, sun: '#ffe4c0', si: 1.4, pt: {c: '#ffc77a', i: 9, p: [0, 4.6, 0], d: 16}, shadow: 12},
  fact: {sun: '#ffe0b0', si: 1.2, sky: '#aab2c4', gnd: '#5a5662', hi: 1.0, fog: '#4a4a58', near: 30, far: 90, sunOff: [-7, 12, 9], shadow: 16, top: '#222', hor: '#333', pt: {c: '#ffe7b0', i: 22, p: [0, 7, 0], d: 24}},
};

const v = (a) => new THREE.Vector3(...a);
const S0 = 0, H = 300, A = 600, B = 700, F = 800;
export const PLAN = {
  hook: {light: 'office', anchor: [S0, 0, 0], keys: [{p: [S0 - 0.3, 1.55, 3.0], l: [S0 - 0.9, 1.5, 1.2]}, {p: [S0 + 0.6, 2.0, 4.3], l: [S0 - 0.4, 1.7, 0.4]}, {p: [S0 + 1.8, 2.6, 5.0], l: [S0 - 0.6, 1.9, -2.5]}]},
  yousee: {light: 'office', anchor: [S0, 0, 0], keys: [{p: [S0 - 3.6, 1.8, 3.2], l: [S0 - 2.6, 1.3, -0.2]}, {p: [S0 - 2.8, 1.7, 3.0], l: [S0 - 2.6, 1.3, -0.2]}, {p: [S0 - 0.8, 2.0, 3.4], l: [S0 + 0.5, 2.2, -3.0]}], beats: 'words:yousee:0,6,13'},
  offer: {light: 'office', anchor: [S0, 0, 0], keys: [{p: [S0 - 2.6, 2.1, 4.8], l: [S0 + 0.2, 1.7, 1.2]}, {p: [S0 - 0.4, 2.2, 4.4], l: [S0 + 0.8, 1.9, 1.3]}, {p: [S0 + 1.4, 2.5, 4.3], l: [S0 + 0.9, 2.4, 1.2]}], beats: 'words:offer:0,4,10'},
  usa: {light: 'hall', anchor: [H, 0, 0], keys: [{p: [H - 1.0, 2.2, 5.0], l: [H, 1.8, -2.0]}, {p: [H - 3.5, 2.2, 4.2], l: [H - 6.0, 2.8, -5.5]}, {p: [H + 3.5, 2.2, 4.2], l: [H + 7.0, 2.8, -5.5]}], beats: 'words:usa:0,6,9'},
  so: {light: 'hall', anchor: [H, 0, 0], keys: [{p: [H + 3.5, 2.2, 4.2], l: [H + 7.0, 2.8, -5.5]}, {p: [H + 2.0, 2.2, 4.5], l: [H + 0.5, 4.0, -5.9]}, {p: [H - 3.0, 1.9, 4.4], l: [H - 3.5, 1.5, 1.5]}], beats: 'words:so:0,5,10'},
  but: {light: 'office', anchor: [A, 0, 0], keys: [{p: [A - 1.6, 2.5, 5.0], l: [A - 3.7, 2.0, 1.4]}, {p: [A - 3.2, 2.4, 4.8], l: [A - 3.7, 2.0, 1.4]}, {p: [A - 4.6, 2.4, 4.6], l: [A - 3.7, 2.1, 1.4]}], beats: 'words:but:0,6,12'},
  ladder: {light: 'office', anchor: [A, 0, 0], keys: [{p: [A - 2.8, 2.0, 3.6], l: [A - 2.5, 1.2, 0.5]}, {p: [A + 0.8, 2.6, 2.8], l: [A + 0.8, 2.8, -5.3]}, {p: [A + 1.0, 2.0, 2.4], l: [A + 0.8, 1.8, -5.3]}], beats: 'words:ladder:0,5,12'},
  then: {light: 'board', anchor: [B, 0, 0], keys: [{p: [B - 3.8, 2.3, 3.4], l: [B - 6.4, 3.0, -5.2]}, {p: [B + 1.0, 2.4, 4.4], l: [B + 4.8, 1.6, 0.0]}, {p: [B + 1.2, 2.2, 3.8], l: [B - 1.6, 1.3, -0.9]}], beats: 'words:then:0,4,9'},
  fall: {light: 'board', anchor: [B, 0, 0], keys: [{p: [B + 2.0, 2.6, 3.2], l: [B - 0.5, 3.2, -5.3]}, {p: [B + 0.3, 3.0, 1.8], l: [B - 0.5, 3.3, -5.35]}, {p: [B - 0.4, 3.2, 0.8], l: [B - 0.5, 3.3, -5.35]}]},
  sold: {light: 'board', anchor: [B, 0, 0], keys: [{p: [B + 1.0, 2.0, 4.2], l: [B + 3.5, 1.6, -1.0]}, {p: [B + 3.2, 2.2, 3.0], l: [B + 3.4, 2.2, -5.3]}, {p: [B + 5.0, 2.4, 3.6], l: [B + 3.9, 3.0, -5.3]}], beats: 'words:sold:0,3,7'},
  close: {light: 'fact', anchor: [F, 0, 0], keys: [{p: [F, 2.2, 2.9], l: [F, 2.2, -1]}, {p: [F + 1.0, 2.8, 6.0], l: [F, 2.2, -1.5]}, {p: [F + 1.0, 3.8, 8.0], l: [F, 3.2, -6]}], beats: 'words:close:0,5,11'},
};

// precompute curves + beat times
const CURVES = {};
keys.forEach((k, i) => {
  const P = PLAN[k];
  const a = CUTS[i], b = i + 1 < keys.length ? CUTS[i + 1] : END;
  let T;
  if (P.beats && P.beats.startsWith('words:')) {
    const [, key, idx] = P.beats.split(':');
    T = idx.split(',').map(Number).map((n) => wordT(key, n));
    T[0] = a; T[T.length - 1] = b;
  } else T = P.keys.map((_, j) => a + (b - a) * j / (P.keys.length - 1));
  CURVES[k] = {
    p: new THREE.CatmullRomCurve3(P.keys.map((q) => v(q.p)), false, 'centripetal'),
    l: new THREE.CatmullRomCurve3(P.keys.map((q) => v(q.l)), false, 'centripetal'),
    T, a, b,
  };
});

export function shotAt(t) {
  let i = 0; while (i + 1 < CUTS.length && t >= CUTS[i + 1]) i++;
  return keys[i];
}
export function cameraAt(t) {
  const k = shotAt(t); const C = CURVES[k];
  const u = warpU(C.T, t);
  return {key: k, pos: C.p.getPointAt(u), look: C.l.getPointAt(u), plan: PLAN[k], a: C.a, b: C.b};
}
// dip-to-cream opacity around location changes (0.4 s total)
const CONT = new Set(['so']); // these shots continue the previous camera move
export function dipAt(t) {
  let o = 0;
  keys.forEach((k, i) => {
    if (i === 0 || CONT.has(k)) return;
    const c = CUTS[i]; const d = Math.abs(t - c);
    if (d < 0.2) o = Math.max(o, 1 - d / 0.2);
  });
  return o;
}
