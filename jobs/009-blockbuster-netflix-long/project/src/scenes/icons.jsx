import React from 'react';
// 24x24 stroke icons (own drawings, no brand logos). name -> svg inner markup
const P = {
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/>',
  factory: '<path d="M3 21V10l6 4V10l6 4V6h3v15z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M14.5 8.5C14 7.5 13 7 12 7c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 5.5V7M12 17v1.5"/>',
  'chart-down': '<path d="M3 4v16h18"/><path d="M6 8l4 4 3-2 5 6"/><path d="M15 16h3v-3"/>',
  'chart-up': '<path d="M3 4v16h18"/><path d="M6 16l4-4 3 2 5-6"/><path d="M15 8h3v3"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5"/><path d="M15.5 14c3 0 5.5 1.5 5.5 5"/>',
  building: '<path d="M5 21V4h9v17M14 9h5v12M3 21h18"/><path d="M8 8h3M8 12h3M8 16h3"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  cart: '<path d="M3 4h2.5l2 11h10l2-8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  plane: '<path d="M21 4L3 11l6 2 2 6 3-5 5 3z"/>',
  car: '<path d="M4 15v-3l2-5h12l2 5v3z"/><circle cx="8" cy="16.5" r="1.8"/><circle cx="16" cy="16.5" r="1.8"/><path d="M4 12h16"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  bank: '<path d="M3 9l9-5 9 5zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  barcode: '<path d="M4 5v14M7 5v14M11 5v14M14 5v14M17 5v14M20 5v14"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.6 1 1.3 1 2.1h5c0-.8.3-1.5 1-2.1A6 6 0 0 0 12 3z"/>',
  warning: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  gavel: '<path d="M14 4l6 6-3 3-6-6zM12 8L4 16l3 3 8-8M3 21h8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  megaphone: '<path d="M3 10v4h4l9 5V5L7 10z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5"/>',
};
export const ICON_NAMES = Object.keys(P);
export const Icon = ({name, size = 120, color = '#fff', stroke = 1.6}) => {
  const inner = P[name] || P.question;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html: inner}} />;
};
