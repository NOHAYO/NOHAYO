/* סיור בהתאמה אישית – טופס בקשה */
App.page(function (main) {
  const { t, L, esc, D } = App;
  App.setTitle(t('custom_title'));
  const GROUPS = ['family', 'barmitzvah', 'company', 'workers', 'tourists', 'other'];
  const INTERESTS = Array.from(new Set(D.TRIPS.flatMap((x) => x.interests)));
  const BUDGETS = ['b1', 'b2', 'b3', 'b4'];
  const preGuide = App.guideById(App.param('guide'));

  main.innerHTML =
    '<div class="page-head"><div class="container">' +
    '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_custom')) + '</li></ol></nav>' +
    '<h1>' + esc(t('custom_title')) + '</h1><p class="section-sub">' + esc(t('custom_sub')) + '</p></div></div>' +
    '<div class="container custom-layout">' +
    '<form id="custom-form" class="form-card" novalidate>' +
    (preGuide ? '<p class="demo-note">' + esc(t('custom_with_guide', { guide: L(preGuide.name) })) + '</p>' : '') +
    '<fieldset class="field"><legend>' + esc(t('group_type')) + ' <span aria-hidden="true">*</span></legend><div class="radio-cards">' +
    GROUPS.map((g, i) => '<label class="radio-card"><input type="radio" name="group" value="' + g + '"' + (i === 0 ? ' required' : '') + '><span>' + esc(t('grp_' + g)) + '</span></label>').join('') +
    '</div></fieldset>' +
    '<div class="form-grid">' +
    '<div class="field"><label for="cu-people">' + esc(t('num_participants')) + ' <span aria-hidden="true">*</span></label><input id="cu-people" name="people" type="number" min="1" max="500" required inputmode="numeric"></div>' +
    '<div class="field"><label for="cu-budget">' + esc(t('budget')) + '</label><select id="cu-budget" name="budget"><option value="">' + esc(t('budget_any')) + '</option>' +
    BUDGETS.map((b) => '<option value="' + b + '">' + esc(t('budget_' + b)) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="cu-from">' + esc(t('date_from')) + '</label><input id="cu-from" name="from" type="date" min="' + App.todayStr() + '"></div>' +
    '<div class="field"><label for="cu-to">' + esc(t('date_to')) + '</label><input id="cu-to" name="to" type="date" min="' + App.todayStr() + '"></div>' +
    '<div class="field span-2 check-inline"><input type="checkbox" id="cu-flex" name="flex"><label for="cu-flex">' + esc(t('flexible_dates')) + '</label></div>' +
    '</div>' +
    '<fieldset class="field"><legend>' + esc(t('interests')) + '</legend><ul class="check-list check-grid">' +
    INTERESTS.map((x) => '<li><input type="checkbox" id="cu-i-' + x + '" name="interests" value="' + x + '"><label for="cu-i-' + x + '">' + esc(t('int_' + x)) + '</label></li>').join('') +
    '</ul></fieldset>' +
    '<div class="form-grid">' +
    '<div class="field"><label for="cu-name">' + esc(t('full_name')) + ' <span aria-hidden="true">*</span></label><input id="cu-name" name="name" required autocomplete="name"></div>' +
    '<div class="field"><label for="cu-phone">' + esc(t('phone')) + ' <span aria-hidden="true">*</span></label><input id="cu-phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel" pattern="[0-9+\\-\\s]{9,15}" dir="ltr"></div>' +
    '<div class="field span-2"><label for="cu-email">' + esc(t('email')) + '</label><input id="cu-email" name="email" type="email" autocomplete="email" dir="ltr"></div>' +
    '<div class="field span-2"><label for="cu-notes">' + esc(t('notes')) + '</label><textarea id="cu-notes" name="notes" rows="4" placeholder="' + esc(t('notes_ph')) + '"></textarea></div>' +
    '</div>' +
    '<p class="small muted">' + esc(t('required_note')) + '</p>' +
    '<button class="btn btn-primary btn-lg" type="submit">' + esc(t('send_request')) + '</button>' +
    '</form>' +
    '<aside class="side-card" aria-labelledby="how-title"><h2 id="how-title" class="h-sub">' + esc(t('how_it_works')) + '</h2>' +
    '<ol class="steps"><li><strong>' + esc(t('how1')) + '</strong><span>' + esc(t('how1_sub')) + '</span></li>' +
    '<li><strong>' + esc(t('how2')) + '</strong><span>' + esc(t('how2_sub')) + '</span></li>' +
    '<li><strong>' + esc(t('how3')) + '</strong><span>' + esc(t('how3_sub')) + '</span></li></ol>' +
    '<p>' + esc(t('prefer_talk')) + '</p>' +
    '<a class="btn btn-wa btn-block" href="' + App.waLink(t('wa_custom_msg')) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span>' + esc(t('whatsapp')) + '</span></a>' +
    '</aside></div>';

  const form = document.getElementById('custom-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!App.validate(form)) return;
    App.busy(form.querySelector('button[type="submit"]'), 1000).then(() => done(new FormData(form)));
  });
  function done(fd) {
    App.S.addLead({ group: fd.get('group'), people: Number(fd.get('people')), from: fd.get('from'), to: fd.get('to'), flex: !!fd.get('flex'),
      budget: fd.get('budget'), interests: fd.getAll('interests'), name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), notes: fd.get('notes'),
      guide: preGuide ? preGuide.id : '' });
    const ints = fd.getAll('interests').map((x) => t('int_' + x));
    const when = fd.get('flex') ? t('flexible_dates') :
      [fd.get('from'), fd.get('to')].filter(Boolean).map((x) => App.fmtDate(x, 'short')).join(' – ') || t('not_set');
    const row = (k, v) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>';
    const box = document.createElement('div');
    box.className = 'form-card success-card';
    box.setAttribute('role', 'status');
    box.innerHTML =
      '<div class="success-icon" aria-hidden="true">' + App.icon('check') + '</div>' +
      '<h2 tabindex="-1" id="done-title">' + esc(t('custom_done_title', { name: fd.get('name') })) + '</h2>' +
      '<p>' + esc(t('custom_done_text')) + '</p>' +
      '<dl class="summary">' +
      row(t('group_type'), t('grp_' + fd.get('group'))) +
      row(t('num_participants'), fd.get('people')) +
      row(t('dates'), when) +
      row(t('interests'), ints.join(', ') || t('not_set')) +
      row(t('budget'), fd.get('budget') ? t('budget_' + fd.get('budget')) : t('budget_any')) +
      '</dl>' +
      '<p class="demo-note" role="note">' + esc(t('custom_done_demo')) + '</p>' +
      '<p><a class="btn btn-outline" href="custom.html">' + esc(t('new_request')) + '</a> <a class="btn btn-primary" href="tours.html">' + esc(t('browse_tours')) + '</a></p>';
    form.replaceWith(box);
    document.getElementById('done-title').focus();
  }
});
