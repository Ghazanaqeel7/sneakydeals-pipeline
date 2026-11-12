import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, paintTex, ink} from './kit.js';

// ---------- submarine (bow towards +z) ----------
export function sub(seed = 1, {L = 11, R = 1.5, color = '#46555c'} = {}) {
  const g = new THREE.Group();
  const tex = paintTex(color, {seed: seed + 3, stains: 30, chips: 30, scratches: 20}); tex.repeat.set(2, 2);
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(R, L, 8, 18), toon('#ffffff', tex));
  hull.rotation.x = Math.PI / 2; hull.position.y = 0.2; ink(hull, 0.07, false); g.add(hull);
  g.add(box(0.9, 1.5, 3.2, color, {y: 2.0, z: -0.6, thick: 0.05}));
  g.add(cyl(0.07, 0.07, 1.3, '#2b2b2e', {y: 3.4, z: -1.5, seg: 8, thick: 0.01}));
  g.add(cyl(0.05, 0.05, 0.9, '#2b2b2e', {y: 3.2, z: -0.4, seg: 8, thick: 0.01}));
  // rust bands + deck strip + number
  const r = rng(seed * 9 + 1);
  for (let i = 0; i < 4; i++) g.add(box(0.5 + r() * 0.6, 0.02, 1.0 + r() * 1.5, '#9a5a3c', {x: (r() - 0.5) * 1.3, y: 1.68, z: -3.5 + i * 2.6 + r(), edges: false, thick: 0.002}));
  g.add(box(0.6, 0.03, L * 0.8, '#2f3b40', {y: 1.7, z: 0, edges: false, thick: 0.002}));
  return g;
}

// ---------- surface warship (bow towards +x) ----------
export function warship(len = 30, wid = 6, {seed = 1, color = '#7b8985', funnels = 2} = {}) {
  const g = new THREE.Group();
  const bow = len * 0.24, h = 3.4;
  const s = new THREE.Shape();
  s.moveTo(-len / 2, -wid / 2); s.lineTo(len / 2 - bow, -wid / 2);
  s.quadraticCurveTo(len / 2 - bow * 0.15, -wid / 2, len / 2, 0);
  s.quadraticCurveTo(len / 2 - bow * 0.15, wid / 2, len / 2 - bow, wid / 2); s.lineTo(-len / 2, wid / 2); s.closePath();
  const tex = paintTex(color, {seed, stains: 50, chips: 50, scratches: 40}); tex.repeat.set(3, 1);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth: h, bevelEnabled: false}), toon('#ffffff', tex));
  hull.rotation.x = -Math.PI / 2; hull.position.y = -1.3; ink(hull, 0.09, true, 25); g.add(hull);
  const dk = -1.3 + h; // deck height
  g.add(box(len * 0.9, 0.25, wid * 0.1, '#9a5a3c', {y: -0.5, z: wid / 2 + 0.02, edges: false, thick: 0.003}));
  g.add(box(len * 0.9, 0.25, wid * 0.1, '#9a5a3c', {y: -0.5, z: -wid / 2 - 0.02, edges: false, thick: 0.003}));
  // bridge + superstructure
  g.add(box(len * 0.2, 2.6, wid * 0.62, '#c9cfcd', {x: len * 0.08, y: dk + 1.3, thick: 0.05}));
  g.add(box(len * 0.12, 1.8, wid * 0.52, '#b4bcba', {x: len * 0.08, y: dk + 3.5, thick: 0.05}));
  g.add(box(len * 0.12, 0.5, wid * 0.62, '#2b2b2e', {x: len * 0.08, y: dk + 3.5, z: 0, edges: false, thick: 0.002}));
  for (let i = 0; i < funnels; i++) g.add(cyl(0.9, 1.05, 2.6, i % 2 ? '#8a8f93' : '#a7473a', {x: -len * 0.12 - i * len * 0.14, y: dk + 1.8, seg: 14, thick: 0.05}));
  // mast + radar
  g.add(cyl(0.12, 0.16, 6, '#4a4a4f', {x: len * 0.08, y: dk + 7, seg: 8, thick: 0.02}));
  g.add(box(2.6, 0.18, 0.12, '#4a4a4f', {x: len * 0.08, y: dk + 8.6, thick: 0.01}));
  // turrets
  for (const tx of [len * 0.32, -len * 0.38]) {
    g.add(cyl(1.0, 1.15, 0.9, '#8a948f', {x: tx, y: dk + 0.45, seg: 14, thick: 0.04}));
    g.add(box(2.8, 0.26, 0.26, '#4a4a4f', {x: tx + 1.6, y: dk + 0.9, z: 0.3, thick: 0.01}), box(2.8, 0.26, 0.26, '#4a4a4f', {x: tx + 1.6, y: dk + 0.9, z: -0.3, thick: 0.01}));
  }
  // lifeboats / crates on deck
  g.add(box(2.2, 0.8, 1.0, '#c06d3c', {x: -len * 0.3, y: dk + 0.4, z: wid * 0.3, thick: 0.03}));
  return g;
}

// ---------- bottle ----------
export function bottle(c = '#2f6db3') {
  const g = new THREE.Group();
  g.add(cyl(0.13, 0.13, 0.5, c, {y: 0.25, seg: 10, thick: 0.012}), cyl(0.05, 0.13, 0.16, c, {y: 0.58, seg: 10, thick: 0.01}),
    cyl(0.05, 0.05, 0.16, c, {y: 0.74, seg: 8, thick: 0.01}), cyl(0.058, 0.058, 0.05, '#c43d32', {y: 0.85, seg: 8, thick: 0.008}),
    cyl(0.137, 0.137, 0.17, '#f2f0e6', {y: 0.26, seg: 10, thick: 0.004}));
  return g;
}

// ---------- onion-dome tower ----------
export function domeTower(h, color, domeColor, r = 2.2) {
  const g = new THREE.Group();
  g.add(cyl(r, r * 1.1, h, color, {y: h / 2, seg: 14, thick: 0.06}));
  g.add(cyl(r * 1.15, r * 1.15, 0.5, '#e9dcc3', {y: h, seg: 14, thick: 0.05}));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.2, 18, 14), toon(domeColor));
  dome.scale.set(1, 1.3, 1); dome.position.y = h + r * 1.3; ink(dome, 0.07, false); g.add(dome);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.3, r * 1.0, 10), toon('#e6b94a')); tip.position.y = h + r * 3.0; ink(tip, 0.04, false); g.add(tip);
  return g;
}

export function stripeTex(c1, c2, n = 8) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * 256 / n, 0, 256 / n, 64); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- drink kiosk ----------
export function kiosk(label, {bg = '#2f6db3', fg = '#ffffff', c1 = '#c43d32', c2 = '#f2f0e6'} = {}) {
  const g = new THREE.Group();
  g.add(box(4, 2.6, 2.2, '#e8e0cc', {y: 1.3, thick: 0.04}));
  g.add(box(4.4, 0.16, 1.0, '#8a5a3b', {y: 1.1, z: 1.55, thick: 0.02}));
  const awn = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 2.2), toon('#ffffff', stripeTex(c1, c2)));
  awn.position.set(0, 2.75, 1.5); awn.rotation.x = 0.28; ink(awn, 0.02, true); g.add(awn);
  const sg = sign(label, 4.4, 1.0, {bg, fg, w: 640, h: 150, font: 'bold 104px Arial, sans-serif'}); sg.position.set(0, 3.55, 0.4); g.add(sg);
  g.add(cyl(0.06, 0.06, 1.2, '#3a3a3a', {x: -2.0, y: 3.2, z: 0.4, seg: 8}), cyl(0.06, 0.06, 1.2, '#3a3a3a', {x: 2.0, y: 3.2, z: 0.4, seg: 8}));
  for (let i = 0; i < 7; i++) { const b = bottle(i % 2 ? '#2f6db3' : '#3b7fc4'); b.position.set(-1.8 + i * 0.6, 1.18, 1.5); b.scale.setScalar(1.15); g.add(b); }
  return g;
}

// ---------- brick wall with battlements ----------
export function brickWall(len, h = 7) {
  const g = new THREE.Group();
  const tex = paintTex('#9a4538', {seed: 5, stains: 40, chips: 30, scratches: 40, stripes: (gg, W, H) => { gg.strokeStyle = 'rgba(40,15,12,0.35)'; gg.lineWidth = 2; for (let i = 1; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); } }});
  tex.repeat.set(len / 12, 1);
  const w = new THREE.Mesh(new THREE.BoxGeometry(len, h, 2.2), toon('#ffffff', tex)); w.position.y = h / 2; ink(w, 0.05, true); g.add(w);
  for (let i = 0; i < len / 2.6; i++) g.add(box(1.4, 1.3, 2.0, '#a64c3d', {x: -len / 2 + 1 + i * 2.6, y: h + 0.65, thick: 0.03}));
  return g;
}
