# The Plan — Lifelong Development Companion

The "Lifelong Development Companion" product described in NOHAYO's
`Lifelong_Development_Companion_OnePager`, `lifelong-companion-drd.md`,
`Step1-Validation-Scope-Brief`, and the `Design.pdf` visual spec, built two ways:

- **[`app/`](app/) — the Android app** (this document): all five `Design.pdf`
  age-skins, offline, SQLite-backed.
- **[`web/`](web/README.md) — the website**: an Express + PostgreSQL backend with
  real multi-user accounts, and a React web app (installable on iPhone as a PWA)
  implementing the same parent-tool MVP flow against shared, server-side data.
  The Android app and the website are two separate clients today (each with its
  own local data); `web/README.md`'s "Known gaps" section covers what it would
  take to point the Android app at this same backend.

## Android app

A native Android build of the product above.

This build covers **all five age-adaptive "skins" from `Design.pdf`** ("Five skins,
one system"), not just the MVP parent-tool slice: the same on-device record (event
log, insights, goals, journal, family) viewed through six different lenses that
change who owns the account, what they see, and how the app looks, exactly as the
design brief frames it.

## The six modes

| Mode | Ages | Who owns it | Tabs |
|---|---|---|---|
| **Parent tool** | 0–12 | Parent | Today, Timeline, Insights, Journal, Family |
| **Garden** | 4–7 (child's own view) | — | Today, My Garden, Grown-ups |
| **Notebook** | 7–12 (child's own view) | — | Today, Goals, Journal, My Story |
| **Own space** | 12–18 | Shared → teen-led | Today, Timeline, Insights, Goals, Journal |
| **Companion** | 18–55 | The person, alone | Today, Timeline (Life development map), Insights (Capability map), Goals, Journal |
| **Legible** | 55–120 | The person | Today, Life story, Goals, Journal |

Opening the app picks the mode that actually owns the account at the seeded child's
current age (DRD §4); Garden/Notebook are always an explicit "preview as the child"
choice, reachable from **Settings → Preview a different life stage**, or from a
"⚙ Preview a different life stage" link at the bottom of any mode's last tab. The
picker (`ModePickerScreen`) also holds the two life-stage *moments* that aren't full
modes: the 18th-birthday ownership-transfer screen (DRD §26) and, from inside
Companion mode's life-events menu, starting a brand-new child's profile from an
adult's own account (DRD §48, multi-generational support) — which really does
create a second on-device profile and switches into it.

## Product principles carried into the build

- Never a score or a label — capability is shown as narrative change over time.
- Every insight cites the exact logged moments behind it ("Why am I seeing this?").
- Insights are three-tier confidence hypotheses ("Emerging / Consistent /
  Well-supported pattern"), never verdicts.
- No cross-child comparison, no streaks or leaderboards.
- Privacy moves with age: Own-space journal entries get a "companion reflection" and
  explicit per-entry share/learn controls instead of parent visibility.
- Data stays on-device in this build (see Limitations).

## Architecture

- **Language**: plain Java (no third-party libraries) — see "Toolchain" below for why.
- **UI**: built entirely in code (no XML layouts) via `ui/UiKit.java`, a small
  reusable set of primitives (cards, chips, buttons, confidence dots, toggles)
  matching the design system extracted from `Design.pdf`. Each mode gets its own
  accent/tint pair in `ui/Theme.java` (terracotta, garden/notebook green, own-space
  blue, companion teal, legible amber, plus plum for life-transition moments).
- **Navigation**: `MainActivity` hosts a manual screen stack (`ui/Screen`) and a
  bottom nav whose tab count, icons, and colors are rebuilt per `ui/Mode` on the
  fly (`switchMode`/`switchModeTab`). `ui/Mode` is an enum holding each skin's
  tab layout and a `ScreenFactory[]` wiring each tab to its root screen class —
  several screens (`TimelineScreen`, `InsightsScreen`) are reused unmodified across
  modes since the design keeps insight/domain coloring mode-independent; Goals and
  Journal have generic, accent-parametrized versions (`TabGoalsScreen`,
  `TabJournalScreen`) reused by Own space/Companion/Legible.
- **Data**: `db/DbHelper` + `db/Repository` — a small SQLite-backed, append-only
  event log (`moment` table) with derived `insight`, `goal`, `journal_entry`, and
  `family_member` tables, mirroring DRD §8's "event log is the source of truth,
  profile is a computed view" model. `child` now supports multiple rows for the
  multi-generational flow.
- **Insight engine**: `engine/InsightEngine.java` — a deterministic, fully
  explainable stand-in for DRD §9's insight-generation engine. It notices when a
  domain accumulates 2+ logged moments and turns that into a hypothesis-worded
  insight citing the specific evidence, with a 3-tier confidence label. No ML/LLM
  call is made; there is no network access in this build.

## Screens implemented

**Onboarding**: welcome → consent → about your child → family.
**Parent tool**: Today, New moment, Timeline, Insights, Insight detail, Goals, New
goal, Journal, New journal entry, Family, Invite family member, Settings & privacy.
**Garden** (4–7): Today (big-button logging + "say it out loud"), My Garden
(non-numeric per-domain "plots"), Grown-ups.
**Notebook** (7–12): Today (daily question, "new for you" nudge, goal/journal
previews), Goals, Journal, My Story.
**Own space** (12–18): welcome/privacy-education screen, Today, Timeline, Insights,
Insight detail, Goals, Journal, Journal-entry detail (companion reflection, share
controls, "let the companion learn" toggle), Life events (first job / driving /
study path / national service, stepped guide).
**Companion** (18–55): Today, Life development map, Capability map, Goals, Journal,
Life-events menu, Career orientation (illustrative two-offer comparison), Parenthood
(starts a real second child profile).
**Legible** (55–120): Today ("say it"/"write it"), Life story (voice-first list +
record a story), Goals, Journal.
**Transitions**: 18th-birthday ownership transfer. **Preview**: the life-stage/mode
picker and multi-child switcher.

## Toolchain note (why plain Java, why API 23)

This build environment's network policy blocks Google's Android SDK
infrastructure (`dl.google.com`, `maven.google.com`, `*.googlesource.com`), so the
usual `sdkmanager` / Android Gradle Plugin path wasn't available. The APK is
instead built with a small hand-rolled pipeline (`build.sh`) using:

- `android.jar` (API 23 / Android 6.0) and `aapt2` from Ubuntu's `android-sdk-*`
  packages (Debian's own AOSP build, installed via `apt`).
- **D8** (Google's real, official dexer/compiler) — `r8lib.jar` downloaded
  directly from Google's own CI storage bucket
  (`storage.googleapis.com/r8-releases`), which was reachable even though
  `dl.google.com` was not.
- `zipalign` and `apksigner` from the same `apt` packages, producing a
  v1+v2+v3-signed APK verified with `apksigner verify`.

Because the only available `android.jar` stub tops out at API 23, the app avoids
AndroidX/Jetpack Compose entirely (those require a much newer compile SDK) and is
written in plain Java against framework Views. `minSdkVersion` is 21 so it installs
on effectively any real Android device from Lollipop onward; D8 desugars the Java 8
lambda/method-reference syntax used throughout for that floor.

To rebuild:

```
./build.sh
```

Requires `aapt2`/`zipalign`/`apksigner` (`apt install android-sdk-build-tools
android-sdk-platform-23`) and `tools/r8lib.jar` (see the Toolchain note above for
the source) plus a `tools/debug.keystore` (`keytool -genkeypair -keystore
tools/debug.keystore -storepass android -keypass android -alias androiddebugkey
-keyalg RSA -keysize 2048 -validity 10000`).

## Known limitations of this build

- **No live device/emulator test.** This sandboxed environment has no Android
  emulator or attached device, so the APK was validated by a full, error-free
  build/dex/sign/verify pipeline, manifest/badging inspection, and careful manual
  code review — not by tapping through it on a screen. Please sideload and click
  through before treating any specific screen as final.
- **Local-only storage.** All data lives in a local SQLite database on-device;
  there is no backend, sync, real multi-user auth, or the age-gated server-side
  visibility enforcement DRD §27 calls for (this build's teen "private journal" is
  a UI convention, not a security boundary) — those are Phase 2+ per the roadmap.
- **Insight engine is a rule-based placeholder** for the DRD's fuller
  retrieval-augmented insight/recommendation architecture (§19–20), scoped down to
  something explainable and fully offline.
- **Career orientation and some later-life screens are illustrative**: they follow
  the exact `Design.pdf` mockup content rather than being derived from real logged
  data, since that narrative (two job offers, a specific life story) isn't
  something a generic seed profile can produce believably.
- The extreme 100–120 "Legacy/steward" 3-tab variant (`Design.pdf` p.27) is folded
  into the single 55–120 Legible mode rather than built as a seventh mode.
