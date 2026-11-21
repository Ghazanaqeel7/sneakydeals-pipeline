import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressStreet, dressOffice} from './dress.js';
import * as P from './props.js';

export const LOC = {day: 300, office: 600, wyo: 700, boss: 800};

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

function sparks(seed, count = 120) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({color: '#ffcc55', size: 1.1, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
  const pts = new THREE.Points(geo, mat);
  const r = rng(seed);
  const seeds = Array.from({length: count}, () => [r(), r(), r(), r()]);
  pts.userData.update = (t, origins, on = 1) => {
    mat.opacity = on;
    for (let i = 0; i < count; i++) {
      const [a, b, c, d] = seeds[i];
      const o = origins[i % origins.length];
      const life = (t * (1.2 + a) + d) % 1;
      pos[i * 3] = o[0] + (b - 0.5) * 3 * life;
      pos[i * 3 + 1] = o[1] + (0.6 - life * 1.6) * 1.8 * c;
      pos[i * 3 + 2] = o[2] + life * 1.5 * a;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
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


// ---- restaurant building (names only, no logos) ----
function eatery(ox, z, {name, wall, roof, signBg, signFg = '#ffffff', w = 10, h = 5.2, seed = 1}) {
  const g = new THREE.Group();
  g.add(box(w, h, 8, wall, {x: ox, y: h / 2, z, thick: 0.04}));
  const roofB = box(w + 0.8, 0.6, 9, roof, {x: ox, y: h + 0.3, z, thick: 0.04}); g.add(roofB);
  const front = z + 4.05;
  g.add(box(w * 0.62, 2.2, 0.1, '#9fd0e6', {x: ox - w * 0.12, y: 1.9, z: front, thick: 0.02}));
  g.add(box(1.5, 2.8, 0.12, '#5a3a26', {x: ox + w * 0.33, y: 1.5, z: front, thick: 0.02}));
  const awn = box(w, 0.2, 1.8, roof, {x: ox, y: 3.35, z: front + 0.8, thick: 0.02}); awn.rotation.x = 0.28; g.add(awn);
  const sg = sign(name, w * 0.85, 1.5, {bg: signBg, fg: signFg, w: 900, h: 190, font: 'bold 120px Arial, sans-serif', border: false});
  sg.position.set(ox, h - 0.2, front + 0.1); g.add(sg);
  const r = rng(seed);
  for (let i = 0; i < 5; i++) g.add(box(0.5, 0.35 + r() * 0.2, 0.3, ['#e0533d', '#f2c12e', '#6aa84f'][i % 3], {x: ox - w * 0.3 + i * 0.7, y: 1.1, z: front - 0.5, thick: 0.01}));
  return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const D = LOC.day, O = LOC.office, Y = LOC.wyo, J = LOC.boss;
  const TJ = D - 5.5, TB = D + 6.8; // restaurant x positions on the plaza line

  // ======== STREET (day) ========
  W.add(street(D, {seed: 23}));
  const trafficD = dressStreet(W, D, {seed: 23, chars, avoid: [D - 5.5, D + 15]});
  W.add(eatery(TJ, -9, {name: "TACO JOHN'S", wall: '#e8b04a', roof: '#c8102e', signBg: '#c8102e', seed: 3}));
  W.add(eatery(TB, -9, {name: 'TACO BELL', wall: '#d9c6ee', roof: '#6b2d8f', signBg: '#6b2d8f', seed: 5}));
  const banner = sign('TACO TUESDAY', 8.2, 1.7, {bg: '#ffd23f', w: 900, h: 190, font: 'bold 120px Arial, sans-serif'});
  banner.position.set(TJ, 6.6, -3.2); W.add(banner);
  W.add(cyl(0.12, 0.14, 7.4, '#3a3a3a', {x: TJ - 4.4, y: 3.7, z: -3.2}), cyl(0.12, 0.14, 7.4, '#3a3a3a', {x: TJ + 4.4, y: 3.7, z: -3.2}));
  for (let i = 0; i < 6; i++) W.add(cloud(D - 80 + i * 30, 100 + (i % 3) * 10, -130, 7));
  for (const s of [-1, 1]) { W.add(P.at(P.tree(1.4, 70 + s), D + s * 14, 0.05, -10)); W.add(P.at(P.bench(), D + s * 2.2 + 1, 0.05, -2.0, 0)); }
  W.add(P.at(P.flag('#c8102e'), TJ - 5.6, 0.05, -4.6), P.at(P.flag('#6b2d8f'), TB + 5.6, 0.05, -4.6));
  // customers queue at Taco John's, a few at Taco Bell
  const cust = [];
  [[-2.4, 'red', 'cap'], [-1.0, 'teal', 'none'], [0.4, 'mustard', 'bowler'], [1.8, 'pink', 'none'], [3.0, 'student', 'cap']].forEach(([dx, pal, hat], i) => {
    const c = character({palette: pal, hat, seed: 410 + i}); c.position.set(TJ + dx, 0.05, -1.2 + (i % 2) * 1.1); W.add(c); chars.push(c); cust.push(c);
  });
  [[-1.2, 'navy', 'none'], [0.6, 'clerk', 'top'], [2.0, 'teal', 'cap']].forEach(([dx, pal, hat], i) => {
    const c = character({palette: pal, hat, seed: 430 + i}); c.position.set(TB + dx, 0.05, -1.4 + (i % 2) * 0.9); W.add(c); chars.push(c);
  });
  const cook = character({palette: 'red', hat: 'cap', seed: 441}); cook.position.set(TJ - 3.6, 0.05, -2.2); W.add(cook); chars.push(cook);
  // menu boards that pop up in the closing shot
  const menus = [];
  for (let i = 0; i < 7; i++) {
    const m = sign('TACO TUESDAY', 2.6, 0.8, {bg: ['#ffd23f', '#f2e6cc', '#e0533d'][i % 3], w: 520, h: 160, font: 'bold 64px Arial, sans-serif'});
    m.position.set(D - 21 + i * 7, 3.0, 5.0 + (i % 2) * 0.2); W.add(m); menus.push(m);
  }

  // ======== WYOMING PLAINS ========
  W.add(ground(220, 120, '#a9b873', {x: Y, z: -20, seed: 15, repeat: 14}));
  const road = new THREE.Mesh(new THREE.BoxGeometry(220, 0.05, 6), toon('#6e6670')); road.position.set(Y, 0.03, 8); W.add(road);
  for (let i = -10; i < 10; i++) W.add(box(2.4, 0.06, 0.3, '#e8d28a', {x: Y + i * 8, y: 0.07, z: 8, edges: false, thick: 0.001}));
  W.add(eatery(Y, -6, {name: "TACO JOHN'S", wall: '#e8b04a', roof: '#c8102e', signBg: '#c8102e', w: 9, h: 4.4, seed: 7}));
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(14 + (i % 3) * 5, 22 + (i % 4) * 8, 5), toon(i % 2 ? '#8c9bb0' : '#7b8aa3')); m.position.set(Y - 90 + i * 24, 11 + (i % 4) * 3, -85 - (i % 3) * 14); ink(m, 0.2, true); W.add(m); }
  for (let i = 0; i < 6; i++) W.add(cloud(Y - 60 + i * 26, 70 + (i % 3) * 8, -110, 6));
  const wy = sign('WYOMING', 3.8, 1.0, {bg: '#3e5a7a', fg: '#ffffff', w: 760, h: 200, font: 'bold 96px Arial, sans-serif'}); wy.position.set(Y - 6.6, 3.4, 5.2); W.add(wy);
  W.add(cyl(0.08, 0.08, 3.4, '#3a3a3a', {x: Y - 7.8, y: 1.7, z: 5.2}), cyl(0.08, 0.08, 3.4, '#3a3a3a', {x: Y - 5.4, y: 1.7, z: 5.2}));
  const cnt = sign('400', 3.0, 1.5, {bg: '#f2e6cc', w: 600, h: 300, font: 'bold 190px Arial, sans-serif', sub: 'RESTAURANTS'}); cnt.position.set(Y + 7.0, 3.6, 3.4); W.add(cnt);
  W.add(cyl(0.08, 0.08, 3.6, '#3a3a3a', {x: Y + 5.7, y: 1.8, z: 3.4}), cyl(0.08, 0.08, 3.6, '#3a3a3a', {x: Y + 8.3, y: 1.8, z: 3.4}));
  for (let i = 0; i < 8; i++) { const mini = eatery(Y - 30 + i * 8, -26 - (i % 2) * 6, {name: "TACO JOHN'S", wall: '#e8b04a', roof: '#c8102e', signBg: '#c8102e', w: 6, h: 3.4, seed: 20 + i}); W.add(mini); }
  const wcar = P.car('#2f6db3'); wcar.position.set(Y + 2, 0, 4); wcar.rotation.y = 0.5; W.add(wcar);
  W.add(P.at(P.car('#c43d32'), Y - 3.5, 0, 3.4, -0.3));
  for (let i = 0; i < 6; i++) W.add(P.at(P.tree(1.1, 800 + i), Y - 16 + i * 7, 0.05, -14 + (i % 2) * 3));
  [[-1.4, 'red', 'cap'], [1.2, 'teal', 'none'], [3.4, 'mustard', 'bowler']].forEach(([dx, pal, hat], i) => {
    const c = character({palette: pal, hat, seed: 460 + i}); c.position.set(Y + dx, 0.05, -0.3 + (i % 2)); W.add(c); chars.push(c);
  });

  // ======== TRADEMARK OFFICE ========
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const desk = new THREE.Group();
  desk.add(box(4.2, 0.18, 2, '#8a5a3b', {y: 1.05}));
  for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) desk.add(box(0.15, 1.0, 0.15, '#6b4430', {x, y: 0.5, z}));
  desk.position.set(O - 2.5, 0, 0.5); W.add(desk);
  // application form with a stamp (redrawn per shot)
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 320; const fg = fc.getContext('2d');
  const formTex = new THREE.CanvasTexture(fc); formTex.colorSpace = THREE.SRGBColorSpace; formTex.anisotropy = 8;
  let formKey = '';
  const drawForm = (head, stamp, col) => {
    const k = head + stamp; if (k === formKey) return; formKey = k;
    fg.fillStyle = '#f7f0de'; fg.fillRect(0, 0, 512, 320); fg.strokeStyle = INK; fg.lineWidth = 6; fg.strokeRect(8, 8, 496, 304);
    fg.fillStyle = INK; fg.textAlign = 'center'; fg.font = 'bold 34px Arial, sans-serif'; fg.fillText(head, 256, 56);
    fg.font = 'bold 58px Arial, sans-serif'; fg.fillText('"TACO TUESDAY"', 256, 130);
    for (let i = 0; i < 5; i++) { fg.fillStyle = '#bcae92'; fg.fillRect(50, 170 + i * 24, 412, 8); }
    if (stamp) { fg.save(); fg.translate(256, 235); fg.rotate(-0.22); fg.strokeStyle = col; fg.fillStyle = col; fg.lineWidth = 10; fg.strokeRect(-190, -48, 380, 96); fg.font = 'bold 74px Arial, sans-serif'; fg.fillText(stamp, 0, 26); fg.restore(); }
    formTex.needsUpdate = true;
  };
  drawForm('TRADEMARK APPLICATION', '', '#000');
  const form = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.0), [toon('#d8c9a8'), toon('#d8c9a8'), toon('#ffffff', formTex), toon('#d8c9a8'), toon('#d8c9a8'), toon('#d8c9a8')]);
  ink(form, 0.01, true); form.position.set(O - 3.4, 1.18, 0.7); form.rotation.y = 0.15; W.add(form);
  const stampG = new THREE.Group(); stampG.add(cyl(0.22, 0.22, 0.12, '#5a3a26', {y: 0.06}), cyl(0.07, 0.07, 0.4, '#8a5a3b', {y: 0.32}), cyl(0.12, 0.1, 0.1, '#5a3a26', {y: 0.55}));
  stampG.position.set(O - 2.3, 1.14, 1.2); W.add(stampG);
  // wall board (status text)
  const bc = document.createElement('canvas'); bc.width = 640; bc.height = 360; const bg = bc.getContext('2d');
  const boardTex = new THREE.CanvasTexture(bc); boardTex.colorSpace = THREE.SRGBColorSpace; let boardKey = '#';
  const drawBoard = (l1, l2, col) => {
    const k = l1 + l2; if (k === boardKey) return; boardKey = k;
    bg.fillStyle = '#2f4a3a'; bg.fillRect(0, 0, 640, 360); bg.strokeStyle = '#8a5a3b'; bg.lineWidth = 22; bg.strokeRect(0, 0, 640, 360);
    bg.fillStyle = '#f2ead6'; bg.textAlign = 'center'; bg.font = 'bold 46px Arial, sans-serif'; bg.fillText(l1, 320, 110);
    bg.fillStyle = col; bg.font = 'bold 92px Arial, sans-serif'; bg.fillText(l2, 320, 245); boardTex.needsUpdate = true;
  };
  drawBoard('TACO TUESDAY', '', '#ffd66b');
  const board = box(5.6, 3.1, 0.12, '#ffffff', {thick: 0.02});
  board.material = [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshBasicMaterial({map: boardTex}), toon('#5a3a26')];
  board.position.set(O + 1.0, 2.9, -5.35); W.add(board);
  dressOffice(W, O, chars);
  const clerk = character({palette: 'official', hat: 'none', glasses: true, seed: 61}); clerk.position.set(O + 3.4, 0.05, -3.2); W.add(clerk); chars.push(clerk);
  const lawyer = character({palette: 'navy', hat: 'top', seed: 62}); lawyer.position.set(O - 1.0, 0.05, -2.6); W.add(lawyer); chars.push(lawyer);
  const brief = box(0.5, 0.36, 0.14, '#5a3a26', {thick: 0.01}); brief.position.set(0.3, -0.5, 0.08); lawyer.userData.armL.add(brief);
  const win = sign('', 2.4, 2.0, {bg: '#bfe3f5', border: true}); win.position.set(O - 5, 3.1, -5.4); W.add(win);
  const plant = new THREE.Group(); plant.add(cyl(0.35, 0.28, 0.7, '#b35a3a', {y: 0.35})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.3, 0.9 + (i % 3) * 0.25, Math.sin(i) * 0.3); plant.add(l); }
  plant.position.set(O - 5.6, 0.05, 3.2); W.add(plant);

  // ======== BOSS ROOM ========
  W.add(room(J, {w: 18, h: 6, d: 12, wall: '#f0d9b5', floor: '#8a5a3b', seed: 33}));
  W.add(P.at(P.rug(7, 4, '#a8433a', '#e0b04a'), J, 0, -0.2));
  const bd = P.desk(3.0, '#6b4430'); bd.position.set(J, 0.05, -3.6); W.add(bd);
  W.add(P.at(P.papers(8, 44), J - 0.8, 1.0, -3.6), P.at(P.deskLamp(), J + 1.2, 1.0, -3.9), P.at(P.phone(), J + 0.5, 1.0, -3.4), P.at(P.mug('#2f6db3'), J - 1.4, 1.0, -3.3));
  W.add(P.at(P.bookshelf(7), J - 6.2, 0.05, -5.3), P.at(P.bookshelf(8), J + 6.2, 0.05, -5.3), P.at(P.filingCabinet(), J + 8.2, 0.05, -4.6), P.at(P.wallClock(), J + 3.6, 4.7, -5.4));
  W.add(P.at(P.chair('#7a2f2f'), J, 0.05, -4.6, 0));
  const cal = sign('JULY 18', 2.8, 2.2, {bg: '#f7f0de', fg: '#c8102e', w: 560, h: 440, font: 'bold 120px Arial, sans-serif', sub: 'TRADEMARK RELEASED'}); cal.position.set(J, 3.4, -5.45); W.add(cal);
  const logoWall = sign("TACO JOHN'S", 3.4, 0.9, {bg: '#c8102e', fg: '#ffffff', w: 680, h: 180, font: 'bold 84px Arial, sans-serif', border: false}); logoWall.position.set(J - 3.6, 4.2, -5.45); W.add(logoWall);
  const sFight = sign('FIGHT', 1.5, 0.7, {bg: '#e0533d', fg: '#ffffff', w: 400, h: 190, font: 'bold 96px Arial, sans-serif'}); sFight.position.set(J - 2.7, 1.9, -1.4); W.add(sFight);
  const sWalk = sign('WALK AWAY', 2.0, 0.7, {bg: '#4f8a4a', fg: '#ffffff', w: 540, h: 190, font: 'bold 76px Arial, sans-serif'}); sWalk.position.set(J + 2.7, 1.9, -1.4); W.add(sWalk);
  W.add(cyl(0.05, 0.05, 1.6, '#3a3a3a', {x: J - 2.7, y: 0.8, z: -1.45}), cyl(0.05, 0.05, 1.6, '#3a3a3a', {x: J + 2.7, y: 0.8, z: -1.45}));
  const check = sign('$40,000', 2.6, 1.2, {bg: '#e9f3dc', fg: '#245a2a', w: 640, h: 300, font: 'bold 130px Arial, sans-serif', sub: 'TO CHARITY'}); check.position.set(J + 1.6, 2.6, -2.2); W.add(check);
  const boss = character({palette: 'red', hat: 'none', glasses: false, seed: 71}); boss.position.set(J - 0.2, 0.05, -1.7); W.add(boss); chars.push(boss);
  const aide = character({palette: 'teal', hat: 'none', glasses: true, seed: 72}); aide.position.set(J + 4.8, 0.05, -2.2); W.add(aide); chars.push(aide);
  W.add(P.at(plant.clone(), J + 7.2, 0.05, 3.4), P.at(plant.clone(), J - 7.2, 0.05, 3.2));

  // ======== per-frame update ========
  const stampT = (a, b) => ease(t_, a, b); let t_ = 0;
  const update = (t, cam, shot) => {
    t_ = t;
    for (const c of chars) c.userData.update(t, cam.position);
    trafficD(t, cam);
    // office form + stamp
    if (shot === 's03') { drawForm('TRADEMARK APPLICATION', t > wordT('s03', 1.5) ? 'REGISTERED' : '', '#2a8a3a'); }
    else if (shot === 's04' || shot === 's05') { drawForm('NEW APPLICATION  2019', t > wordT('s04', 10) ? 'DENIED' : '', '#c8102e'); }
    const slam = (a) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
    const sh = shot === 's03' ? slam(wordT('s03', 1.5)) : (shot === 's04' || shot === 's05') ? slam(wordT('s04', 10)) : 0;
    stampG.position.y = 1.14 + 0.5 * (1 - sh) * (shot === 's03' || shot === 's04' ? 1 : 0.4);
    stampG.position.x = O - 3.3; stampG.position.z = 0.75;
    // wall board
    if (shot === 's03') drawBoard('REGISTERED', '1989', '#9be28a');
    else if (shot === 's04') drawBoard('SECOND TRY', 'NO', '#ff8a7a');
    else if (shot === 's05') drawBoard('THE VERDICT', t > wordT('s05', 5) ? 'TOO GENERIC' : '...', '#ffd66b');
    else if (shot === 's08') drawBoard('TACO BELL ASKS', 'CANCEL IT', '#ffd66b');
    else if (shot === 's09') drawBoard('TACO BELL WANTS', 'NO MONEY', '#9be28a');
    lawyer.userData.armR.rotation.z = (shot === 's08') ? 1.9 : 0;
    clerk.userData.armR.rotation.z = (shot === 's05' && t > wordT('s05', 4)) ? 1.8 : 0;
    // boss room
    const chk = ease(t, wordT('s12', 11), wordT('s12', 11) + 0.5);
    check.visible = shot === 's12' && chk > 0.01; check.scale.setScalar(Math.max(0.001, chk));
    sFight.visible = sWalk.visible = shot === 's10' || shot === 's11';
    boss.userData.armR.rotation.z = shot === 's12' ? 1.5 + Math.sin(t * 6) * 0.2 : 0;
    // closing: menus pop up
    menus.forEach((m, i) => { const p = ease(t, wordT('s13', 7) + i * 0.12, wordT('s13', 7) + i * 0.12 + 0.35); m.visible = shot === 's13' && p > 0.01; m.scale.setScalar(Math.max(0.001, p)); });
    cust.forEach((c, i) => { c.userData.armR.rotation.z = (shot === 's06') ? 1.8 + Math.sin(t * 5 + i) * 0.3 : 0; });
  };
  return {group: W, update};
}
