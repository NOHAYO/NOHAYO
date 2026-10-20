/* צור קשר */
App.page(function (main) {
  const { t, L, esc, D } = App;
  App.setTitle(t('contact_title'));
  const S = D.SITE;

  main.innerHTML =
    '<div class="page-head"><div class="container">' +
    '<nav class="breadcrumbs" aria-label="' + esc(t('breadcrumbs')) + '"><ol><li><a href="index.html">' + esc(t('nav_home')) + '</a></li><li aria-current="page">' + esc(t('nav_contact')) + '</li></ol></nav>' +
    '<h1>' + esc(t('contact_title')) + '</h1><p class="section-sub">' + esc(t('contact_sub')) + '</p></div></div>' +
    '<div class="container contact-layout">' +
    '<div class="contact-side">' +
    '<ul class="contact-methods">' +
    '<li><a class="contact-method cm-wa" href="' + App.waLink(t('wa_default_msg')) + '" target="_blank" rel="noopener">' + App.icon('whatsapp') + '<span><strong>' + esc(t('whatsapp')) + '</strong><span class="small">' + esc(t('wa_fastest')) + '</span></span></a></li>' +
    '<li><a class="contact-method" href="tel:' + S.phoneIntl + '">' + App.icon('phone') + '<span><strong>' + esc(t('phone')) + '</strong><span class="small" dir="ltr">' + esc(S.phone) + '</span></span></a></li>' +
    '<li><a class="contact-method" href="mailto:' + S.email + '">' + App.icon('mail') + '<span><strong>' + esc(t('email')) + '</strong><span class="small">' + esc(S.email) + '</span></span></a></li>' +
    '</ul>' +
    '<section class="side-card" aria-labelledby="hours-title"><h2 id="hours-title" class="h-sub">' + App.icon('clock') + ' ' + esc(t('hours_title')) + '</h2>' +
    '<table class="hours"><caption class="sr-only">' + esc(t('hours_title')) + '</caption><tbody>' +
    L(S.hours).map(([d, h]) => '<tr><th scope="row">' + esc(d) + '</th><td>' + esc(h) + '</td></tr>').join('') +
    '</tbody></table><p class="small muted">' + esc(t('response_promise')) + '</p></section>' +
    '<section class="side-card"><h2 class="h-sub">' + esc(t('follow_us')) + '</h2>' + App.socialLinks() + '</section>' +
    '</div>' +
    '<form id="contact-form" class="form-card" novalidate aria-labelledby="cf-title">' +
    '<h2 id="cf-title">' + esc(t('send_message')) + '</h2>' +
    '<div class="form-grid">' +
    '<div class="field"><label for="ct-name">' + esc(t('full_name')) + ' <span aria-hidden="true">*</span></label><input id="ct-name" name="name" required autocomplete="name"></div>' +
    '<div class="field"><label for="ct-phone">' + esc(t('phone')) + ' <span aria-hidden="true">*</span></label><input id="ct-phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel" pattern="[0-9+\\-\\s]{9,15}" dir="ltr"></div>' +
    '<div class="field span-2"><label for="ct-email">' + esc(t('email')) + '</label><input id="ct-email" name="email" type="email" autocomplete="email" dir="ltr"></div>' +
    '<div class="field span-2"><label for="ct-subject">' + esc(t('subject')) + '</label><select id="ct-subject" name="subject">' +
    ['booking', 'custom', 'existing', 'other'].map((x) => '<option value="' + x + '">' + esc(t('subj_' + x)) + '</option>').join('') + '</select></div>' +
    '<div class="field span-2"><label for="ct-msg">' + esc(t('message')) + ' <span aria-hidden="true">*</span></label><textarea id="ct-msg" name="msg" rows="5" required></textarea></div>' +
    '</div>' +
    '<p class="small muted">' + esc(t('required_note')) + '</p>' +
    '<button class="btn btn-primary btn-lg" type="submit">' + esc(t('send')) + '</button></form>' +
    '</div>';

  const form = document.getElementById('contact-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!App.validate(form)) return;
    App.busy(form.querySelector('button[type="submit"]'), 900).then(() => done(new FormData(form)));
  });
  function done(fd) {
    App.S.addMessage({ name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), subject: fd.get('subject'), msg: fd.get('msg') });
    const name = fd.get('name');
    form.innerHTML = '<div class="success-card" role="status"><div class="success-icon" aria-hidden="true">' + App.icon('check') + '</div>' +
      '<h2 tabindex="-1" id="ct-done">' + esc(t('contact_done', { name: name })) + '</h2><p>' + esc(t('contact_done_sub')) + '</p>' +
      '<p class="demo-note" role="note">' + esc(t('form_demo_note')) + '</p></div>';
    document.getElementById('ct-done').focus();
  }
});
