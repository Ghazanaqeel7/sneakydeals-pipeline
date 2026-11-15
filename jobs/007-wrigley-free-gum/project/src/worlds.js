import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressStreet, dressPlaza} from './dress.js';
import * as P from './props.js';

export const LOC = {day: 300, shop: 600, gum: 700, books: 800, home: 900};

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


const F = 'bold 80px Arial, sans-serif';
export function gumPack(color = '#2e9e5c', s = 1) {
  const g = new THREE.Group();
  g.add(box(0.36, 0.62, 0.07, color, {thick: 0.015}));
  const f = sign('GUM', 0.3, 0.46, {bg: color, fg: '#ffffff', w: 150, h: 230, font: 'bold 70px Arial, sans-serif', border: false}); f.position.z = 0.05; g.add(f);
  g.scale.setScalar(s); return g;
}
function can(label, color = '#d9382e') {
  const g = new THREE.Group();
  g.add(cyl(0.24, 0.24, 0.55, color, {y: 0.28, seg: 14, thick: 0.015}));
  const f = sign(label, 0.34, 0.26, {bg: '#f7f0de', w: 200, h: 150, font: 'bold 38px Arial, sans-serif', border: false}); f.position.set(0, 0.28, 0.25); g.add(f);
  return g;
}
function soapBar(c = '#f2a7b8') { return box(0.5, 0.2, 0.3, c, {thick: 0.012}); }
function van() {
  const g = new THREE.Group();
  g.add(box(5, 2.1, 2.2, '#2f5d9e', {y: 1.45}), box(1.6, 1.3, 2.1, '#2f5d9e', {x: 3.2, y: 1.05}), box(1.1, 0.7, 2.15, '#bfe3f5', {x: 3.45, y: 1.5, edges: false}));
  const sg = sign('WRIGLEY GUM', 3.6, 0.9, {bg: '#f2e6cc', w: 720, h: 180, font: 'bold 80px Arial, sans-serif'}); sg.position.set(-0.3, 1.6, 1.13); g.add(sg);
  for (const x of [-1.6, 3.0]) { const w = cyl(0.5, 0.5, 2.3, '#2b2b2e', {x, y: 0.5, seg: 14}); w.rotation.x = Math.PI / 2; g.add(w); }
  return g;
}
function bookStack(n, seed) {
  const g = new THREE.Group(); const cs = ['#c9a227', '#b3261e', '#2f5d9e', '#d9a441'];
  for (let i = 0; i < n; i++) g.add(box(0.75, 0.16, 0.95, cs[(i + seed) % 4], {y: 0.1 + i * 0.17, ry: ((i * 7 + seed) % 5 - 2) * 0.04, thick: 0.012}));
  return g;
}
function globeTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#3d8fe0'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#5aa84f'; g.strokeStyle = INK; g.lineWidth = 5;
  const r = rng(5);
  for (let i = 0; i < 16; i++) { const x = r() * 1024, y = 70 + r() * 370, rw = 50 + r() * 90, rh = 35 + r() * 60; g.beginPath(); g.ellipse(x, y, rw, rh, r() * 3, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(x - 1024, y, rw, rh, 0, 0, 7); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}
function dressRoom(W, X, chars, {seed = 1, w = 16, d = 11, post = ['SALE', 'FRESH']} = {}) {
  const hd = d / 2;
  W.add(P.at(P.rug(6, 3.4, '#a8433a', '#e0b04a'), X, 0.05, 1.0));
  W.add(P.at(P.bookshelf(seed, 2.6, 2.8), X - 5.5, 0.05, -hd + 0.35), P.at(P.bookshelf(seed + 1, 2.6, 2.8), X + 5.2, 0.05, -hd + 0.35));
  W.add(P.at(P.wallClock(), X + 0.2, 4.6, -hd + 0.1));
  const p1 = P.poster(post[0], 1.1, 1.5, '#e6d39a'); P.at(p1, X + 3.2, 3.3, -hd + 0.07); W.add(p1);
  const p2 = P.poster(post[1], 1.1, 1.5, '#cfe3f0'); P.at(p2, X - 0.2, 3.3, -hd + 0.07); W.add(p2);
  W.add(P.at(P.filingCabinet('#8f7d6a'), X - 7.2, 0.05, -2.8), P.at(P.chair(), X + 6.8, 0.05, 2.0, 2.5));
  for (const x of [X - 3, X + 3]) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: 5.1, z: -1})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: 4.6, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, 4.45, -1); W.add(b); }
  const win = sign('', 2.2, 1.8, {bg: '#bfe3f5', border: true}); win.position.set(X - 7.9, 3.1, 1.5); win.rotation.y = Math.PI / 2; W.add(win);
}
function counter(W, X, chars) {
  W.add(box(7.2, 1.1, 1.3, '#8a5a3b', {x: X, y: 0.6, z: -1.8}), box(7.5, 0.12, 1.5, '#c9a074', {x: X, y: 1.2, z: -1.8}));
  const reg = box(0.7, 0.45, 0.5, '#5a5f66', {x: X + 2.8, y: 1.5, z: -1.9}); W.add(reg);
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const S = LOC.day;

  // ======== STREET (day) ========
  W.add(street(S, {seed: 23}));
  const traffic = dressStreet(W, S, {seed: 23, chars, avoid: [S - 12, S - 4, S + 2, S + 12]});
  dressPlaza(W, S, chars);
  W.add(ground(40, 30, '#d8cdb8', {x: S, z: -22, seed: 5, repeat: 5}));
  for (let i = 0; i < 7; i++) W.add(cloud(S - 80 + i * 28, 100 + (i % 3) * 10, -130, 7));
  const mk = (txt) => { const b = sign(txt, 9, 2.4, {bg: '#c43d32', fg: '#fff4dc', font: 'bold 104px Arial, sans-serif', w: 900, h: 240}); b.position.set(S, 6.2, -6); W.add(b); return b; };
  const ban1 = mk('1,500,000 HOMES'), ban2 = mk('7,000,000 HOMES');
  W.add(cyl(0.12, 0.14, 7.4, '#3a3a3a', {x: S - 4.9, y: 3.7, z: -6}), cyl(0.12, 0.14, 7.4, '#3a3a3a', {x: S + 4.9, y: 3.7, z: -6}));
  const vn = van(); vn.position.set(S + 2, 0, 9.0); W.add(vn);
  // mailboxes along the sidewalk + hero mailbox
  const MB = [];
  for (let i = 0; i < 9; i++) { const m = P.mailbox(); const x = S - 17 + i * 4.2; m.position.set(x, 0.25, 6.3); W.add(m); MB.push(x); }
  const big = P.mailbox(); big.scale.setScalar(1.9); big.position.set(S - 5.2, 0.25, 7.4); W.add(big);
  for (const [x, pal] of [[S - 8, 'navy'], [S + 6, 'teal'], [S + 11, 'red']]) { const c = character({palette: pal, hat: 'cap', seed: Math.round(x)}); c.position.set(x, 0.25, 5.2); W.add(c); chars.push(c); }
  const flyers = []; const NF = 46;
  for (let i = 0; i < NF; i++) { const p = gumPack(['#2e9e5c', '#e0533d', '#f2c12e'][i % 3], 1.15); W.add(p); flyers.push(p); }
  // globe
  const gl = new THREE.Group(); gl.position.set(S - 0.5, 0, -14);
  const gt = globeTex();
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 24), toon('#ffffff', gt)); ink(globe, 0.03, false); globe.position.y = 3.9; gl.add(globe);
  gl.add(cyl(0.5, 0.8, 1.4, '#6b4430', {y: 0.7}), cyl(0.2, 0.2, 1.3, '#6b4430', {y: 1.6}));
  const orbit = new THREE.Group(); orbit.position.y = 3.9; gl.add(orbit);
  for (let i = 0; i < 10; i++) { const p = gumPack(['#2e9e5c', '#e0533d', '#f2c12e'][i % 3], 1.4); p.userData.a = i / 10 * Math.PI * 2; orbit.add(p); }
  W.add(gl);

  // ======== SOAP SHOP ========
  const O = LOC.shop;
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#d9ecdf', seed: 8}));
  dressRoom(W, O, chars, {seed: 3, post: ['SOAP', 'FRESH']});
  counter(W, O, chars);
  const hero = character({palette: 'navy', hat: 'bowler', seed: 301}); hero.position.set(O, 0.05, -3.2); W.add(hero); chars.push(hero);
  const soapCrates = new THREE.Group(); for (let i = 0; i < 6; i++) soapCrates.add(crate('SOAP', {x: O - 5.8 + (i % 3) * 1.25, y: 0.65 + Math.floor(i / 3) * 1.25, z: -3.6, color: '#f2a7b8', s: 1.2}));
  W.add(soapCrates);
  const soaps = new THREE.Group(); for (let i = 0; i < 6; i++) { const b = soapBar(i % 2 ? '#f2a7b8' : '#f4e3a0'); b.position.set(O - 2.6 + (i % 3) * 0.6, 1.36 + Math.floor(i / 3) * 0.21, -1.8); soaps.add(b); } W.add(soaps);
  const cans1 = new THREE.Group(); for (let i = 0; i < 9; i++) { const c = can('POWDER'); c.position.set(O + 0.4 + (i % 3) * 0.6 + (Math.floor(i / 3) % 2) * 0.1, 1.26 + Math.floor(i / 3) * 0.56, -1.8 + (Math.floor(i / 3) % 2) * 0.1); cans1.add(c); } W.add(cans1);
  const soapSign = sign('SOAP', 4.2, 1.5, {bg: '#f2a7b8', w: 640, h: 230, font: 'bold 130px Arial, sans-serif'}); soapSign.position.set(O - 2.8, 3.8, -5.38); W.add(soapSign);
  const bpSign = sign('BAKING POWDER', 5.6, 1.5, {bg: '#e0533d', fg: '#fff4dc', w: 800, h: 220, font: 'bold 84px Arial, sans-serif'}); bpSign.position.set(O - 2.8, 3.8, -5.38); W.add(bpSign);
  const freeCard = sign('FREE POWDER WITH EVERY BAR', 3.0, 0.8, {bg: '#f2c12e', w: 640, h: 170, font: 'bold 46px Arial, sans-serif'}); freeCard.position.set(O - 1.0, 2.4, -1.4); W.add(freeCard);
  const cust1 = []; 
  for (const [dx, dz, pal, hat] of [[-2.4, 0.3, 'red', 'none'], [-0.2, 0.9, 'teal', 'cap'], [2.2, 0.2, 'pink', 'none'], [3.8, 1.2, 'mustard', 'bowler'], [-4.3, 1.4, 'student', 'cap']]) { const c = character({palette: pal, hat, seed: 310 + dx * 7}); c.position.set(O + dx, 0.05, dz); W.add(c); chars.push(c); cust1.push(c); }
  W.add(P.at(P.tree(0.7, 4), O + 7.0, 0.05, 3.8));

  // ======== GUM SHOP ========
  const G = LOC.gum;
  W.add(room(G, {w: 16, h: 5.5, d: 11, wall: '#fbe2b4', seed: 18}));
  dressRoom(W, G, chars, {seed: 9, post: ['MINT', 'FRUIT']});
  counter(W, G, chars);
  const hero2 = character({palette: 'navy', hat: 'bowler', seed: 301}); hero2.position.set(G, 0.05, -3.2); W.add(hero2); chars.push(hero2);
  const cans2 = new THREE.Group(); for (let i = 0; i < 9; i++) { const c = can('POWDER'); c.position.set(G - 2.4 + (i % 3) * 0.6, 1.26 + Math.floor(i / 3) * 0.56, -1.8); cans2.add(c); } W.add(cans2);
  const packs2 = new THREE.Group(); for (let i = 0; i < 8; i++) { const p = gumPack(['#2e9e5c', '#e0533d', '#f2c12e'][i % 3], 1.2); p.position.set(G + 0.5 + (i % 4) * 0.55, 1.55, -1.8 + Math.floor(i / 4) * 0.25); packs2.add(p); } W.add(packs2);
  const bpSign2 = sign('BAKING POWDER', 5.6, 1.5, {bg: '#e0533d', fg: '#fff4dc', w: 800, h: 220, font: 'bold 84px Arial, sans-serif'}); bpSign2.position.set(G - 2.8, 3.8, -5.38); W.add(bpSign2);
  const gumSign = sign('GUM', 4.2, 1.5, {bg: '#2e9e5c', fg: '#ffffff', w: 640, h: 230, font: 'bold 140px Arial, sans-serif'}); gumSign.position.set(G - 2.8, 3.8, -5.38); W.add(gumSign);
  const freeGum = sign('FREE GUM WITH EVERY ORDER', 3.0, 0.8, {bg: '#2e9e5c', fg: '#ffffff', w: 640, h: 170, font: 'bold 46px Arial, sans-serif'}); freeGum.position.set(G + 1.4, 2.4, -1.4); W.add(freeGum);
  const gumStack = new THREE.Group(); for (let i = 0; i < 6; i++) gumStack.add(crate('GUM', {x: G + 5.0 + (i % 3) * 1.25, y: 0.65 + Math.floor(i / 3) * 1.25, z: -3.6, color: '#7fd08f', s: 1.2})); W.add(gumStack);
  const cust2 = [];
  for (const [dx, dz, pal, hat] of [[-2.4, 0.3, 'red', 'none'], [-0.2, 0.9, 'teal', 'cap'], [2.2, 0.2, 'pink', 'none'], [3.8, 1.2, 'mustard', 'bowler'], [-4.3, 1.4, 'student', 'cap']]) { const c = character({palette: pal, hat, seed: 330 + dx * 7}); c.position.set(G + dx, 0.05, dz); W.add(c); chars.push(c); cust2.push(c); }
  W.add(P.at(P.tree(0.7, 6), G - 7.0, 0.05, 3.8));

  // ======== PHONE BOOK WAREHOUSE ========
  const B = LOC.books;
  W.add(room(B, {w: 24, h: 8, d: 12, wall: '#c9d3dc', floor: '#8a7a66', seed: 29}));
  for (let i = 0; i < 12; i++) { const st = bookStack(4 + (i * 3) % 7, i); st.position.set(B - 10 + i * 1.9 + (i % 2) * 0.3, 0.05, -4.6 + (i % 3) * 0.7); W.add(st); }
  for (let i = 0; i < 4; i++) { const st = bookStack(10 - i, i + 5); st.position.set(B + 5.6 + i * 1.1, 0.05, -1.2 - (i % 2) * 0.8); W.add(st); }
  for (let i = 0; i < 3; i++) W.add(P.at(P.pallet(), B - 7 + i * 3.2, 0.05, -2.2));
  const pbSign = sign('PHONE BOOKS', 6, 1.4, {bg: '#f2c12e', w: 840, h: 200, font: 'bold 100px Arial, sans-serif'}); pbSign.position.set(B - 2, 5.4, -5.9); W.add(pbSign);
  const yrSign = sign('1915', 3, 1.4, {bg: '#f2e6cc', w: 420, h: 200, font: 'bold 120px Arial, sans-serif'}); yrSign.position.set(B + 5, 5.4, -5.9); W.add(yrSign);
  for (const x of [B - 3, B + 3, B + 8]) { W.add(cyl(0.02, 0.02, 1.4, '#2b2b2e', {x, y: 7.2, z: -1})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(x, 6.4, -1); W.add(b); }
  W.add(P.at(P.ladder(3.4), B - 11.4, 0.05, -4.5), P.at(P.barrel('#2f6db3'), B + 10, 0.05, -4), P.at(P.barrel('#c43d32'), B + 10.9, 0.05, -4.6));
  const hero3 = character({palette: 'navy', hat: 'bowler', seed: 301}); hero3.position.set(B + 0.5, 0.05, -1.6); W.add(hero3); chars.push(hero3);
  const carry = bookStack(5, 2); carry.scale.setScalar(0.8); carry.position.set(0.1, -0.7, 0.45); hero3.userData.armR.add(carry); carry.rotation.z = -1.2;
  for (const [x, z, pal, s] of [[B - 4.5, -0.4, 'mustard', 341], [B + 4, 1.0, 'teal', 342], [B - 1.8, 1.2, 'red', 343]]) { const c = character({palette: pal, hat: 'cap', seed: s}); c.position.set(x, 0.05, z); W.add(c); chars.push(c); }

  // ======== HOME ========
  const H = LOC.home;
  W.add(room(H, {w: 14, h: 5.5, d: 10, wall: '#e8c9a8', floor: '#9a6a46', seed: 38}));
  dressRoom(W, H, chars, {seed: 14, w: 14, d: 10, post: ['HOME', 'SWEET']});
  const tbl = P.desk(2.6, '#7a4f33'); tbl.position.set(H, 0.05, -1.6); W.add(tbl);
  const ph = P.phone(); ph.scale.setScalar(2); ph.position.set(H - 0.6, 1.08, -1.6); W.add(ph);
  const hg = gumPack('#2e9e5c', 2.0); hg.position.set(H + 0.55, 1.5, -1.4); W.add(hg);
  const mum = character({palette: 'red', hat: 'none', seed: 351}); mum.position.set(H - 2.2, 0.05, -3.0); W.add(mum); chars.push(mum);
  const dad = character({palette: 'teal', hat: 'none', glasses: true, seed: 352}); dad.position.set(H + 2.2, 0.05, -2.9); W.add(dad); chars.push(dad);
  W.add(P.at(P.deskLamp(), H + 1.0, 1.08, -1.9), P.at(P.mug('#2f6db3'), H + 0.1, 1.08, -1.3), P.at(P.papers(4, 5), H - 0.2, 1.08, -1.9));

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    traffic(t, cam);
    // street
    const nfly = shot === 'hook' ? 20 : shot === 's09' ? 30 : shot === 's10' ? 34 : shot === 's12' ? 46 : 0;
    flyers.forEach((p, i) => {
      p.visible = i < nfly; if (!p.visible) return;
      const per = 1.5 + (i % 5) * 0.12, u = (((t + i * 0.37) % per) / per);
      const tx = MB[i % 9], x0 = S + 1 + ((i * 7) % 5 - 2) * 0.9;
      p.position.set(x0 + (tx - x0) * u, 2.9 + Math.sin(u * Math.PI) * 3.2 - u * 1.3, 9 + (6.5 - 9) * u);
      p.rotation.set(u * 9, u * 7, u * 5);
    });
    ban1.visible = shot === 's10'; ban2.visible = shot === 's12';
    const bA = shot === 's10' ? ease(t, wordT('s10', 0), wordT('s10', 0) + 0.4) : ease(t, wordT('s12', 8), wordT('s12', 8) + 0.4);
    ban1.scale.setScalar(Math.max(0.001, bA)); ban2.scale.setScalar(Math.max(0.001, bA));
    big.scale.setScalar(1.9 + (shot === 'hook' ? Math.max(0, Math.sin(t * 9)) * 0.06 : 0));
    gl.rotation.y = 0; globe.rotation.y = t * 0.6; orbit.rotation.y = t * 0.9;
    orbit.children.forEach((p) => { p.position.set(Math.cos(p.userData.a) * 3.6, Math.sin(p.userData.a * 2) * 0.8, Math.sin(p.userData.a) * 3.6); });
    // soap shop
    cust1.forEach((c, i) => { c.userData.armR.rotation.z = shot === 's03' && wordT('s03', 3) < t ? 2.3 + Math.sin(t * 7 + i) * 0.3 : 0; });
    freeCard.visible = shot === 's02' || shot === 's03';
    const dropS = wordT('s04', 3), showBP = wordT('s04', 6);
    const sSoap = t < dropS ? 1 : 1 - ease(t, dropS, dropS + 0.4); // before s04 soap sign = 1
    soapSign.visible = !(shot === 's04' && t > dropS + 0.4); soapSign.scale.setScalar(Math.max(0.001, shot === 's04' ? sSoap : 1));
    bpSign.visible = shot === 's04' && t > showBP - 0.1; bpSign.scale.setScalar(Math.max(0.001, ease(t, showBP, showBP + 0.4)));
    soapCrates.position.x = shot === 's04' ? -ease(t, dropS, dropS + 0.6) * 9 : 0; soapCrates.visible = shot !== 's04' || t < dropS + 0.7;
    soaps.visible = soapCrates.visible;
    // gum shop
    const dropB = wordT('s07', 3), gumAt = wordT('s07', 9), g5 = wordT('s05', 5);
    freeGum.visible = (shot === 's05' && t > g5) || shot === 's06' || shot === 's07'; freeGum.scale.setScalar(shot === 's05' ? Math.max(0.001, ease(t, g5, g5 + 0.4)) : 1);
    packs2.visible = (shot === 's05' && t > g5) || shot === 's06' || shot === 's07';
    cust2.forEach((c, i) => { c.userData.armR.rotation.z = shot === 's06' && wordT('s06', 3) < t ? 2.3 + Math.sin(t * 7 + i) * 0.3 : 0; });
    const cansOut = shot === 's07' ? ease(t, dropB, dropB + 0.6) : 0;
    cans2.position.x = -cansOut * 9; cans2.visible = shot !== 's07' || cansOut < 0.99;
    bpSign2.visible = shot !== 's07' || t < dropB + 0.4; bpSign2.scale.setScalar(Math.max(0.001, shot === 's07' ? 1 - ease(t, dropB, dropB + 0.4) : 1));
    gumSign.visible = shot === 's07' && t > gumAt - 0.1; gumSign.scale.setScalar(Math.max(0.001, ease(t, gumAt, gumAt + 0.4)));
    gumStack.visible = shot === 's07'; gumStack.children.forEach((c, i) => c.scale.setScalar(Math.max(0.001, ease(t, gumAt - 0.3 + i * 0.12, gumAt + 0.2 + i * 0.12))));
    // phone books
    hero3.userData.armR.rotation.z = shot === 's08' ? 1.2 + Math.sin(t * 5) * 0.1 : 0;
    // home: phone rings, gum pops
    const ring = shot === 's11' ? ease(t, wordT('s11', 6), wordT('s11', 6) + 0.1) * (1 - ease(t, wordT('s11', 9), wordT('s11', 9) + 0.2)) : 0;
    ph.position.x = H - 0.6 + Math.sin(t * 50) * 0.02 * ring; ph.position.y = 1.08 + Math.abs(Math.sin(t * 25)) * 0.04 * ring;
    hg.scale.setScalar(2.0 + (shot === 's11' ? ease(t, wordT('s11', 11), wordT('s11', 11) + 0.25) * 0.5 : 0));
    hg.rotation.z = shot === 's11' ? Math.sin(ease(t, wordT('s11', 11), wordT('s11', 11) + 0.6) * 12) * 0.15 : 0;
  };
  return {group: W, update};
}
