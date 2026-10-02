# Current status

Last updated: 3 October 2026.

## Phase

Phase 2: repository, documentation and environments. Task P2-01 (repository skeleton and quality gates) is complete. The architect reviewed it on 3 October 2026 and approved D-020 to D-022; the owner merges after review. GitHub Actions passed on the pull request (lint, format, type check, tests, dependency audit, secret scan).

## Done

- Phase 0: public site audit and read-only Shopify Admin audit of justbookify.in. See `SHOPIFY_AUDIT.md`.
- Phase 1: the owner approved twelve decisions. See `DECISIONS.md` and `PRODUCT_REQUIREMENTS.md`.
- Project documentation written.
- P2-01: private GitHub repository `justbookify-india-app`; Expo SDK 57 app with Expo Router, TypeScript strict and one placeholder screen; ESLint, Prettier, Jest and React Native Testing Library; typed store configuration in `src/config/`; `.env.example` with empty placeholders; `.gitignore` for env files, signing files, keystores and service-account files; CI workflow (lint, format check, type check, tests, dependency audit, secret scan). Versions are recorded in D-020.

## What works

- `npm run lint`, `format:check`, `typecheck`, `test` (38 tests) and `audit:gate` pass locally.
- `npx expo-doctor` passes 21 of 21 checks.
- The app bundles for iOS and Android with Metro, and the dev server serves a bundle that contains the placeholder screen.
- The app config gives the right name and app ID for `development`, `staging` and `production`, and refuses an unknown `APP_ENV`.

## Not done

- The app has not been run on a phone or an emulator. No device was available to the build agent; the placeholder screen is covered by a component test and by the bundle check above.
- No Shopify development store yet. `.env.example` values are blank, so `getStoreConfig()` throws until they are filled in. Nothing calls it yet.
- No store additions made. The Headless channel is not installed.
- No Firebase, Sentry or Expo accounts created. No EAS configuration (out of scope for P2-01).
- No access to the Apple or Google developer accounts yet (see D-019).
- Branch protection on `main` is not switched on (`SECURITY.md` requires it). It changes repository settings, so it waits for the owner.

## Known issues

- `npm audit` reports 15 findings, all in Expo's own dependencies. One is high (`node-forge`, GHSA-86w9-cpqp-85rv, reached only through the Expo CLI's local code signing; no patched release exists). It is on the gate's allowlist until 2026-12-31 and is re-checked at every Expo upgrade (D-022, approved). Two are moderate and not gated: `uuid` through the Expo config plugin tooling, and `decode-uri-component` through Expo Router's `query-string`. The second is risk 17 in `RISKS.md`: it must be fixed or mitigated before deep links are enabled in Phase 12. The major upgrade is deferred.
- Icons and splash image are the Expo placeholders. They must be replaced before any store build.
- The store configuration's fee field names come from `SHOPIFY_AUDIT.md` and R4. The free-delivery threshold is ₹200 for prepaid orders (D-023). It is a hint only, set through `EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD`, and not written in code.
- `userInterfaceStyle` is fixed to light until a dark theme is designed.

## Last passing build

P2-01 branch `feat/p2-01-repository-skeleton`, local run on 3 October 2026. The GitHub Actions result is shown on the pull request.
