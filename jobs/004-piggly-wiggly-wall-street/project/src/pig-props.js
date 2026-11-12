// story props for 004 (1916 self-service grocery, 1920s Wall Street). Generic shapes only: no logos, no pig mascot.
import * as THREE from 'three';
import {INK, rng, toon, box, cyl, ink, sign} from './kit.js';

const g = () => new THREE.Group();
const WOOD = '#9a6a3e', WOOD2 = '#7a4f2e';

// old wooden shopping basket with a handle
export function woodBasket(s = 1) {
  const a = g();
  a.add(box(0.5, 0.04, 0.34, WOOD2, {y: 0.02, thick: 0.006}));
  for (const z of [-0.17, 0.17]) a.add(box(0.5, 0.24, 0.025, WOOD, {y: 0.13, z, thick: 0.006}));
  for (const x of [-0.25, 0.25]) a.add(box(0.025, 0.24, 0.34, WOOD, {x, y: 0.13, thick: 0.006}));
  for (const y of [0.08, 0.18]) for (const z of [-0.18, 0.18]) a.add(box(0.52, 0.02, 0.01, WOOD2, {y, z, thick: 0.002, edges: false}));
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 6, 20, Math.PI), toon(WOOD2)); h.position.y = 0.25; ink(h, 0.008, false); a.add(h);
  a.scale.setScalar(s); return a;
}
// basket with a few goods inside
export function fullBasket(s = 1, seed = 1) {
  const a = woodBasket(1); const r = rng(seed);
  const cols = ['#e0533d', '#f2c12e', '#4f86b8', '#6aa84f', '#f29a4e'];
  for (let i = 0; i < 4; i++) a.add(cyl(0.05, 0.05, 0.12, cols[Math.floor(r() * 5)], {x: -0.15 + i * 0.1, y: 0.1, z: (r() - 0.5) * 0.15, seg: 10, thick: 0.004}));
  a.add(box(0.12, 0.16, 0.08, '#f7f0de', {x: 0.12, y: 0.12, z: 0.05, thick: 0.004}));
  a.scale.setScalar(s); return a;
}
// turnstile: post + rotating 3 arms (userData.arms)
export function turnstile() {
  const a = g();
  a.add(cyl(0.09, 0.12, 1.0, '#b08a3a', {y: 0.5, seg: 12, thick: 0.01}), cyl(0.14, 0.14, 0.12, '#8a6a2a', {y: 1.02, seg: 12, thick: 0.008}));
  const arms = g(); arms.position.y = 0.95;
  for (let i = 0; i < 3; i++) { const p = g(); const bar = cyl(0.025, 0.025, 0.7, '#d8c08a', {y: 0.35, seg: 8, thick: 0.005}); p.add(bar); p.rotation.z = Math.PI / 2; p.rotation.y = i * Math.PI * 2 / 3; const q = g(); q.add(p); q.rotation.x = 0; arms.add(q); }
  a.add(arms); a.userData.arms = arms;
  a.add(box(0.06, 1.0, 1.4, '#6b4430', {x: 0.0, y: 0.5, z: -0.9, thick: 0.01}));
  return a;
}
// brass cash register with a drawer (userData.drawer)
export function register() {
  const a = g(); const B = '#c9a24a';
  a.add(box(0.7, 0.35, 0.55, B, {y: 0.18, thick: 0.01}));
  const d = box(0.6, 0.12, 0.5, '#a8863a', {y: 0.06, z: 0.04, thick: 0.006}); a.add(d); a.userData.drawer = d;
  const top = box(0.62, 0.4, 0.3, B, {y: 0.55, z: -0.1, thick: 0.01}); top.rotation.x = -0.25; a.add(top);
  for (let i = 0; i < 12; i++) a.add(cyl(0.025, 0.025, 0.03, '#f7f0de', {x: -0.22 + (i % 6) * 0.09, y: 0.38 + Math.floor(i / 6) * 0.06, z: 0.12 - Math.floor(i / 6) * 0.06, seg: 8, thick: 0.003}));
  const flag = box(0.42, 0.18, 0.03, '#f7f0de', {y: 0.86, z: -0.15, thick: 0.004}); a.add(flag);
  return a;
}
// old wooden shelf with cans, jars, sacks and boxes
export function oldShelf(w = 3, seed = 1, h = 2.4, rows = 4) {
  const a = g(); const r = rng(seed);
  a.add(box(w, h, 0.08, '#7a4f2e', {y: h / 2, z: -0.3, thick: 0.01}));
  for (const x of [-w / 2, w / 2]) a.add(box(0.08, h, 0.65, WOOD2, {x, y: h / 2, thick: 0.008}));
  const cols = ['#c43d32', '#e8c25a', '#4f86b8', '#6aa84f', '#e7ddc4', '#f29a4e', '#2f8f8a', '#8a5a9a'];
  for (let k = 0; k < rows; k++) {
    const y = 0.12 + k * (h - 0.25) / rows;
    a.add(box(w, 0.05, 0.6, WOOD, {y, thick: 0.006}));
    let x = -w / 2 + 0.12;
    while (x < w / 2 - 0.22) {
      const bw = 0.13 + r() * 0.14, bh = 0.16 + r() * 0.22, c = cols[Math.floor(r() * cols.length)], q = r();
      if (q > 0.6) a.add(box(bw, bh, 0.22, c, {x: x + bw / 2, y: y + bh / 2 + 0.03, z: 0.02, thick: 0.004}));
      else if (q > 0.2) a.add(cyl(bw * 0.42, bw * 0.42, bh * 0.8, c, {x: x + bw / 2, y: y + bh * 0.4 + 0.03, z: 0.06, seg: 10, thick: 0.003}));
      else { const s = new THREE.Mesh(new THREE.SphereGeometry(bw * 0.6, 10, 8), toon('#d9c49a')); s.scale.set(1, 1.3, 0.8); s.position.set(x + bw / 2, y + bw * 0.75, 0.05); ink(s, 0.006, false); a.add(s); }
      x += bw + 0.035;
    }
  }
  return a;
}
// little price tag card
export function priceTag(txt, c = '#f7f0de') { return sign(txt, 0.32, 0.18, {bg: c, fg: '#c43d32', w: 256, h: 144, font: 'bold 96px Arial'}); }
// long wooden shop counter
export function counter(len = 5, c = WOOD) {
  const a = g(); a.add(box(len, 1.0, 0.7, c, {y: 0.5, thick: 0.02}), box(len + 0.15, 0.07, 0.85, WOOD2, {y: 1.03, thick: 0.008}));
  for (let i = 0; i < Math.floor(len / 0.8); i++) a.add(box(0.5, 0.6, 0.02, WOOD2, {x: -len / 2 + 0.45 + i * 0.8, y: 0.5, z: 0.36, thick: 0.004}));
  return a;
}
// stack of share certificates (cream sheets with a green border). userData.setN(k) shows k sheets
export function certStack(n = 40, w = 0.5, d = 0.36, seed = 1) {
  const a = g(); const r = rng(seed); const sheets = [];
  for (let i = 0; i < n; i++) { const s = g(); s.add(box(w, 0.018, d, '#f4ead0', {thick: 0.002, edges: false}), box(w * 0.9, 0.02, d * 0.86, '#5f9a6a', {thick: 0.001, edges: false}), box(w * 0.82, 0.022, d * 0.76, '#f4ead0', {thick: 0.001, edges: false})); s.position.set((r() - 0.5) * 0.03, 0.01 + i * 0.021, (r() - 0.5) * 0.03); s.rotation.y = (r() - 0.5) * 0.15; a.add(s); sheets.push(s); }
  ink(sheets[n - 1].children[0], 0.004, true);
  a.userData.setN = (k) => sheets.forEach((s, i) => { s.visible = i < k; });
  return a;
}
// round bank vault door
export function vaultDoor(r = 1.6) {
  const a = g();
  const d = cyl(r, r, 0.3, '#9aa4ab', {seg: 32, thick: 0.03}); d.rotation.x = Math.PI / 2; a.add(d);
  const ring = cyl(r * 1.12, r * 1.12, 0.18, '#6f7a80', {seg: 32, z: -0.08, thick: 0.03}); ring.rotation.x = Math.PI / 2; a.add(ring);
  const hub = cyl(0.25, 0.25, 0.2, '#c9a24a', {z: 0.22, seg: 16, thick: 0.01}); hub.rotation.x = Math.PI / 2; a.add(hub);
  const wheel = g(); for (let i = 0; i < 3; i++) { const s = box(1.3, 0.07, 0.07, '#c9a24a', {thick: 0.006}); s.rotation.z = i * Math.PI / 3; wheel.add(s); } wheel.position.z = 0.3; a.add(wheel); a.userData.wheel = wheel;
  for (let i = 0; i < 12; i++) { const b = cyl(0.06, 0.06, 0.1, '#6f7a80', {seg: 8, thick: 0.004}); b.rotation.x = Math.PI / 2; b.position.set(Math.cos(i / 12 * 7) * r * 0.85, Math.sin(i / 12 * 7) * r * 0.85, 0.18); a.add(b); }
  return a;
}
// money crate on a little dolly
export function moneyCrate(label = '$10,000,000', s = 1) {
  const a = g();
  const c = box(1.0, 0.7, 0.7, '#5f8a4a', {y: 0.47, thick: 0.015}); a.add(c);
  const l = sign(label, 0.9, 0.3, {bg: '#f4ead0', fg: '#2f5a2a', w: 600, h: 200, font: 'bold 110px Arial'}); l.position.set(0, 0.5, 0.36); a.add(l);
  for (let i = 0; i < 6; i++) a.add(box(0.28, 0.08, 0.14, '#7fb06a', {x: -0.32 + (i % 3) * 0.32, y: 0.86 + Math.floor(i / 3) * 0.08, z: -0.1 + (i % 2) * 0.12, thick: 0.004}));
  a.add(box(1.1, 0.06, 0.8, '#3a3a3f', {y: 0.1, thick: 0.006}));
  for (const x of [-0.4, 0.4]) for (const z of [-0.3, 0.3]) { const w = cyl(0.07, 0.07, 0.05, '#2b2b2e', {x, y: 0.07, z, seg: 10, thick: 0.004}); w.rotation.x = Math.PI / 2; a.add(w); }
  a.scale.setScalar(s); return a;
}
// classical columned building front (generic, plain text sign)
export function columnsBuilding(w = 22, h = 13, label = 'STOCK EXCHANGE') {
  const a = g(); const st = '#e9e2d0', st2 = '#d6ccb4';
  a.add(box(w, 1.2, 4, st2, {y: 0.6, z: 1.2, thick: 0.03}));
  for (let i = 0; i < 3; i++) a.add(box(w - 2 - i * 0.6, 0.25, 0.8, st, {y: 1.3 + i * 0.25, z: 3.3 - i * 0.6, thick: 0.01}));
  a.add(box(w, h, 2, '#d9cfb6', {y: h / 2, z: -1, thick: 0.03}));
  for (let i = 0; i < 6; i++) { const c = cyl(0.55, 0.62, h - 3.2, st, {x: -w / 2 + 2.2 + i * (w - 4.4) / 5, y: 1.2 + (h - 3.2) / 2, z: 1.6, seg: 18, thick: 0.03}); a.add(c); }
  a.add(box(w, 1.4, 3.6, st, {y: h - 1.3, z: 1.0, thick: 0.03}));
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.55, 3.2, 3, 1), toon(st2)); ped.rotation.set(Math.PI / 2, 0, Math.PI / 2); ped.scale.set(0.42, 1, 1); ped.position.set(0, h + 0.1, 1.0); ink(ped, 0.03, true); a.add(ped);
  const s = sign(label, w * 0.6, 1.0, {bg: st, fg: '#2f3a4a', w: 1400, h: 120, font: 'bold 100px Georgia, serif', border: false}); s.position.set(0, h - 1.3, 2.82); a.add(s);
  for (let i = 0; i < 5; i++) a.add(box(1.4, 3.2, 0.1, '#5a3a26', {x: -w / 2 + 3.3 + i * (w - 6.6) / 4, y: 2.9, z: 0.02, thick: 0.01}));
  return a;
}
// flying ticker tape strips (userData.update(t, k))
export function tickerTape(n = 30, seed = 1, spread = 6, y0 = 4) {
  const a = g(); const r = rng(seed); const ps = [];
  const m = new THREE.MeshBasicMaterial({color: '#fbf3dc', side: THREE.DoubleSide});
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.5), m); s.userData.k = [r(), r(), r(), r()]; a.add(s); ps.push(s); }
  a.userData.update = (t) => ps.forEach((s) => { const [p, q, u, v] = s.userData.k; const life = (t * (0.25 + 0.2 * q) + p) % 1; s.position.set((u - 0.5) * spread + Math.sin(t * 2 + p * 9) * 0.3, y0 - life * y0, (v - 0.5) * spread * 0.6); s.rotation.set(t * 3 * q, t * 2 + p * 6, Math.sin(t * 4 + v * 9) * 0.8); });
  return a;
}
// ticker machine: glass dome on a stand with a paper ribbon
export function tickerMachine() {
  const a = g(); a.add(cyl(0.05, 0.12, 1.0, '#3a3a3f', {y: 0.5, seg: 10, thick: 0.006}), cyl(0.22, 0.22, 0.12, '#c9a24a', {y: 1.06, seg: 16, thick: 0.006}));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({color: '#cfeaff', transparent: true, opacity: 0.45})); dome.position.y = 1.12; a.add(dome);
  const rib = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.9), new THREE.MeshBasicMaterial({color: '#fbf3dc', side: THREE.DoubleSide})); rib.position.set(0.2, 0.75, 0.05); rib.rotation.z = 0.2; a.add(rib);
  return a;
}
// rubber stamp (userData.head moves)
export function stamp(c = '#c43d32') {
  const a = g(); const h = g(); h.add(cyl(0.05, 0.05, 0.22, '#6b4430', {y: 0.2, seg: 10, thick: 0.004}), ballK(0.07, '#6b4430', 0.33), box(0.26, 0.06, 0.18, c, {y: 0.05, thick: 0.004}));
  a.add(h); a.userData.head = h; return a;
}
const ballK = (r, c, y) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), toon(c)); m.position.y = y; ink(m, 0.006, false); return m; };
// cardboard moving box
export function movingBox(seed = 1) { const a = g(); a.add(box(0.6, 0.45, 0.45, '#c9a06a', {y: 0.23, thick: 0.01}), box(0.62, 0.02, 0.08, '#a8804a', {y: 0.46, thick: 0.002})); return a; }
// pedestal
export function pedestal(h = 1.0) { const a = g(); a.add(cyl(0.45, 0.55, h, '#f2e6cc', {y: h / 2, seg: 18, thick: 0.02}), cyl(0.55, 0.55, 0.08, '#d9c9a6', {y: h + 0.04, seg: 18, thick: 0.01})); return a; }
// old-time car (dark, boxy, spoked wheels)
export function oldCar(c = '#2b2b30', seed = 1) {
  const a = g();
  a.add(box(2.6, 0.5, 1.3, c, {y: 0.75, thick: 0.02}), box(1.3, 0.8, 1.2, c, {x: -0.3, y: 1.4, thick: 0.02}), box(1.4, 0.06, 1.35, '#1d1d20', {x: -0.3, y: 1.83, thick: 0.006}));
  a.add(box(0.7, 0.45, 1.0, '#3a3a3f', {x: 1.0, y: 1.15, thick: 0.01}), box(0.1, 0.4, 0.9, '#c9a24a', {x: 1.38, y: 1.0, thick: 0.006}));
  a.add(box(0.05, 0.5, 1.0, '#bfe6ff', {x: 0.36, y: 1.45, thick: 0.004}));
  for (const x of [-0.9, 0.9]) for (const z of [-0.68, 0.68]) { const w = cyl(0.38, 0.38, 0.14, '#1d1d20', {x, y: 0.4, z, seg: 16, thick: 0.01}); w.rotation.x = Math.PI / 2; a.add(w); const hb = cyl(0.12, 0.12, 0.16, '#c9a24a', {x, y: 0.4, z, seg: 10, thick: 0.003}); hb.rotation.x = Math.PI / 2; a.add(hb); }
  for (const z of [-0.45, 0.45]) a.add(ballK(0.1, '#f7f0c0', 0).translateX(1.42).translateY(1.0).translateZ(z));
  return a;
}
