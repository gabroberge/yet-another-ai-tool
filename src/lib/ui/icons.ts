const PATHS = {
  carton: '<path d="M4 8.5 12 4l8 4.5v8L12 21l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 10.5v6M14 10.5v6"/>',
  rebrand: '<path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M5 3.5v4h4M19 20.5v-4h-4"/>',
  spinout: '<path d="M6 4v6a4 4 0 0 0 4 4h8"/><path d="m15 10.5 3.5 3.5-3.5 3.5"/><path d="M6 14v6"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="1"/><path d="M15.5 8.5v-4h-11v11h4"/>',
  play: '<path d="M7.5 5v14l11-7z"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  arrow: '<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/>',
  shelf: '<path d="M3.5 19.5h17M5 19.5V9h5v10.5M10 19.5v-7h4.5v7M14.5 19.5V6h4.5v13.5"/>',
  pulse: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  doc: '<path d="M6.5 3.5h7.5l4 4v13h-11.5z"/><path d="M13.5 3.5v4.5h4.5M9.5 12.5h5M9.5 16h5"/>',
  terminal: '<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="m7.5 10 2.5 2-2.5 2M12.5 15h4"/>',
  history: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4v3.5H8M12 8v4.5l3 2"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m15.5 15.5 4 4"/>',
  sparkle: '<path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z"/>',
  build: '<path d="M14.5 5.5 18.5 9.5M4 20l6.5-6.5M12 6l6 6-4.5 4.5-6-6z"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, className = "size-4", attrs = ""): string {
  return `<svg class="${className}" ${attrs} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${PATHS[name]}</svg>`;
}
