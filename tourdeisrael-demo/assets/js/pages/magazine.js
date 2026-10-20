/* מגזין – רשימת כתבות */
App.page(function (main) {
  const { t, L, esc, D } = App;
  App.setTitle(t('magazine_title'));
  const list = D.ARTICLES.slice().sort((a, b) => b.date.localeCompare(a.date));
  const [lead, ...rest] = list;
  const author = App.guideById(lead.author);

  main.innerHTML =
    '<div class="page-head"><div class="container">' +
    '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_magazine')) + '</li></ol></nav>' +
    '<h1>' + esc(t('magazine_title')) + '</h1><p class="section-sub">' + esc(t('magazine_sub')) + '</p></div></div>' +
    '<div class="container">' +
    '<article class="card article-lead"><div class="card-media">' + App.img(lead.image, { w: 1200, alt: '', theme: lead.theme, eager: true }) + '</div>' +
    '<div class="card-body"><p class="eyebrow">' + esc(L(lead.category)) + ' · <time datetime="' + lead.date + '">' + esc(App.fmtDate(lead.date, 'long')) + '</time></p>' +
    '<h2 class="card-title"><a class="stretched" href="article.html?id=' + lead.id + '">' + esc(L(lead.title)) + '</a></h2>' +
    '<p class="card-text">' + esc(L(lead.excerpt)) + '</p><p class="muted small">' + esc(t('by_author', { a: L(author.name) })) + '</p></div></article>' +
    '<div class="grid grid-3 section-tight">' + rest.map(App.articleCard).join('') + '</div>' +
    '</div>';
});
