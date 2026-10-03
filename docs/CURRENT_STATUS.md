# Current status

Last updated: 3 October 2026.

## Phase

Phase 2: repository, documentation and environments. P2-01 (`de4701f`) and P2-02 (`e676f66`) are merged. P2-03 (first Android development build) is on branch `feat/p2-03-dev-build`, awaiting review.

## Done

- Phase 0: public site audit and read-only Shopify Admin audit of justbookify.in. See `SHOPIFY_AUDIT.md`.
- Phase 1: the owner approved twelve decisions. See `DECISIONS.md` and `PRODUCT_REQUIREMENTS.md`.
- Project documentation written.
- P2-01: private GitHub repository `justbookify-india-app`; Expo SDK 57 app with Expo Router, TypeScript strict and one placeholder screen; ESLint, Prettier, Jest and React Native Testing Library; typed store configuration in `src/config/`; `.env.example` with empty placeholders; `.gitignore` for env files, signing files, keystores and service-account files; CI workflow (lint, format check, type check, tests, dependency audit, secret scan). Versions are recorded in D-020.
- P2-02:
  - The owner created the development store (Basic plan, owner-reported; currency INR), installed the Headless channel and published sample products to it.
  - The store configuration carries the public Storefront token, and refuses Shopify secret-token prefixes. The Storefront API is pinned to `2026-10` (D-025).
  - `.env.local` holds the development store's values. It is gitignored and never committed.
  - `npm run check:dev-store` passed on 3 October 2026: `getStoreConfig()` returns a valid configuration, the store's currency (INR) matches, and 3 products were read over Storefront API `2026-10`.
  - The six early checks are classified by whether they need a real phone (checks 1 and 5 do). None was run; they belong to Phase 3. See `SHOPIFY_INTEGRATION.md`.
  - Decisions D-024 (cash-on-delivery figures are hints), D-025 (token and API version), D-026 (review rule) and D-027 (`braces` allowlist entry). `CLAUDE.md` gained the merge rule and the rule never to call the Shopify Admin MCP tools.
- P2-03:
  - `expo-dev-client` 57.0.19 installed and pinned; `eas.json` with `development`, `staging` and `production` profiles that set only `APP_ENV` (D-028).
  - EAS project `@hemant6626/justbookify-india` on the owner's personal Expo account; owner and project ID in `app.config.ts`.
  - EAS generated the Android keystore for `com.justbookify.india.dev` and keeps it; no keystore on this machine or in the repository (D-029).
  - Android development build 34b4b82c (version 1.0.0, version code 1) finished on EAS on 3 October 2026.
  - `eas build:inspect` showed the upload holds no `.env.local`, keystore or credential file; the store's domain and token appear in neither the upload nor the repository.
  - The placeholder screen shows "Store configuration: configured" or "not configured" on non-production builds, never the values.

## What works

- `npm run lint`, `format:check`, `typecheck`, `test` (53 tests) and `audit:gate` pass locally. `npx expo-doctor` passes 21 of 21 checks.
- The Android development build runs on the owner's Android phone (3 October 2026). It installed from EAS, loaded JavaScript from `npx expo start --dev-client` on this machine over Wi-Fi, and showed "JustBookify", "Development build" and "Store configuration: configured" (owner-reported; Metro logged the Android bundle).
- `npm run check:dev-store` passes against the development store, It fails cleanly, without printing the token or the domain, when `.env.local` is missing, when the currency does not match, when the token is wrong (HTTP 401) or looks like a secret token, and when the host cannot be reached.
- From P2-01: `npx expo-doctor` passed 21 of 21 checks; the app bundles for iOS and Android with Metro; the app config gives the right name and app ID for each `APP_ENV`.

## Not done

- **Branch protection on `main`.** GitHub refused on 3 October 2026 (HTTP 403: "Upgrade to GitHub Pro or make this repository public"). As instructed, the plan and the visibility were not changed. The merge rule in `CLAUDE.md` is the gate (risk 18, D-026).
- The development store's plan is owner-reported. The public Storefront token cannot read it; confirm it through the Admin API's `shop.plan` once the backend custom app exists.
- The development store does not yet have the ACOD and SMART Checkout Rules apps that early check 2 needs.
- iOS development build: waits for Apple access (D-019).
- No store additions on the live store. No Firebase or Sentry accounts. No access to the Apple or Google developer accounts yet (D-019).
- Storefront operations are not yet typed through code generation; that comes with the data layer, and the code generator is a dependency that needs a decision.

## Known issues

- `npm audit` reports a high advisory, GHSA-vfj7-8cjw-p6xm (CVE-2026-93687, stack exhaustion through deeply nested brace patterns) in `braces` 3.0.3. Every version is affected and no patched release exists; an upstream fix is in progress. GitHub updated the advisory on 2 October 2026, which made `main` fail the gate. `braces` comes in only through `micromatch` 4.0.8, used by Jest, Metro's file map and the Expo CLI: developer and build tooling that matches file paths and is never bundled into the app. It is allowlisted until **2026-11-15** (D-027). Remove the entry in the same commit that picks up a patched `braces`.
- `npm audit` also reports, as before: `node-forge` (high, allowlisted until 2026-12-31, D-022); `uuid` and `decode-uri-component` (moderate, not gated; the second is risk 17).
- Icons and splash image are the Expo placeholders. They must be replaced before any store build.
- Every fee in the store configuration is a cart hint: prepaid ₹75, cash on delivery ₹125 plus the ACOD app's own fee of unknown amount, free prepaid delivery from ₹200 (D-023, D-024). Checkout sets the final amount.
- `userInterfaceStyle` is fixed to light until a dark theme is designed.

## Last passing build

P2-03 branch `feat/p2-03-dev-build`, 3 October 2026: lint, format check, type check, tests, audit gate and `expo-doctor` pass locally; EAS Android development build 34b4b82c finished and runs on the owner's phone. The GitHub Actions result is shown on the pull request.
