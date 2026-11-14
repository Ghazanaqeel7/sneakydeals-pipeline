import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, ground, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';

export const LOC = {shop: 0, hall: 300, acct: 600, board: 700, fact: 800};
export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const add = (W, ...o) => o.forEach((x) => W.add(x));
const pos = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

function vac(color = '#c43d32', s = 1) {
  const g = new THREE.Group();
  g.add(box(0.5, 0.16, 0.38, color, {y: 0.12, thick: 0.015}));
  g.add(cyl(0.17, 0.2, 0.55, color, {y: 0.45, seg: 14, thick: 0.015}));
  g.add(box(0.28, 0.5, 0.1, '#e9e2cf', {y: 0.55, z: 0.18, thick: 0.01}));
  g.add(cyl(0.02, 0.02, 0.7, '#2b2b2e', {y: 0.95, seg: 6, thick: 0.004}));
  g.add(box(0.28, 0.04, 0.05, '#2b2b2e', {y: 1.3, thick: 0.004, edges: false}));
  g.scale.setScalar(s); return g;
}
function ticket() {
  const g = new THREE.Group();
  g.add(box(0.55, 0.025, 0.24, '#f7f0de', {thick: 0.006}));
  g.add(box(0.5, 0.03, 0.05, '#c43d32', {z: -0.06, thick: 0.002, edges: false}));
  g.add(box(0.14, 0.03, 0.1, '#2f6db3', {x: 0.16, z: 0.04, thick: 0.002, edges: false}));
  return g;
}
function plane() {
  const g = new THREE.Group();
  const f = cyl(0.28, 0.28, 3.2, '#f2f0e6', {seg: 14}); f.rotation.z = Math.PI / 2; g.add(f);
  g.add(box(0.7, 0.06, 3.0, '#c8d0d8', {x: 0.1}), box(0.5, 0.5, 0.06, '#c43d32', {x: -1.5, y: 0.4}));
  for (let i = 0; i < 4; i++) g.add(box(0.1, 0.1, 0.05, '#2f6db3', {x: 0.8 - i * 0.35, y: 0.1, z: 0.28, edges: false}));
  return g;
}
function palm(h = 3.5) {
  const g = new THREE.Group(); g.add(cyl(0.12, 0.2, h, '#8a5a3b', {y: h / 2, seg: 8}));
  for (let i = 0; i < 6; i++) { const l = box(1.6, 0.05, 0.4, '#3f9a4a', {thick: 0.01}); l.position.set(Math.cos(i * 1.05) * 0.8, h + 0.1, Math.sin(i * 1.05) * 0.8); l.rotation.y = -i * 1.05; l.rotation.z = -0.3; g.add(l); }
  return g;
}
function flagUS() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) g.add(box(2.6, 0.2, 0.05, i % 2 ? '#f7f0de' : '#c43d32', {y: 0.1 + i * 0.2, thick: 0.004, edges: false}));
  g.add(box(1.1, 0.8, 0.07, '#2e3f6b', {x: -0.75, y: 1.0, z: 0.01, thick: 0.004, edges: false}));
  g.add(cyl(0.04, 0.04, 2.2, '#c9a24a', {x: -1.4, y: 0.7, seg: 6, thick: 0.004}));
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

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const mk = (pal, hat, s, x, y, z, glasses = false) => { const c = character({palette: pal, hat, glasses, seed: s}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };
  const sg = (txt, w, h, o = {}) => sign(txt, w, h, Object.assign({w: 640, h: Math.round(640 * h / w), font: 'bold 80px Arial, sans-serif'}, o));
  const lamps = (O, y, xs, z = -1) => xs.forEach((x) => { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x: O + x, y: y + 0.4, z}), cyl(0.15, 0.45, 0.35, '#2f5d62', {x: O + x, y, z, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(O + x, y - 0.2, z); W.add(b); });

  // ======== SHOP (hook, yousee, offer) ========
  const S = LOC.shop;
  W.add(room(S, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', floor: '#a7764e', seed: 8}));
  const counter = new THREE.Group(); counter.add(box(5, 1.1, 1.3, '#8a5a3b', {y: 0.6}), box(5.2, 0.1, 1.5, '#d8c9a8', {y: 1.2, thick: 0.02})); pos(counter, S, 0.05, 1.2); W.add(counter);
  const vbox = new THREE.Group(); vbox.add(box(1.0, 0.7, 0.55, '#e0533d', {y: 0.35, thick: 0.02}));
  const vl = sg('HOOVER', 0.9, 0.3, {bg: '#f7f0de', font: 'bold 70px Arial'}); vl.position.set(0, 0.45, 0.29); vbox.add(vl);
  const vt = ticket(); vt.position.set(0.1, 0.8, 0.12); vt.rotation.set(-0.5, 0, 0.1); vbox.add(vt);
  vbox.scale.setScalar(1.5); vbox.position.set(S - 0.9, 1.25, 1.2); W.add(vbox);
  const ts = [ticket(), ticket()]; ts.forEach((t, i) => { t.scale.setScalar(1.8); W.add(t); });
  const price = sg('£100', 1.2, 0.8, {bg: '#f2e6cc', font: 'bold 150px Arial'}); price.position.set(S + 0.8, 1.7, 1.3); W.add(price);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 12), toon('#3e8fc6')); ink(globe, 0.02, false); globe.position.set(S + 0.8, 2.3, 1.2); W.add(globe);
  const eu = sg('EUROPE', 1.6, 0.5, {bg: '#f2e6cc', font: 'bold 90px Arial'}); eu.position.set(S + 0.8, 3.0, 1.2); W.add(eu);
  const pod = box(3.2, 0.4, 2.0, '#d8c9a8', {x: S - 4.2, y: 0.25, z: -2.6}); W.add(pod);
  [['#c43d32', -0.9, -0.2], ['#2f6db3', 0, -0.2], ['#d9a441', 0.9, -0.2], ['#4f8a4a', -0.45, 0.5], ['#7a4f73', 0.45, 0.5]].forEach(([c, x, z]) => W.add(pos(vac(c, 1.0), S - 4.2 + x, 0.45, -2.6 + z)));
  for (const x of [-1.5, 3.0]) { const sh = P.at(P.bookshelf(11 + x, 2.6, 2.6), S + 5.3 + (x > 0 ? 0 : -9) , 0.05, -5.15); W.add(sh); }
  for (let i = 0; i < 4; i++) W.add(pos(vac(['#c43d32', '#2f6db3', '#d9a441', '#4f8a4a'][i], 0.9), S + 4.4 + (i % 2) * 0.7 , 0.05 + 1.0 * Math.floor(i / 2) * 0, -4.4 + Math.floor(i / 2) * 0.9));
  const yr = sg('1992', 1.6, 1.0, {bg: '#f4ead4', font: 'bold 130px Arial'}); yr.position.set(S + 3.2, 3.4, -5.4); W.add(yr);
  const sky = sg('', 3, 2.0, {bg: '#8fa9bd', border: true}); sky.position.set(S - 0.3, 3.6, -5.4); W.add(sky);
  const jet = plane(); jet.position.set(S, 3.6, -5.25); W.add(jet);
  for (let i = 0; i < 30; i++) { const r = box(0.02, 0.2, 0.01, '#d6e6f2', {x: S - 1.3 + (i % 10) * 0.29, y: 2.8 + Math.floor(i / 10) * 0.6, z: -5.3, edges: false, thick: 0.001}); W.add(r); }
  W.add(P.at(P.wallClock(), S + 6.6, 4.4, -5.4), P.at(P.plantLike ? P.plantLike() : new THREE.Group(), S, 0, 0));
  lamps(S, 4.6, [-3, 3]);
  const salesman = mk('red', 'none', 31, S - 2.6, 0.05, -0.2, true);
  const clerk = mk('clerk', 'none', 32, S + 0.6, 0.05, 0.1);
  const cust = mk('mustard', 'bowler', 33, S + 1.8, 0.05, 3.0);

  // ======== TRAVEL HALL (usa, so) ========
  const H = LOC.hall;
  W.add(room(H, {w: 24, h: 7, d: 12, wall: '#efe3c4', floor: '#9a8466', seed: 12}));
  W.add(box(5, 0.9, 1.0, '#2f6db3', {x: H, y: 0.5, z: -3.4}));
  const fl = sg('FREE FLIGHTS', 4.8, 0.9, {bg: '#f2c12e', font: 'bold 80px Arial'}); fl.position.set(H, 1.75, -2.85); W.add(fl);
  const skyline = new THREE.Group(); [[1.4, 5], [1.1, 7.5], [1.6, 6.2], [1.2, 8.8], [1.5, 5.8]].forEach(([w, h], i) => skyline.add(box(w, h, 0.5, ['#5f7bb0', '#6b7a99', '#4f6590', '#7f8fb5', '#58709c'][i], {x: i * 1.5, y: h / 2, z: 0})));
  pos(skyline, H - 9.2, 0.05, -5.5); W.add(skyline);
  const nyS = sg('NEW YORK', 3.4, 0.9, {bg: '#f4ead4', font: 'bold 90px Arial'}); nyS.position.set(H - 6.2, 2.2, -5.5); W.add(nyS);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({color: '#ffd45a'})); sun.position.set(H + 7, 5.2, -5.9); W.add(sun);
  [7.0, 8.4, 5.8, 9.6].forEach((x, i) => W.add(pos(palm(3.4 + i % 2), H + x, 0.05, -5.0 + (i % 2) * 0.6)));
  const flS = sg('FLORIDA', 3.4, 0.9, {bg: '#f4ead4', font: 'bold 90px Arial'}); flS.position.set(H + 7.6, 2.2, -5.5); W.add(flS);
  const usT = Array.from({length: 8}, () => { const t = ticket(); t.scale.setScalar(1.6); W.add(t); return t; });
  const exp = sg('EXPECTED: 50,000', 5.4, 1.2, {bg: '#f2e6cc', font: 'bold 82px Arial'}); exp.position.set(H, 4.6, -5.9); W.add(exp);
  const came = sg('HUNDREDS OF THOUSANDS CAME', 7.2, 1.4, {bg: '#e0533d', fg: '#fff4dc', font: 'bold 68px Arial'}); came.position.set(H, 4.6, -5.88); W.add(came);
  const phones = []; for (let i = 0; i < 6; i++) { const ph = P.phone(); ph.position.set(H - 9.5 + i * 0.9, 1.15, -4.6); W.add(ph); phones.push(ph); }
  W.add(box(6, 1.1, 1.4, '#8a5a3b', {x: H - 7.5, y: 0.6, z: -4.6}));
  for (let i = 0; i < 9; i++) { const sk = new THREE.Group(); sk.add(box(1.0, 0.5, 0.7, '#cdb98a', {y: 0.25}), sg('MAIL', 0.6, 0.25, {bg: '#e9dfc4', font: 'bold 70px Arial'}).translateY(0.28).translateZ(0.36)); pos(sk, H + 6.5 + (i % 3) * 1.15, 0.05 + Math.floor(i / 6) * 0.52 + (i % 6 > 2 ? 0.52 : 0), -3.6 + (i % 2) * 0.3, (i - 4) * 0.08); W.add(sk); }
  const crowdG = P.crowd(16, H - 7, H + 7, 1.6, 5, chars); W.add(crowdG);
  mk('pink', 'none', 41, H - 3.2, 0.05, 1.0); mk('navy', 'cap', 42, H + 2.4, 0.05, 0.6, true);
  mk('clerk', 'none', 43, H, 0.05, -3.1);
  lamps(H, 6.0, [-7, 0, 7]);
  W.add(P.at(P.wallClock(), H - 1.5, 6.0, -5.9));

  // ======== ACCOUNTS (ladder) ========
  const A = LOC.acct;
  W.add(room(A, {w: 16, h: 5.5, d: 11, wall: '#d9e4c8', seed: 21}));
  const cC = document.createElement('canvas'); cC.width = 640; cC.height = 420; const cg = cC.getContext('2d');
  const cT = new THREE.CanvasTexture(cC); cT.colorSpace = THREE.SRGBColorSpace;
  const drawBars = (a, b) => {
    cg.fillStyle = '#f4ead4'; cg.fillRect(0, 0, 640, 420); cg.strokeStyle = INK; cg.lineWidth = 8; cg.strokeRect(4, 4, 632, 412);
    cg.fillStyle = INK; cg.font = 'bold 40px Arial'; cg.textAlign = 'center'; cg.fillText('SALES  vs  FLIGHTS', 320, 56);
    cg.fillStyle = '#2f6db3'; cg.fillRect(130, 370 - 120 * a, 140, 120 * a); cg.fillStyle = '#c43d32'; cg.fillRect(370, 370 - 290 * b, 140, 290 * b);
    cg.fillStyle = INK; cg.font = 'bold 30px Arial'; cg.fillText('SALES', 200, 404); cg.fillText('TICKETS', 440, 404); cT.needsUpdate = true;
  };
  drawBars(0, 0);
  const chart = box(5, 3.3, 0.12, '#ffffff'); chart.material = [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshBasicMaterial({map: cT}), toon('#5a3a26')]; chart.position.set(A + 0.8, 3.0, -5.35); W.add(chart);
  W.add(P.at(P.bookshelf(21), A - 6.0, 0.05, -5.15), P.at(P.filingCabinet(), A + 6.4, 0.05, -5.0), P.at(P.filingCabinet('#8f7d6a'), A + 7.2, 0.05, -5.0), P.at(P.wallClock(), A - 3.0, 4.5, -5.4), P.at(P.rug(6, 3.6), A - 2.5, 0, 0.4));
  const dk = P.desk(2.6); dk.position.set(A - 2.5, 0.05, 0.2); W.add(dk);
  W.add(P.at(P.papers(9, 5), A - 3.2, 1.08, 0.2), P.at(P.phone(), A - 1.6, 1.08, 0.1), P.at(P.deskLamp(), A - 3.6, 1.08, -0.1), P.at(P.mug(), A - 1.3, 1.08, 0.6));
  const calc = box(0.5, 0.14, 0.7, '#4a4a52', {x: A - 2.5, y: 1.15, z: 0.5}); W.add(calc);
  const tape = box(0.18, 1, 0.012, '#f7f0de', {thick: 0.002, edges: false}); tape.position.set(A - 2.5, 1.2, 0.9); W.add(tape);
  const d2 = P.desk(2.0, '#7a4f33'); d2.position.set(A + 4.8, 0.05, -2.2); W.add(d2); W.add(P.at(P.papers(5, 9), A + 4.6, 1.08, -2.2));
  const ps1 = P.poster('AUDIT', 1.1, 1.5, '#e6d39a'); P.at(ps1, A - 4.7, 3.4, -5.45); W.add(ps1);
  const tens = sg('TENS OF MILLIONS', 5.0, 1.0, {bg: '#e0533d', fg: '#fff4dc', font: 'bold 72px Arial'}); tens.position.set(A + 0.8, 0.95, -5.1); W.add(tens);
  // scale (but)
  const SX = A - 3.7;
  W.add(cyl(0.08, 0.12, 2.1, '#6b4430', {x: SX, y: 1.1, z: 1.4}), box(1.0, 0.1, 1.0, '#6b4430', {x: SX, y: 0.1, z: 1.4}));
  const beam = box(1.4, 0.08, 0.1, '#c9a24a', {thick: 0.01}); beam.position.set(SX, 2.1, 1.4); W.add(beam);
  const panL = new THREE.Group(), panR = new THREE.Group();
  panL.add(cyl(0.6, 0.6, 0.06, '#c9a24a', {seg: 16, thick: 0.01})); panR.add(cyl(0.6, 0.6, 0.06, '#c9a24a', {seg: 16, thick: 0.01}));
  const sv = vac('#c43d32', 0.8); sv.position.y = 0.05; panL.add(sv);
  const tagS = sg('ABOUT £120', 1.4, 0.5, {bg: '#f2e6cc', font: 'bold 80px Arial'}); tagS.position.set(0.1, 1.65, 0.3); panL.add(tagS);
  for (let i = 0; i < 9; i++) { const tk = ticket(); tk.position.set(((i % 3) - 1) * 0.28, 0.07 + Math.floor(i / 3) * 0.06 , (Math.floor(i / 3) - 1) * 0.12); tk.rotation.y = i * 0.7; panR.add(tk); }
  W.add(panL, panR);
  const wire = () => cyl(0.01, 0.01, 0.6, '#2b2b2e', {seg: 4, thick: 0.002}); const wL = wire(), wR = wire(); W.add(wL, wR);
  lamps(A, 4.6, [-3, 3]);
  mk('clerk', 'none', 51, A - 3.4, 0.05, -1.0, true); const acc2 = mk('official', 'none', 52, A + 5.8, 0.05, -1.1);

  // ======== BOARDROOM (then, fall, sold) ========
  const B = LOC.board;
  W.add(room(B, {w: 18, h: 6, d: 11, wall: '#b9a98a', floor: '#6b4a36', seed: 33}));
  const table = box(9, 0.15, 2.6, '#5a3a26', {x: B, y: 1.0, z: 0.4, thick: 0.03}); W.add(table);
  for (const x of [-4, 4]) W.add(box(0.3, 1.0, 2.2, '#3f2a1d', {x: B + x, y: 0.5, z: 0.4}));
  for (let i = 0; i < 5; i++) W.add(P.at(P.chair('#3e5a7a'), B - 3.4 + i * 1.7, 0.05, 2.2, Math.PI));
  for (let i = 0; i < 3; i++) { W.add(P.at(P.chair('#7a3b33'), B - 3.0 + i * 1.6, 0.05, -1.6, 0)); W.add(box(0.5, 0.12, 0.2, '#d8c9a8', {x: B - 3.0 + i * 1.6, y: 1.1, z: -0.5, thick: 0.01})); }
  const flag = flagUS(); flag.position.set(B - 6.5, 3.0, -5.3); W.add(flag);
  const may = sg('MAYTAG', 2.6, 0.7, {bg: '#2e3f6b', fg: '#f4ead4', font: 'bold 82px Arial'}); may.position.set(B - 2.8, 4.6, -5.4); W.add(may);
  const pC = document.createElement('canvas'); pC.width = 500; pC.height = 420; const pg = pC.getContext('2d');
  const pT = new THREE.CanvasTexture(pC); pT.colorSpace = THREE.SRGBColorSpace;
  const drawPie = (share) => {
    pg.fillStyle = '#f4ead4'; pg.fillRect(0, 0, 500, 420); pg.strokeStyle = INK; pg.lineWidth = 8; pg.strokeRect(4, 4, 492, 412);
    pg.fillStyle = INK; pg.font = 'bold 40px Arial'; pg.textAlign = 'center'; pg.fillText('MARKET SHARE', 250, 56);
    const a0 = -Math.PI / 2, a1 = a0 + share * Math.PI * 2;
    pg.fillStyle = '#9aa5ad'; pg.beginPath(); pg.moveTo(250, 235); pg.arc(250, 235, 140, a1, a0 + Math.PI * 2); pg.closePath(); pg.fill(); pg.stroke();
    pg.fillStyle = '#e0533d'; pg.beginPath(); pg.moveTo(250, 235); pg.arc(250, 235, 140, a0, a1); pg.closePath(); pg.fill(); pg.stroke();
    pg.fillStyle = INK; pg.font = 'bold 28px Arial'; pg.fillText('HOOVER', 250, 405); pT.needsUpdate = true;
  };
  drawPie(0.5);
  const pie = box(3.4, 2.9, 0.12, '#ffffff'); pie.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: pT}), toon('#4a3a2e')]; pie.position.set(B - 0.5, 3.3, -5.35); W.add(pie);
  const mC = document.createElement('canvas'); mC.width = 520; mC.height = 420; const mg = mC.getContext('2d');
  mg.fillStyle = '#7fb3cf'; mg.fillRect(0, 0, 520, 420); mg.strokeStyle = INK; mg.lineWidth = 6; mg.fillStyle = '#e8dcb8';
  mg.beginPath(); mg.moveTo(90, 330); mg.lineTo(120, 220); mg.lineTo(190, 150); mg.lineTo(250, 70); mg.lineTo(330, 90); mg.lineTo(400, 60); mg.lineTo(440, 150); mg.lineTo(390, 220); mg.lineTo(430, 300); mg.lineTo(340, 330); mg.lineTo(250, 290); mg.lineTo(170, 350); mg.closePath(); mg.fill(); mg.stroke();
  mg.fillStyle = INK; mg.font = 'bold 44px Arial'; mg.textAlign = 'center'; mg.fillText('EUROPE', 270, 220);
  const mT = new THREE.CanvasTexture(mC); mT.colorSpace = THREE.SRGBColorSpace;
  const emap = box(4.0, 3.2, 0.12, '#ffffff'); emap.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: mT}), toon('#4a3a2e')]; emap.position.set(B + 3.9, 3.2, -5.35); W.add(emap);
  const soldS = sg('SOLD', 2.8, 1.0, {bg: '#e0533d', fg: '#fff4dc', font: 'bold 130px Arial'}); soldS.position.set(B + 3.9, 3.2, -5.2); soldS.rotation.z = -0.25; W.add(soldS);
  W.add(P.at(P.bookshelf(31), B - 8.0, 0.05, -2.0, Math.PI / 2), P.at(P.wallClock(), B + 7, 4.5, -5.4), P.at(P.filingCabinet('#8f7d6a'), B + 7.8, 0.05, -4.9));
  W.add(P.at(P.papers(6, 3), B + 1.0, 1.1, 0.6), P.at(P.mug('#2f6db3'), B - 1.2, 1.1, 1.0), P.at(P.mug(), B + 2.6, 1.1, 0.2));
  lamps(B, 5.0, [-4, 4]);
  const boss = mk('official', 'none', 61, B + 5.2, 0.05, 0.4, true);
  const out3 = [mk('navy', 'none', 62, B - 3.0, 0.05, -0.9), mk('teal', 'bowler', 63, B - 1.4, 0.05, -0.9), mk('mustard', 'none', 64, B + 0.2, 0.05, -0.9)];
  const hs1 = mk('engineer', 'bowler', 65, B + 2.9, 0.05, -2.9, true), hs2 = mk('red', 'none', 66, B + 4.5, 0.05, -2.9);
  boss.visible = true;
  const mayN = sg('MAYTAG', 0.7, 0.22, {bg: '#2e3f6b', fg: '#fff', font: 'bold 70px Arial'}); mayN.position.set(B + 3.3, 1.15, 1.6); W.add(mayN);
  const canN = sg('CANDY', 0.7, 0.22, {bg: '#d77a9c', fg: '#fff', font: 'bold 70px Arial'}); canN.position.set(B + 4.3, 1.15, 1.6); W.add(canN);

  // ======== FACTORY (close) ========
  const F = LOC.fact;
  W.add(room(F, {w: 26, h: 9, d: 18, wall: '#6f7c86', floor: '#4f4d58', seed: 41}));
  const stage = cyl(1.7, 1.9, 0.3, '#f4ead4', {x: F, y: 0.2, z: -1, seg: 24}); W.add(stage);
  const hv = vac('#c43d32', 2.6); hv.position.set(F, 0.35, -1); W.add(hv);
  const ft = [ticket(), ticket()]; ft.forEach((t) => { t.scale.setScalar(3.4); W.add(t); });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 0.5, 8, 24, 1, true), new THREE.MeshBasicMaterial({color: '#fff3c4', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide})); cone.position.set(F, 4.3, -1); W.add(cone);
  [-5, 5].forEach((z, k) => { for (const x of [-9, -4, 4, 9]) W.add(box(5, 0.5, 1.2, '#3a3a40', {x: F + x, y: 0.5, z: -3 + z * 0.45 * (k ? 1 : 1)})); });
  for (const x of [-11, -6, 6, 11]) W.add(cyl(0.3, 0.3, 8.8, '#4a4f58', {x: F + x, y: 4.4, z: -6, seg: 10}));
  W.add(sg('HOOVER', 4, 0.9, {bg: '#4a4f58', fg: '#cfd4da', font: 'bold 100px Arial'}).translateX(F).translateY(6.2).translateZ(-8.8));
  for (let i = 0; i < 5; i++) W.add(P.at(P.pallet(), F - 9 + i * 4.5, 0.05, 6.5));
  mk('official', 'none', 71, F + 7.5, 0.05, 3.5);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // hook: ticket in box + jet crossing
    const k = ease(t, 0, 2.4); jet.visible = shot === 'hook'; jet.position.x = S - 7 + 14 * k;
    // offer: price turns into two tickets + globe
    const oT = wordT('offer', 4), oE = ease(t, oT, oT + 0.5);
    price.visible = shot !== 'offer' || t <= oT;
    const showT = shot === 'offer' && t > oT;
    ts.forEach((tk, i) => { tk.visible = showT; tk.position.set(S + 0.2 + i * 1.3, 2.0 + Math.sin(t * 3 + i) * 0.08, 1.4); tk.rotation.y = t * 1.5 + i; tk.scale.setScalar(Math.max(0.01, 1.8 * oE)); });
    globe.visible = eu.visible = showT; globe.rotation.y = t * 1.2;
    // usa: tickets fly to New York / Florida
    usT.forEach((tk, i) => {
      const toNY = i < 4, w0 = toNY ? wordT('usa', 4 + i * 0.3) : wordT('usa', 7.6 + (i - 4) * 0.3), w1 = w0 + 1.1;
      const p = ease(t, w0, w1); tk.visible = shot === 'usa' && t > w0 - 0.05 && p < 0.999;
      const dst = toNY ? [H - 6.5 + i * 0.5, 3.4 + i * 0.3, -4.8] : [H + 6.5 + (i - 4) * 0.6, 3.4 + (i - 4) * 0.3, -4.8];
      tk.position.set(H + (dst[0] - H) * p, 1.8 + (dst[1] - 1.8) * p + Math.sin(p * Math.PI) * 1.2, -1.2 + (dst[2] + 1.2) * p); tk.rotation.set(0.3, t * 3 + i, 0.2);
    });
    // so: sign swap + ringing phones
    exp.visible = shot === 'so' && t < wordT('so', 10) && t > wordT('so', 5) - 0.1;
    came.visible = shot === 'so' && t >= wordT('so', 10);
    phones.forEach((ph, i) => { ph.position.y = 1.15 + (shot === 'so' ? Math.abs(Math.sin(t * 14 + i)) * 0.05 : 0); });
    const th = 0.28 * ease(t, wordT('but', 12), wordT('but', 16)) * (shot === 'but' ? 1 : 0) + (shot === 'but' ? 0 : 0);
    beam.rotation.z = th;
    const eL = [SX - 1.3 * Math.cos(th), 2.1 + 1.3 * Math.sin(th)], eR = [SX + 1.3 * Math.cos(th), 2.1 - 1.3 * Math.sin(th)];
    panL.position.set(eL[0], eL[1] - 0.65, 1.4); panR.position.set(eR[0], eR[1] - 0.65, 1.4); wL.position.set(eL[0], eL[1] - 0.3, 1.4); wR.position.set(eR[0], eR[1] - 0.3, 1.4);
    // ladder: bars + tape + sign
    const sa = ease(t, wordT('ladder', 0), wordT('ladder', 4)), tb = ease(t, wordT('ladder', 2), wordT('ladder', 9));
    if (shot === 'ladder') drawBars(sa * 0.55 + 0.02, tb);
    const tp = 0.1 + 2.2 * ease(t, wordT('ladder', 1), wordT('ladder', 12)); tape.scale.y = tp; tape.position.y = 1.2 - tp / 2 + 0.5 * 0; tape.position.y = 1.15 - tp / 2;
    tens.visible = t > wordT('ladder', 12); tens.scale.setScalar(Math.max(0.001, ease(t, wordT('ladder', 12), wordT('ladder', 12) + 0.4)));
    // then: three bosses vanish on "lost their jobs"
    out3.forEach((c) => { c.visible = (shot === 'then' && t <= wordT('then', 10)); });
    // fall: pie shrinks
    if (shot === 'fall') drawPie(0.5 - 0.27 * ease(t, wordT('fall', 9), wordT('fall', 12)));
    // sold: stamp + handshake
    soldS.visible = shot === 'sold' && t > wordT('sold', 4); soldS.scale.setScalar(Math.max(0.001, ease(t, wordT('sold', 4), wordT('sold', 4) + 0.25)) * 1.0);
    const hsOn = shot === 'sold' && t > wordT('sold', 0);
    hs1.position.x = B + (shot === 'sold' ? 3.0 : 2.9); hs2.position.x = B + (shot === 'sold' ? 3.9 : 4.5);
    hs1.userData.armR.rotation.z = hsOn ? 1.5 : 0; hs2.userData.armL && (hs2.userData.armL.rotation.z = hsOn ? -1.5 : 0); hs2.userData.armR.rotation.z = hsOn ? -1.5 : 0;
    boss.visible = shot !== 'sold'; hs1.visible = hs2.visible = shot === 'sold' || shot === 'then';
    // close: tickets orbit over the vacuum
    ft.forEach((tk, i) => { tk.visible = shot === 'close'; const a = t * 1.4 + i * Math.PI; tk.position.set(F + Math.cos(a) * 1.4, 3.6 + Math.sin(t * 2 + i) * 0.15, -1 + Math.sin(a) * 1.4); tk.rotation.y = -a; });
    hv.rotation.y = t * 0.6;
    crowdG.visible = shot !== 'usa'; vbox.visible = shot === 'hook' || shot === 'offer';
    cust.userData.armR.rotation.z = shot === 'offer' ? 1.9 : 0;
  };
  return {group: W, update};
}
