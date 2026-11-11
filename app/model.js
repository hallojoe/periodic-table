// An orthographic local frame projected at the atom's perspective scale in the lattice.
// Ellipses and moving electrons use the same rotated shell basis.
const tau = 2 * Math.PI;
const shells = new Map();
function orbitAxes(index) {
  if (!shells.has(index)) {
    const turn = -.62 + index * .91, tilt = .82 + .26 * Math.sin(index * 1.3 + .5);
    shells.set(index, [
      [Math.cos(turn), Math.sin(turn), 0],
      [-Math.sin(turn) * Math.cos(tilt), Math.cos(turn) * Math.cos(tilt), Math.sin(tilt)]
    ]);
  }
  return shells.get(index);
}
function particle(ctx, x, y, r, color, highlight, detailed) {
  if (detailed) {
    const g = ctx.createRadialGradient(x - r * .32, y - r * .38, r * .04, x, y, r);
    g.addColorStop(0, '#f4faf4');
    g.addColorStop(.33, highlight);
    g.addColorStop(1, color);
    ctx.fillStyle = g;
  } else
    ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, tau);
  ctx.fill();
}
export function drawAtom(
    ctx, e, {x, y, size, yaw, pitch, clock, color, detailed = false, wire = false, roll = 0}) {
  if (size < .3) return;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  function rotate([x, y, z]) {
    const depth = -sy * x + cy * z;
    return [cy * x + sy * z, cp * y - sp * depth, sp * y + cp * depth];
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(roll);
  const behind = [], front = [];
  const ringAlpha = ctx.globalAlpha;
  e.shells.forEach((count, i) => {
    const r = size * (.29 + .71 * (i + 1) / e.shells.length);
    const [u, v] = orbitAxes(i).map(rotate);
    // Project the circular shell via its 2D basis. Draw it in screen units for uniform line width.
    ctx.beginPath();
    ctx.save();
    ctx.transform(r * u[0], r * u[1], r * v[0], r * v[1], 0, 0);
    ctx.arc(0, 0, 1, 0, tau);
    ctx.restore();
    ctx.globalAlpha = ringAlpha * (detailed ? .68 : .76);
    ctx.strokeStyle = color;
    ctx.lineWidth = detailed ? 1.2 : .65;
    ctx.stroke();
    ctx.globalAlpha = ringAlpha;
    for (let j = 0; j < count; j++) {
      const angle = tau * j / count + clock * (1 - .055 * i) + i * 1.53 + .9, c = Math.cos(angle),
            s = Math.sin(angle);
      const electron = [r * (u[0] * c + v[0] * s), r * (u[1] * c + v[1] * s)];
      ((u[2] * c + v[2] * s) < 0 ? behind : front).push(electron);
    }
  });
  const er =
      detailed ? Math.max(2, size * (e.number < 15 ? .035 : .018)) : Math.max(.45, size * .057);
  const electrons = points => {
    if (detailed)
      for (const [px, py] of points) particle(ctx, px, py, er, '#344f4e', color, true);
    else {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (const [px, py] of points) {
        ctx.moveTo(px + er, py);
        ctx.arc(px, py, er, 0, tau);
      }
      ctx.fill();
    }
  };
  electrons(behind);
  if (detailed) {
    const count = e.theoretical ?
        1 :
        Math.min(56, Math.max(1, Math.round(parseFloat(e.mass.replace(/[\[\]]/g, '')))));
    const nr = size * (count === 1 ? .11 : .16),
          pr = count === 1 ? nr : nr * 1.25 / Math.cbrt(count);
    const cluster =
        Array
            .from(
                {length: count},
                (_, k) => {
                  const u = 1 - 2 * (k + .5) / count, a = k * Math.PI * (3 - Math.sqrt(5)),
                        r = nr * Math.sqrt(1 - u * u);
                  const p =
                      count === 1 ? [0, 0, 0] : rotate([r * Math.cos(a), u * nr, r * Math.sin(a)]);
                  return {p, k};
                })
            .sort((a, b) => a.p[2] - b.p[2]);
    for (const {p, k} of cluster)
      particle(ctx, p[0], p[1], pr, k % 2 ? '#36434c' : '#334d39', k % 2 ? '#99aabd' : color, true);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(.7, size * .18), 0, tau);
    wire ? ctx.stroke() : ctx.fill();
  }
  electrons(front);
  ctx.restore();
}
