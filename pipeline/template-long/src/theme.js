// Look of the Sneaky Deals long-form documentary: dark ink background, gold accent, real photos, motion graphics.
export const W = 1920, H = 1080, FPS = 30;
export const C = {
  ink: '#0b0f1a', ink2: '#121a2b', slate: '#1b2540', line: '#2b3656',
  paper: '#f3ead6', paper2: '#e6d9bb', gold: '#f2b134', red: '#e0432f', blue: '#3b82f6', green: '#22b07d',
  white: '#ffffff', mute: '#9aa6c4', black: '#05070c',
};
export const F = {
  display: 'Impact, "Arial Black", "Liberation Sans", "DejaVu Sans", sans-serif',
  serif: 'Georgia, "Liberation Serif", "DejaVu Serif", serif',
  sans: 'Arial, "Liberation Sans", "DejaVu Sans", sans-serif',
  mono: '"Courier New", "Liberation Mono", "DejaVu Sans Mono", monospace',
};
export const TONES = {
  dark: {bg: C.ink, fg: C.white, sub: C.mute, accent: C.gold, card: C.slate},
  paper: {bg: C.paper, fg: '#15110a', sub: '#6b5d3e', accent: C.red, card: C.paper2},
  red: {bg: '#1a0b0d', fg: C.white, sub: '#d6a3a0', accent: C.red, card: '#2b1316'},
  blue: {bg: '#08101f', fg: C.white, sub: '#9db7e8', accent: C.blue, card: '#11213f'},
};
export const tone = (name) => TONES[name] || TONES.dark;
