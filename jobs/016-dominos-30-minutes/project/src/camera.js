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
  crash: {sun: '#a9b8ff', si: 1.4, sky: '#6a70b8', gnd: '#3a3048', hi: 1.3, fog: '#232856', near: 120, far: 420, sunOff: [-40, 90, 50], shadow: 70, top: '#0b1030', hor: '#3e3f86', pt: {c: '#ffd9a0', i: 22, p: [0, 5, 4], d: 34}},
  morning: {sun: '#ffbf7a', si: 2.5, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 160, far: 650, sunOff: [-60, 40, 50], shadow: 80, top: '#6fa6dd', hor: '#ffd3a1', pt: null},
};

const v = (a) => new THREE.Vector3(...a);
// camera plan: per shot, location light, anchor (for the light), path keys {p, l}, optional beat times
export const PLAN = {
  hook: {light: 'day', anchor: [300, 0, -5], keys: [{p: [299.4, 1.75, 8.2], l: [298.8, 1.6, 5.6]}, {p: [301, 2.8, 13.5], l: [300, 3.0, -6]}, {p: [303, 3.8, 17], l: [300, 4.0, -9]}]},
  s02: {light: 'office', anchor: [600, 0, 0], keys: [{p: [597, 2.2, 4.6], l: [600.5, 2.0, -4]}, {p: [600, 2.6, 3.4], l: [602, 2.6, -5]}, {p: [602.2, 2.8, 1.8], l: [603.2, 2.9, -5.3]}]},
  s03: {light: 'office', anchor: [800, 0, 0], keys: [{p: [794, 1.9, 4.2], l: [798, 1.4, -4.2]}, {p: [797.5, 2.0, 3.4], l: [800, 2.2, -4.5]}, {p: [801, 2.6, 3.0], l: [800.5, 4.5, -5.8]}]},
  s04: {light: 'office', anchor: [800, 0, 0], keys: [{p: [801, 2.6, 3.0], l: [800.5, 4.5, -5.8]}, {p: [803.5, 2.3, 2.5], l: [805.5, 2.0, -3.5]}, {p: [804.6, 1.9, 1.9], l: [805.0, 1.7, 0.4]}]},
  s05: {light: 'crash', anchor: [0, 0, 12], keys: [{p: [-8, 2.4, 1.0], l: [-1, 1.0, 12]}, {p: [-4, 2.2, 1.5], l: [0, 1.2, 12]}, {p: [2.5, 2.8, 2.2], l: [0, 1.2, 12]}], beats: 'words:s05:0,9,14'},
  s06: {light: 'yard', anchor: [700, 0, 0], keys: [{p: [695, 1.8, 6.5], l: [699.5, 1.6, 1.2]}, {p: [697, 1.7, 5.2], l: [700, 1.8, 1.5]}, {p: [699.5, 1.9, 4.6], l: [700.8, 2.2, 1.8]}]},
  s07: {light: 'office', anchor: [900, 0, 0], keys: [{p: [893, 1.8, 3.6], l: [895, 1.7, 0.2]}, {p: [895.5, 1.9, 3.4], l: [896.5, 2.2, -2]}, {p: [898.5, 2.4, 3.6], l: [899.0, 2.9, -5.3]}]},
  s08: {light: 'office', anchor: [600, 0, 0], keys: [{p: [596.8, 1.9, 3.8], l: [593.4, 1.6, -1.2]}, {p: [598.0, 2.0, 3.0], l: [594.5, 1.5, -0.5]}, {p: [600.5, 2.5, 3.2], l: [603.2, 2.9, -5.3]}]},
  s09: {light: 'day', anchor: [300, 0, -5], keys: [{p: [294, 3.0, 16], l: [300, 3.6, -8]}, {p: [297, 3.4, 14], l: [300, 3.7, -6]}, {p: [300, 3.6, 11.5], l: [300, 3.6, -6]}], beats: 'words:s09:0,4,8'},
  s10: {light: 'office', anchor: [900, 0, 0], keys: [{p: [903, 2.0, 4.2], l: [901, 2.0, 0]}, {p: [901, 2.5, 3.0], l: [899, 2.9, -5.3]}, {p: [899.5, 2.8, 2.0], l: [899, 3.0, -5.3]}], beats: 'words:s10:0,8,22'},
  s11: {light: 'yard', anchor: [700, 0, 0], keys: [{p: [704.5, 1.8, 6.5], l: [700.8, 1.8, 1.5]}, {p: [703, 1.9, 5.0], l: [700.8, 2.0, 1.8]}, {p: [701.5, 2.0, 4.4], l: [700.8, 2.1, 1.8]}]},
  s12: {light: 'morning', anchor: [320, 0, 0], keys: [{p: [319, 1.7, 10.5], l: [320, 1.5, 5.8]}, {p: [309, 3.0, 15], l: [304, 3.5, -6]}, {p: [304, 4.5, 18], l: [300, 4.2, -9]}], beats: 'words:s12:0,6,13'},
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
const CONT = new Set(['s04']); // these shots continue the previous camera move
export function dipAt(t) {
  let o = 0;
  keys.forEach((k, i) => {
    if (i === 0 || CONT.has(k)) return;
    const c = CUTS[i]; const d = Math.abs(t - c);
    if (d < 0.2) o = Math.max(o, 1 - d / 0.2);
  });
  return o;
}
