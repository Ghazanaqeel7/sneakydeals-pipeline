import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, facade, ground, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';
import {jet, crtTV, sodaCan, prize, calculator, briefcase, envelope, schoolBus, paperBits, cashPile, at} from './jet-props.js';

export const LOC = {tv: 0, mall: 300, school: 600, dorm: 900, air: 1200, office: 1500, mail: 1800, court: 2100};

export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const pop = (o, t, a, d = 0.35) => { const k = ease(t, a, a + d); const s = k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1; o.scale.setScalar(Math.max(0.001, s)); o.visible = k > 0.001; };

function room(ox, {w = 14, h = 5, d = 10, wall = '#efe0c4', floor = '#a7764e', seed = 4} = {}) {
  const g = new THREE.Group();
  const wt = paintTex(wall, {seed, stains: 14}); wt.repeat.set(2, 1);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon('#ffffff', wt, {side: THREE.BackSide}));
  walls.position.set(ox, h / 2, 0); walls.receiveShadow = true; g.add(walls);
  const ft = paintTex(floor, {seed: seed + 1, stripes: (gg, W, H) => { gg.strokeStyle = 'rgba(60,30,15,0.35)'; gg.lineWidth = 2; for (let i = 0; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); } }});
  ft.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.1, d - 0.02), toon('#ffffff', ft)); fl.position.set(ox, 0.0, 0); fl.receiveShadow = true; g.add(fl);
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  return g;
}
const person = (W, chars, x, y, z, palette, hat = 'none', glasses = false, seed = 1) => { const c = character({palette, hat, glasses, seed}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };
const lampBulb = (W, x, y, z, h = 0.8) => { W.add(cyl(0.02, 0.02, h, '#2b2b2e', {x, y: y + h / 2 + 0.15, z})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: y + 0.15, z, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, y, z); W.add(b); };
const wallSign = (W, text, w, h, x, y, z, opts = {}) => { const s = sign(text, w, h, {w: Math.round(w * 220), h: Math.round(h * 220), font: 'bold 120px Arial, sans-serif', ...opts}); s.position.set(x, y, z); W.add(s); return s; };
const canvasBoard = (W, w, h, x, y, z, pw = 640, ph = 400) => {
  const c = document.createElement('canvas'); c.width = pw; c.height = ph; const cx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const b = box(w, h, 0.08, '#ffffff', {thick: 0.02}); const fr = toon('#5a3a26');
  b.material = [fr, fr, fr, fr, new THREE.MeshBasicMaterial({map: tex}), fr]; b.position.set(x, y, z); W.add(b);
  return {cx, tex, mesh: b};
};

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];

  // ======== 90s TV ROOM (hook, price, close) ========
  const T = LOC.tv;
  W.add(room(T, {w: 12, h: 4.6, d: 9, wall: '#9fc7c2', floor: '#a7764e', seed: 5}));
  W.add(P.at(P.rug(4.4, 3.2, '#3e5a7a', '#d9a441'), T + 0.1, 0, -1.0));
  const tv = crtTV(); tv.position.set(T, 0.05, -3.6); W.add(tv);
  // VHS tapes + game console on the stand
  for (let i = 0; i < 4; i++) W.add(box(0.2, 0.04, 0.12, ['#2b2b2e', '#c43d32', '#2f6db3', '#2b2b2e'][i], {x: T - 0.75 + i * 0.03, y: 0.77 + i * 0.045, z: -3.05, thick: 0.002}));
  W.add(box(0.36, 0.08, 0.26, '#6f6f78', {x: T + 0.62, y: 0.79, z: -3.1, thick: 0.004}));
  // coffee table with cans, chips, remote, pizza box
  W.add(box(1.8, 0.08, 0.9, '#8a5a3b', {x: T + 0.2, y: 0.44, z: -1.15}));
  for (const [x, z] of [[-0.6, -0.8], [0.95, -0.8], [-0.6, -1.5], [0.95, -1.5]]) W.add(box(0.07, 0.42, 0.07, '#6b4430', {x: T + x, y: 0.21, z}));
  const can = sodaCan('PEPSI', '#2f6db3'); can.position.set(T + 0.35, 0.48, -1.0); W.add(can);
  for (const [x, z, r] of [[-0.25, -1.35, 0], [0.62, -1.4, 0], [0.05, -1.5, 1]]) { const c2 = sodaCan('PEPSI', '#2f6db3'); c2.position.set(T + x, 0.48, z); if (r) { c2.rotation.z = Math.PI / 2; c2.position.y = 0.515; } W.add(c2); }
  W.add(box(0.6, 0.06, 0.6, '#e6c48a', {x: T - 0.35, y: 0.51, z: -0.95, ry: 0.3, thick: 0.004}));
  W.add(box(0.06, 0.03, 0.2, '#2b2b2e', {x: T + 0.75, y: 0.495, z: -0.95, ry: -0.4, thick: 0.002}));
  const bowl = cyl(0.16, 0.1, 0.1, '#c43d32', {x: T - 0.05, y: 0.53, z: -1.15, seg: 14, thick: 0.005}); W.add(bowl);
  for (let i = 0; i < 6; i++) W.add(box(0.06, 0.02, 0.05, '#e8b84a', {x: T - 0.1 + (i % 3) * 0.05, y: 0.59, z: -1.17 + Math.floor(i / 3) * 0.05, edges: false, thick: 0.001}));
  // couch in the foreground (camera pulls back over it)
  const couch = new THREE.Group();
  couch.add(box(2.8, 0.45, 0.95, '#c4793d', {y: 0.28}), box(2.8, 0.7, 0.25, '#a9652f', {y: 0.75, z: 0.42}), box(0.25, 0.65, 0.95, '#a9652f', {x: -1.42, y: 0.45}), box(0.25, 0.65, 0.95, '#a9652f', {x: 1.42, y: 0.45}));
  couch.add(box(0.5, 0.35, 0.15, '#e0b04a', {x: -0.9, y: 0.7, z: 0.22, ry: 0.2}));
  couch.position.set(T + 0.1, 0.05, 1.6); W.add(couch);
  W.add(P.at(P.bookshelf(12), T - 4.6, 0.05, -4.15), P.at(P.bookshelf(13, 2.0, 2.2), T + 4.7, 0.05, -4.15));
  const lampT = new THREE.Group(); lampT.add(cyl(0.03, 0.03, 1.6, '#2b2b2e', {y: 0.8}), cyl(0.2, 0.35, 0.4, '#e6d39a', {y: 1.7, seg: 14})); lampT.position.set(T + 2.9, 0.05, -3.7); W.add(lampT);
  const bulbT = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); bulbT.position.set(T + 2.9, 1.6, -3.7); W.add(bulbT);
  const pT1 = P.poster('SKATE', 1.0, 1.4, '#f2c12e'); P.at(pT1, T - 2.4, 2.9, -4.44); W.add(pT1);
  const pT2 = P.poster('ARCADE', 1.0, 1.4, '#d77a9c'); P.at(pT2, T + 2.0, 3.1, -4.44); W.add(pT2);
  W.add(P.at(P.wallClock(), T, 3.6, -4.42));
  const winT = sign('', 1.8, 1.4, {bg: '#ffd7a0', border: true}); winT.position.set(T - 5.95, 2.4, -1.5); winT.rotation.y = Math.PI / 2; W.add(winT);
  for (let i = 0; i < 6; i++) W.add(box(0.02, 0.05, 1.7, '#f2f0e6', {x: T - 5.9, y: 1.8 + i * 0.22, z: -1.5, thick: 0.002, edges: false}));
  const plantT = new THREE.Group(); plantT.add(cyl(0.3, 0.24, 0.6, '#b35a3a', {y: 0.3})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.25, 0.8 + (i % 3) * 0.22, Math.sin(i) * 0.25); ink(l, 0.02, false); plantT.add(l); }
  plantT.position.set(T - 3.6, 0.05, -3.8); W.add(plantT);
  const kid = person(W, chars, T - 1.95, 0.05, -1.9, 'red', 'cap', false, 101);
  const dad = person(W, chars, T + 2.1, 0.05, -2.3, 'mustard', 'none', true, 102);
  W.add(P.at(P.chair('#2f5d62'), T + 2.1, 0.05, -1.6, Math.PI));

  // ======== PRIZE SHOP (yousee) ========
  const M = LOC.mall;
  W.add(room(M, {w: 16, h: 5, d: 10, wall: '#bfd8ef', floor: '#c49a62', seed: 9}));
  wallSign(W, 'PEPSI STUFF PRIZES', 6.0, 1.0, M + 0.5, 3.9, -4.92, {bg: '#2f6db3', fg: '#ffffff'});
  const p1996 = wallSign(W, '1996', 1.6, 1.0, M - 5.2, 3.25, -4.9, {bg: '#f2c12e'});
  const prizes = [['tee', '#c43d32', -3.5], ['jacket', '#6b4430', -1.5], ['shades', '#1f1f24', 0.5], ['cap', '#2f6db3', 2.0], ['tee', '#2f6db3', 3.5]];
  for (const [k, c, x] of prizes) { const pz = prize(k, c); pz.position.set(M + x, 0.05, -2.6); W.add(pz); W.add(box(1.1, 0.3, 0.8, '#f2f0e6', {x: M + x, y: 0.15, z: -2.6})); }
  const tagTee = wallSign(W, '75 POINTS', 1.3, 0.45, M - 3.3, 2.3, -2.55, {bg: '#fff1b8'});
  const tagJacket = wallSign(W, '1,450 POINTS', 1.5, 0.45, M - 1.5, 2.4, -2.55, {bg: '#fff1b8'});
  W.add(P.at(P.bookshelf(71, 2.4, 2.6), M - 6.6, 0.05, -4.6));
  for (let i = 0; i < 3; i++) { W.add(box(1.0, 0.8, 0.8, ['#c43d32', '#2f6db3', '#f2c12e'][i], {x: M - 7.2 + i * 0.05, y: 0.45 + i * 0.8, z: -0.8, ry: i * 0.2})); }
  const rackL = prize('tee', '#4f8a4a'); rackL.position.set(M - 5.2, 0.05, -1.4); W.add(rackL);
  const rackL2 = prize('jacket', '#2b2b2e'); rackL2.position.set(M - 4.2, 0.05, -3.4); W.add(rackL2);
  person(W, chars, M - 7.0, 0.05, -2.2, 'red', 'cap', false, 206);
  person(W, chars, M - 3.2, 0.05, -3.6, 'mustard', 'none', true, 207);
  // shelves of cans + crates
  for (let i = 0; i < 3; i++) { W.add(box(2.4, 0.06, 0.5, '#7a4f33', {x: M + 5.6, y: 0.6 + i * 0.6, z: -4.55})); for (let j = 0; j < 8; j++) { const c = sodaCan('COLA', ['#2f6db3', '#c43d32'][(i + j) % 2]); c.scale.setScalar(2.2); c.position.set(M + 4.6 + j * 0.28, 0.63 + i * 0.6, -4.5); W.add(c); } }
  W.add(box(2.2, 1.0, 0.8, '#c43d32', {x: M + 5.4, y: 0.5, z: -0.6}), box(2.3, 0.08, 0.9, '#f2f0e6', {x: M + 5.4, y: 1.04, z: -0.6}));
  W.add(P.at(P.phone(), M + 5.0, 1.08, -0.6));
  W.add(P.at(P.wallClock(), M + 3.4, 3.7, -4.9));
  const pM1 = P.poster('NEW!', 1.0, 1.3, '#d77a9c'); P.at(pM1, M - 7.95, 2.7, -1.5); pM1.rotation.y = Math.PI / 2; W.add(pM1);
  lampBulb(W, M - 2.5, 4.3, -1.5, 0.4); lampBulb(W, M + 2.5, 4.3, -1.5, 0.4);
  person(W, chars, M + 5.6, 0.05, -1.5, 'teal', 'none', false, 201);
  person(W, chars, M - 0.5, 0.05, -1.4, 'pink', 'none', true, 202);
  person(W, chars, M + 2.8, 0.05, -1.0, 'navy', 'cap', false, 203);
  person(W, chars, M - 6.2, 0.05, -2.8, 'clerk', 'bowler', false, 204);
  person(W, chars, M + 1.2, 0.05, 1.8, 'student', 'cap', false, 205);

  // ======== HIGH SCHOOL (school) ========
  const S = LOC.school;
  W.add(ground(140, 110, '#7fae5a', {x: S, z: -20, seed: 31, repeat: 14}));
  W.add(box(8, 0.06, 26, '#bdb3a2', {x: S, y: 0.03, z: 0, edges: false, thick: 0.001}));
  W.add(facade({w: 34, h: 9, color: '#c4664e', cols: 9, rows: 2, door: true, seed: 33}).translateX(S).translateZ(-16));
  W.add(box(34, 9, 10, '#a85a46', {x: S, y: 4.5, z: -21.2, thick: 0.04}));
  wallSign(W, 'HIGH SCHOOL', 9, 1.4, S, 9.9, -15.7, {bg: '#f2e6cc'});
  W.add(cyl(0.08, 0.1, 9, '#d9d9d9', {x: S - 6, y: 4.5, z: -10}));
  const fl = P.flag('#2f6db3', 3); fl.position.set(S - 6, 7.5, -10); W.add(fl);
  const bus1 = schoolBus(); bus1.position.set(S - 13, 0, -9); bus1.rotation.y = 0.15; W.add(bus1);
  const bus2 = schoolBus(); bus2.position.set(S + 13.5, 0, -10); bus2.rotation.y = -0.2; W.add(bus2);
  for (let i = 0; i < 6; i++) { W.add(P.at(P.tree(1.4, 330 + i), S - 30 + i * 12, 0.05, -12 - (i % 2) * 3)); }
  for (let i = 0; i < 4; i++) W.add(P.at(P.tree(1.2, 340 + i), S - 16 + i * 11, 0.05, 9));
  W.add(P.at(P.bench(), S + 7, 0.05, -4, -0.3), P.at(P.bench(), S - 8, 0.05, -3, 0.3), P.at(P.trashCan(), S + 5.8, 0.05, -2.2));
  for (let i = 0; i < 6; i++) W.add(cloud(S - 70 + i * 28, 60 + (i % 3) * 8, -110, 6));
  const r1 = rng(61);
  const studs = ['red', 'teal', 'mustard', 'pink', 'navy', 'student', 'clerk', 'red', 'teal', 'mustard', 'pink', 'navy'];
  studs.forEach((pal, i) => { const x = S - 11 + i * 2 + r1() * 0.8; if (Math.abs(x - S) < 5.5) return; person(W, chars, x, 0.05, -6.5 + r1() * 3, pal, ['none', 'cap', 'none'][i % 3], r1() > 0.7, 610 + i); });
  person(W, chars, S + 6.6, 0.05, 1.6, 'teal', 'cap', false, 631);
  person(W, chars, S + 1.4, 0.05, 1.0, 'pink', 'none', true, 632);
  const jetS = jet(); jetS.position.set(S, 9, -5); jetS.rotation.y = 0.45; W.add(jetS);
  const papersS = paperBits(14, 7); W.add(papersS);

  // ======== DORM ROOM at night (student, rules, math) ========
  const D = LOC.dorm;
  W.add(room(D, {w: 10, h: 4, d: 8, wall: '#7f9fc9', floor: '#8a6a4e', seed: 13}));
  const dsk = P.desk(2.4, '#8a5a3b'); dsk.position.set(D - 0.9, 0.05, -2.7); W.add(dsk);
  W.add(P.at(P.chair('#c43d32'), D - 0.9, 0.05, -1.9, Math.PI));
  W.add(P.at(P.deskLamp(), D - 1.9, 1.05, -2.95));
  const calc = calculator(); calc.position.set(D - 0.2, 1.05, -2.55); calc.rotation.y = -0.2; W.add(calc);
  W.add(P.at(P.papers(6, 41), D - 1.5, 1.06, -2.6));
  for (let i = 0; i < 5; i++) { const c = sodaCan('PEPSI', '#2f6db3'); c.scale.setScalar(1.6); c.position.set(D + 0.05 + (i % 3) * 0.13, 1.05, -3.0 + Math.floor(i / 3) * 0.12); W.add(c); }
  // rules sheet on the desk (canvas, flat)
  const rulesC = document.createElement('canvas'); rulesC.width = 400; rulesC.height = 560; const rg = rulesC.getContext('2d');
  const rulesTex = new THREE.CanvasTexture(rulesC); rulesTex.colorSpace = THREE.SRGBColorSpace; rulesTex.anisotropy = 8;
  const drawRules = (hl) => {
    rg.fillStyle = '#f7f0de'; rg.fillRect(0, 0, 400, 560); rg.strokeStyle = INK; rg.lineWidth = 8; rg.strokeRect(6, 6, 388, 548);
    rg.fillStyle = INK; rg.textAlign = 'center'; rg.font = 'bold 44px Arial'; rg.fillText('PRIZE RULES', 200, 66);
    rg.fillStyle = '#bcae92'; for (let i = 0; i < 4; i++) rg.fillRect(40, 100 + i * 30, 320 - (i % 2) * 60, 10);
    if (hl > 0) { rg.fillStyle = `rgba(255,216,74,${hl})`; rg.fillRect(22, 210, 356 * Math.min(1, hl * 1.2), 150); }
    rg.fillStyle = INK; rg.font = 'bold 40px Arial'; rg.fillText('EXTRA POINTS', 200, 260); rg.font = 'bold 72px Arial'; rg.fillStyle = '#c43d32'; rg.fillText('10¢ EACH', 200, 338);
    rg.fillStyle = '#bcae92'; for (let i = 0; i < 5; i++) rg.fillRect(40, 400 + i * 28, 320 - (i % 3) * 50, 10);
    rulesTex.needsUpdate = true;
  };
  drawRules(0);
  const rules = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.004, 0.7), [toon('#f7f0de'), toon('#f7f0de'), toon('#ffffff', rulesTex), toon('#f7f0de'), toon('#f7f0de'), toon('#f7f0de')]);
  rules.position.set(D - 0.85, 1.07, -2.5); rules.rotation.y = 0.08; W.add(rules);
  // whiteboard for the math
  const wb = canvasBoard(W, 2.4, 1.5, D + 2.3, 2.2, -3.94);
  const drawMath = (a, b, c) => {
    const x = wb.cx; x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, 640, 400); x.textAlign = 'center';
    x.globalAlpha = a; x.fillStyle = '#2f3a8f'; x.font = 'bold 74px Arial'; x.fillText('7,000,000', 320, 100);
    x.globalAlpha = b; x.fillStyle = '#2f3a8f'; x.font = 'bold 66px Arial'; x.fillText('× 10¢', 320, 190);
    x.fillStyle = '#2f3a8f'; x.fillRect(120, 220, 400 * b, 8);
    x.globalAlpha = c; x.fillStyle = '#c43d32'; x.font = 'bold 92px Arial'; x.fillText('$700,000', 320, 330);
    x.globalAlpha = 1; wb.tex.needsUpdate = true;
  };
  drawMath(0, 0, 0);
  // rainy window + pennant + posters + bed + roommate
  const winD = sign('', 1.8, 1.4, {bg: '#1f2a52', border: true}); winD.position.set(D - 2.9, 2.3, -3.95); W.add(winD);
  const rainG = new THREE.BufferGeometry(); const RN = 70; const rp = new Float32Array(RN * 6); rainG.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainG, new THREE.LineBasicMaterial({color: '#9fb7e0'})); W.add(rain); const rs = Array.from({length: RN}, (_, i) => [rng(500 + i)(), rng(900 + i)()]);
  for (let i = 0; i < 3; i++) W.add(box(0.06, 1.3, 0.02, '#e8d9b8', {x: D - 2.9 + (i - 1) * 0.6, y: 2.3, z: -3.88, thick: 0.002, edges: false}));
  const pen = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0.3); s.lineTo(1.7, 0); s.lineTo(0, -0.3); s.closePath(); return s; })()), toon('#2f5d62'));
  pen.position.set(D + 0.1, 3.3, -3.93); W.add(pen);
  const penTxt = sign('SEATTLE', 1.0, 0.24, {bg: '#2f5d62', fg: '#f2f0e6', border: false, w: 400, h: 96, font: 'bold 78px Arial'}); penTxt.position.set(D + 0.62, 3.3, -3.9); W.add(penTxt);
  const pD1 = P.poster('BUSINESS 101', 1.0, 1.3, '#e6d39a'); P.at(pD1, D - 4.95, 2.4, -1.6); pD1.rotation.y = Math.PI / 2; W.add(pD1);
  const bed = new THREE.Group(); bed.add(box(1.2, 0.45, 2.3, '#6b4430', {y: 0.23}), box(1.15, 0.2, 2.2, '#d77a9c', {y: 0.55}), box(0.8, 0.15, 0.4, '#f2f0e6', {y: 0.72, z: -0.85})); bed.position.set(D + 4.0, 0.05, -1.6); W.add(bed);
  W.add(P.at(P.bookshelf(44, 1.6, 2.0), D - 4.6, 0.05, -3.6));
  W.add(P.at(P.trashCan(), D + 0.9, 0.05, -3.4));
  for (let i = 0; i < 4; i++) { const c = sodaCan('PEPSI', '#2f6db3'); c.scale.setScalar(1.6); c.rotation.z = Math.PI / 2; c.position.set(D + 0.6 + i * 0.25, 0.1, -2.6 + (i % 2) * 0.3); W.add(c); }
  const studentD = person(W, chars, D + 0.75, 0.05, -1.95, 'student', 'cap', true, 301);
  person(W, chars, D + 3.7, 0.05, -0.2, 'teal', 'none', false, 302);
  lampBulb(W, D, 3.4, -1.0, 0.4);

  // ======== AIRFIELD (jetcost) ========
  const A = LOC.air;
  W.add(ground(150, 110, '#9a9a96', {x: A, z: -20, seed: 51, repeat: 14}));
  for (let i = -6; i < 7; i++) W.add(box(3.2, 0.03, 0.35, '#efe7d2', {x: A + i * 7, y: 0.02, z: 3.5, edges: false, thick: 0.001}));
  W.add(box(30, 13, 18, '#9aa4ad', {x: A, y: 6.5, z: -26, thick: 0.06}));
  W.add(box(18, 9, 0.2, '#3a3e48', {x: A - 2, y: 4.5, z: -16.9, edges: false, thick: 0.001}));
  wallSign(W, 'HANGAR 3', 6, 1.2, A - 2, 10.6, -16.8, {bg: '#f2e6cc'});
  const tw = new THREE.Group(); tw.add(cyl(1.2, 1.5, 16, '#d9d4c7', {y: 8})); tw.add(cyl(2.6, 2.2, 2.6, '#7fc4e8', {y: 17.3})); tw.add(cyl(2.8, 2.8, 0.4, '#5a5f66', {y: 18.8})); tw.position.set(A + 24, 0, -40); W.add(tw);
  const jetA = jet(); jetA.position.set(A, 0.0, -4.2); jetA.rotation.y = 0.3; jetA.userData.glow.visible = false; W.add(jetA);
  const bigTag = wallSign(W, '$20,000,000+', 4.4, 1.5, A + 4.6, 3.6, -2.0, {bg: '#fff1b8', fg: '#c43d32'});
  const bigPoles = new THREE.Group(); bigPoles.add(cyl(0.08, 0.08, 3.0, '#3a3a3a', {x: A + 2.8, y: 1.5, z: -2.05}), cyl(0.08, 0.08, 3.0, '#3a3a3a', {x: A + 6.4, y: 1.5, z: -2.05})); W.add(bigPoles);
  const smallTag = wallSign(W, '$700,000', 0.9, 0.38, A - 2.6, 1.05, -0.6, {bg: '#f2e6cc'});
  W.add(cyl(0.03, 0.03, 0.85, '#3a3a3a', {x: A - 2.6, y: 0.43, z: -0.65}));
  const fuel = P.car('#d9a441'); fuel.scale.set(1.6, 1.5, 1.3); fuel.position.set(A - 11, 0, -6); fuel.rotation.y = 0.5; W.add(fuel);
  for (const [x, z] of [[A - 6, -0.5], [A + 8.5, 0.8], [A + 9.5, -0.2], [A - 7.5, 1.2]]) W.add(P.at(P.cone(), x, 0.05, z));
  W.add(P.at(P.barrel('#c43d32'), A - 8, 0.05, -3), P.at(P.barrel('#2f6db3'), A - 8.9, 0.05, -2.4), P.at(P.toolbox(), A - 4.4, 0.05, -1.4), P.at(P.ladder(2.2), A + 2.0, 0.05, -5.6));
  person(W, chars, A - 4.0, 0.05, -2.2, 'welder', 'cap', false, 401);
  person(W, chars, A + 7.8, 0.05, -4.5, 'navy', 'cap', false, 402);
  person(W, chars, A - 9.5, 0.05, -5.0, 'mustard', 'cap', false, 403);
  for (let i = 0; i < 6; i++) W.add(cloud(A - 70 + i * 28, 55 + (i % 3) * 8, -110, 6));
  for (let i = 0; i < 5; i++) W.add(P.at(P.tree(1.3, 450 + i), A - 40 + i * 20, 0.05, -45));

  // ======== INVESTORS' OFFICE (raise) ========
  const O = LOC.office;
  W.add(room(O, {w: 14, h: 5, d: 10, wall: '#bfe0db', floor: '#a7764e', seed: 21}));
  W.add(P.at(P.rug(5, 3.4, '#a8433a', '#e0b04a'), O, 0, -1.2));
  const bigDesk = P.desk(3.2, '#7a4f33'); bigDesk.position.set(O, 0.05, -1.6); W.add(bigDesk);
  const bc1 = briefcase(); bc1.position.set(O - 0.7, 1.05, -1.5); bc1.rotation.y = 0.1; W.add(bc1);
  const bc2 = briefcase(); bc2.position.set(O + 0.75, 1.05, -1.55); bc2.rotation.y = -0.1; W.add(bc2);
  W.add(P.at(P.papers(4, 51), O + 1.3, 1.06, -1.3), P.at(P.mug('#2f6db3'), O - 1.45, 1.05, -1.3), P.at(P.phone(), O + 1.45, 1.05, -1.8));
  const loan = wallSign(W, 'LOAN: $700,000', 3.4, 0.9, O, 3.5, -4.92, {bg: '#e6d39a'});
  const chartC = canvasBoard(W, 1.6, 1.2, O - 3.6, 3.0, -4.94, 320, 240); { const x = chartC.cx; x.fillStyle = '#f7f0de'; x.fillRect(0, 0, 320, 240); x.strokeStyle = '#4f8a4a'; x.lineWidth = 12; x.beginPath(); x.moveTo(20, 200); x.lineTo(110, 150); x.lineTo(170, 170); x.lineTo(300, 40); x.stroke(); chartC.tex.needsUpdate = true; }
  W.add(P.at(P.bookshelf(52), O + 4.6, 0.05, -4.55), P.at(P.filingCabinet(), O - 5.8, 0.05, -4.4), P.at(P.filingCabinet('#8f7d6a'), O - 5.0, 0.05, -4.4));
  W.add(P.at(P.wallClock(), O + 2.6, 4.1, -4.9));
  const winO = sign('', 2.4, 1.8, {bg: '#bfe3f5', border: true}); winO.position.set(O - 6.95, 2.6, -1.5); winO.rotation.y = Math.PI / 2; W.add(winO);
  for (let i = 0; i < 4; i++) W.add(box(0.03, 0.6 + i * 0.3, 0.4, '#8fa6b8', {x: O - 6.9, y: 1.9 + i * 0.15, z: -2.3 + i * 0.5, edges: false, thick: 0.001}));
  const plantO = plantT.clone(); plantO.position.set(O + 5.8, 0.05, -2.0); W.add(plantO);
  lampBulb(W, O - 2, 4.2, -1.2, 0.5); lampBulb(W, O + 2, 4.2, -1.2, 0.5);
  person(W, chars, O - 1.4, 0.05, -2.75, 'navy', 'top', false, 501);
  person(W, chars, O + 1.5, 0.05, -2.75, 'official', 'bowler', true, 502);
  person(W, chars, O + 3.2, 0.05, -1.6, 'clerk', 'bowler', false, 503);
  const studentO = person(W, chars, O - 2.6, 0.05, -0.9, 'student', 'cap', true, 504);

  // ======== POST OFFICE (check, but) ========
  const L = LOC.mail;
  W.add(room(L, {w: 14, h: 5, d: 10, wall: '#a9c9e8', floor: '#b48a62', seed: 25}));
  wallSign(W, 'POST OFFICE', 4.4, 0.9, L + 1.5, 4.0, -4.92, {bg: '#2f5d9e', fg: '#ffffff'});
  W.add(box(7.5, 1.1, 0.8, '#7a4f33', {x: L + 2.2, y: 0.55, z: -2.4}), box(7.6, 0.08, 0.95, '#c49a62', {x: L + 2.2, y: 1.14, z: -2.4}));
  // pigeonholes
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) W.add(box(0.5, 0.4, 0.3, ['#e6d39a', '#f2e6cc', '#cfe3f0'][(i + j) % 3], {x: L - 0.4 + i * 0.56, y: 1.8 + j * 0.45, z: -4.75, thick: 0.006}));
  const sack = (x, z, c = '#c4a27c') => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), toon(c)); m.scale.set(1, 1.3, 0.9); m.position.set(x, 0.55, z); ink(m, 0.02, false); W.add(m); };
  sack(L - 4.6, -3.6); sack(L - 3.8, -3.9, '#b8956a'); sack(L + 6.0, -3.6); sack(L - 5.3, -2.6, '#d1b07c');
  const mbox = P.mailbox(); mbox.scale.setScalar(1.25); mbox.position.set(L - 1.8, 0.05, -0.2); W.add(mbox);
  W.add(P.at(P.wallClock(), L - 3.0, 3.9, -4.9));
  const pL1 = P.poster('STAMPS', 1.0, 1.3, '#f2c12e'); P.at(pL1, L - 4.8, 2.6, -4.94); W.add(pL1);
  lampBulb(W, L - 2, 4.2, -1.0, 0.5); lampBulb(W, L + 2.5, 4.2, -1.0, 0.5);
  const clerk = person(W, chars, L + 1.6, 0.05, -3.25, 'clerk', 'cap', false, 601);
  person(W, chars, L + 4.6, 0.05, -3.3, 'pink', 'none', true, 602);
  person(W, chars, L + 5.2, 0.05, -0.6, 'mustard', 'bowler', false, 603);
  const studentL = person(W, chars, L - 3.2, 0.05, 0.1, 'student', 'cap', true, 604);
  const env = envelope(); W.add(env);
  const envBack = envelope('RETURNED'); W.add(envBack);
  const checkCard = (() => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 300; const x = c.getContext('2d');
    x.fillStyle = '#d8ecd2'; x.fillRect(0, 0, 640, 300); x.strokeStyle = '#4f8a4a'; x.lineWidth = 10; x.strokeRect(8, 8, 624, 284);
    x.fillStyle = INK; x.font = 'bold 34px Arial'; x.textAlign = 'left'; x.fillText('PAY TO: PEPSI', 40, 70); x.fillStyle = '#bcae92'; x.fillRect(40, 220, 260, 8);
    x.fillStyle = '#c43d32'; x.font = 'bold 76px Arial'; x.textAlign = 'center'; x.fillText('$700,008.50', 330, 170);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.52), toon('#ffffff', t)); ink(m, 0.008, false); return m;
  })();
  W.add(checkCard);
  const pts = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = sign('PTS', 0.22, 0.14, {bg: '#2f6db3', fg: '#ffffff', w: 160, h: 100, font: 'bold 60px Arial'}); s.position.set(-0.24 + i * 0.12, Math.sin(i) * 0.03, i * 0.01); s.rotation.z = (i - 2) * 0.2; pts.add(s); }
  W.add(pts);
  const letter = (() => {
    const c = document.createElement('canvas'); c.width = 420; c.height = 520; const x = c.getContext('2d');
    x.fillStyle = '#fbf7ee'; x.fillRect(0, 0, 420, 520); x.strokeStyle = INK; x.lineWidth = 8; x.strokeRect(6, 6, 408, 508);
    x.fillStyle = '#bcae92'; for (let i = 0; i < 4; i++) x.fillRect(40, 40 + i * 26, 340 - i * 40, 10);
    // cartoon jet with a big smile
    x.save(); x.translate(210, 250); x.fillStyle = '#8f9ba8'; x.strokeStyle = INK; x.lineWidth = 6;
    x.beginPath(); x.moveTo(-150, 0); x.lineTo(100, -26); x.lineTo(160, 0); x.lineTo(100, 26); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-20, -14); x.lineTo(-80, -80); x.lineTo(-115, -80); x.lineTo(-80, 0); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(70, -6, 9, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(72, -6, 4, 0, 7); x.fill();
    x.lineWidth = 6; x.beginPath(); x.arc(85, 4, 20, 0.2, Math.PI - 0.2); x.stroke(); x.restore();
    x.fillStyle = '#f2c12e'; x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.arc(210, 420, 52, 0, 7); x.fill(); x.stroke();
    x.fillStyle = INK; x.beginPath(); x.arc(192, 408, 7, 0, 7); x.arc(228, 408, 7, 0, 7); x.fill(); x.beginPath(); x.arc(210, 425, 28, 0.2, Math.PI - 0.2); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.77), toon('#ffffff', t)); ink(m, 0.008, false); return m;
  })();
  W.add(letter);

  // ======== COURTROOM (court) ========
  const C = LOC.court;
  W.add(room(C, {w: 16, h: 6, d: 12, wall: '#8fb3c9', floor: '#8a5a3b', seed: 29}));
  for (let i = 0; i < 8; i++) W.add(box(1.9, 1.4, 0.08, '#7a4f33', {x: C - 6.65 + i * 1.9, y: 0.75, z: -5.92, thick: 0.01}));
  W.add(box(5, 0.9, 2.4, '#6b4430', {x: C, y: 0.45, z: -4.6}));                         // platform
  W.add(box(4.4, 1.4, 1.0, '#7a4f33', {x: C, y: 0.7, z: -3.4}), box(4.6, 0.1, 1.2, '#5a3a26', {x: C, y: 1.44, z: -3.4}));
  const judge = person(W, chars, C, 0.92, -4.15, 'official', 'none', true, 701);
  const gavel = new THREE.Group(); const gh = cyl(0.025, 0.025, 0.4, '#5a3a26', {seg: 8, thick: 0.004}); gh.rotation.z = Math.PI / 2; gh.position.set(0.2, 0, 0); gavel.add(gh);
  const ghead = cyl(0.07, 0.07, 0.24, '#4a3020', {x: 0.42, seg: 12, thick: 0.006}); ghead.rotation.x = Math.PI / 2; gavel.add(ghead);
  gavel.position.set(C + 0.55, 1.65, -3.25); gavel.rotation.y = -0.3; W.add(gavel);
  W.add(cyl(0.14, 0.16, 0.05, '#4a3020', {x: C + 0.97, y: 1.51, z: -3.35, seg: 14, thick: 0.004}));
  for (const [x, c] of [[C - 2.0, '#2f6db3'], [C + 2.0, '#c43d32']]) { W.add(cyl(0.04, 0.04, 3.2, '#d9a441', {x, y: 1.6, z: -5.5})); const f = P.flag(c, 7); f.position.set(x, 2.6, -5.5); W.add(f); }
  const cal = wallSign(W, '1999', 1.3, 1.1, C - 4.6, 3.8, -5.9, {bg: '#f2f0e6', sub: 'CALENDAR'});
  const verdict = wallSign(W, 'NOT A REAL OFFER', 3.4, 1.0, C + 4.6, 3.3, -5.9, {bg: '#fff1b8', fg: '#c43d32'});
  W.add(P.at(P.wallClock(), C, 4.9, -5.9));
  for (const x of [C - 3.3, C + 3.3]) { const tb = P.desk(2.2, '#7a4f33'); tb.position.set(x, 0.05, -0.9); W.add(tb); W.add(P.at(P.papers(5, x), x, 1.06, -0.9)); }
  person(W, chars, C - 3.0, 0.05, -0.1, 'student', 'cap', true, 702);
  person(W, chars, C - 4.2, 0.05, -0.2, 'navy', 'none', false, 703);
  person(W, chars, C + 3.4, 0.05, -0.1, 'engineer', 'bowler', true, 704);
  for (let i = 0; i < 3; i++) { W.add(box(2.6, 0.5, 0.5, '#6b4430', {x: C - 6.0, y: 0.45, z: -1.2 + i * 1.3})); W.add(box(2.6, 0.5, 0.5, '#6b4430', {x: C + 6.0, y: 0.45, z: -1.2 + i * 1.3})); }
  [['red', -6.6, -1.0], ['teal', -5.4, 0.3], ['pink', 6.4, -1.0], ['mustard', 5.4, 0.3], ['clerk', 6.8, 1.6]].forEach(([pal, dx, z], i) => person(W, chars, C + dx, 0.05, z, pal, ['none', 'cap', 'bowler'][i % 3], i % 2 === 0, 720 + i));
  lampBulb(W, C - 3, 5.2, -1.5, 0.5); lampBulb(W, C + 3, 5.2, -1.5, 0.5);
  const winC = sign('', 1.6, 2.4, {bg: '#bfe3f5', border: true}); winC.position.set(C - 7.95, 3.3, -2.5); winC.rotation.y = Math.PI / 2; W.add(winC);

  // ======== per-frame update ========
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // TV screen
    if (shot === 'hook') tv.userData.draw({jetY: 1 - ease(t, wordT('hook', 3), wordT('hook', 9)) * 0.55, t});
    else if (shot === 'price') tv.userData.draw({jetY: 0.45, price: t > wordT('price', 4) ? '7,000,000 POINTS' : null, t});
    else if (shot === 'close') tv.userData.draw({jetY: 0.45, price: '7,000,000 POINTS', flip: ease(t, wordT('close', 8), wordT('close', 10)), t});
    kid.userData.armR.rotation.z = shot === 'hook' ? 2.2 + Math.sin(t * 9) * 0.3 : 0;
    // prize shop tags
    pop(p1996, t, wordT('yousee', 3)); pop(tagTee, t, wordT('yousee', 10)); pop(tagJacket, t, wordT('yousee', 13) - 0.1);
    // school: jet lands on "lands"
    const land = ease(t, wordT('school', 6), wordT('school', 10));
    jetS.position.y = 9 - 9 * land + (1 - land) * Math.sin(t * 2.4) * 0.25; jetS.rotation.y = 0.45 - 0.25 * land;
    jetS.userData.glowMat.opacity = 0.75 * (1 - ease(t, wordT('school', 10), wordT('school', 13))) * (0.85 + Math.sin(t * 30) * 0.15);
    papersS.userData.update(t, LOC.school, 0.3, -5, shot === 'school' ? land * (1 - ease(t, wordT('school', 12), wordT('school', 15))) + 0.15 : 0);
    // dorm
    if (shot === 'rules') drawRules(ease(t, wordT('rules', 8), wordT('rules', 9)));
    if (shot === 'math') drawMath(ease(t, wordT('math', 0), wordT('math', 1)), ease(t, wordT('math', 2), wordT('math', 4)), ease(t, wordT('math', 7), wordT('math', 8)));
    if (shot === 'student' || shot === 'rules' || shot === 'math') {
      for (let i = 0; i < RN; i++) { const [a, c] = rs[i]; const x = LOC.dorm - 3.7 + a * 1.6; const y = 1.7 + (((c * 1.2 - t * 1.6) % 1.2) + 1.2) % 1.2; rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 2] = -3.88; rp[i * 6 + 3] = x - 0.02; rp[i * 6 + 4] = y + 0.1; rp[i * 6 + 5] = -3.88; }
      rainG.attributes.position.needsUpdate = true;
    }
    studentD.userData.armR.rotation.z = shot === 'math' ? 2.3 + Math.sin(t * 5) * 0.2 : 0.4;
    // airfield
    pop(bigTag, t, wordT('jetcost', 7)); bigPoles.visible = bigTag.visible;
    // office: lids open on "dollars", hands shake on "lend"
    const lid = ease(t, wordT('raise', 9), wordT('raise', 10.5));
    bc1.userData.lid.rotation.x = -1.9 * lid; bc2.userData.lid.rotation.x = -1.9 * ease(t, wordT('raise', 9.5), wordT('raise', 11));
    pop(loan, t, wordT('raise', 7));
    studentO.userData.armR.rotation.z = shot === 'raise' ? 1.4 + Math.sin(t * 10) * 0.15 * ease(t, wordT('raise', 4), wordT('raise', 5)) : 0;
    // post office: points + check go into the mailbox, then come back
    const into = ease(t, wordT('check', 8.5), wordT('check', 10.8));
    const hand = new THREE.Vector3(LOC.mail - 2.7, 1.25, 0.45), slot = new THREE.Vector3(LOC.mail - 1.8, 1.1, 0.05);
    pts.position.copy(hand).add(new THREE.Vector3(0.1, 0.55, 0.05)).lerp(slot, into); pop(pts, t, wordT('check', 3)); if (into > 0.98 || shot !== 'check') pts.visible = false; else pts.scale.multiplyScalar(1 - into * 0.7);
    checkCard.position.copy(hand).add(new THREE.Vector3(0.45, 0.35, 0.1)).lerp(slot, into); checkCard.rotation.set(0, -0.2, Math.sin(t * 2) * 0.05); pop(checkCard, t, wordT('check', 5)); if (into > 0.98 || shot !== 'check') checkCard.visible = false; else checkCard.scale.multiplyScalar(1 - into * 0.8);
    env.position.copy(hand).lerp(slot, into); env.rotation.set(Math.PI / 2 - 0.2, 0, 0.1); env.visible = shot === 'check' && into < 0.98;
    const back = ease(t, wordT('but', 2), wordT('but', 5));
    const backPos = new THREE.Vector3(LOC.mail - 0.6, 1.45, 0.6);
    envBack.position.copy(slot).lerp(backPos, back); envBack.position.y += Math.sin(back * Math.PI) * 0.5; envBack.rotation.set(Math.PI / 2 - 0.25, 0, -0.2 + back * 6.28 * (1 - back) * 0.2);
    envBack.visible = shot === 'but' && back > 0.01;
    letter.position.set(LOC.mail + 0.55, 1.75, -0.9); letter.rotation.set(0, -0.15, Math.sin(t * 2) * 0.04); pop(letter, t, wordT('but', 9)); if (shot !== 'but') letter.visible = false;
    clerk.userData.armR.rotation.z = shot === 'but' ? 2.0 + Math.sin(t * 7) * 0.25 : 0;
    // court: gavel strikes on "ruled"
    const strike = t - wordT('court', 6);
    gavel.rotation.z = strike > -0.5 && strike < 0 ? 0.9 * (1 + strike * 2) : strike >= 0 && strike < 0.15 ? 0.9 * (1 - strike / 0.15) : (strike >= 0.15 ? 0 : 0.5);
    pop(cal, t, wordT('court', 2)); pop(verdict, t, wordT('court', 12));
  };

  return {group: W, update};
}
