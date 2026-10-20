/* מורי הדרך שלנו – רשת עם סינון */
(function () {
  const state = { lang: App.param('lang_f') || '', spec: App.param('spec') || '' };

  App.page(function (main) {
    const { t, esc, D } = App;
    App.setTitle(t('guides_title'));
    const langs = Array.from(new Set(D.GUIDES.flatMap((g) => g.langs)));
    const specs = Array.from(new Set(D.GUIDES.flatMap((g) => g.specialties)));
    const opt = (v, label, cur) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>';

    main.innerHTML =
      '<div class="page-head"><div class="container">' +
      '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_guides')) + '</li></ol></nav>' +
      '<h1>' + esc(t('guides_title')) + '</h1><p class="section-sub">' + esc(t('guides_sub')) + '</p></div></div>' +
      '<div class="container">' +
      '<form class="inline-filters" id="gf" aria-label="' + esc(t('filters')) + '">' +
      '<div class="field"><label for="g-lang">' + esc(t('f_lang')) + '</label><select id="g-lang" name="lang">' + opt('', t('any_lang'), state.lang) + langs.map((l) => opt(l, t('lang_' + l), state.lang)).join('') + '</select></div>' +
      '<div class="field"><label for="g-spec">' + esc(t('f_spec')) + '</label><select id="g-spec" name="spec">' + opt('', t('any_spec'), state.spec) + specs.map((x) => opt(x, t('spec_' + x), state.spec)).join('') + '</select></div>' +
      '</form>' +
      '<p id="g-count" class="results-count" aria-live="polite"></p>' +
      '<div class="grid grid-3" id="g-grid"></div>' +
      '<p class="demo-note" role="note">' + App.icon('shield') + '<span>' + esc(t('licensed_all_sub')) + '</span></p>' +
      '</div>';

    function update() {
      const res = D.GUIDES.filter((g) => (!state.lang || g.langs.includes(state.lang)) && (!state.spec || g.specialties.includes(state.spec)));
      document.getElementById('g-count').textContent = t('guides_count', { n: res.length });
      document.getElementById('g-grid').innerHTML = res.length ? res.map(App.guideCard).join('') : '<p class="empty">' + esc(t('no_results')) + '</p>';
    }
    document.getElementById('gf').addEventListener('change', function (e) {
      state[e.target.name] = e.target.value;
      update();
    });
    update();
  });
})();
