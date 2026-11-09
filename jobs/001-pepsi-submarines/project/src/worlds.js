import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, facade, lampPost, crate, ground, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';
import {sub, warship, bottle, domeTower, brickWall, kiosk} from './pepsi.js';

export const LOC = {harbor: 0, square: 300, wh: 600, plant: 700, scrap: 800, office: 900, hall: 1000};

export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const PEPSI = '#2f6db3', VODKA = '#e8e0c8';
const pcrate = (o = {}) => crate('PEPSI', {color: PEPSI, fg: '#ffffff', ...o});
const vcrate = (o = {}) => crate('VODKA', {color: VODKA, ...o});
// pop an object in at time t0
const pop = (o, t, t0, d = 0.35, s = 1) => { o.visible = t >= t0; o.scale.setScalar(Math.max(0.001, ease(t, t0, t0 + d)) * s); };

function sparks(seed, count = 120) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({color: '#ffcc55', size: 0.22, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
  const pts = new THREE.Points(geo, mat);
  const r = rng(seed);
  const seeds = Array.from({length: count}, () => [r(), r(), r(), r()]);
  pts.userData.update = (t, origins, on = 1) => {
    mat.opacity = on;
    for (let i = 0; i < count; i++) {
      const [a, b, c, d] = seeds[i];
      const o = origins[i % origins.length];
      const life = (t * (1.2 + a) + d) % 1;
      pos[i * 3] = o[0] + (b - 0.5) * 1.6 * life;
      pos[i * 3 + 1] = o[1] + (0.6 - life * 1.6) * 1.0 * c;
      pos[i * 3 + 2] = o[2] + life * 0.9 * a;
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
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  return g;
}

function rack(seed = 1, w = 4.4, h = 4.2) {
  const g = new THREE.Group(); const r = rng(seed);
  for (const x of [-w / 2, w / 2]) g.add(box(0.14, h, 0.14, '#d9772b', {x, y: h / 2, z: 0, thick: 0.01}));
  const cols = ['#b98a52', '#c9a46a', '#a77a45', '#d4b27a', '#2f6db3', '#e8e0c8'];
  for (let s = 0; s < 3; s++) {
    const y = 0.25 + s * (h - 0.4) / 3;
    g.add(box(w, 0.1, 0.9, '#8a5a3b', {y, z: 0, thick: 0.01}));
    let x = -w / 2 + 0.3;
    while (x < w / 2 - 0.5) { const bw = 0.6 + r() * 0.5, bh = 0.5 + r() * 0.4; g.add(box(bw, bh, 0.7, cols[Math.floor(r() * 6)], {x: x + bw / 2, y: y + 0.05 + bh / 2, z: 0, thick: 0.02})); x += bw + 0.1; }
  }
  return g;
}
const hang = (W, x, z, y = 6.6) => { // ceiling lamp
  W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: y + 0.4, z})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y, z, seg: 14}));
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, y - 0.15, z); W.add(b);
};

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const person = (pal, hat, x, y, z, seed, extra = {}) => { const c = character({palette: pal, hat, seed, ...extra}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };

  // ======================= HARBOR =======================
  const H = LOC.harbor;
  const water = ground(900, 520, '#3f93c9', {x: H, z: -270, seed: 31, repeat: 24}); water.position.y = -0.6; W.add(water);
  W.add(ground(260, 24, '#8f7350', {x: H + 20, z: 7, seed: 33, repeat: 26}));
  W.add(box(260, 0.5, 0.5, '#5a3a26', {x: H + 20, y: 0.1, z: -4.1, thick: 0.03}));
  for (let i = -10; i <= 12; i++) W.add(cyl(0.24, 0.3, 0.7, '#2b2b2e', {x: H + i * 8 + 2, y: 0.4, z: -3.3, seg: 10}));
  // 17 submarines, two rows
  const subs = [];
  for (let i = 0; i < 17; i++) {
    const row = i < 9 ? 0 : 1, k = row ? i - 9 : i;
    const x = H + (row ? (k - 3.5) * 3.6 : (k - 4) * 3.6), z = row ? -30 : -11;
    const s = sub(i + 1); s.position.set(x, -0.5, z); s.userData.base = [x, -0.5, z]; W.add(s); subs.push(s);
  }
  // three old warships
  const cruiser = warship(34, 6.4, {seed: 3}); cruiser.position.set(H + 52, -0.6, -11); W.add(cruiser);
  const frigate = warship(22, 3.8, {seed: 5, funnels: 1, color: '#74837f'}); frigate.position.set(H + 42, -0.6, -26); W.add(frigate);
  const destroyer = warship(27, 4.6, {seed: 7, color: '#808c86'}); destroyer.position.set(H + 66, -0.6, -24); W.add(destroyer);
  const ships = [cruiser, frigate, destroyer];
  ships.forEach((s) => { s.userData.base = s.position.y; });
  const lbl = (txt, x, y, z) => { const s = sign(txt, 6.4, 1.5, {bg: '#f2e6cc', w: 640, h: 150, font: 'bold 96px Arial, sans-serif'}); s.position.set(x, y, z); W.add(s); return s; };
  const lblCruiser = lbl('CRUISER', H + 52, 9, -8), lblFrigate = lbl('FRIGATE', H + 40, 7.4, -20), lblDestroyer = lbl('DESTROYER', H + 66, 8.2, -18);
  // big count sign + tag
  const sign17 = sign('17', 3.2, 3.2, {bg: '#c43d32', fg: '#ffffff', w: 320, h: 320, font: 'bold 220px Arial, sans-serif'}); sign17.position.set(H + 2.6, 4.4, -2.4); W.add(sign17);
  const tagSub = subs[4];
  const tag = sign('$150,000', 3.0, 1.3, {bg: '#f2e6cc', w: 600, h: 260, font: 'bold 110px Arial, sans-serif'});
  const tx0 = tagSub.userData.base[0];
  tag.position.set(tx0, 1.9, -2.6); W.add(tag);
  const cord = cyl(0.03, 0.03, 0.9, '#2b2b2e', {x: tx0, y: 2.9, z: -2.6, seg: 6, thick: 0.005}); W.add(cord);
  const gantry = new THREE.Group(); gantry.add(cyl(0.08, 0.08, 3.4, '#3a3a3a', {x: tx0 + 2.4, y: 1.7, z: -2.6, seg: 8}), box(2.5, 0.12, 0.12, '#3a3a3a', {x: tx0 + 1.2, y: 3.4, z: -2.6, thick: 0.01})); W.add(gantry);
  // foreground: Pepsi crate stacks
  const stack = (x, z, rows = 3) => { for (let r = 0; r < rows; r++) for (let c = 0; c < rows - r; c++) W.add(pcrate({x: x + (c - (rows - r - 1) / 2) * 1.25, y: 0.62 + r * 1.2, z, ry: (c % 2) * 0.1})); };
  stack(H - 4.2, 0.4, 2); stack(H - 30, 4, 3); stack(H + 15, 12.5, 4); stack(H + 26, 12.5, 3);
  for (let i = 0; i < 3; i++) W.add(P.at(P.pallet(), H - 14 + i * 1.5, 0.05, 9.4));
  W.add(P.at(P.barrel('#c43d32'), H + 7.8, 0.05, 6), P.at(P.barrel('#2f6db3'), H + 8.7, 0.05, 6.3), P.at(P.barrel('#d9a441'), H - 6.8, 0.05, 6.6));
  W.add(P.at(P.crane(36), H - 36, 0.05, 1)); W.add(P.at(P.crane(30), H + 90, 0.05, 2));
  for (let i = 0; i < 5; i++) W.add(box(6, 2.6, 2.6, ['#c43d32', '#2f6db3', '#d9a441', '#4f8a4a', '#8a5a3b'][i], {x: H - 46 + i * 7, y: 1.3, z: 12, thick: 0.04}));
  for (let i = -6; i <= 8; i++) W.add(lampPost(H + i * 11 + 3, 14, 5.5));
  const island = new THREE.Mesh(new THREE.SphereGeometry(40, 18, 10), toon('#5f9e4f')); island.scale.set(2.2, 0.45, 1); island.position.set(H - 40, -6, -150); ink(island, 0.2, false); W.add(island);
  const island2 = island.clone(); island2.position.set(H + 110, -6, -170); W.add(island2);
  for (let i = 0; i < 8; i++) W.add(cloud(H - 90 + i * 30, 70 + (i % 3) * 10, -150, 7));
  // harbour people
  person('welder', 'cap', H - 11.5, 0.05, 3.6, 31);
  person('mustard', 'cap', H + 5.5, 0.05, 6.2, 32);
  person('red', 'none', H + 10.5, 0.05, 4.6, 33);
  person('teal', 'cap', H - 7, 0.05, 5.6, 34);
  person('clerk', 'bowler', H + 17, 0.05, 5, 35);
  person('welder', 'cap', H + 47, 0.05, 5.2, 36);
  person('navy', 'cap', H + 35.5, 0.05, 3.6, 37);
  // officer pointing at the old warships ("then")
  const officer = person('official', 'cap', H + 29, 0.05, 1.6, 38, {glasses: false});
  // contract signing (deal)
  const T = H - 22;
  const tdesk = P.desk(2.6, '#7a4f33'); tdesk.position.set(T, 0.05, 1.8); W.add(tdesk);
  W.add(P.at(P.papers(8, 14), T - 0.3, 1.08, 1.7), P.at(P.mug(), T + 0.7, 1.08, 1.9), P.at(P.deskLamp(), T - 1.0, 1.08, 1.6));
  const manager = person('navy', 'bowler', T - 1.5, 0.05, 0.4, 41, {glasses: true});
  const sovOfficer = person('official', 'cap', T + 1.8, 0.05, 0.3, 42);
  person('clerk', 'none', T + 4.2, 0.05, 2.2, 43);
  const banner = sign('SPRING 1989', 6.4, 1.5, {bg: '#c43d32', fg: '#fff4dc', w: 768, h: 180, font: 'bold 104px Arial, sans-serif'});
  banner.position.set(T, 4.2, -1.2); W.add(banner);
  W.add(cyl(0.12, 0.14, 4.6, '#3a3a3a', {x: T - 3.4, y: 2.3, z: -1.2}), cyl(0.12, 0.14, 4.6, '#3a3a3a', {x: T + 3.4, y: 2.3, z: -1.2}));

  // ======================= SQUARE (Moscow-style) =======================
  const S = LOC.square;
  W.add(ground(240, 140, '#b9ad9b', {x: S, z: -30, seed: 3, repeat: 30}));
  const wall = brickWall(150, 7); wall.position.set(S, 0, -42); W.add(wall);
  for (let i = -2; i <= 2; i++) { const tw = box(5, 12, 5, '#a64c3d', {x: S + i * 34, y: 6, z: -42, thick: 0.05}); W.add(tw); const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 5, 4), toon('#2f6d4f')); roof.position.set(S + i * 34, 14.5, -42); roof.rotation.y = Math.PI / 4; ink(roof, 0.05, true); W.add(roof); }
  const DC = ['#c43d32', '#2f8f8a', '#d9a441', '#2f6db3', '#4f8a4a', '#c8463a', '#7a4f73'];
  for (let i = 0; i < 9; i++) { const d = domeTower(10 + (i * 7) % 14, i % 2 ? '#efe2c6' : '#d9b79a', DC[i % 7], 2.4 + (i % 3) * 0.5); d.position.set(S - 36 + i * 9, 0, -58 - (i % 2) * 6); W.add(d); }
  const pastel = ['#e6c7a0', '#cfd8b0', '#e0b8a8', '#b9d0d8', '#e8d29a', '#c9b8d0'];
  for (let i = -5; i <= 5; i++) { const f = facade({w: 12, h: 11 + (i % 3) * 2, color: pastel[(i + 6) % 6], cols: 3, rows: 3, seed: 400 + i, door: true}); f.position.set(S + i * 14, 0, -26); W.add(f); W.add(box(12, 11 + (i % 3) * 2, 6, '#8f6c5e', {x: S + i * 14, y: (11 + (i % 3) * 2) / 2, z: -29, thick: 0.04})); }
  for (let i = -8; i <= 8; i++) W.add(lampPost(S + i * 9 + 3, -10, 4.8));
  for (let i = -6; i <= 6; i++) { const f = P.flag('#c43d32'); f.position.set(S + i * 12 + 6, 0, -14); W.add(f); }
  for (let i = 0; i < 7; i++) W.add(cloud(S - 80 + i * 28, 80 + (i % 3) * 10, -130, 7));
  for (const sx of [-12, 14]) W.add(P.at(P.tree(1.3, 60 + sx), S + sx * 3, 0.05, -18));
  // Pepsi kiosk with a queue
  const K = S - 3;
  const kio = kiosk('PEPSI'); kio.position.set(K, 0, -4); W.add(kio);
  for (let i = 0; i < 7; i++) person(['red', 'teal', 'mustard', 'pink', 'clerk', 'student', 'navy'][i], ['none', 'cap', 'bowler', 'none', 'cap', 'none', 'top'][i], K + 3.4 + i * 1.25, 0.05, -1.6 + (i % 2) * 0.35, 120 + i);
  person('clerk', 'cap', K, 0.05, -4.9, 130);
  W.add(pcrate({x: K - 3.4, y: 0.62, z: -3.6}), pcrate({x: K - 3.4, y: 1.82, z: -3.6, ry: 0.15}), pcrate({x: K - 4.7, y: 0.62, z: -3.2}));
  // exchange booth: "WORLD MARKET"
  const B = S + 17;
  const booth = new THREE.Group();
  booth.add(box(4.4, 2.6, 2.2, '#e0d4b4', {y: 1.3, thick: 0.04}), box(4.8, 0.16, 1.0, '#6b4430', {y: 1.1, z: 1.55, thick: 0.02}));
  const bsign = sign('WORLD MARKET', 5.4, 1.1, {bg: '#2f5d62', fg: '#fff4dc', w: 800, h: 165, font: 'bold 92px Arial, sans-serif'}); bsign.position.set(0, 3.5, 0.4); booth.add(bsign);
  booth.add(cyl(0.06, 0.06, 1.0, '#3a3a3a', {x: -2.5, y: 3.1, z: 0.4, seg: 8}), cyl(0.06, 0.06, 1.0, '#3a3a3a', {x: 2.5, y: 3.1, z: 0.4, seg: 8}));
  booth.position.set(B, 0, -4); W.add(booth);
  person('official', 'bowler', B, 0.05, -4.9, 140, {glasses: true});
  person('mustard', 'none', B - 4.4, 0.05, -1.2, 141); person('pink', 'cap', B + 4.2, 0.05, -1.4, 142);
  // rubles that bounce
  const notes = [0, 1, 2].map((i) => { const n = sign('RUBLE', 1.1, 0.55, {bg: '#d9c9a0', w: 220, h: 110, font: 'bold 50px Arial, sans-serif'}); W.add(n); return n; });
  // closing set: flagpole + table with contract pages
  const FP = S - 34;
  const pole = cyl(0.12, 0.16, 12, '#cfcfcf', {x: FP, y: 6, z: -8, seg: 10}); W.add(pole);
  const redFlag = box(3.4, 2.0, 0.06, '#c43d32', {thick: 0.02}); redFlag.position.set(FP + 1.8, 10.4, -8); W.add(redFlag);
  const gold = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), toon('#e6b94a')); gold.position.set(FP, 12.2, -8); ink(gold, 0.03, false); W.add(gold);
  const sign91 = sign('1991', 3.6, 1.5, {bg: '#f2e6cc', w: 540, h: 225, font: 'bold 150px Arial, sans-serif'}); sign91.position.set(FP + 3.4, 6.8, -9); W.add(sign91);
  const ctable = P.desk(2.6, '#7a4f33'); ctable.position.set(FP + 6.6, 0.05, -5.6); W.add(ctable);
  const mgr2 = person('navy', 'bowler', FP + 6.0, 0.05, -6.8, 150, {glasses: true});
  const pages = Array.from({length: 14}, (_, i) => { const p = box(0.55, 0.012, 0.75, '#f7f0de', {thick: 0.003, edges: false}); p.userData.k = [rng(i + 3)(), rng(i + 9)(), rng(i + 17)()]; W.add(p); return p; });
  W.add(P.at(P.papers(6, 77), FP + 6.9, 1.08, -5.4));
  for (let i = 0; i < 5; i++) person(['red', 'teal', 'mustard', 'pink', 'student'][i], ['none', 'cap', 'none', 'bowler', 'cap'][i], FP - 6 + i * 3.4, 0.05, -2.2 - (i % 2) * 1.6, 160 + i);
  person('welder', 'cap', FP + 10.5, 0.05, -3.6, 170);

  // ======================= WAREHOUSE =======================
  const O = LOC.wh;
  W.add(room(O, {w: 24, h: 5.6, d: 13, wall: '#cdc2a6', floor: '#8a7a64', seed: 41}));
  for (let i = 0; i < 5; i++) { const sh = rack(80 + i, 4.2, 4.2); sh.position.set(O - 9.6 + i * 4.8, 0.05, -5.9); W.add(sh); }
  hang(W, O - 7, 0, 5.2); hang(W, O, 0, 5.2); hang(W, O + 7, 0, 5.2);
  const vl = sign('USSR', 3.0, 0.95, {bg: '#c43d32', fg: '#fff4dc', w: 480, h: 150, font: 'bold 96px Arial, sans-serif'}); vl.position.set(O - 8, 4.85, -6.4); W.add(vl);
  const vr = sign('USA', 3.0, 0.95, {bg: '#2f6db3', fg: '#ffffff', w: 480, h: 150, font: 'bold 96px Arial, sans-serif'}); vr.position.set(O + 8, 4.85, -6.4); W.add(vr);
  const pyr = new THREE.Group();
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5 - r; c++) pyr.add(pcrate({x: (c - (4 - r) / 2) * 1.25, y: 0.62 + r * 1.2, z: 0}));
  pyr.position.set(O + 4.9, 0.05, -2.6); W.add(pyr);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) W.add(pcrate({x: O + 10.4 + (c - (2 - r) / 2) * 1.25, y: 0.62 + r * 1.2, z: 2.6, ry: 0.2}));
  const smallPile = new THREE.Group(); for (let i = 0; i < 3; i++) smallPile.add(vcrate({x: i * 1.3 - 1.3, y: 0.62, z: 0, ry: (i - 1) * 0.1})); smallPile.add(vcrate({x: 0, y: 1.82, z: 0, ry: 0.1}));
  smallPile.position.set(O - 4.6, 0.05, -2.2); W.add(smallPile);
  const boycott = sign('BOYCOTT', 4.2, 1.2, {bg: '#c43d32', fg: '#ffffff', w: 630, h: 180, font: 'bold 112px Arial, sans-serif'}); boycott.position.set(O - 4.6, 3.9, -1.6); W.add(boycott);
  const pal = new THREE.Group(); pal.add(P.at(P.pallet(), 0, 0.05, 0), P.at(P.pallet(), 0, 0.05, 0));
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) pal.add(vcrate({x: (c - 1) * 1.25, y: 0.76 + r * 1.2, z: 0}));
  pal.position.set(O - 7.5, 0, 1.2); W.add(pal);
  const palCarrier = character({palette: 'welder', hat: 'cap', seed: 181}); palCarrier.position.set(O - 7.5, 0.05, 2.5); W.add(palCarrier); chars.push(palCarrier);
  const y1972 = sign('1972', 3.0, 1.2, {bg: '#f2e6cc', w: 480, h: 192, font: 'bold 130px Arial, sans-serif'}); y1972.position.set(O, 4.7, -6.4); W.add(y1972);
  person('mustard', 'cap', O + 3.8, 0.05, 2.2, 182); person('red', 'none', O - 8.4, 0.05, -2.8, 183); person('teal', 'cap', O + 9.6, 0.05, -3.8, 184);
  person('student', 'none', O - 10.8, 0.05, 3.2, 185); person('clerk', 'bowler', O + 10.8, 0.05, -0.4, 186);
  W.add(P.at(P.barrel('#2f6db3'), O - 11.2, 0.05, -2), P.at(P.barrel('#c43d32'), O + 11.4, 0.05, -4.6), P.at(P.barrel('#d9a441'), O - 1.4, 0.05, -4.6));
  for (let i = 0; i < 3; i++) W.add(P.at(P.pallet(), O + 8.5 + i * 1.4, 0.05, 4.6));

  // ======================= BOTTLING PLANT =======================
  const PL = LOC.plant;
  W.add(room(PL, {w: 30, h: 6.2, d: 13, wall: '#bcd4cf', floor: '#7d8587', seed: 51}));
  for (const x of [-9, -3, 3, 9]) hang(W, PL + x, 0, 5.8);
  W.add(box(30, 0.3, 1.5, '#2f3437', {x: PL, y: 0.9, z: -1.0, thick: 0.03}));
  for (let i = -7; i <= 7; i++) W.add(box(0.2, 0.9, 1.2, '#5b6468', {x: PL + i * 2, y: 0.45, z: -1.0, thick: 0.02}));
  const bottles = []; for (let i = 0; i < 44; i++) { const b = bottle(i % 3 ? PEPSI : '#3b7fc4'); b.scale.setScalar(1.7); W.add(b); bottles.push(b); }
  W.add(box(30, 0.3, 1.2, '#3a4144', {x: PL, y: 0.9, z: -3.1, thick: 0.03}));
  const crateRow = []; for (let i = 0; i < 12; i++) { const c = pcrate({s: 0.9}); W.add(c); crateRow.push(c); }
  for (let i = 0; i < 4; i++) W.add(cyl(1.3, 1.3, 4.4, i % 2 ? '#c9d2d6' : '#b8c4c9', {x: PL - 13 + i * 4.2, y: 2.2, z: -5.3, seg: 18, thick: 0.05}), cyl(1.45, 1.45, 0.3, '#5b6468', {x: PL - 13 + i * 4.2, y: 4.5, z: -5.3, seg: 18, thick: 0.03}));
  for (let i = 0; i < 3; i++) W.add(box(2.8, 2.4, 1.8, ['#2f6db3', '#c43d32', '#d9a441'][i], {x: PL - 11 + i * 11, y: 1.2, z: 5, thick: 0.04}));
  const plSign = sign('BOTTLING', 6.0, 1.3, {bg: '#2f6db3', fg: '#ffffff', w: 800, h: 175, font: 'bold 110px Arial, sans-serif'}); plSign.position.set(PL - 6.7, 5.3, -6.4); W.add(plSign);
  const cc = document.createElement('canvas'); cc.width = 800; cc.height = 360; const cg = cc.getContext('2d');
  const cTex = new THREE.CanvasTexture(cc); cTex.colorSpace = THREE.SRGBColorSpace; cTex.anisotropy = 8;
  let lastCount = -1;
  const drawCount = (n) => {
    cg.fillStyle = '#1d2326'; cg.fillRect(0, 0, 800, 360); cg.strokeStyle = '#d9a441'; cg.lineWidth = 14; cg.strokeRect(7, 7, 786, 346);
    cg.fillStyle = '#f2e6cc'; cg.font = 'bold 58px Arial, sans-serif'; cg.textAlign = 'center'; cg.fillText('SERVINGS A YEAR', 400, 78);
    cg.fillStyle = '#ffd66b'; cg.font = 'bold 110px Arial, sans-serif'; cg.fillText(n.toLocaleString('en-US'), 400, 245);
    cTex.needsUpdate = true;
  };
  drawCount(0);
  const cBoard = box(7.0, 3.15, 0.15, '#ffffff', {thick: 0.03});
  cBoard.material = [toon('#2b2b2e'), toon('#2b2b2e'), toon('#2b2b2e'), toon('#2b2b2e'), new THREE.MeshBasicMaterial({map: cTex}), toon('#2b2b2e')];
  cBoard.position.set(PL + 7.4, 3.5, -6.3); W.add(cBoard);
  person('welder', 'cap', PL - 7, 0.05, -2.1, 191); person('mustard', 'cap', PL - 1, 0.05, -2.1, 192); person('teal', 'none', PL + 4, 0.05, -2.1, 193); person('pink', 'cap', PL + 11, 0.05, -2.1, 194);
  person('navy', 'bowler', PL + 1.8, 0.05, 4.2, 195, {glasses: true});

  // ======================= SCRAPYARD =======================
  const SC = LOC.scrap;
  W.add(ground(120, 70, '#8c7f6c', {x: SC, z: -10, seed: 61, repeat: 12}));
  W.add(box(26, 0.3, 8, '#6b5a48', {x: SC, y: 0.05, z: 0, thick: 0.03}));
  const subA = sub(91, {L: 5}); subA.rotation.y = Math.PI / 2; subA.position.set(SC - 4.7, 1.7, 0); W.add(subA);
  const subB = sub(92, {L: 5}); subB.rotation.y = Math.PI / 2; subB.userData.rest = [SC + 4.7, 1.7, 0]; subB.position.set(...subB.userData.rest); W.add(subB);
  for (const x of [-7.5, -2.6, 2.6, 7.5]) W.add(box(1.6, 1.0, 1.0, '#4a3a2c', {x: SC + x, y: 0.7, z: 0, thick: 0.03}));
  const cr = P.crane(30); cr.position.set(SC + 14, 0.05, -4); W.add(cr);
  const hook = box(0.4, 0.6, 0.4, '#d9a441', {x: SC, y: 8, z: 0, thick: 0.03}); W.add(hook);
  const rope = cyl(0.04, 0.04, 6, '#2b2b2e', {x: SC, y: 6, z: 0, seg: 6, thick: 0.005}); W.add(rope);
  W.add(P.at(P.beamStack(5, 7), SC - 14, 0.05, -1, 0.2), P.at(P.beamStack(4, 5), SC + 10, 0.05, 9, 0.4), P.at(P.beamStack(3, 6), SC - 10, 0.05, 12, -0.3));
  for (let i = 0; i < 6; i++) W.add(P.at(P.barrel(['#9a5a3c', '#8a8f93', '#6a4a3a'][i % 3]), SC - 17 + i * 1.0, 0.05, 3 + (i % 2)));
  const scrapSign = sign('SCRAP', 4.2, 1.3, {bg: '#d9a441', fg: INK, w: 630, h: 195, font: 'bold 126px Arial, sans-serif'}); scrapSign.position.set(SC, 5.8, -3); W.add(scrapSign);
  W.add(cyl(0.1, 0.1, 5.8, '#3a3a3a', {x: SC - 2.4, y: 2.9, z: -3}), cyl(0.1, 0.1, 5.8, '#3a3a3a', {x: SC + 2.4, y: 2.9, z: -3}));
  W.add(P.at(P.fence(30), SC, 0.05, -14), P.at(P.toolbox(), SC - 4, 0.35, 3.4), P.at(P.toolbox(), SC + 3.6, 0.35, 3.2, 0.4));
  const spk = sparks(8, 140); W.add(spk);
  const cutOrigins = [[SC - 0.4, 1.9, 0.5], [SC + 0.4, 2.4, 0.5], [SC, 1.4, 0.5], [SC + 0.3, 2.1, 0.5]];
  person('welder', 'cap', SC - 1.8, 0.35, 2.4, 201); person('mustard', 'cap', SC + 1.9, 0.35, 2.4, 202); person('teal', 'cap', SC - 8, 0.05, 6, 203); person('red', 'cap', SC + 7.5, 0.05, 6.5, 204);
  for (let i = 0; i < 4; i++) W.add(P.at(P.tree(1.2, 205 + i), SC - 24 + i * 16, 0.05, -18));

  // ======================= OFFICE: "middleman" =======================
  const OF = LOC.office;
  W.add(room(OF, {w: 18, h: 5.4, d: 12, wall: '#cfe0d6', floor: '#a7764e', seed: 71}));
  hang(W, OF - 4, 0, 5.0); hang(W, OF + 4, 0, 5.0);
  W.add(P.at(P.rug(8, 4, '#3e5a7a', '#d9a441'), OF, 0, 1));
  const bc = document.createElement('canvas'); bc.width = 900; bc.height = 520; const bg2 = bc.getContext('2d');
  const bTex = new THREE.CanvasTexture(bc); bTex.colorSpace = THREE.SRGBColorSpace; bTex.anisotropy = 8;
  const rbox = (x, y, w, h, fill, label, fs = 54) => { bg2.fillStyle = fill; bg2.strokeStyle = INK; bg2.lineWidth = 8; bg2.beginPath(); bg2.roundRect(x, y, w, h, 18); bg2.fill(); bg2.stroke(); bg2.fillStyle = fill === '#2f6db3' ? '#fff' : INK; bg2.font = `bold ${fs}px Arial, sans-serif`; bg2.textAlign = 'center'; bg2.textBaseline = 'middle'; bg2.fillText(label, x + w / 2, y + h / 2); };
  const arrowTo = (x0, x1, y, k) => { if (k <= 0) return; const x = lerp(x0, x1, k); bg2.strokeStyle = '#c43d32'; bg2.lineWidth = 14; bg2.beginPath(); bg2.moveTo(x0, y); bg2.lineTo(x, y); bg2.stroke(); if (k > 0.9) { bg2.fillStyle = '#c43d32'; bg2.beginPath(); bg2.moveTo(x1 + 8, y); bg2.lineTo(x1 - 34, y - 28); bg2.lineTo(x1 - 34, y + 28); bg2.closePath(); bg2.fill(); } };
  let lastBoard = '';
  const drawBoard = (pHi, pX, a1, a2, pMid) => {
    const key = [pHi, pX, a1, a2, pMid].map((v) => v.toFixed(2)).join();
    if (key === lastBoard) return; lastBoard = key;
    bg2.fillStyle = '#f6f1e3'; bg2.fillRect(0, 0, 900, 520); bg2.strokeStyle = '#7a4f33'; bg2.lineWidth = 22; bg2.strokeRect(0, 0, 900, 520);
    bg2.fillStyle = INK; bg2.font = 'bold 50px Arial, sans-serif'; bg2.textAlign = 'center'; bg2.fillText('WHO DOES WHAT?', 450, 70);
    rbox(40, 230, 230, 120, '#e6d39a', 'SOVIETS', 46); rbox(335, 230, 230, 120, pHi > 0.5 ? '#2f6db3' : '#ffffff', 'PEPSI', 52); rbox(630, 230, 230, 120, '#d9c9a0', 'BUYER', 46);
    arrowTo(278, 330, 290, a1); arrowTo(572, 624, 290, a2);
    // little ship with a red cross
    bg2.fillStyle = '#7b8985'; bg2.strokeStyle = INK; bg2.lineWidth = 6; bg2.beginPath(); bg2.moveTo(380, 150); bg2.lineTo(520, 150); bg2.lineTo(495, 190); bg2.lineTo(405, 190); bg2.closePath(); bg2.fill(); bg2.stroke(); bg2.fillRect(430, 120, 40, 30);
    if (pX > 0) { bg2.strokeStyle = '#c43d32'; bg2.lineWidth = 16; bg2.beginPath(); bg2.moveTo(370, 110); bg2.lineTo(370 + 160 * Math.min(1, pX * 2), 110 + 100 * Math.min(1, pX * 2)); bg2.stroke(); if (pX > 0.5) { bg2.beginPath(); bg2.moveTo(530, 110); bg2.lineTo(530 - 160 * (pX - 0.5) * 2, 110 + 100 * (pX - 0.5) * 2); bg2.stroke(); } }
    if (pMid > 0) { bg2.globalAlpha = pMid; bg2.fillStyle = '#c43d32'; bg2.font = 'bold 76px Arial, sans-serif'; bg2.fillText('MIDDLEMAN', 450, 450); bg2.globalAlpha = 1; }
    bTex.needsUpdate = true;
  };
  drawBoard(0, 0, 0, 0, 0);
  const wb = box(7.4, 4.0, 0.12, '#ffffff', {thick: 0.03});
  wb.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: bTex}), toon('#4a3a2e')];
  wb.position.set(OF, 3.0, -5.7); W.add(wb);
  const od = P.desk(2.6, '#7a4f33'); od.position.set(OF + 4.8, 0.05, -2.4); W.add(od);
  W.add(P.at(P.papers(7, 5), OF + 4.6, 1.08, -2.4), P.at(P.phone(), OF + 5.4, 1.08, -2.6), P.at(P.deskLamp(), OF + 3.9, 1.08, -2.7), P.at(P.mug(), OF + 5.8, 1.08, -2.2));
  W.add(P.at(P.bookshelf(9, 2.6, 3.0), OF - 7.6, 0.05, -5.4), P.at(P.filingCabinet(), OF - 6.0, 0.05, -5.2), P.at(P.filingCabinet('#8f7d6a'), OF - 5.2, 0.05, -5.2));
  W.add(P.at(P.wallClock(), OF + 7.0, 4.6, -5.8)); W.add(P.at(P.poster('COLA', 1.1, 1.5, '#e6d39a'), OF + 7.6, 3.2, -5.85), P.at(P.poster('SHIPS', 1.1, 1.5, '#cfe3f0'), OF - 7.8, 3.6, -5.85));
  W.add(P.at(P.desk(2.2, '#6b4430'), OF - 5.0, 0.05, 2.8));
  const mgr = person('navy', 'bowler', OF - 0.6, 0.05, -1.4, 211, {glasses: true});
  person('clerk', 'none', OF + 3.2, 0.05, -0.6, 212); person('official', 'cap', OF + 7.2, 0.05, 0.4, 213); person('teal', 'cap', OF - 6.4, 0.05, 0.2, 214);
  const plantO = new THREE.Group(); plantO.add(cyl(0.35, 0.28, 0.7, '#b35a3a', {y: 0.35})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.3, 0.9 + (i % 3) * 0.25, Math.sin(i) * 0.3); ink(l, 0.02, false); plantO.add(l); } plantO.position.set(OF + 8.2, 0.05, 3.6); W.add(plantO);

  // ======================= HALL: the $3 billion deal =======================
  const HL = LOC.hall;
  W.add(room(HL, {w: 26, h: 6.4, d: 14, wall: '#e0cfae', floor: '#6b4430', seed: 81}));
  W.add(P.at(P.rug(12, 6, '#a8433a', '#e0b04a'), HL, 0, 0.5));
  for (const x of [-8, 0, 8]) hang(W, HL + x, 0, 6.0);
  for (let i = 0; i < 4; i++) { W.add(box(0.9, 6.2, 0.9, '#d8c7a5', {x: HL - 11 + i * 7.3, y: 3.1, z: -6.4, thick: 0.05})); }
  const tbl = box(7.6, 0.18, 2.2, '#5a3a26', {x: HL, y: 1.05, z: -3.2, thick: 0.03}); W.add(tbl);
  for (const x of [-3.4, 3.4]) for (const z of [-3.9, -2.5]) W.add(box(0.2, 1.0, 0.2, '#3f2a1c', {x: HL + x, y: 0.5, z, thick: 0.01}));
  W.add(P.at(P.papers(6, 12), HL - 1.8, 1.14, -3.2), P.at(P.papers(6, 13), HL + 2.0, 1.14, -3.2), P.at(P.mug('#2f6db3'), HL + 3.0, 1.14, -3.0), P.at(P.mug('#c43d32'), HL - 3.0, 1.14, -3.0));
  for (const [x, c] of [[-4.6, '#c43d32'], [4.6, PEPSI]]) { const f = P.flag(c); f.position.set(HL + x, 0.05, -4.4); f.scale.setScalar(1.7); W.add(f); }
  const hs1 = person('navy', 'bowler', HL - 0.62, 0.05, -1.2, 221, {glasses: true});
  const hs2 = person('official', 'cap', HL + 0.62, 0.05, -1.2, 222);
  person('clerk', 'none', HL - 4.6, 0.05, 0.6, 223); person('mustard', 'top', HL + 4.8, 0.05, 0.8, 224); person('teal', 'none', HL - 8.2, 0.05, -0.6, 225); person('pink', 'cap', HL + 8.6, 0.05, -0.2, 226);
  const bill = sign('$3 BILLION DEAL', 10.4, 2.3, {bg: '#2f5d62', fg: '#fff4dc', w: 1040, h: 230, font: 'bold 128px Arial, sans-serif'}); bill.position.set(HL, 4.9, -6.85); W.add(bill);
  const flashes = []; for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({color: '#fffbe0'})); f.position.set(HL - 4.5 + i * 3, 2.6 + (i % 2) * 0.5, 4); W.add(f); flashes.push(f); }
  for (const x of [-9.5, 9.5]) W.add(P.at(P.tree(1.2, 230 + x), HL + x, 0.05, 5.6));

  // ======================= per-frame =======================
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // water bob
    subs.forEach((s, i) => { s.position.y = s.userData.base[1] + Math.sin(t * 1.1 + i * 0.7) * 0.05; s.rotation.z = Math.sin(t * 0.9 + i) * 0.012; });
    ships.forEach((s, i) => { s.position.y = s.userData.base + Math.sin(t * 0.8 + i * 1.7) * 0.06; });
    // hook: "17" pops on "seventeen"; subs line up
    pop(sign17, t, wordT('hook', 5), 0.4);
    // then / deal: ship labels
    pop(lblCruiser, t, wordT('deal', 8), 0.3); pop(lblFrigate, t, wordT('deal', 10.5), 0.3); pop(lblDestroyer, t, wordT('deal', 13), 0.3);
    const inHarbor = shot === 'hook' || shot === 'then' || shot === 'deal' || shot === 'price';
    sign17.visible = inHarbor && shot !== 'then' && (shot !== 'hook' || t >= wordT('hook', 5));
    if (shot === 'hook') sign17.visible = t >= wordT('hook', 5);
    lblCruiser.visible = lblFrigate.visible = lblDestroyer.visible = shot === 'deal' || shot === 'price';
    if (shot === 'deal') { pop(lblCruiser, t, wordT('deal', 8), 0.3); pop(lblFrigate, t, wordT('deal', 10.5), 0.3); pop(lblDestroyer, t, wordT('deal', 13), 0.3); }
    pop(tag, t, wordT('price', 5.5), 0.35); cord.visible = gantry.visible = shot === 'price'; tag.visible = shot === 'price' && t >= wordT('price', 5.5);
    tag.position.y = 1.9 + Math.sin(t * 2.2) * 0.04;
    pop(banner, t, wordT('deal', 0.5), 0.4); banner.visible = (shot === 'deal') || (shot === 'then' && false);
    // officer points at the ships on "plenty of old warships"
    officer.userData.armR.rotation.z = shot === 'then' ? 1.35 + ease(t, wordT('then', 6), wordT('then', 9)) * 0.35 : 0;
    // contract: both shake the hand slowly
    if (shot === 'deal') { manager.userData.armR.rotation.z = 1.1 + Math.sin(t * 6) * 0.08; sovOfficer.userData.armL.rotation.z = -1.1 - Math.sin(t * 6) * 0.08; }
    // yousee: rubles bounce off WORLD MARKET
    const nShow = shot === 'yousee';
    notes.forEach((n, i) => {
      const a = wordT('yousee', 10.6 + i * 0.5), b = wordT('yousee', 15.6 + i * 0.3), c = wordT('yousee', 17.2), d = wordT('yousee', 18.8);
      const p1 = ease(t, a, b), p2 = ease(t, c, d);
      n.visible = nShow && t >= a;
      const x0 = K + 0.2 + i * 0.1, x1 = B - 2.6;
      n.position.set(lerp(x0, x1, p1) - (x1 - x0) * 0.55 * p2, 1.7 + Math.sin(p1 * Math.PI) * 0.5 + p2 * (0.6 - p2 * 0.6) + i * 0.25, -2.2 + i * 0.2);
      n.rotation.z = Math.sin(t * 4 + i) * 0.2 + p2 * 1.2; n.rotation.y = 0;
    });
    // vodka shot: pallet carried from the USSR side to the USA side
    pal.visible = shot === 'vodka';
    const pk = ease(t, wordT('vodka', 4), wordT('vodka', 14.2));
    pal.position.set(lerp(O - 7.5, O + 6.0, pk), 0, 1.2); palCarrier.position.set(pal.position.x - 2.3, 0.05, 1.0);
    pop(y1972, t, wordT('vodka', 2.4), 0.3); y1972.visible = (shot === 'vodka') && t >= wordT('vodka', 2.4);
    // boycott sign drops in
    boycott.visible = shot === 'but' && t >= wordT('but', 3); boycott.position.y = 3.9 - (1 - ease(t, wordT('but', 3), wordT('but', 3) + 0.25)) * 0.8;
    boycott.scale.setScalar(Math.max(0.001, 0.7 + 0.3 * ease(t, wordT('but', 3), wordT('but', 3) + 0.25)));
    // plant: bottles on the belt, counter ticks up
    bottles.forEach((b, i) => { const x = (((i * 0.68 + t * 2.2) % 30) + 30) % 30 - 15; b.position.set(PL + x, 1.05, -1.0); });
    crateRow.forEach((c, i) => { const x = (((i * 2.5 + t * 1.2) % 30) + 30) % 30 - 15; c.position.set(PL + x, 1.35, -3.1); });
    if (shot === 'boom') {
      const v = Math.floor(1e9 * ease(t, wordT('boom', 3), wordT('boom', 8.4)) / 7919) * 7919;
      const val = t >= wordT('boom', 8.4) ? 1000000000 : v; if (val !== lastCount) { lastCount = val; drawCount(val); }
    }
    // scrap: sparks, crane lifts the bow piece
    const lift = ease(t, wordT('so', 3), wordT('so', 7.5));
    subB.position.set(subB.userData.rest[0] + lift * 2.4, subB.userData.rest[1] + lift * 3.0, subB.userData.rest[2]);
    hook.position.set(subB.position.x, subB.position.y + 3.4, 0); rope.position.set(subB.position.x, subB.position.y + 6.4, 0);
    spk.visible = shot === 'so'; if (shot === 'so') spk.userData.update(t, cutOrigins, 1);
    pop(scrapSign, t, wordT('so', 6.6), 0.3, 1); scrapSign.visible = shot === 'so' && t >= wordT('so', 6.6);
    // middleman board
    if (shot === 'middle') drawBoard(ease(t, wordT('middle', 2), wordT('middle', 3)), ease(t, wordT('middle', 3.6), wordT('middle', 6)), ease(t, wordT('middle', 7), wordT('middle', 9)), ease(t, wordT('middle', 8.6), wordT('middle', 10)), ease(t, wordT('middle', 10.4), wordT('middle', 11.4)));
    mgr.userData.armR.rotation.z = shot === 'middle' ? 0.8 + ease(t, wordT('middle', 4), wordT('middle', 5)) * 0.9 : 0;
    mgr.userData.armL.rotation.z = shot === 'middle' ? -0.8 - ease(t, wordT('middle', 4), wordT('middle', 5)) * 0.9 : 0;
    // hall: handshake + headline + flashes
    if (shot === 'big') { hs1.userData.armR.rotation.z = 1.5; hs2.userData.armL.rotation.z = -1.5; }
    pop(bill, t, wordT('big', 6), 0.4); bill.visible = shot === 'big' && t >= wordT('big', 6);
    flashes.forEach((f, i) => { f.visible = shot === 'big' && t > wordT('big', 6) && Math.sin(t * 9 + i * 2.1) > 0.85; });
    // close: red flag lowered on "collapsed", pages blow away on "vanished"
    const fl = ease(t, wordT('close', 4), wordT('close', 6.5));
    redFlag.position.set(FP + 1.8, lerp(10.8, 4.6, fl), -8); redFlag.rotation.z = Math.sin(t * 5) * 0.06 * (1 - fl);
    pop(sign91, t, wordT('close', 6), 0.3); sign91.visible = shot === 'close' && t >= wordT('close', 6);
    pages.forEach((p, i) => {
      const [a, b, c] = p.userData.k; const t0 = wordT('close', 8.6) + a * 0.5, k = ease(t, t0, t0 + 1.9);
      const sx = FP + 6.2 + (b - 0.5) * 1.5, sz = -5.6 + (c - 0.5) * 0.8;
      p.position.set(sx - 14 * k, 1.15 + Math.sin(k * Math.PI) * (2 + b * 2) + k * 4, sz + k * 6 * (c - 0.3));
      p.rotation.set(k * (4 + a * 6), k * 6, k * (3 + c * 5));
      p.visible = shot === 'close' && k < 0.99 || (shot !== 'close' ? false : false);
      if (shot === 'close' && k === 0) { p.position.set(sx, 1.2 + i * 0.012, sz); p.rotation.set(0, (b - 0.5) * 0.6, 0); p.visible = true; }
    });
    mgr2.userData.armR.rotation.z = shot === 'close' ? 1.0 + ease(t, wordT('close', 8.6), wordT('close', 9.4)) * 0.8 : 0;
  };

  return {group: W, update};
}
