import {heightMapping, metrics} from './heights.js';
import {icon} from './icons.js';
import {Lattice, reduced} from './lattice.js';
import {families, palettes, themes} from './appearance.js';

const $ = id => document.getElementById(id);
const explorer = $('explorer'), help = $('help'), search = $('search'), matches = $('matches');
const escape = s => String(s).replace(
    /[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'}[c]));
const data = await fetch(new URL('elements.json', import.meta.url)).then(r => {
  if (!r.ok) throw Error('Element data unavailable');
  return r.json();
});
let selected = null, detailed = false, results = [], active = -1;
const massLabel = e => e.mass.startsWith('[') ? 'Isotope mass number' : 'Atomic mass';
const massValue = e => e.mass === '—' ? 'Unknown' : e.mass.startsWith('[') ? e.mass : e.mass + ' u';
const measure = v => v == null ?
    'Unknown' :
    Number((v - 273.15).toFixed(2)).toLocaleString('en-US') + ' °C · ' + v + ' K';
const swatch = category => '<i class="swatch" style="--c:' + table.colors[category] + '"></i>';
const family = e =>
    '<span class="family-tag">' + swatch(e.category) + families[e.category] + '</span>';
const facts = items => '<dl class="facts">' +
    items.map(([k, v]) => '<div><dt>' + escape(k) + '</dt><dd>' + escape(v) + '</dd></div>')
        .join('') +
    '</dl>';
const table = new Lattice($('lattice'), data, inspect, enter, () => {
  explorer.inert = false;
});
function renderRecord() {
  const panel = $('inspect');
  if (!selected) {
    panel.innerHTML = '<h2>' + icon('focus') +
        'Selection</h2><p class="muted">Select an element to see its record.</p>';
    return;
  }
  const e = selected, metric = table.mapping.metric;
  const property = metric.read(e);
  const unitValue = Number.isFinite(property) ? formatValue(property, metric.unit) : 'Unavailable';
  const temperature = v => {
    if ([6, 33].includes(e.number) && v == null) return 'Sublimes at 1 atm';
    if (e.number === 2 && v == null) return 'Requires pressure';
    return measure(v);
  };
  const full = [
    ['Atomic number', e.number], [massLabel(e), massValue(e)],
    ['Period / group', e.period + ' / ' + (e.group ?? 'f-block series')],
    ['Phase at room temperature', e.phase], ['Melting point', temperature(e.melt)],
    ['Boiling point', temperature(e.boil)],
    [
      e.shellsPredicted ? 'Predicted electrons per shell' : 'Electrons per shell',
      e.shells.join(' · ')
    ],
    ['Discovery', e.year ?? 'Unconfirmed'], ['Discovered by', e.discoveredBy ?? 'Unknown']
  ];
  const brief = [
    [metric.label, unitValue], ['Period / group', e.period + ' / ' + (e.group ?? 'f-block series')],
    ['Phase', e.phase]
  ];
  panel.innerHTML = '<h2>' + icon(detailed ? 'atom' : 'focus') +
      (detailed ? 'Element record' : 'Selection') + '</h2>' +
      '<div class="identity"><div class="symbol" style="--c:' + table.colors[e.category] +
      '"><small>' + e.number + '</small><strong>' + escape(e.symbol) + '</strong></div><div><h3>' +
      escape(e.name) + '</h3>' + family(e) + '</div></div>' +
      (detailed ? '<p class="summary">' + escape(e.summary) + '</p>' : '') +
      facts(detailed ? full : brief) +
      (detailed ?
           '<a class="source" href="' + escape(e.source) +
               '" target="_blank" rel="noopener">Element reference ↗</a>' :
           '<button class="enter" id="enter">Inspect element ' + icon('arrow') + '</button>');
  if (!detailed) $('enter').onclick = () => enter(e);
}
function inspect(e) {
  if (!e || detailed || table.locked) return;
  selected = e;
  table.selected = e.number;
  renderRecord();
  table.drawSoon();
}
function formatValue(v, unit) {
  return Number(v.toFixed(3)).toLocaleString('en-US', {maximumFractionDigits: 3}) +
      (unit ? ' ' + unit : '');
}
function updateMetric() {
  const mapping = heightMapping(data, $('metric').value, $('direction').value);
  table.mapping = mapping;
  const format = v => formatValue(v, mapping.metric.unit);
  $('range').innerHTML =
      '<span>' + format(mapping.min) + '</span><span>' + format(mapping.max) + '</span>';
  const scale = $('metric').value === 'number' ? 'Square-root scale' : 'Linear scale';
  $('baseline').textContent = scale + ' · ' +
      ($('direction').value === 'median' ? 'Median ' + format(mapping.median) : 'Zero baseline');
  renderRecord();
  table.drawSoon();
}
$('metric').innerHTML = Object.entries(metrics)
                            .map(([id, m]) => '<option value="' + id + '">' + m.label + '</option>')
                            .join('');
$('metric').onchange = updateMetric;
$('direction').onchange = updateMetric;
function setView(view) {
  table.view = view;
  for (const id of ['blocks', 'atoms']) $(id).setAttribute('aria-pressed', String(view === id));
  table.drawSoon();
}
$('blocks').onclick = () => setView('blocks');
$('atoms').onclick = () => setView('atoms');
document.addEventListener('visibilitychange', () => table.drawSoon());
reduced.addEventListener('change', () => table.drawSoon());
function closeSearch() {
  matches.hidden = true;
  search.setAttribute('aria-expanded', 'false');
  search.removeAttribute('aria-activedescendant');
  active = -1;
}
function detailUI(open) {
  detailed = open;
  document.querySelector('.workspace').classList.toggle('details', open);
  $('settings').hidden = open;
  $('camera').hidden = open;
  $('count').hidden = open;
  $('leave').hidden = !open;
  $('legend').inert = open;
  document.querySelector('.representation').inert = open;
  document.querySelector('.searchbox').inert = open;
  $('view-label').textContent = open ? 'Element detail' :
      table.flat                     ? 'Front elevation' :
                                       'Perspective';
  $('gesture').textContent = open ? 'Drag to rotate atom' : 'Drag to orbit';
  $('hint').textContent =
      open ? 'Arrow keys rotate · Esc to return' : 'Click to select · Click again for details';
  $('lattice').setAttribute(
      'aria-label',
      open ?
          'Rotate ' + selected.name + ' Bohr model with arrow keys. Escape returns to table.' :
          'Periodic table. Click once to select and again to inspect. Use arrows and Enter on the keyboard.');
  renderRecord();
}
function enter(e) {
  if (!e || detailed || table.locked) return;
  inspect(e);
  closeSearch();
  detailUI(true);
  table.focusDetail(true, () => $('lattice').focus({preventScroll: true}));
}
function leave() {
  if (!detailed || table.locked) return;
  table.focusDetail(false, () => {
    detailUI(false);
    $('lattice').focus({preventScroll: true});
  });
}
$('leave').onclick = leave;
$('guide').onclick = () => {
  if (!table.locked) help.showModal();
};
$('close-help').onclick = () => help.close();
function legends() {
  const available = Object.entries(families).filter(
      ([key]) => (key !== 'theoretical' || table.extended) && data.some(e => e.category === key));
  $('families').innerHTML =
      available
          .map(
              ([key, name]) => '<button data-family="' + key + '" aria-pressed="' +
                  (key === table.filter) + '" class="' + (key === table.filter ? 'active' : '') +
                  '">' + swatch(key) + name + '</button>')
          .join('');
  $('count').textContent =
      (table.filter ? table.list().filter(e => e.category === table.filter).length :
                      table.list().length) +
      ' ELEMENTS';
  $('clear').hidden = !table.filter;
}
function setFilter(key) {
  table.filter = key;
  legends();
  if (key && selected && selected.category !== key) {
    selected = null;
    table.selected = null;
    renderRecord();
  }
  table.drawSoon();
}
$('families').onclick = e => {
  const b = e.target.closest('button');
  if (b) setFilter(b.dataset.family === table.filter ? null : b.dataset.family);
};
$('clear').onclick = () => setFilter(null);
function setExtended() {
  table.extended = $('extended').checked;
  if (!table.extended && selected?.theoretical) {
    selected = null;
    table.selected = null;
    renderRecord();
  }
  if (!table.extended && table.filter === 'theoretical') table.filter = null;
  legends();
  table.drawSoon();
}
$('extended').onchange = setExtended;
for (const option of ['fill', 'wireframe', 'astrophage', 'blinkingDots', 'showPaths', 'showGridLabels', 'showNames']) {
  const control = $(option);
  const update = () => {
    table[option] = control.checked;
    table.drawSoon();
  };
  control.onchange = update;
  update();
}
$('theme').innerHTML = themes.map(theme => '<option>' + theme + '</option>').join('');
$('theme').onchange = () => {
  table.colors = palettes[$('theme').value];
  legends();
  renderRecord();
  if (!matches.hidden) runSearch();
  table.drawSoon();
};
$('minus').onclick = () => table.zoomBy(1 / 1.2);
$('plus').onclick = () => table.zoomBy(1.2);
function flat(value) {
  table.flat = value;
  $('flat').setAttribute('aria-pressed', String(value));
  $('flat').querySelector('span').textContent = value ? '3D view' : 'Front view';
  $('view-label').textContent = value ? 'Front elevation' : 'Perspective';
  table.reset();
}
$('flat').onclick = () => flat(!table.flat);
$('reset').onclick = () => flat(false);
function runSearch() {
  const q = search.value.trim().toLowerCase();
  if (!q) {
    closeSearch();
    return;
  }
  results =
      data.filter(
              e => e.symbol.toLowerCase() === q || e.name.toLowerCase().includes(q) ||
                  String(e.number) === q)
          .sort(
              (a, b) => Number(b.symbol.toLowerCase() === q) - Number(a.symbol.toLowerCase() === q))
          .slice(0, 7);
  active = results.length ? 0 : -1;
  matches.innerHTML =
      results
          .map(
              (e, i) => '<button type="button" class="match" role="option" id="match-' + i +
                  '" data-index="' + i + '">' + swatch(e.category) + '<b>' + e.symbol + '</b>' +
                  e.name + '<span>' + e.number + '</span></button>')
          .join('') ||
      '<p class="empty">No matching elements</p>';
  matches.hidden = false;
  search.setAttribute('aria-expanded', 'true');
  highlight();
}
function highlight() {
  [...matches.querySelectorAll('.match')].forEach((b, i) => {
    b.classList.toggle('active', i === active);
    b.setAttribute('aria-selected', String(i === active));
  });
  if (active >= 0) search.setAttribute('aria-activedescendant', 'match-' + active);
}
function openResult(i) {
  if (results[i]) {
    search.value = '';
    if (table.filter && table.filter !== results[i].category) setFilter(null);
    const e = results[i];
    if (e.theoretical && !table.extended) {
      $('extended').checked = true;
      setExtended();
    }
    closeSearch();
    if (selected === e)
      enter(e);
    else
      inspect(e);
    $('lattice').focus({preventScroll: true});
  }
}
search.oninput = runSearch;
search.onfocus = runSearch;
matches.onpointerdown = e => e.preventDefault();
matches.onclick = e => {
  const b = e.target.closest('.match');
  if (b) openResult(Number(b.dataset.index));
};
search.onkeydown = e => {
  if (e.key === 'Escape') {
    closeSearch();
    search.blur();
  }
  if (e.key === 'Enter' && !matches.hidden) {
    e.preventDefault();
    openResult(active);
  }
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length && !matches.hidden) {
    e.preventDefault();
    active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
    highlight();
  }
};
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.searchbox')) closeSearch();
});
document.addEventListener('focusin', e => {
  if (!e.target.closest('.searchbox')) closeSearch();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && detailed && !help.open) {
    e.preventDefault();
    leave();
    return;
  }
  if (e.key === '/' && !e.metaKey && !e.ctrlKey && !table.locked && !detailed && !help.open &&
      document.activeElement !== search) {
    e.preventDefault();
    search.focus();
  }
});
updateMetric();
legends();
