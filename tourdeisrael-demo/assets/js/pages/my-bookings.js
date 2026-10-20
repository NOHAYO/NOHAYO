/* ההזמנות שלי + מועדפים */
(function () {
  /** refund by the cancellation policy: 7+ days → 100%, 2–6 days → 50%, under 48 hours → 0 */
  function refundPct(date) {
    const d = App.daysUntil(date);
    return d >= 7 ? 100 : d >= 2 ? 50 : 0;
  }

  function render(main) {
    const { t, L, esc, S } = App;
    App.setTitle(t('nav_bookings'));
    const mine = S.myBookings().slice().sort((a, b) => a.date.localeCompare(b.date));
    const active = mine.filter((b) => b.status === 'confirmed' && b.date >= App.todayStr());
    const other = mine.filter((b) => !active.includes(b)).reverse();
    const favs = S.favs().map(App.tripById).filter(Boolean);

    const card = (b) => {
      const trip = App.tripById(b.trip);
      const m = trip.meeting;
      const isActive = active.includes(b);
      const days = App.daysUntil(b.date);
      const status = b.status === 'cancelled' ? t('st_cancelled') : isActive ? t('st_confirmed') : t('st_done');
      return '<article class="booking-card' + (isActive ? '' : ' is-past') + '" id="' + b.id + '" aria-labelledby="bt-' + b.id + '">' +
        '<div class="booking-card-media">' + App.img(trip.images[0], { w: 480, alt: '', theme: trip.theme }) + '</div>' +
        '<div class="booking-card-body">' +
        '<p class="booking-card-top"><span class="status status-' + b.status + (isActive ? '' : ' status-past') + '">' + esc(status) + '</span>' +
        '<span class="muted small" dir="ltr">' + esc(b.id) + '</span></p>' +
        '<h3 id="bt-' + b.id + '" class="card-title"><a href="tour.html?id=' + trip.id + '">' + esc(L(trip.title)) + '</a></h3>' +
        '<ul class="meta">' +
        '<li>' + App.icon('calendar') + '<span><strong>' + esc(App.fmtDate(b.date, 'long')) + '</strong> · ' + esc(m.time) +
        (isActive ? ' <span class="countdown">' + esc(days === 0 ? t('today') : days === 1 ? t('tomorrow') : t('in_days', { n: days })) + '</span>' : '') + '</span></li>' +
        '<li>' + App.icon('pin') + '<span>' + esc(L(m.place)) + '</span></li>' +
        '<li>' + App.icon('users') + '<span>' + esc(t('participants_val', { a: b.adults, c: b.children })) + ' · <strong>' + esc(App.fmtPrice(b.total)) + '</strong></span></li>' +
        (b.status === 'cancelled' ? '<li>' + App.icon('x') + '<span>' + esc(t('refund_line', { p: b.refund, sum: App.fmtPrice(Math.round(b.total * b.refund / 100)) })) + '</span></li>' : '') +
        '</ul>' +
        (isActive ? '<div class="btn-row">' +
          '<a class="btn btn-waze btn-sm" href="https://waze.com/ul?ll=' + m.lat + '%2C' + m.lng + '&navigate=yes" target="_blank" rel="noopener">' + App.icon('waze') + '<span>Waze</span></a>' +
          '<button type="button" class="btn btn-outline btn-sm" data-ics="' + b.id + '">' + App.icon('calendar') + '<span>' + esc(t('add_calendar')) + '</span></button>' +
          '<a class="btn btn-outline btn-sm" href="' + App.waShare(t('share_booking_msg', { trip: L(trip.title), date: App.fmtDate(b.date, 'long'), time: m.time, place: L(m.place) })) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('share_friends')) + '</span></a>' +
          '<button type="button" class="btn-link danger" data-cancel="' + b.id + '">' + esc(t('cancel_booking')) + '</button></div>'
          : (b.status !== 'cancelled' ? '<p><a class="btn btn-outline btn-sm" href="review.html?trip=' + trip.id + '">' + App.icon('star') + '<span>' + esc(t('rate_this')) + '</span></a></p>' : '')) +
        '</div></article>';
    };

    main.innerHTML =
      '<div class="page-head"><div class="container">' +
      '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_bookings')) + '</li></ol></nav>' +
      '<h1>' + esc(t('nav_bookings')) + '</h1><p class="section-sub">' + esc(t('bookings_sub')) + '</p></div></div>' +
      '<div class="container bookings-page">' +
      '<section aria-labelledby="act-title"><h2 id="act-title">' + esc(t('upcoming_bookings')) + ' <span class="count-pill">' + active.length + '</span></h2>' +
      (active.length ? '<div class="booking-list">' + active.map(card).join('') + '</div>'
        : '<div class="empty"><p><strong>' + esc(t('no_bookings')) + '</strong></p><p>' + esc(t('no_bookings_sub')) + '</p><p><a class="btn btn-primary" href="tours.html">' + esc(t('browse_tours')) + '</a></p></div>') +
      '</section>' +
      (other.length ? '<section class="section-tight" aria-labelledby="past-title"><h2 id="past-title">' + esc(t('past_bookings')) + '</h2><div class="booking-list">' + other.map(card).join('') + '</div></section>' : '') +
      '<section id="favorites" class="section-tight" aria-labelledby="fav-title" tabindex="-1"><h2 id="fav-title">' + App.icon('heart') + ' ' + esc(t('favorites')) + ' <span class="count-pill">' + favs.length + '</span></h2>' +
      (favs.length ? '<div class="grid grid-3">' + favs.map((x) => App.tripCard(x)).join('') + '</div>'
        : '<p class="muted">' + esc(t('no_favs')) + '</p>') + '</section>' +
      '<p class="demo-note" role="note">' + esc(t('bookings_demo')) + '</p>' +
      '</div>' +
      '<dialog id="cancel-dialog" aria-labelledby="cx-title"><div class="dialog-inner" id="cx-inner"></div></dialog>';

    main.querySelectorAll('[data-ics]').forEach((btn) => btn.addEventListener('click', () => {
      const b = mine.find((x) => x.id === btn.dataset.ics);
      App.downloadIcs(App.tripById(b.trip), b);
    }));

    const dlg = document.getElementById('cancel-dialog');
    main.querySelectorAll('[data-cancel]').forEach((btn) => btn.addEventListener('click', () => {
      const b = mine.find((x) => x.id === btn.dataset.cancel);
      const trip = App.tripById(b.trip);
      const pct = refundPct(b.date);
      const inner = document.getElementById('cx-inner');
      inner.innerHTML =
        '<div class="dialog-head"><h2 id="cx-title">' + esc(t('cancel_title')) + '</h2><button type="button" class="icon-btn" data-close aria-label="' + esc(t('close')) + '">' + App.icon('close') + '</button></div>' +
        '<p>' + esc(t('cancel_q', { trip: L(trip.title), date: App.fmtDate(b.date, 'long') })) + '</p>' +
        '<div class="refund-box"><span>' + esc(t('refund_policy_line', { n: App.daysUntil(b.date), p: pct })) + '</span><strong>' + esc(App.fmtPrice(Math.round(b.total * pct / 100))) + '</strong></div>' +
        '<p class="small muted">' + esc(t('cancellation_text')) + '</p>' +
        '<div class="btn-row dlg-actions"><button type="button" class="btn btn-outline" data-close>' + esc(t('keep_booking')) + '</button>' +
        '<button type="button" class="btn btn-danger" id="cx-confirm">' + esc(t('confirm_cancel')) + '</button></div>';
      inner.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', () => dlg.close()));
      document.getElementById('cx-confirm').addEventListener('click', function () {
        App.busy(this, 900).then(() => {
          S.cancelBooking(b.id, pct);
          dlg.close();
          App.toast(t('cancelled_toast', { ref: b.id }));
          render(main);
          App.refreshCounts();
        });
      });
      dlg.showModal();
    }));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

    current = main;

    // highlight a booking linked from the confirmation (#TDI-1234)
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) { target.classList.add('flash'); target.scrollIntoView({ block: 'center' }); }
  }

  // keep the favourites list in sync when a heart is toggled on this page
  let current = null;
  document.addEventListener('tdi:favs', () => { if (current) render(current); });

  App.page(render);
})();
