// Scene3D — long-form "scene3d" visual type. Owner asked (22 Nov 2026) for long-form to use the
// same 3D cartoon-cast-in-a-world engine as the Shorts, not flat 2D cards. This is a deliberately
// SIMPLER first version than the Shorts' Full.jsx (no bokeh/sky-dome/film-grade shaders yet, just a
// lit three.js scene + ported dress presets + a two-key camera move) so it has the best chance of
// actually rendering on the first real GitHub Actions test. See docs/longform_guide.md
// "3D engine integration" for what is proven vs not.
//
// IMPORTANT: this file intentionally does NOT import ../engine3d/camera.js, ../engine3d/worlds.js or
// ../engine3d/Full.jsx — those still import the Shorts' own timing.json (shot-keyed), which does not
// exist/match in a long-form project and would crash the build. Only the timing-independent pieces
// (kit.js, char.js, dress.js, props.js) are used here.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree, useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {ground, sidewalk} from '../engine3d/kit.js';
import {character} from '../engine3d/char.js';
import {dressStreet, dressOffice, dressYard, dressJoint, dressWeather} from '../engine3d/dress.js';

// Light presets copied from the Shorts' camera.js LIGHTS (pure data, no timing.json coupling).
const LIGHTS = {
  night: {sun: '#a9b8ff', si: 1.0, sky: '#4a50a0', gnd: '#2a2030', hi: 1.0, fog: '#232856', near: 50, far: 220, sunOff: [-30, 60, 30], top: '#0b1030'},
  day: {sun: '#fff0cf', si: 2.4, sky: '#a9d8ff', gnd: '#d9a878', hi: 1.15, fog: '#cfe7f7', near: 60, far: 260, sunOff: [-35, 60, 35], top: '#3d8fe0'},
  office: {sun: '#fff4e4', si: 1.6, sky: '#f4fbff', gnd: '#b48a62', hi: 1.05, fog: '#efe2cb', near: 20, far: 60, sunOff: [-6, 9, 7], top: '#7fb7e6'},
  yard: {sun: '#ffe7bd', si: 2.3, sky: '#b5dcff', gnd: '#d1ad7c', hi: 1.15, fog: '#e2e3d4', near: 40, far: 150, sunOff: [-14, 22, 14], top: '#3d8fe0'},
  joint: {sun: '#ffe0b0', si: 2.1, sky: '#c4c8dc', gnd: '#5a5662', hi: 1.3, fog: '#4a4a58', near: 20, far: 60, sunOff: [-7, 12, 9], top: '#222233'},
  weather: {sun: '#eef2ff', si: 1.4, sky: '#eef3f6', gnd: '#8f7b66', hi: 1.1, fog: '#e3e7e1', near: 20, far: 60, sunOff: [-6, 9, 7], top: '#56606e'},
  morning: {sun: '#ffbf7a', si: 2.3, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 60, far: 260, sunOff: [-40, 30, 35], top: '#6fa6dd'},
};

// One location preset = a function that dresses an empty THREE.Group and returns an optional
// per-frame updater(t, camera) (only dressStreet needs one, for moving traffic).
const LOCATIONS = {
  street: (W, chars) => {
    W.add(ground(220, 36, '#6b6459', {seed: 11}));
    W.add(sidewalk(220, {z: 7, w: 4})); W.add(sidewalk(220, {z: 21.2, w: 4}));
    return dressStreet(W, 0, {lit: false, seed: 15, chars, avoid: []});
  },
  night_street: (W, chars) => {
    W.add(ground(220, 36, '#3a3a40', {seed: 12}));
    W.add(sidewalk(220, {z: 7, w: 4})); W.add(sidewalk(220, {z: 21.2, w: 4}));
    return dressStreet(W, 0, {lit: true, seed: 16, chars, avoid: []});
  },
  office: (W, chars) => { W.add(ground(26, 20, '#9b8a6b', {seed: 13})); dressOffice(W, 0, chars); },
  yard: (W, chars) => { W.add(ground(50, 24, '#8a8470', {seed: 14})); dressYard(W, 0, chars); },
  workshop: (W, chars) => { W.add(ground(30, 16, '#6a6a6a', {seed: 17})); dressJoint(W, 0, chars); },
  newsroom: (W, chars) => { W.add(ground(28, 16, '#9b8a6b', {seed: 18})); dressWeather(W, 0, chars); },
};

const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const ease = (k) => k * k * (3 - 2 * k);

const Shot3D = ({t, dur, location, light, cast, camFrom, camTo, lookFrom, lookTo}) => {
  const {gl, scene, camera} = useThree();
  const chars = useMemo(() => [], []);

  const world = useMemo(() => {
    const W = new THREE.Group();
    const build = LOCATIONS[location] || LOCATIONS.street;
    const update = build(W, chars) || null;
    return {group: W, update};
  }, [location]);

  const castObjs = useMemo(() => (cast || []).map((c, i) => {
    const ch = character({palette: c.palette || 'engineer', hat: c.hat || 'none', glasses: !!c.glasses, seed: 900 + i});
    ch.position.set(c.x != null ? c.x : (i - (cast.length - 1) / 2) * 1.6, 0.05, c.z != null ? c.z : 3.2);
    if (c.ry != null) ch.rotation.y = c.ry;
    return ch;
  }), [cast]);

  const lights = useMemo(() => {
    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006;
    const hemi = new THREE.HemisphereLight('#ffffff', '#888888', 0.8);
    scene.add(sun, sun.target, hemi, world.group);
    for (const c of castObjs) scene.add(c);
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.fog = new THREE.Fog('#cfe4f2', 60, 260);
    return {sun, hemi};
  }, [scene, gl, world, castObjs]);

  useFrame(() => {
    const L = LIGHTS[light] || LIGHTS.day;
    const k = ease(Math.min(1, Math.max(0, dur > 0 ? t / dur : 0)));
    const p = lerp3(camFrom || [0, 2, 10], camTo || camFrom || [0, 2, 8], k);
    const l = lerp3(lookFrom || [0, 1, 0], lookTo || lookFrom || [0, 1, 0], k);
    camera.fov = 55; camera.near = 0.1; camera.far = 600; camera.updateProjectionMatrix();
    camera.position.set(p[0], p[1], p[2]); camera.lookAt(l[0], l[1], l[2]);
    lights.sun.color.set(L.sun); lights.sun.intensity = L.si;
    lights.sun.position.set(p[0] + L.sunOff[0], L.sunOff[1], p[2] + L.sunOff[2]);
    lights.sun.target.position.set(p[0], 0, p[2]); lights.sun.target.updateMatrixWorld();
    lights.hemi.color.set(L.sky); lights.hemi.groundColor.set(L.gnd); lights.hemi.intensity = L.hi;
    scene.fog.color.set(L.fog); scene.fog.near = L.near; scene.fog.far = L.far;
    scene.background = new THREE.Color(L.top);
    if (world.update) world.update(t, camera);
  });
  return null;
};

// Props come from scenes.json `visual` (see docs/longform_guide.md "3D engine integration"):
// {type:'scene3d', location, light, cast:[{palette,hat,glasses,x,z,ry}], camFrom, camTo, lookFrom, lookTo}
export const Scene3D = (props) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps; const dur = (props.frames || 1) / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} linear={false} flat
        gl={{antialias: true}} camera={{fov: 55, near: 0.1, far: 600, position: props.camFrom || [0, 2, 10]}}>
        <Shot3D t={t} dur={dur} {...props} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
