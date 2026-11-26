import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, ground, cloud, paintTex} from './kit.js';
import {character} from './char.js';
import * as P from './props.js';
import {wordT} from './camera.js';
export const LOC = {day: 300, office: 600, joint: 800, weather: 900};
export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

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

function boardTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return {c, g: c.getContext('2d'), t}; }
const lines = (g, arr, cx, y0, step, font, color) => { g.font = font; g.fillStyle = color; g.textAlign = 'center'; arr.forEach((l, i) => g.fillText(l, cx, y0 + i * step)); };


// the tall chip can: red tube, cream band with name, dark lid. No logo, name only.
function can(s = 1, {lid = true} = {}) {
  const c = new THREE.Group();
  c.add(cyl(0.34, 0.34, 1.7, '#c9302c', {y: 0.85, seg: 22}), cyl(0.345, 0.345, 0.5, '#f4ead0', {y: 0.85, seg: 22}), cyl(0.36, 0.36, 0.1, '#e6dcc0', {y: 0.05, seg: 22}));
  if (lid) c.add(cyl(0.37, 0.37, 0.12, '#2b2b2e', {y: 1.76, seg: 22}));
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), new THREE.MeshBasicMaterial({map: signTex('PRINGLES', {bg: '#f4ead0', fg: '#c9302c', w: 300, h: 125, font: 'bold 58px Arial', border: false}), transparent: true})); lab.position.set(0, 0.85, 0.352); c.add(lab);
  c.scale.setScalar(s); return c;
}
function stack(n, seed = 1) { const g = new THREE.Group(); for (let i = 0; i < n; i++) g.add(P.at(can(0.6), (i % 4) * 0.5, 0, 0)); return g; }
function urn(c = '#6b5a8a') { const g = new THREE.Group(); g.add(cyl(0.3, 0.22, 0.6, c, {y: 0.3, seg: 18}), cyl(0.2, 0.3, 0.2, c, {y: 0.7, seg: 18}), cyl(0.12, 0.2, 0.16, '#d9a441', {y: 0.88, seg: 18})); return g; }
function headstone(x, z, ry = 0, h = 1.1, c = '#b9b6ae') { const g = new THREE.Group(); g.add(box(0.8, h, 0.2, c, {y: h / 2 + 0.1}), cyl(0.4, 0.4, 0.2, c, {y: h + 0.1, seg: 14})); g.rotation.set(0, ry, 0); g.position.set(x, 0, z); return g; }
function shelfRow(w, rows, x, y, z, ry = 0) { const g = new THREE.Group(); for (let k = 0; k < rows; k++) { g.add(box(w, 0.08, 0.7, '#8a5a3b', {y: k * 1.2 + 0.9})); for (let i = 0; i < Math.floor(w / 0.5) - 1; i++) { const c = can(0.55); c.position.set(-w / 2 + 0.5 + i * 0.5, k * 1.2 + 0.94, 0); g.add(c); } } g.add(box(0.1, rows * 1.2 + 0.7, 0.7, '#6b4430', {x: -w / 2, y: (rows * 1.2 + 0.7) / 2 + 0.3}), box(0.1, rows * 1.2 + 0.7, 0.7, '#6b4430', {x: w / 2, y: (rows * 1.2 + 0.7) / 2 + 0.3})); g.position.set(x, y, z); g.rotation.y = ry; return g; }
function sofa(c = '#4a7a8a') { const g = new THREE.Group(); g.add(box(3.0, 0.5, 1.1, c, {y: 0.45}), box(3.0, 0.9, 0.3, c, {y: 0.95, z: -0.45}), box(0.3, 0.8, 1.1, c, {x: -1.5, y: 0.65}), box(0.3, 0.8, 1.1, c, {x: 1.5, y: 0.65})); return g; }
function cemetery(ox) {
  const W = new THREE.Group();
  W.add(ground(200, 160, '#6fae54', {x: ox, z: -30, seed: 31, repeat: 18}));
  W.add(box(3.6, 0.04, 90, '#cdb98f', {x: ox + 9, y: 0.05, z: -35, thick: 0.001, edges: false}));
  const r = rng(77);
  for (let row = 0; row < 5; row++) for (let i = -9; i <= 9; i++) { const x = ox + i * 3.2 + (row % 2) * 1.2, z = -9 - row * 4.2; if (Math.abs(x - ox) < 5.2 && row < 2) continue; W.add(headstone(x, z, (r() - 0.5) * 0.2, 0.9 + r() * 0.5, ['#b9b6ae', '#a9a7a0', '#c9c4b6'][i & 1 ? 0 : 2])); }
  for (let i = 0; i < 14; i++) W.add(P.at(P.tree(1.5 + r() * 0.7, 700 + i), ox - 40 + i * 6 + r() * 3, 0.05, -42 - r() * 12));
  for (let i = 0; i < 6; i++) W.add(P.at(P.tree(1.3, 740 + i), ox - 22 + i * 9, 0.05, 9 + r() * 3));
  // iron fence + gate sign
  W.add(P.at(P.fence(60), ox, 0.05, 12.5)); W.add(P.at(P.fence(60), ox - 60, 0.05, 12.5));
  W.add(P.at(P.bench(), ox - 8, 0.05, 6, 0.4), P.at(P.bench(), ox + 11, 0.05, 5, -0.3));
  for (let i = 0; i < 9; i++) W.add(cyl(0.12, 0.12, 0.4, ['#e6b3c2', '#f2d56b', '#f4efe0'][i % 3], {x: ox - 7 + i * 0.8 + (i % 2) * 0.3, y: 0.25, z: 1.4 + (i % 3) * 0.4, seg: 7}));
  // open grave
  W.add(box(1.6, 0.05, 2.6, '#3b2615', {x: ox, y: 0.07, z: -3.2, thick: 0.001, edges: false}), box(1.0, 0.5, 2.0, '#6b4a2a', {x: ox + 1.9, y: 0.3, z: -3.2}), box(1.0, 0.5, 2.0, '#6b4a2a', {x: ox - 1.9, y: 0.3, z: -3.2}));
  for (const x of [-3.6, 3.6]) { W.add(P.at(P.tree(1.2, 760 + x), ox + x * 1.3, 0.05, -8)); }
  for (let i = 0; i < 6; i++) W.add(cloud(ox - 70 + i * 28, 95 + (i % 2) * 10, -130, 7));
  W.add(cyl(0.12, 0.12, 4.2, '#3a3a3a', {x: ox - 7.5, y: 2.1, z: 11.8}), cyl(0.12, 0.12, 4.2, '#3a3a3a', {x: ox + 7.5, y: 2.1, z: 11.8}));
  return W;
}
function labRoom(L) {
  const g = new THREE.Group();
  g.add(room(L, {w: 16, h: 5.5, d: 11, wall: '#bfd8de', floor: '#c9c3b4', seed: 5}));
  const ps = sign('PROCTER & GAMBLE', 5.2, 0.9, {bg: '#2f6db3', fg: '#ffffff', w: 780, h: 135, font: 'bold 62px Arial', sub: 'OHIO'}); ps.position.set(L, 4.5, -5.42); g.add(ps);
  for (const x of [-3, 3]) { g.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x: L + x, y: 5.1, z: -1})); g.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x: L + x, y: 4.6, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(L + x, 4.4, -1); g.add(b); }
  // long lab bench with tubes
  g.add(box(6.8, 1.0, 1.4, '#8a5a3b', {x: L - 0.5, y: 0.55, z: -3.8}), box(7.0, 0.1, 1.6, '#e8e4d8', {x: L - 0.5, y: 1.1, z: -3.8}));
  for (let i = 0; i < 5; i++) { const c = can(0.5, {lid: i % 2 === 0}); c.position.set(L - 3 + i * 1.2, 1.15, -3.8); c.rotation.y = i * 0.3; g.add(c); }
  g.add(P.at(P.papers(8, 14), L - 2.4, 1.16, -3.4), P.at(P.mug('#2f6db3'), L + 1.2, 1.15, -3.3));
  // blueprint board
  const bp = sign('THE TUBE', 3.2, 2.0, {bg: '#3f6ea8', fg: '#f4efe0', w: 640, h: 400, font: 'bold 80px Arial', sub: 'IDEA 01'}); bp.position.set(L + 5.0, 3.0, -5.42); g.add(bp);
  g.add(P.at(P.bookshelf(5, 2.4, 2.8), L - 6.5, 0.05, -5.0), P.at(P.filingCabinet(), L + 7.0, 0.05, -4.8), P.at(P.wallClock(), L - 3.6, 4.7, -5.4));
  const d = P.desk(2.4, '#7a4f33'); d.position.set(L + 3.0, 0.05, 1.0); g.add(d); g.add(P.at(P.papers(6, 30), L + 2.6, 1.02, 1.0), P.at(P.deskLamp(), L + 3.6, 1.02, 0.8));
  const fd = P.desk(2.0, '#6b4430'); fd.position.set(L - 5.0, 0.05, 2.4); fd.rotation.y = 0.3; g.add(fd); g.add(P.at(P.papers(6, 33), L - 5.0, 1.02, 2.4), P.at(P.mug('#c43d32'), L - 4.4, 1.02, 2.6));
  g.add(P.at(P.rug(7, 3.5, '#2f5d8a', '#d9a441'), L, 0.06, 0.8));
  return g;
}
function homeRoom(H) {
  const g = new THREE.Group();
  g.add(room(H, {w: 16, h: 5.5, d: 11, wall: '#e8d2a8', floor: '#9a6a44', seed: 12}));
  g.add(P.at(P.rug(9, 5, '#a8433a', '#e0b04a'), H, 0.06, 0.5));
  g.add(P.at(sofa(), H - 4.6, 0.05, -4.1), P.at(sofa('#8a5a6a'), H + 4.6, 0.05, -4.1));
  g.add(box(2.2, 0.15, 1.2, '#6b4430', {x: H, y: 0.62, z: -0.2}), box(0.15, 0.6, 0.15, '#4a2f20', {x: H - 0.9, y: 0.3, z: -0.6}), box(0.15, 0.6, 0.15, '#4a2f20', {x: H + 0.9, y: 0.3, z: 0.2}), box(0.15, 0.6, 0.15, '#4a2f20', {x: H - 0.9, y: 0.3, z: 0.2}), box(0.15, 0.6, 0.15, '#4a2f20', {x: H + 0.9, y: 0.3, z: -0.6}));
  const fp = sign('FRED', 1.6, 2.0, {bg: '#d9c9a8', w: 320, h: 400, font: 'bold 70px Arial', sub: 'BAUR'}); fp.position.set(H - 0.2, 3.3, -5.42); g.add(fp);
  g.add(P.at(P.bookshelf(7, 2.6, 3.0), H - 7.3, 0.05, -2.4, Math.PI / 2), P.at(P.wallClock(), H + 3.2, 4.4, -5.4), P.at(P.deskLamp(), H - 6.2, 0.05, -3.2));
  for (const x of [-3, 3]) { g.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x: H + x, y: 5.1, z: -1})); g.add(cyl(0.15, 0.45, 0.35, '#c98f6b', {x: H + x, y: 4.6, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(H + x, 4.4, -1); g.add(b); }
  g.add(P.at(P.tree(0.8, 5), H + 7.0, 0.05, -4.6));
  const win = sign('', 2.6, 1.8, {bg: '#8ec6e8', border: true}); win.position.set(H + 7.95, 3.0, -1.5); win.rotation.y = -Math.PI / 2; g.add(win);
  const d2 = P.desk(2.0, '#7a4f33'); d2.position.set(H + 6.0, 0.05, 2.4); d2.rotation.y = -0.3; g.add(d2); g.add(P.at(P.phone(), H + 6.0, 1.02, 2.4), P.at(P.mug(), H + 5.5, 1.02, 2.6));
  return g;
}
function storeRoom(S) {
  const g = new THREE.Group();
  g.add(room(S, {w: 22, h: 6.5, d: 12, wall: '#e6efe0', floor: '#d9d2bf', seed: 40}));
  const hdr = sign('GROCERY', 6.0, 1.0, {bg: '#2f7a4f', fg: '#ffffff', w: 800, h: 134, font: 'bold 90px Arial', border: true}); hdr.position.set(S, 5.4, -5.92); g.add(hdr);
  for (const x of [-7, 0, 7]) g.add(shelfRow(5, 3, S + x, 0.05, -4.6));
  g.add(shelfRow(4.5, 2, S - 6, 0.05, 1.0, Math.PI / 2), shelfRow(4.5, 2, S + 7, 0.05, 1.0, Math.PI / 2));
  g.add(box(3.4, 1.1, 1.2, '#2f5d62', {x: S + 4.6, y: 0.6, z: 3.0}), box(3.6, 0.1, 1.4, '#e8e4d8', {x: S + 4.6, y: 1.2, z: 3.0}));
  g.add(P.at(P.phone(), S + 5.4, 1.28, 3.0), P.at(P.mug('#e0a63e'), S + 3.8, 1.28, 3.0));
  for (const x of [-6, 0, 6]) { g.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x: S + x, y: 6.1, z: -1})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(S + x, 5.5, -1); g.add(b); }
  for (let i = 0; i < 3; i++) g.add(P.at(P.bench ? box(0.7, 0.5, 0.7, '#b98a52', {}) : box(0.7, 0.5, 0.7, '#b98a52', {}), S - 3 + i * 0.9, 0.3, 2.6));
  return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const D = LOC.day, O = LOC.office, J = LOC.joint, R = LOC.weather;
  const add = (c, x, z, y = 0.05) => { c.position.set(x, y, z); W.add(c); chars.push(c); return c; };

  // ======== CEMETERY ========
  W.add(cemetery(D));
  const hero = can(2.6); hero.position.set(D - 0.0, 0.05, 3.4); W.add(hero);
  const heroLid = hero.children[3];
  const plinth = box(1.6, 0.5, 1.6, '#8a8680', {x: D, y: 0.3, z: 3.4}); W.add(plinth); hero.position.y = 0.55;
  const mourners = [[-3.2, -0.4, 'navy', 'none'], [-1.6, -1.3, 'official', 'top'], [2.0, -1.3, 'navy', 'none'], [3.6, -0.5, 'clerk', 'none'], [-4.8, 0.8, 'pink', 'none'], [4.9, 0.9, 'student', 'none'], [0.9, -2.6, 'official', 'bowler'], [-2.6, -2.8, 'navy', 'none']];
  mourners.forEach(([x, z, pal, hat], i) => add(character({palette: pal, hat, glasses: i % 3 === 0, seed: 410 + i}), D + x, z + 0.8, 0.05));
  const gateSign = sign('CINCINNATI, OHIO', 5.4, 0.9, {bg: '#3f4a3c', fg: '#f4efe0', w: 800, h: 134, font: 'bold 62px Arial'}); gateSign.position.set(D, 4.8, -15); W.add(gateSign, cyl(0.12, 0.12, 4.8, '#3a3a3a', {x: D - 2.6, y: 2.4, z: -15}), cyl(0.12, 0.12, 4.8, '#3a3a3a', {x: D + 2.6, y: 2.4, z: -15}));
  const small = can(1.4); small.position.set(D, 0.15, -3.2); small.visible = false; W.add(small);
  const wreath = cyl(0.5, 0.5, 0.08, '#4f8a4a', {x: D + 2.8, y: 0.12, z: 4.2, seg: 18}); W.add(wreath);

  // ======== LAB ========
  W.add(labRoom(O));
  const baur = add(character({palette: 'engineer', hat: 'none', glasses: true, seed: 511}), O - 0.5, -2.4);
  add(character({palette: 'clerk', hat: 'none', seed: 512}), O + 3.8, -2.2);
  add(character({palette: 'teal', hat: 'none', glasses: true, seed: 513}), O + 3.0, 0.2);
  const proud = sign('MY CAN', 2.0, 0.7, {bg: '#f2c12e', fg: '#351f22', w: 400, h: 140, font: 'bold 80px Arial'}); proud.position.set(O - 0.6, 3.8, -1.0); W.add(proud);
  const tube = can(2.2); tube.position.set(O - 0.5, 1.2, -3.6); W.add(tube);

  // ======== HOME ========
  W.add(homeRoom(R));
  const mom = add(character({palette: 'pink', hat: 'none', seed: 611}), R - 1.6, -1.6);
  const dad = add(character({palette: 'navy', hat: 'none', glasses: true, seed: 612}), R + 1.6, -1.6);
  const sis = add(character({palette: 'mustard', hat: 'none', seed: 613}), R - 4.6, -2.6);
  const kid = add(character({palette: 'student', hat: 'cap', seed: 614, scale: 0.6}), R + 4.2, -2.2);
  const dateBoard = boardTex(640, 360); const dt = dateBoard.t;
  const drawDate = (p, q) => { const g = dateBoard.g; g.fillStyle = '#f4ead4'; g.fillRect(0, 0, 640, 360); g.strokeStyle = '#8a5a3b'; g.lineWidth = 18; g.strokeRect(0, 0, 640, 360); lines(g, ['2008'], 320, 150, 0, 'bold 130px Arial, sans-serif', '#351f22'); g.save(); g.globalAlpha = q; lines(g, ['AGE 89'], 320, 290, 0, 'bold 90px Arial, sans-serif', '#c43d32'); g.restore(); dt.needsUpdate = true; };
  drawDate(1, 0);
  const dBoard = box(3.6, 2.0, 0.12, '#ffffff', {thick: 0.02}); dBoard.material = [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshBasicMaterial({map: dt}), toon('#5a3a26')]; dBoard.position.set(R - 5.0, 3.2, -5.35); W.add(dBoard);
  const note = sign('BURY ME IN', 2.4, 1.3, {bg: '#f7f0de', w: 480, h: 260, font: 'bold 64px Arial', sub: 'A PRINGLES CAN'}); note.position.set(R, 2.5, -1.0); W.add(note);
  const hcan = can(1.1); hcan.position.set(R - 0.2, 0.7, -0.2); W.add(hcan);
  const urnM = urn(); urnM.position.set(R + 0.6, 0.7, -0.4); W.add(urnM);
  const keep = cyl(0.12, 0.12, 0.28, '#6b5a8a', {x: R + 4.0, y: 0.8, z: -1.5, seg: 12}); W.add(keep);
  const yes = sign('YES', 1.5, 0.6, {bg: '#4f8a4a', fg: '#ffffff', w: 300, h: 120, font: 'bold 80px Arial'}); yes.position.set(R, 3.9, -1.4); W.add(yes);
  const fast = sign('FAST!', 1.8, 0.7, {bg: '#c43d32', fg: '#ffffff', w: 360, h: 140, font: 'bold 80px Arial'}); fast.position.set(R + 1.6, 3.9, -1.4); W.add(fast);

  // ======== STORE ========
  W.add(storeRoom(J));
  add(character({palette: 'teal', hat: 'none', seed: 711}), J + 2.0, 0.6); add(character({palette: 'red', hat: 'none', glasses: true, seed: 712}), J + 3.4, 0.9);
  add(character({palette: 'mustard', hat: 'cap', seed: 713}), J + 4.6, 2.2); add(character({palette: 'pink', hat: 'none', seed: 714}), J - 2.2, 1.8);
  const orig = sign('ORIGINAL', 2.4, 0.7, {bg: '#c9302c', fg: '#f4ead0', w: 480, h: 140, font: 'bold 80px Arial'}); orig.position.set(J, 4.2, -1.2); W.add(orig);
  const bag = can(1.8); bag.position.set(J + 1.2, 1.3, 1.2); W.add(bag);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // hook: lid pops off on the word "buried"
    hero.visible = shot === 'hook' || shot === 's12' || shot === 's10';
    plinth.visible = hero.visible;
    small.visible = shot === 's10' && t > wordT('s10', 6) || shot === 's12';
    if (shot === 's10') { const a = ease(t, wordT('s10', 2), wordT('s10', 6)); small.position.y = 0.15 + 1.2 * (1 - a); hero.visible = false; plinth.visible = false; }
    if (shot === 's12') { small.position.y = 0.15; hero.position.set(D, 0.55, 3.4); hero.visible = true; plinth.visible = true; }
    // lab: proud sign pops on "proud"
    proud.visible = shot === 's04' && t > wordT('s04', 4);
    proud.scale.setScalar(Math.max(0.001, ease(t, wordT('s04', 4), wordT('s04', 4) + 0.35)));
    tube.visible = shot === 's03' || shot === 's04' || shot === 's02';
    // home
    drawDate(1, ease(t, wordT('s05', 7), wordT('s05', 7) + 0.4));
    note.visible = shot === 's06' && t >= wordT('s06', 0);
    note.scale.setScalar(Math.max(0.001, ease(t, wordT('s06', 0), wordT('s06', 0) + 0.4)));
    hcan.visible = shot === 's09'; urnM.visible = shot === 's09' && t > wordT('s09', 10);
    urnM.scale.setScalar(Math.max(0.001, ease(t, wordT('s09', 10), wordT('s09', 10) + 0.4)));
    keep.visible = shot === 's11'; kid.position.y = 0.05;
    yes.visible = shot === 's07' && t > wordT('s07', 3); yes.scale.setScalar(Math.max(0.001, ease(t, wordT('s07', 3), wordT('s07', 3) + 0.3)));
    fast.visible = shot === 's07' && t > wordT('s07', 14); fast.scale.setScalar(Math.max(0.001, ease(t, wordT('s07', 14), wordT('s07', 14) + 0.3)));
    // store
    orig.visible = shot === 's08' && t > wordT('s08', 13); orig.scale.setScalar(Math.max(0.001, ease(t, wordT('s08', 13), wordT('s08', 13) + 0.35)));
    bag.visible = shot === 's08' && t > wordT('s08', 9);
    hcan.position.y = 0.7;
  };
  return {group: W, update};
}
