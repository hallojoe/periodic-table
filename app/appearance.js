// Each row follows the theme order below, keeping every family and legend in sync.
export const themes = ['Neon', 'Aurora', 'Ocean', 'Ember'];
const familyStyles = {
  alkali: ['Alkali metals', '#f29c74', '#ffb6e0', '#ffa998', '#ffd695'],
  alkaline: ['Alkaline earth metals', '#edcc77', '#e5b4ff', '#ffd69a', '#ffeabc'],
  transition: ['Transition metals', '#7eabdc', '#78dfba', '#70b6eb', '#eea57d'],
  'post-transition': ['Post-transition metals', '#81c5bd', '#9bc6ff', '#6cd2dd', '#dbaf9d'],
  metalloid: ['Metalloids', '#a2cf97', '#b5e784', '#88dbc1', '#d8c87b'],
  nonmetal: ['Other nonmetals', '#c6e58f', '#d6f2ac', '#b3eddf', '#f6df95'],
  halogen: ['Halogens', '#cab0e6', '#a8a2f3', '#aeacea', '#dfacbd'],
  noble: ['Noble gases', '#e7a0c2', '#ef9cd8', '#e3bfed', '#ed92a0'],
  lanthanide: ['Lanthanides', '#8ecedc', '#7cdbdf', '#9de0fa', '#efc298'],
  actinide: ['Actinides', '#b4b2e8', '#c7a6e9', '#93aee1', '#d299a9'],
  unknown: ['Unknown properties', '#a6adac', '#aebfb5', '#abbcc8', '#aaa6a4'],
  theoretical: ['Theoretical', '#e4d8c0', '#e9ddfa', '#dae7e6', '#eed7c7']
};
export const families = Object.fromEntries(
    Object.entries(familyStyles).map(([key, [label]]) => [key, label]));
export const palettes = Object.fromEntries(themes.map((theme, index) => [
  theme, Object.fromEntries(Object.entries(familyStyles).map(([key, row]) => [key, row[index + 1]]))
]));

// Use a reusable radial sprite so each point can pulse without allocating gradients per frame.
const sprites = new Map();
export function drawBlinkingDot(ctx, x, y, radius, color, seconds, index) {
  let sprite = sprites.get(color);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const brush = sprite.getContext('2d');
    const light = brush.createRadialGradient(16, 16, 0, 16, 16, 16);
    light.addColorStop(0, '#ffffff');
    light.addColorStop(.25, color);
    light.addColorStop(.65, color + '80');
    light.addColorStop(1, color + '00');
    brush.fillStyle = light;
    brush.fillRect(0, 0, 32, 32);
    sprites.set(color, sprite);
  }
  const pulse = .65 + .35 * Math.sin(seconds * 3 + index * 2.399963);
  const r = radius * (.5 + .5 * pulse);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= pulse;
  ctx.drawImage(sprite, x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}

// Add the ember to the current projected path without changing the base stroke.
export function strokeEmber(ctx, perimeter, phase) {
  if (perimeter < 2) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ff713b';
  ctx.lineWidth = 1.45;
  ctx.setLineDash([perimeter * .24, perimeter * .76]);
  ctx.lineDashOffset = -phase * perimeter;
  ctx.stroke();
  ctx.strokeStyle = '#fff6cc';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([perimeter * .055, perimeter * .945]);
  ctx.lineDashOffset -= perimeter * .185;
  ctx.stroke();
  ctx.restore();
}
