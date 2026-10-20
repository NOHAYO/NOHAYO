/* רשימת טיולים – סינון חי ומיון */
(function () {
  const { D } = App;
  const REGIONS = ['north', 'center', 'jerusalem', 'south', 'jordan', 'sinai'];
  const TYPES = Array.from(new Set(D.TRIPS.map((x) => x.type)));
  const LANGS = Array.from(new Set(D.TRIPS.flatMap((x) => x.langs)));
  const DURS = ['half', 'day', 'multi'];
  const INTERESTS = Array.from(new Set(D.TRIPS.flatMap((x) => x.interests)));
  const prices = D.TRIPS.map((x) => x.price);
  const PMIN = Math.floor(Math.min.apply(null, prices) / 10) * 10;
  const PMAX = Math.ceil(Math.max.apply(null, prices) / 10) * 10;

  const p = new URLSearchParams(location.search);
  const list = (k) => (p.get(k) ? p.get(k).split(',').filter(Boolean) : []);
  const state = {
    date: p.get('date') || '',
    region: list('region'), lang: list('tlang'), type: list('type'),
    dur: list('dur'), interest: list('interest'),
    pmin: Number(p.get('pmin')) || PMIN, pmax: Number(p.get('pmax')) || PMAX,
    sort: p.get('sort') || 'date'
  };
  let panelOpen = false;

  function syncUrl() {
    const u = new URL(location.href);
    ['date', 'region', 'tlang', 'type', 'dur', 'interest', 'pmin', 'pmax', 'sort'].forEach((k) => u.searchParams.delete(k));
    if (state.date) u.searchParams.set('date', state.date);
    ['region', 'lang', 'type', 'dur', 'interest'].forEach((k) => { if (state[k].length) u.searchParams.set(k === 'lang' ? 'tlang' : k, state[k].join(',')); });
    if (state.pmin !== PMIN) u.searchParams.set('pmin', state.pmin);
    if (state.pmax !== PMAX) u.searchParams.set('pmax', state.pmax);
    if (state.sort !== 'date') u.searchParams.set('sort', state.sort);
    history.replaceState(null, '', u);
  }

  function filtered() {
    const any = (arr, vals) => !arr.length || arr.some((v) => vals.includes(v));
    const res = D.TRIPS.filter((x) => {
      const dates = App.upcomingDates(x, state.date);
      return dates.length &&
        any(state.region, [x.region]) && any(state.lang, x.langs) && any(state.type, [x.type]) &&
        any(state.dur, [x.duration]) && any(state.interest, x.interests) &&
        x.price >= state.pmin && x.price <= state.pmax;
    });
    const next = (x) => App.upcomingDates(x, state.date)[0];
    const cmp = {
      date: (a, b) => next(a).localeCompare(next(b)),
      price_asc: (a, b) => a.price - b.price || next(a).localeCompare(next(b)),
      price_desc: (a, b) => b.price - a.price || next(a).localeCompare(next(b)),
      rating: (a, b) => App.tripStats(b.id).avg - App.tripStats(a.id).avg
    }[state.sort] || ((a, b) => 0);
    return res.sort(cmp);
  }

  function activeCount() {
    return (state.date ? 1 : 0) + state.region.length + state.lang.length + state.type.length + state.dur.length + state.interest.length +
      (state.pmin !== PMIN || state.pmax !== PMAX ? 1 : 0);
  }

  App.page(function (main) {
    const { t, esc } = App;
    App.setTitle(t('tours_title'));

    const group = (key, values, labelPrefix) =>
      '<fieldset class="filter-group"><legend>' + esc(t('f_' + key)) + '</legend><ul class="check-list">' +
      values.map((v) => {
        const id = 'f-' + key + '-' + v;
        return '<li><input type="checkbox" id="' + id + '" name="' + key + '" value="' + v + '"' + (state[key].includes(v) ? ' checked' : '') + '>' +
          '<label for="' + id + '">' + esc(t(labelPrefix + v)) + '</label></li>';
      }).join('') + '</ul></fieldset>';

    const hiddenPast = D.TRIPS.filter((x) => !App.isUpcoming(x)).length;

    main.innerHTML =
      '<div class="page-head"><div class="container">' +
      '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_tours')) + '</li></ol></nav>' +
      '<h1>' + esc(t('tours_title')) + '</h1><p class="section-sub">' + esc(t('tours_sub')) + '</p></div></div>' +
      '<div class="container tours-layout">' +
      '<button type="button" class="btn btn-outline filter-toggle" id="filter-toggle" aria-expanded="' + panelOpen + '" aria-controls="filters">' + App.icon('filter') + '<span id="filter-toggle-label"></span></button>' +
      '<aside class="filters' + (panelOpen ? ' open' : '') + '" id="filters" aria-label="' + esc(t('filters')) + '">' +
      '<form id="filter-form">' +
      '<div class="filters-head"><h2 class="h-sub">' + esc(t('filters')) + '</h2><button type="reset" class="btn-link" id="reset">' + esc(t('reset_filters')) + '</button></div>' +
      '<div class="field"><label for="f-date">' + esc(t('f_date_from')) + '</label><input type="date" id="f-date" name="date" min="' + App.todayStr() + '" value="' + esc(state.date) + '"></div>' +
      group('region', REGIONS, 'region_') +
      group('lang', LANGS, 'lang_') +
      '<fieldset class="filter-group"><legend>' + esc(t('f_price')) + '</legend>' +
      '<div class="price-range"><div class="field"><label for="f-pmin">' + esc(t('min')) + '</label><input type="range" id="f-pmin" name="pmin" min="' + PMIN + '" max="' + PMAX + '" step="10" value="' + state.pmin + '"></div>' +
      '<div class="field"><label for="f-pmax">' + esc(t('max')) + '</label><input type="range" id="f-pmax" name="pmax" min="' + PMIN + '" max="' + PMAX + '" step="10" value="' + state.pmax + '"></div>' +
      '<output id="price-out" for="f-pmin f-pmax" aria-live="polite"></output></div></fieldset>' +
      group('type', TYPES, 'type_') +
      group('dur', DURS, 'dur_') +
      group('interest', INTERESTS, 'int_') +
      '<button type="button" class="btn btn-primary filters-done" id="filters-done">' + esc(t('show_results')) + '</button>' +
      '</form></aside>' +
      '<section class="results" aria-labelledby="results-count">' +
      '<div class="results-bar"><p id="results-count" class="results-count" aria-live="polite"></p>' +
      '<div class="field field-inline"><label for="sort">' + esc(t('sort_by')) + '</label><select id="sort">' +
      ['date', 'price_asc', 'price_desc', 'rating'].map((v) => '<option value="' + v + '"' + (state.sort === v ? ' selected' : '') + '>' + esc(t('sort_' + v)) + '</option>').join('') +
      '</select></div></div>' +
      '<div id="active-chips" class="active-chips"></div>' +
      '<div class="grid grid-2" id="results"></div>' +
      (hiddenPast ? '<p class="demo-note" role="note">' + App.icon('check') + '<span>' + esc(t('hidden_past_note', { n: hiddenPast })) + '</span></p>' : '') +
      '</section></div>';

    const form = document.getElementById('filter-form');
    const pminEl = document.getElementById('f-pmin');
    const pmaxEl = document.getElementById('f-pmax');

    function update() {
      const res = filtered();
      const n = activeCount();
      document.getElementById('price-out').textContent = App.fmtPrice(state.pmin) + ' – ' + App.fmtPrice(state.pmax);
      pminEl.setAttribute('aria-valuetext', App.fmtPrice(state.pmin));
      pmaxEl.setAttribute('aria-valuetext', App.fmtPrice(state.pmax));
      document.getElementById('results-count').textContent = t('results_count', { n: res.length });
      document.getElementById('filter-toggle-label').textContent = t('filters') + (n ? ' (' + n + ')' : '');
      document.getElementById('results').innerHTML = res.length
        ? res.map((x) => App.tripCard(x, { from: state.date })).join('')
        : '<div class="empty"><p><strong>' + esc(t('no_results')) + '</strong></p><p>' + esc(t('no_results_sub')) + '</p>' +
          '<p><a class="btn btn-primary" href="custom.html">' + esc(t('cta_custom_btn')) + '</a></p></div>';
      // chips for active filters (click to remove)
      const chips = [];
      if (state.date) chips.push(['date', '', t('from_date', { d: App.fmtDate(state.date, 'short') })]);
      [['region', 'region_'], ['lang', 'lang_'], ['type', 'type_'], ['dur', 'dur_'], ['interest', 'int_']].forEach(([k, pre]) =>
        state[k].forEach((v) => chips.push([k, v, t(pre + v)])));
      if (state.pmin !== PMIN || state.pmax !== PMAX) chips.push(['price', '', App.fmtPrice(state.pmin) + '–' + App.fmtPrice(state.pmax)]);
      document.getElementById('active-chips').innerHTML = chips.map(([k, v, label]) =>
        '<button type="button" class="chip chip-remove" data-k="' + k + '" data-v="' + esc(v) + '" aria-label="' + esc(t('remove_filter', { f: label })) + '">' + esc(label) + ' ' + App.icon('x') + '</button>').join('');
      syncUrl();
    }

    form.addEventListener('input', function (e) {
      const el = e.target;
      if (el.type === 'checkbox') {
        state[el.name] = Array.from(form.querySelectorAll('input[name="' + el.name + '"]:checked')).map((x) => x.value);
      } else if (el.name === 'date') {
        state.date = el.value;
      } else if (el.name === 'pmin' || el.name === 'pmax') {
        let a = Number(pminEl.value), b = Number(pmaxEl.value);
        if (a > b) { if (el.name === 'pmin') b = a; else a = b; pminEl.value = a; pmaxEl.value = b; }
        state.pmin = a; state.pmax = b;
      }
      update();
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        Object.assign(state, { date: '', region: [], lang: [], type: [], dur: [], interest: [], pmin: PMIN, pmax: PMAX });
        pminEl.value = PMIN; pmaxEl.value = PMAX;
        update();
      });
    });
    document.getElementById('sort').addEventListener('change', function () { state.sort = this.value; update(); });
    document.getElementById('active-chips').addEventListener('click', function (e) {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k, v = b.dataset.v;
      if (k === 'date') { state.date = ''; form.date.value = ''; }
      else if (k === 'price') { state.pmin = PMIN; state.pmax = PMAX; pminEl.value = PMIN; pmaxEl.value = PMAX; }
      else {
        state[k] = state[k].filter((x) => x !== v);
        const cb = document.getElementById('f-' + k + '-' + v);
        if (cb) cb.checked = false;
      }
      update();
      document.getElementById('sort').focus();
    });

    const toggle = document.getElementById('filter-toggle');
    const panel = document.getElementById('filters');
    function setPanel(open) {
      panelOpen = open;
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
    }
    toggle.addEventListener('click', () => { setPanel(!panelOpen); if (panelOpen) panel.querySelector('input').focus(); });
    document.getElementById('filters-done').addEventListener('click', () => {
      setPanel(false); toggle.focus();
      document.getElementById('results-count').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    update();
  });
})();
