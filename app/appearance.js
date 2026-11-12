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

// A dark, light-absorbing cell with a false-color infrared rim. Cache the
// translucent sprite; hundreds of cells may share it in the overview.
let microbe;
function cellSprite() {
  if (microbe) return microbe;
  microbe = document.createElement('canvas');
  microbe.width = microbe.height = 64;
  const g = microbe.getContext('2d');
  g.translate(32, 32);
  g.scale(1, .72);
  const halo = g.createRadialGradient(0, 0, 2, 0, 0, 30);
  halo.addColorStop(0, '#ffb488');
  halo.addColorStop(.42, '#ff476cc4');
  halo.addColorStop(1, '#db236000');
  g.fillStyle = halo;
  g.fillRect(-32, -32, 64, 64);
  g.fillStyle = '#1e101d';
  g.strokeStyle = '#ffd5ac';
  g.lineWidth = 2.2;
  g.beginPath();
  g.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#ff7888';
  g.beginPath();
  g.arc(-6, -2, 3, 0, Math.PI * 2);
  g.fill();
  return microbe;
}

// sample(t) follows a closed border, with integer t marking a full circuit.
// Sample the wake and both daughter cells on that same path, including corners.
export function drawAstrophage(ctx, sample, seconds, seed, radius) {
  const phase = seconds / 4.2 + seed * .618034;
  const cycle = (seconds / 5.8 + seed * .381966) % 1;
  const charge = .5 - .5 * Math.cos(cycle * Math.PI * 2);
  const head = sample(phase), behind = sample(phase - .008);
  const angle = Math.atan2(head[1] - behind[1], head[0] - behind[0]);
  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const [x, y] = sample(phase - (1 - i / 6) * (.025 + .045 * charge));
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,85,116,' + (.42 + .48 * charge) + ')';
  ctx.lineWidth = radius * .7;
  ctx.stroke();
  const sprite = cellSprite();
  function drawCell(point, size) {
    ctx.save();
    ctx.translate(point[0], point[1]);
    ctx.rotate(angle);
    ctx.drawImage(sprite, -size, -size, 2 * size, 2 * size);
    ctx.restore();
  }
  drawCell(head, radius * (2.1 + .55 * charge));
  // A bounded division cycle keeps the box readable as the colony circulates.
  if (cycle > .52) {
    const division = (cycle - .52) / .48;
    const separation = .065 * division;
    ctx.globalAlpha *= Math.min(1, division * 6, (1 - division) * 5);
    drawCell(sample(phase - separation), radius * (1.1 + division));
  }
  ctx.restore();
}
