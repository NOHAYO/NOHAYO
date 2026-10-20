/* Tour de Israel demo – shared app shell & helpers */
(function () {
  'use strict';

  const D = window.TDI_DATA;
  const I18N = window.TDI_I18N;
  const S = window.TDI_STORE;
  const LANG_KEY = 'tdi-lang';

  /* ---------- language ---------- */
  function readLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (fromUrl === 'he' || fromUrl === 'en') return fromUrl;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'he' || saved === 'en') return saved;
    } catch (e) { /* storage blocked */ }
    return 'he';
  }

  let lang = readLang();

  function t(key, vars) {
    // singular form, e.g. results_count_one, when {n} is 1
    if (vars && vars.n === 1 && (I18N[lang][key + '_one'] || I18N.he[key + '_one'])) key += '_one';
    let s = I18N[lang][key];
    if (s === undefined) s = I18N.he[key];
    if (s === undefined) {
      console.warn('[i18n] missing key:', key);
      return key;
    }
    if (vars && typeof s === 'string') {
      s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    }
    return s;
  }

  /** pick the current language from a {he, en} object */
  function L(obj) {
    if (obj == null) return '';
    if (typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return obj[lang] !== undefined ? obj[lang] : obj.he;
  }

  const locale = () => (lang === 'he' ? 'he-IL' : 'en-GB');

  /* ---------- escaping ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- dates ---------- */
  function todayStr() { return D.day(0); }
  function parseDate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  }
  function fmtDate(s, style) {
    const opts = style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'short'
        ? { day: 'numeric', month: 'short' }
        : { weekday: 'short', day: 'numeric', month: 'long' };
    return parseDate(s).toLocaleDateString(locale(), opts);
  }
  function daysUntil(s) {
    return Math.round((parseDate(s) - parseDate(todayStr())) / 86400000);
  }

  /* ---------- money ---------- */
  function fmtPrice(n) {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
  }

  /* ---------- data helpers ---------- */
  const tripById = (id) => D.TRIPS.find((x) => x.id === id);
  const guideById = (id) => D.GUIDES.find((x) => x.id === id);

  /** future departures (today counts as upcoming), sorted */
  function upcomingDates(trip, from) {
    const min = from && from > todayStr() ? from : todayStr();
    return trip.dates.filter((d) => d >= min).sort();
  }
  const isUpcoming = (trip) => upcomingDates(trip).length > 0;
  function upcomingTrips() {
    return D.TRIPS.filter(isUpcoming).sort((a, b) => upcomingDates(a)[0].localeCompare(upcomingDates(b)[0]));
  }

  function stats(reviews) {
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    reviews.forEach((r) => { dist[r.r - 1]++; sum += r.r; });
    return { count: reviews.length, avg: reviews.length ? sum / reviews.length : 0, dist };
  }
  const tripReviews = (id) => S.reviews().filter((r) => r.trip === id && r.published !== false)
    .concat((D.REVIEWS[id] || []).map((r) => Object.assign({ trip: id }, r)))
    .sort((a, b) => b.d.localeCompare(a.d) || (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  const tripStats = (id) => stats(tripReviews(id));
  const guideTrips = (gid) => D.TRIPS.filter((x) => x.guide === gid);
  function guideReviews(gid) {
    return guideTrips(gid).flatMap((x) => tripReviews(x.id)).sort((a, b) => b.d.localeCompare(a.d));
  }
  const guideStats = (gid) => stats(guideReviews(gid));
  const allReviews = () => D.TRIPS.flatMap((x) => tripReviews(x.id));
  const fmtRating = (n) => n.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  /** consistent, de-duplicated tags: type → region → languages */
  function tripTags(trip) {
    const set = new Set([t('type_' + trip.type), t('region_' + trip.region)].concat(trip.langs.map((l) => t('lang_' + l))));
    return Array.from(set);
  }

  function durationText(trip) {
    if (trip.duration === 'multi') return t('dur_days', { n: Math.ceil(trip.hours / 24) + 1 });
    return t('dur_hours', { n: trip.hours.toLocaleString(locale()) });
  }

  function responseText(mins) {
    if (mins < 60) return t('resp_mins', { n: mins });
    const h = Math.round(mins / 60);
    return h === 1 ? t('resp_hour') : t('resp_hours', { n: h });
  }

  /* ---------- URLs ---------- */
  const waLink = (text) => 'https://wa.me/' + D.SITE.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  const waShare = (text) => 'https://wa.me/?text=' + encodeURIComponent(text);
  function absUrl(rel) { return new URL(rel, location.href).href; }

  /* ---------- icons (inline SVG, decorative) ---------- */
  const ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.09c-.24.68-1.42 1.3-1.96 1.35-.5.05-.97.23-3.28-.68-2.78-1.1-4.54-3.95-4.68-4.13-.13-.18-1.12-1.49-1.12-2.84 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34l.52.01c.17.01.39-.06.61.47.24.55.79 1.9.86 2.04.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.28-.12.56.16.27.71 1.18 1.53 1.91 1.05.94 1.94 1.23 2.21 1.37.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.46.2.52.32.07.11.07.66-.17 1.33z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm6-7.9a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 18 7.1zM21.9 8.2a5.4 5.4 0 0 0-1.5-3.9 5.5 5.5 0 0 0-3.9-1.5C15 2.7 9 2.7 7.5 2.8a5.5 5.5 0 0 0-3.9 1.5 5.4 5.4 0 0 0-1.5 3.9C2 9.7 2 14.3 2.1 15.8a5.4 5.4 0 0 0 1.5 3.9 5.5 5.5 0 0 0 3.9 1.5c1.5.1 7.5.1 9 0a5.4 5.4 0 0 0 3.9-1.5 5.5 5.5 0 0 0 1.5-3.9c.1-1.5.1-6.1 0-7.6zm-2.1 9.3a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3a3 3 0 0 1 1.7-1.7c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 0 0-.8-.1 5.7 5.7 0 1 0 5.7 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.2 3.2.8-1.2-4.5-2.7z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14zm0-12H5V6h14z"/></svg>',
    lang: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm6.9 6h-3a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4a14 14 0 0 1 1.9 4h-3.8A14 14 0 0 1 12 4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3a15.6 15.6 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6A15.6 15.6 0 0 0 8.1 8zM12 20a14 14 0 0 1-1.9-4h3.8A14 14 0 0 1 12 20zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6a15.6 15.6 0 0 0 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2 4 5v6c0 5.5 3.4 10.3 8 11.6 4.6-1.3 8-6.1 8-11.6V5zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 17.3 6.2 3.7-1.6-7 5.4-4.7-7.1-.6L12 2 9.1 8.7 2 9.3l5.4 4.7-1.6 7z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    waze: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.5 9.6A8.8 8.8 0 0 0 12 3.5a8.7 8.7 0 0 0-8.7 8.7c0 1.4-.4 2.5-1.6 3a.6.6 0 0 0-.2 1 7.2 7.2 0 0 0 3.6 2.2 2.2 2.2 0 0 0 4.2 1.1h4.2a2.2 2.2 0 0 0 4.3-.6 8.6 8.6 0 0 0 2.9-9.3zM9.7 10a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.6 4.1a4.3 4.3 0 0 1-6.6-.4.6.6 0 1 1 1-.7 3.1 3.1 0 0 0 4.8.3.6.6 0 0 1 .8.8zM15 11a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 16.1a3 3 0 0 0-2 .8l-7.1-4.2a3.3 3.3 0 0 0 0-1.4l7-4.1A3 3 0 1 0 15 5a3.3 3.3 0 0 0 .1.7L8 9.8a3 3 0 1 0 0 4.4l7.1 4.2a2.8 2.8 0 0 0-.1.6 3 3 0 1 0 3-2.9z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>',
    users: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0h-1a4.2 4.2 0 0 1 2 3.5V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
    mountain: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m14 6-3.8 5 2.9 3.8-1.6 1.2L7 10l-6 8h22z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 4.4 2.6h1.6c.8-1.4 2.3-2.6 4.4-2.6 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>',
    heartLine: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 20s-7-4.3-8.8-8.6C1.9 8.4 3.8 5.5 6.8 5.5c2 0 3.4 1.3 4.2 2.7h2c.8-1.4 2.2-2.7 4.2-2.7 3 0 4.9 2.9 3.6 5.9C19 15.7 12 20 12 20z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4zm-7 6.5h-2v-2h2zm0-3.5h-2v-2h2zm0-3.5h-2v-2h2z"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4v-6h16zm0-10H4V6h16z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9zm3 11a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/></svg>',
    office: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="flip-rtl"><path fill="currentColor" d="M16 4 14.6 5.4 20.2 11H2v2h18.2l-5.6 5.6L16 20l8-8z" transform="translate(-1)"/></svg>'
  };
  const icon = (name) => ICONS[name] || '';

  /* ---------- images (Unsplash + offline-friendly fallback) ---------- */
  const THEMES = {
    jerusalem: ['#e8c88a', '#b9895a', '#7d5a3c'],
    north: ['#b8d8a8', '#5f9a64', '#2f5d3a'],
    south: ['#f3cf9c', '#d39a5b', '#94603a'],
    center: ['#a9d6e5', '#4f9db8', '#2c6e86'],
    food: ['#f6c28b', '#e07a3f', '#9b3d1e'],
    wine: ['#e3b7c8', '#9c4f6e', '#5a2441'],
    jordan: ['#f2b9a0', '#c96d4e', '#7e3b2a'],
    sinai: ['#f0d6a8', '#c8955a', '#6e4a2c'],
    default: ['#cfe3e5', '#6aa7ad', '#0f5c63']
  };
  function fallbackSrc(theme) {
    const c = THEMES[theme] || THEMES.default;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="#fff8ec"/></linearGradient></defs>' +
      '<rect width="800" height="500" fill="url(#g)"/><circle cx="600" cy="140" r="60" fill="#fff6d8" opacity=".85"/>' +
      '<path d="M0 360 L160 250 L300 330 L460 210 L620 320 L800 240 V500 H0Z" fill="' + c[1] + '" opacity=".8"/>' +
      '<path d="M0 420 L200 340 L380 410 L560 330 L800 400 V500 H0Z" fill="' + c[2] + '"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const unsplash = (id, w) => 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + w + '&q=70';
  const isUnsplash = (id) => /^\d{10,}-[0-9a-f]+$/.test(id);
  /** 'petra' → bundled illustration, 'assets/img/photos/x.jpg' → your own photo, '1579…-4e61…' → Unsplash */
  function imgSrc(id, w) {
    if (!id) return '';
    if (isUnsplash(id)) return unsplash(id, w);
    if (id.indexOf('/') >= 0 || /\.(jpe?g|png|webp|svg|avif)$/i.test(id)) return id;
    return 'assets/img/scenes/' + id + '.svg';
  }
  function img(id, opts) {
    opts = opts || {};
    const w = opts.w || 800;
    const src = id ? imgSrc(id, w) : fallbackSrc(opts.theme);
    const srcset = id && isUnsplash(id) ? ' srcset="' + unsplash(id, Math.round(w / 2)) + ' ' + Math.round(w / 2) + 'w, ' + src + ' ' + w + 'w"' +
      (opts.sizes ? ' sizes="' + opts.sizes + '"' : '') : '';
    return '<img src="' + src + '"' + srcset + ' alt="' + esc(opts.alt || '') + '"' +
      (opts.cls ? ' class="' + opts.cls + '"' : '') +
      ' data-theme="' + esc(opts.theme || 'default') + '"' +
      (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  // swap any broken image (offline / blocked CDN) for a themed illustration
  document.addEventListener('error', function (e) {
    const el = e.target;
    if (el && el.tagName === 'IMG' && !el.dataset.fallback) {
      el.dataset.fallback = '1';
      el.removeAttribute('srcset');
      el.src = fallbackSrc(el.dataset.theme);
    }
  }, true);

  /* ---------- small components ---------- */
  function stars(avg, opts) {
    opts = opts || {};
    const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
    const label = t('rating_aria', { n: fmtRating(avg) });
    return '<span class="stars' + (opts.lg ? ' stars-lg' : '') + '" role="img" aria-label="' + esc(label) + '">' +
      '<span class="stars-bg" aria-hidden="true">★★★★★</span>' +
      '<span class="stars-fill" aria-hidden="true" style="width:' + pct.toFixed(1) + '%">★★★★★</span></span>';
  }

  function ratingLine(s) {
    if (!s.count) return '<span class="muted">' + esc(t('no_reviews_yet')) + '</span>';
    return '<span class="rating-line">' + stars(s.avg) + ' <strong>' + fmtRating(s.avg) + '</strong> <span class="muted">(' + esc(t('n_reviews', { n: s.count })) + ')</span></span>';
  }

  function avatar(g, size) {
    const initials = L(g.name).split(/[\s-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('');
    return '<span class="avatar' + (size ? ' avatar-' + size : '') + '" style="--c:' + g.color + '" aria-hidden="true">' +
      '<svg viewBox="0 0 64 64" class="avatar-art"><path d="M0 50 L18 36 L30 44 L44 30 L64 44 V64 H0Z" fill="#fff" opacity=".18"/></svg>' +
      '<span class="avatar-initials">' + esc(initials) + '</span></span>';
  }

  function chip(text, cls) { return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + esc(text) + '</span>'; }
  function tagList(trip) {
    return '<ul class="tags" aria-label="' + esc(t('tags')) + '">' + tripTags(trip).map((x) => '<li>' + chip(x) + '</li>').join('') + '</ul>';
  }

  function tripCard(trip, opts) {
    opts = opts || {};
    const next = upcomingDates(trip, opts.from)[0];
    const s = tripStats(trip.id);
    const href = 'tour.html?id=' + encodeURIComponent(trip.id);
    const soon = next && daysUntil(next) <= 3;
    return '<article class="card trip-card">' +
      '<div class="card-media">' + img(trip.images[0], { w: 640, alt: L(trip.title), theme: trip.theme, sizes: '(max-width: 640px) 100vw, 33vw' }) +
      (soon ? '<span class="badge badge-hot">' + esc(t('soon_badge')) + '</span>' : '') +
      favBtn(trip) +
      '</div>' +
      '<div class="card-body">' +
      tagList(trip) +
      '<h3 class="card-title"><a href="' + href + '" class="stretched">' + esc(L(trip.title)) + '</a></h3>' +
      '<p class="card-text">' + esc(L(trip.short)) + '</p>' +
      '<ul class="meta">' +
      (next ? '<li>' + icon('calendar') + '<span>' + esc(t('next_date')) + ': <strong>' + esc(fmtDate(next)) + '</strong></span></li>' : '') +
      '<li>' + icon('clock') + '<span>' + esc(durationText(trip)) + '</span></li>' +
      '</ul>' +
      '<div class="card-foot">' + ratingLine(s) +
      '<span class="price"><span class="muted">' + esc(t('from')) + '</span> <strong>' + esc(fmtPrice(trip.price)) + '</strong></span></div>' +
      '</div></article>';
  }

  function favBtn(trip, cls) {
    const on = S.isFav(trip.id);
    return '<button type="button" class="fav-btn' + (cls ? ' ' + cls : '') + '" data-fav="' + trip.id + '" aria-pressed="' + on + '" aria-label="' + esc(t('fav_aria', { trip: L(trip.title) })) + '">' +
      icon(on ? 'heart' : 'heartLine') + (cls ? '<span>' + esc(t(on ? 'fav_saved' : 'fav_save')) + '</span>' : '') + '</button>';
  }

  /* ---------- feedback: toast + busy buttons ---------- */
  function toast(msg) {
    let box = document.getElementById('toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      box.className = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = icon('check') + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3000);
  }
  /** simulate a network round-trip: spinner on the button, then resolve */
  function busy(btn, ms) {
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>' + esc(t('processing')) + '</span>';
    return new Promise((res) => setTimeout(() => { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = label; res(); }, ms || 900));
  }

  /** download an .ics calendar file for a booking */
  function downloadIcs(trip, b) {
    const [hh, mm] = trip.meeting.time.split(':').map(Number);
    const start = parseDate(b.date); start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + Math.min(trip.hours, 24) * 3600000);
    const f = (d) => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tour de Israel demo//HE', 'BEGIN:VEVENT', 'UID:' + b.id + '@tourdeisrael.example',
      'DTSTART:' + f(start), 'DTEND:' + f(end), 'SUMMARY:' + L(trip.title), 'LOCATION:' + L(trip.meeting.place),
      'DESCRIPTION:' + t('ics_desc', { ref: b.id, time: trip.meeting.time }), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'tour-' + b.id + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function guideCard(g) {
    const s = guideStats(g.id);
    return '<article class="card guide-card">' +
      '<div class="guide-card-top">' + avatar(g, 'lg') +
      '<div><h3 class="card-title"><a href="guide.html?id=' + encodeURIComponent(g.id) + '" class="stretched">' + esc(L(g.name)) + '</a></h3>' +
      '<p class="licensed">' + icon('shield') + '<span>' + esc(t('licensed_short')) + '</span></p></div></div>' +
      '<div class="card-body">' + ratingLine(s) +
      '<p class="guide-langs">' + icon('lang') + '<span>' + esc(g.langs.map((l) => t('lang_' + l)).join(' · ')) + '</span></p>' +
      '<ul class="tags">' + g.specialties.map((x) => '<li>' + chip(t('spec_' + x)) + '</li>').join('') + '</ul>' +
      '</div></article>';
  }

  function reviewItem(r, opts) {
    opts = opts || {};
    const trip = opts.showTrip ? tripById(r.trip) : null;
    const dir = r.l === 'he' ? 'rtl' : 'ltr';
    return '<li class="review">' +
      '<div class="review-head"><span class="review-avatar" aria-hidden="true">' + esc(r.n.charAt(0)) + '</span>' +
      '<div><strong>' + esc(r.n) + '</strong><div class="muted small">' + esc(fmtDate(r.d, 'long')) +
      (trip ? ' · <a href="tour.html?id=' + trip.id + '">' + esc(L(trip.title)) + '</a>' : '') + '</div></div>' +
      '<span class="review-stars">' + stars(r.r) + '</span></div>' +
      '<p class="review-text" lang="' + r.l + '" dir="' + dir + '">' + esc(r.t) + '</p></li>';
  }

  function reviewSummary(s) {
    if (!s.count) return '<p class="muted">' + esc(t('no_reviews_yet')) + '</p>';
    let bars = '';
    for (let i = 5; i >= 1; i--) {
      const c = s.dist[i - 1];
      const pct = Math.round((c / s.count) * 100);
      bars += '<li><span class="dist-label">' + esc(t('n_stars', { n: i })) + '</span>' +
        '<span class="dist-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span>' +
        '<span class="dist-count">' + esc(t('dist_count', { n: c, p: pct })) + '</span></li>';
    }
    return '<div class="review-summary">' +
      '<div class="review-score"><span class="big-score">' + fmtRating(s.avg) + '</span>' + stars(s.avg, { lg: true }) +
      '<span class="muted">' + esc(t('based_on', { n: s.count })) + '</span></div>' +
      '<ul class="dist" aria-label="' + esc(t('dist_aria')) + '">' + bars + '</ul></div>';
  }

  function articleCard(a) {
    return '<article class="card article-card"><div class="card-media">' + img(a.image, { w: 640, alt: '', theme: a.theme }) + '</div>' +
      '<div class="card-body"><p class="eyebrow">' + esc(L(a.category)) + ' · <time datetime="' + a.date + '">' + esc(fmtDate(a.date, 'long')) + '</time></p>' +
      '<h3 class="card-title"><a class="stretched" href="article.html?id=' + a.id + '">' + esc(L(a.title)) + '</a></h3>' +
      '<p class="card-text">' + esc(L(a.excerpt)) + '</p></div></article>';
  }

  /* ---------- shell ---------- */
  const NAV = [
    ['home', 'index.html'],
    ['tours', 'tours.html'],
    ['guides', 'guides.html'],
    ['custom', 'custom.html'],
    ['magazine', 'magazine.html'],
    ['contact', 'contact.html']
  ];

  function socialLinks(cls) {
    const S = D.SITE.social;
    return '<ul class="social ' + (cls || '') + '">' + Object.keys(S).map((k) =>
      '<li><a href="' + S[k] + '" target="_blank" rel="noopener" aria-label="' + esc(t('social_' + k) + ' – ' + t('opens_new_tab')) + '">' + icon(k) + '</a></li>'
    ).join('') + '</ul>';
  }

  const myActive = () => S.myBookings().filter((b) => b.status === 'confirmed' && b.date >= todayStr()).length;
  function refreshCounts() {
    document.querySelectorAll('[data-count="favs"]').forEach((el) => { el.textContent = S.favs().length; el.hidden = !S.favs().length; });
    document.querySelectorAll('[data-count="bookings"]').forEach((el) => { el.textContent = myActive(); el.hidden = !myActive(); });
  }
  // favourites: one delegated handler for every heart button on every page
  document.addEventListener('click', function (e) {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    const trip = tripById(b.dataset.fav);
    const on = S.toggleFav(trip.id);
    document.querySelectorAll('[data-fav="' + trip.id + '"]').forEach((x) => {
      x.setAttribute('aria-pressed', String(on));
      x.querySelector('svg').outerHTML = icon(on ? 'heart' : 'heartLine');
      const lbl = x.querySelector('span');
      if (lbl) lbl.textContent = t(on ? 'fav_saved' : 'fav_save');
    });
    refreshCounts();
    toast(t(on ? 'fav_added' : 'fav_removed', { trip: L(trip.title) }));
    document.dispatchEvent(new CustomEvent('tdi:favs'));
  });

  function renderShell() {
    const page = document.body.dataset.page;
    const banner = document.getElementById('demo-banner');
    banner.innerHTML = '<p>' + esc(t('demo_banner')) + ' <a href="improvements.html">' + esc(t('demo_banner_link')) + '</a></p>';

    const header = document.getElementById('site-header');
    header.innerHTML =
      '<div class="container header-inner">' +
      '<a class="logo" href="index.html" aria-label="' + esc(t('logo_aria')) + '"><span class="logo-mark" aria-hidden="true">' + icon('mountain') + '</span>' +
      '<span class="logo-text">Tour de Israel<small>' + esc(t('tagline')) + '</small></span></a>' +
      '<nav class="main-nav" id="main-nav" aria-label="' + esc(t('nav_aria')) + '"><ul>' +
      NAV.map(([k, href]) => '<li><a href="' + href + '"' + (page === k ? ' aria-current="page"' : '') + '>' + esc(t('nav_' + k)) + '</a></li>').join('') +
      '</ul></nav>' +
      '<div class="header-actions">' +
      '<a class="head-icon" href="my-bookings.html#favorites" aria-label="' + esc(t('favs_aria', { n: S.favs().length })) + '">' + icon('heartLine') + '<span class="count" data-count="favs"' + (S.favs().length ? '' : ' hidden') + '>' + S.favs().length + '</span></a>' +
      '<a class="head-icon head-bookings" href="my-bookings.html"' + (page === 'bookings' ? ' aria-current="page"' : '') + ' aria-label="' + esc(t('my_bookings_aria', { n: myActive() })) + '">' + icon('ticket') + '<span class="head-label">' + esc(t('nav_bookings')) + '</span><span class="count" data-count="bookings"' + (myActive() ? '' : ' hidden') + '>' + myActive() + '</span></a>' +
      '<button type="button" class="lang-toggle" id="lang-toggle" lang="' + (lang === 'he' ? 'en' : 'he') + '" aria-label="' + esc(t('lang_toggle_aria')) + '">' + icon('lang') + '<span>' + esc(t('lang_toggle')) + '</span></button>' +
      '<button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="main-nav">' + icon('menu') + '<span class="sr-only">' + esc(t('menu')) + '</span></button>' +
      '</div></div>';

    const footer = document.getElementById('site-footer');
    footer.innerHTML =
      '<div class="container footer-grid">' +
      '<section><h2 class="footer-title">Tour de Israel</h2><p>' + esc(t('footer_about')) + '</p>' + socialLinks() + '</section>' +
      '<section><h2 class="footer-title">' + esc(t('footer_links')) + '</h2><ul class="footer-links">' +
      NAV.slice(1).map(([k, href]) => '<li><a href="' + href + '">' + esc(t('nav_' + k)) + '</a></li>').join('') +
      '<li><a href="my-bookings.html">' + esc(t('nav_bookings')) + '</a></li>' +
      '<li><a href="review.html">' + esc(t('nav_review')) + '</a></li>' +
      '<li><a href="admin.html">' + esc(t('nav_admin')) + '</a></li>' +
      '<li><a href="improvements.html">' + esc(t('nav_improvements')) + '</a></li></ul></section>' +
      '<section><h2 class="footer-title">' + esc(t('footer_contact')) + '</h2><ul class="footer-links">' +
      '<li><a href="' + waLink(t('wa_default_msg')) + '" target="_blank" rel="noopener">' + icon('whatsapp') + ' ' + esc(t('whatsapp')) + '</a></li>' +
      '<li><a href="tel:' + D.SITE.phoneIntl + '">' + icon('phone') + ' <span dir="ltr">' + esc(D.SITE.phone) + '</span></a></li>' +
      '<li><a href="mailto:' + D.SITE.email + '">' + icon('mail') + ' ' + esc(D.SITE.email) + '</a></li></ul>' +
      '<p class="small">' + esc(t('footer_hours_short')) + '</p></section>' +
      '</div><div class="container footer-bottom"><p>' + esc(t('footer_demo_note')) + '</p></div>';

    let wa = document.getElementById('wa-float');
    if (!wa) {
      wa = document.createElement('a');
      wa.id = 'wa-float';
      wa.className = 'wa-float';
      wa.target = '_blank';
      wa.rel = 'noopener';
      document.body.appendChild(wa);
    }
    wa.href = waLink(t('wa_default_msg'));
    wa.setAttribute('aria-label', t('wa_float_aria'));
    wa.innerHTML = icon('whatsapp');

    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = t('skip');

    // events
    document.getElementById('lang-toggle').addEventListener('click', () => {
      setLang(lang === 'he' ? 'en' : 'he');
      document.getElementById('lang-toggle').focus();
    });
    const menuBtn = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  function applyDocLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }

  function setTitle(s) { document.title = s + ' | Tour de Israel'; }

  let pageRender = null;
  function render() {
    applyDocLang();
    renderShell();
    const main = document.getElementById('main');
    if (pageRender) pageRender(main);
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ }
    // keep ?lang= in sync if present so shared links stay correct
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); }
    render();
  }

  function page(fn) {
    pageRender = fn;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
  }

  const param = (k) => new URLSearchParams(location.search).get(k);

  /** simple form validation with accessible messages */
  function validate(form) {
    let first = null;
    form.querySelectorAll('[data-err]').forEach((el) => el.remove());
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const seenRadio = new Set();
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      if (el.type === 'radio') { if (seenRadio.has(el.name)) return; seenRadio.add(el.name); }
      if (el.willValidate && !el.checkValidity()) {
        el.setAttribute('aria-invalid', 'true');
        const msg = document.createElement('p');
        msg.className = 'field-error';
        msg.dataset.err = '1';
        msg.id = (el.id || el.name) + '-err';
        msg.textContent = el.validity.valueMissing ? t('err_required')
          : el.validity.typeMismatch ? t('err_format')
            : el.validity.patternMismatch ? t('err_format')
              : (el.validity.rangeUnderflow || el.validity.rangeOverflow) ? t('err_range')
                : t('err_format');
        el.setAttribute('aria-describedby', msg.id);
        const host = el.type === 'radio' ? el.closest('fieldset') : (el.closest('.field') || el.parentElement);
        host.appendChild(msg);
        if (!first) first = el;
      }
    });
    if (first) { first.focus(); return false; }
    return true;
  }

  window.App = {
    D, S, t, L, esc, toast, busy, downloadIcs, favBtn, refreshCounts, imgSrc, parseDate, get lang() { return lang; }, locale,
    todayStr, fmtDate, daysUntil, fmtPrice, fmtRating,
    tripById, guideById, upcomingDates, isUpcoming, upcomingTrips,
    tripReviews, tripStats, guideTrips, guideReviews, guideStats, allReviews, stats,
    tripTags, durationText, responseText,
    waLink, waShare, absUrl, icon, img, stars, ratingLine, avatar, chip, tagList,
    tripCard, guideCard, articleCard, reviewItem, reviewSummary, socialLinks,
    page, setTitle, param, validate, tr: (k) => I18N[lang][k] || I18N.he[k]
  };
})();
