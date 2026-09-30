/**
 * Minimal lucide-style icon set for the reader, mirroring the icon names the
 * original Obsidian plugin passes to `setIcon`. Stroke geometry follows the
 * lucide 24x24 outline grid so the UI keeps the original look without
 * depending on Obsidian's built-in icon registry.
 */
const PATHS = {
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-up': ['m18 15-6-6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'm21 21-4.3-4.3'],
  'refresh-cw': ['M3 12a9 9 0 0 1 15.5-6.2L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15.5 6.2L3 16', 'M3 21v-5h5'],
  'panel-left-close': ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M9 3v18', 'm16 15-3-3 3-3'],
  'panel-left-open': ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M9 3v18', 'm14 9 3 3-3 3'],
  bookmark: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z'],
  'circle-check': ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'm9 12 2 2 4-4'],
  circle: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20'],
  'file-plus': ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v5h6', 'M12 12v6', 'M9 15h6'],
  'file-check': ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v5h6', 'm9 15 2 2 4-4'],
  'file-pen': ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v5h6', 'M11 14h3l4-4-3-3-4 4Z'],
  'notebook-pen': ['M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4', 'M2 6h4', 'M2 10h4', 'M2 14h4', 'M2 18h4', 'm18.4 2.6a2.1 2.1 0 0 1 3 3L14 13l-4 1 1-4Z'],
  ellipsis: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
  settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  type: ['M4 7V4h16v3', 'M9 20h6', 'M12 4v16'],
  sparkles: ['M9.9 2.6 11.4 7l4.4 1.5-4.4 1.5-1.5 4.4-1.5-4.4L4 8.5 8.4 7Z', 'M18 5.5l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9Z'],
  rss: ['M4 11a9 9 0 0 1 9 9', 'M4 4a16 16 0 0 1 16 16', 'M6 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  folder: ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'],
  globe: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z'],
  'message-circle': ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  podcast: ['M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z', 'M16.85 18.58a9 9 0 1 0-9.7 0', 'M8 14a5 5 0 1 1 8 0', 'M10 20a1 1 0 0 1-1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1-1 1Z'],
  mail: ['M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'm22 7-10 5L2 7'],
  newspaper: ['M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6', 'M18 14h-8', 'M15 18h-5', 'M10 6h8v4h-8Z'],
  tv: ['M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'm17 2-5 5-5-5'],
  'code-xml': ['m18 16 4-4-4-4', 'm6 8-4 4 4 4', 'm14.5 4-5 16'],
  feather: ['M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5Z', 'M16 8 2 22', 'M17.5 15H9'],
  braces: ['M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1', 'M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1'],
  'app-window': ['M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'M2 9h20', 'M6 6.5h.01', 'M9 6.5h.01'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  hammer: ['m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9', 'M17.64 15 22 10.64', 'm20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91'],
  gamepad: ['M6 12h4', 'M8 10v4', 'M15 13h.01', 'M18 11h.01', 'M17.32 5H6.68a4 4 0 0 0-3.98 3.59l-.87 7a4 4 0 0 0 6.79 3.35L9.7 18h4.6l1.08 1a4 4 0 0 0 6.79-3.35l-.87-7A4 4 0 0 0 17.32 5Z'],
  'tree-deciduous': ['M9.9 2.6 11.4 7l4.4 1.5-4.4 1.5-1.5 4.4-1.5-4.4L4 8.5 8.4 7Z'],
  'circle-alert': ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M12 8v4', 'M12 16h.01'],
};

/** Alias map for original icon names we render with a close equivalent. */
const ALIASES = { 'gamepad-2': 'gamepad', 'notebook-pen-2': 'notebook-pen', 'panel-left': 'panel-left-close' };

export function Icon({ name, size = 17, className, strokeWidth = 1.7, ...rest }) {
  const paths = PATHS[ALIASES[name] ?? name] ?? PATHS.circle;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false" {...rest}>
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

export function hasIcon(name) { return Object.hasOwn(PATHS, ALIASES[name] ?? name); }
