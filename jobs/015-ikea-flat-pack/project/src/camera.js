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
  morning: {sun: '#ffbf7a', si: 2.5, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 160, far: 650, sunOff: [-60, 40, 50], shadow: 80, top: '#6fa6dd', hor: '#ffd3a1', pt: null},
};

const v = (a) => new THREE.Vector3(...a);
// camera plan: per shot, location light, anchor (for the light), path keys {p, l}, optional beat times
export const PLAN = {
  hook: {light: 'office', anchor: [0,0,0], keys: [{p: [-0.4,1.7,1.2], l: [-0.5,1.2,-1.5]}, {p: [-1.0,2.0,2.4], l: [-0.5,1.2,-1.5]}, {p: [-2.6,2.6,4.8], l: [0,1.5,-2.5]}]},
  s02: {light: 'office', anchor: [100,0,0], keys: [{p: [100.4,1.7,3.6], l: [98.5,1.4,-0.5]}, {p: [99.4,1.6,2.7], l: [98.5,1.3,-0.2]}, {p: [98.2,1.5,1.9], l: [98.6,1.2,0.3]}]},
  s03: {light: 'day', anchor: [300,0,6], keys: [{p: [299.6,2.0,11.6], l: [297.8,1.2,6.4]}, {p: [299.0,1.9,11.0], l: [297.8,1.2,6.4]}, {p: [298.8,1.8,10.6], l: [297.6,1.2,6.6]}]},
  s04: {light: 'day', anchor: [300,0,6], keys: [{p: [298.8,1.8,10.6], l: [297.6,1.2,6.6]}, {p: [297.6,1.6,9.6], l: [296.5,1.0,7.0]}, {p: [297.2,1.5,9.0], l: [296.4,0.9,7.0]}]},
  s05: {light: 'day', anchor: [300,0,6], keys: [{p: [297.5,2.3,13.2], l: [299.5,1.4,7.5]}, {p: [300.5,2.6,14.2], l: [301,1.4,8.4]}, {p: [303.5,2.6,14.0], l: [300.5,1.4,8]}]},
  s06: {light: 'office', anchor: [600,0,0], keys: [{p: [597.5,2.0,7.0], l: [598,2,-4]}, {p: [599.5,2.3,6.4], l: [599.5,2.1,-3.5]}, {p: [600.5,2.2,5.8], l: [599.5,2.4,-3]}]},
  s07: {light: 'office', anchor: [600,0,0], keys: [{p: [595,2.0,7.0], l: [595.5,1.2,1.8]}, {p: [597,2.3,6.6], l: [596.5,1.1,1.5]}, {p: [598,2.1,6.0], l: [597,1.0,1.0]}]},
  s08: {light: 'office', anchor: [800,0,0], keys: [{p: [796,1.6,0.8], l: [797,1.7,-3]}, {p: [797,1.9,0.2], l: [797,1.7,-3]}, {p: [798.2,1.8,-0.2], l: [797,1.5,-3]}]},
  s09: {light: 'office', anchor: [700,0,0], keys: [{p: [697.8,1.7,3.8], l: [699.8,1.0,0]}, {p: [699.8,1.9,3.5], l: [699.8,1.0,0]}, {p: [701.2,1.8,3.0], l: [700,1.0,0.2]}]},
  s10: {light: 'office', anchor: [800,0,0], keys: [{p: [804,1.9,7.2], l: [799,1.4,1]}, {p: [802,1.9,6.6], l: [799,1.4,1.2]}, {p: [800,1.9,6.2], l: [799,1.4,1.5]}]},
  s11: {light: 'office', anchor: [800,0,0], keys: [{p: [798,1.8,1.5], l: [797,1.6,-3]}, {p: [797.2,1.7,0.3], l: [797,1.6,-3]}, {p: [796.4,1.6,-0.8], l: [797,1.6,-3.2]}]},
  s12: {light: 'morning', anchor: [320,0,0], keys: [{p: [304,2.0,12.5], l: [302.5,1.4,8]}, {p: [308,2.0,12.5], l: [306,1.4,8.4]}, {p: [316,2.2,13], l: [322,1.4,8.4]}]},
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
