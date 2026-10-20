/* סימולציית בקשת חוות דעת – וואטסאפ ומייל יום אחרי הסיור */
(function () {
  const state = { trip: App.param('trip') || 'carmel-market', name: '' };

  function render(main) {
    const { t, L, esc, D } = App;
    App.setTitle(t('review_title'));
    const trip = App.tripById(state.trip) || D.TRIPS[0];
    const guide = App.guideById(trip.guide);
    const customer = state.name || t('sample_customer');
    const vars = { name: customer, trip: L(trip.title), guide: L(guide.name) };
    const tourDay = App.D.day(-1);

    main.innerHTML =
      '<div class="page-head"><div class="container">' +
      '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_review')) + '</li></ol></nav>' +
      '<h1>' + esc(t('review_title')) + '</h1><p class="section-sub">' + esc(t('review_sub')) + '</p></div></div>' +
      '<div class="container">' +
      '<form class="inline-filters" id="sim-form" aria-label="' + esc(t('sim_settings')) + '">' +
      '<div class="field"><label for="sim-trip">' + esc(t('trip')) + '</label><select id="sim-trip" name="trip">' +
      D.TRIPS.map((x) => '<option value="' + x.id + '"' + (x.id === trip.id ? ' selected' : '') + '>' + esc(L(x.title)) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="sim-name">' + esc(t('customer_name')) + '</label><input id="sim-name" name="name" value="' + esc(state.name) + '" placeholder="' + esc(t('sample_customer')) + '"></div>' +
      '</form>' +
      '<ol class="timeline" aria-label="' + esc(t('timeline_aria')) + '">' +
      '<li><strong>' + esc(t('tl1')) + '</strong><span>' + esc(App.fmtDate(tourDay, 'long')) + '</span></li>' +
      '<li class="active"><strong>' + esc(t('tl2')) + '</strong><span>' + esc(t('tl2_sub')) + '</span></li>' +
      '<li><strong>' + esc(t('tl3')) + '</strong><span>' + esc(t('tl3_sub')) + '</span></li>' +
      '<li><strong>' + esc(t('tl4')) + '</strong><span>' + esc(t('tl4_sub')) + '</span></li></ol>' +
      '<div class="sim-grid">' +
      /* WhatsApp mock */
      '<section class="phone-mock" aria-labelledby="wa-mock-title"><h2 id="wa-mock-title" class="h-sub">' + App.icon('whatsapp') + ' ' + esc(t('wa_preview')) + '</h2>' +
      '<div class="phone"><div class="phone-bar"><span class="phone-avatar" aria-hidden="true">TI</span><span><strong>Tour de Israel</strong><span class="small">' + esc(t('business_account')) + '</span></span></div>' +
      '<div class="chat"><div class="bubble"><p>' + esc(t('wa_msg_1', vars)) + '</p><p>' + esc(t('wa_msg_2', vars)) + '</p>' +
      '<p><a href="#rate">' + esc(t('wa_msg_link')) + '</a></p><span class="bubble-time" dir="ltr">10:00 ✓✓</span></div>' +
      '<div class="quick-replies" aria-hidden="true"><span>⭐⭐⭐⭐⭐</span><span>' + esc(t('later')) + '</span></div></div></div></section>' +
      /* Email mock */
      '<section class="email-mock" aria-labelledby="mail-mock-title"><h2 id="mail-mock-title" class="h-sub">' + App.icon('mail') + ' ' + esc(t('email_preview')) + '</h2>' +
      '<div class="email"><dl class="email-head">' +
      '<div><dt>' + esc(t('mail_from')) + '</dt><dd dir="ltr">Tour de Israel &lt;' + esc(D.SITE.email) + '&gt;</dd></div>' +
      '<div><dt>' + esc(t('mail_subject')) + '</dt><dd><strong>' + esc(t('mail_subject_val', vars)) + '</strong></dd></div></dl>' +
      '<div class="email-body"><p>' + esc(t('mail_hello', vars)) + '</p><p>' + esc(t('mail_p1', vars)) + '</p>' +
      '<p class="email-stars" aria-hidden="true">' + [1, 2, 3, 4, 5].map((n) => '<a href="#rate" data-preset="' + n + '">★</a>').join('') + '</p>' +
      '<p class="center"><a class="btn btn-primary" href="#rate">' + esc(t('mail_cta')) + '</a></p>' +
      '<p>' + esc(t('mail_p2', vars)) + '</p><p class="muted small">' + esc(t('mail_sig')) + '</p></div></div></section>' +
      '</div>' +

      /* rating form */
      '<section id="rate" class="form-card rate-card" aria-labelledby="rate-title" tabindex="-1">' +
      '<h2 id="rate-title">' + esc(t('rate_title', vars)) + '</h2><p class="muted">' + esc(t('rate_sub')) + '</p>' +
      '<form id="rate-form" novalidate>' +
      '<fieldset class="star-input"><legend>' + esc(t('your_rating')) + ' <span aria-hidden="true">*</span></legend><div class="star-row">' +
      [5, 4, 3, 2, 1].map((n) => '<input type="radio" id="st-' + n + '" name="stars" value="' + n + '"' + (n === 5 ? ' required' : '') + '><label for="st-' + n + '" title="' + esc(t('n_stars', { n: n })) + '"><span aria-hidden="true">★</span><span class="sr-only">' + esc(t('n_stars', { n: n })) + '</span></label>').join('') +
      '</div><p class="star-hint" id="star-hint" aria-live="polite"></p></fieldset>' +
      '<div class="field"><label for="rv-text">' + esc(t('review_text')) + '</label><textarea id="rv-text" name="text" rows="4" placeholder="' + esc(t('review_text_ph')) + '"></textarea></div>' +
      '<div class="field check-inline"><input type="checkbox" id="rv-pub" name="publish" checked><label for="rv-pub">' + esc(t('allow_publish')) + '</label></div>' +
      '<button class="btn btn-primary btn-lg" type="submit">' + esc(t('send_review')) + '</button></form></section>' +
      '</div>';

    // re-render previews when settings change
    const rerender = () => { const y = window.scrollY; render(main); window.scrollTo(0, y); };
    document.getElementById('sim-trip').addEventListener('change', function () { state.trip = this.value; rerender(); document.getElementById('sim-trip').focus(); });
    document.getElementById('sim-name').addEventListener('change', function () { state.name = this.value.trim(); rerender(); document.getElementById('sim-name').focus(); });

    main.querySelectorAll('[data-preset]').forEach((a) => a.addEventListener('click', function () {
      const r = document.getElementById('st-' + this.dataset.preset);
      r.checked = true; hint(Number(this.dataset.preset));
    }));

    const hint = (n) => { document.getElementById('star-hint').textContent = t('star_hint_' + n); };
    document.querySelectorAll('input[name="stars"]').forEach((r) => r.addEventListener('change', () => hint(Number(r.value))));

    document.getElementById('rate-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      const n = Number(fd.get('stars'));
      if (!n) {
        document.getElementById('star-hint').textContent = t('err_choose_stars');
        document.getElementById('st-5').focus();
        return;
      }
      const card = document.getElementById('rate');
      const good = n >= 4;
      card.innerHTML = '<div class="success-icon" aria-hidden="true">' + App.icon('check') + '</div>' +
        '<h2 tabindex="-1" id="rate-done">' + esc(t('thanks_review', vars)) + '</h2>' +
        '<p>' + App.stars(n, { lg: true }) + '</p>' +
        '<p>' + esc(good ? t('after_good') : t('after_bad', vars)) + '</p>' +
        (good ? '<p class="btn-row"><a class="btn btn-outline" href="https://www.google.com/maps" target="_blank" rel="noopener">' + esc(t('share_google')) + '</a>' +
          '<a class="btn btn-wa" href="' + App.waShare(t('share_friends_msg', vars) + ' ' + App.absUrl('tour.html?id=' + trip.id)) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('share_friends')) + '</span></a></p>' : '') +
        '<p class="demo-note" role="note">' + esc(t('review_demo_note')) + '</p>';
      document.getElementById('rate-done').focus();
    });
  }

  App.page(render);
})();
