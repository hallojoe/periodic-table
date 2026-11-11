// All points are in table coordinates. One unit separates neighbouring group centres.
export const families = {
  alkali: ['Alkali metals', '#f29c74'],
  alkaline: ['Alkaline earth metals', '#edcc77'],
  transition: ['Transition metals', '#7eabdc'],
  'post-transition': ['Post-transition metals', '#81c5bd'],
  metalloid: ['Metalloids', '#a2cf97'],
  nonmetal: ['Other nonmetals', '#c6e58f'],
  halogen: ['Halogens', '#cab0e6'],
  noble: ['Noble gases', '#e7a0c2'],
  lanthanide: ['Lanthanides', '#8ecedc'],
  actinide: ['Actinides', '#b4b2e8'],
  unknown: ['Unknown properties', '#a6adac'],
  theoretical: ['Theoretical', '#e4d8c0']
};
export const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
export function tint(hex, mult, add = 0) {
  const values =
      [1, 3, 5].map(i => clamp(Math.round(parseInt(hex.slice(i, i + 2), 16) * mult + add), 0, 255));
  return 'rgb(' + values.join(',') + ')';
}
export function fitCanvas(canvas) {
  const width = canvas.clientWidth, height = canvas.clientHeight,
        ratio = Math.min(2, devicePixelRatio);
  if (!width || !height) return null;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return {ctx, width, height};
}
function path(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}
function inside(x, y, poly) {
  let side = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length],
          cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (side * cross < 0) return false;
    if (cross) side = cross;
  }
  return true;
}
const pose = e =>
    [e.column - 9.5, e.row - 4.9 + (e.row > 7 ? .46 : 0) + (e.theoretical ? .4 : 0),
     .26 + Math.sqrt(e.number) * .044];
const boxFaces =
    [[0, 3, 2, 1], [0, 4, 7, 3], [1, 2, 6, 5], [0, 1, 5, 4], [3, 7, 6, 2], [4, 5, 6, 7]];
function corners(x, y, z, s) {
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + a * s, y + b * s, z]);
}
export class Lattice {
  constructor(canvas, elements, preview, enter, ready) {
    Object.assign(this, {
      canvas,
      elements,
      preview,
      enter,
      ready,
      selected: 6,
      effect: 'Neon',
      filter: null,
      extended: false,
      flat: false,
      locked: true
    });
    this.reset();
    this.start = performance.now();
    this.hits = [];
    this.frame = 0;
    const step = 47, phase = Math.random() * Math.PI * 2;
    this.startPoints = new Map(elements.map((e, i) => {
      // Golden-angle Fibonacci sphere, with a random global rotation each visit.
      const k = (i * step) % elements.length, u = 1 - 2 * (k + .5) / elements.length,
            r = Math.sqrt(1 - u * u);
      const a = k * Math.PI * (3 - Math.sqrt(5)) + phase;
      return [e.number, [r * Math.cos(a) * 13, u * 8, r * Math.sin(a) * 9, k / elements.length]];
    }));
    new ResizeObserver(() => this.drawSoon()).observe(canvas);
    canvas.addEventListener('pointerdown', ev => {
      if (this.locked || ev.button !== 0) return;
      this.drag = {x: ev.clientX, y: ev.clientY, moved: false, panning: ev.shiftKey};
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', ev => {
      if (this.locked) return;
      if (this.drag) {
        const dx = ev.movementX, dy = ev.movementY;
        if (Math.hypot(ev.clientX - this.drag.x, ev.clientY - this.drag.y) > 4)
          this.drag.moved = true;
        if (this.drag.moved) {
          if (this.drag.panning || this.flat) {
            this.panX += dx;
            this.panY += dy;
          } else {
            this.yaw = clamp(this.yaw + dx * .007, -.98, .98);
            this.pitch = clamp(this.pitch - dy * .007, -.88, .88);
          }
          this.drawSoon();
        }
      } else if (ev.pointerType === 'mouse') {
        const e = this.pick(ev);
        canvas.style.cursor = e ? 'pointer' : 'grab';
        if (e) this.preview(e);
      }
    });
    canvas.addEventListener('pointerup', ev => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      this.drag = null;
      if (!moved) {
        const e = this.pick(ev);
        if (e) this.enter(e);
      }
    });
    canvas.addEventListener('pointercancel', () => this.drag = null);
    canvas.addEventListener('wheel', ev => {
      if (this.locked) return;
      ev.preventDefault();
      this.zoomBy(Math.exp(-ev.deltaY * .0015));
    }, {passive: false});
    canvas.addEventListener('keydown', ev => {
      if (this.locked) return;
      const visible = this.list().filter(e => !this.filter || e.category === this.filter),
            index = visible.findIndex(e => e.number === this.selected), e = visible[index];
      if (ev.key === 'Enter' && e) {
        ev.preventDefault();
        return this.enter(e);
      }
      const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1}[ev.key];
      if (!step) return;
      ev.preventDefault();
      let next;
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')
        next = visible.filter(v => v.column === e?.column && (v.row - e.row) * step > 0)
                   .sort((a, b) => Math.abs(a.row - e.row) - Math.abs(b.row - e.row))[0];
      this.preview(next || visible[(index + step + visible.length) % visible.length]);
    });
    this.drawSoon();
  }
  list() {
    return this.elements.filter(e => this.extended || !e.theoretical);
  }
  reset() {
    this.pitch = .37;
    this.yaw = -.27;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    if (this.canvas && this.start) this.drawSoon();
  }
  zoomBy(factor) {
    this.zoom = clamp(this.zoom * factor, .7, 3);
    this.drawSoon();
  }
  pick(ev) {
    const rect = this.canvas.getBoundingClientRect(), x = ev.clientX - rect.left,
          y = ev.clientY - rect.top;
    return this.hits.findLast(h => inside(x, y, h.poly))?.element;
  }
  drawSoon() {
    if (!this.frame)
      this.frame = requestAnimationFrame(t => {
        this.frame = 0;
        this.draw(t);
      });
  }
  fly(e, done) {
    if (this.locked) return;
    this.drag = null;
    this.locked = true;
    this.flight = {e, start: performance.now(), done};
    this.drawSoon();
  }
  draw(now) {
    const frame = fitCanvas(this.canvas);
    if (!frame) return;
    const {ctx, width: w, height: h} = frame;
    ctx.clearRect(0, 0, w, h);
    this.hits = [];
    const time = reduced.matches ? 9000 : now - this.start, building = time < 610;
    const intro = clamp((time - 540) / 1650, 0, 1);
    const flight = this.flight,
          travel =
              flight ? (reduced.matches ? 1 : smooth(clamp((now - flight.start) / 920, 0, 1))) : 0;
    const focus = flight ? pose(flight.e) : [0, 0, 0];
    const yaw = (this.flat ? 0 : this.yaw) * (1 - travel),
          pitch = (this.flat ? 0 : this.pitch) * (1 - travel);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const roll = (this.flat ? 0 : -.045) * (1 - travel), cr = Math.cos(roll), sr = Math.sin(roll);
    const scale = Math.min((w - 30) / 18.6, (h - 40) / (this.extended ? 11.95 : 10.25)) * this.zoom;
    const distance = 50, eye = lerp(distance, focus[2] + .035, travel);
    const project = ([x, y, z]) => {
      x -= focus[0] * travel;
      y -= lerp(this.extended ? .75 : .1, focus[1], travel);
      const rx = cy * x + sy * z, rz = -sy * x + cy * z, ry = cp * y - sp * rz,
            depth = sp * y + cp * rz;
      const k = scale * distance / Math.max(.028, eye - depth);
      return [
        w / 2 + (rx * cr - ry * sr) * k + this.panX * (1 - travel),
        h / 2 + (rx * sr + ry * cr) * k + this.panY * (1 - travel), depth
      ];
    };
    if (building) {
      const box = [...corners(0, 0, -1, 1), ...corners(0, 0, 1, 1)].map(
          ([x, y, z]) => project([x * 9, y * 4.6, z]));
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6],
        [3, 7]
      ];
      ctx.strokeStyle = '#c1eb97';
      ctx.lineWidth = 1;
      ctx.globalAlpha = Math.min(1, (610 - time) / 110);
      edges.forEach(([a, b], i) => {
        const t = clamp(time / 410 * 12 - i, 0, 1);
        ctx.beginPath();
        ctx.moveTo(...box[a].slice(0, 2));
        ctx.lineTo(lerp(box[a][0], box[b][0], t), lerp(box[a][1], box[b][1], t));
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    if (!building || time > 540) {
      const list = this.list();
      const boxes =
          list.map(e => {
                let [x, y, z] = pose(e);
                const [sx, sy, sz, delay] = this.startPoints.get(e.number);
                const progress = smooth(clamp((intro - delay * .63) / .37, 0, 1)), k = 1 - progress;
                x += sx * k;
                y += sy * k;
                const base = sz * k, s = .427 * (.07 + .93 * progress);
                const points =
                    [...corners(x, y, base, s), ...corners(x, y, base + z, s)].map(project);
                return {e, points, alpha: progress, depth: project([x, y, base + z / 2])[2]};
              })
              .sort((a, b) => a.depth - b.depth);
      if (intro === 1 && travel < .5) {
        ctx.fillStyle = '#a3afa9';
        ctx.font = Math.max(8, scale * .205) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = (txt, x, y) => {
          const p = project([x, y, 0]);
          ctx.fillText(txt, p[0], p[1]);
        };
        for (let col = 1; col <= 18; col++) label(col, col - 9.5, -4.72);
        for (let row = 1; row <= 7; row++) label(row, -9.39, row - 4.9);
        label('57–71', 3 - 9.5, 6 - 4.9);
        label('89–103', 3 - 9.5, 7 - 4.9);
        label('La–Lu', -8.15, 8 - 4.9 + .46);
        label('Ac–Lr', -8.15, 9 - 4.9 + .46);
        if (this.extended) label('PREDICTED', -5.9, 10 - 4.9 + .86);
      }
      for (const box of boxes) this.drawBox(ctx, box, travel);
    }
    if (flight && travel === 1) {
      this.flight = null;
      flight.done();
      this.locked = false;
      this.drawSoon();
    } else if (intro < 1 || flight)
      this.drawSoon();
    else if (this.locked) {
      this.locked = false;
      this.ready();
    }
  }
  drawBox(ctx, {e, points, alpha}, travel) {
    if (alpha <= .001) return;
    const selected = e.number === this.selected, dim = this.filter && this.filter !== e.category;
    const base = families[e.category][1], wire = this.effect === 'Wireframe',
          hot = this.effect === 'Astrophage';
    const col = hot ? (selected ? '#ffde87' : tintHeat(e.number)) : base;
    ctx.globalAlpha = dim ? .16 : alpha;
    ctx.lineWidth = wire ? .9 : .8;
    const faces =
        boxFaces.map((ids, i) => ({i, p: ids.map(id => points[id])}))
            .sort((a, b) => a.p.reduce((s, p) => s + p[2], 0) - b.p.reduce((s, p) => s + p[2], 0));
    for (const {i, p} of faces) {
      const [a, b, c] = p;
      if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <= 0) continue;
      path(ctx, p);
      ctx.fillStyle = wire ? '#1b2728' : tint(col, [.18, .30, .31, .56, .30, .8][i]);
      ctx.fill();
      ctx.strokeStyle = wire ? tint(col, .9) : tint(col, i === 5 ? 1 : .64);
      ctx.stroke();
      if (!dim) this.hits.push({poly: p, element: e});
      if (i !== 5) continue;
      if (selected) {
        ctx.save();
        ctx.strokeStyle = '#f6ffe4';
        ctx.lineWidth = 2;
        ctx.shadowColor = col;
        ctx.shadowBlur = 7;
        ctx.stroke();
        ctx.restore();
      }
      const [tl, tr, , bl] = p;
      ctx.save();
      ctx.transform(tr[0] - tl[0], tr[1] - tl[1], bl[0] - tl[0], bl[1] - tl[1], tl[0], tl[1]);
      // Normalised coordinates keep the inscriptions attached to the box face.
      ctx.scale(.01, .01);
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = wire ? col : '#111e22';
      ctx.textAlign = 'left';
      ctx.font = '500 20px monospace';
      ctx.fillText(String(e.number), 8, 24);
      ctx.font = 'bold ' + (e.symbol.length === 3 ? 39 : 48) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(e.symbol, 50, 77);
      if (travel > .62 && selected) {
        ctx.fillStyle = 'rgba(15,25,23,' + clamp((travel - .62) / .36, 0, 1) + ')';
        ctx.fillRect(0, 0, 100, 100);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
function tintHeat(number) {
  const t = number / 120;
  return '#' +
      [235 + 18 * t, 190 - 90 * t, 125 - 57 * t].map(x => Math.round(x).toString(16)).join('');
}
