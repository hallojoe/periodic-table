import {icon} from './icons.js';
import {families, Lattice, reduced} from './lattice.js';
import {drawModel, drawWalls} from './model.js';

const $ = id => document.getElementById(id);
const explorer = $('explorer'), room = $('room'), help = $('help'), search = $('search'),
      matches = $('matches');
const escape = s => String(s).replace(
    /[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'}[c]));
const data = await fetch(new URL('elements.json', import.meta.url)).then(r => {
  if (!r.ok) throw Error('Element data unavailable');
  return r.json();
});
let selected, previousFocus, modelFrame = 0, lastModelFrame = -100, results = [], active = -1;
const massLabel = e => e.mass.startsWith('[') ? 'Isotope mass number' : 'Atomic mass';
const massValue = e => e.mass === '—' ? 'Unknown' : e.mass.startsWith('[') ? e.mass : e.mass + ' u';
const measure = v => v == null ?
    'Unknown' :
    Number((v - 273.15).toFixed(2)).toLocaleString('en-US') + ' °C · ' + v + ' K';
const swatch = category => '<i class="swatch" style="--c:' + families[category][1] + '"></i>';
const family = e =>
    '<span class="family-tag">' + swatch(e.category) + families[e.category][0] + '</span>';
const facts = items => '<dl class="facts">' +
    items.map(([k, v]) => '<div><dt>' + escape(k) + '</dt><dd>' + escape(v) + '</dd></div>')
        .join('') +
    '</dl>';
const table = new Lattice($('lattice'), data, inspect, enter, () => {
  explorer.inert = false;
});
function animateModel(now) {
  cancelAnimationFrame(modelFrame);
  if (!document.hidden && (now - lastModelFrame > 45 || reduced.matches)) {
    lastModelFrame = now;
    const c = $(room.open ? 'large-model' : 'small-model');
    if (c && selected) drawModel(c, selected, now, room.open);
  }
  if (!reduced.matches && !document.hidden) modelFrame = requestAnimationFrame(animateModel);
}
function refreshModel() {
  lastModelFrame = -100;
  cancelAnimationFrame(modelFrame);
  modelFrame = requestAnimationFrame(animateModel);
}
document.addEventListener('visibilitychange', refreshModel);
reduced.addEventListener('change', refreshModel);
function inspect(e) {
  if (!e || selected === e) return;
  selected = e;
  table.selected = e.number;
  table.drawSoon();
  $('inspect').innerHTML = '<figure class="specimen"><canvas id="small-model" aria-label="' +
      escape(e.name) +
      ' Bohr model"></canvas><figcaption class="bohr-tag">BOHR MODEL</figcaption></figure><div class="spec-info"><div class="identity"><div class="symbol"><small>' +
      e.number + '</small><strong>' + escape(e.symbol) + '</strong></div><div><h3>' +
      escape(e.name) + '</h3>' + family(e) + '</div></div>' +
      facts([['Atomic number', e.number], [massLabel(e), massValue(e)], ['Phase', e.phase]]) +
      '<button class="enter" id="enter">Enter element ' + icon('arrow') + '</button></div>';
  $('enter').onclick = () => enter(selected);
  refreshModel();
}
function closeSearch() {
  matches.hidden = true;
  search.setAttribute('aria-expanded', 'false');
  search.removeAttribute('aria-activedescendant');
  active = -1;
}
function enter(e) {
  if (table.locked || room.open) return;
  if (e.theoretical && !table.extended) {
    $('extended').checked = true;
    setExtended();
  }
  inspect(e);
  previousFocus = document.activeElement;
  closeSearch();
  explorer.inert = true;
  table.fly(e, () => {
    const temperature = v => [6, 33].includes(e.number) && v == null ? 'Sublimes at 1 atm' :
        e.number === 2 && v == null                                  ? 'Requires pressure' :
                                                                       measure(v);
    const props = [
      ['Atomic number', e.number], [massLabel(e), massValue(e)],
      ['Period / group', e.period + ' / ' + (e.group ?? 'f-block series')],
      ['Phase at room temperature', e.phase], ['Melting point', temperature(e.melt)],
      ['Boiling point', temperature(e.boil)], ['Discovery', e.year ?? 'Unconfirmed'],
      ['Discovered by', e.discoveredBy ?? 'Unknown']
    ];
    $('room-content').innerHTML =
        '<div class="room-grid"><div class="room-model"><canvas id="large-model" aria-label="Bohr model of ' +
        escape(e.name) + '"></canvas><p>' +
        (e.shellsPredicted ? 'PREDICTED ELECTRON SHELLS' : 'ELECTRONS PER SHELL') + '<br><br>' +
        e.shells.join(' · ') + '</p></div><article class="room-card"><div class="kicker"><b></b>' +
        (e.theoretical ? 'THEORETICAL ELEMENT' : 'ELEMENT ' + String(e.number).padStart(3, '0')) +
        ' / ' + escape(e.symbol) + '</div><h2>' + escape(e.name) + '</h2>' + family(e) + '<p>' +
        escape(e.summary) + '</p>' + facts(props) + '<a href="' + escape(e.source) +
        '" target="_blank" rel="noopener">Element reference ↗</a></article></div>';
    room.showModal();
    document.body.style.overflow = 'hidden';
    $('leave').focus();
    drawWalls($('walls'), families[e.category][1]);
    refreshModel();
  });
}
function leave() {
  room.close();
}
room.addEventListener('close', () => {
  document.body.style.overflow = '';
  explorer.inert = false;
  refreshModel();
  (previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : $('lattice'))
      .focus({preventScroll: true});
});
$('leave').onclick = leave;
$('guide').onclick = () => {
  if (!table.locked) help.showModal();
};
$('close-help').onclick = () => help.close();
help.onclick = e => {
  if (e.target === help && e.offsetX < 0) help.close();
};
$('nav-table').onclick = () => {
  if (!table.locked) $('lattice').focus({preventScroll: true});
};
function legends() {
  const available = Object.entries(families).filter(
      ([key]) => (key !== 'theoretical' || table.extended) && data.some(e => e.category === key));
  $('families').innerHTML =
      available
          .map(
              ([key, [name]]) => '<button data-family="' + key + '" aria-pressed="' +
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
  if (key && selected.category !== key) inspect(table.list().find(e => e.category === key));
  table.drawSoon();
}
$('families').onclick = e => {
  const b = e.target.closest('button');
  if (b) setFilter(b.dataset.family === table.filter ? null : b.dataset.family);
};
$('clear').onclick = () => setFilter(null);
function setExtended() {
  table.extended = $('extended').checked;
  if (!table.extended && selected.theoretical) inspect(data[5]);
  if (!table.extended && table.filter === 'theoretical') table.filter = null;
  legends();
  table.drawSoon();
}
$('extended').onchange = setExtended;
$('effect').onchange = e => {
  table.effect = e.target.value;
  table.drawSoon();
};
$('minus').onclick = () => table.zoomBy(1 / 1.2);
$('plus').onclick = () => table.zoomBy(1.2);
function flat(value) {
  table.flat = value;
  $('flat').querySelector('span').textContent = value ? '3D view' : 'Flat view';
  $('view-label').textContent = value ? 'FRONT ELEVATION' : 'PERSPECTIVE VIEW';
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
    enter(results[i]);
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
  if (e.key === '/' && !e.metaKey && !e.ctrlKey && !table.locked && !room.open && !help.open &&
      document.activeElement !== search) {
    e.preventDefault();
    search.focus();
  }
});
window.addEventListener('resize', () => {
  if (room.open) drawWalls($('walls'), families[selected.category][1]);
  refreshModel();
});
inspect(data.find(e => e.symbol === 'C'));
legends();
