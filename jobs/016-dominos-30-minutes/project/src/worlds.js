import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {car} from './props.js';
import * as P from './props.js';
import {wordT} from './camera.js';
import {dressStreet, dressOffice, dressJoint, dressWeather, dressYard} from './dress.js';
export const LOC = {night: 0, day: 300, office: 600, yard: 700, joint: 800, weather: 900};

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

function pizzaCar(color, lights = false) {
  const c = car(color, {lights});
  const roof = box(1.1, 0.34, 0.55, '#0b5cab', {x: -0.2, y: 2.1, thick: 0.02}); c.add(roof);
  for (const [z, ry] of [[0.29, 0], [-0.29, Math.PI]]) { const s = sign("DOMINO'S", 1.0, 0.28, {bg: '#0b5cab', fg: '#ffffff', w: 400, h: 112, font: 'bold 56px Arial'}); s.position.set(-0.2, 2.1, z); s.rotation.y = ry; c.add(s); }
  return c;
}
function boardTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return {c, g: c.getContext('2d'), t}; }
const lines = (g, arr, cx, y0, step, font, color) => { g.font = font; g.fillStyle = color; g.textAlign = 'center'; arr.forEach((l, i) => g.fillText(l, cx, y0 + i * step)); };

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const D = LOC.day, N = LOC.night, O = LOC.office, Y = LOC.yard, J = LOC.joint, R = LOC.weather;

  // ======== NIGHT STREET (crash) ========
  W.add(street(N, {lit: true, seed: 11}));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({color: '#f6ecc8', fog: false})); moon.position.set(N - 60, 120, -150); W.add(moon);
  const trafficN = dressStreet(W, N, {lit: true, seed: 11, chars, avoid: [N - 3, N + 3, N - 7, N + 13]});
  for (let i = 0; i < 6; i++) W.add(cloud(N - 70 + i * 30, 95 + (i % 2) * 12, -120, 6, '#3d3f6b'));
  const stl = sign('ST. LOUIS', 3.2, 0.8, {bg: '#2f7a4f', fg: '#ffffff', w: 640, h: 160, font: 'bold 80px Arial'}); stl.position.set(N + 7.0, 6.4, 7.4); W.add(stl);
  W.add(cyl(0.08, 0.08, 6.4, '#3a3a3a', {x: N + 5.1, y: 3.2, z: 7.4}), cyl(0.08, 0.08, 6.4, '#3a3a3a', {x: N + 8.9, y: 3.2, z: 7.4}));
  const carA = pizzaCar('#c43d32', true), carB = car('#d77a9c', {lights: true}); W.add(carA, carB);
  const spN = sparks(5, 160); W.add(spN);

  // ======== DAY STREET + DOMINO'S SHOP ========
  W.add(street(D, {seed: 23}));
  const trafficD = dressStreet(W, D, {seed: 23, chars, avoid: [D - 3, D + 7, D + 20.5, D + 18.3]});
  W.add(ground(44, 34, '#d8cdb8', {x: D, z: -24, seed: 5, repeat: 5}));
  W.add(facade({w: 18, h: 4.5, color: '#efe8d4', cols: 4, rows: 1, door: true, seed: 91}).translateX(D).translateZ(-10));
  W.add(box(18, 8, 8, '#e4dcc4', {x: D, y: 4, z: -14.3, thick: 0.04}));
  W.add(box(18.2, 3.0, 0.5, '#0b5cab', {x: D, y: 6.1, z: -9.9}), box(18.4, 0.3, 0.7, '#c43d32', {x: D, y: 4.7, z: -9.8}));
  const shopSign = sign("DOMINO'S", 10, 2.2, {bg: '#0b5cab', fg: '#ffffff', w: 1000, h: 220, font: 'bold 150px Arial', border: false}); shopSign.position.set(D - 2.5, 6.1, -9.6); W.add(shopSign);
  const bigClock = P.wallClock(); bigClock.scale.setScalar(4.2); bigClock.position.set(D + 6.2, 6.1, -9.5); W.add(bigClock);
  const bannerA = sign('30 MIN OR FREE', 8, 1.8, {bg: '#c43d32', fg: '#fff4dc', font: 'bold 104px Arial, sans-serif', w: 900, h: 202}); bannerA.position.set(D, 3.5, -6); W.add(bannerA);
  const bannerB = sign('SATISFACTION', 8, 1.8, {bg: '#2f7a4f', fg: '#fff4dc', font: 'bold 104px Arial, sans-serif', w: 900, h: 202, sub: 'GUARANTEED'}); bannerB.position.set(D, 3.5, -6); W.add(bannerB);
  W.add(cyl(0.12, 0.14, 5.0, '#3a3a3a', {x: D - 4.3, y: 2.5, z: -6}), cyl(0.12, 0.14, 5.0, '#3a3a3a', {x: D + 4.3, y: 2.5, z: -6}));
  for (let i = 0; i < 7; i++) W.add(cloud(D - 80 + i * 28, 100 + (i % 3) * 10, -130, 7));
  // hook props: a stack of pizza boxes on a table at the curb
  const tbl = new THREE.Group(); tbl.add(box(1.5, 0.9, 1.4, '#8a5a3b', {y: 0.45}));
  for (let i = 0; i < 5; i++) tbl.add(box(1.0, 0.14, 1.0, i % 2 ? '#f4efe0' : '#efe2c0', {y: 1.0 + i * 0.15, ry: (i - 2) * 0.05, thick: 0.015}));
  const lid = sign('30 MIN', 0.9, 0.9, {bg: '#c43d32', fg: '#ffffff', w: 256, h: 256, font: 'bold 80px Arial', border: false}); lid.rotation.x = -Math.PI / 2; lid.position.set(0, 1.78, 0); tbl.add(lid);
  tbl.position.set(D - 1.2, 0.25, 5.6); W.add(tbl);
  const dcar = pizzaCar('#c43d32', false); dcar.position.set(D + 8.5, 0.05, -3.5); dcar.rotation.y = 0.35; W.add(dcar);
  const drv = character({palette: 'red', hat: 'cap', seed: 301}); drv.position.set(D + 4.6, 0.05, -2.6); W.add(drv); chars.push(drv);
  const cook = character({palette: 'mustard', hat: 'cap', seed: 302}); cook.position.set(D - 3.4, 0.05, -4.2); W.add(cook); chars.push(cook);
  // newsstand for the closing shot
  const stand = new THREE.Group();
  stand.add(box(4, 2.4, 1.6, '#2f5d62', {y: 1.2}), box(4.6, 0.2, 2.2, '#c43d32', {y: 2.5}));
  const mag = sign('$78M', 1.5, 1.7, {bg: '#f4ead4', w: 300, h: 340, font: 'bold 100px Arial, sans-serif', sub: 'JURY VERDICT'}); mag.position.set(-0.8, 1.4, 0.86); stand.add(mag);
  const mag2 = sign('NEWS', 1.1, 1.5, {bg: '#e6d39a', w: 220, h: 300, font: 'bold 70px Arial, sans-serif'}); mag2.position.set(0.9, 1.3, 0.86); stand.add(mag2);
  stand.position.set(D + 20.5, 0.25, 5.8); W.add(stand);
  const reader = character({palette: 'official', hat: 'none', glasses: true, seed: 51}); reader.position.set(D + 18.3, 0.25, 7.2); W.add(reader); chars.push(reader);

  // ======== COURTROOM ========
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#d9c9a8', floor: '#8a5a3b', seed: 8}));
  dressOffice(W, O, chars);
  const vb = boardTex(640, 360), vtex = vb.t;
  const drawVerdict = (p) => { const g = vb.g; g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, 640, 360); g.strokeStyle = '#8a5a3b'; g.lineWidth = 22; g.strokeRect(0, 0, 640, 360); lines(g, ['VERDICT'], 320, 85, 0, 'bold 54px Arial, sans-serif', '#f2ead6'); g.save(); g.globalAlpha = p; lines(g, ['$78,000,000'], 320, 235, 0, 'bold 96px Arial, sans-serif', '#ffd66b'); g.restore(); vtex.needsUpdate = true; };
  drawVerdict(0);
  const vboard = box(4.4, 2.5, 0.12, '#ffffff', {thick: 0.02});
  vboard.material = [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshBasicMaterial({map: vtex}), toon('#5a3a26')];
  vboard.position.set(O + 3.2, 2.9, -5.35); W.add(vboard);

  // ======== KITCHEN ========
  W.add(room(J, {w: 22, h: 8, d: 12, wall: '#ecdcb8', floor: '#9a5a44', seed: 19}));
  dressJoint(W, J, chars);
  const freeStamp = sign('FREE!', 2.6, 1.0, {bg: '#c43d32', fg: '#ffffff', w: 520, h: 200, font: 'bold 130px Arial'}); freeStamp.position.set(J + 3.2, 2.8, -3.6); freeStamp.rotation.z = -0.12; W.add(freeStamp);
  const kClock = P.wallClock(); kClock.scale.setScalar(4.4); kClock.position.set(J + 5.4, 4.6, -5.85); W.add(kClock);

  // ======== COURTHOUSE (yard) ========
  W.add(ground(60, 50, '#b8b09c', {x: Y, z: -5, seed: 14, repeat: 8}));
  W.add(facade({w: 20, h: 6.5, color: '#e6dec9', cols: 4, rows: 1, door: true, seed: 71}).translateX(Y).translateZ(-8.4));
  W.add(box(20, 9, 10, '#cfc7b2', {x: Y, y: 4.5, z: -13.6, thick: 0.04}));
  W.add(box(21, 1.6, 1.0, '#d8d0bc', {x: Y, y: 7.7, z: -8}));
  const chs = sign('COURTHOUSE', 8, 1.2, {bg: '#d8d0bc', fg: '#351f22', w: 1000, h: 150, font: 'bold 100px Arial', border: false}); chs.position.set(Y, 7.7, -7.45); W.add(chs);
  dressYard(W, Y, chars);
  const woman = character({palette: 'pink', hat: 'none', seed: 761}); woman.position.set(Y - 0.6, 0.05, 1.3); W.add(woman); chars.push(woman);
  const lawyer = character({palette: 'navy', hat: 'none', glasses: true, seed: 762}); lawyer.position.set(Y - 2.2, 0.05, 1.0); W.add(lawyer); chars.push(lawyer);
  const placard = sign('30 MIN RUSH', 2.6, 1.7, {bg: '#f4ead4', w: 520, h: 340, font: 'bold 66px Arial', sub: 'UNSAFE?'}); placard.position.set(Y + 1.2, 2.2, 1.6); W.add(placard); const pole = cyl(0.04, 0.04, 2.4, '#6b4430', {x: Y + 1.2, y: 1.2, z: 1.5}); W.add(pole);
  const envelope = sign('AMOUNT', 2.6, 1.7, {bg: '#e6d39a', w: 520, h: 340, font: 'bold 80px Arial', sub: 'SECRET'}); envelope.position.set(Y + 1.2, 2.2, 1.6); W.add(envelope);

  // ======== BOARDROOM ========
  W.add(room(R, {w: 16, h: 5.5, d: 11, wall: '#c9dbef', floor: '#8a6a4e', seed: 27}));
  dressWeather(W, R, chars);
  const bb = boardTex(800, 520), btex = bb.t;
  let lastB = '';
  const drawBoard = (mode, p1, p2) => {
    const key = mode + p1.toFixed(2) + p2.toFixed(2); if (key === lastB) return; lastB = key;
    const g = bb.g; g.fillStyle = '#f6f3e8'; g.fillRect(0, 0, 800, 520); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(6, 6, 788, 508);
    g.fillStyle = '#0b5cab'; g.fillRect(6, 6, 788, 90); lines(g, ["DOMINO'S MEETING"], 400, 70, 0, 'bold 54px Arial, sans-serif', '#ffffff');
    if (mode === 's07') { g.save(); g.globalAlpha = p1; lines(g, ['DRIVERS WERE', 'NEVER TOLD', 'TO SPEED'], 400, 220, 105, 'bold 92px Arial, sans-serif', '#351f22'); g.restore(); }
    if (mode === 's10') {
      lines(g, ['30 MIN OR FREE'], 400, 215, 0, 'bold 100px Arial, sans-serif', '#c43d32');
      if (p1 > 0) { g.strokeStyle = '#351f22'; g.lineWidth = 14; g.beginPath(); g.moveTo(40, 182); g.lineTo(40 + 720 * p1, 182); g.stroke(); }
      g.save(); g.globalAlpha = p2; lines(g, ['SATISFACTION', 'GUARANTEE'], 400, 340, 95, 'bold 88px Arial, sans-serif', '#2f7a4f'); g.restore();
    }
    btex.needsUpdate = true;
  };
  drawBoard('', 0, 0);
  const bboard = box(6.2, 4.0, 0.12, '#ffffff', {thick: 0.03});
  bboard.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: btex}), toon('#4a3a2e')];
  bboard.position.set(R - 1.0, 2.9, -5.35); W.add(bboard);
  const ctab = box(6.4, 0.15, 2.2, '#6b4430', {x: R - 1.2, y: 1.0, z: -2.2}); W.add(ctab);
  for (const [x, z] of [[-3, -1.2], [3, -1.2], [-3, -3.2], [3, -3.2]]) W.add(box(0.2, 1.0, 0.2, '#4a2f20', {x: R - 1.2 + x * 0.95, y: 0.5, z}));
  const boss = character({palette: 'official', hat: 'top', seed: 81}); boss.position.set(R - 5.0, 0.05, 0.2); W.add(boss); chars.push(boss);
  const exec = character({palette: 'navy', hat: 'none', glasses: true, seed: 72}); exec.position.set(R + 3.4, 0.05, 0.2); W.add(exec); chars.push(exec);

  // ======== per-frame update ========
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    trafficN(t, cam); trafficD(t, cam);
    // crash: cars meet at the word "collided"
    const tc = wordT('s05', 10);
    const dt = Math.max(0, Math.min(1.7, tc - t));
    const post = ease(t, tc, tc + 0.5);
    carA.position.set(N - 2.4 - 4 * dt - 0.7 * post, 0, 11.0); carA.rotation.y = -0.18 * post;
    carB.position.set(N + 2.4 + 4 * dt + 0.7 * post, 0, 12.2); carB.rotation.y = Math.PI + 0.22 * post;
    const sp = shot === 's05' ? ease(t, tc, tc + 0.25) * (1 - ease(t, tc + 0.9, tc + 1.5)) : 0;
    spN.visible = sp > 0.01; spN.userData.update(t, [[N - 0.2, 1.2, 11.6], [N + 0.2, 1.0, 11.8], [N, 1.6, 11.4]], sp);
    // shop banners
    const swapped = (shot === 's09' && t > wordT('s09', 4)) || shot === 's12';
    bannerA.visible = !swapped; bannerB.visible = swapped;
    // courtroom verdict board
    const vp = shot === 's02' ? ease(t, wordT('s02', 6), wordT('s02', 6) + 0.5) : shot === 's08' ? ease(t, wordT('s08', 11), wordT('s08', 11) + 0.5) : 0;
    if (Math.abs(vp - (drawVerdict.last ?? -1)) > 0.02) { drawVerdict(vp); drawVerdict.last = vp; }
    // kitchen: FREE stamp pops on "free", clock hand spins on the ticking shot
    freeStamp.visible = shot === 's03' && t > wordT('s03', 11);
    freeStamp.scale.setScalar(Math.max(0.001, 1.5 - 0.5 * ease(t, wordT('s03', 11), wordT('s03', 11) + 0.25)));
    // courthouse signs
    placard.visible = shot === 's06' && t > wordT('s06', 4); pole.visible = placard.visible;
    placard.scale.setScalar(Math.max(0.001, ease(t, wordT('s06', 4), wordT('s06', 4) + 0.4)));
    envelope.visible = shot === 's11' && t > wordT('s11', 10);
    envelope.scale.setScalar(Math.max(0.001, ease(t, wordT('s11', 10), wordT('s11', 10) + 0.4)));
    // boardroom
    if (shot === 's07') drawBoard('s07', ease(t, wordT('s07', 4), wordT('s07', 4) + 0.5), 0);
    else if (shot === 's10') drawBoard('s10', ease(t, wordT('s10', 8), wordT('s10', 8) + 0.5), ease(t, wordT('s10', 22), wordT('s10', 22) + 0.5));
    drv.userData.armR.rotation.z = shot === 'hook' ? 2.0 + Math.sin(t * 7) * 0.3 : 0;
  };
  return {group: W, update};
}
