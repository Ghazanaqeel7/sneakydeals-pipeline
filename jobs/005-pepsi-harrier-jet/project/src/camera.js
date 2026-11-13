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
export const LIGHTS = {
  night: {sun: '#a9b8ff', si: 1.0, sky: '#4a50a0', gnd: '#2a2030', hi: 1.0, fog: '#232856', near: 120, far: 420, sunOff: [-40, 90, 50], shadow: 70, top: '#0b1030', hor: '#3e3f86', pt: null},
  day: {sun: '#fff0cf', si: 2.6, sky: '#a9d8ff', gnd: '#d9a878', hi: 1.15, fog: '#cfe7f7', near: 160, far: 650, sunOff: [-50, 90, 60], shadow: 80, top: '#3d8fe0', hor: '#cde9f8', pt: null},
  storm: {sun: '#cdd3de', si: 1.1, sky: '#8a95a6', gnd: '#4a4f58', hi: 1.0, fog: '#66738a', near: 45, far: 260, sunOff: [-40, 80, 40], shadow: 80, top: '#3c4454', hor: '#7d889a', pt: null},
  office: {sun: '#fff4e4', si: 1.6, sky: '#f4fbff', gnd: '#b48a62', hi: 1.05, fog: '#efe2cb', near: 30, far: 90, sunOff: [-6, 9, 7], shadow: 10, top: '#7fb7e6', hor: '#d6ecf6', pt: {c: '#ffc77a', i: 7, p: [-2.5, 3.6, 0.5], d: 14}},
  yard: {sun: '#ffe7bd', si: 2.5, sky: '#b5dcff', gnd: '#d1ad7c', hi: 1.15, fog: '#e2e3d4', near: 70, far: 260, sunOff: [-14, 22, 14], shadow: 20, top: '#3d8fe0', hor: '#d9ecf5', pt: null},
  joint: {sun: '#ffe0b0', si: 2.3, sky: '#c4c8dc', gnd: '#5a5662', hi: 1.3, fog: '#4a4a58', near: 30, far: 80, sunOff: [-7, 12, 9], shadow: 12, top: '#222', hor: '#333', pt: {c: '#ffb066', i: 16, p: [-3.2, 4.6, -1.5], d: 12}},
  weather: {sun: '#eef2ff', si: 1.4, sky: '#eef3f6', gnd: '#8f7b66', hi: 1.1, fog: '#e3e7e1', near: 30, far: 90, sunOff: [-6, 9, 7], shadow: 10, top: '#56606e', hor: '#9aa4b0', pt: {c: '#ffd58a', i: 5, p: [0, 3.8, 0], d: 14}},
  tv: {sun: '#fff0d8', si: 1.5, sky: '#f4fbff', gnd: '#b48a62', hi: 1.05, fog: '#efe2cb', near: 30, far: 90, sunOff: [-6, 9, 7], shadow: 10, top: '#7fb7e6', hor: '#d6ecf6', pt: {c: '#ffc77a', i: 6, p: [2.9, 1.6, -2.7], d: 10}},
  dorm: {sun: '#aab8ff', si: 0.9, sky: '#8a96d0', gnd: '#4a3a40', hi: 1.0, fog: '#2a2d50', near: 30, far: 90, sunOff: [-6, 9, 7], shadow: 10, top: '#0b1030', hor: '#3e3f86', pt: {c: '#ffc77a', i: 10, p: [-1.6, 2.0, -1.2], d: 9}},
  morning: {sun: '#ffbf7a', si: 2.5, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 160, far: 650, sunOff: [-60, 40, 50], shadow: 80, top: '#6fa6dd', hor: '#ffd3a1', pt: null},
};

const v = (a) => new THREE.Vector3(...a);
// camera plan: per shot, location light, anchor (for the light), path keys {p, l}, optional beat times
// locations: tv 0, mall 300, school 600, dorm 900, air 1200, office 1500, mail 1800, court 2100
export const PLAN = {
  hook: {light: 'tv', anchor: [0, 0, -1], keys: [{p: [0.47, 0.6, -0.8], l: [0.35, 0.53, -1.0]}, {p: [0.35, 1.05, 0.0], l: [0.0, 1.3, -3.0]}, {p: [0.15, 1.45, 0.5], l: [-0.05, 1.35, -3.0]}], beats: 'words:hook:0,4,9'},
  yousee: {light: 'office', anchor: [300, 0, 0], keys: [{p: [295.4, 2.3, 1.6], l: [294.8, 2.5, -4.9]}, {p: [296.6, 1.75, 0.9], l: [296.5, 1.55, -2.6]}, {p: [298.4, 1.75, 0.7], l: [298.5, 1.55, -2.6]}], beats: 'words:yousee:0,10,14'},
  school: {light: 'day', anchor: [600, 0, -5], keys: [{p: [603.2, 1.3, 6.5], l: [600, 8, -5]}, {p: [603.8, 1.7, 5.2], l: [600, 4, -5]}, {p: [604.2, 2.1, 4.2], l: [600, 1.6, -5]}], beats: 'words:school:0,8,15'},
  price: {light: 'tv', anchor: [0, 0, -1], keys: [{p: [-0.55, 1.5, -1.2], l: [-0.08, 1.45, -3.04]}, {p: [-0.1, 1.46, -1.3], l: [-0.08, 1.45, -3.04]}, {p: [0.3, 1.42, -1.25], l: [-0.08, 1.45, -3.04]}], beats: 'words:price:0,4,8'},
  student: {light: 'dorm', anchor: [900, 0, -1], keys: [{p: [898.0, 1.6, 0.9], l: [899.9, 1.2, -2.3]}, {p: [898.9, 1.5, 0.5], l: [900.2, 1.15, -2.2]}, {p: [899.7, 1.45, 0.4], l: [900.5, 1.15, -2.1]}]},
  rules: {light: 'dorm', anchor: [900, 0, -1], keys: [{p: [-0.95 + 900, 1.85, -1.75], l: [899.15, 1.05, -2.5]}, {p: [899.05, 1.72, -1.85], l: [899.15, 1.05, -2.5]}, {p: [899.25, 1.65, -1.9], l: [899.15, 1.05, -2.5]}], beats: 'words:rules:0,8,11'},
  math: {light: 'dorm', anchor: [900, 0, -1], keys: [{p: [901.0, 1.9, -0.6], l: [902.2, 2.2, -3.94]}, {p: [901.8, 2.05, -0.9], l: [902.3, 2.2, -3.94]}, {p: [902.5, 2.1, -1.2], l: [902.35, 2.15, -3.94]}], beats: 'words:math:0,4,11'},
  jetcost: {light: 'yard', anchor: [1200, 0, -3], keys: [{p: [1196.2, 1.6, 4.8], l: [1198.5, 1.7, -3.5]}, {p: [1199.4, 2.2, 5.6], l: [1201.5, 2.8, -2.5]}, {p: [1201.8, 2.6, 5.0], l: [1203.6, 3.1, -2.0]}], beats: 'words:jetcost:0,7,10'},
  raise: {light: 'office', anchor: [1500, 0, -1], keys: [{p: [1497.6, 1.7, 2.4], l: [1498.6, 1.3, -2.2]}, {p: [1499.4, 1.75, 1.9], l: [1499.9, 1.3, -2.2]}, {p: [1500.1, 2.0, 0.6], l: [1500.0, 1.1, -1.5]}], beats: 'words:raise:0,4,11'},
  check: {light: 'office', anchor: [1800, 0, -1], keys: [{p: [1796.0, 1.6, 2.9], l: [1797.4, 1.3, -0.3]}, {p: [1796.6, 1.55, 2.5], l: [1797.8, 1.25, -0.1]}, {p: [1797.4, 1.5, 2.2], l: [1798.2, 1.2, -0.2]}], beats: 'words:check:0,7,11'},
  but: {light: 'office', anchor: [1800, 0, -1], keys: [{p: [1797.4, 1.5, 2.2], l: [1798.2, 1.2, -0.2]}, {p: [1798.6, 1.6, 2.2], l: [1799.4, 1.5, -0.6]}, {p: [1799.8, 1.7, 1.6], l: [1800.4, 1.65, -1.0]}], beats: 'words:but:0,5,16'},
  court: {light: 'office', anchor: [2100, 0, -2], keys: [{p: [2098.2, 1.9, 3.6], l: [2099.5, 2.0, -4.0]}, {p: [2099.9, 2.0, -0.2], l: [2100.1, 1.9, -4.0]}, {p: [2101.9, 2.4, 0.4], l: [2103.8, 2.9, -5.8]}], beats: 'words:court:0,6,16'},
  close: {light: 'tv', anchor: [0, 0, -1], keys: [{p: [0.3, 1.42, -1.25], l: [-0.08, 1.45, -3.04]}, {p: [-0.05, 1.42, -1.15], l: [-0.08, 1.45, -3.04]}, {p: [0.47, 0.6, -0.8], l: [0.35, 0.53, -1.0]}], beats: 'words:close:0,10,12'},
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
const CONT = new Set(['but']); // these shots continue the previous camera move
export function dipAt(t) {
  let o = 0;
  keys.forEach((k, i) => {
    if (i === 0 || CONT.has(k)) return;
    const c = CUTS[i]; const d = Math.abs(t - c);
    if (d < 0.2) o = Math.max(o, 1 - d / 0.2);
  });
  return o;
}
