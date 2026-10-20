/* מה השתפר – השוואת לפני / אחרי */
App.page(function (main) {
  const { t, esc } = App;
  App.setTitle(t('impr_title'));
  const items = App.tr('improvements');

  main.innerHTML =
    '<div class="page-head page-head-accent"><div class="container">' +
    '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_improvements')) + '</li></ol></nav>' +
    '<h1>' + esc(t('impr_title')) + '</h1><p class="section-sub">' + esc(t('impr_sub')) + '</p>' +
    '<nav aria-label="' + esc(t('impr_toc')) + '"><ol class="toc">' + items.map((x, i) => '<li><a href="#imp-' + i + '">' + esc(x.title) + '</a></li>').join('') + '</ol></nav>' +
    '</div></div>' +
    '<div class="container"><ol class="impr-list">' +
    items.map((x, i) =>
      '<li class="impr" id="imp-' + i + '"><article aria-labelledby="imp-t-' + i + '">' +
      '<h2 id="imp-t-' + i + '"><span class="impr-num" aria-hidden="true">' + (i + 1) + '</span>' + esc(x.title) + '</h2>' +
      '<div class="compare">' +
      '<div class="before"><h3>' + App.icon('x') + esc(t('before')) + '</h3><p>' + esc(x.before) + '</p></div>' +
      '<div class="after"><h3>' + App.icon('check') + esc(t('after')) + '</h3><p>' + esc(x.after) + '</p></div>' +
      '</div>' +
      '<p class="gain"><strong>' + esc(t('what_it_gives')) + '</strong> ' + esc(x.gain) + '</p>' +
      '<a class="btn btn-outline" href="' + x.link + '">' + esc(x.linkText) + ' ' + App.icon('arrow') + '</a>' +
      '</article></li>').join('') +
    '</ol>' +
    '<div class="cta-band"><div><h2>' + esc(t('impr_next_title')) + '</h2><p>' + esc(t('impr_next_sub')) + '</p></div>' +
    '<div class="cta-actions"><a class="btn btn-primary" href="index.html">' + esc(t('impr_start')) + '</a></div></div>' +
    '</div>';
});
