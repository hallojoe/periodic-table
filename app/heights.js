// Calculated atomic radii (pm), indexed by Z. See docs/README.md for sources.
// The visualisation lookup is independent of the original element records.
const radii = [
  null, 53,  31,  167, 112, 87,  67,  56,  48,  42,  38,  190, 145, 118, 111, 98,  88,  79,
  71,   243, 194, 184, 176, 171, 166, 161, 156, 152, 149, 145, 142, 136, 125, 114, 103, 94,
  88,   265, 219, 212, 206, 198, 190, 183, 178, 173, 169, 165, 161, 156, 145, 133, 123, 115,
  108,  298, 253, 226, 210, 247, 206, 205, 238, 231, 233, 225, 228, 226, 226, 222, 222, 217,
  208,  200, 193, 188, 185, 180, 177, 174, 171, 156, 154, 143, 135, 127, 120
];
export const metrics = {
  number: {label: 'Atomic number', unit: '', read: e => e.number, scale: Math.sqrt},
  radius: {label: 'Calculated atomic radius', unit: 'pm', read: e => radii[e.number] ?? null},
  mass: {label: 'Atomic weight', unit: '', read: e => /^\d/.test(e.mass) ? Number(e.mass) : null},
  shells:
      {label: 'Occupied electron shells', unit: '', read: e => e.shells.filter(n => n > 0).length},
  melt: {label: 'Melting point', unit: 'K', read: e => e.melt},
  boil: {label: 'Boiling point', unit: 'K', read: e => e.boil},
  liquid: {
    label: 'Liquid temperature range',
    unit: 'K',
    read: e => e.melt != null && e.boil != null ? e.boil - e.melt : null
  }
};
export function heightMapping(elements, key, direction) {
  const metric = metrics[key];
  const values = elements.map(metric.read).filter(Number.isFinite).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  const transform = metric.scale ?? (v => v);
  const origin = direction === 'median' ? transform(median) : 0;
  const maximum = Math.max(transform(values.at(-1)) - origin, origin - transform(values[0])) || 1;
  const sign = direction === 'down' ? -1 : 1;
  return {
    metric,
    median,
    min: values[0],
    max: values.at(-1),
    height(e) {
      const value = metric.read(e);
      return Number.isFinite(value) ? sign * 2.05 * (transform(value) - origin) / maximum : null;
    }
  };
}
