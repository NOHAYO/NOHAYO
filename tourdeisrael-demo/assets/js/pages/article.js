/* כתבה בודדת */
App.page(function (main) {
  const { t, L, esc, D } = App;
  const a = D.ARTICLES.find((x) => x.id === App.param('id')) || D.ARTICLES[0];
  const author = App.guideById(a.author);
  const trip = App.tripById(a.trip);
  const others = D.ARTICLES.filter((x) => x.id !== a.id).slice(0, 3);
  App.setTitle(L(a.title));
  const url = App.absUrl('article.html?id=' + a.id);

  main.innerHTML =
    '<div class="container narrow">' +
    '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li><a href="magazine.html">' + esc(t('nav_magazine')) + '</a></li><li aria-current="page">' + esc(L(a.title)) + '</li></ol></nav>' +
    '<article class="article">' +
    '<header><p class="eyebrow">' + esc(L(a.category)) + '</p><h1>' + esc(L(a.title)) + '</h1>' +
    '<div class="article-meta">' + App.avatar(author) + '<span><a href="guide.html?id=' + author.id + '">' + esc(L(author.name)) + '</a><br><time class="muted small" datetime="' + a.date + '">' + esc(App.fmtDate(a.date, 'long')) + '</time></span></div></header>' +
    '<figure class="article-figure">' + App.img(a.image, { w: 1400, alt: L(a.title), theme: a.theme, eager: true }) + '</figure>' +
    '<p class="lead">' + esc(L(a.excerpt)) + '</p>' +
    L(a.body).map((p) => '<p>' + esc(p) + '</p>').join('') +
    '<div class="btn-row"><a class="btn btn-wa" href="' + App.waShare(L(a.title) + ' – ' + url) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('share_wa')) + '</span></a></div>' +
    '</article>' +
    (trip ? '<aside class="section-tight" aria-labelledby="art-trip"><h2 id="art-trip" class="h-sub">' + esc(t('related_tour')) + '</h2><div class="grid grid-2">' + App.tripCard(trip) + '</div></aside>' : '') +
    '</div>' +
    '<div class="container section-tight"><h2>' + esc(t('more_articles')) + '</h2><div class="grid grid-3">' + others.map(App.articleCard).join('') + '</div></div>';
});
