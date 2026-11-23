import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressStreet} from './dress.js';
import * as P from './props.js';

export const LOC = {shop: 0, desk: 100, lot: 300, ware: 600, home: 700, show: 800};

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

const mk = (g, ...c) => { c.forEach((x) => g.add(x)); return g; };
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
const WOOD = '#c99a62', WOOD2 = '#a97c48';

// table lying on its legs; flat top is 2.2 x 1.2; legs are children so they can be sawn off
function table(legH = 1.0) {
  const g = new THREE.Group(); const top = new THREE.Group(); g.add(top);
  top.add(box(2.2, 0.12, 1.2, WOOD, {y: legH}));
  const legs = [];
  for (const [x, z] of [[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]]) { const l = box(0.14, legH, 0.14, WOOD2, {x, y: legH / 2, z}); g.add(l); legs.push({m: l, x, z}); }
  g.userData = {top, legs, legH};
  return g;
}
function wagon() {
  const c = new THREE.Group();
  c.add(box(4.6, 0.55, 1.9, '#2f6db3', {y: 0.7}));
  c.add(box(1.5, 0.9, 1.9, '#2f6db3', {x: 1.5, y: 1.4}));            // hood + front cab
  c.add(box(4.6, 0.12, 1.9, '#4a4f58', {y: 2.1, x: 0}));            // roof
  for (const [x, z] of [[-2.2, 0.9], [-2.2, -0.9], [0.8, 0.9], [0.8, -0.9]]) c.add(box(0.12, 1.4, 0.12, '#2f6db3', {x, y: 1.4, z}));
  const gl = new THREE.MeshBasicMaterial({color: '#bfe3f5', transparent: true, opacity: 0.35});
  for (const z of [0.93, -0.93]) { const m = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 0.02), gl); m.position.set(-0.7, 1.45, z); c.add(m); }
  c.add(box(2.9, 0.08, 1.7, '#9a8a7a', {x: -0.75, y: 1.0}));       // cargo floor
  for (const [x, z] of [[1.5, 0.95], [1.5, -0.95], [-1.4, 0.95], [-1.4, -0.95]]) { const w = cyl(0.42, 0.42, 0.3, '#2b2b2e', {x, y: 0.42, z, seg: 14, thick: 0.02}); w.rotation.x = Math.PI / 2; c.add(w); }
  const hl = new THREE.MeshBasicMaterial({color: '#f4eecf'});
  for (const z of [0.6, -0.6]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), hl); h.position.set(2.28, 0.9, z); c.add(h); }
  return c;
}
function saw() { const s = new THREE.Group(); s.add(box(0.9, 0.16, 0.02, '#cfd3d8', {thick: 0.008}), box(0.22, 0.2, 0.06, '#8a4a2e', {x: -0.5, thick: 0.008})); return s; }
function flatBox(w = 1.6, d = 0.9, h = 0.16, label = 'FLAT PACK') {
  const tex = signTex(label, {bg: '#c9a46a', w: 256, h: 150, font: 'bold 40px Arial', border: true});
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [toon('#b8935a'), toon('#b8935a'), toon('#ffffff', tex), toon('#b8935a'), toon('#b8935a'), toon('#b8935a')]);
  ink(m, 0.015, true); return m;
}
function dust(seed, n = 90) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({color: '#f1d9a8', size: 0.12, sizeAttenuation: true});
  const pts = new THREE.Points(geo, mat); const r = rng(seed); const s = Array.from({length: n}, () => [r(), r(), r(), r()]);
  pts.userData.update = (t, o, on) => { pts.visible = on > 0.01; for (let i = 0; i < n; i++) { const [a, b, c, d] = s[i]; const life = (t * (0.6 + a) + d) % 1; pos[i * 3] = o[0] + (b - 0.5) * 1.6 * life; pos[i * 3 + 1] = o[1] + 0.5 * (1 - life) * c + 0.1; pos[i * 3 + 2] = o[2] + (c - 0.5) * 0.9 * life; } geo.attributes.position.needsUpdate = true; };
  return pts;
}
const person = (W, chars, pal, x, y, z, ry, o = {}) => { const c = character({palette: pal, hat: o.hat || 'none', glasses: !!o.glasses, seed: o.seed || 3}); c.position.set(x, y, z); c.rotation.y = ry; W.add(c); chars.push(c); return c; };
const shelfRow = (W, ox, z, n, y0 = 0.05) => { for (let i = 0; i < n; i++) W.add(at(P.bookshelf(5, 1.6, 2.2), ox - 9 + i * 2.2, y0, z)); };
const lamp = (W, x, z, h = 5.5) => { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: h - 0.4, z})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(x, h - 0.85, z); W.add(b); };

export function buildWorld() {
  const W = new THREE.Group(); const chars = [];

  // ======== SHOP: sawn table on a workbench (hook) ========
  const S = LOC.shop;
  W.add(room(S, {w: 18, h: 6, d: 12, wall: '#e8d2a8', floor: '#9b6a44', seed: 5}));
  const bench = P.desk(3.4, '#8a5a3b'); at(bench, S, 0.05, -1.5); W.add(bench);
  const hookTable = table(0.05); hookTable.userData.legs.forEach((l) => (l.m.visible = false)); hookTable.scale.set(0.8, 0.8, 0.8); at(hookTable, S - 0.3, 1.0, -1.5, 0.2); W.add(hookTable);
  const hookLegs = new THREE.Group(); for (let i = 0; i < 4; i++) { const l = box(0.14, 0.9, 0.14, WOOD2, {}); l.rotation.z = Math.PI / 2; l.position.set(S + 1.6 + (i % 2) * 0.1, 1.1 + i * 0.14, -1.3 + (i % 2) * 0.15); l.rotation.y = i * 0.5; hookLegs.add(l); } W.add(hookLegs);
  const hookSaw = saw(); at(hookSaw, S + 0.7, 1.45, -1.0, 0.4); W.add(hookSaw);
  const dustS = dust(7); W.add(dustS);
  W.add(at(P.toolRack(1), S - 6, 0, -5.9), at(P.toolRack(2), S + 6, 0, -5.9), at(P.ladder(3.4), S - 8, 0.05, -5.2), at(P.beamStack(4, 5), S + 7.5, 0.05, -3), at(P.barrel('#d9a441'), S - 7, 0.05, -3.4), at(P.toolbox(), S + 3.2, 0.05, 0.6, 0.3));
  for (let i = 0; i < 6; i++) W.add(box(0.12, 1.2 + (i % 3) * 0.3, 0.12, WOOD2, {x: S - 5 + i * 0.25, y: 0.7, z: -4.2, rz: 0})); 
  W.add(at(P.poster('SKETCH', 1.1, 1.5, '#e6d39a'), S - 2.5, 3.3, -5.9), at(P.wallClock(), S + 3, 4.6, -5.9)); lamp(W, S - 3, -1); lamp(W, S + 3, -1);
  person(W, chars, 'mustard', S + 3.2, 0.05, -3.4, -0.3, {hat: 'cap', seed: 11});
  person(W, chars, 'navy', S - 3.6, 0.05, -2.0, 0.5, {seed: 12});

  // ======== DESK: designer at his drawing table (s02) ========
  const D = LOC.desk;
  W.add(room(D, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const dd = P.desk(3.0, '#8a5a3b'); at(dd, D - 1.5, 0.05, 0.4); W.add(dd);
  W.add(at(P.chair('#3e5a7a'), D - 1.5, 0.05, -0.9), at(P.papers(8, 5), D - 2.0, 1.02, 0.4), at(P.deskLamp(), D - 3.0, 1.02, 0.2), at(P.mug(), D - 0.6, 1.02, 0.7));
  const tmod = table(0.2); tmod.scale.setScalar(0.18); at(tmod, D - 0.9, 1.02, 0.3, 0.4); W.add(tmod);
  W.add(at(P.bookshelf(5), D - 6, 0.05, -5.1), at(P.bookshelf(4), D + 0.5, 0.05, -5.1), at(P.filingCabinet(), D + 6.4, 0.05, -5.0), at(P.bookshelf(6, 2.0, 2.4), D - 7.75, 0.05, -1.5, Math.PI / 2));
  const flagS = sign('SWEDEN', 3.4, 1.0, {bg: '#2f6db3', fg: '#f2c12e', w: 680, h: 200, font: 'bold 100px Arial'}); at(flagS, D + 3.6, 3.7, -5.4); W.add(flagS);
  const dsk = sign('IKEA DESIGN', 3.0, 0.8, {bg: '#f4ead4', w: 600, h: 160, font: 'bold 72px Arial'}); at(dsk, D - 2.2, 3.4, -5.4); W.add(dsk);
  W.add(at(P.wallClock(), D + 1.6, 4.7, -5.4), at(P.poster('CHAIRS', 1.1, 1.5, '#cfe3f0'), D + 5.3, 3.3, -5.4)); lamp(W, D - 3, -1); lamp(W, D + 3, -1);
  const d2 = P.desk(2.0, '#7a4f33'); at(d2, D + 5.0, 0.05, -2.2); W.add(d2, at(P.papers(5, 9), D + 4.9, 1.05, -2.2), at(P.deskLamp(), D + 5.7, 1.05, -2.4));
  person(W, chars, 'teal', D + 3.2, 0.05, -2.2, 0.3, {glasses: true, seed: 21});
  const gillis = person(W, chars, 'engineer', D - 1.5, 0.05, -1.0, 0, {glasses: true, hat: 'none', seed: 22});

  // ======== LOT: street, wagon, table (s03-s05, s12) ========
  const L = LOC.lot;
  W.add(street(L, {seed: 23}));
  const trafficL = dressStreet(W, L, {seed: 23, chars, avoid: [L, L + 3]});
  for (let i = 0; i < 6; i++) W.add(cloud(L - 70 + i * 28, 100 + (i % 3) * 10, -130, 7));
  const car = wagon(); at(car, L + 2.5, 0.25, 8.4, 0); W.add(car);   // faces +x, parked at the curb
  const lotTable = table(1.0); W.add(lotTable);
  const lotLegsOff = new THREE.Group(); W.add(lotLegsOff);
  const lotSaw = saw(); W.add(lotSaw);
  const dustL = dust(9); W.add(dustL);
  const gil2 = person(W, chars, 'engineer', L - 3.2, 0.25, 6.6, 0.4, {glasses: true, seed: 22});
  const passer = person(W, chars, 'red', L + 5.5, 0.25, 5.4, -0.5, {hat: 'cap', seed: 31});
  const sw = sign('FURNITURE', 6, 1.4, {bg: '#f4ead4', w: 640, h: 150, font: 'bold 84px Arial'}); at(sw, L, 6.2, 3.55); W.add(sw);

  // ======== WAREHOUSE (s06, s07) ========
  const A = LOC.ware;
  W.add(room(A, {w: 28, h: 9, d: 15, wall: '#d7d0c0', floor: '#7d7a78', seed: 31}));
  for (let i = 0; i < 4; i++) W.add(at(P.pallet(), A - 10 + i * 2.2, 0.05, -5));
  // big assembled furniture, stacked, a few tilted
  const bigStuff = []; const labels = ['WARDROBE', 'SOFA', 'TABLE', 'BED', 'DRESSER'];
  for (let i = 0; i < 9; i++) { const c = crate(labels[i % 5], {x: A - 11 + (i % 5) * 2.9, y: 1.0 + Math.floor(i / 5) * 2.1, z: -4.8 + (i % 2) * 1.8, ry: (i % 3 - 1) * 0.12, s: 2.0 + (i % 3) * 0.3, color: ['#b98a52', '#a97c48', '#c4a27c'][i % 3], stamp: i % 3 === 0 ? 'DAMAGED' : null}); W.add(c); bigStuff.push(c); }
  const tumble = crate('SOFA', {x: A - 1, y: 3.2, z: -2.4, s: 2.2, color: '#9e7b66', stamp: 'DAMAGED'}); W.add(tumble);
  const bigSofa = new THREE.Group(); mk(bigSofa, box(3.2, 0.9, 1.3, '#7a4f73', {y: 0.5}), box(3.2, 1.1, 0.3, '#67425f', {y: 1.2, z: -0.5}), box(0.3, 0.7, 1.3, '#67425f', {x: -1.5, y: 1.0}), box(0.3, 0.7, 1.3, '#67425f', {x: 1.5, y: 1.0})); at(bigSofa, A + 4, 0.05, -1.8, 0.3); W.add(bigSofa);
  const truck = car.clone(); truck.scale.set(1.5, 1.5, 1.4); at(truck, A + 9.5, 0.05, 2.0, Math.PI - 0.5); W.add(truck);
  // flat boxes stack that grows during s07
  const flats = []; for (let i = 0; i < 14; i++) { const f = flatBox(2.2, 1.2, 0.22); const col = i % 4; f.position.set(A - 8 + (i % 7) * 0.0 + (Math.floor(i / 7)) * 2.6, 0.2 + (i % 7) * 0.24, 2.2); f.visible = false; W.add(f); flats.push(f); }
  const flatsBack = []; for (let i = 0; i < 18; i++) { const f = flatBox(2.2, 1.2, 0.22); f.position.set(A - 3 + Math.floor(i / 9) * 2.6, 0.2 + (i % 9) * 0.24, 1.0); f.visible = false; W.add(f); flatsBack.push(f); }
  W.add(at(P.toolRack(1), A + 12, 0, -7.0)); lamp(W, A - 6, 0, 8.5); lamp(W, A + 6, 0, 8.5); lamp(W, A, -3, 8.5);
  const wk1 = person(W, chars, 'welder', A - 7.5, 0.05, 4.2, 0.4, {hat: 'cap', seed: 41}); const wk2 = person(W, chars, 'navy', A + 4.4, 0.05, 3.0, -0.5, {hat: 'cap', seed: 42}); person(W, chars, 'official', A + 6.8, 0.05, 4.6, 0.1, {seed: 43, glasses: true});
  const sad = sign('BIG AND BULKY', 4.4, 0.9, {bg: '#f2c12e', w: 760, h: 160, font: 'bold 70px Arial'}); at(sad, A - 6, 6.2, -7.3); W.add(sad);
  const sflat = sign('FLAT = EASY', 4.0, 0.9, {bg: '#bfe0db', w: 700, h: 160, font: 'bold 70px Arial'}); at(sflat, A + 7, 6.2, -7.3); W.add(sflat);

  // ======== HOME (s09) ========
  const H = LOC.home;
  W.add(room(H, {w: 16, h: 5.5, d: 11, wall: '#f0d9c0', floor: '#b0845c', seed: 12}));
  W.add(at(P.rug(7, 4.5, '#2f8f8a', '#e0b04a'), H, 0.02, 0.5));
  const homeT = table(1.0); homeT.userData.legs.forEach((l) => (l.m.visible = false)); at(homeT, H - 0.2, 0.05, 0.4, 0.2); W.add(homeT);
  const legsH = []; for (let i = 0; i < 4; i++) { const l = box(0.14, 1.0, 0.14, WOOD2, {}); l.rotation.z = 1.5; l.position.set(H + 1.7 + i * 0.05, 0.12 + i * 0.14, 0.4 + (i - 1.5) * 0.28); W.add(l); legsH.push(l); }
  const openBox = flatBox(2.2, 1.2, 0.2, 'LÖVET'); at(openBox, H - 2.8, 0.15, 1.8, 0.3); W.add(openBox);
  W.add(at(P.bookshelf(5), H - 6, 0.05, -5.1), at(P.bookshelf(4), H + 5.5, 0.05, -5.1), at(P.chair('#c4793d'), H + 3.5, 0.05, -2.4, 0.4), at(P.deskLamp(), H + 3.5, 0.05, -3.8), at(P.wallClock(), H + 1, 4.6, -5.4), at(P.poster('HOME', 1.1, 1.5, '#e6d39a'), H - 3, 3.3, -5.4), at(P.toolbox(), H + 3.6, 0.05, 1.6, 0.4)); lamp(W, H - 3, -1); lamp(W, H + 3, -1);
  const win = sign('', 2.4, 2.0, {bg: '#bfe3f5', border: true}); at(win, H + 4.5, 3.1, -5.4); W.add(win);
  const h1 = person(W, chars, 'teal', H - 1.8, 0.05, -0.8, 0.3, {seed: 51}); const h2 = person(W, chars, 'pink', H + 1.6, 0.05, -0.6, -0.4, {glasses: true, seed: 52});
  const hexK = box(0.3, 0.04, 0.04, '#cfd3d8', {thick: 0.005}); hexK.position.set(0.1, -0.45, 0.06); h1.userData.armR.add(hexK);

  // ======== SHOWROOM (s08, s10, s11) ========
  const R = LOC.show;
  W.add(room(R, {w: 30, h: 8, d: 16, wall: '#f4ead4', floor: '#c9b894', seed: 61}));
  const pedestal = box(3.0, 0.2, 2.0, '#efe7d2', {x: R - 3, y: 0.15, z: -3}); W.add(pedestal);
  const showT = table(1.0); at(showT, R - 3, 0.25, -3, 0.2); W.add(showT);
  const price = sign('LÖVET', 2.2, 0.9, {bg: '#f2c12e', w: 440, h: 180, font: 'bold 84px Arial'}); at(price, R - 3, 2.9, -3.2); W.add(price);
  const priceB = sign('LÖVBACKEN', 3.2, 0.9, {bg: '#f2c12e', w: 640, h: 180, font: 'bold 72px Arial'}); at(priceB, R - 3, 2.9, -3.2); priceB.visible = false; W.add(priceB);
  const showFlat = flatBox(1.6, 0.9, 0.18, 'LEGS INSIDE'); at(showFlat, R - 5.4, 0.3, -2.2, 0.3); W.add(showFlat);
  const ped2 = box(3.0, 0.2, 2.0, '#efe7d2', {x: R + 4, y: 0.15, z: -3}); W.add(ped2);
  const showT2 = table(0.75); showT2.scale.set(1, 1, 1); at(showT2, R + 4, 0.25, -3, -0.3); W.add(showT2);
  const sdisp = sign('FLAT PACK', 5.4, 1.2, {bg: '#bfe0db', w: 720, h: 160, font: 'bold 84px Arial'}); at(sdisp, R, 6.4, -7.7); W.add(sdisp);
  const fs1 = sign('IKEA', 3.0, 1.0, {bg: '#f4ead4', w: 480, h: 160, font: 'bold 96px Arial'}); at(fs1, R + 9, 5.4, -7.7); W.add(fs1);
  for (let i = 0; i < 6; i++) { W.add(at(P.bookshelf(4, 1.6, 2.2), R - 13 + i * 1.8, 0.05, -7.2)); }
  W.add(at(P.rug(8, 4, '#c43d32', '#f2d36b'), R + 0.5, 0.02, 3));
  for (let i = 0; i < 5; i++) W.add(at(P.tree(0.9, 90 + i), R - 11 + i * 5.5, 0.05, 6.8));
  lamp(W, R - 8, -1, 7.5); lamp(W, R + 8, -1, 7.5); lamp(W, R, 3, 7.5);
  const cust = []; for (let i = 0; i < 9; i++) { const pal = ['red', 'teal', 'mustard', 'pink', 'navy', 'student', 'clerk', 'official', 'welder'][i]; const c = person(W, chars, pal, R - 9 + i * 2.2 + (i % 2) * 0.6, 0.05, 1.8 + (i % 3) * 1.4, (i % 2 ? 0.4 : -0.4), {hat: i % 3 === 0 ? 'cap' : 'none', glasses: i % 4 === 0, seed: 70 + i}); if (i % 2 === 0) { const fb = flatBox(0.9, 0.55, 0.14); fb.position.set(0.1, -0.5, 0.12); fb.rotation.x = 1.3; c.userData.armR.add(fb); } cust.push(c); }
  const gillS = person(W, chars, 'engineer', R - 0.4, 0.05, -4.2, -0.2, {glasses: true, seed: 22});

  // ======== per-frame update ========
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    trafficL(t, cam);
    // hook: saw rocks, dust floats
    hookSaw.position.x = S + 0.7 + Math.sin(t * 14) * 0.12; dustS.userData.update(t, [S + 0.9, 1.1, -1.0], shot === 'hook' ? 1 : 0);
    // designer at desk: writes
    gillis.userData.armR.rotation.z = shot === 's02' ? 0.9 + Math.sin(t * 7) * 0.2 : 0;
    // ---- lot: table too big, saw, legs fall, table fits ----
    const lt = lotTable, U = lt.userData; lt.scale.setScalar(1.3);
    const tSaw = wordT('s04', 2), tLegs = wordT('s04', 5), tFit0 = wordT('s05', 0), tFit1 = wordT('s05', 3);
    const legsOff = t >= tLegs - 0.2, fit = ease(t, tFit0, tFit1), done = t >= wordT('s12', 0) - 4;
    const bumpT = ease(t, wordT('s03', 11), wordT('s03', 13));
    const bx = L - 5.4 + 1.6 * ease(t, wordT('s03', 5), wordT('s03', 11)) - 0.15 * Math.sin(bumpT * Math.PI * 3);
    U.legs.forEach((l) => { l.m.visible = !legsOff; });
    U.top.position.y = legsOff ? -(U.legH - 0.05) : 0;
    const fx = car.position.x - 0.75, fy = 1.29;
    const sx = (t < tFit0) ? bx : bx + (fx - bx) * fit, sy = (t < tFit0) ? 0.25 : 0.25 + (fy - 0.25) * fit, sz = (t < tFit0) ? 6.4 : 6.4 + (car.position.z - 6.4) * fit;
    lt.position.set(sx, sy, sz); lt.rotation.set(0, 0.25 * (1 - fit), 0);
    if (t >= tFit1) lt.position.set(fx, fy, car.position.z);
    lotLegsOff.clear(); lotLegsOff.visible = legsOff;
    if (legsOff) for (let i = 0; i < 4; i++) { const l = box(0.18, 1.3, 0.18, WOOD2, {}); l.rotation.z = Math.PI / 2; l.rotation.y = i * 0.6; l.position.set(L - 5.6 + (i % 2) * 0.4, 0.3 + Math.floor(i / 2) * 0.18, 7.8 + (i % 2) * 0.5); lotLegsOff.add(l); }
    lotSaw.visible = shot === 's04';
    lotSaw.position.set(bx - 1.25 + Math.sin(t * 16) * 0.12, 0.9, 7.1); lotSaw.rotation.set(0, 0.3, 0.0);
    dustL.userData.update(t, [bx - 1.2, 0.5, 7.0], shot === 's04' ? ease(t, tSaw - 0.2, tSaw) * (1 - ease(t, tLegs, tLegs + 0.4)) : 0);
    gil2.position.set((t < tFit0 ? bx : 296.2) - 2.0, 0.25, 6.6);
    gil2.userData.armR.rotation.z = shot === 's04' ? 1.2 + Math.sin(t * 16) * 0.5 : shot === 's05' ? 2.4 + Math.sin(t * 6) * 0.3 : 0;
    // wagon rolls away in the closing shot
    const drive = shot === 's12' ? ease(t, wordT('s12', 9), wordT('s12', 15)) : 0;
    car.position.x = L + 2.5 + drive * 22;
    if (t >= tFit1) lt.position.x = car.position.x - 0.75;
    // warehouse
    const crashT = wordT('s06', 12);
    tumble.rotation.z = shot === 's06' ? -ease(t, crashT, crashT + 0.5) * 0.9 : 0; tumble.position.y = 3.2 - (shot === 's06' ? ease(t, crashT, crashT + 0.5) * 1.1 : 0);
    const n1 = shot === 's07' ? Math.floor(14 * ease(t, wordT('s07', 0), wordT('s07', 4))) : (t > wordT('s07', 5) ? 14 : 0);
    flats.forEach((f, i) => { f.visible = i < n1; }); flatsBack.forEach((f, i) => { f.visible = i < Math.floor(n1 * 18 / 14); });
    bigSofa.visible = shot !== 's07'; bigStuff.forEach((b, i) => { b.visible = shot !== 's07' || i > 100; }); tumble.visible = shot !== 's07'; sad.visible = shot !== 's07'; sflat.visible = shot === 's07';
    // home: legs get screwed on one by one
    const nl = Math.floor(5 * ease(t, wordT('s09', 0), wordT('s09', 8)));
    homeT.userData.legs.forEach((l, i) => { l.m.visible = i < nl; }); legsH.forEach((l, i) => { l.visible = i >= nl; });
    h1.userData.armR.rotation.z = shot === 's09' ? 1.1 + Math.sin(t * 9) * 0.5 : 0; h2.userData.armL.rotation.z = shot === 's09' ? 1.6 + Math.sin(t * 5) * 0.25 : 0;
    // showroom: the original table, then its comeback
    price.visible = t < wordT('s11', 9); priceB.visible = !price.visible;
    // sawdust keeps flying in the hook only; salary of events done
  };
  return {group: W, update};
}
