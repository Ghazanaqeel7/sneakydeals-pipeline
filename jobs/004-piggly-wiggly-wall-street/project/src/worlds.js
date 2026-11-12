import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, facade, ground, sidewalk, cloud, paintTex, ink, lampPost} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';
import * as Q from './pudding-props.js';
import * as G from './pig-props.js';

export const LOC = {pw: 0, general: 200, office: 300, patent: 400, floor: 500, bank: 600, modern: 700, wall: 1500, memphis: 1800, exch: 2100};

export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const pop = (o, t, t0, d = 0.35, s = 1) => { o.scale.setScalar(Math.max(0.001, ease(t, t0, t0 + d) * (1 + 0.12 * Math.sin(Math.min(1, (t - t0) / d) * Math.PI)) * s)); return t >= t0; };
const big = (txt, w, h, bg, fg = INK, o = {}) => sign(txt, w, h, {bg, fg, w: Math.round(w * 200), h: Math.round(h * 200), font: 'bold 140px Arial, sans-serif', ...o});

function room(ox, {w = 14, h = 5, d = 10, wall = '#efe0c4', floor = '#a7764e', seed = 4, tiles = false} = {}) {
  const g = new THREE.Group();
  const wt = paintTex(wall, {seed, stains: 14}); wt.repeat.set(2, 1);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon('#ffffff', wt, {side: THREE.BackSide}));
  walls.position.set(ox, h / 2, 0); walls.receiveShadow = true; g.add(walls);
  const ft = paintTex(floor, {seed: seed + 1, stripes: (gg, W, H) => { gg.strokeStyle = tiles ? 'rgba(80,80,90,0.35)' : 'rgba(60,30,15,0.35)'; gg.lineWidth = 2; for (let i = 0; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); if (tiles) { gg.beginPath(); gg.moveTo(i * W / 10, 0); gg.lineTo(i * W / 10, H); gg.stroke(); } } }});
  ft.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.1, d - 0.02), toon('#ffffff', ft)); fl.position.set(ox, 0.0, 0); fl.receiveShadow = true; g.add(fl);
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  return g;
}
const hang = (W, x, z, y = 4.6) => {
  W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: y + 0.4, z})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y, z, seg: 14}));
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, y - 0.15, z); W.add(b);
};
const tube = (W, x, z, y, len = 3) => { W.add(box(len, 0.1, 0.35, '#d9d2c2', {x, y: y + 0.06, z, thick: 0.01})); const b = new THREE.Mesh(new THREE.BoxGeometry(len - 0.2, 0.06, 0.2), new THREE.MeshBasicMaterial({color: '#fff6dc'})); b.position.set(x, y, z); W.add(b); };
const potPlant = (x, z) => { const p = new THREE.Group(); p.add(cyl(0.3, 0.24, 0.6, '#b35a3a', {y: 0.3})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.26, 0.8 + (i % 3) * 0.22, Math.sin(i) * 0.26); ink(l, 0.02, false); p.add(l); } p.position.set(x, 0.05, z); return p; };
const sack = (x, z, c = '#d9c49a') => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), toon(c)); s.scale.set(1, 1.3, 0.85); s.position.set(x, 0.4, z); ink(s, 0.015, false); return s; };
const arrow3 = (c, up) => { const a = new THREE.Group(); a.add(box(0.35, 1.2, 0.1, c, {y: up ? 0 : 0.2, thick: 0.02})); const h = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 3), toon(c)); h.position.y = up ? 0.9 : -0.7; if (!up) h.rotation.z = Math.PI; ink(h, 0.02, true); a.add(h); return a; };

// old-time street: facades both sides, road, sidewalks (people stand at y 0.25)
function street(ox, seed = 1, {skip = []} = {}) {
  const g = new THREE.Group();
  g.add(ground(260, 200, '#9c958a', {x: ox, z: -30, seed: seed + 2, repeat: 20}));
  const road = new THREE.Mesh(new THREE.BoxGeometry(260, 0.05, 9), toon('#7a6f66')); road.position.set(ox, 0.03, 12); g.add(road);
  g.add(sidewalk(260, {x: ox, z: 5.5, w: 4})); g.add(sidewalk(260, {x: ox, z: 18.5, w: 4}));
  const cols = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
  const r = rng(seed);
  for (let i = -6; i <= 6; i++) {
    if (skip.includes(i)) continue;
    const w = 10, h = 9 + r() * 8;
    const f = facade({w, h, color: cols[(i + 6) % cols.length], cols: 3, rows: Math.floor(h / 3.6), seed: seed + i * 7, door: false}); f.position.set(ox + i * 10, 0, 3); g.add(f);
    g.add(box(w, h, 6, '#8f6c5e', {x: ox + i * 10, y: h / 2, z: -0.1, thick: 0.03}));
  }
  for (let i = -6; i <= 6; i++) { const f = facade({w: 10, h: 10 + (i % 3) * 3, color: cols[(i + 9) % 6], cols: 3, rows: 3, seed: seed + 90 + i}); f.position.set(ox + i * 10, 0, 21.5); f.rotation.y = Math.PI; g.add(f); }
  for (let i = 0; i < 7; i++) g.add(cloud(ox - 80 + i * 28, 55 + (i % 3) * 8, -150, 7));
  return g;
}
// simplified outline of the lower 48 states (x 0..1 left->right, y 0..1 top->down)
const USA = [[0.03, 0.12], [0.12, 0.1], [0.3, 0.12], [0.5, 0.14], [0.6, 0.12], [0.66, 0.18], [0.72, 0.22], [0.78, 0.18], [0.86, 0.1], [0.95, 0.06], [0.97, 0.14], [0.9, 0.28], [0.88, 0.4], [0.83, 0.52], [0.8, 0.62], [0.83, 0.8], [0.79, 0.86], [0.74, 0.7], [0.66, 0.7], [0.58, 0.74], [0.52, 0.8], [0.47, 0.95], [0.41, 0.84], [0.36, 0.76], [0.28, 0.74], [0.18, 0.66], [0.1, 0.6], [0.05, 0.45], [0.02, 0.3]];
const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const PINS = (() => { const r = rng(1916); const out = [[0.62, 0.62]]; while (out.length < 160) { const x = r() * (r() > 0.4 ? 0.55 : 1) + (r() > 0.4 ? 0.42 : 0), y = r(); if (x < 1 && inPoly(x, y, USA)) out.push([x, y]); } return out; })();

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const person = (pal, hat, x, y, z, seed, extra = {}) => { const c = character({palette: pal, hat, seed, ...extra}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };
  const shown = [];
  const only = (o, ...keys) => { shown.push([o, keys]); return o; };
  // the grocer: generic cartoon stand-in, not a likeness
  const hero = (x, y, z, seed = 7) => person('trench', 'bowler', x, y, z, seed);
  const TRADERS = [['navy', 'top'], ['suit', 'bowler'], ['official', 'fedora'], ['clerk', 'bowler'], ['denim', 'top'], ['suit', 'fedora'], ['navy', 'bowler'], ['official', 'top']];
  const trader = (i, x, y, z) => { const [p, h] = TRADERS[i % TRADERS.length]; return person(p, h, x, y, z, 300 + i, {glasses: i % 3 === 0}); };

  // ======================= WALL STREET (hook) =======================
  const WS = LOC.wall;
  W.add(street(WS, 41));
  const pwFront = P.shopFront('', '#c98f6b', 1); pwFront.position.set(WS - 1.2, 0, 3.5); W.add(pwFront);
  const stand = new THREE.Group(); stand.add(box(1.4, 0.06, 0.8, '#8a5a3b', {y: 0.9, thick: 0.008})); for (const x of [-0.6, 0.6]) for (const z of [-0.3, 0.3]) stand.add(box(0.06, 0.9, 0.06, '#5a3a26', {x, y: 0.45, z, thick: 0.004}));
  stand.position.set(WS - 1.6, 0.25, 5.0); W.add(stand);
  const standS = big('PIGGLY WIGGLY', 1.3, 0.3, '#c43d32', '#ffffff'); standS.position.set(WS - 1.6, 2.2, 3.75); W.add(standS);
  const hookBasket = G.fullBasket(1.5, 3); hookBasket.position.set(WS - 1.6, 1.21, 5.0); W.add(hookBasket);
  W.add(P.at(G.fullBasket(1.1, 5), WS - 2.1, 1.21, 4.8, 0.4));
  const hookMan = hero(WS - 0.3, 0.25, 5.3, 7);
  const crates = [0, 1, 2, 3, 4].map((i) => { const c = G.moneyCrate('$10,000,000', 0.95); c.position.set(WS + 1.4 + (i % 3) * 1.05, 0.25 + Math.floor(i / 3) * 0.88, 5.2 - Math.floor(i / 3) * 0.1); W.add(c); only(c, 'hook'); return c; });
  const ticker = Q.board(9, 2.0, 1800, 400); ticker.position.set(WS + 3.5, 5.7, 3.45); W.add(ticker);
  const wst = big('WALL ST', 1.8, 0.45, '#2f6b4a', '#ffffff'); wst.position.set(WS + 6.4, 3.3, 7.0); W.add(wst); W.add(cyl(0.06, 0.06, 3.3, '#2c3a3b', {x: WS + 6.4, y: 1.65, z: 7.0, seg: 8}));
  for (let i = 0; i < 6; i++) trader(i, WS - 8 + i * 2.8 + (i > 2 ? 4 : 0), 0.25, 5.6 + (i % 2) * 1.1);
  const hookCars = [G.oldCar('#2b2b30'), G.oldCar('#3a2a22'), G.oldCar('#2a3a4a')]; hookCars.forEach((c) => W.add(c));
  for (const x of [-25, -15, 15, 25]) W.add(lampPost(WS + x, 7.3, 5));
  W.add(P.at(P.hydrant(), WS - 5, 0.25, 7.1), P.at(P.newsBox(), WS + 0.9, 0.25, 6.9));

  // ======================= MEMPHIS 1916 (yousee) =======================
  const MP = LOC.memphis;
  W.add(street(MP, 57));
  const mFront = P.shopFront('', '#d1a47a', 2); mFront.position.set(MP, 0, 3.5); W.add(mFront);
  const pwSign = big('PIGGLY WIGGLY', 5.2, 0.85, '#c43d32', '#ffffff', {font: 'bold 110px Georgia, serif'}); pwSign.position.set(MP, 3.85, 3.9); W.add(pwSign);
  const grand = big('GRAND OPENING', 4.0, 0.6, '#f2c12e', '#c43d32'); grand.position.set(MP, 5.1, 3.7); W.add(grand); only(grand, 'yousee');
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 3), toon(['#c43d32', '#f2c12e', '#2f6db3'][i % 3])); f.rotation.x = Math.PI; f.position.set(MP - 3.4 + i * 0.85, 4.55 - Math.sin(i / 8 * Math.PI) * 0.25, 4.0); W.add(f); }
  const memSign = big('MEMPHIS · 1916', 2.2, 0.5, '#2f6b4a', '#ffffff'); memSign.position.set(MP + 3.8, 3.0, 7.0); W.add(memSign); only(memSign, 'yousee');
  W.add(cyl(0.06, 0.06, 3.0, '#2c3a3b', {x: MP + 3.8, y: 1.5, z: 7.0, seg: 8}));
  const youMan = hero(MP - 0.9, 0.25, 5.5, 8);
  const queue = [['pink', 'none'], ['mustard', 'straw'], ['teal', 'none'], ['red', 'bowler'], ['navy', 'top'], ['student', 'cap']].map(([p, h], i) => person(p, h, MP + 0.8 + i * 0.85, 0.25, 4.8 + (i % 2) * 0.6, 60 + i));
  const mCars = [G.oldCar('#2b2b30', 1), G.oldCar('#5a2a22', 2)]; mCars.forEach((c) => W.add(c));
  W.add(P.at(G.oldCar('#2a3a4a', 3), MP - 9, 0, 9.4), P.at(G.oldCar('#3a3a2a', 4), MP + 11, 0, 14.6, Math.PI));
  for (const x of [-25, -15, 15, 25]) W.add(lampPost(MP + x, 7.3, 5));
  for (const x of [-30, -21, -12, 12, 21, 30]) W.add(P.at(P.tree(1.0, 70 + Math.abs(x)), MP + x, 0.25, 7.3));
  W.add(P.at(G.woodBasket(1.2), MP - 2.4, 0.25, 4.6), P.at(P.barrel('#8a5a3b'), MP - 3.2, 0.25, 4.4), sack(MP - 3.9 + 0, 4.5).translateY(0.2));
  person('clerk', 'none', MP - 5.5, 0.25, 6.0, 69); person('red', 'straw', MP - 7.0, 0.25, 5.2, 70);

  // ======================= GENERAL STORE, before (before) =======================
  const GS = LOC.general;
  W.add(room(GS, {w: 14, h: 5, d: 10, wall: '#a9d2cf', floor: '#a7764e', seed: 21}));
  hang(W, GS - 2.5, -0.5, 4.2); hang(W, GS + 2.5, -0.5, 4.2);
  for (let i = 0; i < 4; i++) W.add(P.at(G.oldShelf(3, 30 + i, 3.6, 6), GS - 4.5 + i * 3, 0.05, -4.55));
  const gsCounter = G.counter(8); gsCounter.position.set(GS, 0.05, -2.2); W.add(gsCounter);
  W.add(P.at(G.register(), GS - 2.6, 1.1, -2.2));
  const gsLadder = P.ladder(3.2); gsLadder.position.set(GS + 1.5, 0.05, -3.95); gsLadder.rotation.x = -0.12; W.add(gsLadder);
  const climber = person('clerk', 'cap', GS + 1.5, 0.05, -3.6, 22);
  const gsClerk = person('teal', 'none', GS - 0.6, 0.05, -3.0, 23);
  const buyer = person('pink', 'none', GS - 0.6, 0.05, -1.3, 24);
  const list = big('LIST', 0.25, 0.32, '#f7f0de', INK, {font: 'bold 60px Arial'}); list.position.set(0.12, -0.45, 0.08); buyer.userData.armR.add(list);
  const bored = [['mustard', 'straw', -2.2, -0.5], ['navy', 'bowler', -3.3, 0.3], ['red', 'none', -4.4, 1.0], ['student', 'cap', -5.4, 1.7]].map(([p, h, x, z], i) => person(p, h, GS + x, 0.05, z, 25 + i));
  const gsSign = big('GENERAL STORE', 3.4, 0.6, '#6b4430', '#f4e3bf'); gsSign.position.set(GS - 3.0, 4.45, -4.9); W.add(gsSign);
  const waitS = big('PLEASE WAIT', 1.3, 0.4, '#c43d32', '#ffffff'); waitS.position.set(GS + 2.4, 1.35, -1.85); W.add(waitS); only(waitS, 'before');
  W.add(P.at(P.wallClock(), GS + 4.8, 4.2, -4.92), P.at(P.barrel('#8a5a3b'), GS + 5.6, 0.05, -1.0), P.at(P.barrel('#7a4f2e'), GS + 6.2, 0.05, 0.0), sack(GS + 4.8, -0.6), sack(GS + 5.2, 0.4, '#cbb68a'));
  W.add(P.at(P.papers(4, 3), GS + 0.5, 1.1, -2.2), sack(GS - 6.2, -1.2), P.at(P.chair(), GS - 5.8, 0.05, 2.6, 0.8));

  // ======================= PIGGLY WIGGLY STORE (turnstile, price) =======================
  const PW = LOC.pw;
  W.add(room(PW, {w: 22, h: 5.2, d: 14, wall: '#cfe6e0', floor: '#b98a5a', seed: 11}));
  for (const x of [-7, -2, 3, 8]) for (const z of [-3, 2]) hang(W, PW + x, z, 4.5);
  const pwBanner = big('PIGGLY WIGGLY', 4.6, 0.8, '#c43d32', '#ffffff', {font: 'bold 110px Georgia, serif'}); pwBanner.position.set(PW - 4.0, 4.3, -6.88); W.add(pwBanner);
  const selfS = big('SERVE YOURSELF', 3.0, 0.55, '#f2c12e', '#6b2a1f'); selfS.position.set(PW + 2.6, 4.3, -6.88); W.add(selfS);
  const ts = G.turnstile(); ts.position.set(PW - 6.0, 0.05, 2.2); W.add(ts);
  const entS = big('ENTRANCE', 1.4, 0.4, '#2f6b4a', '#ffffff'); entS.position.set(PW - 6.4, 2.6, 1.0); W.add(entS); W.add(cyl(0.04, 0.04, 2.6, '#5a3a26', {x: PW - 6.4, y: 1.3, z: 0.95, seg: 8}));
  const bTable = Q.longTable(1.4, '#8a5a3b'); bTable.position.set(PW - 8.2, 0.05, 0.4); W.add(bTable);
  for (let i = 0; i < 4; i++) W.add(P.at(G.woodBasket(1), PW - 8.2, 0.86 + i * 0.12, 0.4, i * 0.15));
  const tsMan = person('pink', 'none', PW - 7.4, 0.05, 2.8, 12);
  const tsBasket = G.woodBasket(0.9); tsBasket.position.set(0.1, -0.62, 0.12); tsMan.userData.armR.add(tsBasket);
  // winding aisle of open shelves
  for (let i = 0; i < 3; i++) W.add(P.at(G.oldShelf(3, 40 + i, 2.3), PW - 4.0 + i * 3.05, 0.05, -1.0));
  for (let i = 0; i < 3; i++) { const s = G.oldShelf(3, 50 + i, 2.3); s.position.set(PW - 4.0 + i * 3.05, 0.05, -3.4); s.rotation.y = Math.PI; W.add(s); }
  for (let i = 0; i < 6; i++) W.add(P.at(G.oldShelf(3, 60 + i, 2.6), PW - 9.0 + i * 3.05, 0.05, -6.55));
  const pickers = [person('mustard', 'straw', PW - 2.8, 0.05, -0.1, 13), person('teal', 'none', PW - 0.2, 0.05, 0.1, 14), person('red', 'bowler', PW - 5.4, 0.05, -2.3, 15)];
  pickers.forEach((c, i) => { const b = G.fullBasket(0.8, i + 9); b.position.set(-0.12, -0.6, 0.12); c.userData.armL.add(b); });
  // price shelf + checkout at the front
  const priceShelf = G.oldShelf(3, 70, 2.3); priceShelf.position.set(PW + 3.4, 0.05, -3.4); W.add(priceShelf);
  W.add(P.at(G.oldShelf(3, 71, 2.3), PW + 6.45, 0.05, -3.4));
  const tags = ['5¢', '10¢', '8¢', '15¢', '12¢', '6¢'].map((s, i) => { const tg = G.priceTag(s); tg.position.set(PW + 2.3 + (i % 3) * 1.1, 0.72 + Math.floor(i / 3) * 0.56, -3.02); W.add(tg); only(tg, 'price'); return tg; });
  const coCounter = G.counter(2.6, '#8a5a3b'); coCounter.position.set(PW + 7.4, 0.05, 0.6); coCounter.rotation.y = -0.3; W.add(coCounter);
  const reg = G.register(); reg.position.set(PW + 7.8, 1.1, 0.5); reg.rotation.y = -0.3; W.add(reg);
  const payS = big('PAY HERE', 1.3, 0.42, '#2f6b4a', '#ffffff'); payS.position.set(PW + 7.4, 2.6, 0.2); payS.rotation.y = -0.3; W.add(payS);
  W.add(cyl(0.04, 0.04, 1.5, '#5a3a26', {x: PW + 7.4, y: 1.85, z: 0.15, seg: 8}));
  const cashier = person('clerk', 'cap', PW + 7.6, 0.05, -0.3, 16);
  const payer = person('navy', 'bowler', PW + 6.2, 0.05, 0.6, 17);
  W.add(P.at(G.fullBasket(1, 4), PW + 6.9, 1.1, 0.9));
  W.add(sack(PW + 9.6, -1.5), sack(PW + 9.9, -0.6, '#cbb68a'), P.at(P.barrel('#8a5a3b'), PW + 9.4, 0.05, 1.6), P.at(P.wallClock(), PW + 9.0, 3.6, -6.92), potPlant(PW - 10.0, 5.0));

  // ======================= PATENT OFFICE + MAP (ladder) =======================
  const PT = LOC.patent;
  W.add(room(PT, {w: 14, h: 4.8, d: 10, wall: '#c6d4ea', floor: '#8a5a3b', seed: 41}));
  hang(W, PT - 2.5, -0.8, 4.2); hang(W, PT + 2.5, -0.8, 4.2);
  const pDesk = P.desk(2.2, '#6b4430'); pDesk.position.set(PT - 2.6, 0.05, -1.0); W.add(pDesk);
  const doc = big('PATENT', 0.7, 0.9, '#f7f0de', '#2f3a4a', {font: 'bold 70px Georgia, serif'}); doc.position.set(PT - 2.6, 1.07, -0.85); doc.rotation.x = -Math.PI / 2; W.add(doc);
  const pStamp = G.stamp(); pStamp.position.set(PT - 2.6, 1.08, -0.85); W.add(pStamp);
  const stampMark = big('PATENTED', 0.62, 0.2, '#ffffff', '#c43d32', {font: 'bold 70px Arial'}); stampMark.position.set(PT - 2.6, 1.09, -0.95); stampMark.rotation.set(-Math.PI / 2, 0, 0.2); W.add(stampMark); only(stampMark, 'ladder');
  const ptMan = hero(PT - 3.4, 0.05, -1.9, 9);
  const official = person('official', 'none', PT - 1.6, 0.05, -2.0, 42, {glasses: true});
  const map = Q.board(5.0, 3.0, 1000, 600, '#6b4430'); map.position.set(PT + 1.7, 2.55, -4.88); W.add(map);
  const y22 = big('1922', 1.1, 0.5, '#f2e6cc'); y22.position.set(PT + 1.7, 4.4, -4.85); W.add(y22); only(y22, 'ladder');
  const k1200 = big('1,200+ STORES', 2.6, 0.6, '#c43d32', '#ffffff'); k1200.position.set(PT + 1.7, 1.25, -4.7); W.add(k1200); only(k1200, 'ladder');
  W.add(P.at(P.bookshelf(5, 2.2, 2.6), PT - 5.6, 0.05, -4.6), P.at(P.filingCabinet(), PT + 5.4, 0.05, -4.4), P.at(P.filingCabinet('#8f7d6a'), PT + 6.2, 0.05, -4.4), P.at(P.papers(6, 9), PT - 1.9, 1.07, -1.1), P.at(P.deskLamp(), PT - 3.4, 1.07, -1.3));
  W.add(P.at(P.poster('IDEAS', 1.0, 1.3, '#e6d39a'), PT - 3.6, 2.8, -4.92), P.at(P.wallClock(), PT - 1.4, 3.7, -4.92), potPlant(PT + 6.0, 1.6), P.at(P.chair(), PT - 3.2, 0.05, -1.5, Math.PI));
  person('clerk', 'none', PT + 4.6, 0.05, -2.6, 43);

  // ======================= TRADING FLOOR (but, spike, traders) =======================
  const TF = LOC.floor;
  W.add(room(TF, {w: 22, h: 6, d: 14, wall: '#bcd0d8', floor: '#8a5a3b', seed: 51}));
  for (const x of [-7, -2.5, 2.5, 7]) for (const z of [-3, 2]) hang(W, TF + x, z, 5.3);
  const cboard = Q.board(9, 3.2, 1350, 480, '#5a3a26'); cboard.position.set(TF, 3.6, -6.88); W.add(cboard);
  const downA = arrow3('#d23a2e', false); downA.position.set(TF + 3.0, 3.6, -6.6); W.add(downA); only(downA, 'but');
  const upA = arrow3('#3f9a4a', true); upA.position.set(TF + 1.75, 3.0, -6.6); W.add(upA); only(upA, 'none');
  const tape = G.tickerTape(46, 5, 7, 4.5); tape.position.set(TF, 0, -4.2); W.add(tape); only(tape, 'spike');
  for (const [x, z] of [[4.2, -3.2], [-4.0, -3.4]]) { W.add(cyl(1.2, 1.2, 1.1, '#6b4430', {x: TF + x, y: 0.6, z, seg: 20, thick: 0.02})); W.add(cyl(1.3, 1.3, 0.08, '#8a5a3b', {x: TF + x, y: 1.18, z, seg: 20})); W.add(cyl(0.12, 0.12, 2.2, '#c9a24a', {x: TF + x, y: 2.2, z, seg: 8})); W.add(P.at(P.papers(5, 7), TF + x, 1.22, z + 0.6)); }
  for (const [x, z] of [[-2.2, -5.4], [2.2, -5.4], [6.8, -1.0], [-8.6, 0.6]]) W.add(P.at(G.tickerMachine(), TF + x, 0.05, z));
  const tradersA = [[2.8, -2.0], [5.6, -2.2], [4.4, -4.6], [3.0, -4.2], [6.2, -4.0], [-2.8, -2.4], [-5.2, -2.2], [-3.2, -4.8], [-1.6, -5.8], [1.4, -6.0], [7.6, -2.6], [8.4, -0.8]].map(([x, z], i) => trader(i, TF + x, 0.05, z));
  const heroDesk = P.desk(2.4, '#6b4430'); heroDesk.position.set(TF - 6.6, 0.05, -3.0); W.add(heroDesk);
  const pile = G.certStack(70, 0.6, 0.42, 3); pile.position.set(TF - 7.45, 1.05, -2.8); pile.scale.set(1.3, 1.1, 1.3); W.add(pile);
  const pile2 = G.certStack(40, 0.6, 0.42, 4); pile2.position.set(TF - 5.75, 1.05, -2.9); pile2.scale.set(1.2, 1.3, 1.2); W.add(pile2);
  const trMan = hero(TF - 6.6, 0.05, -3.9, 10);
  const crowdT = [[-4.5, -3.4], [-4.8, -2.2], [-8.7, -3.3], [-8.5, -2.0], [-7.6, -4.6]].map(([x, z], i) => trader(i + 3, TF + x, 0.05, z));
  const buyS = [0, 1, 2].map((i) => { const b = big('BUY!', 0.6, 0.32, '#f2c12e', '#c43d32'); W.add(b); only(b, 'traders'); return b; });
  const hisS = big('HIS SHARES', 1.6, 0.4, '#3f8f4a', '#ffffff'); hisS.position.set(TF - 6.6, 2.75, -3.3); W.add(hisS); only(hisS, 'traders');
  W.add(P.at(P.wallClock(), TF + 7.0, 4.6, -6.92), P.at(P.wallClock(), TF - 7.0, 4.6, -6.92), potPlant(TF + 10, -6), potPlant(TF - 10, -6));
  for (let i = 0; i < 4; i++) W.add(P.at(P.papers(3, 20 + i), TF - 3 + i * 2, 0.06, 0.8 - i * 0.4));

  // ======================= BANK (so) =======================
  const BK = LOC.bank;
  W.add(room(BK, {w: 16, h: 5.5, d: 11, wall: '#e6dcc2', floor: '#6a8a8a', seed: 61, tiles: true}));
  hang(W, BK - 3, -1, 4.8); hang(W, BK + 3, -1, 4.8);
  const vault = G.vaultDoor(1.6); vault.position.set(BK + 3.6, 2.1, -5.25); W.add(vault);
  W.add(box(4.2, 4.2, 0.2, '#8a949a', {x: BK + 3.6, y: 2.1, z: -5.4, thick: 0.02}));
  const bankS = big('BANK', 1.8, 0.55, '#2f3a4a', '#f2e6cc', {font: 'bold 120px Georgia, serif'}); bankS.position.set(BK - 3.4, 4.6, -5.38); W.add(bankS);
  const tCounter = G.counter(5, '#7a4f2e'); tCounter.position.set(BK - 4.0, 0.05, -4.3); W.add(tCounter);
  for (let i = 0; i < 12; i++) W.add(cyl(0.02, 0.02, 1.0, '#c9a24a', {x: BK - 6.3 + i * 0.42, y: 1.6, z: -4.3, seg: 6, thick: 0.002}));
  person('clerk', 'none', BK - 5.0, 0.05, -5.0, 62); person('official', 'none', BK - 3.0, 0.05, -5.0, 63, {glasses: true});
  const banker = person('suit', 'none', BK + 5.6, 0.05, -3.6, 64, {glasses: true});
  const bCrates = [0, 1, 2].map((i) => { const c = G.moneyCrate('$10,000,000', 0.9); W.add(c); return c; });
  const tenM = big('$10,000,000', 2.2, 0.55, '#3f8f4a', '#ffffff'); tenM.position.set(BK + 1.0, 2.5, -2.6); W.add(tenM); only(tenM, 'so');
  const bDesk = P.desk(2.4, '#6b4430'); bDesk.position.set(BK - 3.0, 0.05, -1.8); W.add(bDesk);
  const certs = G.certStack(60, 0.6, 0.42, 7); certs.position.set(BK - 3.95, 1.05, -1.6); certs.scale.set(1.2, 1.3, 1.2); W.add(certs);
  const certs2 = G.certStack(50, 0.6, 0.42, 8); certs2.position.set(BK - 2.05, 1.05, -1.7); certs2.scale.set(1.1, 1.3, 1.1); W.add(certs2);
  const shS = big('SHARES', 1.2, 0.36, '#f4ead0', '#2f5a2a'); shS.position.set(BK - 3.0, 2.85, -1.9); W.add(shS); only(shS, 'so');
  const soMan = hero(BK - 3.4, 0.05, -2.8, 11);
  W.add(potPlant(BK + 7.0, 1.6), potPlant(BK - 7.0, 1.6), P.at(P.wallClock(), BK, 4.2, -5.42), P.at(P.bench(), BK + 0.6, 0.05, 2.6, Math.PI), P.at(P.rug(3.6, 2.4, '#7a2e2e', '#e0b04a'), BK - 1, 0, 0.6));
  person('pink', 'none', BK + 6.2, 0.05, 0.2, 65); person('navy', 'bowler', BK - 5.8, 0.05, -2.2, 66);

  // ======================= STOCK EXCHANGE outside (rules) =======================
  const EX = LOC.exch;
  W.add(street(EX, 77, {skip: [-1, 0, 1]}));
  const exB = G.columnsBuilding(24, 14, 'STOCK EXCHANGE'); exB.position.set(EX, 0, -1.5); W.add(exB);
  const stopB = big('TRADING STOPPED', 6.4, 1.2, '#c43d32', '#ffffff'); W.add(stopB); only(stopB, 'rules');
  const nyS = big('NEW YORK', 2.0, 0.5, '#2f6b4a', '#ffffff'); nyS.position.set(EX - 4.6, 3.2, 7.0); W.add(nyS); W.add(cyl(0.06, 0.06, 3.2, '#2c3a3b', {x: EX - 4.6, y: 1.6, z: 7.0, seg: 8}));
  const calP = sign('EXTRA DAYS', 1.6, 1.6, {bg: '#ffffff', fg: '#c43d32', w: 400, h: 400, font: 'bold 70px Arial', sub: '+ MORE TIME'}); calP.position.set(EX + 3.4, 3.0, 6.6); W.add(calP); only(calP, 'rules');
  W.add(box(0.1, 3.0, 0.1, '#5a3a26', {x: EX + 3.4, y: 1.5, z: 6.55, thick: 0.005}));
  const exCrowd = [[-3.2, 5.0], [-2.0, 5.8], [-0.8, 5.0], [0.6, 5.6], [1.8, 4.9], [2.4, 6.0], [-4.4, 5.6], [4.6, 5.2], [5.6, 6.1], [-5.8, 4.8]].map(([x, z], i) => trader(i, EX + x, 0.25, z));
  const exCars = [G.oldCar('#2b2b30', 5), G.oldCar('#5a2a22', 6)]; exCars.forEach((c) => W.add(c));
  for (const x of [-25, -15, 15, 25]) W.add(lampPost(EX + x, 7.3, 5));
  for (let i = 0; i < 4; i++) W.add(P.at(P.flag(['#c43d32', '#2f6db3'][i % 2], i), EX - 9 + i * 6, 14.6, 2.0));

  // ======================= OFFICE (broke) =======================
  const OF = LOC.office;
  W.add(room(OF, {w: 14, h: 4.6, d: 10, wall: '#bcd9e6', floor: '#8a5a3b', seed: 31}));
  hang(W, OF - 1.5, -0.8, 4.0); hang(W, OF + 2.5, -0.8, 4.0);
  const chart = Q.board(3.2, 2.0, 640, 400, '#6b4430'); chart.position.set(OF + 2.2, 2.6, -4.88); W.add(chart);
  const oDesk = P.desk(2.2, '#6b4430'); oDesk.position.set(OF - 0.8, 0.05, -1.6); W.add(oDesk);
  const folder = box(0.5, 0.03, 0.36, '#d9b465', {x: OF - 0.8, y: 1.08, z: -1.3, thick: 0.004}); W.add(folder);
  const bankrupt = big('BANKRUPT', 1.6, 0.45, '#ffffff', '#c43d32'); bankrupt.position.set(OF - 0.8, 1.62, -1.15); bankrupt.rotation.z = -0.1; W.add(bankrupt); only(bankrupt, 'broke');
  const brMan = hero(OF - 1.3, 0.05, -2.5, 12);
  const emptyChair = P.chair(); emptyChair.position.set(OF - 0.2, 0.05, -2.4); emptyChair.rotation.y = 0.4; W.add(emptyChair);
  const movers = [person('denim', 'cap', OF + 0.8, 0.05, -0.4, 32), person('welder', 'cap', OF + 1.8, 0.05, 0.3, 33)];
  const mBox = G.movingBox(1); mBox.position.set(0.0, -0.75, 0.25); movers[0].userData.armR.add(mBox);
  const mSign = big('PIGGLY WIGGLY', 1.4, 0.32, '#c43d32', '#ffffff'); mSign.position.set(0.0, -0.4, 0.25); movers[1].userData.armR.add(mSign);
  for (let i = 0; i < 6; i++) W.add(P.at(G.movingBox(i), OF + 4.6 + (i % 3) * 0.65, 0.05 + Math.floor(i / 3) * 0.46, -1.8));
  W.add(box(1.3, 2.4, 0.1, '#6b3f37', {x: OF + 6.9, y: 1.2, z: 0.6, thick: 0.01}).rotateY(Math.PI / 2));
  W.add(P.at(P.bookshelf(9, 2.2, 2.4), OF - 4.8, 0.05, -4.6), P.at(P.filingCabinet(), OF - 6.2, 0.05, -2.4, Math.PI / 2), P.at(P.wallClock(), OF - 1.2, 3.6, -4.92), P.at(P.papers(6, 13), OF - 1.4, 1.07, -1.7), P.at(P.deskLamp(), OF - 0.1, 1.07, -1.9));
  W.add(potPlant(OF + 6.0, -4.0), P.at(P.poster('PLANS', 1.0, 1.3, '#e6d39a'), OF - 3.0, 2.8, -4.92));

  // ======================= MODERN SUPERMARKET (close) =======================
  const MD = LOC.modern;
  W.add(room(MD, {w: 24, h: 6, d: 16, wall: '#bfe3dc', floor: '#e8e2d2', seed: 71, tiles: true}));
  for (const x of [-8, -3, 2, 7]) for (const z of [-5, 0, 5]) tube(W, MD + x, z, 5.8);
  for (let i = 0; i < 8; i++) W.add(P.at(Q.storeShelf(3, 80 + i, 2.6), MD - 10.5 + i * 3, 0.05, -7.4));
  ['PRODUCE', 'BAKERY', 'DAIRY', 'SNACKS'].forEach((s, i) => { const b = big(s, 2.0, 0.55, ['#4f8a4a', '#d9a441', '#2f6db3', '#c43d32'][i], '#ffffff'); b.position.set(MD - 9 + i * 6, 4.4, -7.85); W.add(b); });
  for (let i = 0; i < 3; i++) { W.add(P.at(Q.storeShelf(3, 90 + i, 2.4), MD - 8 + i * 3.05, 0.05, -2.4)); const s = Q.storeShelf(3, 95 + i, 2.4); s.position.set(MD - 8 + i * 3.05, 0.05, -3.0); s.rotation.y = Math.PI; W.add(s); }
  for (const x of [3.6, 6.8]) { const c = Q.checkout(); c.position.set(MD + x, 0.05, -1.0); W.add(c); }
  const scS = big('SELF CHECKOUT', 2.6, 0.5, '#2f6db3', '#ffffff'); scS.position.set(MD + 5.2, 3.0, -1.6); W.add(scS);
  [['pink', 'none', -8.6, -1.2], ['student', 'cap', -5.2, -1.5], ['mustard', 'none', -2.2, -1.1], ['teal', 'none', 3.0, 0.0], ['red', 'none', 6.2, 0.1], ['denim', 'cap', -6.6, 1.2], ['navy', 'none', 1.2, 1.4]].forEach(([p, h, x, z], i) => { const c = person(p, h, MD + x, 0.05, z, 700 + i); if (i < 3) c.userData.armR.rotation.z = 1.2; });
  [[-7.6, -0.4, 0.3], [-4.2, -0.6, -0.2], [2.3, 0.6, 0.4], [-1.0, 1.6, 0.2]].forEach(([x, z, r]) => W.add(P.at(Q.cart(), MD + x, 0.05, z, r)));
  const ped = G.pedestal(1.0); ped.position.set(MD + 0.3, 0.05, 3.2); W.add(ped);
  const relic = G.woodBasket(1.6); relic.position.set(MD + 0.3, 1.14, 3.2); W.add(relic);
  const spotC = Q.spotCone(4.6, 1.0, '#fff3c4', 0.12); spotC.position.set(MD + 0.3, 5.7, 3.2); W.add(spotC);
  const plaque = big('SINCE 1916', 1.0, 0.3, '#6b4430', '#f4e3bf'); plaque.position.set(MD + 0.3, 0.6, 3.76); W.add(plaque); only(plaque, 'close');
  W.add(potPlant(MD + 10.5, 6.5), potPlant(MD - 10.5, 6.5));

  // ======================= per-frame =======================
  const drawTicker = (q, w, h, s) => { q.fillStyle = '#14202a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d9a441'; q.lineWidth = 14; q.strokeRect(7, 7, w - 14, h - 14); q.font = 'bold 150px monospace'; q.textBaseline = 'middle'; const items = ['PIGGLY WIGGLY ▲', 'RAILROAD ▼', 'STEEL ▲', 'OIL ▲', 'MOTORS ▼']; let x = 60 - (s * 220) % 2600; for (let k = 0; k < 2; k++) for (const it of items) { q.fillStyle = it.endsWith('▲') ? '#9fe0b8' : '#ff9c8a'; q.fillText(it, x, h / 2); x += q.measureText(it).width + 120; } };
  const drawBoard = (q, w, h, {price = null, note = '', time = '', arrow = 0}) => {
    q.fillStyle = '#24332c'; q.fillRect(0, 0, w, h);
    q.globalAlpha = 0.12; q.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) q.fillRect((i * 97) % w, (i * 53) % h, 120, 6); q.globalAlpha = 1;
    q.fillStyle = '#f4f1e6'; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.font = 'bold 84px Georgia, serif'; q.fillText('PIGGLY WIGGLY', w / 2, 80);
    q.fillStyle = 'rgba(244,241,230,0.4)'; q.font = 'bold 44px Arial'; ['RAILROAD', 'STEEL', 'MOTORS'].forEach((s, i) => q.fillText(s, 200, 200 + i * 80)); ['OIL', 'COPPER', 'RUBBER'].forEach((s, i) => q.fillText(s, w - 200, 200 + i * 80));
    if (price) { q.fillStyle = '#ffe58a'; q.font = 'bold 200px Arial'; q.fillText(price, w / 2, 280); if (arrow) { const x = w / 2 + q.measureText(price).width / 2 + 70; q.fillStyle = '#5fd06a'; q.beginPath(); q.moveTo(x, 190); q.lineTo(x + 55, 290); q.lineTo(x - 55, 290); q.closePath(); q.fill(); q.fillRect(x - 22, 288, 44, 70); } }
    if (note) { q.fillStyle = '#f4f1e6'; q.font = 'bold 60px Arial'; q.fillText(note, w / 2, 290); }
    if (time) { q.fillStyle = '#f4f1e6'; q.font = 'bold 46px Arial'; q.fillText(time, w / 2, 420); }
  };
  const drawMap = (q, w, h, n) => {
    q.fillStyle = '#bfe0f0'; q.fillRect(0, 0, w, h);
    q.fillStyle = '#f2e3b8'; q.strokeStyle = '#6b4430'; q.lineWidth = 6; q.beginPath(); USA.forEach(([x, y], i) => { const X = 40 + x * (w - 80), Y = 40 + y * (h - 80); if (i) q.lineTo(X, Y); else q.moveTo(X, Y); }); q.closePath(); q.fill(); q.stroke();
    for (let i = 0; i < n; i++) { const [x, y] = PINS[i]; const X = 40 + x * (w - 80), Y = 40 + y * (h - 80); q.fillStyle = i === 0 ? '#2f6db3' : '#d23a2e'; q.beginPath(); q.arc(X, Y, i === 0 ? 16 : 10, 0, 7); q.fill(); q.strokeStyle = '#ffffff'; q.lineWidth = 3; q.stroke(); }
  };
  const drawChart = (q, w, h, k) => {
    q.fillStyle = '#f7f0de'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c9bfa6'; q.lineWidth = 2; for (let i = 1; i < 6; i++) { q.beginPath(); q.moveTo(0, i * h / 6); q.lineTo(w, i * h / 6); q.stroke(); }
    q.fillStyle = INK; q.font = 'bold 40px Arial'; q.textAlign = 'center'; q.fillText('PRICE', w / 2, 50);
    q.strokeStyle = '#d23a2e'; q.lineWidth = 12; q.beginPath(); q.moveTo(40, 300); q.lineTo(180, 250); q.lineTo(300, 120); q.lineTo(lerp(300, 600, k), lerp(120, 370, k)); q.stroke();
  };

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    for (const [o, keys] of shown) o.visible = keys.includes(shot);
    if (shot === 'hook') {
      ticker.userData.draw(Math.floor(t * 15), (q, w, h) => drawTicker(q, w, h, t));
      crates.forEach((c, i) => { c.visible = pop(c, t, wordT('hook', 4 + i * 0.25), 0.3); });
      hookMan.userData.armR.rotation.z = t > wordT('hook', 3) ? 1.6 : 0.3;
      hookCars.forEach((c, i) => c.position.set(WS - 18 + ((t * 4 + i * 13) % 40), 0, i % 2 ? 14.4 : 9.6)); hookCars[1].rotation.y = Math.PI;
    } else ticker.userData.draw('s', (q, w, h) => drawTicker(q, w, h, 0));
    if (shot === 'yousee') {
      memSign.visible = pop(memSign, t, wordT('yousee', 3), 0.3);
      grand.visible = pop(grand, t, wordT('yousee', 7), 0.3);
      youMan.userData.armR.rotation.z = t > wordT('yousee', 7) ? 2.0 : 0.4;
      queue.forEach((c, i) => { c.position.x = MP + 0.8 + i * 0.85 - 0.6 * ease(t, wordT('yousee', 8) + i * 0.1, wordT('yousee', 12) + i * 0.1); });
      mCars[0].position.set(MP - 14 + t * 3.0 - 10, 0, 9.6); mCars[1].position.set(MP + 16 - (t - 3) * 2.5, 0, 14.4); mCars[1].rotation.y = Math.PI;
    }
    if (shot === 'before') {
      const k = ease(t, wordT('before', 4), wordT('before', 8));
      climber.position.set(GS + 1.5, 0.05 + k * 1.3, -3.6 - k * 0.2);
      climber.userData.armR.rotation.z = 2.4 + Math.sin(t * 6) * 0.15; climber.userData.armL.rotation.z = -2.2;
      buyer.userData.armR.rotation.z = 1.4;
      bored.forEach((c, i) => { c.userData.armL.rotation.z = -0.3 - Math.sin(t * 1.5 + i) * 0.1; });
      waitS.visible = pop(waitS, t, wordT('before', 10), 0.3);
    } else climber.position.set(GS + 1.5, 0.05, -3.6);
    if (shot === 'turnstile') {
      const kw = ease(t, wordT('turnstile', 3.5), wordT('turnstile', 8.5));
      tsMan.position.set(lerp(PW - 7.4, PW - 4.6, kw), 0.05, lerp(2.8, 1.6, kw));
      ts.userData.arms.rotation.y = ease(t, wordT('turnstile', 6.5), wordT('turnstile', 8)) * Math.PI * 2 / 3;
      tsBasket.visible = pop(tsBasket, t, wordT('turnstile', 10), 0.3, 0.9);
      tsMan.userData.armR.rotation.z = t > wordT('turnstile', 10) ? 0.5 : 0.2;
      pickers.forEach((c, i) => { c.userData.armR.rotation.z = t > wordT('turnstile', 12 + i * 0.5) ? 2.2 + Math.sin(t * 5 + i) * 0.15 : 0.3; });
    } else { tsBasket.visible = true; tsBasket.scale.setScalar(0.9); }
    if (shot === 'price') {
      tags.forEach((tg, i) => { tg.visible = pop(tg, t, wordT('price', 1 + i * 0.8), 0.22); });
      reg.userData.drawer.position.z = 0.04 + 0.3 * ease(t, wordT('price', 9), wordT('price', 10));
      payer.userData.armR.rotation.z = t > wordT('price', 8.5) ? 1.5 : 0.3;
    }
    if (shot === 'ladder') {
      const ts1 = wordT('ladder', 1);
      pStamp.userData.head.position.y = t < ts1 - 0.25 ? 0.35 : t < ts1 ? lerp(0.35, 0, ease(t, ts1 - 0.25, ts1)) : 0.3 * ease(t, ts1 + 0.15, ts1 + 0.5);
      stampMark.visible = pop(stampMark, t, ts1 + 0.02, 0.12);
      ptMan.userData.armR.rotation.z = t < ts1 + 0.3 ? 1.0 : 0.3;
      const n = Math.max(1, Math.floor(160 * ease(t, wordT('ladder', 4), wordT('ladder', 12))));
      map.userData.draw(n, (q, w, h) => drawMap(q, w, h, n));
      y22.visible = pop(y22, t, wordT('ladder', 5), 0.3);
      k1200.visible = pop(k1200, t, wordT('ladder', 11), 0.3);
      official.userData.armR.rotation.z = t > wordT('ladder', 9) ? 1.8 : 0.4;
    } else map.userData.draw('full', (q, w, h) => drawMap(q, w, h, 160));
    if (shot === 'but') {
      cboard.userData.draw('but', (q, w, h) => drawBoard(q, w, h, {note: 'SELLING SHORT'}));
      downA.visible = pop(downA, t, wordT('but', 8.8), 0.3); downA.position.y = 3.6 - 0.15 * Math.sin(t * 5);
      tradersA.forEach((c, i) => { c.userData.armR.rotation.z = t > wordT('but', 5) ? 1.9 + Math.sin(t * 6 + i) * 0.2 : 0.4; });
    }
    if (shot === 'spike') {
      const k = ease(t, wordT('spike', 5), wordT('spike', 12));
      const p = Math.round(lerp(75, 124, k)); const noon = t > wordT('spike', 13);
      cboard.userData.draw(p + (noon ? 'n' : '') + (t > wordT('spike', 4) ? 'a' : ''), (q, w, h) => drawBoard(q, w, h, {price: '$' + p, arrow: t > wordT('spike', 4), time: noon ? '12:00 NOON' : (k > 0.5 ? '11:00 AM' : '10:00 AM')}));
      
      tape.userData.update(t);
      tradersA.forEach((c, i) => { c.userData.armL.rotation.z = -1.8 - Math.sin(t * 7 + i) * 0.3; });
    }
    if (shot === 'traders' || shot === 'broke' || shot === 'rules') cboard.userData.draw('124', (q, w, h) => drawBoard(q, w, h, {price: '$124', time: '12:00 NOON'}));
    if (shot === 'traders') {
      [[-4.5, -3.2], [-4.8, -2.0], [-8.5, -1.8]].forEach(([x, z], i) => { const b = buyS[i]; b.position.set(TF + x, 2.25 + Math.sin(t * 6 + i) * 0.05, z); b.visible = pop(b, t, wordT('traders', 4 + i * 0.4), 0.25); });
      crowdT.forEach((c, i) => { c.userData.armR.rotation.z = t > wordT('traders', 3.5) ? 2.2 + Math.sin(t * 8 + i) * 0.25 : 0.5; });
      hisS.visible = pop(hisS, t, wordT('traders', 9), 0.3);
      trMan.userData.armR.rotation.z = t > wordT('traders', 9) ? 1.6 : 0.3;
    }
    if (shot === 'so') {
      bCrates.forEach((c, i) => { const t0 = wordT('so', 2.5 + i * 0.5); const k = ease(t, t0, t0 + 1.4); c.position.set(lerp(BK + 3.6, BK + 2.6 - i * 1.15, k), 0.05, lerp(-4.6, -2.6 + (i % 2) * 0.4, k)); c.visible = t > t0 - 0.05; });
      vault.userData.wheel.rotation.z = ease(t, wordT('so', 0), wordT('so', 3)) * 3;
      tenM.visible = pop(tenM, t, wordT('so', 3), 0.3);
      const kc = ease(t, wordT('so', 7), wordT('so', 11.5)); certs.userData.setN(Math.max(1, Math.floor(60 * kc))); certs2.userData.setN(Math.max(1, Math.floor(50 * ease(t, wordT('so', 8), wordT('so', 12)))));
      shS.visible = pop(shS, t, wordT('so', 10), 0.3);
      soMan.userData.armR.rotation.z = t > wordT('so', 7) ? 1.2 + Math.sin(t * 6) * 0.15 : 0.3;
      banker.userData.armL.rotation.z = -1.2;
    }
    if (shot === 'rules') {
      const td = wordT('rules', 6);
      stopB.position.set(EX, lerp(16, 9.2, ease(t, td - 0.1, td + 0.35)) + 0.1 * Math.sin(Math.max(0, t - td) * 9) * Math.exp(-Math.max(0, t - td) * 3), 2.6);
      stopB.visible = t > td - 0.12;
      calP.visible = pop(calP, t, wordT('rules', 12), 0.3);
      exCrowd.forEach((c, i) => { c.userData.armR.rotation.z = t > wordT('rules', 10.5) ? 2.3 + Math.sin(t * 8 + i) * 0.2 : 0.4; });
      exCars[0].position.set(EX - 16 + (t - wordT('rules', 0)) * 4, 0, 9.6); exCars[1].position.set(EX + 14 - (t - wordT('rules', 0)) * 3, 0, 14.4); exCars[1].rotation.y = Math.PI;
    }
    if (shot === 'broke') {
      const k = ease(t, wordT('broke', 1.2), wordT('broke', 2.6));
      chart.userData.draw(Math.round(k * 30), (q, w, h) => drawChart(q, w, h, k));
      movers.forEach((c, i) => { const km = ease(t, wordT('broke', 3 + i * 0.6), wordT('broke', 9 + i * 0.4)); c.position.set(OF + 0.8 + i * 1.0 + km * 4.2, 0.05, -0.4 + i * 0.7); c.userData.armR.rotation.z = 1.4; });
      bankrupt.visible = pop(bankrupt, t, wordT('broke', 9), 0.22, 1 + 0.15 * (1 - ease(t, wordT('broke', 9), wordT('broke', 9) + 0.25)));
      brMan.userData.armL.rotation.z = -0.2; brMan.userData.armR.rotation.z = 0.15;
    } else chart.userData.draw('full', (q, w, h) => drawChart(q, w, h, 1));
    if (shot === 'close') {
      plaque.visible = pop(plaque, t, wordT('close', 10.5), 0.3);
      spotC.material.opacity = 0.08 + 0.12 * ease(t, wordT('close', 8), wordT('close', 10));
      relic.rotation.y = 0.3 + t * 0.25;
    }
  };

  return {group: W, update};
}
