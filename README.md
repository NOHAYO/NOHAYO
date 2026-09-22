# The Plan — Lifelong Development Companion (Android MVP)

A native Android build of the "Lifelong Development Companion" product described in
NOHAYO's `Lifelong_Development_Companion_OnePager`, `lifelong-companion-drd.md`,
`Step1-Validation-Scope-Brief`, and the `Design.pdf` visual spec.

This is the **MVP slice as scoped by the DRD (§47)**: single-child family accounts,
parent-led onboarding and observation logging, a rule-based insight/recommendation
engine over four domains (personal development, learning, independence, social
relationships), and a basic Timeline — built to match the "parent tool, warm
neutrals" visual language and screen flows in `Design.pdf` (Today, New moment,
Timeline, Insights, Insight detail, Family).

## Product principles carried into the build

- Never a score or a label — capability is shown as narrative change over time.
- Every insight cites the exact logged moments behind it ("Why am I seeing this?").
- Insights are three-tier confidence hypotheses ("Emerging / Consistent /
  Well-supported pattern"), never verdicts.
- No cross-child comparison, no streaks or leaderboards.
- Data stays on-device in this build (see Limitations).

## Architecture

- **Language**: plain Java (no third-party libraries) — see "Toolchain" below for why.
- **UI**: built entirely in code (no XML layouts) via `ui/UiKit.java`, a small
  reusable set of primitives (cards, chips, buttons, confidence dots) matching the
  design system extracted from `Design.pdf` (cream background, terracotta primary,
  green insight accent, large corner radii, serif headlines).
- **Navigation**: `MainActivity` is a single Activity hosting a manual screen
  stack (`ui/Screen`) and a 5-tab bottom nav (Today, Timeline, Insights, Journal,
  Family), matching the mockups' navigation.
- **Data**: `db/DbHelper` + `db/Repository` — a small SQLite-backed, append-only
  event log (`moment` table) with derived `insight`, `goal`, `journal_entry`, and
  `family_member` tables, mirroring DRD §8's "event log is the source of truth,
  profile is a computed view" model.
- **Insight engine**: `engine/InsightEngine.java` — a deterministic, fully
  explainable stand-in for DRD §9's insight-generation engine. It notices when a
  domain accumulates 2+ logged moments and turns that into a hypothesis-worded
  insight citing the specific evidence, with a 3-tier confidence label. No ML/LLM
  call is made; there is no network access in this build.

## Screens implemented

Onboarding (welcome → consent → about your child → family) · Today · New moment ·
Timeline (All/Moments/Insights filters) · Insights list · Insight detail (evidence,
confidence, "try a next step" → seeds a Goal, "not helpful" → dismiss) · Goals ·
Journal (private) · Family (roles, invite) · Settings & privacy (principles,
reset data).

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
lambda syntax used throughout for that floor.

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
  build/dex/sign/verify pipeline and manifest/badging inspection, not by tapping
  through it on a screen. Please sideload and click through before treating any
  specific screen as final.
- **Local-only storage.** All data lives in a local SQLite database on-device;
  there is no backend, sync, multi-device support, or real authentication yet —
  those are Phase 2+ per the DRD roadmap.
- **Insight engine is a rule-based placeholder** for the DRD's fuller
  retrieval-augmented insight/recommendation architecture (§19–20), scoped down to
  something explainable and fully offline.
- **No adolescent privacy engine, Capability Map, or Life Development Map** —
  explicitly Phase 2/3/4 per DRD §48, out of MVP scope.
