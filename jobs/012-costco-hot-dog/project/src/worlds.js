import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressStreet} from './dress.js';
import * as P from './props.js';

export const LOC = {street: 0, court: 300, office: 600, factory: 700, aisle: 900, lot: 1000};

// smooth 0..1 between a and b (seconds)
export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

function street(ox, {lit = false, seed = 1} = {}) {
  const g = new THREE.Group();
  g.add(ground(260, 200, lit ? '#3b3a48' : '#9c958a', {x: ox, z: -30, seed: seed + 2, repeat: 20}));
  // road stripe
  const road = new THREE.Mesh(new THREE.BoxGeometry(260, 0.05, 9), toon(lit ? '#34303e' : '#6e6670'));
  road.position.set(ox, 0.03, 12); g.add(road);
  for (let i = 0; i < 8; i++) g.add(box(0.7, 0.06, 7.6, '#efe7d2', {x: ox - 15.5 + (i % 4) * 1.1 + (i < 4 ? 0 : 31), y: 0.07, z: 12, edges: false, thick: 0.001}));
  for (let i = -12; i < 12; i++) g.add(box(3, 0.06, 0.35, '#e8d28a', {x: ox + i * 10, y: 0.08, z: 12, edges: false, thick: 0.001}));
  g.add(sidewalk(260, {x: ox, z: 5.5, w: 4}));
  g.add(sidewalk(260, {x: ox, z: 18.5, w: 4}));
  // low buildings along the street (both sides of the plaza)
  const cols = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    for (const side of [-1, 1]) {
      const w = 9 + r() * 3, h = 9 + r() * 10;
      const f = facade({w, h, color: cols[(i + (side > 0 ? 2 : 0)) % cols.length], cols: 3, rows: Math.floor(h / 3.6), seed: seed + i * 7 + side, lit, interior: lit ? '#ffcf7d' : '#3b2b33'});
      f.position.set(ox + side * (18 + i * 12.5), 0, 3);
      g.add(f);
      // side wall + roof to give depth
      g.add(box(w, h, 8, '#8f6c5e', {x: ox + side * (18 + i * 12.5), y: h / 2, z: -1.4, thick: 0.04}));
    }
  }
  // far side of the street
  for (let i = -6; i < 7; i++) {
    const w = 10 + r() * 3, h = 8 + r() * 9;
    const f = facade({w, h, color: cols[(i + 9) % cols.length], cols: 3, rows: Math.floor(h / 3.6), seed: seed + 100 + i, lit, interior: lit ? '#ffcf7d' : '#3b2b33'});
    f.position.set(ox + i * 13, 0, 22); f.rotation.y = Math.PI; g.add(f);
    g.add(box(w, h, 8, '#8f6c5e', {x: ox + i * 13, y: h / 2, z: 26.4, thick: 0.04}));
  }
  // lamp posts
  for (let i = -5; i <= 5; i++) g.add(lampPost(ox + i * 11 + 4, 6.8, 5.5));
  // distant skyline blocks behind the tower
  for (let i = 0; i < 14; i++) {
    const h = 25 + r() * 45, w = 10 + r() * 10;
    g.add(box(w, h, 10, lit ? '#3a3658' : '#b9c3c9', {x: ox - 90 + i * 14 + r() * 4, y: h / 2, z: -80 - r() * 30, thick: 0.08}));
  }
  return g;
}

function room(ox, {w = 14, h = 5, d = 10, wall = '#efe0c4', floor = '#a7764e', seed = 4} = {}) {
  const g = new THREE.Group();
  const wt = paintTex(wall, {seed, stains: 14}); wt.repeat.set(2, 1);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon('#ffffff', wt, {side: THREE.BackSide}));
  walls.position.set(ox, h / 2, 0); walls.receiveShadow = true; g.add(walls);
  const ft = paintTex(floor, {seed: seed + 1, stripes: (gg, W, H) => { gg.strokeStyle = 'rgba(60,30,15,0.35)'; gg.lineWidth = 2; for (let i = 0; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); } }});
  ft.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.1, d - 0.02), toon('#ffffff', ft)); fl.position.set(ox, 0.0, 0); fl.receiveShadow = true; g.add(fl);
  // skirting + ceiling beam for depth
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  return g;
}

// ---------- story props ----------
function hotdog(s = 1) {
  const h = new THREE.Group();
  h.add(box(0.64, 0.13, 0.21, '#e8b96d', {y: 0.07, thick: 0.012}));
  const sa = cyl(0.075, 0.075, 0.74, '#b5442f', {y: 0.16, seg: 12, thick: 0.01}); sa.rotation.z = Math.PI / 2; h.add(sa);
  for (let i = 0; i < 7; i++) h.add(box(0.05, 0.02, 0.07, '#f2c12e', {x: -0.3 + i * 0.1, y: 0.235, z: (i % 2 ? 0.02 : -0.02), thick: 0.003, edges: false}));
  h.scale.setScalar(s); return h;
}
function cup(s = 1) {
  const c = new THREE.Group();
  c.add(cyl(0.15, 0.11, 0.42, '#f2efe6', {y: 0.21, seg: 14, thick: 0.012}), cyl(0.139, 0.13, 0.14, '#c43d32', {y: 0.2, seg: 14, thick: 0.002}), cyl(0.16, 0.16, 0.04, '#f2efe6', {y: 0.44, seg: 14, thick: 0.008}), box(0.025, 0.3, 0.025, '#2f6db3', {x: 0.04, y: 0.58, thick: 0.004}));
  c.scale.setScalar(s); return c;
}
function combo(s = 1) { const g = new THREE.Group(); g.add(box(0.95, 0.03, 0.5, '#c43d32', {y: 0.015, thick: 0.006}), P.at(hotdog(0.9), -0.12, 0.03, 0), P.at(cup(), 0.33, 0.03, 0)); g.scale.setScalar(s); return g; }
const COL = ['#e0533d', '#f2c12e', '#4f86b8', '#6aa84f', '#c47ac0', '#f07a2b', '#e9e2cf'];
function rack(len, h, {x = 0, z = 0, seed = 1, ry = 0, levels = 4} = {}) {
  const g = new THREE.Group(); const r = rng(seed);
  for (let i = 0; i <= Math.floor(len / 2.6); i++) g.add(box(0.14, h, 0.14, '#2f6db3', {x: -len / 2 + i * 2.6, y: h / 2, z: 0, thick: 0.01}));
  for (let l = 0; l < levels; l++) {
    const y = 0.6 + l * (h - 0.6) / levels;
    g.add(box(len, 0.1, 1.1, '#e0803a', {y, thick: 0.01}));
    for (let i = 0; i < len / 0.9; i++) { const bh = 0.5 + r() * 0.5; g.add(box(0.75, bh, 0.9, COL[Math.floor(r() * 7)], {x: -len / 2 + 0.5 + i * 0.9, y: y + 0.05 + bh / 2, z: 0, thick: 0.012})); }
  }
  g.position.set(x, 0.05, z); g.rotation.y = ry; return g;
}
function cart(seed = 1, {n = 8} = {}) {
  const g = new THREE.Group(); const r = rng(seed);
  g.add(box(1.2, 0.08, 0.7, '#8a9096', {y: 0.3, thick: 0.01}), box(1.2, 0.5, 0.05, '#aab3bb', {y: 0.6, z: 0.33, thick: 0.01}), box(1.2, 0.5, 0.05, '#aab3bb', {y: 0.6, z: -0.33, thick: 0.01}), box(0.05, 0.5, 0.7, '#aab3bb', {x: 0.58, y: 0.6, thick: 0.01}), box(0.05, 0.5, 0.7, '#aab3bb', {x: -0.58, y: 0.6, thick: 0.01}), box(0.06, 0.06, 0.74, '#d9411e', {x: -0.62, y: 1.1, thick: 0.008}));
  for (const [x, z] of [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]]) { const w = cyl(0.08, 0.08, 0.05, '#2b2b2e', {x, y: 0.1, z, seg: 10, thick: 0.005}); w.rotation.x = Math.PI / 2; g.add(w); }
  const items = [];
  for (let i = 0; i < n; i++) { const bx = box(0.34 + r() * 0.2, 0.3 + r() * 0.4, 0.3 + r() * 0.2, COL[Math.floor(r() * 7)], {x: -0.45 + (i % 4) * 0.32, y: 0.55 + Math.floor(i / 4) * 0.4 + 0.12, z: (i % 2 ? 0.12 : -0.12), thick: 0.01}); bx.visible = false; items.push(bx); g.add(bx); }
  g.userData.items = items; return g;
}
function lightPanels(W, ox, y, w, d, n = 4) { for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) W.add(box(2.4, 0.08, 0.8, '#fff6dc', {x: ox - w / 2 + (i + 0.5) * w / n, y, z: -d / 4 + j * d / 2, edges: false, thick: 0.001})); }
function canvasBoard(w, h, cw, ch, draw) {
  const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g2 = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = box(w, h, 0.1, '#ffffff', {thick: 0.02});
  m.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: tex}), toon('#4a3a2e')];
  const redraw = (...a) => { draw(g2, cw, ch, ...a); tex.needsUpdate = true; };
  m.userData.redraw = redraw; redraw(0, 0); return m;
}
const pop = (o, t, t0, d = 0.45) => { const p = ease(t, t0, t0 + d); o.visible = p > 0.01; const s = p * (1 + 0.18 * Math.sin(p * Math.PI)); o.scale.setScalar(Math.max(0.001, s)); };

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const hall = (ox, w, d, h, wall, floor, seed) => { W.add(room(ox, {w, h, d, wall, floor, seed})); lightPanels(W, ox, h - 0.1, w, d, Math.floor(w / 6)); };

  // ======== COURT (food court: hook, s02, s08, s09, s10) ========
  const C = LOC.court;
  hall(C, 26, 16, 9, '#d3dae0', '#b9b0a2', 4);
  const counter = new THREE.Group();
  counter.add(box(11, 1.1, 1.6, '#c43d32', {y: 0.6}), box(11.3, 0.12, 1.9, '#e8e2d0', {y: 1.2}));
  counter.position.set(C, 0, -6.2); W.add(counter);
  const menu = sign('FOOD COURT', 6.2, 1.2, {bg: '#2f5d62', fg: '#fff4dc', w: 800, h: 160, font: 'bold 92px Arial, sans-serif'}); menu.position.set(C, 6.6, -7.85); W.add(menu);
  const menu2 = sign('HOT DOG + SODA', 5.4, 1.4, {bg: '#f2e6cc', w: 720, h: 190, font: 'bold 78px Arial, sans-serif', sub: '$1.50'}); menu2.position.set(C, 5.0, -7.85); W.add(menu2);
  const hero = hotdog(2.4); P.at(hero, C - 0.5, 1.32, -5.3); W.add(hero);
  const heroCup = cup(2.4); P.at(heroCup, C + 1.2, 1.28, -5.5); W.add(heroCup);
  for (const x of [-4.2, -2.6, 2.8, 4.4]) W.add(P.at(combo(1.2), C + x, 1.26, -6.0));
  for (const [x, pal, hat, s] of [[-3.3, 'red', 'cap', 5], [0.5, 'red', 'cap', 6], [3.6, 'clerk', 'cap', 7]]) { const w = character({palette: pal, hat, seed: s}); w.position.set(C + x, 0.05, -7.2); W.add(w); chars.push(w); }
  // pizza/food stations on the wall
  for (const x of [-9.5, 9.5]) { W.add(box(4, 1.0, 1.4, '#6b4430', {x: C + x, y: 0.55, z: -7.1})); W.add(sign(x < 0 ? 'PIZZA' : 'DRINKS', 3, 0.8, {bg: '#f2c12e', w: 400, h: 110, font: 'bold 70px Arial'}).translateX(C + x).translateY(3.6).translateZ(-7.9)); }
  // tables + chairs + diners
  for (const [x, z, s] of [[-9, 1.0, 1], [-4.5, 3.0, 2], [4.8, 2.6, 3], [9.4, 0.6, 4], [-1.2, 5.6, 5]]) {
    W.add(box(1.8, 0.1, 1.2, '#e8e2d0', {x: C + x, y: 1.0, z}), cyl(0.1, 0.1, 0.95, '#6f7a7d', {x: C + x, y: 0.5, z}));
    W.add(P.at(P.chair('#c43d32'), C + x - 1.3, 0.05, z, Math.PI / 2), P.at(P.chair('#c43d32'), C + x + 1.3, 0.05, z, -Math.PI / 2));
    W.add(P.at(combo(1), C + x, 1.05, z));
    const d = character({palette: ['teal', 'mustard', 'pink', 'navy', 'student'][s - 1], hat: 'none', seed: 300 + s}); d.position.set(C + x - 1.3, 0.05, z); W.add(d); chars.push(d);
  }
  W.add(rack(8, 6, {x: C - 8.5, z: 0, seed: 21, ry: Math.PI / 2}).translateZ(-4.9), rack(8, 6, {x: C + 8.5, z: 0, seed: 22, ry: -Math.PI / 2}).translateZ(4.9));
  // price tags (s10) + combos counter board (s08/s09)
  const tagA = sign('$1.50', 2.4, 1.3, {bg: '#f2e6cc', w: 480, h: 260, font: 'bold 130px Arial, sans-serif', sub: '1985'}); tagA.position.set(C - 1.9, 3.1, -7.85); W.add(tagA);
  const tagB = sign('OVER $4', 2.6, 1.3, {bg: '#f2c12e', w: 520, h: 260, font: 'bold 110px Arial, sans-serif', sub: 'TODAY'}); tagB.position.set(C + 1.9, 3.1, -7.85); W.add(tagB);
  const board = canvasBoard(3.4, 2.1, 680, 420, (g2, cw, ch, state, v) => {
    g2.fillStyle = '#1f2a33'; g2.fillRect(0, 0, cw, ch); g2.strokeStyle = '#f2c12e'; g2.lineWidth = 12; g2.strokeRect(6, 6, cw - 12, ch - 12);
    g2.fillStyle = '#f7f0de'; g2.textAlign = 'center'; g2.font = 'bold 58px Arial, sans-serif'; g2.fillText('COMBOS SOLD', cw / 2, 90);
    g2.fillStyle = '#f2c12e'; g2.font = 'bold 60px Arial, sans-serif';
    if (state === 0) { const d = Math.floor(v * 1e8) % 1e9; const str = String(d).padStart(9, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ','); g2.fillText(str, cw / 2, 220); g2.font = 'bold 40px Arial'; g2.fillStyle = '#9fb3c4'; g2.fillText('IN ONE YEAR', cw / 2, 320); }
    else { g2.font = 'bold 54px Arial'; g2.fillStyle = '#9fb3c4'; g2.fillText('2023: NEARLY', cw / 2, 175); g2.fillStyle = '#f2c12e'; g2.font = 'bold 74px Arial'; g2.fillText('200 MILLION', cw / 2, 290); }
  });
  board.position.set(C + 6.3, 4.6, -7.88); W.add(board);
  const queue = P.crowd(8, C - 6, C + 6, -3.8, 31, chars); queue.position.y = -0.2; W.add(queue);
  const queue2 = P.crowd(7, C - 5, C + 5, -2.0, 32, chars); queue2.position.y = -0.2; W.add(queue2);
  const queues = [queue, queue2];

  // ======== STREET (s03) ========
  const S = LOC.street;
  W.add(street(S, {seed: 23}));
  const trafficD = dressStreet(W, S, {seed: 23, chars, avoid: [S - 6, S, S + 6]});
  for (let i = 0; i < 6; i++) W.add(cloud(S - 80 + i * 30, 100 + (i % 3) * 10, -130, 7));
  const streetSigns = [];
  for (const [x, txt, sub, w, h, bg, font] of [[-6, 'GAS', 'PRICE', 2.0, 2.3, '#2f6db3', 'bold 130px Arial, sans-serif'], [0, 'RENT', 'PRICE', 2.2, 2.3, '#e6d39a', 'bold 120px Arial, sans-serif'], [6, 'FOOD', 'PRICE', 2.2, 2.3, '#6aa84f', 'bold 120px Arial, sans-serif']]) {
    const g2 = new THREE.Group();
    const sg = sign(txt, w, h, {bg, fg: bg === '#2f6db3' || bg === '#6aa84f' ? '#ffffff' : INK, w: 300, h: 340, font, sub}); sg.position.y = 2.2; g2.add(sg);
    g2.add(cyl(0.07, 0.07, 1.4, '#3a3a3a', {x: -w / 2 + 0.3, y: 0.7}), cyl(0.07, 0.07, 1.4, '#3a3a3a', {x: w / 2 - 0.3, y: 0.7}));
    const a = arrow('#e0533d', 1.8); a.rotation.z = Math.PI / 2; a.position.set(0, 4.0, 0); g2.add(a); g2.userData.arrow = a;
    g2.position.set(S + x, 0.25, 6.0); streetSigns.push(g2); W.add(g2);
  }

  // ======== OFFICE (s04, s05) ========
  const O = LOC.office;
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  lightPanels(W, O, 5.4, 16, 11, 2);
  const desk = new THREE.Group(); desk.add(box(4.2, 0.18, 2, '#8a5a3b', {y: 1.05}));
  for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) desk.add(box(0.15, 1.0, 0.15, '#6b4430', {x, y: 0.5, z}));
  desk.position.set(O - 2, 0.05, 0.2); W.add(desk);
  W.add(P.at(P.rug(6, 3.6), O - 2, 0, 0.2), P.at(P.deskLamp(), O - 3.6, 1.14, 0.0), P.at(P.papers(7, 3), O - 1.4, 1.14, 0.6), P.at(P.phone(), O - 0.4, 1.14, 0.0));
  const plate = hotdog(1.7); P.at(plate, O - 2.2, 1.17, 0.5); W.add(plate);
  const boss = character({palette: 'official', hat: 'none', glasses: true, seed: 41}); boss.position.set(O - 2, 0.05, -1.3); W.add(boss); chars.push(boss);
  W.add(P.at(P.chair('#3e5a7a'), O - 2, 0.05, -2.2, 0));
  W.add(P.at(P.filingCabinet('#7d8a8f'), O - 6.0, 0.05, -5.0), P.at(P.filingCabinet(), O + 6.4, 0.05, -5.0), P.at(P.filingCabinet('#8f7d6a'), O + 7.2, 0.05, -5.0), P.at(P.wallClock(), O + 3.4, 4.75, -5.4));
  const p1 = P.poster('PRICES', 1.1, 1.5, '#e6d39a'); P.at(p1, O - 3.9, 3.7, -5.45); W.add(p1);
  const plant = new THREE.Group(); plant.add(cyl(0.35, 0.28, 0.7, '#b35a3a', {y: 0.35})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.3, 0.9 + (i % 3) * 0.25, Math.sin(i) * 0.3); ink(l, 0.02, false); plant.add(l); }
  plant.position.set(O - 5.6, 0.05, 3.2); W.add(plant);
  const chart = canvasBoard(4.4, 2.5, 640, 360, (g2, cw, ch, p) => {
    g2.fillStyle = '#f4efe2'; g2.fillRect(0, 0, cw, ch); g2.strokeStyle = '#5a3a26'; g2.lineWidth = 18; g2.strokeRect(0, 0, cw, ch);
    g2.fillStyle = INK; g2.font = 'bold 40px Arial, sans-serif'; g2.textAlign = 'center'; g2.fillText('HOT DOG PROFIT', cw / 2, 70);
    g2.strokeStyle = '#9aa0a8'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(60, 230); g2.lineTo(cw - 60, 230); g2.stroke();
    g2.strokeStyle = '#c43d32'; g2.lineWidth = 10; g2.beginPath(); g2.moveTo(70, 130); g2.lineTo(70 + (cw - 140) * p, 130 + 150 * p); g2.stroke();
    if (p > 0.9) { g2.fillStyle = '#c43d32'; g2.font = 'bold 62px Arial, sans-serif'; g2.fillText('LOSING MONEY', cw / 2, 330); }
  });
  chart.position.set(O + 2.4, 2.9, -5.35); W.add(chart);
  const noSign = sign('NO.', 1.9, 1.1, {bg: '#c43d32', fg: '#fff4dc', w: 380, h: 220, font: 'bold 150px Arial, sans-serif'}); noSign.position.set(O - 2, 2.55, 0.9); W.add(noSign);
  const cm = character({palette: 'teal', hat: 'none', seed: 43}); cm.position.set(O + 2.2, 0.05, 2.0); W.add(cm); chars.push(cm);

  // ======== FACTORY (s06, s07) ========
  const F = LOC.factory;
  hall(F, 28, 14, 8, '#dfe6e3', '#98a2a6', 12);
  W.add(box(20, 0.9, 1.3, '#4a4f55', {x: F, y: 0.5, z: -1.6}), box(20.4, 0.1, 1.5, '#8a9096', {x: F, y: 1.0, z: -1.6}));
  W.add(box(20, 0.9, 1.3, '#4a4f55', {x: F, y: 0.5, z: -4.4}), box(20.4, 0.1, 1.5, '#8a9096', {x: F, y: 1.0, z: -4.4}));
  const dogs = []; for (let i = 0; i < 22; i++) { const h = hotdog(1.7); W.add(h); dogs.push({h, x0: i * 1.3, z: -1.6, y: 1.06}); }
  const buns = []; for (let i = 0; i < 22; i++) { const b = box(1.0, 0.2, 0.33, '#e8b96d', {thick: 0.01}); W.add(b); buns.push({h: b, x0: i * 1.3, z: -4.4, y: 1.12}); }
  for (const [x, w, h] of [[-9.5, 4.6, 4.2], [-4.5, 3.4, 3.4]]) { W.add(box(w, h, 2.6, '#b8c0c8', {x: F + x, y: h / 2, z: -6.0})); W.add(cyl(0.5, 0.5, 1.6, '#8a9096', {x: F + x, y: h + 0.8, z: -6.0})); }
  for (const x of [6, 9.5]) { W.add(cyl(1.1, 1.1, 4.6, '#c9d0d6', {x: F + x, y: 2.3, z: -5.8, seg: 20})); W.add(cyl(1.14, 1.14, 0.2, '#6f7a7d', {x: F + x, y: 3.2, z: -5.8, seg: 20})); }
  const facSign = sign('HOT DOG FACTORY', 7.6, 1.3, {bg: '#f2e6cc', w: 880, h: 150, font: 'bold 84px Arial, sans-serif'}); facSign.position.set(F, 6.3, -6.9); W.add(facSign);
  for (const [x, z, pal, s] of [[-6.2, -2.7, 'teal', 51], [-1.0, -2.8, 'mustard', 52], [4.4, -2.7, 'pink', 53], [8.2, -2.8, 'red', 54]]) { const w = character({palette: pal, hat: 'cap', seed: s}); w.position.set(F + x, 0.05, z); W.add(w); chars.push(w); }
  for (let i = 0; i < 3; i++) { W.add(P.at(P.pallet(), F - 9 + i * 1.5, 0.05, 3.6)); for (let j = 0; j < 3; j++) W.add(box(1.0, 0.5, 1.0, '#c9a066', {x: F - 9 + i * 1.5, y: 0.45 + j * 0.5, z: 3.6, thick: 0.015})); }
  W.add(P.at(P.barrel('#2f6db3'), F + 10, 0.05, 3.4), P.at(P.barrel('#c43d32'), F + 11, 0.05, 3.6));
  const costTag = sign('LESS COST', 2.8, 1.3, {bg: '#6aa84f', fg: '#ffffff', w: 560, h: 260, font: 'bold 96px Arial, sans-serif'}); costTag.position.set(F + 1.8, 3.4, -6.85); W.add(costTag);
  const priceTag = sign('$1.50', 2.4, 1.3, {bg: '#f2e6cc', w: 480, h: 260, font: 'bold 130px Arial, sans-serif', sub: 'SAME'}); priceTag.position.set(F - 1.4, 3.4, -6.85); W.add(priceTag);

  // ======== AISLE (s11) ========
  const A = LOC.aisle;
  hall(A, 30, 18, 9, '#cfd6dc', '#aeb3b8', 15);
  W.add(rack(26, 7, {x: A, z: -8.2, seed: 31, levels: 5}), rack(24, 3.6, {x: A, z: -4.8, seed: 32, levels: 2}));
  W.add(rack(14, 6, {x: A - 14.3, z: -1.5, seed: 33, ry: Math.PI / 2}), rack(14, 6, {x: A + 14.3, z: 1, seed: 34, ry: -Math.PI / 2}));
  const carts = []; for (const [x, z, s] of [[-5, 1.0, 1], [0.2, 1.8, 2], [5.2, 0.8, 3]]) { const c = cart(s, {n: 8}); c.position.set(A + x, 0.05, z); W.add(c); carts.push(c); const pc = character({palette: ['teal', 'pink', 'mustard'][s - 1], hat: 'none', seed: 60 + s}); pc.position.set(A + x - 1.5, 0.05, z); W.add(pc); chars.push(pc); }
  const memSign = sign('MEMBERSHIP', 6.2, 1.5, {bg: '#c43d32', fg: '#fff4dc', w: 800, h: 190, font: 'bold 100px Arial, sans-serif'}); memSign.position.set(A, 5.6, -2.8); W.add(memSign);
  for (const x of [-2.4, 2.4]) W.add(cyl(0.03, 0.03, 3.0, '#2b2b2e', {x: A + x, y: 7.4, z: -2.8, seg: 6, thick: 0.004}));
  const card = sign('MEMBER', 1.8, 1.1, {bg: '#2f6db3', fg: '#ffffff', w: 360, h: 220, font: 'bold 76px Arial, sans-serif'}); card.position.set(A, 3.5, -2.8); card.rotation.z = 0.12; W.add(card);
  for (let i = 0; i < 5; i++) { const sh = character({palette: ['red', 'navy', 'student', 'clerk', 'teal'][i], hat: ['none', 'cap', 'none', 'bowler', 'none'][i], seed: 70 + i}); sh.position.set(A - 9 + i * 4.4, 0.05, -2.2 + (i % 2) * 5.2); W.add(sh); chars.push(sh); }

  // ======== LOT (s12) ========
  const L = LOC.lot;
  W.add(ground(140, 90, '#6e6a70', {x: L, z: -5, seed: 31, repeat: 16}));
  for (let i = -8; i <= 8; i++) W.add(box(0.15, 0.04, 5, '#efe7d2', {x: L + i * 3.2, y: 0.05, z: 8, edges: false, thick: 0.001}));
  W.add(box(44, 11, 14, '#d4d8dc', {x: L, y: 5.5, z: -17}));
  W.add(box(44.2, 1.4, 14.2, '#c43d32', {x: L, y: 10.6, z: -17, thick: 0.02}));
  W.add(box(12, 4, 0.3, '#7fb7d6', {x: L, y: 2, z: -9.85, thick: 0.02}));
  const wh = sign('COSTCO', 10, 1.9, {bg: '#f4efe2', fg: '#1f2a33', w: 900, h: 170, font: 'bold 120px Arial, sans-serif'}); wh.position.set(L, 6.6, -9.8); W.add(wh);
  const pole = cyl(0.14, 0.18, 6.2, '#3a3a3a', {x: L + 4.4, y: 3.1, z: -3.5}); W.add(pole);
  const giant = hotdog(5.2); giant.position.set(L + 4.4, 7.2, -3.5); W.add(giant);
  for (const [x, z, s] of [[-10, 4, 1], [-5, 6, 2], [8, 5, 3], [13, 3, 4]]) W.add(P.at(P.car(['#c43d32', '#2f6db3', '#e6d9b8', '#3a3a3f'][s - 1], {seed: s}), L + x, 0.05, z, (s % 2) * Math.PI));
  for (let i = -3; i <= 3; i++) { if (i === 0) continue; W.add(lampPost(L + i * 8, 2, 6)); }
  for (let i = 0; i < 4; i++) W.add(P.at(P.tree(1.3, 800 + i), L - 18 + i * 12, 0.05, -4));
  for (const [x, z, s] of [[-3, 0.5, 1], [2, 1.4, 2], [-8, 1.8, 3]]) { const c = cart(80 + s, {n: 8}); c.position.set(L + x, 0.05, z); c.userData.items.forEach((b) => { b.visible = true; }); W.add(c); const pc = character({palette: ['navy', 'red', 'teal'][s - 1], hat: 'none', seed: 90 + s}); pc.position.set(L + x - 1.6, 0.05, z); W.add(pc); chars.push(pc); }
  for (let i = 0; i < 6; i++) { const q = character({palette: ['pink', 'mustard', 'student', 'clerk', 'red', 'navy'][i], hat: ['none', 'cap', 'none', 'bowler', 'top', 'none'][i], seed: 100 + i}); q.position.set(L - 9 + i * 3.6, 0.05, -7.5 + (i % 2) * 1.6); W.add(q); chars.push(q); }
  for (let i = 0; i < 6; i++) W.add(cloud(L - 70 + i * 28, 100 + (i % 3) * 10, -130, 7));

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    trafficD(t, cam);
    // court: hero hot dog gently turns; s02 menu pulse on "never"; counter board; tags
    queues.forEach((q) => { q.visible = shot === 's08' || shot === 's09' || shot === 's10'; });
    hero.rotation.y = 0.5 * Math.sin(t * 1.2); heroCup.rotation.y = t * 0.6;
    menu2.scale.setScalar(1 + 0.08 * ease(t, wordT('s02', 10), wordT('s02', 10) + 0.3) * (1 - ease(t, wordT('s02', 11) + 0.2, wordT('s02', 11) + 0.6)));
    if (shot === 's08') board.userData.redraw(0, ease(t, wordT('s08', 0), wordT('s08', 11)) * 1.9 + 0.0 + Math.sin(t * 20) * 0.01);
    else if (shot === 's09') board.userData.redraw(t > wordT('s09', 5) ? 1 : 0, ease(t, wordT('s09', 0), wordT('s09', 5)) * 2);
    tagA.visible = shot === 's10'; tagB.visible = shot === 's10';
    tagA.scale.setScalar(Math.max(0.001, ease(t, wordT('s10', 3), wordT('s10', 3) + 0.4)));
    pop(tagB, t, wordT('s10', 8)); if (shot !== 's10') { tagA.visible = false; tagB.visible = false; }
    // street signs pop on gas / rent / everything
    streetSigns.forEach((g2, i) => { pop(g2, t, wordT('s03', [0, 3, 6][i])); g2.userData.arrow.position.y = 4.0 + 0.2 * Math.sin(t * 6 + i); });
    // office
    boss.userData.armR.rotation.z = shot === 's05' ? 0.4 * Math.sin(t * 5) : 0;
    chart.userData.redraw(Math.round(ease(t, wordT('s04', 5), wordT('s04', 10)) * 20) / 20);
    pop(noSign, t, wordT('s05', 17), 0.3);
    // factory belt
    for (const d of dogs) d.h.position.set(F - 14 + ((d.x0 + t * 2.4) % 28.6), d.y, d.z);
    for (const b of buns) b.h.position.set(F - 14 + ((b.x0 + t * 2.4) % 28.6), b.y, b.z);
    pop(costTag, t, wordT('s07', 3)); pop(priceTag, t, wordT('s07', 8));
    // aisle: carts fill + membership sign
    pop(memSign, t, wordT('s11', 14)); pop(card, t, wordT('s11', 14) + 0.15);
    carts.forEach((c, i) => { const n = Math.floor(ease(t, wordT('s11', 15 + i * 0.5), wordT('s11', 20)) * 8.99); c.userData.items.forEach((b, k) => { b.visible = k < n; }); });
    // lot: giant hot dog bobs, pops on "reason"
    pop(giant, t, wordT('s12', 7), 0.5); giant.position.y = 7.2 + Math.sin(t * 2) * 0.15; giant.rotation.y = Math.sin(t) * 0.3;
  };
  return {group: W, update};
}
