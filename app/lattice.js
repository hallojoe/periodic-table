import {heightMapping} from './heights.js';
import {drawAtom} from './model.js';

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
const pose = e => [e.column - 9.5, e.row - 4.9 + (e.row > 7 ? .46 : 0) + (e.theoretical ? .4 : 0)];
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
      selected: null,
      view: 'blocks',
      detail: 0,
      mapping: heightMapping(elements, 'number', 'up'),
      atomYaw: 0,
      atomPitch: 0,
      effect: 'Neon',
      showPaths: true,
      showGridLabels: true,
      showNames: true,
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
      if (this.drag) return;
      this.drag = {
        id: ev.pointerId,
        x: ev.clientX,
        y: ev.clientY,
        lastX: ev.clientX,
        lastY: ev.clientY,
        moved: false,
        panning: ev.shiftKey
      };
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', ev => {
      if (this.locked) return;
      if (!this.drag) {
        canvas.style.cursor = this.detail ? 'grab' : this.pick(ev) ? 'pointer' : 'grab';
        return;
      }
      const d = this.drag;
      if (d.id !== ev.pointerId) return;
      if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 4) d.moved = true;
      if (!d.moved) return;
      const dx = ev.clientX - d.lastX, dy = ev.clientY - d.lastY;
      d.lastX = ev.clientX;
      d.lastY = ev.clientY;
      if (this.detail) {
        this.atomYaw += dx * .012;
        this.atomPitch -= dy * .012;
      } else if (d.panning || this.flat) {
        this.panX += dx;
        this.panY += dy;
      } else {
        this.yaw = clamp(this.yaw + dx * .007, -1.1, 1.1);
        this.pitch = clamp(this.pitch - dy * .007, -1.08, 1.08);
      }
      this.drawSoon();
    });
    canvas.addEventListener('pointerup', ev => {
      if (!this.drag || ev.pointerId !== this.drag.id) return;
      const moved = this.drag.moved;
      this.drag = null;
      if (!moved && !this.detail) {
        const e = this.pick(ev);
        if (e) {
          if (this.selected === e.number)
            this.enter(e);
          else
            this.preview(e);
        }
      }
    });
    canvas.addEventListener('pointercancel', () => this.drag = null);
    canvas.addEventListener('wheel', ev => {
      if (this.locked || this.detail) return;
      ev.preventDefault();
      this.zoomBy(Math.exp(-ev.deltaY * .0015));
    }, {passive: false});
    canvas.addEventListener('keydown', ev => {
      if (this.locked) return;
      const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1}[ev.key];
      if (this.detail) {
        if (step) {
          ev.preventDefault();
          if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')
            this.atomYaw += step * .2;
          else
            this.atomPitch += step * .2;
          this.drawSoon();
        }
        return;
      }
      const visible = this.list().filter(e => !this.filter || this.filter === e.category);
      const index = visible.findIndex(e => e.number === this.selected), e = visible[index];
      if (ev.key === 'Enter') {
        ev.preventDefault();
        if (e)
          this.enter(e);
        else
          this.preview(visible[0]);
        return;
      }
      if (!step) return;
      ev.preventDefault();
      if (!e) {
        this.preview(visible[0]);
        return;
      }
      let next;
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')
        next = visible.filter(v => v.column === e.column && (v.row - e.row) * step > 0)
                   .sort((a, b) => Math.abs(a.row - e.row) - Math.abs(b.row - e.row))[0];
      this.preview(next || visible[(index + step + visible.length) % visible.length]);
    });
    this.drawSoon();
  }
  list() {
    return this.elements.filter(e => this.extended || !e.theoretical);
  }
  reset() {
    this.pitch = .48;
    this.yaw = -.22;
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
  focusDetail(open, done) {
    if (this.locked) return;
    this.drag = null;
    this.locked = true;
    if (open) {
      this.atomYaw = this.flat ? 0 : this.yaw;
      this.atomPitch = this.flat ? 0 : this.pitch;
    }
    this.canvas.setAttribute('aria-busy','true');
    this.flight = {from: this.detail, to: open ? 1 : 0, start: performance.now(), done};
    this.drawSoon();
  }
  draw(now) {
    const frame = fitCanvas(this.canvas);
    if (!frame) return;
    const {ctx, width: w, height: h} = frame;
    ctx.clearRect(0, 0, w, h);
    this.hits = [];
    const intro = reduced.matches ? 1 : clamp((now - this.start) / 1650, 0, 1);
    const flight = this.flight;
    const t = flight ? (reduced.matches ? 1 : clamp((now - flight.start) / 850, 0, 1)) : 1;
    if (flight) this.detail = lerp(flight.from, flight.to, smooth(t));
    const travel = this.detail;
    const yaw = this.flat ? 0 : this.yaw, pitch = this.flat ? 0 : this.pitch;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const roll = this.flat ? 0 : -.025, cr = Math.cos(roll), sr = Math.sin(roll);
    const scale = Math.min((w - 30) / 19.6, (h - 74) / (this.extended ? 12.4 : 11.1)) *
        lerp(this.zoom, 1, travel);
    const eye = lerp(50, 295, travel);
    const centreX = lerp(w * .5, w * .20, travel) + this.panX * (1 - travel);
    const centreY = lerp(h * .5, h * .83, travel) + this.panY * (1 - travel);
    const project = ([x, y, z]) => {
      y -= this.extended ? .75 : .1;
      const rx = cy * x + sy * z, rz = -sy * x + cy * z, ry = cp * y - sp * rz,
            depth = sp * y + cp * rz;
      const k = scale * 50 / (eye - depth);
      return [centreX + (rx * cr - ry * sr) * k, centreY + (rx * sr + ry * cr) * k, depth, k];
    };
    const clock = reduced.matches ? .32 : now * .00014;
    const list = this.list();
    const boxes =
        list.map(e => {
              let [x, y] = pose(e);
              const value = this.mapping.height(e), missing = value === null;
              const [sx, sy, sz, delay] = this.startPoints.get(e.number);
              const progress = smooth(clamp((intro - delay * .63) / .37, 0, 1)), k = 1 - progress;
              x += sx * k;
              y += sy * k;
              const base = sz * k, tip = base + (value ?? 0), s = .417 * (.07 + .93 * progress);
              const near = Math.max(base, tip), far = Math.min(base, tip);
              const points = [...corners(x, y, far, s), ...corners(x, y, near, s)].map(project);
              return {
                e,
                points,
                tip: project([x, y, tip]),
                anchor: project([x, y, base]),
                cell: corners(x, y, tip, s).map(project),
                alpha: progress,
                missing,
                depth: project([x, y, (base + tip) / 2])[2]
              };
            })
            .sort((a, b) => a.depth - b.depth);
    if (intro === 1 && this.showPaths) {
      ctx.strokeStyle = 'rgba(153,191,184,' + (.20 * (1 - travel)) + ')';
      ctx.lineWidth = .65;
      const line = (a, b) => {
        ctx.beginPath();
        ctx.moveTo(...project(a).slice(0, 2));
        ctx.lineTo(...project(b).slice(0, 2));
        ctx.stroke();
      };
      for (let x = -9; x <= 9; x++) line([x, -4.45, 0], [x, 2.64, 0]);
      for (let y = 0; y <= 7; y++) line([-9, y - 4.45, 0], [9, y - 4.45, 0]);
    }
    if (intro === 1 && this.showGridLabels && travel < .5) {
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
    for (const box of boxes) {
      if (this.view === 'blocks') {
        this.drawBox(ctx, box, travel, reduced.matches ? 0 : now / 2800);
        continue;
      }
      const {e, tip, anchor, missing, cell} = box;
      if (!box.alpha) continue;
      const dim = this.filter && this.filter !== e.category;
      const selected = e.number === this.selected;
      const color = families[e.category][1];
      ctx.save();
      ctx.globalAlpha = box.alpha * (missing ? .43 : dim ? .14 : 1) * (1 - .72 * travel);
      if (this.showPaths) {
        ctx.strokeStyle = color;
        ctx.lineWidth = .75;
        ctx.beginPath();
        ctx.moveTo(anchor[0], anchor[1]);
        ctx.lineTo(tip[0], tip[1]);
        ctx.stroke();
      }
      const size = tip[3] * .35 * box.alpha;
      drawAtom(ctx, e, {
        x: tip[0],
        y: tip[1] - .07 * tip[3],
        size,
        yaw,
        pitch,
        roll,
        clock,
        color,
        showPaths: this.showPaths,
        wire: this.effect === 'Wireframe'
      });
      if (!dim && !travel) this.hits.push({poly: cell, element: e});
      if (selected && !travel) {
        path(ctx, cell);
        ctx.strokeStyle = '#efffdc';
        ctx.stroke();
      }
      if (this.showNames && travel < .7) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#eff5e8';
        const showFull = tip[3] >= 58;
        const fontSize = showFull ? Math.min(14, tip[3] * .15) : Math.max(6, tip[3] * .23);
        ctx.font = 'bold ' + fontSize + 'px Arial';
        ctx.fillText(showFull ? e.name : e.symbol, tip[0], tip[1] + tip[3] * .39, tip[3] * .94);
      }
      ctx.restore();
    }
    if (travel > 0) {
      const source = boxes.find(b => b.e.number === this.selected);
      if (source) {
        const {e, tip} = source;
        const extent = Math.min(w * .34, h * .34);
        ctx.save();
        ctx.globalAlpha = smooth(travel);
        drawAtom(ctx, e, {
          x: lerp(tip[0], w * .53, travel),
          y: lerp(tip[1], h * .45, travel),
          size: lerp(tip[3] * .35, extent, travel),
          yaw: this.atomYaw,
          pitch: this.atomPitch,
          clock,
          color: families[e.category][1],
          showPaths: this.showPaths,
          detailed: true
        });
        ctx.restore();
      }
    }
    if (flight && t === 1) {
      this.flight = null;
      this.locked = false;
      this.canvas.setAttribute('aria-busy','false');
      flight.done();
    } else if (!flight && intro === 1 && this.locked) {
      this.locked = false;
      this.ready();
    }
    if (intro < 1 || this.flight)
      this.drawSoon();
    else if ((this.detail || this.view === 'atoms' || this.effect === 'Astrophage') && !reduced.matches && !document.hidden) {
      clearTimeout(this.tick);
      this.tick = setTimeout(() => this.drawSoon(), this.detail || this.effect === 'Astrophage' ? 35 : 90);
    }
  }
  drawBox(ctx, {e, points, alpha, missing}, travel, cycles) {
    if (alpha <= .001) return;
    const selected = e.number === this.selected, dim = this.filter && this.filter !== e.category;
    const base = families[e.category][1], wire = this.effect === 'Wireframe',
          hot = this.effect === 'Astrophage';
    const col = missing ? '#8b9998' : base;
    ctx.globalAlpha = alpha * (1 - .72 * travel) * (dim ? .16 : missing ? .55 : 1);
    ctx.lineWidth = wire ? .9 : .8;
    const faces =
        boxFaces.map((ids, i) => ({i, p: ids.map(id => points[id])}))
            .sort((a, b) => a.p.reduce((s, p) => s + p[2], 0) - b.p.reduce((s, p) => s + p[2], 0));
    for (const {i, p} of faces) {
      const [a, b, c] = p;
      if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <= 0) continue;
      path(ctx, p);
      ctx.fillStyle = wire ? '#1b2728' : tint(col, [.18, .30, .31, .56, .30, .84][i]);
      if (i === 5 && !wire && !travel) {
        const enamel = ctx.createLinearGradient(a[0], a[1], c[0], c[1]);
        enamel.addColorStop(0, tint(col, 1, 10));
        enamel.addColorStop(1, tint(col, .78));
        ctx.fillStyle = enamel;
      }
      ctx.fill();
      ctx.strokeStyle = wire ? tint(col, .9) : tint(col, i === 5 ? 1 : .64);
      ctx.stroke();
      if (hot && travel < .8) {
        traceBorder(ctx, p, (cycles + e.number * .618 + i * .13) % 1);
      }
      if (!dim && !travel) this.hits.push({poly: p, element: e});
      if (i !== 5) continue;
      if (selected || (!wire && !hot && !travel && alpha === 1)) {
        ctx.save();
        ctx.strokeStyle = selected ? '#f6ffe4' : col;
        ctx.lineWidth = selected ? 2 : .7;
        ctx.shadowColor = col;
        ctx.shadowBlur = selected ? 7 : 3;
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
      if (this.showNames) {
        const faceWidth = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
        const faceHeight = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
        ctx.font = '16px Arial';
        const full = Math.min(faceWidth, faceHeight) >= 56;
        ctx.textAlign = 'center';
        if (full) ctx.fillText(e.name, 50, 94, 94);
        ctx.font = 'bold ' + (e.symbol.length === 3 ? 39 : 48) + 'px Arial';
        ctx.fillText(e.symbol, 50, full ? 69 : 77);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
// The current canvas path is a visible projected face. Its perimeter sets the
// dash period so the ember completes one circuit at every camera angle and zoom.
function traceBorder(ctx, points, phase) {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    perimeter += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
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
