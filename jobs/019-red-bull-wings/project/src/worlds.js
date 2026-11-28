import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressStreet, dressPlaza} from './dress.js';
import * as P from './props.js';

export const LOC = {street: 300, store: 600, cafe: 1000, court: 700, board: 800, claim: 900};

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

// ---------- Red Bull props ----------
const canTexCache = {};
function canTex() {
  if (canTexCache.t) return canTexCache.t;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#2b5ea8'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#c9d3dc'; g.fillRect(0, 128, 512, 128);
  g.fillStyle = '#e8c23a'; g.fillRect(0, 118, 512, 22);
  g.fillStyle = '#ffffff'; g.font = 'bold 44px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('RED BULL', 256, 70); g.fillStyle = '#c43d32'; g.font = 'bold 30px Arial, sans-serif'; g.fillText('ENERGY DRINK', 256, 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; canTexCache.t = t; return t;
}
function can(s = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.48, 18), toon('#ffffff', canTex()));
  body.rotation.y = Math.PI; body.position.y = 0.24; ink(body, 0.008, false); g.add(body);
  g.add(cyl(0.135, 0.15, 0.03, '#b9c3cc', {y: 0.49, seg: 18, thick: 0.004}), cyl(0.15, 0.15, 0.02, '#b9c3cc', {y: 0.01, seg: 18, thick: 0.004}));
  g.scale.setScalar(s); return g;
}
function cashStack(n = 3, s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { g.add(box(0.5, 0.18, 0.28, '#6fae6a', {x: (i % 2) * 0.02, y: 0.09 + i * 0.19, z: 0, thick: 0.012})); g.add(box(0.12, 0.185, 0.29, '#efe7d2', {y: 0.09 + i * 0.19, thick: 0.004, edges: false})); }
  g.scale.setScalar(s); return g;
}
function wings() {
  const g = new THREE.Group();
  for (const sd of [-1, 1]) {
    const w = new THREE.Group();
    for (let i = 0; i < 4; i++) { const f = box(0.7 - i * 0.08, 0.14, 0.03, '#ffffff', {x: sd * (0.35 - i * 0.04), y: -i * 0.13, thick: 0.01}); w.add(f); }
    w.position.set(sd * 0.22, 1.2, -0.15); w.userData.sd = sd; g.add(w);
  }
  return g;
}
function shelfUnit(ox, x, z, rows = 4, n = 7) {
  const g = new THREE.Group();
  g.add(box(4.2, 3.2, 0.5, '#7b5a40', {x, y: 1.7, z: z - 0.1}));
  for (let r = 0; r < rows; r++) {
    g.add(box(4.1, 0.06, 0.7, '#cfc4a8', {x, y: 0.55 + r * 0.7, z, thick: 0.01}));
    for (let i = 0; i < n; i++) { const c = can(1); c.position.set(x - 1.8 + i * 0.6, 0.58 + r * 0.7, z + 0.05); g.add(c); }
  }
  return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const mk = (pal, hat, x, y, z, seed, {glasses = false, ry = 0} = {}) => { const c = character({palette: pal, hat, glasses, seed}); c.position.set(x, y, z); c.rotation.y = ry; W.add(c); chars.push(c); return c; };

  // ======== STREET (hook, s02, s12) ========
  const S = LOC.street;
  W.add(street(S, {seed: 23}));
  const trafficD = dressStreet(W, S, {seed: 23, chars, avoid: [S, S + 2, S - 3.5]});
  dressPlaza(W, S, chars);
  W.add(ground(40, 30, '#d8cdb8', {x: S, z: -22, seed: 5, repeat: 5}));
  for (let i = 0; i < 7; i++) W.add(cloud(S - 80 + i * 28, 100 + (i % 3) * 10, -130, 7));
  const bigCan = can(5.2); bigCan.position.set(S, 0.25, 6.4); W.add(bigCan);
  const bannerS = sign('GIVES YOU WINGS', 8.4, 1.7, {bg: '#2b5ea8', fg: '#ffffff', w: 900, h: 190, font: 'bold 96px Arial, sans-serif'});
  bannerS.position.set(S, 7.0, 6.0); W.add(bannerS);
  W.add(cyl(0.12, 0.14, 7.6, '#3a3a3a', {x: S - 4.5, y: 3.8, z: 6.0}), cyl(0.12, 0.14, 7.6, '#3a3a3a', {x: S + 4.5, y: 3.8, z: 6.0}));
  const bag = new THREE.Group(); bag.add(cashStack(3, 2.2), cashStack(2, 2.2)); bag.children[1].position.set(0.9, 0, 0.3); bag.position.set(S + 3.2, 0.25, 7.2);
  const bagSign = sign('$13,000,000', 3.4, 0.9, {bg: '#f2e6cc', w: 680, h: 180, font: 'bold 90px Arial, sans-serif'}); bagSign.position.set(0, 2.2, 0.4); bag.add(bagSign); W.add(bag);
  const exec = mk('clerk', 'bowler', S - 3.2, 0.25, 7.6, 41, {glasses: true});
  const wingMan = mk('student', 'cap', S + 6.2, 0.25, 8.6, 51); const wg = wings(); wingMan.add(wg);
  const wingSign = sign('NO WINGS', 1.1, 0.5, {bg: '#f2e6cc', w: 330, h: 150, font: 'bold 62px Arial, sans-serif'}); wingSign.position.set(0, 0.55, 0.3); wingMan.add(wingSign);
  mk('teal', 'none', S - 1.5, 0.25, 9.2, 52); mk('red', 'cap', S + 4.2, 0.25, 9.0, 53);

  // ======== STORE (s03) ========
  const T = LOC.store;
  W.add(room(T, {w: 18, h: 5.5, d: 11, wall: '#e6d9b8', floor: '#8a8f93', seed: 31}));
  for (const x of [-5.6, -1.2, 3.2]) W.add(shelfUnit(T, T + x, -4.7));
  W.add(P.at(P.rug(6, 3, '#2b5ea8', '#e8c23a'), T, 0.05, 0.5));
  const hang = sign('ENERGY DRINKS', 4.8, 0.9, {bg: '#c43d32', fg: '#fff4dc', w: 800, h: 170, font: 'bold 86px Arial, sans-serif'}); hang.position.set(T - 1.2, 4.6, -4.4); W.add(hang);
  const stand = sign('GIVES YOU WINGS', 1.7, 2.3, {bg: '#2b5ea8', fg: '#fff', w: 340, h: 460, font: 'bold 58px Arial, sans-serif', sub: 'Performance + Concentration'});
  stand.position.set(T + 2.6, 1.4, -1.6); stand.rotation.y = -0.3; W.add(stand);
  const standLegs = cyl(0.04, 0.04, 0.4, '#3a3a3a', {x: T + 2.6, y: 0.25, z: -1.6}); W.add(standLegs);
  const fridge = box(1.6, 2.6, 1.0, '#cfd8dc', {x: T + 7.2, y: 1.35, z: -3.8}); W.add(fridge);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) { const c = can(0.9); c.position.set(T + 6.8 + i * 0.4, 0.5 + r * 0.55, -3.25); W.add(c); }
  W.add(P.at(P.wallClock(), T + 6.5, 4.6, -5.4));
  const counter = box(3.4, 1.0, 1.2, '#7b5a40', {x: T - 6.4, y: 0.55, z: -1.8}); W.add(counter);
  mk('mustard', 'cap', T - 6.4, 0.05, -3.0, 61);
  const shopper = mk('engineer', 'none', T + 0.2, 0.05, -1.0, 62);
  const heldCan = can(1.1); heldCan.position.set(0.22, 0.7, 0.12); shopper.userData.armR.add(heldCan); heldCan.position.set(0.1, -0.5, 0.1);
  mk('pink', 'none', T - 2.8, 0.05, 0.6, 63); mk('navy', 'bowler', T + 4.6, 0.05, 0.2, 64);

  // ======== CAFE / kitchen (s04) ========
  const C = LOC.cafe;
  W.add(room(C, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', floor: '#a7764e', seed: 41}));
  const table = P.desk(3.0, '#8a5a3b'); table.position.set(C, 0.05, 0); W.add(table);
  const tcan = can(1.3); tcan.position.set(C - 0.7, 1.0, 0.1); W.add(tcan);
  const mug = cyl(0.17, 0.14, 0.34, '#f2f0e6', {x: C + 0.7, y: 1.18, z: 0.1}); W.add(mug);
  const steam = cyl(0.03, 0.05, 0.3, '#ffffff', {x: C + 0.7, y: 1.5, z: 0.1, seg: 8, thick: 0.001}); W.add(steam);
  const cmp = sign('CAN = COFFEE?', 4.4, 1.5, {bg: '#f4ead4', w: 880, h: 300, font: 'bold 100px Arial, sans-serif', sub: 'SAME CAFFEINE'}); cmp.position.set(C, 3.3, -5.3); W.add(cmp);
  W.add(P.at(P.bookshelf(7), C - 5.6, 0.05, -5.15), P.at(P.bookshelf(8), C + 5.4, 0.05, -5.15), P.at(P.wallClock(), C + 3.4, 4.5, -5.4), P.at(P.deskLamp(), C - 2.8, 0.05, -4.3));
  const win2 = sign('', 2.4, 2.0, {bg: '#bfe3f5', border: true}); win2.position.set(C - 3.4, 3.2, -5.4); W.add(win2);
  W.add(P.at(P.chair(), C + 2.0, 0.05, 0.9, -2.2), P.at(P.chair(), C - 2.0, 0.05, 0.9, 2.2));
  const customer = mk('navy', 'none', C, 0.05, -1.3, 71, {glasses: true});
  mk('teal', 'none', C + 4.8, 0.05, -2.8, 72);
  W.add(P.at(P.papers(5, 3), C + 1.1, 1.0, -0.2));

  // ======== COURT (s05, s06) ========
  const K = LOC.court;
  W.add(room(K, {w: 18, h: 6, d: 12, wall: '#d9c9a6', floor: '#6b4a36', seed: 51}));
  W.add(box(18, 2.4, 0.2, '#7b5a40', {x: K, y: 1.3, z: -5.8}));
  const bench = box(5, 1.6, 1.2, '#5a3a26', {x: K, y: 1.0, z: -4.1}); W.add(bench);
  W.add(box(5.2, 0.12, 1.4, '#7b5a40', {x: K, y: 1.85, z: -4.1}));
  mk('official', 'none', K, 0.9, -4.4, 81, {glasses: true});
  const seal = sign('COURT', 2.4, 0.8, {bg: '#c9a54a', w: 480, h: 160, font: 'bold 88px Arial, sans-serif'}); seal.position.set(K, 4.6, -5.8); W.add(seal);
  W.add(P.at(P.flag('#2f6db3'), K - 3.6, 0.05, -5.0), P.at(P.flag('#c43d32'), K + 3.6, 0.05, -5.0));
  const tabL = P.desk(2.8, '#7a4f33'); tabL.position.set(K - 3.6, 0.05, -0.6); W.add(tabL);
  const tabR = P.desk(2.8, '#7a4f33'); tabR.position.set(K + 3.6, 0.05, -0.6); W.add(tabR);
  W.add(P.at(P.papers(6, 5), K - 3.6, 1.0, -0.6), P.at(P.papers(5, 6), K + 3.6, 1.0, -0.6));
  const tc = can(1.1); tc.position.set(K + 3.0, 1.0, -0.4); W.add(tc);
  mk('red', 'bowler', K - 3.6, 0.05, -2.0, 82, {glasses: true}); mk('pink', 'none', K - 5.4, 0.05, -1.8, 83);
  mk('navy', 'top', K + 3.6, 0.05, -2.0, 84); mk('mustard', 'none', K + 5.5, 0.05, -1.8, 85, {glasses: true});
  const sDec = sign('DECEPTIVE ADVERTISING', 3.2, 1.2, {bg: '#f4ead4', fg: '#a93a30', w: 640, h: 240, font: 'bold 64px Arial, sans-serif'}); sDec.position.set(K - 3.6, 3.0, -4.5); W.add(sDec);
  const sTru = sign('TRUTHFUL + ACCURATE', 3.2, 1.2, {bg: '#f4ead4', fg: '#2b5ea8', w: 640, h: 240, font: 'bold 60px Arial, sans-serif'}); sTru.position.set(K + 3.6, 3.0, -4.5); W.add(sTru);
  for (let i = 0; i < 3; i++) W.add(P.at(P.bench(), K - 2 + i * 2, 0.05, 3.4, Math.PI));
  mk('teal', 'cap', K - 2.2, 0.05, 4.4, 86); mk('student', 'none', K + 0.2, 0.05, 4.4, 87);
  W.add(P.at(P.wallClock(), K - 7.5, 4.6, -5.8));

  // ======== BOARDROOM (s07, s08) ========
  const B = LOC.board;
  W.add(room(B, {w: 24, h: 6, d: 12, wall: '#7fa6c2', floor: '#8a6a4e', seed: 61}));
  const bt = box(6.4, 0.16, 2.2, '#3a2a22', {x: B, y: 1.0, z: -2.4}); W.add(bt);
  for (const x of [-2.6, 2.6]) W.add(box(0.2, 0.95, 0.2, '#2b2018', {x: B + x, y: 0.5, z: -2.4}));
  for (let i = 0; i < 4; i++) { W.add(P.at(P.chair('#2b3a55'), B - 2.4 + i * 1.6, 0.05, -3.9, 0)); W.add(P.at(P.chair('#2b3a55'), B - 2.4 + i * 1.6, 0.05, -0.9, Math.PI)); }
  const cal = sign('SINCE 2002', 4.4, 1.5, {bg: '#f4ead4', w: 880, h: 300, font: 'bold 110px Arial, sans-serif'}); cal.position.set(B + 4.6, 3.6, -5.8); W.add(cal);
  const mill = sign('MILLIONS OF BUYERS', 5.4, 1.3, {bg: '#e8c23a', w: 1080, h: 260, font: 'bold 96px Arial, sans-serif'}); mill.position.set(B - 4.6, 3.6, -5.8); W.add(mill);
  const settle = sign('SETTLE?', 1.5, 0.8, {bg: '#f2e6cc', w: 300, h: 160, font: 'bold 62px Arial, sans-serif'}); settle.position.set(B, 1.45, -2.0); settle.rotation.x = -0.5; W.add(settle);
  W.add(P.at(P.papers(8, 9), B - 1.4, 1.1, -2.4), P.at(P.papers(5, 4), B + 1.6, 1.1, -2.6), P.at(P.mug('#f2f0e6'), B + 0.4, 1.1, -2.1));
  W.add(P.at(P.wallClock(), B, 4.8, -5.8));
  mk('official', 'top', B - 1.6, 0.05, -4.7, 91, {glasses: true}); mk('clerk', 'bowler', B + 1.6, 0.05, -4.7, 92); mk('engineer', 'none', B - 3.4, 0.05, -0.2, 93, {glasses: true});
  const rr = rng(33);
  for (let i = 0; i < 16; i++) mk(['red', 'teal', 'mustard', 'pink', 'student', 'navy', 'welder'][i % 7], ['none', 'cap', 'bowler', 'none'][i % 4], B - 9.5 + (i % 8) * 2.7 + rr() * 0.6, 0.05, i < 8 ? 0.4 + rr() * 0.4 : 1.6 + rr() * 0.4, 940 + i);
  W.add(P.at(P.bookshelf(9), B - 11.2, 0.05, -4.0, Math.PI / 2), P.at(P.bookshelf(10), B + 11.2, 0.05, -4.0, -Math.PI / 2));

  // ======== CLAIM DESK (s09, s10, s11) ========
  const D = LOC.claim;
  W.add(room(D, {w: 18, h: 5.5, d: 11, wall: '#bfe0db', floor: '#b8aa8a', seed: 71}));
  const desk2 = box(8, 1.1, 1.4, '#7b5a40', {x: D, y: 0.6, z: -1.4}); W.add(desk2);
  W.add(box(8.3, 0.1, 1.6, '#a9825f', {x: D, y: 1.2, z: -1.4}));
  const big = new THREE.Group(); for (let i = 0; i < 4; i++) { const st = cashStack(6, 1.3); st.position.set((i - 1.5) * 0.9, 0, 0); big.add(st); } big.position.set(D - 0.2, 1.25, -1.5); W.add(big);
  const bigSign = sign('$13,000,000', 4.6, 1.3, {bg: '#f2e6cc', w: 920, h: 260, font: 'bold 120px Arial, sans-serif'}); bigSign.position.set(D, 4.1, -5.3); W.add(bigSign);
  const clm = sign('CLAIMS', 2.4, 0.7, {bg: '#2b5ea8', fg: '#fff', w: 480, h: 140, font: 'bold 84px Arial, sans-serif'}); clm.position.set(D - 5.4, 2.9, -5.3); W.add(clm);
  const sCash = sign('$10 CASH', 3.0, 1.1, {bg: '#6fae6a', fg: '#fff', w: 600, h: 220, font: 'bold 96px Arial, sans-serif'}); sCash.position.set(D - 2.4, 2.5, -2.1); W.add(sCash);
  const sRB = sign('$15 IN RED BULL', 3.4, 1.1, {bg: '#2b5ea8', fg: '#fff', w: 680, h: 220, font: 'bold 78px Arial, sans-serif'}); sRB.position.set(D + 2.4, 2.5, -2.1); W.add(sRB);
  for (const x of [-3.8, 3.8]) W.add(cyl(0.05, 0.05, 2.0, '#3a3a3a', {x: D + x * 0.9 - (x < 0 ? -0.6 : 0.0), y: 1.9, z: -2.1}));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3 - (i % 2); j++) { const c = can(1.2); c.position.set(D + 2.6 + i * 0.5, 1.3 + j * 0.0, -1.3 + (i % 2) * 0.05); W.add(c); }
  const paper = sign('SETTLEMENT', 2.2, 0.9, {bg: '#f7f0de', w: 440, h: 180, font: 'bold 62px Arial, sans-serif', sub: 'NO ADMISSION OF WRONGDOING'}); paper.position.set(D - 3.0, 1.28, -0.4); paper.rotation.x = -Math.PI / 2 + 0.6; paper.scale.setScalar(0.7); W.add(paper);
  const stampSign = sign('NO WRONGDOING ADMITTED', 4.4, 0.9, {bg: '#f4ead4', fg: '#a93a30', w: 880, h: 180, font: 'bold 70px Arial, sans-serif'}); stampSign.position.set(D, 3.2, -5.3); stampSign.visible = false; W.add(stampSign);
  mk('clerk', 'none', D - 1.0, 0.05, -3.1, 101, {glasses: true}); mk('mustard', 'cap', D + 2.0, 0.05, -3.1, 102);
  const q = [[-7.0, 1.0, 'red'], [-5.4, 1.4, 'teal'], [-3.8, 1.1, 'pink'], [4.2, 1.5, 'student'], [5.8, 1.1, 'navy'], [7.2, 1.4, 'welder']];
  q.forEach(([x, z, pal], i) => mk(pal, ['none', 'cap', 'bowler'][i % 3], D + x, 0.05, z, 110 + i));
  W.add(P.at(P.wallClock(), D + 6.5, 4.5, -5.4), P.at(P.filingCabinet(), D + 7.6, 0.05, -4.9), P.at(P.filingCabinet('#8f7d6a'), D - 7.6, 0.05, -4.9));

  // ======== per-frame ========
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    trafficD(t, cam);
    const flap = shot === 's02' || shot === 's12' ? Math.sin(t * 14) * 0.5 : 0;
    wg.children.forEach((w) => { w.rotation.z = w.userData.sd * (0.3 + flap * 0.6 + 0.1); });
    wingMan.userData.armR.rotation.z = flap * 1.2; wingMan.userData.armL.rotation.z = -flap * 1.2;
    wingSign.visible = shot === 's12' || shot === 's02' && t > wordT('s02', 2);
    bag.visible = shot === 'hook' ? t > wordT('hook', 3) : true;
    bag.scale.setScalar(shot === 'hook' ? Math.max(0.001, ease(t, wordT('hook', 3), wordT('hook', 3) + 0.4)) : 1);
    // store: stand appears on "performance"
    stand.scale.setScalar(Math.max(0.001, ease(t, wordT('s03', 1), wordT('s03', 1) + 0.5)));
    standLegs.visible = stand.scale.x > 0.5;
    // cafe: steam
    steam.position.y = 1.5 + Math.sin(t * 3) * 0.04;
    // court signs
    sDec.visible = shot === 's05' ? t > wordT('s05', 9) : shot === 's06'; sTru.visible = shot === 's06' && t > wordT('s06', 4);
    sDec.scale.setScalar(Math.max(0.001, shot === 's05' ? ease(t, wordT('s05', 9), wordT('s05', 9) + 0.4) : 1));
    sTru.scale.setScalar(Math.max(0.001, ease(t, wordT('s06', 4), wordT('s06', 4) + 0.4)));
    // board: signs
    cal.visible = shot === 's07' ? t > wordT('s07', 8) : true; mill.visible = shot === 's07' ? t > wordT('s07', 4) : true;
    settle.visible = shot === 's08' && t > wordT('s08', 7);
    // claim
    bigSign.visible = shot === 's09' ? t > wordT('s09', 4) : false;
    bigSign.scale.setScalar(Math.max(0.001, ease(t, wordT('s09', 4), wordT('s09', 4) + 0.4)));
    sCash.visible = shot === 's10' && t > wordT('s10', 3); sRB.visible = shot === 's10' && t > wordT('s10', 9);
    sCash.scale.setScalar(Math.max(0.001, ease(t, wordT('s10', 3), wordT('s10', 3) + 0.4)));
    sRB.scale.setScalar(Math.max(0.001, ease(t, wordT('s10', 9), wordT('s10', 9) + 0.4)));
    stampSign.visible = shot === 's11' && t > wordT('s11', 5);
    paper.visible = shot === 's11' || shot === 's10' || shot === 's09';
  };
  return {group: W, update};
}
