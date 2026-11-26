import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {tree, at as P_at} from './props.js';
import {wordT} from './camera.js';
import {dressStreet, dressOffice, dressWeather} from './dress.js';

export const LOC = {day: 300, office: 600, board: 900};

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


function restaurant(x, z) {
  const g = new THREE.Group();
  g.add(box(15, 4.4, 7, '#efe0b8', {y: 2.2}));
  g.add(box(15.6, 0.6, 7.6, '#c43d32', {y: 4.7}));
  g.add(box(15, 0.35, 0.5, '#f2c12e', {y: 4.25, z: 3.6, thick: 0.01}));
  for (const wx of [-4.6, 4.6]) g.add(box(4.2, 2.2, 0.1, '#9fd0e6', {x: wx, y: 2.3, z: 3.52, thick: 0.02}));
  g.add(box(1.6, 2.8, 0.1, '#6b3f37', {y: 1.4, z: 3.52, thick: 0.02}));
  const sg = sign("McDONALD'S", 7.4, 1.5, {bg: '#c43d32', fg: '#ffd23f', w: 900, h: 190, font: 'bold 110px Arial, sans-serif'}); sg.position.set(0, 6.2, 3.7); g.add(sg);
  g.add(cyl(0.12, 0.12, 2.6, '#3a3a3a', {x: -2.6, y: 4.9, z: 3.4}), cyl(0.12, 0.12, 2.6, '#3a3a3a', {x: 2.6, y: 4.9, z: 3.4}));
  g.position.set(x, 0, z); return g;
}

function plotModel(x, y, z) {
  const g = new THREE.Group();
  g.add(box(2.2, 0.12, 1.5, '#6aa84f', {thick: 0.02}));
  g.add(box(0.9, 0.5, 0.6, '#efe0b8', {x: -0.3, y: 0.31, z: -0.1, thick: 0.015}), box(1.0, 0.12, 0.7, '#c43d32', {x: -0.3, y: 0.62, z: -0.1, thick: 0.015}));
  g.position.set(x, y, z); return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const D = LOC.day, O = LOC.office, R = LOC.board;

  // ======== DAY STREET + RESTAURANT (hook, s07, s11, s12) ========
  W.add(street(D, {seed: 23}));
  const trafficD = dressStreet(W, D, {seed: 23, chars, avoid: []});
  W.add(ground(60, 30, '#cfc6b0', {x: D, z: -8, seed: 5, repeat: 6}));
  W.add(restaurant(D, -12.5));
  for (let i = 0; i < 7; i++) W.add(cloud(D - 80 + i * 28, 100 + (i % 3) * 10, -130, 7));
  for (const s of [-1, 1]) { W.add(P_at(tree(1.3, 70 + s), D + s * 10, -4)); W.add(P_at(tree(1.1, 74 + s), D + s * 13, -9)); }
  const franchisee = character({palette: 'mustard', hat: 'cap', seed: 41}); franchisee.position.set(D + 1.6, 0.05, -3.6); W.add(franchisee); chars.push(franchisee);
  const landlord = character({palette: 'official', hat: 'top', glasses: true, seed: 42}); landlord.position.set(D - 1.4, 0.05, -3.6); W.add(landlord); chars.push(landlord);
  const bag = new THREE.Group(); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), toon('#8a6a3b')); bb.position.y = 0.5; ink(bb, 0.02, false); bag.add(bb);
  const bs = sign('$', 0.5, 0.5, {bg: '#8a6a3b', fg: '#ffd23f', w: 128, h: 128, font: 'bold 100px Arial', border: false}); bs.position.set(0, 0.55, 0.52); bag.add(bs);
  bag.position.set(D - 2.6, 0.05, -3.0); W.add(bag);
  const landSign = sign("McDONALD'S LAND", 1.5, 0.5, {bg: '#c43d32', fg: '#fff4dc', w: 640, h: 200, font: 'bold 70px Arial, sans-serif'}); landSign.position.set(D - 1.9, 1.0, -2.2); W.add(landSign);
  const poles = new THREE.Group(); poles.add(cyl(0.05, 0.05, 1.0, '#3a3a3a', {x: D - 2.5, y: 0.5, z: -2.2}), cyl(0.05, 0.05, 1.0, '#3a3a3a', {x: D - 1.3, y: 0.5, z: -2.2})); W.add(poles);
  const sRoy = sign('ROYALTY', 2.0, 0.6, {bg: '#d6ebf7', w: 520, h: 160, font: 'bold 72px Arial, sans-serif'}); sRoy.position.set(D + 0.2, 3.9, -3.4); W.add(sRoy);
  const sRent = sign('RENT', 1.5, 0.6, {bg: '#ffe08a', w: 400, h: 160, font: 'bold 80px Arial, sans-serif'}); sRent.position.set(D - 0.4, 3.2, -3.4); W.add(sRent);
  // burger boxes in front of the franchisee (foreground)
  for (let i = 0; i < 3; i++) W.add(box(0.5, 0.35, 0.5, i % 2 ? '#ffd23f' : '#c43d32', {x: D + 2.8 + i * 0.5, y: 0.25 + 0.2, z: -2.6 + (i % 2) * 0.3, thick: 0.02}));

  // coin streams: gold = rent, blue = royalty
  const coinGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.035, 14);
  const mkStream = (col, n) => { const arr = []; const m = toon(col); for (let i = 0; i < n; i++) { const c = new THREE.Mesh(coinGeo, m); c.rotation.x = Math.PI / 2; W.add(c); arr.push(c); } return arr; };
  const rentCoins = mkStream('#f2c12e', 22), royCoins = mkStream('#6fb3e0', 14);
  const flow = (arr, t, on, from, to, arc, spd) => {
    arr.forEach((c, i) => {
      const ph = ((t * spd + i / arr.length) % 1);
      c.visible = on > 0.01 && ph < 0.98;
      c.position.set(from[0] + (to[0] - from[0]) * ph, from[1] + (to[1] - from[1]) * ph + Math.sin(ph * Math.PI) * arc, from[2] + (to[2] - from[2]) * ph);
      c.rotation.z = t * 6 + i; c.scale.setScalar(on);
    });
  };

  // ======== 1950s OFFICE (s03, s04, s05, s06) ========
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const desk = new THREE.Group();
  desk.add(box(4.2, 0.18, 2, '#8a5a3b', {y: 1.05}));
  for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) desk.add(box(0.15, 1.0, 0.15, '#6b4430', {x, y: 0.5, z}));
  desk.position.set(O - 2.5, 0, 0.5); W.add(desk);
  dressOffice(W, O, chars);
  const sonneborn = character({palette: 'engineer', hat: 'none', glasses: true, seed: 61}); sonneborn.position.set(O - 3.1, 0.05, -1.5); W.add(sonneborn); chars.push(sonneborn);
  const kroc = character({palette: 'official', hat: 'none', seed: 62}); kroc.position.set(O - 1.6, 0.05, -1.5); W.add(kroc); chars.push(kroc);
  const np1 = sign('H. SONNEBORN', 0.8, 0.2, {bg: '#e6d39a', w: 520, h: 120, font: 'bold 54px Arial, sans-serif'}); np1.position.set(O - 3.1, 1.17, 0.95); np1.rotation.x = -0.5; W.add(np1);
  const np2 = sign('R. KROC', 0.6, 0.2, {bg: '#e6d39a', w: 400, h: 120, font: 'bold 60px Arial, sans-serif'}); np2.position.set(O - 1.6, 1.17, 0.95); np2.rotation.x = -0.5; W.add(np2);
  const table = new THREE.Group(); table.add(box(2.6, 0.9, 1.8, '#7a5a40', {y: 0.45}));
  table.position.set(O + 3.0, 0.05, 0.8); W.add(table);
  const plot = plotModel(O + 3.0, 1.0, 0.8); W.add(plot);
  const ownSign = sign('OWN THE LAND', 1.8, 0.45, {bg: '#ffe08a', w: 640, h: 160, font: 'bold 68px Arial, sans-serif'}); ownSign.position.set(O + 3.0, 2.4, 0.2); W.add(ownSign);
  const flags = [];
  [[0.5, 0.45], [0.8, -0.3], [-0.9, -0.4], [-0.9, 0.45]].forEach(([fx, fz]) => {
    const f = new THREE.Group(); f.add(cyl(0.015, 0.015, 0.45, '#3a3a3a', {y: 0.22, thick: 0.004}), box(0.25, 0.15, 0.01, '#c43d32', {x: 0.13, y: 0.4, thick: 0.004}));
    f.position.set(O + 3.0 + fx, 1.06, 0.8 + fz); f.scale.setScalar(0.001); W.add(f); flags.push(f);
  });
  const reSign = sign('REAL ESTATE CO.', 3.4, 0.9, {bg: '#f2e6cc', w: 800, h: 210, font: 'bold 84px Arial, sans-serif'}); reSign.position.set(O + 3.2, 3.6, -5.3); W.add(reSign);
  const lease = sign('LEASE', 0.9, 1.1, {bg: '#f7f0de', w: 220, h: 270, font: 'bold 56px Arial, sans-serif'}); lease.position.set(O - 2.0, 1.16, 0.7); lease.rotation.x = -Math.PI / 2; W.add(lease);
  const franchisee2 = character({palette: 'mustard', hat: 'cap', seed: 63}); franchisee2.position.set(O - 0.1, 0.05, 1.0); W.add(franchisee2); chars.push(franchisee2);
  const win = sign('', 2.4, 2.0, {bg: '#bfe3f5', border: true}); win.position.set(O - 5, 3.1, -5.4); W.add(win);

  // ======== CHART ROOM (s02, s08, s09, s10) ========
  W.add(room(R, {w: 16, h: 5.5, d: 11, wall: '#c9dbef', floor: '#8a6a4e', seed: 27}));
  const cv = document.createElement('canvas'); cv.width = 800; cv.height = 508; const cg = cv.getContext('2d');
  const boardTex = new THREE.CanvasTexture(cv); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 8;
  const label = (txt, x, y, size, col = INK) => { cg.fillStyle = col; cg.font = `bold ${size}px Arial, sans-serif`; cg.textAlign = 'center'; cg.fillText(txt, x, y); };
  const house = (x, y, w, col) => { cg.fillStyle = col; cg.strokeStyle = INK; cg.lineWidth = 4; cg.fillRect(x, y + 18, w, w * 0.6); cg.strokeRect(x, y + 18, w, w * 0.6); cg.beginPath(); cg.moveTo(x - 6, y + 18); cg.lineTo(x + w / 2, y - 8); cg.lineTo(x + w + 6, y + 18); cg.closePath(); cg.fillStyle = '#c43d32'; cg.fill(); cg.stroke(); };
  const drawBoard = (mode, p) => {
    cg.fillStyle = '#f7f0de'; cg.fillRect(0, 0, 800, 508); cg.strokeStyle = '#8a5a3b'; cg.lineWidth = 18; cg.strokeRect(0, 0, 800, 508);
    if (mode === 'pie') {
      label('SHARE OF REVENUE', 400, 70, 52);
      const a = Math.PI * 2 * (1 / 3) * p; cg.lineWidth = 5; cg.strokeStyle = INK;
      cg.fillStyle = '#cfd6dc'; cg.beginPath(); cg.arc(400, 290, 150, 0, Math.PI * 2); cg.fill(); cg.stroke();
      if (p > 0) { cg.fillStyle = '#f2c12e'; cg.beginPath(); cg.moveTo(400, 290); cg.arc(400, 290, 150, -Math.PI / 2, -Math.PI / 2 + a); cg.closePath(); cg.fill(); cg.stroke(); }
      label('RENT  ABOUT 1/3', 400, 478, 44, '#8a5a00');
    } else if (mode === 'bars') {
      label('WHAT FRANCHISEES PAY', 400, 66, 50);
      const base = 440; cg.strokeStyle = INK; cg.lineWidth = 5; cg.beginPath(); cg.moveTo(120, base); cg.lineTo(680, base); cg.stroke();
      const hr = 300 * p, hy = 190 * p; cg.fillStyle = '#f2c12e'; cg.fillRect(190, base - hr, 160, hr); cg.strokeRect(190, base - hr, 160, hr);
      cg.fillStyle = '#6fb3e0'; cg.fillRect(450, base - hy, 160, hy); cg.strokeRect(450, base - hy, 160, hy);
      label('RENT', 270, 480, 42); label('ROYALTY', 530, 480, 42);
    } else {
      const n9 = mode === 'nine';
      label(n9 ? '9 IN 10 ARE FRANCHISED' : 'LAND OWNED BY MCDONALD\'S', 400, 66, n9 ? 46 : 42);
      for (let i = 0; i < 10; i++) {
        const x = 90 + (i % 5) * 126, y = 150 + Math.floor(i / 5) * 150, vis = p * 10 > i;
        house(x, y, 80, n9 ? (i === 9 ? '#b9bec4' : (vis ? '#f2c12e' : '#e2dccb')) : '#e8d8b0');
        if (!n9 && vis && i < 5) { cg.fillStyle = '#c43d32'; cg.fillRect(x + 84, y - 12, 5, 62); cg.fillRect(x + 84, y - 12, 34, 20); }
      }
      label(n9 ? 'FRANCHISEES RUN 9' : 'ABOUT HALF: 5 IN 10', 400, 478, 40, '#8a5a00');
    }
    boardTex.needsUpdate = true;
  };
  drawBoard('pie', 0);
  const board = box(5.2, 3.3, 0.12, '#ffffff', {thick: 0.03});
  board.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: boardTex}), toon('#4a3a2e')];
  board.position.set(R - 1.0, 2.9, -5.35); W.add(board);
  dressWeather(W, R, chars);
  const presenter = character({palette: 'clerk', hat: 'bowler', glasses: true, seed: 81}); presenter.position.set(R + 2.7, 0.05, -3.3); W.add(presenter); chars.push(presenter);

  // ======== per-frame update ========
  let lastKey = '';
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    trafficD(t, cam);
    const street = ['hook', 's07', 's11', 's12'].includes(shot);
    const rentOn = street && (shot !== 's07' || t > wordT('s07', 6)) ? 1 : 0;
    const royOn = shot === 's07' && t > wordT('s07', 3) ? 1 : 0;
    flow(rentCoins, t, rentOn, [D + 1.6, 1.5, -3.6], [D - 1.4, 1.7, -3.6], 0.9, 0.55);
    flow(royCoins, t, royOn, [D + 1.6, 2.0, -3.6], [D - 1.4, 2.2, -3.6], 1.5, 0.45);
    sRent.visible = shot === 's07'; sRoy.visible = shot === 's07';
    landSign.visible = poles.visible = shot === 's11' || shot === 's12';
    franchisee.userData.armR.rotation.z = rentOn ? 1.2 + Math.sin(t * 6) * 0.4 : 0;
    // office: flags pop up as "bought or leased land"
    flags.forEach((f, i) => f.scale.setScalar(Math.max(0.001, ease(t, wordT('s05', 5 + i), wordT('s05', 5 + i) + 0.4))));
    if (shot === 's05' || shot === 's04') flags.forEach((f) => { if (shot === 's04') f.scale.setScalar(0.001); });
    lease.visible = true;
    kroc.userData.armR.rotation.z = shot === 's03' ? 1.6 + Math.sin(t * 5) * 0.3 : 0;
    sonneborn.userData.armR.rotation.z = shot === 's06' ? 1.7 : 0;
    // chart board
    let mode = null, p = 0;
    if (shot === 's02') { mode = 'pie'; p = ease(t, wordT('s02', 4), wordT('s02', 8)); }
    else if (shot === 's08') { mode = 'bars'; p = ease(t, wordT('s08', 1), wordT('s08', 4)); }
    else if (shot === 's09') { mode = 'nine'; p = ease(t, wordT('s09', 2), wordT('s09', 11)); }
    else if (shot === 's10') { mode = 'half'; p = ease(t, wordT('s10', 3), wordT('s10', 10)); }
    if (mode) { const k = mode + Math.round(p * 40); if (k !== lastKey) { drawBoard(mode, p); lastKey = k; } }
  };
  return {group: W, update};
}
