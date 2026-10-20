/* עמוד טיול */
(function () {
  const CHILD_DISCOUNT = 0.2;
  const booking = { date: null, adults: 2, children: 0, img: 0 };

  function render(main) {
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
          const left = App.S.seatsLeft(trip, x);
          return '<option value="' + x + '"' + (x === booking.date ? ' selected' : '') + (left ? '' : ' disabled') + '>' +
            esc(App.fmtDate(x) + ' · ' + m.time + (!left ? ' · ' + t('sold_out') : left <= 8 ? ' · ' + t('seats_left', { n: left }) : '')) + '</option>';
        }).join('') +
        '</select><p class="seats-note" id="seats-note" aria-live="polite"></p></div>' +
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
      '<div class="trip-title-row"><h1>' + esc(L(trip.title)) + '</h1>' + App.favBtn(trip, 'fav-btn-text') + '</div>' +
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
      '<div class="map-wrap">' + (navigator.onLine
        ? '<iframe title="' + esc(t('map_iframe_title', { place: L(m.place) })) + '" src="' + mapSrc + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
        : '<div class="map-offline">' + App.icon('pin') + '<strong>' + esc(L(m.place)) + '</strong><span>' + esc(t('map_offline')) + '</span></div>') + '</div>' +
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
    // a date can't be fully booked when we arrive: pick the first one with room
    if (!App.S.seatsLeft(trip, booking.date)) booking.date = dates.find((x) => App.S.seatsLeft(trip, x)) || booking.date;
    form.date.value = booking.date;
    const left = () => App.S.seatsLeft(trip, booking.date);
    function refresh() {
      const max = left();
      if (booking.adults + booking.children > max) { booking.children = Math.max(0, max - booking.adults); booking.adults = Math.max(1, Math.min(booking.adults, max)); }
      document.getElementById('out-adults').textContent = booking.adults;
      document.getElementById('out-children').textContent = booking.children;
      document.getElementById('b-total').textContent = App.fmtPrice(total());
      document.getElementById('seats-note').textContent = max <= 8 ? t('seats_left_note', { n: max }) : '';
      form.querySelectorAll('[data-d="1"]').forEach((b) => { b.disabled = booking.adults + booking.children >= max; });
    }
    form.addEventListener('click', function (e) {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const k = b.dataset.step;
      const min = k === 'adults' ? 1 : 0;
      const next = Math.max(min, booking[k] + Number(b.dataset.d));
      if (Number(b.dataset.d) > 0 && booking.adults + booking.children >= left()) return;
      booking[k] = next;
      refresh();
    });
    form.date.addEventListener('change', function () { booking.date = this.value; refresh(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); openDialog(); });
    refresh();

    const dlg = document.getElementById('book-dialog');
    const inner = document.getElementById('dialog-inner');
    const contact = { name: '', phone: '', email: '' };
    const row = (k, v) => '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>';
    const head = (title, step) =>
      '<div class="dialog-head"><h2 id="dlg-title" tabindex="-1">' + esc(title) + '</h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="' + esc(t('close')) + '">' + App.icon('close') + '</button></div>' +
      (step ? '<ol class="dlg-steps" aria-label="' + esc(t('steps_aria')) + '">' + [t('step_details'), t('step_payment'), t('step_done')].map((x, i) =>
        '<li' + (i + 1 === step ? ' aria-current="step"' : '') + (i + 1 < step ? ' class="done"' : '') + '><span>' + (i + 1) + '</span>' + esc(x) + '</li>').join('') + '</ol>' : '');
    inner.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) dlg.close(); });

    function openDialog() {
      stepDetails();
      dlg.showModal();
      document.getElementById('dlg-title').focus();
    }

    /* step 1: summary + contact details */
    function stepDetails() {
      inner.innerHTML = head(t('summary_title'), 1) +
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
        '<div class="field"><label for="c-name">' + esc(t('full_name')) + ' <span aria-hidden="true">*</span></label><input id="c-name" name="name" required autocomplete="name" value="' + esc(contact.name) + '"></div>' +
        '<div class="field"><label for="c-phone">' + esc(t('phone')) + ' <span aria-hidden="true">*</span></label><input id="c-phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel" pattern="[0-9+\\-\\s]{9,15}" dir="ltr" value="' + esc(contact.phone) + '"></div>' +
        '<div class="field span-2"><label for="c-email">' + esc(t('email')) + '</label><input id="c-email" name="email" type="email" autocomplete="email" dir="ltr" value="' + esc(contact.email) + '"></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" type="submit">' + esc(t('to_payment')) + '</button></form>';
      document.getElementById('dlg-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!App.validate(this)) return;
        const fd = new FormData(this);
        contact.name = fd.get('name').trim(); contact.phone = fd.get('phone').trim(); contact.email = fd.get('email').trim();
        stepPayment();
      });
    }

    /* step 2: simulated payment – a fixed test card, nothing real can be typed */
    function stepPayment() {
      inner.innerHTML = head(t('payment_title'), 2) +
        '<p class="demo-note" role="note">' + App.icon('lock') + '<span>' + esc(t('payment_demo')) + '</span></p>' +
        '<form id="pay-form">' +
        '<fieldset class="field"><legend>' + esc(t('pay_method')) + '</legend><div class="radio-cards pay-methods">' +
        '<label class="radio-card"><input type="radio" name="pay" value="card" checked>' + App.icon('card') + '<span>' + esc(t('pay_card')) + '</span></label>' +
        '<label class="radio-card"><input type="radio" name="pay" value="bit"><span class="bit-logo" aria-hidden="true">bit</span><span>' + esc(t('pay_bit')) + '</span></label>' +
        '</div></fieldset>' +
        '<div id="pay-card"><div class="test-card" aria-hidden="true"><span class="chip-gold"></span><span dir="ltr">4580 0000 0000 0000</span><span class="test-card-foot" dir="ltr"><span>' + esc(contact.name.toUpperCase()) + '</span><span>12/29</span></span></div>' +
        '<div class="form-grid">' +
        '<div class="field span-2"><label for="p-num">' + esc(t('card_number')) + '</label><input id="p-num" value="4580 0000 0000 0000" readonly dir="ltr" aria-describedby="p-note"></div>' +
        '<div class="field"><label for="p-exp">' + esc(t('card_exp')) + '</label><input id="p-exp" value="12/29" readonly dir="ltr"></div>' +
        '<div class="field"><label for="p-cvv">CVV</label><input id="p-cvv" value="•••" readonly dir="ltr"></div>' +
        '</div><p class="small muted" id="p-note">' + esc(t('card_readonly')) + '</p></div>' +
        '<div id="pay-bit" hidden><p>' + esc(t('bit_text', { phone: contact.phone })) + '</p></div>' +
        '<div class="booking-total"><span>' + esc(t('total')) + '</span><strong>' + esc(App.fmtPrice(total())) + '</strong></div>' +
        '<div class="btn-row dlg-actions"><button type="button" class="btn btn-outline" id="pay-back">' + esc(t('back')) + '</button>' +
        '<button class="btn btn-primary" type="submit" id="pay-btn">' + App.icon('lock') + '<span>' + esc(t('pay_now', { sum: App.fmtPrice(total()) })) + '</span></button></div>' +
        '</form>';
      document.getElementById('dlg-title').focus();
      const pf = document.getElementById('pay-form');
      pf.addEventListener('change', () => {
        const bit = pf.querySelector('input[name="pay"]:checked').value === 'bit';
        document.getElementById('pay-card').hidden = bit;
        document.getElementById('pay-bit').hidden = !bit;
      });
      document.getElementById('pay-back').addEventListener('click', stepDetails);
      pf.addEventListener('submit', function (e) {
        e.preventDefault();
        const pay = pf.querySelector('input[name="pay"]:checked').value;
        App.busy(document.getElementById('pay-btn'), 1400).then(() => {
          const rec = App.S.addBooking({ trip: trip.id, date: booking.date, adults: booking.adults, children: booking.children, total: total(), name: contact.name, phone: contact.phone, email: contact.email, pay });
          App.refreshCounts();
          stepDone(rec);
        });
      });
    }

    /* step 3: confirmation */
    function stepDone(rec) {
      inner.innerHTML = head(t('booked_title'), 3) +
        '<div class="success-icon" aria-hidden="true">' + App.icon('check') + '</div>' +
        '<p>' + esc(t('booked_text', { name: rec.name, ref: rec.id })) + '</p>' +
        '<ul class="check-icons">' + li([t('booked_step1'), t('booked_step2'), t('booked_step3')], 'check') + '</ul>' +
        '<div class="btn-row"><a class="btn btn-primary" href="my-bookings.html#' + rec.id + '">' + App.icon('ticket') + '<span>' + esc(t('to_my_bookings')) + '</span></a>' +
        '<button type="button" class="btn btn-outline" id="ics-btn">' + App.icon('calendar') + '<span>' + esc(t('add_calendar')) + '</span></button></div>' +
        '<p class="demo-note" role="note">' + esc(t('booked_demo')) + '</p>';
      document.getElementById('dlg-title').focus();
      document.getElementById('ics-btn').addEventListener('click', () => App.downloadIcs(trip, rec));
      dlg.addEventListener('close', () => render(main), { once: true });
    }
    // close on backdrop click
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  App.page(render);
})();
