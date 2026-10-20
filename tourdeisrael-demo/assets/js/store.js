/* =====================================================================
   "שרת" מדומה – כל מה שהגולש עושה נשמר בדפדפן (localStorage):
   הזמנות, בקשות לסיור מותאם, הודעות, חוות דעת ומועדפים.
   כך הדמו מרגיש כמו אתר אמיתי, בלי שרת. "איפוס נתוני הדמו" מוחק הכול.
   ===================================================================== */
(function () {
  'use strict';
  const D = window.TDI_DATA;
  const PREFIX = 'tdi:';
  const VERSION = 1;
  const memory = {};

  function read(key, def) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? def : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : def;
    }
  }
  function write(key, val) {
    memory[key] = val;
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) { /* private mode – keep in memory */ }
  }

  const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.floor(100 + Math.random() * 900);
  const nowIso = () => new Date().toISOString();

  /* ---------- sample office data (other customers) ---------- */
  function seed() {
    const names = ['משפחת כהן', 'Rachel Gold', 'אבי לוי', 'דנה מזרחי', 'Mark Stein', 'שירן אברהם', 'יוסי ביטון', 'Laura Cohen', 'נועם פרץ', 'מיכל דהן'];
    const bookings = [];
    let k = 0;
    D.TRIPS.forEach((trip) => {
      trip.dates.filter((d) => d >= D.day(-10)).slice(0, 2).forEach((date, j) => {
        const n = 1 + ((trip.id.length + j * 3) % 3);
        for (let i = 0; i < n; i++) {
          const adults = 1 + ((k + i) % 4);
          const children = trip.type === 'family' ? (k % 3) : 0;
          bookings.push({
            id: 'TDI-' + (4100 + k), trip: trip.id, date, adults, children,
            total: adults * trip.price + children * Math.round(trip.price * 0.8),
            name: names[k % names.length], phone: '050-000' + String(1000 + k).slice(-4), email: '',
            created: new Date(Date.now() - (k % 9 + 1) * 86400000).toISOString(),
            status: date < D.day(0) ? 'done' : 'confirmed', pay: k % 3 ? 'card' : 'bit', mine: false
          });
          k++;
        }
      });
    });
    write('bookings', bookings);
    write('leads', [
      { id: 'L-301', group: 'barmitzvah', people: 45, from: D.day(38), to: '', budget: 'b2', interests: ['history', 'kids'], name: 'אורנה שמש', phone: '052-0000123', email: '', notes: 'בר מצווה לבן, רוצים לשלב את הכותל ופעילות לילדים', created: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'new' },
      { id: 'L-298', group: 'workers', people: 120, from: D.day(52), to: D.day(53), budget: 'b3', interests: ['security', 'community'], name: 'ועד עובדים – חברת דוגמה', phone: '03-0000456', email: 'vaad@example.com', notes: 'יום גיבוש לעוטף עזה עם הסעות מהמרכז', created: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'quote' }
    ]);
    write('messages', [
      { id: 'M-77', name: 'Sarah K.', phone: '+1 555 0100', email: 'sarah@example.com', subject: 'booking', msg: 'Is the Petra tour suitable for a 70-year-old who walks well?', created: new Date(Date.now() - 86400000).toISOString(), read: false }
    ]);
    write('reviews', []);
    write('favs', []);
    write('version', VERSION);
  }
  if (read('version', 0) !== VERSION) seed();

  /* ---------- deterministic baseline occupancy (bookings not in the list) ---------- */
  function baseline(tripId, date) {
    const n = date.split('-').reduce((a, b) => a + Number(b), 0) + tripId.length * 7;
    return n % 9;
  }

  const Store = {
    /* bookings */
    bookings: () => read('bookings', []),
    myBookings: () => Store.bookings().filter((b) => b.mine),
    addBooking(b) {
      const list = Store.bookings();
      const rec = Object.assign({ id: 'TDI-' + Math.floor(5000 + Math.random() * 4900), created: nowIso(), status: 'confirmed', mine: true }, b);
      list.push(rec);
      write('bookings', list);
      return rec;
    },
    cancelBooking(id, refund) {
      write('bookings', Store.bookings().map((b) => (b.id === id ? Object.assign({}, b, { status: 'cancelled', refund, cancelled: nowIso() }) : b)));
    },
    booked(tripId, date) {
      return baseline(tripId, date) + Store.bookings()
        .filter((b) => b.trip === tripId && b.date === date && b.status !== 'cancelled')
        .reduce((s, b) => s + b.adults + b.children, 0);
    },
    seatsLeft(trip, date) { return Math.max(0, trip.maxGroup - Store.booked(trip.id, date)); },

    /* leads (custom-tour requests) & contact messages */
    leads: () => read('leads', []),
    addLead(l) { const list = Store.leads(); const rec = Object.assign({ id: uid('L'), created: nowIso(), status: 'new' }, l); list.unshift(rec); write('leads', list); return rec; },
    setLeadStatus(id, status) { write('leads', Store.leads().map((l) => (l.id === id ? Object.assign({}, l, { status }) : l))); },
    messages: () => read('messages', []),
    addMessage(m) { const list = Store.messages(); const rec = Object.assign({ id: uid('M'), created: nowIso(), read: false }, m); list.unshift(rec); write('messages', list); return rec; },
    markRead(id) { write('messages', Store.messages().map((m) => (m.id === id ? Object.assign({}, m, { read: true }) : m))); },

    /* reviews submitted in the demo */
    reviews: () => read('reviews', []),
    addReview(r) { const list = Store.reviews(); const rec = Object.assign({ id: uid('R'), d: D.day(0), isNew: true }, r); list.unshift(rec); write('reviews', list); return rec; },

    /* favourites */
    favs: () => read('favs', []),
    isFav: (id) => Store.favs().includes(id),
    toggleFav(id) {
      const f = Store.favs();
      const on = !f.includes(id);
      write('favs', on ? f.concat(id) : f.filter((x) => x !== id));
      return on;
    },

    reset() {
      try { Object.keys(localStorage).filter((k) => k.indexOf(PREFIX) === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
      Object.keys(memory).forEach((k) => delete memory[k]);
      seed();
    }
  };

  window.TDI_STORE = Store;
})();
