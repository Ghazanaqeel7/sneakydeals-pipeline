import * as THREE from 'three';
import {rng, box, cyl, sign, toon, ink, lampPost} from './kit.js';
import {character} from './char.js';
import * as P from './props.js';

const SHOPS = ['DINER', 'PHARMACY', 'BAKERY', 'HOTEL', 'BOOKS', 'DELI', 'SHOES', 'RADIO', 'CAFE', 'HARDWARE', 'FLOWERS', 'BARBER', 'GROCERY', 'TAILOR'];
const SHOPCOL = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
const CARCOL = ['#c43d32', '#2f6db3', '#4f8a4a', '#e6d9b8', '#7a4f73', '#3a3a3f', '#d9a441', '#9fc0d4'];

// ---------- street dressing (shared by night + day city) ----------
export function dressStreet(W, ox, {lit = false, seed = 1, chars, avoid = []} = {}) {
  const r = rng(seed);
  const near = (x) => avoid.some((a) => Math.abs(x - a) < 4.5);
  // shop fronts on the ground floor of the street facades
  let si = seed;
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const x = ox + side * (18 + i * 12.5);
    const s = P.shopFront(SHOPS[si++ % SHOPS.length], SHOPCOL[(i + 3) % 6], si); s.position.set(x, 0, 3.75); W.add(s);
  }
  for (let i = -6; i < 7; i++) { const s = P.shopFront(SHOPS[si++ % SHOPS.length], SHOPCOL[(i + 9) % 6], si); s.position.set(ox + i * 13, 0, 21.2); s.rotation.y = Math.PI; W.add(s); }
  // trees, hydrants, bins, mailboxes, news boxes, benches along both sidewalks
  for (let i = -5; i <= 5; i++) {
    const x = ox + i * 11 + 9.5;
    if (!near(x)) W.add(P.at(P.tree(1.1, seed + i), x, 0.25, 7.0));
    W.add(P.at(P.tree(1.0, seed + 40 + i), ox + i * 11 + 2, 0.25, 17.2));
    const k = i % 4, sx = ox + i * 11 + 6.6;
    if (near(sx)) continue;
    const item = [P.hydrant(), P.trashCan(), P.mailbox(), P.newsBox(['#c43d32', '#2f6db3', '#4f8a4a'][Math.abs(i) % 3])][(k + 4) % 4];
    W.add(P.at(item, sx, 0.25, 7.1));
    if (i % 3 === 0) W.add(P.at(P.bench(), ox + i * 11 + 0.5, 0.25, 4.3, 0));
  }
  W.add(P.at(P.trafficLight(), ox - 13.5, 0.25, 7.3), P.at(P.trafficLight(), ox + 13.5, 0.25, 7.3));
  // parked cars by the near curb
  for (let i = -5; i <= 5; i++) { if (i % 2) continue; const x = ox + i * 10 + 3; if (near(x)) continue; W.add(P.at(P.car(CARCOL[Math.floor(r() * 8)], {seed: i, lights: lit}), x, 0, 8.6)); }
  // pedestrians on both sidewalks
  const crowdN = lit ? 8 : 22;
  for (const a of avoid.slice(0, 1)) for (const [dx, pal, hat] of [[-2.6, 'red', 'none'], [2.8, 'teal', 'cap']]) { const c = character({palette: pal, hat, seed: seed * 7 + dx * 10}); c.position.set(a + dx, 0.25, 4.6); W.add(c); chars.push(c); }
  const cg = new THREE.Group(); W.add(cg);
  for (let i = 0; i < crowdN; i++) {
    const x = ox - 70 + r() * 140; if (near(x)) continue;
    const c = character({palette: ['engineer', 'student', 'clerk', 'official', 'red', 'teal', 'mustard', 'pink', 'navy'][Math.floor(r() * 9)], hat: ['none', 'cap', 'bowler', 'top', 'none'][Math.floor(r() * 5)], glasses: r() > 0.7, seed: seed * 50 + i});
    c.position.set(x, 0.25, r() > 0.5 ? 4.6 + r() * 1.2 : 18.0 + r() * 1.4); cg.add(c); chars.push(c);
  }
  // moving traffic in two lanes
  const traffic = [];
  for (let lane = 0; lane < 2; lane++) for (let i = 0; i < 7; i++) {
    const taxi = r() > 0.5;
    const c = i === 3 && lane === 1 ? P.bus() : P.car(CARCOL[Math.floor(r() * 8)], {taxi, lights: lit, seed: i});
    c.rotation.y = lane ? Math.PI : 0;
    const x0 = -120 + i * 34 + r() * 10, sp = (lane ? -1 : 1) * (6 + r() * 3);
    traffic.push({c, x0, sp, z: lane ? 13.8 : 10.3});
    W.add(c);
  }
  return (t, cam) => {
    for (const q of traffic) {
      let x = ((q.x0 + q.sp * t + 120) % 240 + 240) % 240 - 120;
      q.c.position.set(ox + x, 0, q.z);
      // keep cars from driving through the camera when it sits on the road
      const inRoad = cam.position.z > 7.6 && cam.position.z < 16.6 && Math.abs(cam.position.x - (ox + x)) < 140;
      q.c.visible = !(inRoad && Math.abs(cam.position.x - (ox + x)) < 7 && Math.abs(cam.position.z - q.z) < 6);
    }
  };
}

export function dressPlaza(W, ox, chars) {
  for (const s of [-1, 1]) {
    W.add(P.at(P.tree(1.4, 70 + s), ox + s * 8.5, 0.05, -11));
    W.add(P.at(P.tree(1.3, 72 + s), ox + s * 12, 0.05, -20));
    W.add(P.at(P.bench(), ox + s * 6, 0.05, -14, s * 0.3));
    for (let i = 0; i < 3; i++) W.add(P.at(P.flag(['#c43d32', '#2f6db3', '#f2f0e6'][i]), ox + s * (6 + i * 1.6), 0.05, -9.2));
  }
  const r = rng(91);
  for (let i = 0; i < 9; i++) {
    const c = character({palette: ['red', 'teal', 'mustard', 'clerk', 'navy', 'pink', 'student'][i % 7], hat: ['none', 'bowler', 'cap', 'top'][i % 4], seed: 900 + i});
    c.position.set(ox - 10 + r() * 20, 0.05, -13 - r() * 12); W.add(c); chars.push(c);
  }
}

// ---------- office ----------
export function dressOffice(W, O, chars) {
  // courtroom
  W.add(P.at(P.rug(9, 4, '#7a2f2f', '#d9a441'), O, 0.05, 1.0));
  // judge platform + bench
  W.add(box(6.4, 0.6, 2.4, '#5a3a26', {x: O, y: 0.3, z: -4.2}), box(5.4, 1.0, 0.5, '#7a4f33', {x: O, y: 1.1, z: -3.2}), box(5.6, 0.1, 0.8, '#4a2f20', {x: O, y: 1.65, z: -3.2}));
  const judge = character({palette: 'navy', hat: 'none', glasses: true, seed: 611}); judge.position.set(O, 0.6, -4.3); W.add(judge); chars.push(judge);
  const cs = sign('COURT', 3.0, 0.75, {bg: '#e6d39a', w: 600, h: 150, font: 'bold 84px Arial'}); cs.position.set(O, 4.0, -5.42); W.add(cs);
  W.add(P.at(P.flag('#c43d32', 4), O - 3.6, 0.05, -4.8), P.at(P.flag('#2f6db3', 5), O + 3.6, 0.05, -4.8));
  // jury box on the left wall
  W.add(box(0.6, 0.9, 6.4, '#7a4f33', {x: O - 5.9, y: 0.45, z: -0.8}));
  for (let i = 0; i < 6; i++) { const c = character({palette: ['red', 'teal', 'mustard', 'pink', 'engineer', 'clerk'][i], hat: i % 3 === 0 ? 'cap' : 'none', glasses: i % 2 === 1, seed: 620 + i}); c.position.set(O - 6.7, 0.05, -3.4 + i * 1.05); W.add(c); chars.push(c); }
  // counsel tables
  for (const [x, pal1, pal2, s1] of [[-2.4, 'pink', 'engineer', 640], [2.4, 'navy', 'red', 650]]) {
    const d = P.desk(2.6, '#8a5a3b'); d.position.set(O + x, 0.05, 0.4); W.add(d);
    W.add(P.at(P.papers(6, s1), O + x - 0.5, 1.02, 0.4), P.at(P.mug(), O + x + 0.8, 1.02, 0.5));
    const a = character({palette: pal1, hat: 'none', seed: s1}); a.position.set(O + x - 0.7, 0.05, -0.7); W.add(a); chars.push(a);
    const b = character({palette: pal2, hat: 'none', glasses: true, seed: s1 + 1}); b.position.set(O + x + 0.7, 0.05, -0.7); W.add(b); chars.push(b);
  }
  // witness stand + gallery benches
  W.add(box(1.3, 1.1, 1.0, '#7a4f33', {x: O + 6.0, y: 0.55, z: -3.4}));
  for (let k = 0; k < 2; k++) { W.add(box(6.5, 0.12, 0.7, '#8a5a3b', {x: O + 0.5, y: 0.5, z: 3.3 + k * 1.3}), box(6.5, 0.7, 0.1, '#8a5a3b', {x: O + 0.5, y: 0.95, z: 3.65 + k * 1.3})); }
  for (let i = 0; i < 4; i++) { const c = character({palette: ['teal', 'mustard', 'red', 'welder'][i], hat: i % 2 ? 'cap' : 'bowler', seed: 660 + i}); c.position.set(O - 1.8 + i * 1.4, 0.05, 3.0); W.add(c); chars.push(c); }
  W.add(P.at(P.wallClock(), O + 3.2, 4.75, -5.4), P.at(P.bookshelf(6, 2.0, 2.4), O - 7.75, 0.05, 4, Math.PI / 2));
  const sc = sign('SCALES OF JUSTICE', 2.2, 0.6, {bg: '#cfe3f0', w: 520, h: 140, font: 'bold 44px Arial'}); sc.position.set(O + 7.9, 3.4, 2); sc.rotation.y = -Math.PI / 2; W.add(sc);
  for (const x of [O - 3, O + 3]) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: 5.1, z: -1})); const sh = cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: 4.6, z: -1, seg: 14}); W.add(sh); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(x, 4.4, -1); W.add(b); }
}

// ---------- yard ----------
export function dressYard(W, Y, chars) {
  for (let i = 0; i < 4; i++) W.add(P.at(P.tree(1.3, 740 + i), Y - 20 + i * 13, 0.05, -11));
  for (const x of [-9, -3.6, 3.6, 9]) W.add(cyl(0.7, 0.8, 6.2, '#efe8d8', {x: Y + x, y: 3.1, z: -7.4, seg: 18}), cyl(0.9, 0.9, 0.3, '#d8d0bc', {x: Y + x, y: 6.3, z: -7.4, seg: 18}));
  for (let k = 0; k < 4; k++) W.add(box(14 - k * 0.8, 0.3, 1.2, '#d8d0bc', {x: Y, y: 0.15 + k * 0.3, z: -3.0 - k * 0.8}));
  W.add(P.at(P.flag('#c43d32', 6), Y - 8, 0.05, 3.5), P.at(P.flag('#2f6db3', 7), Y + 8, 0.05, 3.5));
  W.add(P.at(P.bench(), Y - 11, 0.05, 3.5), P.at(P.bench(), Y + 11.5, 0.05, 3.2), P.at(P.trashCan(), Y - 7, 0.05, 5), P.at(P.hydrant(), Y + 6.5, 0.05, 5.4));
  for (const [x, z, c] of [[-12.5, 6.5, '#2f6db3'], [13.5, 6.8, '#d9a441'], [-15, 8.6, '#4f8a4a']]) { const car = P.car(c); car.position.set(Y + x, 0, z); car.rotation.y = 0.15; W.add(car); }
  W.add(box(20, 0.4, 0.4, '#bfb8a4', {x: Y, y: 6.9, z: -7.4}));
  for (const [x, z, pal, s] of [[-4.6, 2.6, 'teal', 731], [5.4, 2.2, 'mustard', 732], [8.2, 3.4, 'red', 733], [-8.0, 2.8, 'navy', 734], [3.6, 4.4, 'clerk', 735], [-6.2, 4.6, 'welder', 736]]) { const w = character({palette: pal, hat: s % 2 ? 'cap' : 'bowler', seed: s}); w.position.set(Y + x, 0.05, z); W.add(w); chars.push(w); }
}

// ---------- steel workshop ----------
export function dressJoint(W, J, chars) {
  // pizza kitchen
  W.add(box(10, 1.0, 1.5, '#c9c3b4', {x: J - 1.5, y: 0.5, z: -4.4}), box(10.2, 0.1, 1.7, '#e8e4d8', {x: J - 1.5, y: 1.05, z: -4.4}));
  for (let i = 0; i < 5; i++) { const p = cyl(0.55, 0.55, 0.05, '#e0a63e', {x: J - 5 + i * 1.5, y: 1.13, z: -4.4, seg: 20, thick: 0.01}); W.add(p); const sa = cyl(0.45, 0.45, 0.02, '#c43d32', {x: J - 5 + i * 1.5, y: 1.17, z: -4.4, seg: 20, thick: 0.005}); W.add(sa); for (let k = 0; k < 4; k++) W.add(cyl(0.07, 0.07, 0.03, '#f4efe0', {x: J - 5.2 + i * 1.5 + k * 0.18, y: 1.2, z: -4.5 + (k % 2) * 0.2, seg: 8, thick: 0.004})); }
  for (let i = 0; i < 4; i++) W.add(box(1.0, 0.14, 1.0, '#f4efe0', {x: J - 5 + i * 0.1, y: 1.2 + i * 0.15, z: -3.7, thick: 0.01}));
  W.add(box(3.2, 2.6, 1.8, '#8c2f2a', {x: J - 8.2, y: 1.3, z: -4.6}), box(2.0, 1.1, 0.1, '#ffb347', {x: J - 8.2, y: 1.2, z: -3.68, edges: false, thick: 0.001}));
  const hs = sign('HOT OVEN', 1.8, 0.45, {bg: '#f2c12e', w: 420, h: 110, font: 'bold 56px Arial'}); hs.position.set(J - 8.2, 2.8, -3.65); W.add(hs);
  const wsg = sign('PIZZA IN 30 MIN', 7.4, 1.5, {bg: '#0b5cab', fg: '#ffffff', w: 1100, h: 230, font: 'bold 120px Arial', sub: 'OR IT IS FREE'}); wsg.position.set(J - 1.5, 5.7, -5.9); W.add(wsg);
  W.add(P.at(P.barrel('#c43d32'), J + 9.4, 0.05, -4.6), P.at(P.barrel('#d9a441'), J + 8.5, 0.05, -5.0), P.at(P.pallet(), J + 6.8, 0.05, -5.0));
  for (let i = 0; i < 3; i++) for (let k = 0; k < 4 + i; k++) W.add(box(1.0, 0.14, 1.0, '#f4efe0', {x: J + 6.8 + i * 1.3, y: 0.3 + k * 0.15, z: -5.0, thick: 0.01}));
  W.add(P.at(P.toolRack(2), J + 10, 0, -5.9), P.at(P.bookshelf(9, 2.4, 2.8), J + 3.0, 0.05, -5.6));
  W.add(P.at(P.rug(8, 3, '#8c2f2a', '#f2c12e'), J - 1, 0.05, 1.0));
  const t2 = P.desk(2.4); t2.position.set(J - 5.5, 0.05, 1.8); W.add(t2); W.add(P.at(P.phone(), J - 5.5, 1.0, 1.8), P.at(P.papers(6, 51), J - 6.2, 1.0, 1.8));
  for (const x of [J - 4, J + 4]) { W.add(cyl(0.02, 0.02, 1.4, '#2b2b2e', {x, y: 7.3, z: -1})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(x, 6.5, -1); W.add(b); }
  for (const [x, z, pal, hat, s] of [[-3.0, -3.1, 'red', 'cap', 811], [-6.4, -3.1, 'welder', 'cap', 812], [0.6, -3.1, 'mustard', 'cap', 813], [5.0, 0.4, 'navy', 'cap', 814]]) { const w = character({palette: pal, hat, seed: s}); w.position.set(J + x, 0.05, z); W.add(w); chars.push(w); }
}

// ---------- weather room ----------
export function dressWeather(W, R, chars) {
  W.add(P.at(P.rug(7, 4, '#3e5a7a', '#d9a441'), R, 0, -0.5));
  const d1 = P.desk(2.4); d1.position.set(R - 5.4, 0.05, -3.6); W.add(d1);
  W.add(P.at(P.radio(), R - 5.9, 1.0, -3.7), P.at(P.phone(), R - 4.8, 1.0, -3.4), P.at(P.papers(6, 21), R - 5.2, 1.0, -3.3), P.at(P.mug('#2f6db3'), R - 4.4, 1.0, -3.8));
  const d2 = P.desk(2.4, '#7a4f33'); d2.position.set(R + 6.0, 0.05, -4.3); W.add(d2);
  W.add(P.at(P.tvMonitor('ORDERS'), R + 5.6, 1.0, -4.4), P.at(P.tvMonitor('SALES'), R + 6.6, 1.0, -4.5, -0.2), P.at(P.phone(), R + 7.0, 1.0, -3.9));
  W.add(P.at(P.filingCabinet(), R - 7.2, 0.05, -4.9), P.at(P.filingCabinet('#8f7d6a'), R - 6.4, 0.05, -4.9));
  W.add(P.at(P.wallClock(), R + 4.6, 4.5, -5.4));
  const p = P.poster('RULES', 1.0, 1.3, '#f2c12e'); P.at(p, R - 5.6, 3.3, -5.45); W.add(p);
  for (const x of [R - 3, R + 3]) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: 5.1, z: -1})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: 4.6, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, 4.45, -1); W.add(b); }
  // foreground desk for depth + storm window + corkboard
  const fd = P.desk(2.2, '#6b4430'); fd.position.set(R - 3.6, 0.05, 2.4); fd.rotation.y = 0.2; W.add(fd);
  W.add(P.at(P.papers(6, 31), R - 3.8, 1.0, 2.4), P.at(P.phone(), R - 3.0, 1.0, 2.2), P.at(P.mug('#c43d32'), R - 4.4, 1.0, 2.6));
  const win = sign('', 2.6, 1.8, {bg: '#4a5568', border: true}); win.position.set(R - 7.95, 3.0, -1.5); win.rotation.y = Math.PI / 2; W.add(win);
  const cork = sign('MEMOS', 2.2, 1.4, {bg: '#c49a62', w: 440, h: 280, font: 'bold 50px Arial'}); cork.position.set(R + 2.9, 3.2, -5.45); W.add(cork);
  for (let i = 0; i < 5; i++) W.add(box(0.35, 0.45, 0.02, ['#f7f0de', '#fff1b8', '#cfe3f0'][i % 3], {x: R + 2.2 + (i % 3) * 0.6, y: 3.0 + Math.floor(i / 3) * 0.5, z: -5.38, thick: 0.004, edges: false}));
  const caller = character({palette: 'pink', hat: 'none', glasses: true, seed: 921}); caller.position.set(R - 5.0, 0.05, -2.4); W.add(caller); chars.push(caller);
  const m2 = character({palette: 'mustard', hat: 'bowler', seed: 922}); m2.position.set(R + 6.6, 0.05, -2.9); W.add(m2); chars.push(m2);
}
