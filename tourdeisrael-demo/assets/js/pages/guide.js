/* פרופיל מורה דרך */
App.page(function (main) {
  const { t, L, esc, D } = App;
  const g = App.guideById(App.param('id')) || D.GUIDES[0];
  const s = App.guideStats(g.id);
  const trips = App.guideTrips(g.id).filter(App.isUpcoming);
  const reviews = App.guideReviews(g.id);
  App.setTitle(L(g.name));

  const fact = (ic, label, value) => '<div class="fact">' + App.icon(ic) + '<div><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div></div>';

  main.innerHTML =
    '<div class="container">' +
    '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li><a href="guides.html">' + esc(t('nav_guides')) + '</a></li><li aria-current="page">' + esc(L(g.name)) + '</li></ol></nav>' +
    '<header class="profile-head">' + App.avatar(g, 'xl') +
    '<div class="profile-main"><h1>' + esc(L(g.name)) + '</h1>' +
    '<p class="license-badge">' + App.icon('shield') + '<span>' + esc(t('license_no', { n: g.license })) + '</span></p>' +
    '<p>' + App.ratingLine(s) + '</p>' +
    '<ul class="tags">' + g.specialties.map((x) => '<li>' + App.chip(t('spec_' + x)) + '</li>').join('') + '</ul>' +
    '<div class="btn-row"><a class="btn btn-wa" href="' + App.waLink(t('wa_guide_msg', { guide: L(g.name) })) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('contact_guide')) + '</span></a>' +
    '<a class="btn btn-outline" href="custom.html?guide=' + g.id + '">' + esc(t('private_with', { guide: L(g.name) })) + '</a></div>' +
    '</div></header>' +
    '<dl class="facts">' +
    fact('lang', t('languages'), esc(g.langs.map((l) => t('lang_' + l)).join(', '))) +
    fact('calendar', t('experience'), esc(t('years_exp', { n: g.years }))) +
    fact('clock', t('avg_response'), esc(App.responseText(g.responseMins))) +
    fact('star', t('rating'), s.count ? esc(App.fmtRating(s.avg) + ' / 5 · ' + t('n_reviews', { n: s.count })) : esc(t('no_reviews_yet'))) +
    '</dl>' +
    '<section aria-labelledby="bio-title" class="section-tight"><h2 id="bio-title">' + esc(t('about_guide', { guide: L(g.name) })) + '</h2><p class="lead">' + esc(L(g.bio)) + '</p></section>' +
    '<section aria-labelledby="gt-title" class="section-tight"><h2 id="gt-title">' + esc(t('guide_tours', { guide: L(g.name) })) + '</h2>' +
    (trips.length ? '<div class="grid grid-3">' + trips.map((x) => App.tripCard(x)).join('') + '</div>' : '<p class="muted">' + esc(t('no_upcoming_guide')) + '</p>') + '</section>' +
    '<section aria-labelledby="gr-title" class="section-tight"><h2 id="gr-title">' + esc(t('reviews_title')) + '</h2>' +
    App.reviewSummary(s) + '<ul class="review-list">' + reviews.slice(0, 10).map((r) => App.reviewItem(r, { showTrip: true })).join('') + '</ul></section>' +
    '</div>';
});
