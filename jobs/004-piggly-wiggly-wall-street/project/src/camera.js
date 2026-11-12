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
  swamp: {sun: '#fff0cf', si: 2.4, sky: '#bfe3d0', gnd: '#7a7a45', hi: 1.15, fog: '#d8e8d8', near: 45, far: 260, sunOff: [-50, 90, 60], shadow: 40, top: '#4a9ad8', hor: '#d6ecd8', pt: null},
  dusk: {sun: '#ffb88a', si: 2.1, sky: '#c4a8e0', gnd: '#7a5a70', hi: 1.45, fog: '#c48aa0', near: 70, far: 330, sunOff: [-40, 30, 50], shadow: 40, top: '#3a3a7a', hor: '#ffb07a', pt: null},
  stage: {sun: '#ffe0b0', si: 2.3, sky: '#d4d8ec', gnd: '#6a6672', hi: 1.75, fog: '#3f3a5a', near: 30, far: 90, sunOff: [-7, 12, 9], shadow: 14, top: '#222', hor: '#333', pt: {c: '#ffd27a', i: 14, p: [0, 5, -1.6], d: 14}},
  morning: {sun: '#ffbf7a', si: 2.5, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 160, far: 650, sunOff: [-60, 40, 50], shadow: 80, top: '#6fa6dd', hor: '#ffd3a1', pt: null},
};

const v = (a) => new THREE.Vector3(...a);
// camera plan: per shot, location light, anchor (for the light), path keys {p, l}, optional beat times
export const PLAN = {
  hook: {light: 'day', anchor: [1500, 0, 5], keys: [{p: [1499.25, 1.75, 5.85], l: [1498.4, 1.35, 5.0]}, {p: [1499.6, 2.0, 8.6], l: [1499.0, 1.7, 4.6]}, {p: [1500.9, 2.6, 11.6], l: [1500.6, 3.6, 3.5]}], beats: 'words:hook:0,4,9'},
  yousee: {light: 'day', anchor: [1800, 0, 5], keys: [{p: [1795.0, 1.9, 11.2], l: [1798.0, 2.0, 4.0]}, {p: [1798.4, 2.3, 10.0], l: [1800.0, 2.8, 4.0]}, {p: [1800.4, 2.1, 9.8], l: [1800.3, 2.5, 4.0]}], beats: 'words:yousee:0,7,14'},
  before: {light: 'office', anchor: [200, 0, -1], keys: [{p: [195.6, 1.7, 3.0], l: [197.6, 1.4, -1.0]}, {p: [199.0, 1.9, 2.4], l: [200.8, 2.0, -3.0]}, {p: [201.2, 2.0, 1.4], l: [201.4, 2.1, -3.6]}], beats: 'words:before:0,4,13'},
  turnstile: {light: 'office', anchor: [-5, 0, 1], keys: [{p: [-8.8, 1.7, 5.6], l: [-6.4, 1.2, 1.8]}, {p: [-7.0, 1.8, 4.8], l: [-5.0, 1.3, 1.4]}, {p: [-4.4, 1.9, 4.0], l: [-2.4, 1.4, -1.6]}], beats: 'words:turnstile:0,7,16'},
  price: {light: 'office', anchor: [5, 0, -1], keys: [{p: [2.6, 1.5, -1.0], l: [3.2, 1.3, -3.2]}, {p: [4.4, 1.7, 1.4], l: [6.0, 1.4, -0.4]}, {p: [5.4, 1.8, 3.8], l: [7.2, 1.5, 0.6]}], beats: 'words:price:0,6,13'},
  ladder: {light: 'office', anchor: [400, 0, -1], keys: [{p: [396.7, 1.8, 0.9], l: [397.4, 1.05, -0.9]}, {p: [397.1, 1.85, 1.0], l: [397.5, 1.1, -0.95]}, {p: [398.8, 2.0, 2.2], l: [400.8, 2.5, -4.6]}, {p: [401.1, 2.4, 1.6], l: [401.7, 2.5, -4.9]}], beats: 'words:ladder:0,2.5,5,14'},
  but: {light: 'office', anchor: [502, 0, -2], keys: [{p: [504.0, 1.8, 3.8], l: [502.6, 1.6, -2.0]}, {p: [501.4, 2.2, 2.6], l: [500.6, 2.8, -6.8]}, {p: [500.6, 2.6, 0.8], l: [500.6, 3.4, -6.8]}], beats: 'words:but:0,4,10'},
  so: {light: 'office', anchor: [600, 0, -2], keys: [{p: [605.4, 1.8, 2.6], l: [603.4, 1.5, -3.6]}, {p: [602.2, 1.9, 2.4], l: [601.4, 1.3, -2.8]}, {p: [598.8, 1.9, 1.3], l: [597.0, 1.5, -2.0]}], beats: 'words:so:0,5,12'},
  spike: {light: 'office', anchor: [500, 0, -3], keys: [{p: [499.2, 1.9, 3.0], l: [500.0, 2.6, -6.8]}, {p: [499.8, 2.4, 1.0], l: [500.0, 3.3, -6.8]}, {p: [500.2, 2.7, -1.2], l: [500.0, 3.5, -6.8]}], beats: 'words:spike:0,6,14'},
  traders: {light: 'office', anchor: [494, 0, -2], keys: [{p: [497.2, 1.8, 2.4], l: [494.4, 1.4, -2.2]}, {p: [495.6, 2.0, 1.6], l: [493.6, 1.7, -3.0]}, {p: [494.6, 2.0, 0.9], l: [493.4, 1.8, -3.2]}], beats: 'words:traders:0,4,13'},
  rules: {light: 'day', anchor: [2100, 0, 4], keys: [{p: [2097.0, 1.9, 15.5], l: [2100.0, 6.5, 2.0]}, {p: [2099.0, 2.3, 13.0], l: [2100.0, 7.2, 2.0]}, {p: [2101.6, 1.9, 10.4], l: [2102.4, 2.4, 5.4]}], beats: 'words:rules:0,6,14'},
  broke: {light: 'office', anchor: [301, 0, -1], keys: [{p: [303.6, 1.9, 1.4], l: [302.2, 2.4, -4.8]}, {p: [302.0, 1.8, 2.6], l: [301.2, 1.4, -1.5]}, {p: [300.4, 1.75, 1.4], l: [299.2, 1.45, -1.8]}], beats: 'words:broke:0,3,10'},
  close: {light: 'office', anchor: [700, 0, 0], keys: [{p: [696.4, 2.0, 7.2], l: [697.6, 1.6, -2.0]}, {p: [698.8, 1.9, 6.4], l: [700.2, 1.5, -2.0]}, {p: [700.3, 1.75, 5.3], l: [700.3, 1.3, 3.2]}], beats: 'words:close:0,8,13'},
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
  return {key: k, pos: C.p.getPoint(u), look: C.l.getPoint(u), plan: PLAN[k], a: C.a, b: C.b};
}
// dip-to-cream opacity around location changes (0.4 s total)
const CONT = new Set([]); // these shots continue the previous camera move
export function dipAt(t) {
  let o = 0;
  keys.forEach((k, i) => {
    if (i === 0 || CONT.has(k)) return;
    const c = CUTS[i]; const d = Math.abs(t - c);
    if (d < 0.2) o = Math.max(o, 1 - d / 0.2);
  });
  return o;
}
