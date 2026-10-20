/* ממשק המשרד (הדגמה) – מה בעל העסק רואה מאחורי הקלעים */
(function () {
  let tab = 'overview';

  function render(main) {
    const { t, L, esc, S, D } = App;
    App.setTitle(t('nav_admin'));
    const today = App.todayStr();
    const in30 = D.day(30);
    const bookings = S.bookings();
    const live = bookings.filter((b) => b.status !== 'cancelled');
    const upcomingB = live.filter((b) => b.date >= today && b.date <= in30);
    const revenue = upcomingB.reduce((s, b) => s + b.total, 0);
    const leads = S.leads();
    const msgs = S.messages();
    const userReviews = S.reviews();
    const recentReviews = App.allReviews().concat(userReviews.filter((r) => r.published === false))
      .filter((r) => r.d >= D.day(-30)).sort((a, b) => b.d.localeCompare(a.d) || (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    const rs = App.stats(recentReviews);
    const lowAlerts = recentReviews.filter((r) => r.r <= 3);
    const newLeads = leads.filter((l) => l.status === 'new').length;
    const unread = msgs.filter((m) => !m.read).length;
    const people = (b) => b.adults + b.children;

    // departures in the next 30 days with occupancy
    const deps = [];
    D.TRIPS.forEach((trip) => trip.dates.filter((d) => d >= today && d <= in30).forEach((d) => {
      const booked = S.booked(trip.id, d);
      deps.push({ trip, d, booked, pct: Math.min(100, Math.round(booked / trip.maxGroup * 100)), rev: live.filter((b) => b.trip === trip.id && b.date === d).reduce((s, b) => s + b.total, 0) });
    }));
    deps.sort((a, b) => a.d.localeCompare(b.d));

    const kpi = (label, value, sub, ic, alert) => '<div class="kpi' + (alert ? ' kpi-alert' : '') + '">' + App.icon(ic) + '<div><span class="kpi-label">' + esc(label) + '</span><span class="kpi-value">' + value + '</span>' + (sub ? '<span class="kpi-sub">' + esc(sub) + '</span>' : '') + '</div></div>';
    const tabs = [['overview', t('adm_tab_overview')], ['bookings', t('adm_tab_bookings')], ['leads', t('adm_tab_leads') + (newLeads ? ' (' + newLeads + ')' : '')],
      ['messages', t('adm_tab_messages') + (unread ? ' (' + unread + ')' : '')], ['reviews', t('adm_tab_reviews') + (lowAlerts.length ? ' (' + lowAlerts.length + ')' : '')]];
    const fmtTime = (iso) => new Date(iso).toLocaleString(App.locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    const depTable = '<div class="table-wrap"><table class="data-table"><caption class="sr-only">' + esc(t('adm_departures')) + '</caption><thead><tr>' +
      '<th scope="col">' + esc(t('date')) + '</th><th scope="col">' + esc(t('trip')) + '</th><th scope="col">' + esc(t('guide')) + '</th><th scope="col">' + esc(t('adm_occupancy')) + '</th><th scope="col">' + esc(t('adm_revenue')) + '</th></tr></thead><tbody>' +
      deps.map((x) => '<tr><td>' + esc(App.fmtDate(x.d, 'short')) + '</td><td><a href="tour.html?id=' + x.trip.id + '">' + esc(L(x.trip.title)) + '</a></td><td>' + esc(L(App.guideById(x.trip.guide).name)) + '</td>' +
        '<td><span class="occ"><span class="occ-bar" aria-hidden="true"><span style="width:' + x.pct + '%" class="' + (x.pct >= 85 ? 'hot' : x.pct < 30 ? 'low' : '') + '"></span></span>' + esc(x.booked + '/' + x.trip.maxGroup) + '</span></td>' +
        '<td>' + esc(App.fmtPrice(x.rev)) + '</td></tr>').join('') + '</tbody></table></div>';

    const bookingRows = bookings.slice().sort((a, b) => b.created.localeCompare(a.created)).map((b) => {
      const trip = App.tripById(b.trip);
      return '<tr' + (b.mine ? ' class="row-new"' : '') + '><td dir="ltr">' + esc(b.id) + '</td><td>' + esc(b.name) + (b.mine ? ' <span class="chip chip-new">' + esc(t('adm_from_site')) + '</span>' : '') + '<div class="muted small" dir="ltr">' + esc(b.phone) + '</div></td>' +
        '<td>' + esc(L(trip.title)) + '</td><td>' + esc(App.fmtDate(b.date, 'short')) + '</td><td>' + people(b) + '</td><td>' + esc(App.fmtPrice(b.total)) + '</td>' +
        '<td>' + esc(t('pay_' + (b.pay || 'card') + '_short')) + '</td><td><span class="status status-' + b.status + '">' + esc(t('st_' + b.status)) + '</span></td></tr>';
    }).join('');

    const leadCards = leads.map((l) => '<article class="lead-card"><header><h3 class="card-title">' + esc(l.name) + '</h3><span class="muted small">' + esc(fmtTime(l.created)) + '</span></header>' +
      '<p><strong>' + esc(t('grp_' + l.group)) + '</strong> · ' + esc(t('n_people', { n: l.people })) + (l.from ? ' · ' + esc(App.fmtDate(l.from, 'short')) + (l.to ? '–' + esc(App.fmtDate(l.to, 'short')) : '') : '') + (l.budget ? ' · ' + esc(t('budget_' + l.budget)) : '') + '</p>' +
      (l.interests && l.interests.length ? '<ul class="tags">' + l.interests.map((x) => '<li>' + App.chip(t('int_' + x)) + '</li>').join('') + '</ul>' : '') +
      (l.notes ? '<p class="lead-notes">' + esc(l.notes) + '</p>' : '') +
      '<div class="lead-actions"><div class="field field-inline"><label for="ls-' + l.id + '">' + esc(t('adm_status')) + '</label><select id="ls-' + l.id + '" data-lead="' + l.id + '">' +
      ['new', 'progress', 'quote', 'won', 'lost'].map((st) => '<option value="' + st + '"' + (l.status === st ? ' selected' : '') + '>' + esc(t('lead_' + st)) + '</option>').join('') + '</select></div>' +
      '<a class="btn btn-wa btn-sm" href="https://wa.me/' + esc(l.phone.replace(/\D/g, '').replace(/^0/, '972')) + '?text=' + encodeURIComponent(t('adm_lead_wa', { name: l.name })) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('adm_reply')) + '</span></a></div></article>').join('');

    const msgCards = msgs.map((m) => '<article class="lead-card' + (m.read ? '' : ' unread') + '"><header><h3 class="card-title">' + esc(m.name) + (m.read ? '' : ' <span class="chip chip-new">' + esc(t('adm_new')) + '</span>') + '</h3><span class="muted small">' + esc(fmtTime(m.created)) + '</span></header>' +
      '<p class="muted small"><span dir="ltr">' + esc(m.phone) + '</span>' + (m.email ? ' · ' + esc(m.email) : '') + ' · ' + esc(t('subj_' + m.subject)) + '</p><p>' + esc(m.msg) + '</p>' +
      (m.read ? '' : '<button type="button" class="btn btn-outline btn-sm" data-read="' + m.id + '">' + esc(t('adm_mark_read')) + '</button>') + '</article>').join('');

    const reviewList = recentReviews.slice(0, 20).map((r) => '<li class="review' + (r.r <= 3 ? ' review-alert' : '') + '">' +
      (r.r <= 3 ? '<p class="alert-line">' + App.icon('x') + esc(t('adm_low_alert')) + '</p>' : '') +
      App.reviewItem(r, { showTrip: true }).replace(/^<li class="review">|<\/li>$/g, '') + '</li>').join('');

    const panels = {
      overview:
        '<div class="kpis">' +
        kpi(t('adm_kpi_bookings'), String(upcomingB.length), t('adm_kpi_people', { n: upcomingB.reduce((s, b) => s + people(b), 0) }), 'ticket') +
        kpi(t('adm_kpi_revenue'), esc(App.fmtPrice(revenue)), t('adm_next30'), 'card') +
        kpi(t('adm_kpi_leads'), String(newLeads), t('adm_kpi_leads_sub', { n: leads.length }), 'users', newLeads > 0) +
        kpi(t('adm_kpi_rating'), esc(App.fmtRating(rs.avg)), t('adm_kpi_rating_sub', { n: rs.count, low: lowAlerts.length }), 'star', lowAlerts.length > 0) +
        '</div>' +
        '<h2 class="h-sub">' + esc(t('adm_departures')) + '</h2>' + depTable,
      bookings: '<div class="table-wrap"><table class="data-table"><caption class="sr-only">' + esc(t('adm_tab_bookings')) + '</caption><thead><tr>' +
        [t('adm_ref'), t('adm_customer'), t('trip'), t('date'), t('adm_people'), t('total'), t('pay_method'), t('adm_status')].map((h) => '<th scope="col">' + esc(h) + '</th>').join('') +
        '</tr></thead><tbody>' + bookingRows + '</tbody></table></div>',
      leads: leads.length ? '<div class="lead-grid">' + leadCards + '</div>' : '<p class="muted">' + esc(t('adm_empty')) + '</p>',
      messages: msgs.length ? '<div class="lead-grid">' + msgCards + '</div>' : '<p class="muted">' + esc(t('adm_empty')) + '</p>',
      reviews: '<p><a class="btn btn-outline btn-sm" href="review.html">' + App.icon('whatsapp') + '<span>' + esc(t('adm_send_request')) + '</span></a></p>' +
        (userReviews.length ? '<p class="demo-note">' + esc(t('adm_user_reviews', { n: userReviews.length })) + '</p>' : '') +
        '<ul class="review-list">' + reviewList + '</ul>'
    };

    main.innerHTML =
      '<div class="page-head page-head-admin"><div class="container">' +
      '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_admin')) + '</li></ol></nav>' +
      '<div class="admin-head"><div><h1>' + App.icon('office') + ' ' + esc(t('nav_admin')) + '</h1><p class="section-sub">' + esc(t('adm_sub')) + '</p></div>' +
      '<button type="button" class="btn btn-outline btn-sm" id="reset-demo">' + esc(t('adm_reset')) + '</button></div></div></div>' +
      '<div class="container admin">' +
      '<div class="tabs" role="tablist" aria-label="' + esc(t('nav_admin')) + '">' +
      tabs.map(([k, label]) => '<button type="button" role="tab" id="tab-' + k + '" aria-controls="panel" aria-selected="' + (tab === k) + '" tabindex="' + (tab === k ? 0 : -1) + '" data-tab="' + k + '">' + esc(label) + '</button>').join('') +
      '</div>' +
      '<div class="tab-panel" id="panel" role="tabpanel" aria-labelledby="tab-' + tab + '" tabindex="0">' + panels[tab] + '</div>' +
      '<p class="demo-note" role="note">' + esc(t('adm_demo')) + '</p></div>';

    const tablist = main.querySelector('[role="tablist"]');
    tablist.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      tab = b.dataset.tab; render(main);
      document.getElementById('tab-' + tab).focus();
    });
    // arrow keys move between tabs (RTL-aware)
    tablist.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const keys = tabs.map((x) => x[0]);
      const fwd = (e.key === 'ArrowLeft') === (App.lang === 'he');
      tab = keys[(keys.indexOf(tab) + (fwd ? 1 : keys.length - 1)) % keys.length];
      render(main);
      document.getElementById('tab-' + tab).focus();
    });
    main.querySelectorAll('[data-lead]').forEach((sel) => sel.addEventListener('change', () => { S.setLeadStatus(sel.dataset.lead, sel.value); App.toast(t('adm_saved')); }));
    main.querySelectorAll('[data-read]').forEach((b) => b.addEventListener('click', () => { S.markRead(b.dataset.read); render(main); }));
    document.getElementById('reset-demo').addEventListener('click', () => {
      if (!window.confirm(t('adm_reset_confirm'))) return;
      S.reset(); tab = 'overview'; render(main); App.refreshCounts(); App.toast(t('adm_reset_done'));
    });
  }

  App.page(render);
})();
