const shapes = {
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3.5"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  drag:
      '<path d="M8 12V6a1.6 1.6 0 0 1 3.2 0v5-7a1.6 1.6 0 0 1 3.2 0v7-5a1.6 1.6 0 0 1 3.2 0v6-3a1.6 1.6 0 0 1 3.2 0v5c0 5-2 8-7 8-3 0-5-2-7-5l-3-4c-1-2 1-4 3-2l2 2"/>',
  pointer: '<path d="m4 3 15 10-7 1-3 7z"/>',
  grid:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18m6-18v18"/>',
  swatches: '<path d="M3 4h5v14a2.5 2.5 0 0 1-5 0zM8 15l8-9 4 4-10 10H6m6 0h9v-5h-4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  github:
      '<path fill="currentColor" stroke="none" d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.55.1.76-.24.76-.53v-2.1c-3.1.68-3.76-1.33-3.76-1.33-.5-1.27-1.23-1.6-1.23-1.6-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15 1 1.7 2.6 1.2 3.24.91.1-.72.39-1.2.71-1.48-2.48-.28-5.08-1.24-5.08-5.5 0-1.22.43-2.22 1.15-3-.11-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.7 10.7 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.54.22 2.68.1 2.96.72.78 1.15 1.78 1.15 3 0 4.27-2.6 5.21-5.1 5.5.4.35.76 1.03.76 2.07v3.06c0 .3.2.64.77.53A11.1 11.1 0 0 0 12 .9z"/>'
};
export const icon = name =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
    shapes[name] + '</svg>';
document.querySelectorAll('[data-i]').forEach(i => i.outerHTML = icon(i.dataset.i));
