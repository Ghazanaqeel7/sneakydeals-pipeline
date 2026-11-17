import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, crate, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import * as P from './props.js';

export const LOC = {diner: 0, office: 100, den: 200, airport: 300, fbi: 400, court: 500};
export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const S = (txt, w, h, o = {}) => sign(txt, w, h, {w: Math.round(w * 220), h: Math.round(h * 220), font: 'bold 80px Arial, sans-serif', ...o});
const put = (W, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; W.add(o); return o; };
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


export function buildWorld() {
  const W = new THREE.Group(); const chars = [];
  const man = (pal, hat, x, y, z, seed, glasses = false) => { const c = character({palette: pal, hat, glasses, seed}); c.position.set(x, y, z); W.add(c); chars.push(c); return c; };
  const lamps = (ox, y = 5.1) => { for (const x of [ox - 4, ox + 4]) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y, z: -1})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: y - 0.5, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(x, y - 0.7, -1); W.add(b); } };

  // ===== DINER =====
  const D = LOC.diner;
  W.add(room(D, {w: 18, h: 5.5, d: 11, wall: '#f4d9a0', floor: '#d8d2c4', seed: 3}));
  put(W, box(9, 1.1, 1.2, '#c8102e'), D, 0.55, -2.4);
  put(W, box(9.4, 0.12, 1.5, '#f2e6cc'), D, 1.15, -2.4);
  const menu = put(W, S('BURGERS & FRIES', 5, 1.1, {bg: '#c8102e', fg: '#ffd23f'}), D, 4.0, -5.4);
  put(W, S("McDONALD'S", 3.6, 0.9, {bg: '#ffd23f', fg: '#c8102e'}), D - 4.5, 3.4, -5.4);
  put(W, S('WIN FREE FOOD', 3.2, 0.9, {bg: '#2f6db3', fg: '#ffffff', sub: 'PEEL & PLAY'}), D + 4.6, 3.4, -5.4);
  for (let i = 0; i < 5; i++) put(W, P.at(cyl(0.22, 0.2, 0.7, '#c8102e', {seg: 12, y: 0.35}), 0, 0, 0), D - 3.5 + i * 1.8, 0.05, -0.9);
  put(W, P.at(P.rug(6, 3, '#d8d2c4', '#c8102e'), 0, 0, 0), D, 0.02, 1.6);
  for (const x of [-6.5, 6.5]) put(W, P.bookshelf(4, 2.2, 2.4), D + x, 0.05, -5.15);
  lamps(D);
  put(W, P.wallClock(), D + 7.8, 4.7, -5.4);
  // fries box + peel piece
  const fries = new THREE.Group(); fries.add(box(0.5, 0.45, 0.3, '#c8102e', {y: 0.22}));
  for (let i = 0; i < 7; i++) fries.add(box(0.06, 0.35, 0.06, '#ffd23f', {x: -0.18 + i * 0.06, y: 0.55 + (i % 3) * 0.04, z: (i % 2) * 0.05, thick: 0.004}));
  fries.scale.setScalar(1.8); put(W, fries, D - 1.2, 1.2, -2.2);
  const piece = S('1,000,000', 0.6, 0.34, {bg: '#ffd23f', font: 'bold 60px Arial, sans-serif'}); piece.position.set(D - 1.2, 1.75, -1.99); W.add(piece);
  const million = S('$1,000,000', 3.2, 1.0, {bg: '#ffd23f', fg: '#c8102e'}); million.position.set(D - 1.2, 3.1, -2.0); million.visible = false; W.add(million);
  man('mustard', 'cap', D + 0.8, 0.05, -3.3, 11);
  man('teal', 'none', D + 2.8, 0.05, -0.2, 12);
  man('pink', 'none', D - 4.2, 0.05, 0.2, 13);

  // ===== SIMON MARKETING OFFICE =====
  const O = LOC.office;
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  put(W, P.rug(7, 4), O, 0, 0.0);
  const dk = P.desk(2.8); put(W, dk, O, 0.05, -1.7);
  put(W, P.chair(), O + 0.4, 0.05, -2.7);
  put(W, P.at(P.papers(7, 3), 0, 0, 0), O - 0.6, 1.1, -1.7);
  put(W, P.deskLamp(), O - 1.2, 1.1, -1.5); put(W, P.mug(), O + 0.9, 1.1, -1.4);
  put(W, S('SIMON MARKETING', 4.4, 0.9, {bg: '#2f5d62', fg: '#f2e6cc'}), O - 1.5, 3.6, -5.4);
  put(W, S('SECURITY', 1.8, 0.6, {bg: '#c43d32', fg: '#fff4dc'}), O - 4.6, 3.2, -5.4);
  const vault = new THREE.Group(); const vd = cyl(1.2, 1.2, 0.35, '#7d8a8f', {seg: 28}); vd.rotation.x = Math.PI / 2; vault.add(vd);
  const vh = cyl(0.4, 0.4, 0.4, '#b3b8bf', {seg: 14}); vh.rotation.x = Math.PI / 2; vh.position.z = 0.2; vault.add(vh);
  vault.add(box(0.2, 1.8, 0.2, '#d8dde2', {z: 0.4, thick: 0.01}), box(1.8, 0.2, 0.2, '#d8dde2', {z: 0.4, thick: 0.01}));
  put(W, vault, O + 4.3, 2.0, -5.2);
  put(W, S('VAULT', 1.4, 0.45, {bg: '#f2c12e'}), O + 4.3, 3.6, -5.4);
  const env = new THREE.Group(); for (let i = 0; i < 6; i++) env.add(box(0.55, 0.04, 0.38, i % 2 ? '#f2e6cc' : '#e8d9a8', {y: 0.04 + i * 0.045, x: (i % 3) * 0.03, thick: 0.004}));
  put(W, P.desk(1.8, '#6b4430'), O + 2.8, 0.05, -3.6); put(W, env, O + 2.8, 1.02, -3.6);
  put(W, S('SEALED', 0.9, 0.3, {bg: '#c43d32', fg: '#fff4dc'}), O + 2.8, 1.6, -3.1);
  for (const x of [-6.6, 6.4]) put(W, P.filingCabinet(), O + x, 0.05, -4.9);
  put(W, P.bookshelf(5), O + 6.6, 0.05, -3.6, -Math.PI / 2); put(W, P.wallClock(), O - 6, 4.4, -5.4);
  lamps(O);
  const jac = man('navy', 'bowler', O + 0.4, 0.05, -3.2, 21, true);
  const recruit = man('red', 'cap', O - 2.2, 0.05, -1.0, 22);

  // ===== DEN (stepbrother + fake winners) =====
  const N = LOC.den;
  W.add(room(N, {w: 16, h: 5.5, d: 11, wall: '#d9b7a2', floor: '#8a6a4e', seed: 33}));
  put(W, P.rug(7, 4, '#3e5a7a', '#d9a441'), N, 0.02, -0.5);
  put(W, P.bookshelf(6, 2.4, 2.6), N - 6.2, 0.05, -5.15); put(W, P.bookshelf(4), N + 6.2, 0.05, -5.15);
  put(W, P.tvMonitor('NEWS'), N - 3.5, 1.0, -5.0);
  put(W, P.at(P.mug('#2f6db3'), 0, 0, 0), N + 3, 1.0, -4.6);
  put(W, P.desk(2.6, '#6b4430'), N + 3, 0.05, -4.7); put(W, P.papers(6, 5), N + 3, 1.05, -4.7);
  put(W, P.deskLamp(), N + 4, 1.05, -4.8);
  put(W, S('HOME SWEET HOME', 3.4, 0.8, {bg: '#f4ead4'}), N, 3.9, -5.4);
  lamps(N); put(W, P.wallClock(), N + 6, 4.4, -5.4);
  const sib = man('mustard', 'cap', N - 1.4, 0.05, -1.6, 31);
  const jac2 = man('navy', 'bowler', N + 1.4, 0.05, -1.8, 21, true);
  const p25 = S('$25,000', 0.9, 0.45, {bg: '#ffd23f'}); W.add(p25);
  const checkSign = S('WINNER  $1,000,000', 4.6, 1.5, {bg: '#f4ead4', fg: '#2f6db3'}); put(W, checkSign, N, 1.45, -3.4); checkSign.visible = false;
  const fakes = [[N - 3.4, 'red', 'none', 41], [N - 1.7, 'teal', 'cap', 42], [N + 1.7, 'pink', 'none', 43], [N + 3.4, 'mustard', 'bowler', 44]].map(([x, pa, h, s]) => { const c = man(pa, h, x, 0.05, -3.9, s); c.visible = false; return c; });
  const cutSign = S('HIS CUT', 1.4, 0.5, {bg: '#4f8a4a', fg: '#fff4dc'}); cutSign.position.set(N + 4.4, 2.5, -0.8); cutSign.visible = false; W.add(cutSign);
  const cutMan = man('navy', 'bowler', N + 4.4, 0.05, -1.0, 21, true); cutMan.visible = false;

  // ===== AIRPORT =====
  const A = LOC.airport;
  W.add(room(A, {w: 24, h: 6.5, d: 11, wall: '#cfd8e0', floor: '#a9aab0', seed: 45}));
  for (const [i, x] of [-1.8, 0, 1.8].entries()) put(W, box(1.4, 2.3, 0.12, ["#4f86b8", "#c43d32", "#4f8a4a"][i]), A + x, 1.2, -4.6);
  put(W, box(6, 0.2, 0.4, '#6f7a7d'), A, 2.45, -4.6);
  put(W, S('RESTROOMS', 3.2, 0.8, {bg: '#2f6db3', fg: '#ffffff'}), A, 3.4, -5.4);
  put(W, S('DEPARTURES', 4.4, 1.2, {bg: '#1f2433', fg: '#ffd23f', sub: 'GATE 12   ON TIME'}), A + 7, 3.6, -5.4);
  put(W, S('GATE 12  >', 2.6, 0.7, {bg: '#f2c12e'}), A - 7, 3.4, -5.4);
  for (const x of [-9, -5, 5, 9]) put(W, P.bench(), A + x, 0.05, -1.0 - (x % 2 ? 0.3 : 0), 0);
  for (const [x, z, c] of [[-8.4, -0.4, '#c43d32'], [4.4, 0.4, '#2f6db3'], [9.6, -0.2, '#4f8a4a']]) put(W, box(0.6, 0.9, 0.3, c), A + x, 0.5, z);
  const winA = S('', 5, 2.4, {bg: '#bfe3f5'}); put(W, winA, A - 9.5, 3.4, -5.4);
  lamps(A - 5, 6.1); lamps(A + 5, 6.1);
  const jacA = man('navy', 'bowler', A - 0.9, 0.05, -2.7, 21, true);
  const recA = man('red', 'cap', A + 1.3, 0.05, -2.6, 51);
  const friendA = man('pink', 'none', A + 3.6, 0.05, -2.4, 52);
  const pieceA = S('PIECE', 0.5, 0.3, {bg: '#ffd23f'}); W.add(pieceA);

  // ===== FBI ROOM =====
  const F = LOC.fbi;
  W.add(room(F, {w: 16, h: 5.5, d: 11, wall: '#6c7b8c', floor: '#4a4a55', seed: 55}));
  put(W, P.desk(3.0, '#4a4f58'), F - 1.5, 0.05, -2.4); put(W, P.phone(), F - 1.0, 1.0, -2.3); put(W, P.papers(6, 8), F - 2.2, 1.05, -2.4);
  const reels = []; for (const x of [-0.3, 0.5]) { const r = cyl(0.3, 0.3, 0.06, '#d8dde2', {seg: 20}); r.rotation.x = Math.PI / 2; put(W, r, F + x - 1.8, 1.55, -2.1); reels.push(r); }
  put(W, box(1.4, 0.5, 0.5, '#3a3a3f'), F - 1.4, 1.3, -2.4);
  const board = box(6, 3.4, 0.12, '#8a6a4e'); put(W, board, F + 3.2, 2.9, -5.4);
  for (let i = 0; i < 6; i++) put(W, box(0.7, 0.9, 0.03, '#f2e6cc', {thick: 0.004}), F + 1.2 + (i % 3) * 1.4 + (i > 2 ? 0.4 : 0), 3.3 - (i > 2 ? 1.3 : 0), -5.3);
  for (let i = 0; i < 5; i++) put(W, box(1.5, 0.02, 0.02, '#c43d32', {thick: 0.002, edges: false}), F + 2 + i * 0.7, 2.6 + (i % 2) * 0.4, -5.28, i * 0.4);
  const opSign = S('OPERATION FINAL ANSWER', 4.4, 0.9, {bg: '#c43d32', fg: '#fff4dc'}); put(W, opSign, F + 3.2, 4.4, -5.3); opSign.visible = false;
  put(W, S('FBI', 1.4, 0.7, {bg: '#1f3a6b', fg: '#ffffff'}), F - 4.6, 3.6, -5.4);
  put(W, P.filingCabinet(), F - 7, 0.05, -4.8); put(W, P.filingCabinet('#8f7d6a'), F - 6.2, 0.05, -4.8); put(W, P.wallClock(), F - 1, 4.5, -5.4);
  lamps(F);
  const ag1 = man('official', 'none', F - 1.5, 0.05, -3.4, 61, true);
  const ag2 = man('teal', 'none', F + 1.2, 0.05, -1.2, 62);
  put(W, S('TAPPED', 1.0, 0.35, {bg: '#f2c12e'}), F - 1.0, 1.55, -2.0);

  // ===== COURTROOM =====
  const C = LOC.court;
  W.add(room(C, {w: 18, h: 6, d: 11, wall: '#d8c3a0', floor: '#7a5a3e', seed: 65}));
  put(W, box(6, 0.5, 2.2, '#6b4430'), C, 0.25, -4.4);
  put(W, box(5, 1.0, 0.3, '#5a3a26'), C, 1.0, -3.4);
  const judge = man('official', 'none', C, 0.5, -4.6, 71);
  put(W, S('JUSTICE', 2.4, 0.6, {bg: '#f4ead4'}), C, 3.2, -5.4);
  const cal10 = S('SEPT 10', 2.6, 2.0, {bg: '#f7f0de', fg: '#c43d32', sub: 'TRIAL BEGINS'}); put(W, cal10, C + 5.2, 3.3, -5.4);
  const cal11 = S('SEPT 11', 2.6, 2.0, {bg: '#f7f0de', fg: '#2b2b2e', sub: 'NEXT DAY'}); put(W, cal11, C + 5.2, 3.3, -5.4); cal11.visible = false;
  put(W, P.tvMonitor('NEWS'), C - 5.2, 1.4, -4.8);
  put(W, P.desk(2.6, '#5a3a26'), C - 2, 0.05, -0.4); put(W, P.desk(2.6, '#5a3a26'), C + 2, 0.05, -0.4);
  put(W, P.papers(6, 12), C - 2, 1.05, -0.4); put(W, P.papers(5, 14), C + 2, 1.05, -0.4);
  for (const x of [-5, -3.5, 3.5, 5]) put(W, P.bench(), C + x, 0.05, 2.2);
  lamps(C, 5.6);
  put(W, P.wallClock(), C - 4, 4.6, -5.4);
  man('navy', 'bowler', C - 2, 0.05, -1.4, 81, true); man('clerk', 'none', C + 2, 0.05, -1.4, 82);
  const cash = new THREE.Group(); const cashItems = [];
  for (let i = 0; i < 6; i++) { const c = crate('PRIZES', {x: -1.6 + (i % 3) * 1.3, y: 0.6 + Math.floor(i / 3) * 1.2, z: 1.2, s: 1.1}); cash.add(c); cashItems.push(c); }
  cash.position.set(C, 0.05, 0); W.add(cash);
  const bigNum = S('$20,000,000', 4.4, 1.0, {bg: '#4f8a4a', fg: '#fff4dc'}); put(W, bigNum, C, 4.3, -2.5); bigNum.visible = false;

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // diner: peel piece lifts, then $1,000,000 pops
    const lift = shot === 'hook' ? 0 : ease(t, wordT('s02', 5), wordT('s02', 8));
    piece.position.set(D - 1.2 + lift * 0.5, 1.75 + lift * 0.9, -1.99 + lift * 0.9); piece.rotation.z = lift * 0.4; piece.scale.setScalar(1 + lift * 2);
    million.visible = shot === 's02' && t > wordT('s02', 10); million.scale.setScalar(Math.max(0.001, ease(t, wordT('s02', 10), wordT('s02', 10) + 0.4)));
    // office: Jacobson reaches for the envelopes on "handled"
    jac.userData.armR.rotation.z = shot === 's05' ? 1.2 * ease(t, wordT('s05', 4), wordT('s05', 6)) : 0;
    recruit.visible = shot === 's07';
    // den: $25,000 piece travels from Jacobson to stepbrother
    const h6 = ease(t, wordT('s06', 4), wordT('s06', 9));
    p25.visible = shot === 's06'; p25.position.set(N + 1.0 - 2.2 * h6, 1.35, -1.0);
    for (const f of fakes) f.visible = shot === 's09'; checkSign.visible = shot === 's09';
    const showCut = shot === 's09' && t > wordT('s09', 7); cutSign.visible = showCut; cutMan.visible = shot === 's09'; cutSign.scale.setScalar(Math.max(0.001, ease(t, wordT('s09', 7), wordT('s09', 7) + 0.4)));
    jac2.visible = shot === 's06'; sib.visible = shot === 's06';
    // airport: piece passes Jacobson -> recruit -> friend
    const a1 = ease(t, wordT('s08', 1), wordT('s08', 5)), a2 = ease(t, wordT('s08', 7), wordT('s08', 11));
    pieceA.position.set(A - 0.9 + a1 * 2.2 + a2 * 2.3, 1.3 + Math.sin((a1 + a2) * 3.14) * 0.15, -2.1);
    // fbi
    for (const r of reels) r.rotation.z = t * 3; opSign.visible = t > wordT('s10', 10) && shot === 's10'; opSign.scale.setScalar(Math.max(0.001, ease(t, wordT('s10', 10), wordT('s10', 10) + 0.4)));
    ag1.userData.armR.rotation.z = 2.2 + Math.sin(t * 6) * 0.1;
    // court
    bigNum.visible = shot === 's11' && t > wordT('s11', 8); bigNum.scale.setScalar(Math.max(0.001, ease(t, wordT('s11', 8), wordT('s11', 8) + 0.4)));
    const gone = shot === 's11' && t > wordT('s11', 13); cashItems.forEach((c, i) => { c.visible = !gone || i < 0; });
    const flip = shot === 's12' && t > wordT('s12', 8); cal10.visible = !flip; cal11.visible = flip;
  };
  return {group: W, update};
}
