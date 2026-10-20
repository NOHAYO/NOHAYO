/* דף הבית */
App.page(function (main) {
  const { t, L, esc, D } = App;
  App.setTitle(t('home_title'));

  const upcoming = App.upcomingTrips();
  const hiddenPast = D.TRIPS.length - upcoming.length;
  const all = App.allReviews();
  const s = App.stats(all);

  const opt = (v, label) => '<option value="' + v + '">' + esc(label) + '</option>';
  const regions = ['north', 'center', 'jerusalem', 'south', 'jordan', 'sinai'];
  const types = Array.from(new Set(D.TRIPS.map((x) => x.type)));
  const langs = Array.from(new Set(D.TRIPS.flatMap((x) => x.langs)));

  // three featured reviews: 5 stars, prefer the current language, from different trips
  const featured = [];
  const seen = new Set();
  all.filter((r) => r.r === 5)
    .sort((a, b) => (b.l === App.lang) - (a.l === App.lang) || b.t.length - a.t.length)
    .forEach((r) => { if (featured.length < 3 && !seen.has(r.trip)) { featured.push(r); seen.add(r.trip); } });

  const topGuides = D.GUIDES.slice().sort((a, b) => App.guideStats(b.id).avg - App.guideStats(a.id).avg).slice(0, 4);
  const regionImg = { north: '1441974231531-c6227db76b6e', center: '1488459716781-31db52582fe9', jerusalem: '1552423314-cf29ab68ad73', south: '1509316785289-025f5b846b35', jordan: '1579606032821-4e6161c81bd3', sinai: '1464822759023-fed622ff2c3b' };
  const regionTheme = { north: 'north', center: 'center', jerusalem: 'jerusalem', south: 'south', jordan: 'jordan', sinai: 'sinai' };
  const countBy = (k, v) => upcoming.filter((x) => (Array.isArray(x[k]) ? x[k].includes(v) : x[k] === v)).length;

  const articles = D.ARTICLES.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  main.innerHTML =
    /* HERO */
    '<section class="hero" aria-labelledby="hero-title">' +
    '<div class="hero-bg">' + App.img('1552423314-cf29ab68ad73', { w: 1600, alt: '', theme: 'jerusalem', eager: true }) + '</div>' +
    '<div class="container hero-inner">' +
    '<h1 id="hero-title">' + esc(t('hero_title')) + '</h1>' +
    '<p class="hero-sub">' + esc(t('hero_sub')) + '</p>' +
    '<form class="search-box" id="search" role="search" aria-label="' + esc(t('search_aria')) + '">' +
    '<div class="field"><label for="s-date">' + esc(t('f_date')) + '</label><input type="date" id="s-date" name="date" min="' + App.todayStr() + '"></div>' +
    '<div class="field"><label for="s-region">' + esc(t('f_region')) + '</label><select id="s-region" name="region">' + opt('', t('any_region')) + regions.map((r) => opt(r, t('region_' + r))).join('') + '</select></div>' +
    '<div class="field"><label for="s-lang">' + esc(t('f_lang')) + '</label><select id="s-lang" name="tlang">' + opt('', t('any_lang')) + langs.map((l) => opt(l, t('lang_' + l))).join('') + '</select></div>' +
    '<div class="field"><label for="s-type">' + esc(t('f_type')) + '</label><select id="s-type" name="type">' + opt('', t('any_type')) + types.map((x) => opt(x, t('type_' + x))).join('') + '</select></div>' +
    '<button class="btn btn-primary btn-search" type="submit">' + esc(t('search_btn')) + '</button>' +
    '</form>' +
    '<ul class="hero-trust">' +
    '<li>' + App.icon('star') + '<span>' + esc(t('trust_inline', { avg: App.fmtRating(s.avg), n: s.count })) + '</span></li>' +
    '<li>' + App.icon('shield') + '<span>' + esc(t('licensed_all_short')) + '</span></li>' +
    '<li>' + App.icon('users') + '<span>' + esc(t('small_groups')) + '</span></li>' +
    '</ul></div></section>' +

    /* UPCOMING */
    '<section class="section" aria-labelledby="up-title"><div class="container">' +
    '<div class="section-head"><div><h2 id="up-title">' + esc(t('upcoming_title')) + '</h2>' +
    '<p class="section-sub">' + esc(t('upcoming_sub', { date: App.fmtDate(App.todayStr(), 'long') })) + '</p></div>' +
    '<a class="link-arrow" href="tours.html">' + esc(t('all_tours')) + ' ' + App.icon('arrow') + '</a></div>' +
    (hiddenPast ? '<p class="demo-note" role="note">' + App.icon('check') + '<span>' + esc(t('hidden_past_note', { n: hiddenPast })) + '</span></p>' : '') +
    '<div class="grid grid-3">' + upcoming.slice(0, 6).map((x) => App.tripCard(x)).join('') + '</div>' +
    '</div></section>' +

    /* CATEGORIES */
    '<section class="section section-alt" aria-labelledby="cat-title"><div class="container">' +
    '<h2 id="cat-title">' + esc(t('categories_title')) + '</h2>' +
    '<h3 class="h-sub">' + esc(t('by_region')) + '</h3>' +
    '<ul class="region-grid">' + regions.map((r) =>
      '<li><a class="region-card" href="tours.html?region=' + r + '">' + App.img(regionImg[r], { w: 480, alt: '', theme: regionTheme[r] }) +
      '<span class="region-label"><strong>' + esc(t('region_' + r)) + '</strong><span>' + esc(t('n_tours', { n: countBy('region', r) })) + '</span></span></a></li>'
    ).join('') + '</ul>' +
    '<h3 class="h-sub">' + esc(t('by_type')) + '</h3>' +
    '<ul class="type-chips">' + types.map((x) =>
      '<li><a class="type-chip" href="tours.html?type=' + x + '"><span>' + esc(t('type_' + x)) + '</span><span class="count">' + countBy('type', x) + '</span></a></li>'
    ).join('') + '<li><a class="type-chip type-chip-accent" href="custom.html"><span>' + esc(t('custom_chip')) + '</span></a></li></ul>' +
    '</div></section>' +

    /* TRUST */
    '<section class="section" aria-labelledby="trust-title"><div class="container">' +
    '<h2 id="trust-title">' + esc(t('trust_title')) + '</h2>' +
    '<div class="trust-stats">' +
    '<div class="stat"><span class="stat-num">' + App.fmtRating(s.avg) + '</span>' + App.stars(s.avg, { lg: true }) + '<span class="stat-label">' + esc(t('avg_rating')) + '</span></div>' +
    '<div class="stat"><span class="stat-num">' + s.count + '</span><span class="stat-label">' + esc(t('verified_reviews')) + '</span></div>' +
    '<div class="stat stat-wide">' + App.icon('shield') + '<span class="stat-label"><strong>' + esc(t('licensed_all')) + '</strong><br>' + esc(t('licensed_all_sub')) + '</span></div>' +
    '</div>' +
    '<ul class="featured-reviews">' + featured.map((r) => {
      const trip = App.tripById(r.trip);
      return '<li class="quote-card"><blockquote lang="' + r.l + '" dir="' + (r.l === 'he' ? 'rtl' : 'ltr') + '"><p>“' + esc(r.t) + '”</p></blockquote>' +
        '<div class="quote-foot">' + App.stars(r.r) + '<span><strong>' + esc(r.n) + '</strong> · <a href="tour.html?id=' + trip.id + '#reviews">' + esc(L(trip.title)) + '</a></span></div></li>';
    }).join('') + '</ul>' +
    '</div></section>' +

    /* GUIDES */
    '<section class="section section-alt" aria-labelledby="guides-title"><div class="container">' +
    '<div class="section-head"><div><h2 id="guides-title">' + esc(t('top_guides')) + '</h2><p class="section-sub">' + esc(t('top_guides_sub')) + '</p></div>' +
    '<a class="link-arrow" href="guides.html">' + esc(t('all_guides')) + ' ' + App.icon('arrow') + '</a></div>' +
    '<div class="grid grid-4">' + topGuides.map(App.guideCard).join('') + '</div>' +
    '</div></section>' +

    /* CUSTOM CTA */
    '<section class="section"><div class="container"><div class="cta-band">' +
    '<div><h2>' + esc(t('cta_custom_title')) + '</h2><p>' + esc(t('cta_custom_sub')) + '</p></div>' +
    '<div class="cta-actions"><a class="btn btn-primary" href="custom.html">' + esc(t('cta_custom_btn')) + '</a>' +
    '<a class="btn btn-wa" href="' + App.waLink(t('wa_custom_msg')) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('whatsapp')) + '</span></a></div>' +
    '</div></div></section>' +

    /* MAGAZINE */
    '<section class="section section-alt" aria-labelledby="mag-title"><div class="container">' +
    '<div class="section-head"><h2 id="mag-title">' + esc(t('from_magazine')) + '</h2><a class="link-arrow" href="magazine.html">' + esc(t('to_magazine')) + ' ' + App.icon('arrow') + '</a></div>' +
    '<div class="grid grid-3">' + articles.map(App.articleCard).join('') + '</div>' +
    '</div></section>' +

    /* SOCIAL */
    '<section class="section" aria-labelledby="social-title"><div class="container social-band">' +
    '<h2 id="social-title">' + esc(t('follow_us')) + '</h2><p>' + esc(t('follow_us_sub')) + '</p>' + App.socialLinks('social-lg') +
    '</div></section>';

  document.getElementById('search').addEventListener('submit', function (e) {
    e.preventDefault();
    const p = new URLSearchParams();
    new FormData(this).forEach((v, k) => { if (v) p.set(k, v); });
    location.href = 'tours.html' + (p.toString() ? '?' + p : '');
  });

});
