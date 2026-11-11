import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, facade, ground, sidewalk, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';
import * as S from './swamp-props.js';
import * as Q from './pudding-props.js';

export const LOC = {store: 0, home: 200, post: 300, garage: 400, hall: 500, tax: 600, stage: 700, street: 1500, airport: 2000};

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
const windowPane = (W, x, y, z, w = 1.8, h = 1.4, ry = 0, tex = null) => {
  const f = new THREE.Group();
  f.add(box(w + 0.2, h + 0.2, 0.08, '#f2ead8', {thick: 0.015}));
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial(tex ? {map: tex} : {color: '#bfe6ff'})); gl.position.z = 0.05; f.add(gl);
  f.add(box(0.06, h, 0.04, '#f2ead8', {z: 0.07, thick: 0.004}), box(w, 0.06, 0.04, '#f2ead8', {z: 0.07, thick: 0.004}));
  f.position.set(x, y, z); f.rotation.y = ry; W.add(f);
};
const potPlant = (x, z) => { const p = new THREE.Group(); p.add(cyl(0.3, 0.24, 0.6, '#b35a3a', {y: 0.3})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.26, 0.8 + (i % 3) * 0.22, Math.sin(i) * 0.26); ink(l, 0.02, false); p.add(l); } p.position.set(x, 0.05, z); return p; };
// sunny California view for a window (palm tree, poppies, hills)
function caliTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 400; const q = c.getContext('2d');
  const gr = q.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#5fb0ee'); gr.addColorStop(1, '#cdeaf8'); q.fillStyle = gr; q.fillRect(0, 0, 512, 400);
  q.fillStyle = '#fff2b0'; q.beginPath(); q.arc(420, 70, 38, 0, 7); q.fill();
  q.fillStyle = '#9cc56a'; q.beginPath(); q.moveTo(0, 290); q.quadraticCurveTo(140, 220, 280, 280); q.quadraticCurveTo(400, 230, 512, 270); q.lineTo(512, 400); q.lineTo(0, 400); q.fill();
  q.fillStyle = '#7fae55'; q.fillRect(0, 320, 512, 80);
  q.strokeStyle = '#7a5a3a'; q.lineWidth = 16; q.beginPath(); q.moveTo(150, 400); q.quadraticCurveTo(170, 250, 140, 120); q.stroke();
  q.fillStyle = '#3f8a3a'; for (let i = 0; i < 7; i++) { q.save(); q.translate(140, 120); q.rotate(-2.6 + i * 0.75); q.beginPath(); q.ellipse(55, 0, 60, 14, 0, 0, 7); q.fill(); q.restore(); }
  q.fillStyle = '#f28a1e'; for (let i = 0; i < 40; i++) { q.beginPath(); q.arc(20 + (i * 53) % 490, 335 + (i * 29) % 55, 7, 0, 7); q.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function street(ox, seed = 1) {
  const g = new THREE.Group();
  g.add(ground(260, 200, '#9c958a', {x: ox, z: -30, seed: seed + 2, repeat: 20}));
  const road = new THREE.Mesh(new THREE.BoxGeometry(260, 0.05, 9), toon('#6e6670')); road.position.set(ox, 0.03, 12); g.add(road);
  for (let i = -12; i < 12; i++) g.add(box(3, 0.06, 0.35, '#e8d28a', {x: ox + i * 10, y: 0.08, z: 12, edges: false, thick: 0.001}));
  g.add(sidewalk(260, {x: ox, z: 5.5, w: 4})); g.add(sidewalk(260, {x: ox, z: 18.5, w: 4}));
  const cols = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
  const r = rng(seed);
  for (let i = -6; i <= 6; i++) {
    const w = 10, h = 9 + r() * 8;
    const f = facade({w, h, color: cols[(i + 6) % cols.length], cols: 3, rows: Math.floor(h / 3.6), seed: seed + i * 7, door: false}); f.position.set(ox + i * 10, 0, 3); g.add(f);
    g.add(box(w, h, 6, '#8f6c5e', {x: ox + i * 10, y: h / 2, z: -0.1, thick: 0.03}));
  }
  for (let i = -6; i <= 6; i++) { const f = facade({w: 10, h: 10 + (i % 3) * 3, color: cols[(i + 9) % 6], cols: 3, rows: 3, seed: seed + 90 + i}); f.position.set(ox + i * 10, 0, 21.5); f.rotation.y = Math.PI; g.add(f); }
  return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const person = (pal, hat, x, y, z, seed, extra = {}) => { const c = character({palette: pal, hat, seed, ...extra}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };
  const shown = [];
  const only = (o, ...keys) => { shown.push([o, keys]); return o; };
  const HERO = {palette: 'engineer', glasses: true}; // generic cartoon stand-in, not a likeness
  const hero = (x, y, z, seed = 7) => person(HERO.palette, 'none', x, y, z, seed, {glasses: true});

  // ======================= SUPERMARKET (hook, deal, but) =======================
  const ST = LOC.store;
  W.add(room(ST, {w: 26, h: 6, d: 18, wall: '#bfe3dc', floor: '#e8e2d2', seed: 3, tiles: true}));
  for (const x of [-9, -3, 3, 9]) for (const z of [-5, 1, 6]) tube(W, ST + x, z, 5.8);
  // back wall shelving + aisle banners
  for (let i = 0; i < 8; i++) W.add(P.at(Q.storeShelf(3, 10 + i, 2.6), ST - 10.5 + i * 3, 0.05, -8.4));
  ['DAIRY', 'SNACKS', 'FROZEN', 'BAKERY'].forEach((s, i) => { const b = big(s, 2.0, 0.55, ['#c43d32', '#2f6db3', '#4f8a4a', '#d9a441'][i], '#ffffff'); b.position.set(ST - 9 + i * 6, 4.4, -8.85); W.add(b); });
  // checkout lanes (hook)
  const co1 = Q.checkout(); co1.position.set(ST - 1.2, 0.05, 3.0); W.add(co1);
  const co2 = Q.checkout(); co2.position.set(ST + 3.6, 0.05, 3.0); W.add(co2);
  const co3 = Q.checkout(); co3.position.set(ST - 6.0, 0.05, 3.0); W.add(co3);
  const heroCup = Q.puddingCup(1.6, {bar: true}); heroCup.position.set(ST - 1.9, 0.92, 3.05); W.add(heroCup);
  for (let i = 0; i < 6; i++) W.add(P.at(Q.puddingCup(1.6), ST - 2.3 - (i % 3) * 0.17, 0.92, 2.9 + Math.floor(i / 3) * 0.18));
  const cashier = person('teal', 'cap', ST - 0.1, 0.05, 2.3, 21);
  const hookMan = hero(ST - 2.6, 0.05, 4.3, 7);
  const carts = [[-3.7, 4.6, 0.2], [-0.4, 4.9, -0.1], [1.4, 5.4, 0.3], [-5.2, 5.3, 0.5]].map(([x, z, ry], i) => { const c = Q.fullCart(i + 1); c.position.set(ST + x, 0.05, z); c.rotation.y = ry; W.add(c); return c; });
  // the pudding mountain behind the lanes
  const mount = new THREE.Group();
  for (let lvl = 0; lvl < 7; lvl++) { const n = 7 - lvl; const s = Q.caseStack(n, 1, 2, lvl + 5); s.position.set(-n * 0.26, lvl * 0.265, -0.4); mount.add(s); }
  mount.position.set(ST - 4.0, 0.05, -0.4); W.add(mount);
  const mount2 = mount.clone(); mount2.position.set(ST + 1.8, 0.05, -1.0); mount2.scale.setScalar(0.8); W.add(mount2);
  const sale = big('PUDDING SALE', 2.6, 0.6, '#c43d32', '#fff4dc'); sale.position.set(ST - 4.0, 2.55, -0.2); W.add(sale);
  // promo plane mobile (hook): swoops across on "free flights"
  const plane = Q.jet(0.09); plane.position.set(ST - 6, 3.4, 1.5); W.add(plane);
  const fly = big('FLY FREE!', 1.2, 0.4, '#2f6db3', '#ffffff'); W.add(fly);
  only(plane, 'hook'); only(fly, 'hook');
  // promo flyer stand (deal)
  const flyer = new THREE.Group();
  flyer.add(box(2.8, 3.4, 0.12, '#f7f0de', {y: 2.0, thick: 0.03}));
  for (const x of [-1.2, 1.2]) flyer.add(box(0.1, 0.4, 0.5, '#6b4a36', {x, y: 0.2, thick: 0.01}));
  const fh = sign('HEALTHY CHOICE', 2.5, 0.45, {bg: '#3f8f4a', fg: '#ffffff', w: 1000, h: 180, font: 'bold 120px Arial', border: false}); fh.position.set(0, 3.35, 0.07); flyer.add(fh);
  const fh2 = sign('AIRLINE MILES', 2.5, 0.42, {bg: '#f7f0de', fg: '#2f6db3', w: 1000, h: 170, font: 'bold 120px Arial', border: false}); fh2.position.set(0, 2.88, 0.07); flyer.add(fh2);
  const slots = [];
  for (let i = 0; i < 10; i++) { const b = Q.barcode(0.42); b.position.set(-1.0 + (i % 5) * 0.5, 2.35 - Math.floor(i / 5) * 0.4, 0.08); flyer.add(b); slots.push(b); }
  const s500 = big('500 MILES', 1.9, 0.6, '#c43d32', '#fff4dc'); s500.position.set(0, 1.05, 0.12); s500.rotation.z = -0.06; flyer.add(s500);
  flyer.position.set(ST + 6.2, 0.05, -4.2); W.add(flyer);
  W.add(P.at(Q.caseStack(3, 2, 1, 41), ST + 4.9, 0.05, -3.5), P.at(Q.caseStack(2, 3, 1, 42), ST + 7.6, 0.05, -3.6));
  person('pink', 'none', ST + 4.3, 0.05, -2.2, 31); person('mustard', 'cap', ST + 8.4, 0.05, -1.9, 32);
  W.add(P.at(Q.cart(), ST + 3.6, 0.05, -1.2, 0.6), P.at(Q.cart(), ST + 9.2, 0.05, -2.6, -0.4));
  // pudding aisle (but)
  for (let i = 0; i < 3; i++) W.add(P.at(Q.storeShelf(3, 20 + i, 2.4), ST - 10 + i * 3.05, 0.05, -3.4));
  for (let i = 0; i < 3; i++) { const s = Q.storeShelf(3, 30 + i, 2.4); s.position.set(ST - 10 + i * 3.05, 0.05, 1.0); s.rotation.y = Math.PI; W.add(s); }
  const pudShelf = new THREE.Group();
  for (let k = 0; k < 3; k++) for (let i = 0; i < 9; i++) pudShelf.add(P.at(Q.puddingCup(1.5), -0.6 + i * 0.15, 0.2 + k * 0.62, (i % 2) * 0.12));
  pudShelf.position.set(ST - 3.95, 0.05, -3.55); W.add(pudShelf);
  const pudLbl = big('PUDDING', 1.3, 0.3, '#7a4a2a', '#f4e3bf'); pudLbl.position.set(ST - 3.95, 2.45, -3.6); W.add(pudLbl);
  const spot = Q.spotCone(3.6, 1.0); spot.position.set(ST - 3.95, 4.2, -3.0); W.add(spot); only(spot, 'but');
  const tag25 = big('25¢', 0.8, 0.5, '#f2c12e', INK); tag25.position.set(ST - 3.95, 1.75, -3.0); tag25.rotation.z = 0.08; W.add(tag25); only(tag25, 'but');
  const butMan = hero(ST - 6.2, 0.05, -2.2, 8);
  const butCart = Q.cart(); butCart.position.set(ST - 7.0, 0.05, -1.7); butCart.rotation.y = 0.3; W.add(butCart);
  person('red', 'none', ST - 9.4, 0.05, -1.4, 33); person('student', 'cap', ST - 2.0, 0.05, -0.6, 34);
  W.add(potPlant(ST + 12, 7), potPlant(ST - 12, 7));

  // ======================= HOME: office corner (yousee) + kitchen (then) =======================
  const HM = LOC.home;
  W.add(room(HM, {w: 18, h: 4.6, d: 10, wall: '#f0d9b5', floor: '#a7764e', seed: 51}));
  hang(W, HM - 2, -0.5, 4.0); hang(W, HM + 4.5, -0.8, 4.0);
  windowPane(W, HM - 1.0, 2.5, -4.92, 2.4, 1.7, 0, caliTex());
  const bpT = paintTex('#2f5d9e', {seed: 6, stains: 2, chips: 0, scratches: 0, stripes: (gg, w, h) => { gg.strokeStyle = 'rgba(255,255,255,0.85)'; gg.lineWidth = 3; for (let i = 1; i < 8; i++) { gg.beginPath(); gg.moveTo(i * w / 8, 0); gg.lineTo(i * w / 8, h); gg.stroke(); } gg.lineWidth = 6; gg.beginPath(); gg.moveTo(20, 170); gg.quadraticCurveTo(128, 60, 236, 170); gg.stroke(); for (let i = 0; i < 9; i++) { gg.beginPath(); gg.moveTo(28 + i * 25, 170); gg.lineTo(28 + i * 25, 130 - Math.sin(i / 8 * Math.PI) * 50); gg.stroke(); } gg.beginPath(); gg.moveTo(10, 172); gg.lineTo(246, 172); gg.stroke(); }});
  const dt = new THREE.Group(); const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.2), [toon('#8a5a3b'), toon('#8a5a3b'), toon('#ffffff', bpT), toon('#8a5a3b'), toon('#8a5a3b'), toon('#8a5a3b')]); top.position.y = 1.15; top.rotation.x = 0.45; ink(top, 0.015, true); dt.add(top);
  for (const x of [-0.75, 0.75]) dt.add(box(0.08, 1.1, 0.08, '#5a3a26', {x, y: 0.55, thick: 0.008}));
  dt.position.set(HM - 4.2, 0.05, -2.6); W.add(dt);
  const hd = P.desk(2.2, '#7a4f33'); hd.position.set(HM - 0.6, 0.05, -2.0); W.add(hd);
  const youMan = hero(HM - 1.8, 0.05, -1.2, 9);
  const pbox = new THREE.Group(); pbox.add(box(0.45, 0.3, 0.3, '#7a4a2a', {y: 0.15, thick: 0.008})); const pl = sign('PUDDING', 0.4, 0.12, {bg: '#f4e3bf', fg: '#6a3b1f', w: 400, h: 120, font: 'bold 80px Arial', border: false}); pl.position.set(0, 0.18, 0.155); pbox.add(pl);
  const sticker = big('MILES!', 0.3, 0.16, '#f2c12e', '#c43d32', {font: 'bold 110px Arial'}); sticker.position.set(0.12, 0.31, 0.12); sticker.rotation.x = -0.6; pbox.add(sticker);
  pbox.position.set(HM - 0.2, 1.08, -1.8); pbox.rotation.y = -0.25; W.add(pbox);
  W.add(P.at(P.papers(5, 9), HM - 1.2, 1.08, -2.1), P.at(P.deskLamp(), HM + 0.2, 1.08, -2.4), P.at(P.mug(), HM - 0.8, 1.08, -1.7));
  const calc = new THREE.Group(); calc.add(box(0.18, 0.03, 0.26, '#3a3a3f', {thick: 0.004}), box(0.14, 0.01, 0.06, '#9fe0b8', {y: 0.02, z: -0.08, thick: 0.001})); calc.position.set(HM - 1.6, 1.1, -1.75); W.add(calc);
  const y99 = big('1999', 1.0, 0.5, '#f2e6cc'); y99.position.set(HM - 3.1, 2.9, -4.9); W.add(y99); only(y99, 'yousee');
  const cal = big('CALIFORNIA', 1.6, 0.4, '#f28a1e', '#ffffff'); cal.position.set(HM - 1.0, 3.6, -4.85); cal.rotation.z = -0.04; W.add(cal); only(cal, 'yousee');
  const dealB = big('DEAL!', 0.7, 0.36, '#c43d32', '#ffffff'); dealB.position.set(HM - 0.2, 1.75, -1.75); W.add(dealB); only(dealB, 'yousee');
  W.add(P.at(P.bookshelf(5, 2.2, 2.4), HM - 7.0, 0.05, -4.6), P.at(P.filingCabinet(), HM - 8.4, 0.05, -2.8, Math.PI / 2), P.at(P.poster('BRIDGES', 1.0, 1.3, '#e6d39a'), HM - 5.2, 2.8, -4.92), P.at(P.wallClock(), HM + 1.6, 3.4, -4.92));
  W.add(P.at(P.chair(), HM - 2.2, 0.05, -1.4, Math.PI), potPlant(HM - 8.2, 3.0), P.at(P.rug(3.6, 2.4, '#3f6e8a', '#e0b04a'), HM - 2, 0, 0.4));
  // kitchen corner (then)
  const kTable = Q.longTable(2.2, '#b88a5a'); kTable.position.set(HM + 5.0, 0.05, -1.4); W.add(kTable);
  for (let i = 0; i < 14; i++) W.add(P.at(Q.puddingCup(1.6), HM + 4.2 + (i % 7) * 0.2, 0.86, -1.8 + Math.floor(i / 7) * 0.2));
  const thenMan = hero(HM + 5.0, 0.05, -2.2, 10);
  const peelCup = Q.puddingCup(2.4, {bar: true}); peelCup.position.set(HM + 5.25, 0.86, -1.3); W.add(peelCup);
  const label = Q.barcode(0.12); label.position.set(HM + 5.25, 0.98, -1.18); W.add(label);
  const bigBar = Q.barcode(0.9); bigBar.position.set(HM + 5.0, 2.35, -1.2); W.add(bigBar); only(bigBar, 'then');
  const handT = big('BY HAND', 1.1, 0.36, '#c43d32', '#ffffff'); handT.position.set(HM + 5.0, 1.2, -0.8); W.add(handT); only(handT, 'then');
  const kMount = new THREE.Group(); for (let lvl = 0; lvl < 8; lvl++) { const n = 8 - lvl; const s = Q.caseStack(n, 1, 2, lvl + 15); s.position.set(-n * 0.26, lvl * 0.265, 0); kMount.add(s); } kMount.position.set(HM + 5.2, 0.05, -4.3); W.add(kMount);
  W.add(box(3.4, 0.95, 0.7, '#e9e3d6', {x: HM + 7.2, y: 0.5, z: -4.4, thick: 0.02}), box(3.4, 0.06, 0.75, '#b88a5a', {x: HM + 7.2, y: 1.0, z: -4.4, thick: 0.006}));
  W.add(box(0.9, 1.9, 0.7, '#e8eef0', {x: HM + 8.4, y: 0.95, z: -3.0, thick: 0.02}));
  const kClock = P.wallClock(); kClock.position.set(HM + 6.6, 3.0, -4.92); W.add(kClock);
  W.add(P.at(P.chair('#3e5a7a'), HM + 3.9, 0.05, -0.8, Math.PI * 0.8), potPlant(HM + 8.2, 2.6));
  person('pink', 'none', HM + 7.6, 0.05, -2.2, 52);

  // ======================= POST OFFICE (double) =======================
  const PO = LOC.post;
  W.add(room(PO, {w: 16, h: 5, d: 10, wall: '#cfdcf0', floor: '#9a6a44', seed: 61}));
  hang(W, PO - 2.5, -0.5); hang(W, PO + 2.5, -0.5);
  W.add(box(7, 1.15, 0.8, '#6b4430', {x: PO, y: 0.58, z: -2.2, thick: 0.02}), box(7.2, 0.08, 0.95, '#8a5a3b', {x: PO, y: 1.18, z: -2.2, thick: 0.01}));
  const clerk = person('navy', 'cap', PO - 0.2, 0.05, -3.3, 62);
  const poMan = hero(PO - 1.2, 0.05, -1.1, 11);
  const env = new THREE.Group(); env.add(box(0.32, 0.22, 0.02, '#f7f0de', {thick: 0.004})); const eb = Q.barcode(0.12); eb.position.set(0.05, 0, 0.012); env.add(eb); env.position.set(0.12, -0.5, 0.06); poMan.userData.armR.add(env);
  const poSign = big('POST OFFICE', 3.2, 0.6, '#2f5d9e', '#ffffff'); poSign.position.set(PO - 3.6, 3.9, -4.88); W.add(poSign);
  const calA = sign('APRIL', 1.2, 1.0, {bg: '#ffffff', fg: '#c43d32', w: 360, h: 300, font: 'bold 110px Arial'}); calA.position.set(PO + 0.2, 2.85, -4.85); W.add(calA); only(calA, 'double');
  const calM = sign('MAY', 1.2, 1.0, {bg: '#ffffff', fg: '#c43d32', w: 360, h: 300, font: 'bold 150px Arial', sub: 'LAST DAY: 31'}); calM.position.set(PO + 0.2, 2.85, -4.8); W.add(calM); only(calM, 'double');
  const m500 = big('500 MILES', 1.8, 0.6, '#f2e6cc'); m500.position.set(PO + 2.4, 2.9, -4.85); W.add(m500); only(m500, 'double');
  const m1000 = big('1,000 MILES', 2.1, 0.7, '#3f8f4a', '#ffffff'); m1000.position.set(PO + 2.4, 2.9, -4.75); W.add(m1000); only(m1000, 'double');
  const x2 = big('x2', 0.6, 0.6, '#c43d32', '#ffffff'); x2.position.set(PO + 3.65, 3.45, -4.7); W.add(x2); only(x2, 'double');
  for (let i = 0; i < 7; i++) W.add(P.at(Q.mailBag(['#a08a62', '#8f7d5a', '#b39a6e'][i % 3], i), PO + 4.5 + (i % 4) * 0.7, 0.05, -3.8 + Math.floor(i / 4) * 0.9));
  for (let i = 0; i < 5; i++) W.add(P.at(Q.mailBag('#a08a62', i + 3), PO - 6.5 + (i % 3) * 0.7, 0.05, -3.6 + Math.floor(i / 3) * 0.9));
  const pob = new THREE.Group(); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) pob.add(box(0.36, 0.3, 0.05, '#c9a24a', {x: i * 0.4, y: j * 0.34, thick: 0.004})); pob.position.set(PO - 6.8, 1.6, -4.9); W.add(pob);
  W.add(P.at(P.mailbox(), PO + 5.6, 0.05, 1.2), P.at(P.mailbox(), PO - 5.6, 0.05, 1.4), P.at(P.wallClock(), PO - 1.4, 3.9, -4.92), P.at(P.papers(6, 3), PO + 1.2, 1.22, -2.2));
  person('mustard', 'none', PO + 1.8, 0.05, -0.4, 63); person('red', 'none', PO + 3.2, 0.05, 0.6, 64); person('teal', 'cap', PO - 3.4, 0.05, -0.2, 65);

  // ======================= STREET OF DISCOUNT STORES (so) =======================
  const SR = LOC.street;
  W.add(street(SR, 23));
  const storeNames = ['DISCOUNT FOODS', 'GROCERY OUTLET', 'BARGAIN MART', 'DISCOUNT FOODS'];
  storeNames.forEach((n, i) => { const s = P.shopFront('', ['#c98f6b', '#a86f5c', '#d1a47a', '#9e7b66'][i], i + 2); s.position.set(SR - 15 + i * 10, 0, 3.5); W.add(s); const sg = big(n, 5.2, 0.8, ['#c43d32', '#2f6db3', '#4f8a4a', '#d9a441'][i], '#ffffff', {font: 'bold 110px Arial'}); sg.position.set(SR - 15 + i * 10, 3.85, 3.85); W.add(sg); });
  const wagon = P.car('#7a5a3a', {seed: 5}); W.add(wagon);
  const roof = Q.caseStack(3, 2, 1, 61); roof.position.set(-0.9, 1.95, -0.18); wagon.add(roof);
  for (let i = 0; i < 12; i++) W.add(P.at(P.tree(1.0, 70 + i), SR - 30 + i * 6 + 3, 0.25, 7.2));
  const sCarts = [];
  [[-12.6, 0], [-2.6, 1], [7.4, 2]].forEach(([x, k]) => { for (let j = 0; j < 2; j++) { const c = Q.fullCart(k * 3 + j); c.rotation.y = -Math.PI / 2; W.add(c); sCarts.push({c, x: SR + x + j * 0.9, k}); } });
  [['red', 'none', -16], ['teal', 'cap', -9], ['pink', 'none', -6], ['mustard', 'fedora', 1], ['student', 'cap', 4], ['clerk', 'none', 10], ['navy', 'bowler', 13]].forEach(([p, h, x], i) => person(p, h, SR + x, 0.25, 5.2 + (i % 2) * 1.1, 80 + i));
  W.add(P.at(P.car('#2f6db3', {seed: 1}), SR - 24, 0, 8.8), P.at(P.car('#e6d9b8', {seed: 2}), SR + 22, 0, 8.8), P.at(P.hydrant(), SR - 8, 0.25, 7.1), P.at(P.trashCan(), SR + 3, 0.25, 7.1), P.at(P.bench(), SR + 15, 0.25, 4.3));
  W.add(P.at(P.car('#c43d32', {seed: 3}), SR - 32, 0, 14.0, Math.PI), P.at(P.bus(), SR + 28, 0, 14.0, Math.PI));
  for (let i = 0; i < 7; i++) W.add(cloud(SR - 80 + i * 28, 55 + (i % 3) * 8, -150, 7));

  // ======================= GARAGE (ladder) =======================
  const GA = LOC.garage;
  W.add(room(GA, {w: 14, h: 4.6, d: 11, wall: '#b9c6d0', floor: '#8a8a88', seed: 71, tiles: true}));
  tube(W, GA - 2.5, -1, 4.45); tube(W, GA + 2.5, -1, 4.45);
  const walls = [[-6.2, -5.0, 9, 17, 2], [-6.6, -2.8, 2, 16, 2], [3.6, -5.0, 6, 17, 2], [5.6, -2.6, 2, 16, 2]];
  walls.forEach(([x, z, nx, ny, nz], i) => { const s = Q.caseStack(nx, ny, nz, 90 + i); s.position.set(GA + x, 0.05, z); W.add(s); });
  const cnt = Q.board(3.4, 1.4, 900, 370); cnt.position.set(GA + 0.6, 3.3, -4.95); W.add(cnt);
  const bench = box(2.4, 0.9, 0.8, '#7a5a3a', {x: GA + 1.6, y: 0.5, z: -1.6, thick: 0.02}); W.add(bench);
  const am = Q.addingMachine(); am.position.set(GA + 1.6, 0.95, -1.7); W.add(am);
  const receipt = Q.paperStrip(0.3, 1.5, '$3,000+'); receipt.position.set(GA + 1.6, 1.32, -1.38); receipt.rotation.x = -0.25; W.add(receipt);
  const k3000 = big('$3,000+', 1.4, 0.55, '#3f8f4a', '#ffffff'); k3000.position.set(GA + 1.6, 2.05, -1.3); W.add(k3000); only(k3000, 'ladder');
  const gaMan = hero(GA - 0.6, 0.05, -1.0, 12);
  W.add(P.at(P.toolRack(4), GA + 6.8, 0.05, 1.0, -Math.PI / 2), P.at(P.ladder(2.6), GA - 6.6, 0.05, 1.6), P.at(P.toolbox(), GA + 2.6, 0.95, -1.8), P.at(P.barrel('#2f6db3'), GA - 4.6, 0.05, 1.8));
  for (let i = 0; i < 10; i++) W.add(P.at(Q.puddingCup(1.6), GA + 0.7 + (i % 5) * 0.16, 0.95, -1.9 + Math.floor(i / 5) * 0.15));
  W.add(P.at(Q.cart(), GA - 2.6, 0.05, 1.0, 0.4));

  // ======================= COMMUNITY HALL (army) =======================
  const HA = LOC.hall;
  W.add(room(HA, {w: 20, h: 5.5, d: 14, wall: '#efe0c4', floor: '#a7764e', seed: 81}));
  for (const x of [-5, 0, 5]) for (const z of [-3, 2]) hang(W, HA + x, z, 4.9);
  const banner = big('THE SALVATION ARMY', 6.2, 0.9, '#c43d32', '#ffffff', {font: 'bold 110px Arial'}); banner.position.set(HA, 4.3, -6.85); W.add(banner);
  const vol = big('VOLUNTEERS', 2.6, 0.55, '#f2e6cc'); vol.position.set(HA - 5.6, 3.3, -6.85); W.add(vol);
  const volunteers = [];
  for (let row = 0; row < 3; row++) {
    const tb = Q.longTable(4.6, '#8a5a3b'); tb.position.set(HA - 0.4, 0.05, -4.4 + row * 2.2); W.add(tb);
    for (let i = 0; i < 18; i++) W.add(P.at(Q.puddingCup(1.6), HA - 2.4 + i * 0.24, 0.86, -4.5 + row * 2.2 + (i % 2) * 0.15));
    for (let k = 0; k < 3; k++) { const c = person(['teal', 'mustard', 'pink', 'red', 'student', 'clerk', 'navy', 'official', 'denim'][(row * 3 + k) % 9], ['none', 'cap', 'none'][k], HA - 1.9 + k * 1.5, 0.05, -5.15 + row * 2.2, 200 + row * 3 + k); volunteers.push(c); }
  }
  const bin = new THREE.Group(); bin.add(box(0.7, 0.55, 0.5, '#c9a06a', {y: 0.28, thick: 0.01})); const bl = sign('BARCODES', 0.6, 0.16, {bg: '#ffffff', w: 480, h: 128, font: 'bold 80px Arial', border: false}); bl.position.set(0, 0.32, 0.26); bin.add(bl); bin.position.set(HA + 2.4, 0.05, 0.6); W.add(bin);
  const flying = Array.from({length: 10}, (_, i) => { const b = Q.barcode(0.12); b.userData.k = [rng(i + 3)(), rng(i + 13)(), rng(i + 23)()]; W.add(b); only(b, 'army'); return b; });
  const donated = [0, 1, 2, 3, 4].map((i) => { const d = new THREE.Group(); d.add(box(0.6, 0.45, 0.45, '#c9a06a', {y: 0.23, thick: 0.01})); const l = sign('DONATED', 0.56, 0.16, {bg: '#3f8f4a', fg: '#ffffff', w: 448, h: 128, font: 'bold 80px Arial', border: false}); l.position.set(0, 0.25, 0.235); d.add(l); d.position.set(HA + 3.8 + (i % 3) * 0.65, 0.05 + Math.floor(i / 3) * 0.46, -0.6 + Math.floor(i / 3) * 0.05); W.add(d); only(d, 'army'); return d; });
  const armyMan = hero(HA - 3.6, 0.05, 1.6, 13);
  const capt = person('official', 'cap', HA - 2.6, 0.05, 1.5, 14);
  W.add(potPlant(HA + 9.2, -6), potPlant(HA - 9.2, -6), P.at(P.wallClock(), HA + 5.4, 3.6, -6.9), P.at(P.poster('HELP', 1.0, 1.3, '#f0c0b0'), HA + 7.6, 2.8, -6.9));
  for (let i = 0; i < 4; i++) W.add(P.at(Q.caseStack(1, 3, 1, 300 + i), HA - 8.6 + i * 0.6, 0.05, -2 + i * 0.4));

  // ======================= TAX OFFICE (tax) =======================
  const TX = LOC.tax;
  W.add(room(TX, {w: 14, h: 4.8, d: 10, wall: '#c6d4ea', floor: '#8a5a3b', seed: 91}));
  hang(W, TX - 2, -0.6, 4.2); hang(W, TX + 2.6, -0.6, 4.2);
  const td = P.desk(2.6, '#6b4430'); td.position.set(TX, 0.05, -1.6); W.add(td);
  const acct = person('suit', 'none', TX + 0.4, 0.05, -2.6, 92, {glasses: true});
  const txMan = hero(TX - 1.5, 0.05, -0.5, 15);
  const form = big('TAX FORM', 0.55, 0.7, '#f7f0de', INK, {font: 'bold 70px Arial'}); form.position.set(TX - 0.2, 1.1, -1.35); form.rotation.x = -Math.PI / 2 + 0.3; W.add(form);
  const stamp = big('~$800 WRITE-OFF', 1.7, 0.5, '#c43d32', '#ffffff', {font: 'bold 100px Arial'}); stamp.position.set(TX - 0.15, 1.6, -1.15); stamp.rotation.set(-0.15, 0, -0.08); W.add(stamp); only(stamp, 'tax');
  const dn = big('DONATION', 1.4, 0.45, '#3f8f4a', '#ffffff'); dn.position.set(TX - 2.4, 2.9, -4.85); W.add(dn); only(dn, 'tax');
  const tam = Q.addingMachine(); tam.position.set(TX + 0.9, 1.08, -1.5); W.add(tam);
  const tape = Q.paperStrip(0.25, 0.9, '800'); tape.position.set(TX + 0.9, 1.25, -1.38); tape.rotation.x = -0.6; W.add(tape);
  W.add(P.at(P.bookshelf(17, 2.4, 2.6), TX - 5.2, 0.05, -4.6), P.at(P.filingCabinet(), TX + 3.2, 0.05, -4.5), P.at(P.filingCabinet('#8f7d6a'), TX + 4.0, 0.05, -4.5));
  W.add(P.at(P.papers(6, 41), TX + 0.6, 1.08, -1.9), P.at(P.deskLamp(), TX - 1.0, 1.08, -1.9), P.at(P.mug(), TX + 1.3, 1.08, -1.8), P.at(P.wallClock(), TX + 1.2, 3.7, -4.92));
  W.add(P.at(P.poster('TAXES', 1.0, 1.3, '#e6d39a'), TX + 5.4, 2.8, -4.92), potPlant(TX + 6.0, 1.8), P.at(P.chair(), TX - 1.5, 0.05, -0.9, Math.PI));
  windowPane(W, TX - 6.9, 2.5, 0.4, 2.0, 1.5, Math.PI / 2, caliTex());
  person('clerk', 'none', TX + 4.6, 0.05, -2.0, 93);
  W.add(P.at(Q.caseStack(1, 2, 1, 51), TX - 3.4, 0.05, -1.0));

  // ======================= AIRPORT GATE (miles) =======================
  const AP = LOC.airport;
  W.add(ground(300, 220, '#9a9ca0', {x: AP, z: -40, seed: 101, repeat: 24}));
  W.add(box(60, 0.06, 12, '#c9c2b0', {x: AP, y: 0.03, z: 1, thick: 0.01, edges: false}));
  for (let i = -8; i < 8; i++) W.add(box(2.4, 0.07, 0.25, '#f2c12e', {x: AP + i * 5, y: 0.07, z: -9, edges: false, thick: 0.001}));
  for (let i = -3; i <= 3; i++) { const f = facade({w: 14, h: 10, color: ['#d8dde2', '#c9d2d8'][i & 1], cols: 4, rows: 2, seed: 500 + i, door: false, winW: 2.6, winH: 2.0}); f.position.set(AP + i * 14, 0, -30); W.add(f); }
  const tower = new THREE.Group(); tower.add(cyl(1.2, 1.6, 22, '#d8dde2', {y: 11, seg: 16, thick: 0.05}), cyl(3.2, 2.6, 3, '#2f4f6e', {y: 23.5, seg: 16, thick: 0.05}), cyl(3.4, 3.4, 0.6, '#d8dde2', {y: 25.3, seg: 16})); tower.position.set(AP + 34, 0, -42); W.add(tower);
  const jet1 = Q.jet(1); jet1.position.set(AP + 7, 2.4, -14); jet1.rotation.y = 0.5; W.add(jet1);
  const jet2 = Q.jet(1); jet2.position.set(AP - 30, 2.4, -20); jet2.rotation.y = -0.2; W.add(jet2);
  const jet3 = Q.jet(1); W.add(jet3); only(jet3, 'miles');
  const dep = Q.board(5.0, 2.6, 1000, 520); dep.position.set(AP, 3.6, -3.0); W.add(dep);
  for (const x of [-2.2, 2.2]) W.add(cyl(0.1, 0.1, 3.6, '#4a4a50', {x: AP + x, y: 1.8, z: -3.05, seg: 8}));
  const gate = big('GATE 12', 1.6, 0.5, '#2f4f6e', '#ffffff'); gate.position.set(AP - 3.6, 3.2, -2.9); W.add(gate);
  W.add(cyl(0.06, 0.06, 3.0, '#4a4a50', {x: AP - 3.6, y: 1.5, z: -3.0, seg: 8}));
  const card = Q.goldCard(); card.position.set(AP + 1.9, 2.0, -1.4); W.add(card); only(card, 'miles');
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 28), new THREE.MeshBasicMaterial({color: '#fff2a8', transparent: true, opacity: 0.5, depthWrite: false})); glow.position.set(AP + 1.9, 2.0, -1.5); W.add(glow); only(glow, 'miles');
  const aa = big('AMERICAN AIRLINES', 1.9, 0.32, '#f7f0de', '#2f4f6e', {font: 'bold 90px Arial'}); aa.position.set(AP + 1.9, 1.5, -1.38); W.add(aa); only(aa, 'miles');
  const apMan = hero(AP - 1.4, 0.05, -0.8, 16);
  const bag = S.briefcase(); bag.position.set(0.09, -0.5, 0.03); apMan.userData.armR.add(bag);
  [['suit', 'none', -4.6, 0.4], ['pink', 'none', 4.2, -0.2], ['navy', 'cap', 5.6, 1.0], ['student', 'none', -6.0, -1.2], ['mustard', 'fedora', 3.0, 1.8], ['teal', 'none', -3.0, 2.2]].forEach(([p, h, x, z], i) => person(p, h, AP + x, 0.05, z, 400 + i));
  for (let i = 0; i < 5; i++) W.add(P.at(P.bench(), AP - 8 + i * 4, 0.05, 3.2, Math.PI));
  for (let i = 0; i < 6; i++) W.add(P.at(P.cone(), AP - 10 + i * 4, 0.05, -7));
  for (let i = 0; i < 7; i++) W.add(cloud(AP - 80 + i * 28, 55 + (i % 3) * 8, -150, 7));

  // ======================= FILM SET (close) =======================
  const FS = LOC.stage;
  W.add(room(FS, {w: 22, h: 7, d: 14, wall: '#3f3a5a', floor: '#5a4a44', seed: 111}));
  W.add(box(6, 0.5, 3.5, '#6b4430', {x: FS, y: 0.25, z: -3.6, thick: 0.02}));
  const curtain = paintTex('#a8343a', {seed: 3, stripes: (gg, w, h) => { gg.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 16; i++) gg.fillRect(i * w / 16, 0, w / 32, h); }});
  W.add(new THREE.Mesh(new THREE.PlaneGeometry(10, 6), toon('#ffffff', curtain)).translateX(FS).translateY(3.2).translateZ(-6.9));
  const ped = cyl(0.45, 0.55, 0.9, '#f2e6cc', {x: FS, y: 0.95, z: -3.6, seg: 18, thick: 0.02}); W.add(ped);
  const starCup = Q.puddingCup(7, {bar: true}); starCup.position.set(FS, 1.4, -3.6); W.add(starCup);
  const sCone = Q.spotCone(5.2, 1.4, '#fff3c4', 0.18); sCone.position.set(FS, 6.6, -3.6); W.add(sCone);
  const dChair = S.dirChair(); dChair.position.set(FS - 3.6, 0.05, 2.6); dChair.rotation.y = -0.5; W.add(dChair);
  const fcam = Q.filmCamera(); fcam.position.set(FS - 2.4, 0.05, 1.4); fcam.rotation.y = Math.PI + 0.3; W.add(fcam);
  const clap = Q.clapper(); clap.position.set(FS + 1.3, 1.3, -1.2); W.add(clap);
  const clapper = person('student', 'cap', FS + 1.6, 0.05, -0.9, 120);
  for (const [x, z, ry] of [[-4.2, -1.0, 0.6], [4.2, -0.8, -0.6], [-6.5, -3.5, 0.9], [6.5, -3.5, -0.9]]) { const l = Q.filmLight(); l.position.set(FS + x, 0.05, z); l.rotation.y = ry; W.add(l); }
  const hw = big('HOLLYWOOD', 2.4, 0.6, '#f2c12e', INK); hw.position.set(FS, 5.4, -6.8); W.add(hw); only(hw, 'close');
  W.add(big('QUIET ON SET', 2.2, 0.5, '#c43d32', '#ffffff').translateX(FS - 6.5).translateY(4.4).translateZ(-6.85));
  person('suit', 'none', FS - 3.4, 0.05, 2.2, 121, {shades: true}); person('welder', 'cap', FS + 3.4, 0.05, 1.8, 122); person('teal', 'none', FS + 5.2, 0.05, -1.4, 123); person('pink', 'none', FS - 5.2, 0.05, 0.4, 124);
  W.add(P.at(Q.caseStack(2, 3, 1, 130), FS + 7.5, 0.05, -5.6), P.at(P.toolbox(), FS + 6.0, 0.05, 1.8), P.at(P.ladder(3), FS - 8.5, 0.05, -5.2));

  // ======================= per-frame =======================
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    for (const [o, keys] of shown) o.visible = keys.includes(shot);
    if (shot === 'hook') {
      // promo plane swoops across on "free flights"
      const k = ease(t, wordT('hook', 6), wordT('hook', 8.6));
      plane.position.set(ST - 6 + k * 7, 3.0 + Math.sin(k * Math.PI) * 0.5, 1.6); plane.rotation.z = Math.sin(t * 3) * 0.08;
      fly.position.set(plane.position.x - 1.3, plane.position.y - 0.05, 1.6);
      heroCup.rotation.y = t * 0.6;
      hookMan.userData.armR.rotation.z = 0.4 + Math.sin(t * 4) * 0.1;
    }
    if (shot === 'yousee') {
      y99.visible = pop(y99, t, wordT('yousee', 3), 0.3);
      cal.visible = pop(cal, t, wordT('yousee', 11), 0.3);
      dealB.visible = pop(dealB, t, wordT('yousee', 13.5), 0.3);
      youMan.userData.armR.rotation.z = t > wordT('yousee', 12) ? 1.9 : 0.6 + Math.sin(t * 3) * 0.1;
    }
    if (shot === 'deal') {
      slots.forEach((b, i) => { b.visible = pop(b, t, wordT('deal', 7.6 + i * 0.16), 0.2); });
      s500.visible = pop(s500, t, wordT('deal', 10), 0.3, 1 + 0.1 * Math.sin(t * 6));
    } else { slots.forEach((b) => { b.visible = true; b.scale.setScalar(1); }); s500.visible = true; s500.scale.setScalar(1); }
    if (shot === 'double') {
      const fM = wordT('double', 7);
      calA.visible = t < fM; calM.visible = pop(calM, t, fM, 0.3);
      const fD = wordT('double', 11);
      m500.visible = t < fD; m1000.visible = pop(m1000, t, fD, 0.3); x2.visible = pop(x2, t, fD + 0.1, 0.3);
      poMan.userData.armR.rotation.z = 1.2 * ease(t, wordT('double', 0), wordT('double', 1.5));
    }
    if (shot === 'but') {
      const k = ease(t, wordT('but', 9), wordT('but', 9.6));
      spot.visible = k > 0.02; spot.material.opacity = 0.25 * k; spot.scale.set(1, 1, 1);
      tag25.visible = pop(tag25, t, wordT('but', 12), 0.3);
      butMan.userData.armR.rotation.z = t > wordT('but', 9) ? 2.0 : 0;
    }
    if (shot === 'so') {
      wagon.position.set(lerp(SR - 20, SR + 12, ease(t, wordT('so', 0) - 0.3, wordT('so', 12.5))), 0, 9.6);
      sCarts.forEach(({c, x, k}, i) => { const t0 = wordT('so', [4.5, 7.5, 10.5][k]) + (i % 2) * 0.25; const kk = ease(t, t0, t0 + 1.2); c.position.set(x, 0.25, lerp(4.0, 6.4, kk)); c.visible = t > t0 - 0.05; });
    }
    if (shot === 'ladder') {
      const n = Math.floor(12150 * ease(t, wordT('ladder', 0), wordT('ladder', 5)) / 50) * 50;
      const done = t >= wordT('ladder', 5);
      cnt.userData.draw(done ? 'done' : n, (q, w, h) => { q.fillStyle = '#1d2326'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d9a441'; q.lineWidth = 14; q.strokeRect(7, 7, w - 14, h - 14); q.fillStyle = '#ffd66b'; q.font = 'bold 170px Arial'; q.textAlign = 'center'; q.fillText((done ? 12150 : n).toLocaleString('en-US'), w / 2, 210); q.fillStyle = '#f2e6cc'; q.font = 'bold 80px Arial'; q.fillText('CUPS', w / 2, 320); });
      const kr = ease(t, wordT('ladder', 6), wordT('ladder', 10)); receipt.userData.m.scale.y = Math.max(0.02, kr); receipt.userData.m.position.y = 0;
      k3000.visible = pop(k3000, t, wordT('ladder', 8), 0.3);
      gaMan.userData.armL.rotation.z = -1.6 * ease(t, wordT('ladder', 0), wordT('ladder', 2));
    } else cnt.userData.draw('done', (q, w, h) => { q.fillStyle = '#1d2326'; q.fillRect(0, 0, w, h); q.fillStyle = '#ffd66b'; q.font = 'bold 170px Arial'; q.textAlign = 'center'; q.fillText('12,150', w / 2, 210); q.fillStyle = '#f2e6cc'; q.font = 'bold 80px Arial'; q.fillText('CUPS', w / 2, 320); });
    if (shot === 'then') {
      bigBar.visible = pop(bigBar, t, wordT('then', 5), 0.3);
      handT.visible = pop(handT, t, wordT('then', 11.5), 0.3);
      const pk = ease(t, wordT('then', 9), wordT('then', 10.5));
      label.position.set(HM + 5.25 + pk * 0.15, 0.98 + pk * 0.28, -1.18 + pk * 0.08); label.rotation.set(-pk * 0.9, pk * 0.6, pk * 0.5);
      thenMan.userData.armR.rotation.z = 0.9 + Math.sin(t * 9) * 0.15;
      { const a1 = t * 7, a2 = t * 1.1; const [, h1, h2] = kClock.children; h1.position.set(Math.sin(a1) * 0.08, Math.cos(a1) * 0.08, 0.04); h1.rotation.z = -a1; h2.position.set(Math.cos(a2) * 0.06, -Math.sin(a2) * 0.06, 0.04); h2.rotation.z = -a2; }
    }
    if (shot === 'army') {
      const sh = ease(t, wordT('army', 3.5), wordT('army', 4.5));
      armyMan.userData.armR.rotation.z = 1.3 * sh; capt.userData.armL.rotation.z = -1.3 * sh;
      volunteers.forEach((c, i) => { c.userData.armR.rotation.z = 0.9 + Math.sin(t * 8 + i) * 0.25; });
      flying.forEach((b, i) => { const [a, bb, c] = b.userData.k; const life = (t * 0.7 + a) % 1; const v = volunteers[i % volunteers.length].position; b.position.set(lerp(v.x, HA + 2.4, life), 1.2 + Math.sin(life * Math.PI) * (0.8 + c), lerp(v.z + 0.5, 0.6, life)); b.rotation.set(life * 6 * a, life * 5 + bb, life * 3); b.visible = t > wordT('army', 9.5); });
      donated.forEach((d, i) => { d.visible = pop(d, t, wordT('army', 15 + i * 0.4), 0.3); });
    }
    if (shot === 'tax') {
      stamp.visible = pop(stamp, t, wordT('tax', 11), 0.25, 1 + 0.15 * (1 - ease(t, wordT('tax', 11), wordT('tax', 11) + 0.25)));
      dn.visible = pop(dn, t, wordT('tax', 0.2), 0.3);
      acct.userData.armR.rotation.z = t > wordT('tax', 10.5) && t < wordT('tax', 11.3) ? 2.0 : 0.6;
      tape.userData.m.scale.y = Math.max(0.05, ease(t, wordT('tax', 3), wordT('tax', 10)));
    }
    if (shot === 'miles') {
      const n = Math.floor(1200000 * ease(t, wordT('miles', 3.5), wordT('miles', 8)) / 1000) * 1000; const done = t >= wordT('miles', 8);
      dep.userData.draw(done ? 'd' : n, (q, w, h) => {
        q.fillStyle = '#14202a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f2c12e'; q.lineWidth = 14; q.strokeRect(7, 7, w - 14, h - 14);
        q.fillStyle = '#f2c12e'; q.font = 'bold 54px Arial'; q.textAlign = 'center'; q.fillText('DEPARTURES', w / 2, 80);
        q.fillStyle = '#ffffff'; q.font = 'bold 140px monospace'; q.fillText((done ? '1,200,000+' : n.toLocaleString('en-US')), w / 2, 280);
        q.fillStyle = '#9fe0b8'; q.font = 'bold 80px Arial'; q.fillText('MILES', w / 2, 400);
        q.fillStyle = '#7f8b95'; q.font = 'bold 34px monospace'; q.fillText('ON TIME · BOARDING · ON TIME', w / 2, 480);
      });
      const tc = wordT('miles', 11);
      card.visible = pop(card, t, tc, 0.35); card.rotation.y = Math.sin(t * 2) * 0.25; card.position.y = 2.0 + Math.sin(t * 2.5) * 0.04;
      glow.visible = t > tc; glow.material.opacity = 0.35 + 0.2 * Math.sin(t * 6); glow.scale.setScalar(0.9 + 0.1 * Math.sin(t * 6));
      aa.visible = pop(aa, t, wordT('miles', 14), 0.3);
      const k = (t - wordT('miles', 0)) / 6; jet3.position.set(AP - 40 + k * 40, 2.4 + Math.max(0, k - 0.6) * 25, -22); jet3.rotation.set(0, 0, Math.max(0, k - 0.6) * 0.3);
      apMan.userData.armL.rotation.z = t > tc ? -2.2 : -0.2;
    } else dep.userData.draw('d0', (q, w, h) => { q.fillStyle = '#14202a'; q.fillRect(0, 0, w, h); });
    if (shot === 'close') {
      hw.visible = pop(hw, t, wordT('close', 7), 0.3);
      const cs = t > wordT('close', 6.6) && t < wordT('close', 7.4);
      clap.userData.top.rotation.z = cs ? 0 : 0.5;
      fcam.userData.reels.forEach((r) => { r.rotation.x = t * 4; });
      starCup.rotation.y = t * 0.5;
      sCone.material.opacity = 0.12 + 0.1 * ease(t, wordT('close', 9), wordT('close', 10));
    }
  };

  return {group: W, update};
}
