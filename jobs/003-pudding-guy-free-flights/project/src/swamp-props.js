// story props for 002 (swamp, ranch, press, printing). Generic shapes only: no logos, no real likenesses.
import * as THREE from 'three';
import {INK, rng, toon, box, cyl, ink, sign} from './kit.js';

const g = () => new THREE.Group();
const ball = (r, c, {x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, thick = 0.02} = {}) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), toon(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); ink(m, thick, false); return m;
};
const cone = (r, h, c, {x = 0, y = 0, z = 0, seg = 10, thick = 0.02} = {}) => {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), toon(c)); m.position.set(x, y, z); ink(m, thick, false); return m;
};

export function gator(s = 1) {
  const a = g();
  a.add(ball(0.5, '#4f7a3a', {y: 0.18, sx: 2.6, sy: 0.38, sz: 0.75}));
  a.add(box(0.9, 0.16, 0.34, '#5d8a45', {x: 1.65, y: 0.16, thick: 0.015}));        // snout
  a.add(box(0.9, 0.05, 0.3, '#e9e2c6', {x: 1.65, y: 0.07, thick: 0.01}));          // jaw line
  for (const z of [-0.12, 0.12]) { a.add(ball(0.09, '#f2e06b', {x: 1.15, y: 0.34, z})); a.add(ball(0.04, INK, {x: 1.2, y: 0.36, z: z * 1.15, thick: 0.001})); }
  const tail = cone(0.28, 1.8, '#4f7a3a', {x: -1.95, y: 0.14, seg: 8}); tail.rotation.z = Math.PI / 2; tail.scale.z = 0.5; a.add(tail);
  for (let i = 0; i < 6; i++) a.add(cone(0.07, 0.14, '#3e6230', {x: -0.9 + i * 0.35, y: 0.36, seg: 5, thick: 0.008}));
  a.scale.setScalar(s); return a;
}
export function frog(s = 1) {
  const a = g();
  a.add(ball(0.2, '#6fbf4a', {y: 0.16, sx: 1.2, sy: 0.8}));
  for (const z of [-0.09, 0.09]) { a.add(ball(0.07, '#6fbf4a', {x: 0.08, y: 0.3, z})); a.add(ball(0.035, INK, {x: 0.13, y: 0.32, z, thick: 0.001})); }
  a.scale.setScalar(s); return a;
}
export function lilyPad(r = 0.5) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 16, 1, false, 0.3, Math.PI * 2 - 0.6), toon('#5c9e45')); ink(m, 0.01, false); return m; }
export function reeds(n = 9, seed = 1, h = 1.6) {
  const a = g(); const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const hh = h * (0.6 + r() * 0.6), x = (r() - 0.5) * 1.4, z = (r() - 0.5) * 1.0;
    const st = cyl(0.025, 0.035, hh, '#6f9a3e', {x, y: hh / 2, z, seg: 5, thick: 0.006}); st.rotation.z = (r() - 0.5) * 0.25; a.add(st);
    if (r() > 0.45) a.add(cyl(0.06, 0.06, 0.32, '#7a4a2a', {x: x + st.rotation.z * -hh * 0.5, y: hh - 0.1, z, seg: 8, thick: 0.008}));  // cattail
  }
  return a;
}
export function cypress(h = 8, seed = 1) {
  const a = g(); const r = rng(seed);
  a.add(cyl(0.2, 0.75, h * 0.25, '#7a5a40', {y: h * 0.125, seg: 10}));
  a.add(cyl(0.12, 0.22, h * 0.8, '#7a5a40', {y: h * 0.4 + h * 0.2, seg: 8}));
  for (let i = 0; i < 4; i++) {
    const y = h * (0.55 + i * 0.13), rr = 1.4 + r() * 0.8;
    a.add(ball(rr, i % 2 ? '#4f7f3c' : '#5d8f46', {x: (r() - 0.5) * 1.2, y, z: (r() - 0.5) * 0.6, sy: 0.45, thick: 0.03}));
    // hanging moss
    for (let k = 0; k < 3; k++) a.add(cone(0.18, 1.1, '#9bab86', {x: (r() - 0.5) * rr * 1.4, y: y - 0.7, z: (r() - 0.5) * 0.8, seg: 5, thick: 0.006}).rotateX(Math.PI));
  }
  return a;
}
export function palmetto(s = 1, seed = 1) {
  const a = g(); const r = rng(seed);
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.55, 10, 0, Math.PI * 0.7), toon(i % 2 ? '#5f9a46' : '#6faa4f', null, {side: THREE.DoubleSide}));
    const ang = (i / 9) * Math.PI * 2 + r() * 0.3;
    f.position.set(Math.cos(ang) * 0.35, 0.55 + r() * 0.3, Math.sin(ang) * 0.35); f.rotation.set(-0.6 - r() * 0.4, -ang, 0); ink(f, 0.01, false); a.add(f);
  }
  a.scale.setScalar(s); return a;
}
export function palmTree(h = 7, seed = 1) {
  const a = g(); const r = rng(seed);
  for (let i = 0; i < 7; i++) a.add(cyl(0.22 - i * 0.012, 0.24 - i * 0.012, h / 7 + 0.02, '#a07a52', {x: Math.sin(i * 0.4) * 0.15 * i * 0.2, y: (i + 0.5) * h / 7, seg: 8, thick: 0.02}));
  for (let i = 0; i < 7; i++) {
    const ang = i / 7 * Math.PI * 2 + r() * 0.3; const L = 2.4;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.42, L, 4), toon(i % 2 ? '#4f9a46' : '#5fae52')); leaf.scale.z = 0.25;
    leaf.position.set(Math.cos(ang) * L * 0.45, h - 0.25, Math.sin(ang) * L * 0.45); leaf.rotation.set(0, -ang, 0); leaf.rotateZ(-Math.PI / 2 - 0.35); ink(leaf, 0.015, false); a.add(leaf);
  }
  return a;
}
export function cow(seed = 1) {
  const a = g(); const r = rng(seed);
  a.add(box(1.5, 0.75, 0.7, '#f4efe4', {y: 1.0, thick: 0.025}));
  for (let i = 0; i < 3; i++) a.add(box(0.36 + r() * 0.2, 0.3, 0.72, '#3a2e2a', {x: -0.5 + i * 0.45, y: 1.1 + (r() - 0.5) * 0.3, thick: 0.004, edges: false}));
  a.add(box(0.48, 0.42, 0.46, '#f4efe4', {x: 0.95, y: 1.25, thick: 0.02}));
  a.add(box(0.22, 0.22, 0.4, '#e8a9a0', {x: 1.2, y: 1.12, thick: 0.01}));
  for (const z of [-0.14, 0.14]) a.add(ball(0.05, INK, {x: 1.19, y: 1.36, z, thick: 0.001}));
  for (const z of [-0.3, 0.3]) a.add(cone(0.05, 0.22, '#e8dcc0', {x: 0.88, y: 1.55, z, seg: 5, thick: 0.005}));
  for (const [x, z] of [[-0.55, -0.25], [-0.55, 0.25], [0.55, -0.25], [0.55, 0.25]]) a.add(box(0.14, 0.65, 0.14, '#efe8da', {x, y: 0.33, z, thick: 0.01}));
  a.add(cyl(0.03, 0.03, 0.6, '#3a2e2a', {x: -0.82, y: 0.95, seg: 5, thick: 0.004}));
  return a;
}
export function ranchGate(w = 5) {
  const a = g();
  for (const x of [-w / 2, w / 2]) a.add(box(0.25, 2.6, 0.25, '#7a5a40', {x, y: 1.3, thick: 0.02}));
  a.add(box(w + 0.6, 0.3, 0.3, '#7a5a40', {y: 2.7, thick: 0.02}));
  for (let i = 0; i < 4; i++) a.add(box(w - 0.3, 0.12, 0.08, '#b98a52', {y: 0.3 + i * 0.32, thick: 0.01}));
  return a;
}
export function railFence(len = 20) {
  const a = g();
  for (let i = 0; i <= len / 2.5; i++) a.add(box(0.14, 1.2, 0.14, '#8a6a4a', {x: -len / 2 + i * 2.5, y: 0.6, thick: 0.01}));
  for (const y of [0.45, 0.95]) a.add(box(len, 0.1, 0.07, '#a0805a', {y, thick: 0.008}));
  return a;
}
export function briefcase() { const a = g(); a.add(box(0.42, 0.3, 0.1, '#5a3a26', {y: -0.15, thick: 0.012}), box(0.14, 0.04, 0.04, '#2b2b2e', {y: 0.02, thick: 0.004})); return a; }
export function dirChair() {
  const a = g();
  for (const x of [-0.3, 0.3]) for (const z of [-0.22, 0.22]) a.add(box(0.05, 0.9, 0.05, '#7a5a40', {x, y: 0.45, z, thick: 0.006}));
  a.add(box(0.64, 0.05, 0.48, '#c43d32', {y: 0.55, thick: 0.008}), box(0.64, 0.3, 0.04, '#c43d32', {y: 1.05, z: -0.22, thick: 0.008}));
  for (const x of [-0.32, 0.32]) a.add(box(0.05, 0.05, 0.5, '#7a5a40', {x, y: 0.8, thick: 0.004}));
  return a;
}
// a generic storybook castle, lit windows (not modelled on any real castle)
export function castle() {
  const a = g(); const r = rng(77);
  const wall = '#dcc6a2', roof = '#b5523b';
  a.add(box(18, 5, 6, wall, {y: 2.5, thick: 0.05}));
  for (let i = 0; i < 9; i++) a.add(box(1, 0.8, 6.2, wall, {x: -8 + i * 2, y: 5.4, thick: 0.03}));
  const T = [[-9, 9, 1.6], [9, 9, 1.6], [-5, 10, 1.5], [4.5, 11, 1.4], [0, 12.5, 2.0], [-2, 14, 1.1], [2.4, 13.5, 1.0]];
  for (const [x, h, rr] of T) {
    a.add(cyl(rr, rr, h, wall, {x, y: h / 2, z: x === 0 ? 0.5 : 0, seg: 14, thick: 0.04}));
    a.add(cone(rr * 1.3, rr * 2.6, roof, {x, y: h + rr * 1.3, z: x === 0 ? 0.5 : 0, seg: 14, thick: 0.04}));
  }
  const winM = new THREE.MeshBasicMaterial({color: '#ffd27a'});
  const wins = [];
  for (let i = 0; i < 26; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.8), winM); const tw = T[i % T.length]; w.position.set(i < 12 ? -7 + i * 1.3 : tw[0] + (r() - 0.5) * 0.6, i < 12 ? 2 + (i % 2) * 1.6 : 2 + r() * (tw[1] - 3), i < 12 ? 3.02 : tw[2] + 0.02 + (tw[0] === 0 ? 0.5 : 0)); a.add(w); wins.push(w); }
  a.add(box(2.6, 3.4, 0.3, '#3a2e3e', {y: 1.7, z: 3.0, thick: 0.02}));
  a.userData.wins = wins;
  return a;
}
export function podium() { const a = g(); a.add(box(1.0, 1.2, 0.6, '#6b4430', {y: 0.6, thick: 0.02}), box(1.15, 0.08, 0.7, '#5a3a26', {y: 1.24, thick: 0.01})); for (const x of [-0.2, 0, 0.2]) { a.add(cyl(0.012, 0.012, 0.45, '#2b2b2e', {x, y: 1.48, z: 0.15, seg: 5, thick: 0.002})); a.add(ball(0.05, '#2b2b2e', {x, y: 1.72, z: 0.15, thick: 0.003})); } return a; }
export function pressCam() {
  const a = g();
  for (const ang of [0, 2.1, 4.2]) { const l = cyl(0.02, 0.02, 1.5, '#2b2b2e', {x: Math.cos(ang) * 0.25, y: 0.72, z: Math.sin(ang) * 0.25, seg: 5, thick: 0.003}); l.rotation.set(Math.sin(ang) * 0.3, 0, -Math.cos(ang) * 0.3); a.add(l); }
  a.add(box(0.42, 0.32, 0.3, '#2b2b2e', {y: 1.6, thick: 0.01}));
  const lens = cyl(0.09, 0.11, 0.25, '#4a4a50', {y: 1.6, z: 0.25, seg: 10, thick: 0.004}); lens.rotation.x = Math.PI / 2; a.add(lens);
  const fl = cyl(0.12, 0.08, 0.12, '#cfcfcf', {y: 1.95, x: 0.1, seg: 10, thick: 0.004}); a.add(fl);
  const bulb = ball(0.08, '#fffbe0', {y: 1.98, x: 0.1}); bulb.material = new THREE.MeshBasicMaterial({color: '#fffbe0'}); a.add(bulb); a.userData.bulb = bulb;
  return a;
}
export function printingPress() {
  const a = g();
  a.add(box(5, 1.2, 2.4, '#4a5a62', {y: 0.6, thick: 0.03}), box(4.6, 2.2, 0.4, '#3e4c54', {y: 2.2, z: -0.9, thick: 0.03}));
  const rollers = [];
  for (let i = 0; i < 3; i++) { const rr = cyl(0.35, 0.35, 2.2, i % 2 ? '#c9d2d6' : '#2b2b2e', {x: -1.5 + i * 1.5, y: 1.6, z: 0.1, seg: 16, thick: 0.02}); rr.rotation.x = Math.PI / 2; a.add(rr); rollers.push(rr); }
  a.add(box(0.5, 0.5, 0.5, '#d9a441', {x: 2.2, y: 1.45, z: 0.8, thick: 0.02}));
  a.userData.rollers = rollers; return a;
}
// newspaper front page as a canvas texture
export function paperTex(head, {date = '', name = 'THE DAILY PAPER'} = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 680; const q = c.getContext('2d');
  q.fillStyle = '#f4ecd8'; q.fillRect(0, 0, 512, 680);
  q.fillStyle = INK; q.textAlign = 'center'; q.font = 'bold 44px Georgia, serif'; q.fillText(name, 256, 62);
  q.fillRect(24, 78, 464, 5); q.font = 'bold 20px Arial'; q.fillText(date, 256, 106); q.fillRect(24, 116, 464, 3);
  q.font = 'bold 74px Arial, sans-serif';
  const words = head.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (q.measureText(t).width > 460) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur); lines.forEach((l, i) => q.fillText(l, 256, 200 + i * 80));
  q.fillStyle = '#9a8f7a'; const y0 = 230 + lines.length * 80;
  for (let i = 0; i < 9; i++) { q.fillRect(30, y0 + i * 26, 210, 10); q.fillRect(272, y0 + i * 26, 210, 10); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function newspaper(tex, w = 0.6) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 680 / 512), new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide}));
  return m;
}
export function mist(seed = 1, n = 10, spread = 40, y = 0.6) {
  const a = g(); const r = rng(seed);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(2 + r() * 2, 12, 8), new THREE.MeshBasicMaterial({color: '#eef2e6', transparent: true, opacity: 0.35, depthWrite: false})); m.scale.y = 0.25; m.position.set((r() - 0.5) * spread, y, (r() - 0.5) * spread * 0.5); a.add(m); }
  return a;
}
export {ball, cone};
