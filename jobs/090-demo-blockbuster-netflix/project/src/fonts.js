// Bundled fonts (@fontsource, OFL): Anton (display), Playfair Display (news), Inter (body), Space Mono (labels).
import '@fontsource/anton/400.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import {delayRender, continueRender} from 'remotion';

const SPECS = ['400 40px Anton', '700 40px "Playfair Display"', '900 40px "Playfair Display"', '400 40px Inter', '600 40px Inter', '800 40px Inter', '400 40px "Space Mono"', '700 40px "Space Mono"'];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(SPECS.map((s) => document.fonts.load(s))).then(() => continueRender(h)).catch(() => continueRender(h));
}
