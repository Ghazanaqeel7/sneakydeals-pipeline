import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, facade, ground, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';
import * as S from './swamp-props.js';

export const LOC = {swamp: 0, ranch: 200, press: 400, studio: 600, landoff: 700, law: 800, maproom: 900, printing: 1000, ballroom: 1100};

export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
// pop an object in at time t0 (only inside shot `on`)
const pop = (o, t, t0, d = 0.35, s = 1) => { o.scale.setScalar(Math.max(0.001, ease(t, t0, t0 + d) * (1 + 0.12 * Math.sin(Math.min(1, (t - t0) / d) * Math.PI)) * s)); return t >= t0; };
const big = (txt, w, h, bg, fg = INK, o = {}) => sign(txt, w, h, {bg, fg, w: Math.round(w * 200), h: Math.round(h * 200), font: 'bold 140px Arial, sans-serif', ...o});

function room(ox, {w = 14, h = 5, d = 10, wall = '#efe0c4', floor = '#a7764e', seed = 4} = {}) {
  const g = new THREE.Group();
  const wt = paintTex(wall, {seed, stains: 14}); wt.repeat.set(2, 1);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon('#ffffff', wt, {side: THREE.BackSide}));
  walls.position.set(ox, h / 2, 0); walls.receiveShadow = true; g.add(walls);
  const ft = paintTex(floor, {seed: seed + 1, stripes: (gg, W, H) => { gg.strokeStyle = 'rgba(60,30,15,0.35)'; gg.lineWidth = 2; for (let i = 0; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); } }});
  ft.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.1, d - 0.02), toon('#ffffff', ft)); fl.position.set(ox, 0.0, 0); fl.receiveShadow = true; g.add(fl);
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  return g;
}
const hang = (W, x, z, y = 4.6) => {
  W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: y + 0.4, z})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y, z, seg: 14}));
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, y - 0.15, z); W.add(b);
};
const windowPane = (W, x, y, z, w = 1.8, h = 1.4, ry = 0) => {
  const f = new THREE.Group();
  f.add(box(w + 0.2, h + 0.2, 0.08, '#f2ead8', {thick: 0.015}));
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: '#bfe6ff'})); gl.position.z = 0.05; f.add(gl);
  f.add(box(0.06, h, 0.04, '#f2ead8', {z: 0.07, thick: 0.004}), box(w, 0.06, 0.04, '#f2ead8', {z: 0.07, thick: 0.004}));
  f.position.set(x, y, z); f.rotation.y = ry; W.add(f);
};
const potPlant = (x, z) => { const p = new THREE.Group(); p.add(cyl(0.3, 0.24, 0.6, '#b35a3a', {y: 0.3})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.26, 0.8 + (i % 3) * 0.22, Math.sin(i) * 0.26); ink(l, 0.02, false); p.add(l); } p.position.set(x, 0.05, z); return p; };

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const person = (pal, hat, x, y, z, seed, extra = {}) => { const c = character({palette: pal, hat, seed, ...extra}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };
  const shown = []; // [obj, shotKeys]
  const only = (o, ...keys) => { shown.push([o, keys]); return o; };

  // ======================= SWAMP (hook + close) =======================
  const SW = LOC.swamp;
  const water = ground(240, 220, '#3f6e5e', {x: SW, z: -70, seed: 11, repeat: 20}); water.position.y -= 0.14; W.add(water);
  const bank = (x, z, sx, sz, c = '#7d7a45') => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), toon(c)); m.scale.set(sx, 0.18, sz); m.position.set(SW + x, -0.04, z); ink(m, 0.03, false); W.add(m); };
  bank(0.6, 1.0, 5.2, 3.8); bank(-9, -6, 4, 3, '#6f7040'); bank(9, -9, 5, 3.5); bank(-4, -18, 6, 3, '#6f7040'); bank(14, -3, 3, 2.5); bank(-16, -14, 5, 4); bank(4, -28, 8, 4, '#6f7040'); bank(-6, 6.5, 3, 1.6);
  // LAND FOR SALE sign
  const forSale = big('LAND FOR SALE', 1.6, 0.8, '#f2e6cc'); forSale.position.set(SW, 1.25, 0); forSale.rotation.z = 0.05; W.add(forSale); only(forSale, 'hook');
  const posts = new THREE.Group(); posts.add(cyl(0.05, 0.06, 1.3, '#6b4a36', {x: SW - 0.6, y: 0.6, z: -0.06, seg: 6}), cyl(0.05, 0.06, 1.3, '#6b4a36', {x: SW + 0.6, y: 0.6, z: -0.06, seg: 6})); W.add(posts);
  const log = cyl(0.14, 0.16, 1.4, '#7a5a40', {x: SW - 0.45, y: 0.12, z: 0.5, seg: 10}); log.rotation.z = Math.PI / 2; log.rotation.y = 0.3; W.add(log);
  const frog = S.frog(1.1); frog.position.set(SW - 0.5, 0.24, 0.52); frog.rotation.y = -1.2; W.add(frog);
  const gator = S.gator(0.9); gator.position.set(SW - 2.6, -0.16, 2.2); gator.rotation.y = 0.5; W.add(gator);
  const gator2 = S.gator(1.1); gator2.position.set(SW + 7, -0.16, -4); gator2.rotation.y = 2.6; W.add(gator2);
  const r0 = rng(5);
  for (let i = 0; i < 26; i++) { const x = (r0() - 0.5) * 60, z = -4 - r0() * 50; if (Math.abs(x) < 3 && z > -8) continue; W.add(P.at(S.cypress(7 + r0() * 6, i + 1), SW + x, 0, z)); }
  for (const [x, z] of [[-4.5, 2.5], [5.5, 1.5], [-7, -1], [8, -2.5]]) W.add(P.at(S.cypress(9, Math.abs(x * 3)), SW + x, 0, z));
  for (let i = 0; i < 30; i++) { const x = (r0() - 0.5) * 30, z = 4 - r0() * 30; if (Math.abs(x - 1) < 2.2 && z > -2 && z < 3) continue; W.add(P.at(S.reeds(8, i + 3, 1.3 + r0()), SW + x, 0, z)); }
  for (const [x, z] of [[-1.6, 0.4], [1.4, 0.9], [-2.2, -1.2], [3.2, 0.2]]) W.add(P.at(S.reeds(10, Math.abs(x * 9 + 1), 1.4), SW + x, 0, z));
  for (let i = 0; i < 18; i++) W.add(P.at(S.lilyPad(0.35 + r0() * 0.3), SW + (r0() - 0.5) * 16, -0.12, 3 - r0() * 12));
  for (let i = 0; i < 4; i++) W.add(P.at(S.mist(i + 2, 8, 40), SW + (i - 1.5) * 30, 0.5, -30 - i * 8));
  for (let i = 0; i < 7; i++) W.add(cloud(SW - 80 + i * 28, 55 + (i % 3) * 8, -150, 7));
  // the sneaky buyer
  const buyer = person('trench', 'fedora', SW + 2.1, 0.12, -0.5, 11, {shades: true});
  const bc = S.briefcase(); bc.position.set(0.09, -0.5, 0.03); buyer.userData.armR.add(bc);
  only(buyer, 'hook');
  // close: empty director's chair, castle rising, 1966
  const chair = S.dirChair(); chair.position.set(SW - 1.1, 0.12, 2.8); chair.rotation.y = -0.4; W.add(chair); only(chair, 'close');
  const castle = S.castle(); castle.scale.setScalar(2.0); castle.position.set(SW, 0, -78); W.add(castle); only(castle, 'close');
  const y66 = big('1966', 1.1, 0.5, '#f2e6cc'); y66.position.set(SW + 1.6, 1.5, 1.2); W.add(y66); only(y66, 'close');
  W.add(cyl(0.05, 0.05, 1.3, '#6b4a36', {x: SW + 1.6, y: 0.6, z: 1.15, seg: 6}));

  // ======================= RANCH / FLATWOODS (cheap) =======================
  const RA = LOC.ranch;
  W.add(ground(190, 160, '#a6a35c', {x: RA, z: -45, seed: 21, repeat: 18}));
  W.add(box(6, 0.04, 4, '#3f6e5e', {x: RA - 6.5, y: 0.02, z: -1.5, thick: 0.01, edges: false}));
  for (let i = 0; i < 8; i++) W.add(P.at(S.reeds(8, 40 + i, 1.4), RA - 9.5 + (i % 4) * 2, 0, -3.8 + Math.floor(i / 4) * 4.4));
  W.add(P.at(S.lilyPad(0.4), RA - 6, 0.05, -1.2), P.at(S.lilyPad(0.3), RA - 7.4, 0.05, -2));
  const r1 = rng(9);
  for (let i = 0; i < 40; i++) { const x = -8 + r1() * 30, z = 1.5 - r1() * 16; if (x > -9.5 && x < -3.5 && z > -4 && z < 1) continue; W.add(P.at(S.palmetto(0.8 + r1() * 0.7, i), RA + x, 0, z)); }
  for (let i = 0; i < 24; i++) W.add(P.at(S.cypress(8 + r1() * 7, 60 + i), RA - 30 + r1() * 70, 0, -14 - r1() * 30));
  const cows = [];
  for (const [x, z, ry] of [[3.5, -4, 0.3], [6.2, -6.5, -0.4], [9.5, -4.6, 2.8], [12.5, -7.5, 0.2], [5, -10, 1.2], [15, -5, 3.0]]) { const c = S.cow(x * 3); c.position.set(RA + x, 0, z); c.rotation.y = ry; W.add(c); cows.push(c); }
  W.add(P.at(S.railFence(14), RA + 1, 0, -2.2), P.at(S.railFence(10), RA + 16.5, 0, -2.2));
  W.add(P.at(S.ranchGate(4.4), RA + 10, 0, -2.2));
  const s200 = big('UNDER $200 / ACRE', 3.4, 0.9, '#c43d32', '#fff4dc'); s200.position.set(RA + 10, 3.4, -2.2); W.add(s200); only(s200, 'cheap');
  person('denim', 'straw', RA + 7.6, 0.05, 0.2, 21);
  person('welder', 'cap', RA + 12.6, 0.05, -0.6, 22);
  W.add(P.at(P.barrel('#9a5a3c'), RA + 1.2, 0.05, 0.6), P.at(P.barrel('#6a7a5a'), RA + 2.0, 0.05, 1.1));
  for (let i = 0; i < 6; i++) W.add(cloud(RA - 70 + i * 28, 55 + (i % 3) * 8, -150, 7));

  // ======================= CALIFORNIA PRESS TRIP (then) =======================
  const PR = LOC.press;
  W.add(ground(190, 140, '#dcc9a3', {x: PR, z: -40, seed: 31, repeat: 22}));
  const pastel = ['#f2d3ae', '#f0c0b0', '#d8e4c0', '#f4e2a4'];
  for (let i = -3; i <= 3; i++) { const f = facade({w: 9, h: 7 + (i % 2) * 2, color: pastel[(i + 4) % 4], cols: 3, rows: 2, seed: 300 + i}); f.position.set(PR + i * 9.5, 0, -12); W.add(f); W.add(box(9, 7 + (i % 2) * 2, 5, '#c9a582', {x: PR + i * 9.5, y: (7 + (i % 2) * 2) / 2, z: -14.8, thick: 0.03})); }
  for (let i = -5; i <= 5; i++) W.add(P.at(S.palmTree(7 + (i % 3), i + 20), PR + i * 5 + 1.5, 0, -8));
  for (const x of [-6, 7.5]) W.add(P.at(S.palmTree(8, x + 50), PR + x, 0, 2.5));
  W.add(box(6, 0.4, 2.6, '#c43d32', {x: PR + 3, y: 0.2, z: -4, thick: 0.02}));
  const banner = big('PRESS TRIP · CALIFORNIA', 7.4, 1.2, '#2f5d62', '#fff4dc'); banner.position.set(PR + 1.5, 4.4, -6); W.add(banner);
  W.add(cyl(0.08, 0.08, 4.4, '#3a3a3a', {x: PR - 2.2, y: 2.2, z: -6.05}), cyl(0.08, 0.08, 4.4, '#3a3a3a', {x: PR + 5.2, y: 2.2, z: -6.05}));
  const host = person('suit', 'none', PR + 3, 0.4, -4.2, 31);
  person('navy', 'none', PR + 4.8, 0.4, -4.6, 32); person('official', 'none', PR + 1.2, 0.4, -4.6, 33);
  const emily = person('pink', 'none', PR - 1.5, 0.05, 0.6, 34);
  const pad = box(0.16, 0.22, 0.02, '#f7f0de', {x: -0.09, y: -0.48, z: 0.04, thick: 0.004}); emily.userData.armL.add(pad);
  const reps = [['clerk', 'fedora', -3.2, 0.2], ['mustard', 'fedora', 0.4, -0.4], ['navy', 'bowler', 1.6, 1.2], ['teal', 'none', 4.6, 0.2], ['red', 'fedora', 6.4, 1.0], ['student', 'none', -5, 1.2], ['official', 'fedora', 2.8, 2.4]];
  reps.forEach(([pal, hat, x, z], i) => { const c = person(pal, hat, PR + x, 0.05, z, 40 + i); c.userData.armL.add(box(0.16, 0.22, 0.02, '#f7f0de', {x: -0.09, y: -0.48, z: 0.04, thick: 0.004})); });
  const cams = [[-3.8, -0.8], [1.0, 1.9], [5.6, -0.6]].map(([x, z]) => { const c = S.pressCam(); c.position.set(PR + x, 0.05, z); c.rotation.y = -0.4 - x * 0.03; W.add(c); return c; });
  const qmark = big('?', 0.6, 0.6, '#c43d32', '#ffffff'); qmark.position.set(PR - 1.5, 2.45, 0.6); W.add(qmark); only(qmark, 'then');
  W.add(P.at(P.car('#e6d9b8', {seed: 3}), PR - 12, 0.05, -4, 0.3), P.at(P.car('#2f8f8a', {seed: 4}), PR + 13, 0.05, -3.5, -0.4), P.at(P.bench(), PR - 8, 0.05, -2));
  for (let i = 0; i < 6; i++) W.add(cloud(PR - 70 + i * 28, 55 + (i % 3) * 8, -150, 7));

  // ======================= DRAWING OFFICE (yousee) =======================
  const ST = LOC.studio;
  W.add(room(ST, {w: 16, h: 5, d: 11, wall: '#bfe0dc', floor: '#a7764e', seed: 61}));
  hang(W, ST - 3, -0.5); hang(W, ST + 3, -0.5);
  // Florida map with a red circle that draws itself
  const mc = document.createElement('canvas'); mc.width = 512; mc.height = 640; const mg = mc.getContext('2d');
  const mTex = new THREE.CanvasTexture(mc); mTex.colorSpace = THREE.SRGBColorSpace; mTex.anisotropy = 8;
  const FL = [[40, 70], [300, 60], [330, 95], [395, 92], [420, 140], [455, 250], [490, 360], [500, 460], [470, 560], [430, 600], [395, 560], [350, 470], [320, 400], [300, 300], [285, 210], [255, 160], [200, 150], [130, 160], [60, 140], [40, 110]];
  let lastMap = -1;
  const drawMap = (k) => {
    const kk = Math.round(k * 40) / 40; if (kk === lastMap) return; lastMap = kk;
    mg.fillStyle = '#9fd0e6'; mg.fillRect(0, 0, 512, 640);
    mg.fillStyle = '#f0dca0'; mg.strokeStyle = INK; mg.lineWidth = 6; mg.beginPath(); FL.forEach(([x, y], i) => (i ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); mg.fill(); mg.stroke();
    mg.fillStyle = INK; mg.font = 'bold 54px Arial'; mg.textAlign = 'center'; mg.fillText('FLORIDA', 256, 600 - 0);
    if (kk > 0) { mg.strokeStyle = '#c43d32'; mg.lineWidth = 14; mg.beginPath(); mg.ellipse(395, 300, 62, 52, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kk); mg.stroke(); }
    mTex.needsUpdate = true;
  };
  drawMap(0);
  const mapB = box(3.0, 3.75, 0.1, '#ffffff', {thick: 0.03});
  mapB.material = [toon('#6b4a36'), toon('#6b4a36'), toon('#6b4a36'), toon('#6b4a36'), new THREE.MeshBasicMaterial({map: mTex}), toon('#6b4a36')];
  mapB.position.set(ST + 3.6, 2.55, -5.38); W.add(mapB);
  // drafting table with a blueprint
  const bpT = paintTex('#2f5d9e', {seed: 6, stains: 2, chips: 0, scratches: 0, stripes: (gg, w, h) => { gg.strokeStyle = 'rgba(255,255,255,0.8)'; gg.lineWidth = 3; for (let i = 1; i < 8; i++) { gg.beginPath(); gg.moveTo(i * w / 8, 0); gg.lineTo(i * w / 8, h); gg.stroke(); gg.beginPath(); gg.moveTo(0, i * h / 8); gg.lineTo(w, i * h / 8); gg.stroke(); } gg.lineWidth = 6; gg.strokeRect(40, 50, 120, 90); gg.beginPath(); gg.arc(180, 170, 50, 0, 7); gg.stroke(); }});
  const dt = new THREE.Group(); const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.3), [toon('#8a5a3b'), toon('#8a5a3b'), toon('#ffffff', bpT), toon('#8a5a3b'), toon('#8a5a3b'), toon('#8a5a3b')]); top.position.y = 1.15; top.rotation.x = 0.45; ink(top, 0.015, true); dt.add(top);
  for (const x of [-0.85, 0.85]) dt.add(box(0.08, 1.1, 0.08, '#5a3a26', {x, y: 0.55, thick: 0.008}));
  dt.position.set(ST - 2.2, 0.05, -1.6); W.add(dt);
  const planner = person('engineer', 'none', ST - 1.2, 0.05, -0.7, 61, {glasses: true});
  // park model on a table
  W.add(box(2.2, 0.9, 1.3, '#7a4f33', {x: ST + 0.6, y: 0.5, z: 0.3, thick: 0.02}));
  const model = new THREE.Group();
  model.add(box(2.0, 0.06, 1.1, '#7fbf5a', {y: 0, thick: 0.01}));
  const mcol = ['#c43d32', '#2f6db3', '#d9a441', '#d77a9c', '#2f8f8a'];
  for (let i = 0; i < 7; i++) { const x = -0.8 + i * 0.27, h = 0.2 + (i % 3) * 0.15; model.add(box(0.18, h, 0.18, mcol[i % 5], {x, y: h / 2 + 0.03, z: -0.3 + (i % 2) * 0.35, thick: 0.006})); model.add(S.cone(0.13, 0.2, mcol[(i + 2) % 5], {x, y: h + 0.13, z: -0.3 + (i % 2) * 0.35, seg: 8, thick: 0.005})); }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 20), toon('#f2c12e')); wheel.position.set(0.7, 0.4, 0.15); ink(wheel, 0.008, false); model.add(wheel);
  model.add(cyl(0.025, 0.025, 0.4, '#5a3a26', {x: 0.7, y: 0.2, z: 0.15, seg: 5, thick: 0.003}));
  model.position.set(ST + 0.6, 0.98, 0.3); W.add(model);
  W.add(P.at(P.bookshelf(3), ST - 5.6, 0.05, -5.15), P.at(P.filingCabinet(), ST - 7.3, 0.05, -3.8), P.at(P.filingCabinet('#8f7d6a'), ST + 6.6, 0.05, -5.0));
  W.add(P.at(P.wallClock(), ST + 0.4, 4.1, -5.42), P.at(P.poster('PLANS', 1.0, 1.4, '#e6d39a'), ST - 1.6, 3.1, -5.42), P.at(P.poster('IDEAS', 1.0, 1.4, '#f0c0b0'), ST + 6.4, 3.3, -5.42));
  windowPane(W, ST - 7.9, 2.6, -1.2, 2.2, 1.6, Math.PI / 2);
  for (let i = 0; i < 4; i++) { const rl = cyl(0.07, 0.07, 1.0, ['#cfe3f0', '#f7f0de'][i % 2], {seg: 10, thick: 0.006}); rl.rotation.z = Math.PI / 2; rl.position.set(ST - 2.4 + i * 0.12, 0.25 + i * 0.13, 0.9); W.add(rl); }
  W.add(potPlant(ST + 7.0, 2.6), P.at(P.chair(), ST - 1.5, 0.05, 0.4, Math.PI));
  person('teal', 'none', ST + 5.2, 0.05, -2.6, 62); person('student', 'none', ST - 5.8, 0.05, -2.2, 63);
  const d2 = P.desk(2.0, '#7a4f33'); d2.position.set(ST + 5.0, 0.05, -3.6); W.add(d2); W.add(P.at(P.papers(5, 9), ST + 4.8, 1.08, -3.6), P.at(P.deskLamp(), ST + 5.6, 1.08, -3.9));

  // ======================= LAND OFFICE (but) =======================
  const LO = LOC.landoff;
  W.add(room(LO, {w: 14, h: 4.8, d: 10, wall: '#cfe3cf', floor: '#9a6a44', seed: 71}));
  hang(W, LO - 2.5, -0.5, 4.3); hang(W, LO + 2.5, -0.5, 4.3);
  W.add(box(5.4, 1.1, 0.8, '#8a5a3b', {x: LO, y: 0.55, z: -1.6, thick: 0.02}), box(5.6, 0.08, 0.95, '#6b4430', {x: LO, y: 1.14, z: -1.6, thick: 0.01}));
  const farmer = person('denim', 'straw', LO + 0.6, 0.05, -2.6, 71);
  const plot = new THREE.Group(); plot.add(box(0.9, 0.08, 0.6, '#7fbf5a', {thick: 0.008}));
  for (let i = 0; i < 6; i++) plot.add(cyl(0.012, 0.012, 0.12, '#6b4a36', {x: -0.42 + i * 0.168, y: 0.08, z: 0.28, seg: 4, thick: 0.002}));
  plot.add(S.palmetto(0.18, 3)); plot.position.set(LO - 1.4, 1.22, -1.5); W.add(plot);
  W.add(cyl(0.015, 0.015, 0.55, '#3a3a3a', {x: LO - 1.4, y: 1.5, z: -1.35, seg: 5, thick: 0.002}));
  const tag1 = big('$200', 0.8, 0.42, '#f2e6cc'); tag1.position.set(LO - 1.4, 1.95, -1.33); W.add(tag1); only(tag1, 'but');
  const tag2 = big('$$$$$', 1.2, 0.55, '#3f8f4a', '#ffffff'); tag2.position.set(LO - 1.4, 2.0, -1.3); W.add(tag2); only(tag2, 'but');
  const bubble = big('DISNEY?!', 1.5, 0.55, '#ffffff', '#c43d32'); bubble.position.set(LO + 0.7, 2.75, -2.4); W.add(bubble); only(bubble, 'but');
  W.add(P.at(P.poster('FARMS', 1.0, 1.3, '#e6d39a'), LO - 3.6, 2.9, -4.92), P.at(P.poster('ACRES', 1.0, 1.3, '#f0c0b0'), LO + 3.4, 2.9, -4.92), P.at(P.wallClock(), LO + 0.4, 3.9, -4.92));
  windowPane(W, LO - 1.6, 2.6, -4.94, 1.6, 1.2);
  W.add(P.at(P.bookshelf(7, 2.2, 2.4), LO + 5.3, 0.05, -4.6), P.at(P.filingCabinet(), LO - 5.6, 0.05, -4.5), P.at(P.filingCabinet('#8f7d6a'), LO - 4.8, 0.05, -4.5));
  W.add(P.at(P.papers(6, 21), LO + 1.6, 1.2, -1.6), P.at(P.phone(), LO + 2.3, 1.2, -1.7), P.at(P.mug(), LO + 0.9, 1.2, -1.5), P.at(P.deskLamp(), LO + 2.6, 1.18, -1.9));
  W.add(P.at(P.bench(), LO - 4.2, 0.05, 1.6, 0.3), potPlant(LO + 5.6, 2.6));
  person('mustard', 'cap', LO - 4.4, 0.05, -2.6, 72); person('trench', 'fedora', LO + 2.8, 0.05, 0.4, 73, {shades: true});

  // ======================= LAWYER'S OFFICE (shells, lott) =======================
  const LW = LOC.law;
  W.add(room(LW, {w: 16, h: 5, d: 11, wall: '#c6d4ea', floor: '#8a5a3b', seed: 81}));
  hang(W, LW - 2.5, -0.5); hang(W, LW + 3.5, -1);
  W.add(P.at(P.rug(6, 3.6, '#7a3b3b', '#e0b04a'), LW - 1.5, 0, -0.6));
  const ld = P.desk(2.6, '#6b4430'); ld.position.set(LW - 1.5, 0.05, -1.6); W.add(ld);
  const lawyer = person('suit', 'none', LW - 1.5, 0.05, -2.6, 81, {glasses: true});
  W.add(P.at(P.deskLamp(), LW - 2.6, 1.08, -1.9), P.at(P.phone(), LW - 0.4, 1.08, -1.9));
  const fcols = ['#d9a441', '#2f8f8a', '#c8463a', '#7a4f73', '#4f79a8'];
  const folders = fcols.map((c, i) => { const f = box(0.42, 0.05, 0.32, c, {thick: 0.006}); f.position.set(LW - 0.8, 1.08 + i * 0.055, -1.45); f.rotation.y = (i % 2 - 0.5) * 0.25; W.add(f); return f; });
  const deed = big('LAND DEED', 0.55, 0.34, '#f7f0de', INK, {font: 'bold 60px Georgia, serif'}); deed.position.set(LW - 2.0, 1.08, -1.35); deed.rotation.x = -Math.PI / 2 + 0.25; W.add(deed); only(deed, 'shells');
  const plate = sign('REEDY CREEK RANCH CORP.', 1.4, 0.26, {bg: '#d9b44a', fg: INK, w: 1120, h: 210, font: 'bold 80px Georgia, serif'}); plate.position.set(LW - 1.5, 1.2, -1.2); plate.rotation.x = -0.25; W.add(plate); only(plate, 'shells');
  // wall of company binders
  const binders = new THREE.Group();
  ['CORP. 1', 'CORP. 2', 'CORP. 3', 'CORP. 4', 'CORP. 5', 'CORP. 6'].forEach((tx, i) => { const b = big(tx, 0.62, 0.9, fcols[i % 5], '#ffffff', {font: 'bold 50px Arial'}); b.position.set((i - 2.5) * 0.7, 0, 0); binders.add(b); });
  binders.position.set(LW - 1.5, 3.0, -5.35); W.add(binders);
  W.add(box(4.6, 0.08, 0.4, '#6b4430', {x: LW - 1.5, y: 2.5, z: -5.3, thick: 0.01}));
  W.add(P.at(P.bookshelf(11, 2.4, 2.6), LW - 6.4, 0.05, -5.15), P.at(P.filingCabinet(), LW + 2.2, 0.05, -5.1), P.at(P.filingCabinet('#8f7d6a'), LW + 3.0, 0.05, -5.1));
  // door with the M.T. LOTT sign
  W.add(box(1.5, 2.8, 0.12, '#7a4f33', {x: LW + 5.2, y: 1.4, z: -5.42, thick: 0.02}), box(1.15, 1.1, 0.04, '#cfe6ee', {x: LW + 5.2, y: 2.0, z: -5.34, thick: 0.005}));
  W.add(cyl(0.05, 0.05, 0.08, '#d9b44a', {x: LW + 4.65, y: 1.2, z: -5.32, seg: 8}));
  const lottA = sign('M.T. LOTT', 1.05, 0.62, {bg: '#f2e6cc', fg: INK, w: 520, h: 300, font: 'bold 110px Georgia, serif', sub: 'REAL ESTATE'}); lottA.position.set(LW + 5.2, 2.0, -5.3); W.add(lottA); only(lottA, 'lott');
  const lottB = big('EMPTY LOT', 1.7, 0.62, '#c43d32', '#fff4dc'); lottB.position.set(LW + 5.2, 2.0, -5.2); W.add(lottB); only(lottB, 'lott');
  W.add(P.at(P.poster('LAND', 0.9, 1.2, '#e6d39a'), LW + 6.9, 2.8, -5.42), P.at(P.wallClock(), LW + 3.7, 3.9, -5.42), potPlant(LW + 7.0, -3.6), potPlant(LW - 7.0, 2.8));
  const d3 = P.desk(2.0, '#7a4f33'); d3.position.set(LW + 3.6, 0.05, 0.6); W.add(d3);
  W.add(P.at(P.papers(6, 33), LW + 3.4, 1.08, 0.6), P.at(P.radio(), LW + 4.2, 1.08, 0.4));
  person('clerk', 'none', LW + 3.4, 0.05, -0.4, 82); person('mustard', 'fedora', LW + 6.6, 0.05, -2.2, 83); person('teal', 'none', LW - 5.2, 0.05, -2.6, 84);
  windowPane(W, LW - 7.9, 2.6, 0.5, 2.0, 1.5, Math.PI / 2);

  // ======================= MAP ROOM (ladder, size) =======================
  const MR = LOC.maproom;
  W.add(room(MR, {w: 16, h: 5.2, d: 12, wall: '#bcd3e0', floor: '#a7764e', seed: 91}));
  hang(W, MR - 1.6, -1, 4.7); hang(W, MR + 1.6, -1, 4.7);
  W.add(box(5.2, 0.14, 4.0, '#6b4430', {x: MR, y: 1.0, z: -1, thick: 0.02}));
  for (const x of [-2.4, 2.4]) for (const z of [-2.8, 0.8]) W.add(box(0.16, 0.95, 0.16, '#4a3020', {x: MR + x, y: 0.48, z, thick: 0.01}));
  W.add(box(4.8, 0.03, 3.6, '#d8cfa6', {x: MR, y: 1.085, z: -1, thick: 0.006}));
  for (const [x, z, rr] of [[-1.9, -2.3, 0.3], [1.95, 0.3, 0.25], [-1.9, 0.4, 0.2], [2.0, -2.4, 0.22]]) W.add(cyl(rr, rr, 0.02, '#7fbfe0', {x: MR + x, y: 1.1, z: -1 + z + 1, seg: 14, thick: 0.004}));
  const TS = 0.42, NX = 8, NZ = 6; const tiles = []; const rt = rng(4);
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const m = new THREE.MeshToonMaterial({color: '#f7f2e2', gradientMap: toon('#fff').gradientMap});
    const tl = new THREE.Mesh(new THREE.BoxGeometry(TS - 0.03, 0.025, TS - 0.03), m); tl.position.set(MR + (i - (NX - 1) / 2) * TS, 1.11, -1 + (j - (NZ - 1) / 2) * TS); ink(tl, 0.004, true); W.add(tl);
    tiles.push({m, k: rt()});
  }
  const ac = document.createElement('canvas'); ac.width = 800; ac.height = 340; const ag = ac.getContext('2d');
  const aTex = new THREE.CanvasTexture(ac); aTex.colorSpace = THREE.SRGBColorSpace; aTex.anisotropy = 8;
  let lastA = -1;
  const drawA = (n, plus) => { const key = n + (plus ? '+' : ''); if (key === lastA) return; lastA = key; ag.fillStyle = '#1d2326'; ag.fillRect(0, 0, 800, 340); ag.strokeStyle = '#d9a441'; ag.lineWidth = 14; ag.strokeRect(7, 7, 786, 326); ag.fillStyle = '#ffd66b'; ag.font = 'bold 130px Arial'; ag.textAlign = 'center'; ag.fillText(n.toLocaleString('en-US') + (plus ? '+' : ''), 400, 190); ag.fillStyle = '#f2e6cc'; ag.font = 'bold 64px Arial'; ag.fillText('ACRES', 400, 290); aTex.needsUpdate = true; };
  drawA(0, false);
  const aBoard = box(4.2, 1.8, 0.12, '#ffffff', {thick: 0.03}); aBoard.material = [toon('#2b2b2e'), toon('#2b2b2e'), toon('#2b2b2e'), toon('#2b2b2e'), new THREE.MeshBasicMaterial({map: aTex}), toon('#2b2b2e')];
  aBoard.position.set(MR + 1.2, 3.2, -5.88); W.add(aBoard);
  const y64 = big('1964', 1.5, 0.75, '#f2e6cc'); y64.position.set(MR - 2.6, 3.4, -5.85); W.add(y64); only(y64, 'ladder', 'size');
  // two Manhattan-sized cut-outs (generic long island shape)
  const shp = new THREE.Shape(); const ML = 2.3, MW = 1.45;
  shp.moveTo(-MW * 0.3, -ML / 2); shp.lineTo(MW * 0.25, -ML / 2 + 0.1); shp.lineTo(MW * 0.5, 0); shp.lineTo(MW * 0.42, ML / 2 - 0.2); shp.lineTo(MW * 0.05, ML / 2); shp.lineTo(-MW * 0.5, ML * 0.15); shp.lineTo(-MW * 0.45, -ML * 0.3); shp.closePath();
  const mans = [0, 1].map((i) => {
    const grp = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, {depth: 0.04, bevelEnabled: false}), toon(i ? '#f2c14e' : '#f29a4e')); m.rotation.x = -Math.PI / 2; ink(m, 0.006, true); grp.add(m);
    const lb = sign('MANHATTAN', 1.3, 0.3, {bg: i ? '#f2c14e' : '#f29a4e', fg: INK, w: 520, h: 120, font: 'bold 80px Arial', border: false}); lb.rotation.x = -Math.PI / 2; lb.position.y = 0.06; grp.add(lb);
    grp.userData.x = MR + (i ? 0.85 : -0.85); W.add(grp); only(grp, 'size'); return grp;
  });
  W.add(P.at(P.bookshelf(13, 2.4, 2.6), MR - 6.4, 0.05, -5.75), P.at(P.filingCabinet(), MR + 5.2, 0.05, -5.6), P.at(P.filingCabinet('#8f7d6a'), MR + 6.0, 0.05, -5.6), P.at(P.wallClock(), MR - 2.6, 4.5, -5.9));
  W.add(P.at(P.poster('COUNTY MAP', 1.2, 1.5, '#e6d39a'), MR + 4.6, 3.2, -5.9), potPlant(MR + 7.0, 2.0));
  for (let i = 0; i < 3; i++) W.add(P.at(P.chair(['#5a3a26', '#3e5a7a', '#5a3a26'][i]), MR - 2.0 + i * 2, 0.05, 1.6, Math.PI));
  person('suit', 'none', MR - 2.9, 0.05, -3.4, 91, {glasses: true}); person('navy', 'bowler', MR + 2.9, 0.05, -3.2, 92); person('official', 'none', MR + 3.3, 0.05, 0.2, 93); person('clerk', 'none', MR - 3.4, 0.05, 0.4, 94);

  // ======================= PRINTING ROOM (reveal) =======================
  const PT = LOC.printing;
  W.add(room(PT, {w: 20, h: 6, d: 12, wall: '#c9d8d4', floor: '#7d8587', seed: 101}));
  for (const x of [-5, 0, 5]) hang(W, PT + x, -0.5, 5.4);
  const press = S.printingPress(); press.position.set(PT - 2, 0.05, -2.4); W.add(press);
  for (let i = 0; i < 5; i++) W.add(box(0.8, 0.3 + (i % 3) * 0.25, 0.6, '#f4ecd8', {x: PT + 1.6 + (i % 3) * 0.95, y: 0.2 + (i % 3) * 0.12, z: 0.2 + Math.floor(i / 3) * 0.9, thick: 0.01}));
  for (let i = 0; i < 6; i++) W.add(cyl(0.45, 0.45, 0.9, '#efe6d0', {x: PT - 7.5 + (i % 3) * 1.0, y: 0.5, z: -4.8 + Math.floor(i / 3) * 1.0, seg: 16, thick: 0.02}));
  const pTex = S.paperTex('MYSTERY BUYER IS DISNEY', {date: 'OCTOBER 1965', name: 'MORNING EDITION'});
  const page = new THREE.Group(); page.add(box(3.1, 4.1, 0.08, '#6b4a36', {thick: 0.02, z: -0.05})); const pg = S.newspaper(pTex, 2.95); page.add(pg);
  page.position.set(PT + 3.4, 3.0, -5.85); W.add(page); only(page, 'reveal');
  const smallTex = S.paperTex('EXTRA EXTRA', {date: '', name: 'MORNING EDITION'});
  const flyers = Array.from({length: 12}, (_, i) => { const n = S.newspaper(i % 2 ? pTex : smallTex, 0.5); n.userData.k = [rng(i + 5)(), rng(i + 15)(), rng(i + 25)()]; W.add(n); only(n, 'reveal'); return n; });
  const oct = big('OCT 1965', 2.0, 0.7, '#c43d32', '#fff4dc'); oct.position.set(PT - 3.2, 4.7, -5.85); W.add(oct); only(oct, 'reveal');
  W.add(P.at(P.poster('PRESS', 1.0, 1.4, '#e6d39a'), PT + 7.2, 3.0, -5.9), P.at(P.wallClock(), PT + 0.2, 4.8, -5.9), P.at(P.toolRack(5), PT - 8.6, 0.05, -1.4, Math.PI / 2));
  person('welder', 'cap', PT - 3.8, 0.05, -0.6, 101); person('mustard', 'cap', PT + 0.4, 0.05, -1.0, 102); person('teal', 'none', PT + 5.4, 0.05, -2.8, 103, {glasses: true}); person('red', 'cap', PT + 6.6, 0.05, 0.8, 104);
  W.add(P.at(P.barrel('#2f6db3'), PT - 6, 0.05, 1.4), P.at(P.barrel('#c43d32'), PT + 8.2, 0.05, -4));

  // ======================= BALLROOM (announce) =======================
  const BR = LOC.ballroom;
  W.add(room(BR, {w: 22, h: 6.5, d: 14, wall: '#d6c6e0', floor: '#6b4430', seed: 111}));
  W.add(P.at(P.rug(3, 12, '#a8433a', '#e0b04a'), BR, 0, 0.5));
  for (const x of [-6, 0, 6]) for (const z of [-2, 3]) hang(W, BR + x, z, 5.6);
  W.add(box(9, 0.5, 3.2, '#5a3a26', {x: BR, y: 0.25, z: -5.2, thick: 0.02}));
  const pod = S.podium(); pod.position.set(BR, 0.5, -4.3); W.add(pod);
  person('suit', 'none', BR - 1.4, 0.5, -5.1, 111); person('navy', 'none', BR, 0.5, -5.0, 112, {glasses: true}); person('official', 'none', BR + 1.4, 0.5, -5.1, 113);
  const ban = big('ORLANDO · NOV 1965', 8.4, 1.3, '#2f5d62', '#fff4dc'); ban.position.set(BR, 4.7, -6.85); W.add(ban);
  for (const [x, c] of [[-3.6, '#c43d32'], [3.6, '#2f6db3'], [-4.4, '#f2e6cc'], [4.4, '#d9a441']]) { const f = P.flag(c); f.position.set(BR + x, 0.5, -6.2); f.scale.setScalar(1.6); W.add(f); }
  for (let i = 0; i < 4; i++) W.add(box(0.9, 6.4, 0.9, '#c8b48a', {x: BR - 10 + i * 6.66, y: 3.2, z: -6.5, thick: 0.04}));
  const rcol = ['clerk', 'mustard', 'navy', 'teal', 'red', 'student', 'official', 'pink', 'welder', 'engineer'], rhat = ['fedora', 'none', 'bowler', 'fedora', 'none', 'cap'];
  let si = 0; const rr = rng(12);
  for (let row = 0; row < 3; row++) for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    const x = BR + side * (1.6 + k * 1.15 + rr() * 0.3), z = -1.6 + row * 1.6 + rr() * 0.4;
    W.add(P.at(P.chair('#c43d32'), x, 0.05, z + 0.3, Math.PI));
    const c = person(rcol[si % 10], rhat[si % 6], x, 0.05, z, 120 + si); si++;
    if (si % 3 === 0) c.userData.armL.add(box(0.16, 0.22, 0.02, '#f7f0de', {x: -0.09, y: -0.48, z: 0.04, thick: 0.004}));
  }
  const bcams = [[-4.2, -2.6], [4.4, -2.4], [-6.6, 2.4], [6.4, 1.6]].map(([x, z]) => { const c = S.pressCam(); c.position.set(BR + x, 0.05, z); c.rotation.y = x < 0 ? -0.5 : 0.5; W.add(c); return c; });

  // ======================= per-frame =======================
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    for (const [o, keys] of shown) o.visible = keys.includes(shot);
    // hook: frog bob, gators drift
    frog.position.y = 0.24 + Math.abs(Math.sin(t * 3)) * 0.04;
    gator.position.x = SW - 2.6 + Math.sin(t * 0.5) * 0.15; gator2.position.y = -0.16 + Math.sin(t * 0.8) * 0.02;
    if (shot === 'hook') {
      buyer.userData.armR.rotation.z = 0.05;
      forSale.rotation.z = 0.05 + Math.sin(t * 1.5) * 0.015;
    }
    // close: castle rises out of the mist on "swamp become", windows light on "Walt Disney World"
    if (shot === 'close') {
      const k = ease(t, wordT('close', 8.5), wordT('close', 11.5));
      castle.position.y = lerp(-46, 0, k);
      const on = t >= wordT('close', 11);
      castle.userData.wins.forEach((w, i) => { w.visible = on && t >= wordT('close', 11) + (i % 7) * 0.06; });
      y66.visible = pop(y66, t, wordT('close', 3), 0.3);
    }
    // cheap: price sign on "two hundred"
    if (shot === 'cheap') s200.visible = pop(s200, t, wordT('cheap', 9), 0.35);
    cows.forEach((c, i) => { c.rotation.z = Math.sin(t * 1.4 + i) * 0.01; });
    // then: reporter raises her hand on "asked", question mark on "mystery"
    if (shot === 'then') {
      emily.userData.armR.rotation.z = 2.6 * ease(t, wordT('then', 5), wordT('then', 5.8));
      qmark.visible = pop(qmark, t, wordT('then', 9), 0.3);
      qmark.position.y = 2.45 + Math.sin(t * 4) * 0.04;
      host.userData.armL.rotation.z = -0.5 * ease(t, wordT('then', 6), wordT('then', 7));
      cams.forEach((c, i) => { c.userData.bulb.material.color.set(Math.sin(t * 7 + i * 2.3) > 0.9 ? '#ffffff' : '#9a9a90'); });
    }
    // yousee: park model pops on "huge new park", circle on "Florida"
    if (shot === 'yousee') {
      const mk = ease(t, wordT('yousee', 7.6), wordT('yousee', 8.4));
      model.scale.set(1, Math.max(0.001, mk), 1);
      wheel.rotation.z = t * 0.8;
      drawMap(ease(t, wordT('yousee', 11.4), wordT('yousee', 12.8)));
      planner.userData.armR.rotation.z = 0.7 + Math.sin(t * 3) * 0.1;
    }
    // but: DISNEY?! on "Disney", price explodes on "fortune"
    if (shot === 'but') {
      bubble.visible = pop(bubble, t, wordT('but', 6), 0.3);
      const f = wordT('but', 11.8);
      tag1.visible = t < f; tag2.visible = pop(tag2, t, f, 0.3, 1 + 0.25 * ease(t, f + 0.3, f + 1.2));
      farmer.userData.armR.rotation.z = t >= f ? 2.2 : 0;
    }
    // shells: deed on "bought", folders on "companies", name plate on "Reedy Creek"
    if (shot === 'shells') {
      deed.visible = pop(deed, t, wordT('shells', 3), 0.3);
      folders.forEach((f, i) => { f.visible = t >= wordT('shells', 5.5 + i * 0.5); });
      binders.children.forEach((b, i) => { b.visible = pop(b, t, wordT('shells', 6 + i * 0.4), 0.25); });
      plate.visible = pop(plate, t, wordT('shells', 10), 0.35);
      lawyer.userData.armR.rotation.z = 0.8 + ease(t, wordT('shells', 3), wordT('shells', 4)) * 0.4;
    } else { folders.forEach((f) => { f.visible = true; }); binders.children.forEach((b) => { b.visible = true; b.scale.setScalar(1); }); }
    // lott: the name flips to EMPTY LOT on "fast"
    if (shot === 'lott') {
      const f = wordT('lott', 9.6);
      lottA.visible = t < f; lottB.visible = pop(lottB, t, f, 0.35);
      lottA.rotation.z = t > wordT('lott', 8) ? Math.sin(t * 30) * 0.03 : 0;
    }
    // ladder: parcels go green one by one, counter + 1964
    if (shot === 'ladder' || shot === 'size') {
      const a = wordT('ladder', 3.6), b = wordT('ladder', 13);
      const k = shot === 'size' ? 1 : ease(t, a, b) * 1.02;
      tiles.forEach(({m, k: kk}, i) => { m.color.set(kk * 0.98 < k ? '#5fae52' : '#f7f2e2'); });
      if (shot === 'ladder') { y64.visible = pop(y64, t, wordT('ladder', 1.5), 0.3); const n = Math.floor(27000 * ease(t, wordT('ladder', 7.5), wordT('ladder', 12.4)) / 13) * 13; drawA(t >= wordT('ladder', 12.4) ? 27000 : n, t >= wordT('ladder', 12.4)); }
      else { y64.scale.setScalar(1); drawA(27000, true); }
    } else tiles.forEach(({m}) => m.color.set('#f7f2e2'));
    if (shot === 'size') mans.forEach((g, i) => { const t0 = wordT('size', i ? 7.6 : 3.6); const k = ease(t, t0, t0 + 0.45); g.visible = t >= t0; g.position.set(g.userData.x, lerp(2.6, 1.13, k), -1); g.rotation.y = (1 - k) * 0.8; });
    // reveal: press rolls, papers fly, front page slams in on "front page"
    press.userData.rollers.forEach((r, i) => { r.rotation.y = t * (i % 2 ? 6 : -6); });
    if (shot === 'reveal') {
      page.visible = pop(page, t, wordT('reveal', 10), 0.35);
      oct.visible = pop(oct, t, wordT('reveal', 1), 0.3);
      flyers.forEach((n, i) => { const [a, b, c] = n.userData.k; const life = ((t * 0.45 + a) % 1); n.position.set(PT - 2 + (b - 0.3) * 6 * life + 0.5, 1.8 + Math.sin(life * Math.PI) * (2 + c * 1.5), -2 + life * 3 * (c - 0.2)); n.rotation.set(life * 5 * a, life * 6 + b, life * 3 * c); });
    }
    // announce: camera flashes on "announced"
    if (shot === 'announce') bcams.forEach((c, i) => { c.userData.bulb.material.color.set(t > wordT('announce', 9.6) && Math.sin(t * 9 + i * 2.1) > 0.7 ? '#ffffff' : '#9a9a90'); });
  };

  return {group: W, update};
}
