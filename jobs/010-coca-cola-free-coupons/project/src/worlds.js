import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, lampPost, ground, sidewalk, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressPlaza} from './dress.js';
import * as P from './props.js';

export const LOC = {fountain: 0, street: 300, office: 600, mail: 700, tally: 800};
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
  for (let i = -5; i <= 5; i++) if (Math.abs(i + 0.5) > 1) g.add(lampPost(ox + i * 11 + 4, 6.8, 5.5));
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


const SHOPS = ['DRUGS', 'BAKERY', 'HOTEL', 'BOOKS', 'DELI', 'SHOES', 'CAFE', 'TAILOR', 'FLOWERS', 'BARBER', 'GROCER', 'HATS'];
const SHOPCOL = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
const PAL = ['engineer', 'student', 'clerk', 'official', 'red', 'teal', 'mustard', 'pink', 'navy'];

const glassOne = (c = '#7a4a2a') => cyl(0.11, 0.085, 0.28, c, {y: 0.14, seg: 10, thick: 0.012});
function glass() {
  const g = new THREE.Group();
  g.add(cyl(0.11, 0.085, 0.28, '#e4f2f6', {y: 0.14, seg: 12, thick: 0.012}));
  const l = cyl(0.095, 0.075, 0.2, '#4a2616', {y: 0.12, seg: 12, thick: 0.004}); g.add(l); g.userData.liq = l; return g;
}
const ticket = (w = 0.6) => sign('FREE DRINK', w, w * 0.6, {bg: '#f4ead4', fg: '#9b1c1c', w: 360, h: 216, font: 'bold 54px Arial, sans-serif', sub: 'ONE GLASS'});
function wagon(seed) {
  const g = new THREE.Group(); const r = rng(seed);
  g.add(box(2.8, 0.8, 1.3, ['#8a5a3b', '#4f6a8a', '#a8433a'][seed % 3], {y: 1.0}));
  for (const [x, z] of [[-0.9, 0.7], [0.9, 0.7], [-0.9, -0.7], [0.9, -0.7]]) { const w = cyl(0.45, 0.45, 0.1, '#3a2a20', {x, y: 0.45, z, seg: 12}); w.rotation.x = Math.PI / 2; g.add(w); }
  g.add(box(1.7, 0.9, 0.5, '#6b4430', {x: 2.6, y: 1.25}), box(0.6, 0.5, 0.4, '#6b4430', {x: 3.65, y: 1.7}));
  for (const [x, z] of [[2.0, 0.15], [3.2, 0.15], [2.0, -0.15], [3.2, -0.15]]) g.add(cyl(0.06, 0.06, 0.85, '#4a2f20', {x, y: 0.42, z, seg: 6}));
  g.add(box(1.4, 0.7, 1.0, '#c9a96a', {x: -0.2, y: 1.7}));
  return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const hang = (ox, xs, z = -1) => { for (const x of xs) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x: ox + x, y: 5.1, z})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x: ox + x, y: 4.6, z, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(ox + x, 4.45, z); W.add(b); } };
  const person = (pal, hat, x, y, z, seed, gl = false) => { const c = character({palette: pal, hat, glasses: gl, seed}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };

  // ======== SODA FOUNTAIN ========
  const F = LOC.fountain;
  W.add(room(F, {w: 18, h: 5.5, d: 11, wall: '#e6d6b0', floor: '#8a6a4e', seed: 5}));
  W.add(box(10, 1.1, 1.3, '#7a3b33', {x: F, y: 0.6, z: -2.2}), box(10.4, 0.12, 1.5, '#e1d6bf', {x: F, y: 1.2, z: -2.2, thick: 0.02}));
  const brand = sign('COCA-COLA', 6, 1.3, {bg: '#c43d32', fg: '#fff4dc', w: 768, h: 166, font: 'bold 120px Arial, sans-serif'}); brand.position.set(F, 4.3, -5.4); W.add(brand);
  for (let r = 0; r < 3; r++) { W.add(box(14, 0.1, 0.6, '#6b4a36', {x: F, y: 1.7 + r * 0.9, z: -5.0, thick: 0.01})); for (let i = 0; i < 22; i++) { const gl = glassOne(); gl.position.set(F - 6.3 + i * 0.6, 1.75 + r * 0.9, -5.0); W.add(gl); } }
  for (let i = 0; i < 14; i++) { const gl = glass(); gl.position.set(F - 4.2 + i * 0.64, 1.26, -2.0); W.add(gl); }
  const disp = new THREE.Group(); disp.add(cyl(0.38, 0.42, 1.5, '#b8c0c4', {y: 0.75}), cyl(0.2, 0.2, 0.35, '#c43d32', {y: 1.65}), box(0.12, 0.12, 0.5, '#8a9094', {y: 1.1, z: 0.4})); disp.position.set(F + 3.4, 1.26, -2.5); W.add(disp);
  for (let i = 0; i < 6; i++) { const s = new THREE.Group(); s.add(cyl(0.3, 0.3, 0.1, '#c43d32', {y: 0.95}), cyl(0.05, 0.08, 0.9, '#3a3a3a', {y: 0.45})); s.position.set(F - 4.6 + i * 1.9, 0.05, -0.7); W.add(s); }
  W.add(P.at(P.wallClock(), F - 6, 4.6, -5.4), P.at(P.poster('SODA', 1.1, 1.5, '#e6d39a'), F + 6.2, 3.4, -5.45), P.at(P.poster('ICE COLD', 1.1, 1.5, '#cfe3f0'), F - 7.0, 3.3, -5.45));
  W.add(P.at(P.bookshelf(3, 2.0, 2.4), F - 8.7, 0.05, -1.5, Math.PI / 2), P.at(P.rug(8, 3, '#a8433a', '#e0b04a'), F, 0.1, 0.8));
  hang(F, [-5, 0, 5]);
  const tk = ticket(1.1); tk.position.set(F - 0.6, 1.62, -1.3); tk.rotation.x = -0.28; W.add(tk); W.add(box(0.9, 0.5, 0.1, '#7a3b33', {x: F - 0.6, y: 1.4, z: -1.42, thick: 0.01}));
  const pourG = glass(); pourG.position.set(F - 1.0, 1.26, -1.5); pourG.scale.setScalar(1.4); W.add(pourG);
  const adv = sign('ADVERTISING', 4.2, 1.1, {bg: '#f2c12e', w: 640, h: 170, font: 'bold 78px Arial, sans-serif'}); adv.position.set(F + 4, 3.1, -5.38); W.add(adv);
  person('clerk', 'bowler', F + 1.5, 0.05, -3.4, 101, true);
  const cust = person('red', 'none', F - 2.0, 0.05, -0.2, 102);
  person('teal', 'top', F + 3.6, 0.05, -0.5, 103); person('mustard', 'cap', F - 5.0, 0.05, -1.0, 104);

  // ======== STREET 1887 ========
  const S = LOC.street;
  W.add(street(S, {seed: 23}));
  let si = 3;
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) { const s = P.shopFront(SHOPS[si++ % 12], SHOPCOL[(i + 3) % 6], si); s.position.set(S + side * (18 + i * 12.5), 0, 3.75); W.add(s); }
  for (let i = -6; i < 7; i++) { const s = P.shopFront(SHOPS[si++ % 12], SHOPCOL[(i + 9) % 6], si); s.position.set(S + i * 13, 0, 21.2); s.rotation.y = Math.PI; W.add(s); }
  for (let i = -5; i <= 5; i++) { if (Math.abs(i) < 2) continue; W.add(P.at(P.tree(1.1, 20 + i), S + i * 11 + 9.5, 0.25, 7.0), P.at(P.tree(1.0, 60 + i), S + i * 11 + 2, 0.25, 17.2)); if (i % 3 === 0) W.add(P.at(P.bench(), S + i * 11 + 0.5, 0.25, 4.3, 0)); }
  W.add(ground(40, 30, '#d8cdb8', {x: S, z: -22, seed: 5, repeat: 5}));
  dressPlaza(W, S, chars);
  const rr = rng(5);
  for (let i = 0; i < 22; i++) { const x = S - 60 + rr() * 120; if (Math.abs(x - S) < 14 && i % 2) continue; person(PAL[i % 9], ['none', 'cap', 'bowler', 'top', 'none'][i % 5], x, 0.25, rr() > 0.5 ? 5.0 + rr() * 1.2 : 18.0 + rr() * 1.4, 300 + i); }
  const wag = []; for (let i = 0; i < 8; i++) { const w = wagon(i); const lane = i % 2; w.rotation.y = lane ? Math.PI : 0; W.add(w); wag.push({w, x0: -110 + i * 30, sp: (lane ? -1 : 1) * (2.2 + (i % 3) * 0.5), z: lane ? 14.0 : 10.4}); }
  const stand = new THREE.Group();
  stand.add(box(4.2, 2.3, 1.8, '#e8e0cc', {y: 1.15}), box(4.5, 0.14, 1.0, '#8a5a3b', {y: 1.1, z: 1.35, thick: 0.02}));
  const awn = box(4.8, 0.14, 2.2, '#c43d32', {y: 2.7, z: 1.2}); awn.rotation.x = 0.28; stand.add(awn);
  const st1 = sign('COCA-COLA', 4.4, 1.0, {bg: '#c43d32', fg: '#fff4dc', w: 640, h: 150, font: 'bold 96px Arial, sans-serif'}); st1.position.set(0, 3.6, 0.5); stand.add(st1);
  const st2 = sign('FREE TASTE', 4.4, 1.0, {bg: '#f2c12e', w: 640, h: 150, font: 'bold 96px Arial, sans-serif'}); st2.position.set(0, 4.7, 0.5); st2.visible = false; stand.add(st2);
  stand.add(cyl(0.06, 0.06, 1.6, '#3a3a3a', {x: -2.0, y: 3.2, z: 0.5, seg: 8}), cyl(0.06, 0.06, 1.6, '#3a3a3a', {x: 2.0, y: 3.2, z: 0.5, seg: 8}));
  for (let i = 0; i < 6; i++) { const g = glass(); g.position.set(-1.6 + i * 0.65, 1.17, 1.4); g.scale.setScalar(1.3); stand.add(g); }
  stand.position.set(S, 0.1, 0); W.add(stand);
  const yr = sign('1887', 3.6, 1.6, {bg: '#f4ead4', w: 460, h: 205, font: 'bold 150px Arial, sans-serif'}); yr.position.set(S + 8, 5.5, -2); W.add(yr);
  W.add(cyl(0.12, 0.14, 4.4, '#3a3a3a', {x: S + 6.5, y: 2.2, z: -2}), cyl(0.12, 0.14, 4.4, '#3a3a3a', {x: S + 9.5, y: 2.2, z: -2}));
  const bill = sign('FIRST COUPON', 8, 2.6, {bg: '#c43d32', fg: '#fff4dc', w: 900, h: 292, font: 'bold 120px Arial, sans-serif'}); bill.position.set(S, 8.4, -0.6); W.add(bill);
  W.add(cyl(0.12, 0.14, 8.4, '#3a3a3a', {x: S - 4.3, y: 4.2, z: -0.9}), cyl(0.12, 0.14, 8.4, '#3a3a3a', {x: S + 4.3, y: 4.2, z: -0.9}));
  const qx = [S - 13, S - 10.4, S - 8.0, S - 5.8, S - 3.6]; const queue = qx.map((x, i) => { const c = person(PAL[(i + 3) % 9], ['bowler', 'none', 'top', 'cap', 'none'][i], x, 0.25, 4.2 + (i % 2) * 0.5, 350 + i); const tg = ticket(0.5); tg.position.set(0.1, -0.5, 0.1); c.userData.armR.add(tg); tg.visible = false; return tg; });
  for (let i = 0; i < 7; i++) W.add(cloud(S - 80 + i * 28, 100 + (i % 3) * 10, -130, 7));

  // ======== OFFICE ========
  const O = LOC.office;
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const desk = new THREE.Group(); desk.add(box(4.2, 0.18, 2, '#8a5a3b', {y: 1.05}));
  for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) desk.add(box(0.15, 1.0, 0.15, '#6b4430', {x, y: 0.5, z}));
  desk.position.set(O - 2.5, 0, 0.5); W.add(desk);
  W.add(P.at(P.rug(6, 3.6), O - 2.5, 0, 0.4), P.at(P.chair(), O - 2.5, 0.05, -0.75, 0), P.at(P.deskLamp(), O - 4.2, 1.14, 0.1), P.at(P.mug(), O - 1.0, 1.14, 1.0));
  W.add(P.at(P.bookshelf(4), O - 6.0, 0.05, -5.15), P.at(P.bookshelf(5), O - 0.4, 0.05, -5.15), P.at(P.filingCabinet(), O + 6.4, 0.05, -5.0), P.at(P.filingCabinet('#8f7d6a'), O + 7.2, 0.05, -5.0), P.at(P.bookshelf(6, 2.0, 2.4), O - 7.75, 0.05, -1.5, Math.PI / 2));
  W.add(P.at(P.poster('DRUGS', 1.1, 1.5, '#e6d39a'), O + 0.9, 3.4, -5.45), P.at(P.wallClock(), O + 5.4, 4.5, -5.4));
  const give = sign('GIVE IT AWAY', 4.4, 1.5, {bg: '#2f4a3a', fg: '#ffd66b', w: 640, h: 218, font: 'bold 92px Arial, sans-serif'}); give.position.set(O + 3.2, 2.9, -5.35); W.add(give);
  const win = sign('', 2.4, 2.0, {bg: '#bfe3f5', border: true}); win.position.set(O - 5, 3.1, -5.4); W.add(win);
  hang(O, [-3, 3]);
  const cand = person('official', 'bowler', O - 2.5, 0.05, -1.3, 201, true); person('clerk', 'none', O + 3.4, 0.05, -1.5, 202);
  const tix = []; for (let i = 0; i < 10; i++) { const tg = ticket(0.5); tg.rotation.x = -Math.PI / 2; tg.rotation.z = (i % 3 - 1) * 0.12; tg.position.set(O - 3.7 + (i % 5) * 0.55, 1.17 + Math.floor(i / 5) * 0.012, 0.5 + Math.floor(i / 5) * 0.5); W.add(tg); tix.push(tg); }

  // ======== MAIL ROOM ========
  const M = LOC.mail;
  W.add(room(M, {w: 18, h: 5.5, d: 11, wall: '#d8c8a4', floor: '#8a6a4e', seed: 31}));
  const po = sign('POST OFFICE', 5.2, 1.2, {bg: '#2f5d62', fg: '#fff4dc', w: 720, h: 166, font: 'bold 104px Arial, sans-serif'}); po.position.set(M - 1, 4.4, -5.4); W.add(po);
  for (let c = 0; c < 8; c++) for (let r = 0; r < 3; r++) { W.add(box(0.8, 0.7, 0.3, '#5a3a26', {x: M - 6.6 + c * 0.95, y: 1.0 + r * 0.85, z: -5.3, thick: 0.015})); if ((c + r) % 2) W.add(box(0.45, 0.28, 0.02, '#f4ead4', {x: M - 6.6 + c * 0.95, y: 1.05 + r * 0.85, z: -5.1, thick: 0.004, edges: false})); }
  W.add(box(6, 1.1, 1.2, '#7a4f33', {x: M - 2.5, y: 0.6, z: -2.4}), box(6.4, 0.12, 1.4, '#d9cdb4', {x: M - 2.5, y: 1.2, z: -2.4, thick: 0.02}));
  for (let i = 0; i < 4; i++) { const bag = box(1.3, 1.0, 0.9, '#8a7a5a', {x: M + 3.2 + (i % 2) * 1.5, y: 0.55 + Math.floor(i / 2) * 1.0, z: -1.6 + (i % 2) * 0.2, thick: 0.03}); W.add(bag); }
  const mb = sign('MAIL', 1.0, 0.5, {bg: '#c43d32', fg: '#fff4dc', w: 200, h: 100, font: 'bold 54px Arial, sans-serif'}); mb.position.set(M + 3.2, 1.0, -1.12); W.add(mb);
  W.add(box(3.4, 3.0, 0.2, '#6b4a36', {x: M + 6, y: 1.6, z: -5.2}));
  ['THE WEEKLY', 'HOME', 'FARM', 'NEWS', 'STYLE', 'SPORT'].forEach((n, i) => { const m = sign(n, 0.9, 1.15, {bg: ['#e6d39a', '#cfe3f0', '#c9e0a8', '#f4ead4', '#f2b8c6', '#b8c9e8'][i], w: 220, h: 280, font: 'bold 38px Arial, sans-serif'}); m.position.set(M + 4.9 + (i % 3) * 1.1, 2.3 + Math.floor(i / 3) * 1.3, -5.05); W.add(m); });
  W.add(P.at(P.wallClock(), M - 7.5, 4.6, -5.4), P.at(P.bookshelf(7, 2.0, 2.4), M - 8.7, 0.05, -1.5, Math.PI / 2), P.at(P.rug(7, 3.4, '#3e5a7a', '#d9a441'), M, 0.1, 0.8), P.at(P.mug('#2f6db3'), M - 1, 1.3, -2.4), P.at(P.papers(6, 12), M - 3.5, 1.3, -2.4));
  hang(M, [-4, 1, 5]);
  person('mustard', 'cap', M - 2.5, 0.05, -3.4, 401); person('navy', 'cap', M + 1.2, 0.05, 0.4, 402); person('pink', 'none', M - 5, 0.05, -1.0, 403, true);
  const fly = []; for (let i = 0; i < 14; i++) { const tg = ticket(0.45); tg.visible = false; W.add(tg); fly.push(tg); }

  // ======== TALLY ROOM ========
  const T = LOC.tally;
  W.add(room(T, {w: 22, h: 8, d: 12, wall: '#c9dbef', floor: '#8a6a4e', seed: 41}));
  const nC = document.createElement('canvas'); nC.width = 900; nC.height = 430; const ng = nC.getContext('2d');
  const nTex = new THREE.CanvasTexture(nC); nTex.colorSpace = THREE.SRGBColorSpace; nTex.anisotropy = 8;
  const drawN = (n) => { ng.fillStyle = '#2f4a3a'; ng.fillRect(0, 0, 900, 430); ng.strokeStyle = '#8a5a3b'; ng.lineWidth = 24; ng.strokeRect(0, 0, 900, 430); ng.fillStyle = '#f2ead6'; ng.font = 'bold 62px Arial, sans-serif'; ng.textAlign = 'center'; ng.fillText('FREE DRINKS GIVEN', 450, 110); ng.fillStyle = '#ffd66b'; ng.font = 'bold 150px Arial, sans-serif'; ng.fillText(Math.round(n).toLocaleString('en-US'), 450, 290); ng.fillStyle = '#f2ead6'; ng.font = 'bold 44px Arial, sans-serif'; ng.fillText('ROUGHLY', 450, 370); nTex.needsUpdate = true; };
  drawN(0);
  const nBoard = box(7.4, 3.6, 0.12, '#ffffff', {thick: 0.03}); nBoard.material = [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshBasicMaterial({map: nTex}), toon('#5a3a26')]; nBoard.position.set(T - 4.6, 4.6, -5.85); W.add(nBoard);
  const mC = document.createElement('canvas'); mC.width = 800; mC.height = 560; const mg = mC.getContext('2d');
  const mTex = new THREE.CanvasTexture(mC); mTex.colorSpace = THREE.SRGBColorSpace; mTex.anisotropy = 8;
  const US = [[40, 90], [160, 70], [300, 80], [420, 60], [520, 80], [560, 120], [640, 90], [700, 140], [690, 200], [650, 240], [630, 330], [580, 420], [540, 470], [490, 440], [470, 490], [420, 500], [380, 440], [300, 470], [250, 400], [190, 380], [120, 330], [60, 260], [30, 180]];
  const dr = rng(9); const dots = Array.from({length: 48}, () => { for (;;) { const x = 60 + dr() * 620, y = 90 + dr() * 380; let ins = false; for (let i = 0, j = US.length - 1; i < US.length; j = i++) { const [xi, yi] = US[i], [xj, yj] = US[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } if (ins) return [x, y]; } });
  const drawM = (p) => { mg.fillStyle = '#7fb3cf'; mg.fillRect(0, 0, 800, 560); mg.fillStyle = '#e8dcb8'; mg.strokeStyle = INK; mg.lineWidth = 6; mg.beginPath(); US.forEach(([x, y], i) => (i ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); mg.fill(); mg.stroke();
    const n = Math.floor(p * dots.length); dots.forEach(([x, y], i) => { if (i < n) { mg.fillStyle = '#c43d32'; mg.beginPath(); mg.arc(x, y, 14, 0, 7); mg.fill(); mg.lineWidth = 3; mg.stroke(); } });
    mg.fillStyle = INK; mg.font = 'bold 56px Arial, sans-serif'; mg.textAlign = 'left'; mg.fillText('1895', 40, 54); mg.textAlign = 'right'; mg.font = 'bold 38px Arial, sans-serif'; mg.fillText('SERVED IN', 780, 40); mg.fillText('EVERY STATE', 780, 84); mTex.needsUpdate = true; };
  drawM(0);
  const mBoard = box(6.2, 4.34, 0.12, '#ffffff', {thick: 0.03}); mBoard.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: mTex}), toon('#4a3a2e')]; mBoard.position.set(T + 5.2, 4.4, -5.85); W.add(mBoard);
  const rows = [[], [], []];
  for (let r = 0; r < 3; r++) { W.add(box(18, 0.12, 0.8, '#6b4a36', {x: T, y: 0.95 + r * 0.9, z: -5.4, thick: 0.01})); for (let i = 0; i < 22; i++) { const gl = glassOne('#8a5a3b'); gl.position.set(T - 8.4 + i * 0.8, 1.0 + r * 0.9, -5.4); gl.visible = false; W.add(gl); rows[r].push(gl); } }
  W.add(P.at(P.wallClock(), T + 9.5, 6.4, -5.9), P.at(P.rug(9, 4, '#3e5a7a', '#d9a441'), T, 0.1, 0));
  const d1 = P.desk(2.6); d1.position.set(T - 3.5, 0.05, 1.8); W.add(d1); W.add(P.at(P.papers(6, 21), T - 3.7, 1.0, 1.8), P.at(P.mug('#c43d32'), T - 2.8, 1.0, 2.0));
  hang(T, [-6, 0, 6]);
  person('official', 'top', T - 1.5, 0.05, -1.5, 501, true); person('clerk', 'bowler', T + 2.4, 0.05, -1.2, 502); person('teal', 'cap', T + 8, 0.05, -2, 503);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    for (const q of wag) { const x = ((q.x0 + q.sp * t + 120) % 240 + 240) % 240 - 120; q.w.position.set(S + x, 0, q.z); q.w.visible = !(Math.abs(cam.position.x - (S + x)) < 8 && Math.abs(cam.position.z - q.z) < 6); }
    // fountain
    const hs = (k) => wordT(k, 0);
    tk.scale.setScalar(1 + 0.04 * Math.sin(t * 3));
    pourG.userData.liq.scale.y = shot === 's06' ? Math.max(0.02, ease(t, wordT('s06', 9), wordT('s06', 9) + 1.4)) : 1;
    pourG.userData.liq.position.y = 0.02 + 0.1 * pourG.userData.liq.scale.y;
    cust.userData.armR.rotation.z = shot === 's06' ? 1.7 + Math.sin(t * 6) * 0.15 : 0;
    adv.visible = t > wordT('s10', 9) && shot === 's10'; adv.scale.setScalar(Math.max(0.001, ease(t, wordT('s10', 9), wordT('s10', 9) + 0.5)));
    // street
    yr.visible = shot === 's02' && t > wordT('s02', 1); yr.scale.setScalar(Math.max(0.001, ease(t, wordT('s02', 1), wordT('s02', 1) + 0.5)));
    st2.visible = shot === 's07' && t > wordT('s07', 5); st2.scale.setScalar(Math.max(0.001, ease(t, wordT('s07', 5), wordT('s07', 5) + 0.5)));
    queue.forEach((q, i) => { q.visible = shot === 's07' && t > wordT('s07', 4) + i * 0.12; });
    bill.visible = shot === 's11' && t > wordT('s11', 10); bill.scale.setScalar(Math.max(0.001, ease(t, wordT('s11', 10), wordT('s11', 10) + 0.5)));
    // office
    give.visible = t > wordT('s03', 11) || shot === 's04'; give.scale.setScalar(shot === 's03' ? Math.max(0.001, ease(t, wordT('s03', 11), wordT('s03', 11) + 0.5)) : 1);
    const s4 = wordT('s04', 0);
    tix.forEach((tg, i) => { tg.visible = shot === 's04' && t > s4 + 0.4 + i * 0.28; });
    cand.userData.armR.rotation.z = shot === 's04' ? 0.9 + Math.sin(t * 9) * 0.2 : 0;
    // mail: tickets fly from magazines to the bag
    fly.forEach((tg, i) => { const a = wordT('s05', 2) + i * 0.18; const u = ((t - a) % 1.8) / 1.8; const on = shot === 's05' && t > a; tg.visible = on; if (on) { tg.position.set(M + 5.8 - 8.4 * u * 0.55, 2.6 + Math.sin(u * Math.PI) * 1.6 - u * 1.2, -3.8 + u * 3.2 + (i % 3) * 0.2); tg.rotation.z = u * 6 + i; } });
    // tally
    const p8 = ease(t, wordT('s08', 1), wordT('s08', 6)); if (shot === 's08' || shot === 's09') drawN(8500000 * p8);
    const nG = Math.floor(66 * ease(t, wordT('s08', 0), wordT('s08', 7)));
    rows.forEach((row, r) => row.forEach((g, i) => { g.visible = (shot === 's08' || shot === 's09') && (i * 3 + r) < nG; }));
    if (shot === 's09') drawM(ease(t, wordT('s09', 0), wordT('s09', 8))); 
  };
  return {group: W, update};
}
