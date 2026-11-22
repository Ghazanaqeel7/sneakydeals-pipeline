// Scene3DTrack — the long-form 3D layer. Owner asked (22 Nov 2026) for long-form to use the same
// 3D cartoon-cast-in-a-world engine as the Shorts, not flat 2D cards.
//
// v2 (22 Nov 2026, after job 013's first real render failed with
// "Timeout (30000ms) exceeded rendering the component at frame 5509"): v1 mounted a fresh
// <ThreeCanvas> (a fresh WebGL context) per scene via Doc.jsx's normal per-beat <Sequence>. With ~29
// scene3d scenes in one video that churns ~29 WebGL contexts in one render process, which is exactly
// what the Shorts' own Full.jsx avoids - it uses ONE ThreeCanvas for the WHOLE video and builds every
// location once up front, then just moves the camera between them (see worlds.js's `LOC` offsets).
// v2 copies that proven pattern instead of re-inventing one: this file now exports a single
// Scene3DTrack, mounted ONCE for the whole Doc composition (not per-Sequence), which pre-builds all
// 6 location presets at fixed X offsets plus one small cast group per scene3d beat (also built once),
// and on every frame just toggles which beat's cast is visible and moves the camera/lights - no canvas
// mount/unmount, no per-frame geometry rebuilding. STILL UNTESTED end to end (no new GitHub Actions
// run yet) - see docs/longform_guide.md "3D engine integration".
//
// Deliberately simpler than the Shorts' Full.jsx (no bloom/sky-dome/bokeh/colour-grade yet).
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree, useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {ground, sidewalk} from '../engine3d/kit.js';
import {character} from '../engine3d/char.js';
import {dressStreet, dressOffice, dressYard, dressJoint, dressWeather} from '../engine3d/dress.js';

const LIGHTS = {
  night: {sun: '#a9b8ff', si: 1.0, sky: '#4a50a0', gnd: '#2a2030', hi: 1.0, fog: '#232856', near: 50, far: 220, sunOff: [-30, 60, 30], top: '#0b1030'},
  day: {sun: '#fff0cf', si: 2.4, sky: '#a9d8ff', gnd: '#d9a878', hi: 1.15, fog: '#cfe7f7', near: 60, far: 260, sunOff: [-35, 60, 35], top: '#3d8fe0'},
  office: {sun: '#fff4e4', si: 1.6, sky: '#f4fbff', gnd: '#b48a62', hi: 1.05, fog: '#efe2cb', near: 20, far: 60, sunOff: [-6, 9, 7], top: '#7fb7e6'},
  yard: {sun: '#ffe7bd', si: 2.3, sky: '#b5dcff', gnd: '#d1ad7c', hi: 1.15, fog: '#e2e3d4', near: 40, far: 150, sunOff: [-14, 22, 14], top: '#3d8fe0'},
  joint: {sun: '#ffe0b0', si: 2.1, sky: '#c4c8dc', gnd: '#5a5662', hi: 1.3, fog: '#4a4a58', near: 20, far: 60, sunOff: [-7, 12, 9], top: '#222233'},
  weather: {sun: '#eef2ff', si: 1.4, sky: '#eef3f6', gnd: '#8f7b66', hi: 1.1, fog: '#e3e7e1', near: 20, far: 60, sunOff: [-6, 9, 7], top: '#56606e'},
  morning: {sun: '#ffbf7a', si: 2.3, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 60, far: 260, sunOff: [-40, 30, 35], top: '#6fa6dd'},
};

// Every location preset gets its own fixed slot along X so all 6 can coexist in one scene graph,
// built once, with THREE's own frustum culling keeping the inactive ones cheap to skip.
const LOC_OFFSET = {street: 0, night_street: 340, office: 680, yard: 1020, workshop: 1360, newsroom: 1700};

const BUILDERS = {
  street: (ox) => {
    const W = new THREE.Group();
    W.add(ground(220, 36, '#6b6459', {x: ox, seed: 11}));
    W.add(sidewalk(220, {x: ox, z: 7, w: 4})); W.add(sidewalk(220, {x: ox, z: 21.2, w: 4}));
    const update = dressStreet(W, ox, {lit: false, seed: 15, chars: [], avoid: []});
    return {group: W, update};
  },
  night_street: (ox) => {
    const W = new THREE.Group();
    W.add(ground(220, 36, '#3a3a40', {x: ox, seed: 12}));
    W.add(sidewalk(220, {x: ox, z: 7, w: 4})); W.add(sidewalk(220, {x: ox, z: 21.2, w: 4}));
    const update = dressStreet(W, ox, {lit: true, seed: 16, chars: [], avoid: []});
    return {group: W, update};
  },
  office: (ox) => { const W = new THREE.Group(); W.add(ground(26, 20, '#9b8a6b', {x: ox, seed: 13})); dressOffice(W, ox, []); return {group: W, update: null}; },
  yard: (ox) => { const W = new THREE.Group(); W.add(ground(50, 24, '#8a8470', {x: ox, seed: 14})); dressYard(W, ox, []); return {group: W, update: null}; },
  workshop: (ox) => { const W = new THREE.Group(); W.add(ground(30, 16, '#6a6a6a', {x: ox, seed: 17})); dressJoint(W, ox, []); return {group: W, update: null}; },
  newsroom: (ox) => { const W = new THREE.Group(); W.add(ground(28, 16, '#9b8a6b', {x: ox, seed: 18})); dressWeather(W, ox, []); return {group: W, update: null}; },
};

const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const ease = (k) => k * k * (3 - 2 * k);

const Shot = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {gl, scene, camera} = useThree();

  // All 6 locations, built exactly once for the whole video.
  const locs = useMemo(() => {
    const out = {};
    for (const name of Object.keys(LOC_OFFSET)) out[name] = BUILDERS[name](LOC_OFFSET[name]);
    return out;
  }, []);

  // One small cast group per scene3d beat, built exactly once; toggled visible, never rebuilt.
  const castGroups = useMemo(() => beats.map((b) => {
    const g = new THREE.Group();
    const off = LOC_OFFSET[b.location] || 0;
    const cast = b.cast || [];
    cast.forEach((cfg, i) => {
      const ch = character({palette: cfg.palette || 'engineer', hat: cfg.hat || 'none', glasses: !!cfg.glasses, seed: 900 + i});
      const x = cfg.x != null ? cfg.x : (i - (cast.length - 1) / 2) * 1.6;
      ch.position.set(off + x, 0.05, cfg.z != null ? cfg.z : 3.2);
      if (cfg.ry != null) ch.rotation.y = cfg.ry;
      g.add(ch);
    });
    g.visible = false;
    return g;
  }), [beats]);

  const lights = useMemo(() => {
    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006;
    const hemi = new THREE.HemisphereLight('#ffffff', '#888888', 0.8);
    scene.add(sun, sun.target, hemi);
    for (const name of Object.keys(locs)) scene.add(locs[name].group);
    for (const g of castGroups) scene.add(g);
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.fog = new THREE.Fog('#cfe4f2', 60, 260);
    return {sun, hemi};
  }, [scene, gl, locs, castGroups]);

  let active = null, activeIdx = -1;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    if (frame >= b.from && frame < b.from + b.dur) { active = b; activeIdx = i; break; }
  }

  useFrame(() => {
    for (let i = 0; i < castGroups.length; i++) castGroups[i].visible = i === activeIdx;
    if (!active) { camera.position.set(0, 3, 50000); camera.lookAt(0, 3, 50001); return; } // park far away, nothing to see, 2D overlay covers this frame anyway
    const off = LOC_OFFSET[active.location] || 0;
    const t = (frame - active.from) / fps;
    const dur = Math.max(active.dur, 1) / fps;
    const k = ease(Math.min(1, Math.max(0, t / dur)));
    const camFrom = active.camFrom || [0, 2, 10], camTo = active.camTo || camFrom;
    const lookFrom = active.lookFrom || [0, 1, 0], lookTo = active.lookTo || lookFrom;
    const p = lerp3(camFrom, camTo, k); const l = lerp3(lookFrom, lookTo, k);
    camera.fov = 55; camera.near = 0.1; camera.far = 2000; camera.updateProjectionMatrix();
    camera.position.set(off + p[0], p[1], p[2]);
    camera.lookAt(off + l[0], l[1], l[2]);
    const L = LIGHTS[active.light] || LIGHTS.day;
    lights.sun.color.set(L.sun); lights.sun.intensity = L.si;
    lights.sun.position.set(off + p[0] + L.sunOff[0], L.sunOff[1], p[2] + L.sunOff[2]);
    lights.sun.target.position.set(off + p[0], 0, p[2]); lights.sun.target.updateMatrixWorld();
    lights.hemi.color.set(L.sky); lights.hemi.groundColor.set(L.gnd); lights.hemi.intensity = L.hi;
    scene.fog.color.set(L.fog); scene.fog.near = L.near; scene.fog.far = L.far;
    scene.background = new THREE.Color(L.top);
    const locEntry = locs[active.location];
    if (locEntry && locEntry.update) locEntry.update(t, camera);
  });
  return null;
};

// beats: array of {from, dur, location, light, cast, camFrom, camTo, lookFrom, lookTo} in frames,
// pre-filtered to only scene3d entries, built once by Doc.jsx's buildBeats().
export const Scene3DTrack = ({beats}) => {
  const {width, height} = useVideoConfig();
  if (!beats || !beats.length) return null;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} linear={false} flat
        gl={{antialias: true}} camera={{fov: 55, near: 0.1, far: 2000, position: [0, 2, 10]}}>
        <Shot beats={beats} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
