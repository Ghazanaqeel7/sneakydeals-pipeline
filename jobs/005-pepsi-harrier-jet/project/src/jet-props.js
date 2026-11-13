// Story props for 005 (Pepsi Harrier jet): generic cartoon jump jet, CRT TV, soda can, prize clothes,
// calculator, briefcase with money, envelope + check, judge bench, school bus. No logos anywhere.
import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, ink} from './kit.js';

const g = () => new THREE.Group();
export const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
const flatShape = (pts, color, depth = 0.08) => {
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], p[1]); s.closePath();
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false}), toon(color)); ink(m, 0.02, true); return m;
};

// generic jump jet, nose toward +x, about 8 m long; userData.glow = hover exhaust group
export function jet({color = '#8f9ba8', s = 1} = {}) {
  const j = g();
  const body = cyl(0.55, 0.75, 6.2, color, {seg: 18, thick: 0.04}); body.rotation.z = -Math.PI / 2; body.position.set(0.2, 1.6, 0); j.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.9, 18), toon(color)); ink(nose, 0.04); nose.rotation.z = -Math.PI / 2; nose.position.set(4.25, 1.6, 0); j.add(nose);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 12), toon('#4a525c')); tip.rotation.z = -Math.PI / 2; tip.position.set(5.3, 1.6, 0); j.add(tip);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#7fc4e8', null, {transparent: true, opacity: 0.92}));
  canopy.scale.set(1.9, 0.9, 0.85); canopy.position.set(2.5, 2.05, 0); ink(canopy, 0.03, false); j.add(canopy);
  // wings (swept, high) + tail planes + fin
  for (const sd of [1, -1]) {
    const w = flatShape([[0, 0], [-1.6, 3.6 * sd], [-2.6, 3.6 * sd], [-2.2, 0]], '#7d8995', 0.12); w.rotation.x = -Math.PI / 2; w.position.set(1.0, 2.05, 0); if (sd < 0) { w.scale.z = 1; } j.add(w);
    const tp = flatShape([[0, 0], [-0.8, 1.6 * sd], [-1.4, 1.6 * sd], [-1.3, 0]], '#7d8995', 0.08); tp.rotation.x = -Math.PI / 2; tp.position.set(-2.1, 1.8, 0); j.add(tp);
    // side intakes + nozzles
    const intake = cyl(0.42, 0.42, 1.3, '#6c7783', {seg: 14, thick: 0.03}); intake.rotation.z = Math.PI / 2; intake.position.set(1.4, 1.55, 0.85 * sd); j.add(intake);
    const ring = cyl(0.36, 0.36, 0.05, '#2b2b2e', {seg: 14, thick: 0.01}); ring.rotation.z = Math.PI / 2; ring.position.set(2.06, 1.55, 0.85 * sd); j.add(ring);
    for (const nx of [0.9, -0.4]) { const nz = cyl(0.22, 0.28, 0.5, '#4a525c', {seg: 10, thick: 0.02}); nz.position.set(nx, 1.05, 0.95 * sd); j.add(nz); }
  }
  const fin = flatShape([[0, 0], [-1.3, 1.9], [-2.0, 1.9], [-1.7, 0]], '#7d8995', 0.1); fin.position.set(-1.6, 2.0, -0.05); j.add(fin);
  // landing gear
  for (const [x, z] of [[2.6, 0], [-1.2, 0], [0.6, 3.2], [0.6, -3.2]]) { j.add(cyl(0.05, 0.05, 1.0, '#3a3a3f', {x, y: 0.75, z, seg: 6, thick: 0.005})); const w = cyl(0.25, 0.25, 0.18, '#2b2b2e', {x, y: 0.25, z, seg: 12, thick: 0.01}); w.rotation.x = Math.PI / 2; j.add(w); }
  // hover exhaust
  const glow = g(); const gm = new THREE.MeshBasicMaterial({color: '#ffb35a', transparent: true, opacity: 0.75});
  for (const [x, z] of [[0.9, 0.95], [0.9, -0.95], [-0.4, 0.95], [-0.4, -0.95]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 10, 1, true), gm); c.rotation.x = Math.PI; c.position.set(x, 0.15, z); glow.add(c); }
  j.add(glow); j.userData.glow = glow; j.userData.glowMat = gm;
  j.scale.setScalar(s);
  return j;
}

// 90s CRT TV on a stand; the screen is a canvas we redraw (returns {grp, draw})
export function crtTV() {
  const grp = g();
  grp.add(box(1.9, 0.7, 0.9, '#6b4430', {y: 0.35}));                      // stand
  grp.add(box(0.5, 0.25, 0.02, '#4a3020', {x: -0.45, y: 0.35, z: 0.46, thick: 0.005}), box(0.5, 0.25, 0.02, '#4a3020', {x: 0.45, y: 0.35, z: 0.46, thick: 0.005}));
  grp.add(box(1.7, 1.3, 1.1, '#3a3a3f', {y: 1.35}));                       // body
  grp.add(box(1.2, 0.9, 0.6, '#2f2f34', {y: 1.35, z: -0.75}));             // back hump
  for (let i = 0; i < 2; i++) grp.add(cyl(0.05, 0.05, 0.05, '#c9c9c9', {x: 0.68, y: 1.0 + i * 0.16, z: 0.56, seg: 8, thick: 0.004}));
  const ant = g(); for (const sd of [1, -1]) { const a = cyl(0.012, 0.012, 1.0, '#9a9aa0', {seg: 6, thick: 0.003}); a.position.set(0.3 * sd, 2.4, -0.3); a.rotation.z = -0.5 * sd; ant.add(a); } grp.add(ant);
  const c = document.createElement('canvas'); c.width = 640; c.height = 480; const cx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.02), new THREE.MeshBasicMaterial({map: tex, toneMapped: false}));
  scr.position.set(-0.08, 1.38, 0.556); grp.add(scr);
  grp.add(box(1.5, 0.08, 0.04, '#2b2b2e', {y: 1.93, z: 0.55, thick: 0.004}), box(1.5, 0.08, 0.04, '#2b2b2e', {y: 0.83, z: 0.55, thick: 0.004}));
  // draw(jetY 0..1 (0 = landed), mode: 'jet' | 'price', points string, flip 0..1, t)
  const draw = ({jetY = 0.5, price = null, flip = 0, t = 0} = {}) => {
    const sky = cx.createLinearGradient(0, 0, 0, 480); sky.addColorStop(0, '#5aa8ec'); sky.addColorStop(1, '#bfe4fb'); cx.fillStyle = sky; cx.fillRect(0, 0, 640, 480);
    cx.fillStyle = '#ffffff'; for (const [x, y, r] of [[90, 70, 30], [130, 60, 38], [170, 75, 28], [470, 110, 26], [510, 98, 34]]) { cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); }
    // school building
    cx.fillStyle = '#c4664e'; cx.fillRect(40, 280, 560, 140); cx.fillStyle = '#e8dcc0'; cx.fillRect(250, 240, 140, 40);
    cx.fillStyle = '#9fd0e6'; for (let i = 0; i < 7; i++) { cx.fillRect(65 + i * 78, 305, 40, 34); cx.fillRect(65 + i * 78, 360, 40, 34); }
    cx.strokeStyle = INK; cx.lineWidth = 4; cx.strokeRect(40, 280, 560, 140);
    cx.fillStyle = '#5c9b4a'; cx.fillRect(0, 420, 640, 60);
    // the cartoon jet
    const jy = 380 - jetY * 260 + Math.sin(t * 3) * 4, jx = 330;
    cx.save(); cx.translate(jx, jy); cx.fillStyle = '#8f9ba8'; cx.strokeStyle = INK; cx.lineWidth = 5;
    cx.beginPath(); cx.moveTo(-130, 0); cx.lineTo(90, -16); cx.lineTo(150, 0); cx.lineTo(90, 16); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(-10, -8); cx.lineTo(-70, -60); cx.lineTo(-100, -60); cx.lineTo(-70, 0); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(-10, 8); cx.lineTo(-70, 60); cx.lineTo(-100, 60); cx.lineTo(-70, 0); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(-100, -4); cx.lineTo(-140, -45); cx.lineTo(-150, -45); cx.lineTo(-130, 0); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle = '#7fc4e8'; cx.beginPath(); cx.ellipse(70, -12, 30, 12, 0, 0, 7); cx.fill(); cx.stroke();
    if (jetY > 0.02) { cx.fillStyle = 'rgba(255,170,80,0.8)'; for (const x of [-30, 20]) { cx.beginPath(); cx.moveTo(x - 12, 14); cx.lineTo(x + 12, 14); cx.lineTo(x, 60 + Math.sin(t * 20) * 8); cx.fill(); } }
    cx.restore();
    if (price) {
      cx.fillStyle = 'rgba(20,16,30,0.82)'; cx.fillRect(0, 8, 640, 150);
      cx.fillStyle = '#ffffff'; cx.textAlign = 'center'; cx.font = 'bold 44px Arial, sans-serif'; cx.fillText('HARRIER FIGHTER', 320, 58);
      const sy = 1 - Math.abs(Math.sin(Math.min(1, flip) * Math.PI)) * 0.0;
      cx.save(); cx.translate(320, 118); const k = flip > 0 && flip < 1 ? Math.abs(Math.cos(flip * Math.PI)) : 1; cx.scale(1, Math.max(0.05, k * sy));
      cx.fillStyle = '#ffd84a'; cx.font = 'bold 50px Arial, sans-serif'; cx.fillText(flip >= 0.5 ? '700,000,000 POINTS' : price, 0, 16); cx.restore();
    }
    // scanlines + vignette
    cx.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < 480; y += 4) cx.fillRect(0, y, 640, 1);
    tex.needsUpdate = true;
  };
  draw();
  grp.userData.draw = draw; grp.userData.screen = scr;
  return grp;
}

// soda can with a plain text label (no logo); texture + geometry shared by all cans
const CAN_MAT = {}; const CAN_GEO = new THREE.CylinderGeometry(0.033, 0.033, 0.12, 20, 1, true);
export function sodaCan(label = 'COLA', c = '#2f6db3') {
  const s = g();
  const key = label + c;
  if (!CAN_MAT[key]) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const x = cv.getContext('2d');
    x.fillStyle = c; x.fillRect(0, 0, 256, 256); x.fillStyle = '#f2f0e6'; x.fillRect(0, 150, 256, 40);
    x.fillStyle = '#ffffff'; x.font = 'bold 54px Arial'; x.textAlign = 'center'; x.fillText(label, 128, 110); x.fillStyle = '#c43d32'; x.font = 'bold 30px Arial'; x.fillText('POINTS', 128, 180);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    CAN_MAT[key] = toon('#ffffff', t);
  }
  const body = new THREE.Mesh(CAN_GEO, CAN_MAT[key]); ink(body, 0.004, false); body.position.y = 0.06; body.rotation.y = Math.PI; s.add(body);
  s.add(cyl(0.033, 0.033, 0.006, '#c9cdd2', {y: 0.121, seg: 20, thick: 0.002}), cyl(0.03, 0.03, 0.006, '#c9cdd2', {y: 0.002, seg: 20, thick: 0.002}));
  return s;
}

// flat clothes on a stand: kind 'tee' | 'jacket' | 'shades' | 'cap'
export function prize(kind, color) {
  const s = g();
  s.add(cyl(0.04, 0.04, 1.4, '#3a3a3f', {y: 0.7, seg: 8, thick: 0.004}), cyl(0.3, 0.32, 0.05, '#3a3a3f', {y: 0.03, seg: 14, thick: 0.004}));
  let shape;
  if (kind === 'tee') shape = [[-0.25, 0], [0.25, 0], [0.25, 0.42], [0.42, 0.34], [0.5, 0.5], [0.18, 0.66], [-0.18, 0.66], [-0.5, 0.5], [-0.42, 0.34], [-0.25, 0.42]];
  else if (kind === 'jacket') shape = [[-0.3, 0], [0.3, 0], [0.32, 0.5], [0.44, 0.0], [0.56, 0.06], [0.42, 0.62], [0.16, 0.74], [-0.16, 0.74], [-0.42, 0.62], [-0.56, 0.06], [-0.44, 0.0], [-0.32, 0.5]];
  if (shape) { const m = flatShape(shape, color, 0.05); m.position.set(0, 1.2, -0.03); s.add(m); if (kind === 'jacket') { s.add(box(0.03, 0.55, 0.02, '#d9c27a', {y: 1.55, z: 0.03, thick: 0.002})); } }
  if (kind === 'shades') { for (const sd of [-1, 1]) s.add(cyl(0.11, 0.11, 0.03, '#1f1f24', {x: 0.13 * sd, y: 1.5, z: 0, seg: 14, thick: 0.004})); s.children.slice(-2).forEach((m) => { m.rotation.x = Math.PI / 2; }); s.add(box(0.12, 0.025, 0.02, '#1f1f24', {y: 1.52, thick: 0.002})); }
  if (kind === 'cap') { const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(color)); ink(d, 0.01, false); d.position.y = 1.42; s.add(d); s.add(box(0.26, 0.02, 0.2, color, {y: 1.43, z: 0.2, thick: 0.004})); }
  return s;
}

// desk calculator
export function calculator() {
  const s = g(); s.add(box(0.22, 0.03, 0.3, '#4a4f58', {y: 0.015, thick: 0.004}));
  s.add(box(0.18, 0.005, 0.06, '#b7d4a8', {y: 0.033, z: -0.1, thick: 0.001, edges: false}));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s.add(box(0.032, 0.012, 0.032, j === 3 ? '#e0533d' : '#d8d4c8', {x: -0.063 + j * 0.042, y: 0.035, z: -0.02 + i * 0.042, thick: 0.001, edges: false}));
  return s;
}

// briefcase with stacks of money; userData.lid rotates open (0 shut -> -1.9 open)
export function briefcase() {
  const s = g(); s.add(box(0.8, 0.12, 0.55, '#5a3a26', {y: 0.06, thick: 0.01}));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) s.add(box(0.16, 0.06, 0.22, '#7fb069', {x: -0.27 + i * 0.18, y: 0.13, z: -0.12 + j * 0.24, thick: 0.004}));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) s.add(box(0.05, 0.065, 0.225, '#f2f0e6', {x: -0.27 + i * 0.18, y: 0.13, z: -0.12 + j * 0.24, thick: 0.001, edges: false}));
  const lidP = g(); lidP.position.set(0, 0.12, -0.275); const lid = box(0.8, 0.1, 0.55, '#6b4430', {y: 0.05, z: 0.275, thick: 0.01}); lidP.add(lid); s.add(lidP);
  lid.add(box(0.2, 0.04, 0.04, '#d9a441', {y: 0, z: 0.29, thick: 0.002}));
  s.userData.lid = lidP; return s;
}

// envelope (flat) with optional stamp text
export function envelope(stamp = null) {
  const s = g(); s.add(box(0.6, 0.02, 0.36, '#f2e6cc', {thick: 0.005}));
  const fl = flatShape([[-0.3, 0], [0.3, 0], [0, -0.17]], '#e6d5b2', 0.004); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.012, -0.18); s.add(fl);
  if (stamp) { const st = sign(stamp, 0.42, 0.12, {bg: '#f2e6cc', fg: '#c43d32', w: 420, h: 120, font: 'bold 80px Arial'}); st.rotation.x = -Math.PI / 2; st.position.set(0.02, 0.06, 0.05); st.rotation.z = 0.15; s.add(st); s.userData.stamp = st; }
  return s;
}

// yellow school bus
export function schoolBus() {
  const b = g();
  b.add(box(9, 2.4, 2.4, '#f2b51e', {y: 1.6}), box(1.6, 1.4, 2.3, '#f2b51e', {x: 5.2, y: 1.1}), box(9.02, 0.12, 2.42, '#2b2b2e', {y: 1.25, edges: false, thick: 0.004}));
  for (let i = 0; i < 7; i++) for (const z of [1.22, -1.22]) b.add(box(0.9, 0.6, 0.02, '#8fc3dd', {x: -3.6 + i * 1.15, y: 2.2, z, thick: 0.01, edges: false}));
  const sg = sign('SCHOOL BUS', 3.2, 0.42, {bg: '#f2b51e', w: 640, h: 84, font: 'bold 64px Arial'}); sg.position.set(0, 3.05, 1.22); b.add(sg);
  for (const [x, z] of [[3.2, 1.15], [-3, 1.15], [3.2, -1.15], [-3, -1.15]]) { const w = cyl(0.5, 0.5, 0.35, '#2b2b2e', {x, y: 0.5, z, seg: 14, thick: 0.02}); w.rotation.x = Math.PI / 2; b.add(w); }
  return b;
}

// a sheet of paper that flutters (for wind / flying papers)
export function paperBits(n, seed = 1) {
  const s = g(); const r = rng(seed); const items = [];
  for (let i = 0; i < n; i++) { const p = box(0.22, 0.004, 0.3, ['#f7f0de', '#fff1b8', '#cfe3f0'][i % 3], {thick: 0.002, edges: false}); s.add(p); items.push({p, a: r(), b: r(), c: r()}); }
  s.userData.update = (t, cx, cy, cz, on) => {
    s.visible = on > 0.01;
    items.forEach(({p, a, b, c}, i) => { const life = (t * (0.4 + a * 0.4) + c) % 1; const ang = a * 6.28 + t * (1 + b); const rad = 1.5 + life * 5; p.position.set(cx + Math.cos(ang) * rad, cy + life * 4 * on, cz + Math.sin(ang) * rad * 0.6); p.rotation.set(t * 3 + i, t * 2 + a * 5, t * 4 + b * 3); });
  };
  return s;
}

// money stacks (for the price board)
export function cashPile(n = 6, seed = 1) { const s = g(); const r = rng(seed); for (let i = 0; i < n; i++) s.add(box(0.36, 0.12, 0.18, '#7fb069', {x: (r() - 0.5) * 0.9, y: 0.06 + Math.floor(i / 3) * 0.12, z: (r() - 0.5) * 0.4, ry: r(), thick: 0.004})); return s; }
