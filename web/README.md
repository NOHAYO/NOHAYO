# The Plan — Website (backend + database + web app)

A real, working client-server counterpart to the Android app: a Node/Express API
backed by PostgreSQL, and a React web app that talks to it — implementing the same
"parent tool" MVP flow (Today, New moment, Timeline, Insights, Insight detail,
Goals, Journal, Family) against **shared, authenticated, server-side data** instead
of the Android app's on-device SQLite. The insight engine (`backend/src/engine/`)
is a line-for-line port of the Android app's rule-based engine, so the two clients
reason about a record the same way.

This is the piece that lets the Android app, the website, and (see "Running on
iPhone" below) an iPhone home-screen app all eventually point at the **same
backend and the same account** — "walking in parallel," as asked for — rather than
being three separate demos.

## Architecture

```
web/
  backend/     Express API + PostgreSQL (Drizzle ORM), JWT auth, the insight engine
  frontend/    React + Vite single-page app, installable as a PWA
  docker-compose.yml   db + backend + frontend, one command to run all three
```

**Backend** (`web/backend`)
- **Express** REST API, **PostgreSQL** via **Drizzle ORM** (pure-JS, no native
  binary downloads — chosen over Prisma for that reason) with SQL migrations
  checked into `src/db/migrations/`.
- **Auth**: real accounts (`bcryptjs` password hashing, `jsonwebtoken` JWTs) —
  a step beyond the Android app's single local profile, since a shared web
  surface needs real multi-user login.
- **Schema** (`src/db/schema.js`): `users`, `children`, `moments` (the append-only
  event log, DRD §8), `insights`, `goals`, `journal_entries`, `family_members` —
  the same shape as the Android app's SQLite tables, plus `owner_user_id` on
  `children` for real ownership.
- **Insight engine** (`src/engine/`): the exact same rule (2+ moments in a domain
  → a hypothesis-worded, evidence-linked insight with a 3-tier confidence label)
  as `android/app/src/.../engine/InsightEngine.java`, ported to JS so both
  clients would agree if they ever shared a backend.
- **Validation**: `zod` on every request body. **Tests**: `vitest` + `supertest`
  integration tests in `src/app.test.js` (auth, moment logging triggering an
  insight, and cross-user access control) — all passing against a live Postgres.
- Ownership is enforced server-side per request (`middleware/ownership.js`), not
  just hidden in the UI — a real (if MVP-scale) instance of DRD §27's "enforced
  at the data layer, not just the UI."

**Frontend** (`web/frontend`)
- **React 18 + Vite + react-router**, plain CSS using the same palette/metrics
  as the Android app's `Theme.java`/`UiKit.java` (cream background, terracotta
  primary, green insight cards, pill buttons, bottom tab bar) so it reads as the
  same product.
- **PWA** via `vite-plugin-pwa`: a web app manifest + service worker, so the site
  is installable to a phone's home screen with an app icon and no browser chrome
  — see "Running on iPhone" below.
- Verified with a real headless-browser run (login → Today → Timeline → Insights
  → Insight detail → Journal → Family) against the live backend, zero console
  errors, screenshots on request.

## Running it locally

**Without Docker** (what this session actually ran and tested):

```bash
# 1. Postgres
sudo apt install postgresql && sudo service postgresql start
sudo -u postgres psql -c "CREATE USER nohayo_app WITH PASSWORD 'nohayo_dev_pw';"
sudo -u postgres psql -c "CREATE DATABASE nohayo_companion OWNER nohayo_app;"

# 2. Backend
cd web/backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed        # creates demo@nohayo.com / password123 with sample data
npm run dev             # http://localhost:4000

# 3. Frontend, in another terminal
cd web/frontend
npm install
npm run dev              # http://localhost:5173
```

**With Docker** (not runnable inside this sandbox — no Docker daemon here — but
the compose file is written and ready):

```bash
cd web
docker compose up --build
# frontend: http://localhost:8080, backend: http://localhost:4000
```

## Running on iPhone — is there a method?

Yes, in two tiers, depending on how "real" you need it to be right now versus
later:

### 1. Today, with zero extra tooling: make this website a PWA (done)

The web app above is already configured as an installable Progressive Web App.
On an iPhone, open it in Safari and use **Share → Add to Home Screen**. That
gives:
- a real home-screen icon (no Safari chrome, `display: standalone`)
- offline caching of the app shell via the generated service worker
- the same login, same data, same backend as the website

This is not the App Store, and iOS PWAs have known limits (no push notifications
until fairly recently, no deep OS integration, Apple can be stricter about PWA
capabilities than Android), but it is a genuinely installable, icon-on-the-
home-screen "app" that exists today, requires no Mac, no Xcode, and no Apple
Developer Program membership — which is exactly what this sandbox can produce
and verify, unlike a native iOS build. If the near-term goal is "let a parent
install something on their iPhone to try this," this is the fastest real path.

### 2. Later, for the App Store: three real options, in order of fit

All three need a **Mac with Xcode** and an **Apple Developer Program
membership ($99/year)** to build, sign, and submit — this sandbox is Linux and
cannot produce or sign an `.ipa`, the iOS equivalent of the `.apk` built earlier,
the same way it isn't possible to run the Android SDK's own Google-hosted
toolchain here.

| Option | What it means | Trade-off |
|---|---|---|
| **Capacitor** wrapping this website | Take the React app already built here, wrap it in a thin native shell (Capacitor/Cordova), ship it to both app stores | Fastest path to "real" apps on both stores from code that already exists; still web-based under the hood, so native-feeling gestures/animations need extra work |
| **React Native rewrite** | Rewrite the UI in React Native, share business logic/API calls with the website | True native performance and platform feel; UI code is not reusable from either the website or the Android app as-is |
| **Native Swift/SwiftUI app** | A ground-up native iOS app, calling the same backend API | Best possible iOS experience; a fully separate codebase to build and maintain alongside the Android app |

Given the Android app was written in plain Java specifically because this
sandbox's network policy blocked the normal Android SDK, and that constraint
doesn't exist for iOS tooling decisions (this is a "need a Mac" limit, not a
network-policy one), **Capacitor around the website you already have** is the
pragmatic recommendation if/when native App Store presence matters: it reuses
everything built in `web/frontend` today instead of a third rewrite, and it's the
one of the three that doesn't require choosing a UI framework you haven't
already committed to twice.

## Known gaps / next steps

- **Family-member access isn't enforced yet.** `family_members` rows are
  recorded (invites, roles) but only the owning user can actually call the API;
  wiring co-parent/guardian/viewer-only email-based login is the natural next
  step (DRD §3, §27).
- **No password reset, email verification, or rate limiting** — add before any
  real user's data touches this.
- **No production deploy target configured.** `docker-compose.yml` is ready for
  a single VM; for real hosting, Render/Fly.io/Railway (backend + managed
  Postgres) and Vercel/Netlify/Cloudflare Pages (frontend) all work with this
  structure with minimal changes — ask if you want one wired up specifically.
- **Android app still uses local SQLite**, not this API. Pointing the Android
  build at this backend (swapping `db/Repository.java`'s SQLite calls for HTTP
  calls to this same API) is the concrete way to make the two "walk in
  parallel" on one shared account, rather than two separate demos of the same
  idea.
