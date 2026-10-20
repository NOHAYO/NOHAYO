/* עמוד טיול */
(function () {
  const CHILD_DISCOUNT = 0.2;
  const booking = { date: null, adults: 2, children: 0, img: 0 };

  App.page(function (main) {
    const { t, L, esc, D } = App;
    const trip = App.tripById(App.param('id')) || D.TRIPS[0];
    const guide = App.guideById(trip.guide);
    const dates = App.upcomingDates(trip);
    const s = App.tripStats(trip.id);
    const reviews = App.tripReviews(trip.id);
    if (!dates.includes(booking.date)) booking.date = dates[0] || null;
    App.setTitle(L(trip.title));

    const childPrice = Math.round(trip.price * (1 - CHILD_DISCOUNT));
    const total = () => booking.adults * trip.price + booking.children * childPrice;
    const pageUrl = App.absUrl('tour.html?id=' + trip.id);
    const m = trip.meeting;
    const d = 0.012;
    const mapSrc = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (m.lng - d) + '%2C' + (m.lat - d) + '%2C' + (m.lng + d) + '%2C' + (m.lat + d) + '&layer=mapnik&marker=' + m.lat + '%2C' + m.lng;
    const wazeUrl = 'https://waze.com/ul?ll=' + m.lat + '%2C' + m.lng + '&navigate=yes';
    const gmapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + m.lat + '%2C' + m.lng;

    const related = D.TRIPS.filter((x) => x.id !== trip.id && App.isUpcoming(x) && (x.region === trip.region || x.type === trip.type)).slice(0, 3);
    const li = (arr, ic) => arr.map((x) => '<li>' + App.icon(ic) + '<span>' + esc(x) + '</span></li>').join('');

    const stepper = (key, label, sub) =>
      '<div class="stepper-row"><div><span class="stepper-label" id="lbl-' + key + '">' + esc(label) + '</span><span class="muted small">' + esc(sub) + '</span></div>' +
      '<div class="stepper" role="group" aria-labelledby="lbl-' + key + '">' +
      '<button type="button" class="step-btn" data-step="' + key + '" data-d="-1" aria-label="' + esc(t('decrease', { f: label })) + '">−</button>' +
      '<output id="out-' + key + '" aria-live="polite">' + booking[key] + '</output>' +
      '<button type="button" class="step-btn" data-step="' + key + '" data-d="1" aria-label="' + esc(t('increase', { f: label })) + '">+</button></div></div>';

    const bookingBox = dates.length
      ? '<form class="booking" id="booking-form" aria-labelledby="book-title">' +
        '<h2 id="book-title" class="h-sub">' + esc(t('book_title')) + '</h2>' +
        '<p class="booking-price"><span class="muted">' + esc(t('per_adult')) + '</span> <strong>' + esc(App.fmtPrice(trip.price)) + '</strong></p>' +
        '<div class="field"><label for="b-date">' + esc(t('choose_date')) + '</label><select id="b-date" name="date">' +
        dates.map((x) => {
          const left = seatsLeft(trip, x);
          return '<option value="' + x + '"' + (x === booking.date ? ' selected' : '') + '>' + esc(App.fmtDate(x) + ' · ' + m.time + (left <= 8 ? ' · ' + t('seats_left', { n: left }) : '')) + '</option>';
        }).join('') +
        '</select></div>' +
        stepper('adults', t('adults'), App.fmtPrice(trip.price)) +
        stepper('children', t('children'), t('children_sub', { p: App.fmtPrice(childPrice) })) +
        '<div class="booking-total"><span>' + esc(t('total')) + '</span><strong id="b-total" aria-live="polite">' + esc(App.fmtPrice(total())) + '</strong></div>' +
        '<button type="submit" class="btn btn-primary btn-block">' + esc(t('book_btn')) + '</button>' +
        '<p class="small muted center">' + esc(t('book_note')) + '</p>' +
        '<div class="booking-secondary">' +
        '<a class="btn btn-wa btn-block" href="' + App.waShare(L(trip.title) + ' – ' + pageUrl) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('share_wa')) + '</span></a>' +
        '<a class="btn btn-outline btn-block" href="' + App.waLink(t('wa_ask_trip', { trip: L(trip.title) })) + '" target="_blank" rel="noopener">' + esc(t('ask_question')) + '</a>' +
        '</div></form>'
      : '<div class="booking" aria-labelledby="book-title"><h2 id="book-title" class="h-sub">' + esc(t('no_dates_title')) + '</h2><p>' + esc(t('no_dates_sub')) + '</p>' +
        '<a class="btn btn-wa btn-block" href="' + App.waLink(t('wa_notify', { trip: L(trip.title) })) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('notify_me')) + '</span></a></div>';

    main.innerHTML =
      '<div class="container">' +
      '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li><a href="tours.html">' + esc(t('nav_tours')) + '</a></li><li aria-current="page">' + esc(L(trip.title)) + '</li></ol></nav>' +
      (dates.length ? '' : '<p class="demo-note demo-note-warn" role="note">' + esc(t('past_trip_note')) + '</p>') +
      '<header class="trip-head">' + App.tagList(trip) +
      '<h1>' + esc(L(trip.title)) + '</h1>' +
      '<p class="trip-head-meta">' + App.ratingLine(s) + (s.count ? ' <a href="#reviews">' + esc(t('read_reviews')) + '</a>' : '') + '</p></header>' +

      /* gallery */
      '<section class="gallery" aria-label="' + esc(t('gallery')) + '">' +
      '<div class="gallery-main" id="gallery-main">' + App.img(trip.images[booking.img] || trip.images[0], { w: 1400, alt: t('gallery_alt', { trip: L(trip.title), n: 1 }), theme: trip.theme, eager: true }) + '</div>' +
      '<ul class="gallery-thumbs">' + trip.images.map((id, i) =>
        '<li><button type="button" class="thumb" data-img="' + i + '" aria-label="' + esc(t('show_image', { n: i + 1, total: trip.images.length })) + '"' + (i === booking.img ? ' aria-current="true"' : '') + '>' +
        App.img(id, { w: 240, alt: '', theme: trip.theme }) + '</button></li>').join('') + '</ul></section>' +

      '<div class="trip-layout"><div class="trip-content">' +
      '<section aria-labelledby="about-title"><h2 id="about-title">' + esc(t('about_trip')) + '</h2>' +
      L(trip.desc).map((x) => '<p>' + esc(x) + '</p>').join('') +
      '<h3 class="h-sub">' + esc(t('highlights')) + '</h3><ul class="check-icons">' + li(L(trip.highlights), 'check') + '</ul></section>' +

      /* important details */
      '<section class="details-box" aria-labelledby="details-title"><h2 id="details-title">' + esc(t('important_details')) + '</h2><dl class="details">' +
      '<div><dt>' + App.icon('pin') + esc(t('meeting_point')) + '</dt><dd>' + esc(L(m.place)) + '<br><strong>' + esc(t('at_time', { time: m.time })) + '</strong></dd></div>' +
      '<div><dt>' + App.icon('clock') + esc(t('duration')) + '</dt><dd>' + esc(App.durationText(trip)) + '</dd></div>' +
      '<div><dt>' + App.icon('mountain') + esc(t('difficulty')) + '</dt><dd>' + esc(t('diff_' + trip.difficulty)) + '</dd></div>' +
      '<div><dt>' + App.icon('lang') + esc(t('guide_lang')) + '</dt><dd>' + esc(trip.langs.map((l) => t('lang_' + l)).join(', ')) + '</dd></div>' +
      '<div><dt>' + App.icon('users') + esc(t('group_size')) + '</dt><dd>' + esc(t('up_to', { n: trip.maxGroup })) + '</dd></div>' +
      '<div class="span-2"><dt>' + App.icon('check') + esc(t('included')) + '</dt><dd><ul class="plain-list">' + L(trip.included).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></dd></div>' +
      '<div class="span-2"><dt>' + App.icon('x') + esc(t('not_included')) + '</dt><dd><ul class="plain-list">' + L(trip.notIncluded).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></dd></div>' +
      '<div class="span-2"><dt>' + App.icon('shield') + esc(t('cancellation')) + '</dt><dd>' + esc(t('cancellation_text')) + '</dd></div>' +
      '</dl></section>' +

      /* map */
      '<section aria-labelledby="map-title"><h2 id="map-title">' + esc(t('meeting_map')) + '</h2>' +
      '<div class="map-wrap"><iframe title="' + esc(t('map_iframe_title', { place: L(m.place) })) + '" src="' + mapSrc + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>' +
      '<div class="btn-row"><a class="btn btn-waze" href="' + wazeUrl + '" target="_blank" rel="noopener">' + App.icon('waze') + '<span>' + esc(t('nav_waze')) + '</span></a>' +
      '<a class="btn btn-outline" href="' + gmapsUrl + '" target="_blank" rel="noopener">' + App.icon('pin') + '<span>' + esc(t('open_gmaps')) + '</span></a></div></section>' +

      /* guide */
      '<section aria-labelledby="guide-title"><h2 id="guide-title">' + esc(t('your_guide')) + '</h2>' +
      '<div class="guide-inline">' + App.avatar(guide, 'lg') + '<div><h3 class="card-title"><a href="guide.html?id=' + guide.id + '">' + esc(L(guide.name)) + '</a></h3>' +
      '<p class="licensed">' + App.icon('shield') + '<span>' + esc(t('license_no', { n: guide.license })) + '</span></p>' +
      '<p class="muted small">' + esc(t('years_exp', { n: guide.years })) + ' · ' + esc(guide.langs.map((l) => t('lang_' + l)).join(' · ')) + ' · ' + esc(t('responds', { r: App.responseText(guide.responseMins) })) + '</p>' +
      App.ratingLine(App.guideStats(guide.id)) + '</div></div></section>' +

      /* reviews */
      '<section id="reviews" aria-labelledby="reviews-title" tabindex="-1"><h2 id="reviews-title">' + esc(t('reviews_title')) + '</h2>' +
      App.reviewSummary(s) + '<ul class="review-list">' + reviews.map((r) => App.reviewItem(r)).join('') + '</ul>' +
      '<p><a class="btn btn-outline" href="review.html?trip=' + trip.id + '">' + esc(t('write_review')) + '</a></p></section>' +
      '</div>' +

      '<aside class="trip-aside" id="book" aria-label="' + esc(t('book_title')) + '">' + bookingBox + '</aside></div>' +

      (related.length ? '<section class="section-tight" aria-labelledby="rel-title"><h2 id="rel-title">' + esc(t('related')) + '</h2><div class="grid grid-3">' + related.map((x) => App.tripCard(x)).join('') + '</div></section>' : '') +
      '</div>' +

      (dates.length ? '<div class="mobile-book-bar"><span><span class="muted small">' + esc(t('from')) + '</span> <strong>' + esc(App.fmtPrice(trip.price)) + '</strong><span class="small muted"> · ' + esc(App.fmtDate(dates[0], 'short')) + '</span></span><a class="btn btn-primary" href="#book">' + esc(t('book_btn')) + '</a></div>' : '') +

      /* dialog */
      '<dialog id="book-dialog" aria-labelledby="dlg-title"><div class="dialog-inner" id="dialog-inner"></div></dialog>';

    /* gallery events */
    main.querySelector('.gallery-thumbs').addEventListener('click', function (e) {
      const b = e.target.closest('[data-img]');
      if (!b) return;
      booking.img = Number(b.dataset.img);
      document.getElementById('gallery-main').innerHTML = App.img(trip.images[booking.img], { w: 1400, alt: t('gallery_alt', { trip: L(trip.title), n: booking.img + 1 }), theme: trip.theme, eager: true });
      this.querySelectorAll('[data-img]').forEach((x) => x.removeAttribute('aria-current'));
      b.setAttribute('aria-current', 'true');
    });

    if (!dates.length) return;

    /* booking events */
    const form = document.getElementById('booking-form');
    function refresh() {
      document.getElementById('out-adults').textContent = booking.adults;
      document.getElementById('out-children').textContent = booking.children;
      document.getElementById('b-total').textContent = App.fmtPrice(total());
    }
    form.addEventListener('click', function (e) {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const k = b.dataset.step;
      const min = k === 'adults' ? 1 : 0;
      booking[k] = Math.max(min, Math.min(20, booking[k] + Number(b.dataset.d)));
      refresh();
    });
    form.date.addEventListener('change', function () { booking.date = this.value; });
    form.addEventListener('submit', function (e) { e.preventDefault(); openDialog(); });

    const dlg = document.getElementById('book-dialog');
    function openDialog() {
      const inner = document.getElementById('dialog-inner');
      const row = (k, v) => '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>';
      inner.innerHTML =
        '<div class="dialog-head"><h2 id="dlg-title">' + esc(t('summary_title')) + '</h2>' +
        '<button type="button" class="icon-btn" id="dlg-close" aria-label="' + esc(t('close')) + '">' + App.icon('close') + '</button></div>' +
        '<p class="demo-note" role="note">' + esc(t('summary_demo')) + '</p>' +
        '<dl class="summary">' +
        row(t('trip'), esc(L(trip.title))) +
        row(t('date'), esc(App.fmtDate(booking.date, 'long')) + ', ' + esc(m.time)) +
        row(t('meeting_point'), esc(L(m.place))) +
        row(t('participants'), esc(t('participants_val', { a: booking.adults, c: booking.children }))) +
        row(t('guide'), esc(L(guide.name))) +
        row(t('total'), '<strong>' + esc(App.fmtPrice(total())) + '</strong>') +
        '</dl>' +
        '<form id="dlg-form" novalidate>' +
        '<div class="form-grid">' +
        '<div class="field"><label for="c-name">' + esc(t('full_name')) + ' <span aria-hidden="true">*</span></label><input id="c-name" name="name" required autocomplete="name"></div>' +
        '<div class="field"><label for="c-phone">' + esc(t('phone')) + ' <span aria-hidden="true">*</span></label><input id="c-phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel" pattern="[0-9+\\-\\s]{9,15}" dir="ltr"></div>' +
        '<div class="field span-2"><label for="c-email">' + esc(t('email')) + '</label><input id="c-email" name="email" type="email" autocomplete="email" dir="ltr"></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" type="submit">' + esc(t('confirm_demo')) + '</button></form>';
      dlg.showModal();
      document.getElementById('dlg-close').addEventListener('click', () => dlg.close());
      document.getElementById('dlg-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!App.validate(this)) return;
        const ref = 'DEMO-' + Math.floor(1000 + Math.random() * 9000);
        const name = new FormData(this).get('name');
        inner.innerHTML =
          '<div class="dialog-head"><h2 id="dlg-title" tabindex="-1">' + esc(t('booked_title')) + '</h2>' +
          '<button type="button" class="icon-btn" id="dlg-close" aria-label="' + esc(t('close')) + '">' + App.icon('close') + '</button></div>' +
          '<div class="success-icon" aria-hidden="true">' + App.icon('check') + '</div>' +
          '<p>' + esc(t('booked_text', { name: name, ref: ref })) + '</p>' +
          '<ul class="check-icons">' + li([t('booked_step1'), t('booked_step2'), t('booked_step3')], 'check') + '</ul>' +
          '<p class="demo-note" role="note">' + esc(t('booked_demo')) + '</p>' +
          '<button type="button" class="btn btn-primary btn-block" id="dlg-ok">' + esc(t('close')) + '</button>';
        document.getElementById('dlg-title').focus();
        document.getElementById('dlg-close').addEventListener('click', () => dlg.close());
        document.getElementById('dlg-ok').addEventListener('click', () => dlg.close());
      });
    }
    // close on backdrop click
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });

  /** demo-only: deterministic "seats left" per date */
  function seatsLeft(trip, date) {
    const n = date.split('-').reduce((a, b) => a + Number(b), 0) + trip.id.length;
    return 3 + (n % 15);
  }
})();
