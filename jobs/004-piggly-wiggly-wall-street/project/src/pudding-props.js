// story props for 003 (pudding cups, store, airport, film set). Generic shapes only: no logos, no liveries.
import * as THREE from 'three';
import {INK, rng, toon, box, cyl, ink, sign} from './kit.js';

const g = () => new THREE.Group();
export const ball = (r, c, {x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, thick = 0.02} = {}) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), toon(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); ink(m, thick, false); return m;
};
const canvasTex = (w, h, draw) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'); draw(q, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
// a plain barcode (white label, black bars)
let BAR = null;
export function barTex() {
  if (BAR) return BAR;
  BAR = canvasTex(256, 160, (q, w, h) => {
    q.fillStyle = '#ffffff'; q.fillRect(0, 0, w, h); const r = rng(3); let x = 18;
    q.fillStyle = '#111111'; while (x < w - 22) { const bw = 2 + Math.floor(r() * 4) * 2; q.fillRect(x, 14, bw, h - 46); x += bw + 3 + Math.floor(r() * 3) * 2; }
    q.font = 'bold 26px monospace'; q.textAlign = 'center'; q.fillText('0 12345 67890 5', w / 2, h - 8);
  });
  return BAR;
}
export function barcode(w = 0.3) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.62), new THREE.MeshBasicMaterial({map: barTex(), side: THREE.DoubleSide}));
}
// pudding cup label: cream band with the word PUDDING
let CUPT = null;
const cupTex = () => CUPT || (CUPT = canvasTex(512, 128, (q, w, h) => {
  q.fillStyle = '#f4e3bf'; q.fillRect(0, 0, w, h); q.fillStyle = '#7a4a2a'; q.fillRect(0, 0, w, 22); q.fillRect(0, h - 22, w, 22);
  q.fillStyle = '#6a3b1f'; q.font = 'bold 54px Arial'; q.textAlign = 'center'; q.fillText('PUDDING', w * 0.3, 86); q.fillText('PUDDING', w * 0.8, 86);
}));
// one chocolate pudding cup (r ~ 0.045 m at s = 1)
export function puddingCup(s = 1, {bar = false} = {}) {
  const a = g();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.036, 0.07, 20, 1, true), toon('#ffffff', cupTex(), {side: THREE.DoubleSide})); body.position.y = 0.035; a.add(body); ink(body, 0.004, false);
  a.add(cyl(0.036, 0.036, 0.005, '#f4e3bf', {y: 0.002, seg: 20, thick: 0.002}));
  a.add(cyl(0.051, 0.051, 0.006, '#d9dbe2', {y: 0.072, seg: 20, thick: 0.003}));            // foil lid
  a.add(cyl(0.03, 0.03, 0.002, '#7a4a2a', {y: 0.0755, seg: 16, thick: 0.001}));
  if (bar) { const b = barcode(0.05); b.position.set(0, 0.037, 0.046); a.add(b); }
  a.scale.setScalar(s); return a;
}
// cardboard case of pudding cups
export function puddingCase(seed = 1) {
  const a = g();
  a.add(box(0.5, 0.26, 0.36, ['#c9a06a', '#bf955f', '#d3ab74'][seed % 3], {y: 0.13, thick: 0.008}));
  const l = sign('PUDDING', 0.36, 0.12, {bg: '#7a4a2a', fg: '#f4e3bf', w: 360, h: 120, font: 'bold 80px Arial', border: false}); l.position.set(0, 0.14, 0.18); a.add(l);
  return a;
}
// a stack of cases nx * ny * nz
export function caseStack(nx, ny, nz, seed = 1) {
  const a = g(); const r = rng(seed);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const c = puddingCase(i + j + k + seed); c.position.set(i * 0.52 + (r() - 0.5) * 0.03, j * 0.265, k * 0.38); c.rotation.y = (r() - 0.5) * 0.08; a.add(c);
  }
  return a;
}
// shopping cart (wire basket shown as light grey panels)
export function cart() {
  const a = g(); const m = '#b8c2c8';
  const bw = 0.55, bl = 0.85, bh = 0.42, y0 = 0.48;
  a.add(box(bl, 0.02, bw, m, {y: y0, thick: 0.004}));
  a.add(box(bl, bh, 0.02, m, {y: y0 + bh / 2, z: bw / 2, thick: 0.004}), box(bl, bh, 0.02, m, {y: y0 + bh / 2, z: -bw / 2, thick: 0.004}));
  a.add(box(0.02, bh, bw, m, {x: bl / 2, y: y0 + bh / 2, thick: 0.004}), box(0.02, bh, bw, m, {x: -bl / 2, y: y0 + bh / 2, thick: 0.004}));
  a.add(cyl(0.02, 0.02, bw + 0.1, '#c43d32', {x: -bl / 2 - 0.12, y: y0 + bh + 0.08, seg: 8, thick: 0.004})); a.children[a.children.length - 1].rotation.x = Math.PI / 2;
  for (const z of [-0.24, 0.24]) a.add(box(0.14, 0.02, 0.02, m, {x: -bl / 2 - 0.06, y: y0 + bh + 0.06, z, thick: 0.002}));
  for (const x of [-0.35, 0.35]) for (const z of [-0.22, 0.22]) { a.add(box(0.03, y0, 0.03, '#8a949a', {x, y: y0 / 2, z, thick: 0.003})); const w = cyl(0.05, 0.05, 0.03, '#2b2b2e', {x, y: 0.05, z, seg: 10, thick: 0.004}); w.rotation.x = Math.PI / 2; a.add(w); }
  return a;
}
// a cart full of pudding cases
export function fullCart(seed = 1) {
  const a = cart(); const s = caseStack(1, 2, 1, seed); s.position.set(-0.15, 0.5, -0.18); s.scale.setScalar(1.1); a.add(s);
  const s2 = caseStack(1, 2, 1, seed + 3); s2.position.set(0.3, 0.5, -0.18); s2.scale.setScalar(1.1); s2.rotation.y = 0.15; a.add(s2);
  return a;
}
// checkout counter with a dark belt and a till
export function checkout() {
  const a = g();
  a.add(box(3.0, 0.85, 0.8, '#d9d2c2', {y: 0.43, thick: 0.02}));
  const belt = box(2.2, 0.04, 0.6, '#2b2b2e', {x: -0.35, y: 0.87, thick: 0.006}); a.add(belt);
  a.add(box(0.5, 0.35, 0.4, '#4f5a62', {x: 1.1, y: 1.05, z: -0.05, thick: 0.01}), box(0.42, 0.22, 0.04, '#9fe0b8', {x: 1.1, y: 1.32, z: -0.15, thick: 0.004}));
  a.add(cyl(0.03, 0.03, 0.9, '#8a949a', {x: 1.35, y: 1.3, z: -0.3, seg: 6}));
  const lane = sign('3', 0.35, 0.35, {bg: '#c43d32', fg: '#ffffff', w: 200, h: 200, font: 'bold 150px Arial'}); lane.position.set(1.35, 1.9, -0.3); a.add(lane);
  return a;
}
// store shelf with colourful generic products
export function storeShelf(w = 3, seed = 1, h = 2.2) {
  const a = g(); const r = rng(seed);
  a.add(box(w, h, 0.08, '#e9e3d6', {y: h / 2, z: -0.3, thick: 0.01}));
  const cols = ['#e0533d', '#f2c12e', '#4f86b8', '#6aa84f', '#c47ac0', '#f29a4e', '#2f8f8a', '#ffffff'];
  for (let k = 0; k < 4; k++) {
    const y = 0.15 + k * (h - 0.3) / 3.6;
    a.add(box(w, 0.04, 0.6, '#cfc8b8', {y, thick: 0.006}));
    a.add(box(w, 0.07, 0.02, '#f7f0de', {y: y - 0.02, z: 0.31, thick: 0.002}));
    let x = -w / 2 + 0.1;
    while (x < w / 2 - 0.2) {
      const bw = 0.14 + r() * 0.16, bh = 0.18 + r() * 0.24, c = cols[Math.floor(r() * cols.length)];
      if (r() > 0.4) a.add(box(bw, bh, 0.22, c, {x: x + bw / 2, y: y + bh / 2 + 0.02, z: 0.02, thick: 0.004}));
      else a.add(cyl(bw * 0.4, bw * 0.4, bh, c, {x: x + bw / 2, y: y + bh / 2 + 0.02, z: 0.05, seg: 10, thick: 0.003}));
      x += bw + 0.03;
    }
  }
  return a;
}
// generic silver jet (no airline colours, no logo)
export function jet(s = 1) {
  const a = g(); const m = '#dfe5ea';
  const f = cyl(1.0, 1.0, 14, m, {seg: 18, thick: 0.05}); f.rotation.z = Math.PI / 2; a.add(f);
  const nose = ball(1.0, m, {x: 7, sx: 2.0, thick: 0.05}); a.add(nose);
  const tailc = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.5, 18), toon(m)); tailc.rotation.z = Math.PI / 2; tailc.position.x = -8.7; ink(tailc, 0.05, false); a.add(tailc);
  const wing = box(3.2, 0.18, 15, '#c9d0d6', {x: 0.3, y: -0.4, thick: 0.04}); wing.rotation.y = 0.0; a.add(wing);
  a.add(box(2.2, 3.2, 0.2, '#c9d0d6', {x: -8.3, y: 2.0, thick: 0.03}), box(1.6, 0.15, 5, '#c9d0d6', {x: -8.6, y: 0.3, thick: 0.03}));
  for (const z of [-3.2, 3.2]) { const e = cyl(0.45, 0.45, 1.8, '#8a949a', {x: 0.9, y: -1.0, z, seg: 14, thick: 0.03}); e.rotation.z = Math.PI / 2; a.add(e); }
  for (let i = 0; i < 12; i++) for (const z of [0.97, -0.97]) { const w = box(0.25, 0.3, 0.02, '#2f4f6e', {x: -5 + i * 0.95, y: 0.35, z, thick: 0.002, edges: false}); a.add(w); }
  a.add(box(0.5, 0.25, 2.04, '#2f4f6e', {x: 7.6, y: 0.45, thick: 0.004, edges: false}));
  a.scale.setScalar(s); return a;
}
// canvas board that redraws (departures / counters)
export function board(w, h, pw = 1024, ph = 512, frame = '#2b2b2e') {
  const c = document.createElement('canvas'); c.width = pw; c.height = ph; const q = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const b = box(w, h, 0.12, '#ffffff', {thick: 0.03});
  b.material = [toon(frame), toon(frame), toon(frame), toon(frame), new THREE.MeshBasicMaterial({map: t}), toon(frame)];
  let last = null;
  b.userData.draw = (key, fn) => { if (key === last) return; last = key; fn(q, pw, ph); t.needsUpdate = true; };
  return b;
}
export function mailBag(c = '#a08a62', seed = 1) {
  const a = g(); a.add(ball(0.35, c, {y: 0.32, sy: 1.0, sx: 0.8, sz: 0.6, thick: 0.015}));
  a.add(cyl(0.08, 0.14, 0.18, c, {y: 0.7, seg: 8, thick: 0.008}), cyl(0.09, 0.09, 0.03, '#5a3a26', {y: 0.66, seg: 8, thick: 0.003}));
  const t = sign('U.S. MAIL', 0.36, 0.12, {bg: '#f2e6cc', w: 360, h: 120, font: 'bold 64px Arial', border: false}); t.position.set(0, 0.36, 0.22); a.add(t);
  a.rotation.y = (seed % 5) * 0.3; return a;
}
export function clapper() {
  const a = g();
  a.add(box(0.5, 0.36, 0.03, '#2b2b2e', {y: 0.18, thick: 0.006}));
  const tex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 32; const q = c.getContext('2d'); for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#ffffff' : '#2b2b2e'; q.beginPath(); q.moveTo(i * 32, 32); q.lineTo(i * 32 + 18, 0); q.lineTo(i * 32 + 50, 0); q.lineTo(i * 32 + 32, 32); q.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const top = new THREE.Group(); const tb = box(0.5, 0.07, 0.035, '#ffffff', {thick: 0.004}); tb.material = toon('#ffffff', tex); top.add(tb); tb.position.x = 0.25; top.position.set(-0.25, 0.4, 0); a.add(top);
  a.userData.top = top;
  for (let i = 0; i < 3; i++) a.add(box(0.44, 0.012, 0.005, '#f2f0e6', {y: 0.08 + i * 0.09, z: 0.018, thick: 0.001, edges: false}));
  return a;
}
// film light on a tripod
export function filmLight(c = '#2b2b2e') {
  const a = g();
  for (const ang of [0, 2.1, 4.2]) { const l = cyl(0.02, 0.02, 1.8, c, {x: Math.cos(ang) * 0.3, y: 0.85, z: Math.sin(ang) * 0.3, seg: 5, thick: 0.003}); l.rotation.set(Math.sin(ang) * 0.3, 0, -Math.cos(ang) * 0.3); a.add(l); }
  a.add(cyl(0.03, 0.03, 0.8, c, {y: 2.0, seg: 6}));
  const h = cyl(0.32, 0.22, 0.4, c, {y: 2.45, seg: 14, thick: 0.01}); h.rotation.x = Math.PI / 2 - 0.4; a.add(h);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.29, 18), new THREE.MeshBasicMaterial({color: '#fff6d0'})); lens.position.set(0, 2.53, 0.21); lens.rotation.x = -0.4; a.add(lens);
  return a;
}
// old film camera on a tripod (two reels)
export function filmCamera() {
  const a = g();
  for (const ang of [0, 2.1, 4.2]) { const l = cyl(0.025, 0.025, 1.4, '#5a3a26', {x: Math.cos(ang) * 0.28, y: 0.66, z: Math.sin(ang) * 0.28, seg: 5, thick: 0.003}); l.rotation.set(Math.sin(ang) * 0.3, 0, -Math.cos(ang) * 0.3); a.add(l); }
  a.add(box(0.36, 0.38, 0.6, '#2b2b2e', {y: 1.55, thick: 0.01}));
  const lens = cyl(0.09, 0.11, 0.3, '#4a4a50', {y: 1.55, z: 0.42, seg: 12, thick: 0.004}); lens.rotation.x = Math.PI / 2; a.add(lens);
  const reels = [];
  for (const z of [-0.18, 0.16]) { const r = cyl(0.2, 0.2, 0.05, '#3a3a40', {y: 1.98, z, seg: 18, thick: 0.006}); r.rotation.z = Math.PI / 2; a.add(r); reels.push(r); }
  a.userData.reels = reels; return a;
}
// big golden card
export function goldCard() {
  const a = g();
  const t = canvasTex(512, 320, (q, w, h) => {
    const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f7d46a'); gr.addColorStop(0.5, '#ffe9a0'); gr.addColorStop(1, '#d9a62e'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
    q.fillStyle = '#b07d1a'; q.fillRect(40, 110, 80, 60); q.fillStyle = '#5a3a10'; q.font = 'bold 76px Arial'; q.textAlign = 'left'; q.fillText('GOLD', 150, 170);
    q.font = 'bold 40px Arial'; q.fillText('LIFETIME', 40, 270); q.fillText('MEMBER', 300, 270);
  });
  const b = box(1.0, 0.62, 0.03, '#f2c14e', {thick: 0.01}); b.material = [toon('#d9a62e'), toon('#d9a62e'), toon('#d9a62e'), toon('#d9a62e'), new THREE.MeshBasicMaterial({map: t}), toon('#d9a62e')]; a.add(b);
  return a;
}
// little adding machine with a paper roll
export function addingMachine() {
  const a = g(); a.add(box(0.36, 0.12, 0.42, '#c9c2b0', {y: 0.06, thick: 0.006}));
  for (let i = 0; i < 12; i++) a.add(box(0.05, 0.02, 0.05, i % 4 === 3 ? '#c43d32' : '#3a3a3f', {x: -0.11 + (i % 4) * 0.07, y: 0.13, z: 0.05 + Math.floor(i / 4) * 0.07, thick: 0.002}));
  const roll = cyl(0.05, 0.05, 0.3, '#ffffff', {y: 0.17, z: -0.17, seg: 12, thick: 0.004}); roll.rotation.z = Math.PI / 2; a.add(roll);
  return a;
}
// a long paper strip (receipt) that can grow: set userData.len 0..1
export function paperStrip(w = 0.35, maxLen = 2.4, text = '') {
  const a = g();
  const tex = canvasTex(128, 1024, (q, W, H) => { q.fillStyle = '#fbf7ec'; q.fillRect(0, 0, W, H); q.fillStyle = '#9a8f7a'; for (let i = 0; i < 40; i++) q.fillRect(14, 30 + i * 24, 60 + (i * 37) % 40, 7); q.fillStyle = INK; q.font = 'bold 30px Arial'; q.textAlign = 'center'; q.save(); q.translate(W / 2, H - 70); q.fillText(text, 0, 0); q.restore(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, maxLen), new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide}));
  m.geometry.translate(0, -maxLen / 2, 0); a.add(m); a.userData.m = m;
  return a;
}
export function spotCone(h = 4, r = 1.2, c = '#fff3c4', op = 0.22) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24, 1, true), new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide}));
  m.geometry.translate(0, -h / 2, 0); return m;
}
export function longTable(len = 4, c = '#8a5a3b') {
  const a = g(); a.add(box(len, 0.07, 1.0, c, {y: 0.78, thick: 0.01}));
  for (const x of [-len / 2 + 0.2, len / 2 - 0.2]) for (const z of [-0.4, 0.4]) a.add(box(0.06, 0.76, 0.06, '#5a3a26', {x, y: 0.38, z, thick: 0.004}));
  return a;
}
