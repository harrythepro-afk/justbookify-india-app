# Current status

Last updated: 4 October 2026 (P4-02: crash reporting with Sentry and the Android navigation buttons fix; awaiting review. P4-03 proposed).

## Phase

Phase 4 (mobile foundation) is in progress. P4-01 (`df35fa0`, PR #7) is merged. P4-02 (this change, branch `feat/p4-02-sentry`, PR #8) adds crash reporting with Sentry and fixes the Android navigation buttons; `NEXT_TASK.md` proposes P4-03. Phase 3 is complete on Android. P3-01 (`874b4c2`), P3-02 (`79d5466`) and P3-03 (`9d561d9`, PR #6) are merged. P3-03 re-planned the remaining early checks and recorded the roadmap and design direction: early checks 1a and 1b move to an owner-approved launch rehearsal on the live store in Phase 19 (D-033), checks 3 to 6 move to the phases that build their features (D-034), and phases are numbered 0 to 20 in `ROADMAP.md` (D-035). Phase 2 is complete: P2-01 (`de4701f`), P2-02 (`e676f66`) and P2-03 (`762ddef`) are merged.

## Done

- Phase 0: public site audit and read-only Shopify Admin audit of justbookify.in. See `SHOPIFY_AUDIT.md`.
- Phase 1: the owner approved twelve decisions. See `DECISIONS.md` and `PRODUCT_REQUIREMENTS.md`.
- Project documentation written.
- P2-01: private GitHub repository `justbookify-india-app`; Expo SDK 57 app with Expo Router, TypeScript strict and one placeholder screen; ESLint, Prettier, Jest and React Native Testing Library; typed store configuration in `src/config/`; `.env.example` with empty placeholders; `.gitignore` for env files, signing files, keystores and service-account files; CI workflow (lint, format check, type check, tests, dependency audit, secret scan). Versions are recorded in D-020.
- P2-02:
  - The owner created the development store (a development store with Basic-plan features; currency INR), installed the Headless channel and published sample products to it.
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
- P3-01 (merged, `874b4c2`):
  - `@shopify/checkout-sheet-kit` 3.9.1 installed and pinned (D-030). D-017's 4.0.x is not published; the owner chose 3.9.1 on 3 October 2026. No Expo config plugin.
  - Development-only test screen `src/app/dev-checkout.tsx`. It builds a one-item cart with two named Storefront operations (`src/shopify/devCheckout.ts`) and presents the checkout URL in Checkout Kit. It shows completed, closed or error status, never the URL, domain or token. Any other build is redirected to the start screen. The placeholder screen links to it on development builds only.
  - Android development build bb476119 built on EAS on 3 October 2026. `eas build:inspect` showed that the upload holds no `.env.local`, keystore or credential file, and neither the store's domain nor its token.
  - `SHOPIFY_INTEGRATION.md` and `TESTING.md` split early check 1 into 1a (Razorpay test mode, development store) and 1b (UPI Intent, live mode only, at an owner-approved launch rehearsal).
  - EAS Android development build bb476119 finished on 3 October 2026, so Checkout Kit 3.9.1 compiles natively on Expo SDK 57 / React Native 0.86.3.
  - On-device check with the owner, 3 October 2026: **passed.** The development store's checkout sheet first shows the store's password page. The tester enters the storefront password; this page does not exist on the live store. Checkout appeared only after the sheet was closed and "Open test checkout" tapped again. The owner completed a cash-on-delivery test order. The status line showed "Checkout completed: the order was placed." The order appears in the development store's admin (owner-confirmed). Details in `SHOPIFY_INTEGRATION.md`.

- P3-02 (merged, `79d5466`):
  - The owner installed ACOD and SMART Checkout Rules on the development store and copied the live settings (D-031). ACOD's plan screen was a never-billed test charge (D-032).
  - D-031 corrects D-024: ACOD adds no fee; the shipping discount takes ₹75 off both rates from ₹200. R4 and `SHOPIFY_AUDIT.md` updated.
  - Both apps' App Store listings say they run on Shopify Functions; neither mentions Checkout Kit. Shopify's Checkout Kit page says Functions run inside Checkout Kit as on the web.
  - The test screen now lists the development store's books with a quantity stepper and shows Shopify's cart subtotal, so each cart bracket can be reached. Tests cover it.
  - On-device check with the owner, 3 October 2026: **passed on all seven cases** (details in `SHOPIFY_INTEGRATION.md`). Rates ₹75 and ₹125 under ₹200; ₹75 off both from ₹200 (prepaid free, cash on delivery ₹50); ACOD shows Cash on Delivery payment only with the Cash on Delivery rate; R2 blocks a ₹539 cart; R3 blocks Maharashtra 400001; a ₹540 cash-on-delivery order (₹490 subtotal) completed, the app received `completed`, and the owner saw it in the development store's admin. R2 and ACOD's ₹500 limit both check the subtotal. Risk 1 is open for iOS only.
- P3-03 (merged, `9d561d9`): documentation only.
  - D-033: early check 1a is not run on the development store. Razorpay is offered only to stores with an Indian business entity; the development store's is in Bahrain, and changing it needs the owner's personal identity details, which the owner declined to enter for a test store. Checks 1a and 1b both run at an owner-approved launch rehearsal on the live store with one small real order. Risk 2 stays open and high. Mitigation, built with the checkout screens: a remote feature flag switches checkout between the Checkout Kit sheet and the system browser with a return link, so a failure at the rehearsal needs no rebuild.
  - D-034: check 3 moves to Phase 7 (login), check 4 to Phase 10 (backend), check 5 to Phase 12 (deep links), check 6 to Phase 13 (reviews).
  - D-035: `ROADMAP.md` numbers the phases 0 to 20, linked from `CLAUDE.md`.
  - D-036 replaces D-019: Apple developer access in Phase 9 (at the latest before Phase 12, for push); Google Play access in Phase 18.
  - D-037: version 1 follows the website's colours, fonts, wording and section order; every visual value is a design token; five tabs (Home, Browse, Cart, My Books, Account); screen layouts for Home, the book card, Browse and My Books recorded in `PRODUCT_REQUIREMENTS.md`. Scope (D-001) unchanged.
  - D-038: brand colours and fonts read from justbookify.in's public pages (read only). Every text pair the site uses passes WCAG AA except cream on green; the adjusted green `#3E7916` is proposed for the owner to confirm.
  - `SHOPIFY_INTEGRATION.md`, `RISKS.md`, `TESTING.md`, `PRODUCT_REQUIREMENTS.md` and `NEXT_TASK.md` updated to match.

- P4-01 (merged, `df35fa0`):
  - D-039: the owner confirmed the greens. Text on the brand green `#9DE46D` is dark maroon, never cream; a green that carries light text or stands alone is `#3E7916`.
  - D-040: tab icons from `@react-native-vector-icons/ionicons` 13.1.4. Expo's icon guide (read 3 October 2026) says `@expo/vector-icons` "will be deprecated and is not recommended"; the owner chose Expo's recommended replacement, which is maintained by its community, not by Expo.
  - D-041: Asul and Archivo from `@expo-google-fonts/asul` 0.4.1 and `@expo-google-fonts/archivo` 0.4.2, loaded at runtime with `expo-font` 57.0.4 (already in the app through `expo`, now a direct dependency). No config plugins, so no new native build.
  - `src/theme/tokens.ts`: the D-038 colours as named roles, the text pairs the tokens allow, fonts (one family per face), type sizes, spacing, radius and icon size. `src/theme/contrast.ts` computes WCAG contrast.
  - A lint rule fails any colour literal in `src/` outside `tokens.ts`. The test checkout screen moved to tokens too.
  - Five tabs (Home, Browse, Cart, My Books, Account) with placeholder screens in `src/app/(tabs)/`; filled icon for the active tab, outline for the others.
  - `EnvironmentBanner` above the navigator on development and staging builds: environment name and store configuration status, never values. Nothing on production. The store configuration line moved there from the old start screen.
  - The test checkout link stays on Home, development builds only.
  - On-device check with the owner, 3 October 2026, development build bb476119 with JavaScript from Metro (one Android bundle, 1,488 modules, no errors or warnings): the app shows the banner ("Development build", "Store configuration: configured"); all five tabs show icon and label and open their screens, with the active tab filled and in maroon; headings are in Asul and body text in Archivo (owner screenshots). The Home link opens the test checkout screen, styled from the tokens, below the banner; it lists the development store's books and shows "Ready." **No new EAS build was needed.** The expo-dev-client menu button sits over the banner's right edge on development builds; it is not part of the app.
  - 124 tests (38 new).

- P4-02 (awaiting review):
  - D-042: `@sentry/react-native` **8.29.0**, chosen by the owner over the `~7.11.0` that Expo SDK 57 lists (released before React Native 0.86; the 7.x line has had no release since February). It is listed in `expo.install.exclude`, so `expo-doctor` passes. The config plugin points at the EU region, organisation `justbookify`, project `react-native`; `metro.config.js` uses `getSentryExpoConfig`.
  - The DSN is `EXPO_PUBLIC_SENTRY_DSN`, read through `src/config/crashReporting.ts`; it is public by design, in `.env.local`, and an empty placeholder is in `.env.example`. Crash reporting is off with no DSN, with a malformed DSN, and always under Jest.
  - Sentry starts once in the root layout and reports errors only: no personal data, tracing, replay, screenshots, view hierarchy, logs or failed-request capture, and no `Sentry.wrap`.
  - `src/crashReporting/scrub.ts` runs as `beforeSend` and `beforeBreadcrumb`. It removes the user, server name, request headers, cookies, body and query, the device name, frame variables and console breadcrumbs. In every remaining string it filters emails, phone numbers, Shopify secret tokens, bearer tokens, JWTs, long token-like strings, customer and order GIDs, URL and path query strings, `*.myshopify.com` hosts, and the configured store domain and Storefront token.
  - Home has two development-only controls: send a handled test error, and trigger Sentry's native test crash.
  - D-043: `expo-system-ui` 57.0.4 makes `userInterfaceStyle: 'light'` take effect on Android. Without it the app followed the phone's dark theme, and React Native's edge-to-edge setup asked for light navigation buttons over the off-white screens.
  - The owner created the upload token in Sentry and stored it in EAS as `SENTRY_AUTH_TOKEN` (Secret, development, preview and production). Claude checked it by name only; the value never reached the repository, `.env` files or chat. The owner switched on Sentry's server-side data scrubbing and "Prevent Storing of IP Addresses".
  - Secret scan: gitleaks first flagged made-up token-shaped fixtures in `scrub.test.ts`. They carry `gitleaks:allow` on their lines, and the scan configuration is unchanged. The feature branch was rewritten so no commit holds an unmarked fixture.
  - EAS Android development build aa4e95c7 finished on 4 October 2026. `eas build:inspect` showed no `.env.local`, keystore or Sentry credential file in the upload, and neither the store's domain nor its token.
  - On-device check with the owner, 4 October 2026, build aa4e95c7 with JavaScript from Metro (no errors in the Metro log):
    - Navigation buttons: **passed.** They are dark on the off-white screens with the phone in dark theme.
    - Test error: **passed.** Issue REACT-NATIVE-1 arrived with environment `development`, release `1.0.0 (1)` of `com.justbookify.india.dev`, and a readable stack trace with source lines (`sentry.ts:54`, the Home button at `index.tsx:41`). Breadcrumbs held only device and app-lifecycle events; the device ID showed `[Filtered]`; no email, store domain or token was seen. The owner sent the event's raw JSON. It holds no IP address (`infer_ip: never`), user identifier, store domain, token, email or URL. Two fields are added by Sentry's server after the scrubber:
      - "Name: Redmi Note 12 Pro 5G" is the marketing name Sentry looks up from the model code `22101316I` (Relay's `ANDROID_MODEL_NAMES` table). It is not the phone's own name, which the scrubber would remove (checked against the event's exact device data).
      - `user.geo` held a city and state, derived from the connecting address; that geo-only user is the one user Sentry counted. The owner added two Advanced Data Scrubbing rules in the Sentry project (Remove `user.geo.city`, Remove `user.geo.subdivision`). A second test error kept only the country (`IN`).
    - Native crash: **not provable on a development build.** `Sentry.nativeCrash()` throws on React Native's native-modules thread. In a development build React Native hands that exception to the dev client (`ReactHostImpl.handleHostException` → `DevLauncherBridgelessDevSupportManager`), which shows "There was a problem loading the project". It never reaches Android's crash handler, where Sentry records native crashes, so no report exists. In staging and production builds React Native rethrows it (`DefaultReactHostDelegate`), and Sentry records it. Owner's decision: verify the native crash, together with the source-map upload, at the first staging build. The full explanation is in `TESTING.md` ("Crash report checks").
  - Release gate (architect's review of PR #8, recorded in `TESTING.md` and as risk 19): no build goes to any tester other than the owner until, on a staging build, a real native crash arrives in Sentry, source maps upload and the stack trace is readable, and the raw crash event shows no IP address, city, device ID, store domain or token.

## What works

- `npm run lint`, `format:check`, `typecheck`, `test` (86 tests) and `audit:gate` pass on `main` after P3-02. `npx expo-doctor` passes 21 of 21 checks.
- The Android development build runs on the owner's Android phone (3 October 2026). It installed from EAS, loaded JavaScript from `npx expo start --dev-client` on this machine over Wi-Fi, and showed "JustBookify", "Development build" and "Store configuration: configured" (owner-reported; Metro logged the Android bundle).
- `npm run check:dev-store` passes against the development store, It fails cleanly, without printing the token or the domain, when `.env.local` is missing, when the currency does not match, when the token is wrong (HTTP 401) or looks like a secret token, and when the host cannot be reached.
- From P2-01: `npx expo-doctor` passed 21 of 21 checks; the app bundles for iOS and Android with Metro; the app config gives the right name and app ID for each `APP_ENV`.

## Not done

- **Branch protection on `main`.** GitHub refused on 3 October 2026 (HTTP 403: "Upgrade to GitHub Pro or make this repository public"). As instructed, the plan and the visibility were not changed. The merge rule in `CLAUDE.md` is the gate (risk 18, D-026).
- The development store is a development store with Basic-plan features. Development stores cannot remove the storefront password. The public Storefront token cannot read the plan; confirm it through the Admin API's `shop.plan` once the backend custom app exists.
- No prepaid checkout has been tested. Razorpay cannot be installed on the development store (business entity in Bahrain), so early check 1a waits, with 1b, for the launch rehearsal (D-033). Risk 2 is open and high. ACOD and SMART Checkout Rules were installed on the development store by the owner on 3 October 2026 for P3-02. P3-02's test order left the book "Harry potter" at a stock of 0 there; the owner can restock it.
- Launch rehearsal (early checks 1a and 1b, Phase 19): not scheduled. It needs the Headless channel and published products on the live store (owner's go-ahead, D-008), a build pointing at the live store, the checkout presentation flag, and Apple access for the iPhone half. See `SHOPIFY_INTEGRATION.md`.
- Early checks 3 to 6 wait for their features: Phase 7 login, Phase 10 backend, Phase 12 deep links, Phase 13 reviews (D-034, D-035).
- The checkout presentation flag (D-033): not built. Its plumbing is in Phase 4; its use comes with the checkout screens in Phase 9.
- iOS development build: waits for Apple access, requested in Phase 9 (D-036).
- No store additions on the live store. No Firebase account. No access to the Apple or Google developer accounts yet (D-036: Apple in Phase 9, Google Play in Phase 18).
- Sentry, still unproven (release gate in `TESTING.md`, risk 19; no build to any tester other than the owner until it passes): the native-crash report and the source-map upload. Sentry's upload script skips debug variants, and a development build's dev client catches native crashes. Both are checked at the first staging build, which also needs `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for that environment.
- Storefront operations are not yet typed through code generation; that comes with the data layer, and the code generator is a dependency that needs a decision.

## Known issues

- Checkout Kit 3.9.1 ships its TypeScript source as its types, so the type check reads it. `src/types/error-capture-stack-trace.d.ts` declares `Error.captureStackTrace` (present in Hermes), which that source uses. Remove the file if a later release ships compiled types.

- `npm audit` reports a high advisory, GHSA-vfj7-8cjw-p6xm (CVE-2026-93687, stack exhaustion through deeply nested brace patterns) in `braces` 3.0.3. Every version is affected and no patched release exists; an upstream fix is in progress. GitHub updated the advisory on 2 October 2026, which made `main` fail the gate. `braces` comes in only through `micromatch` 4.0.8, used by Jest, Metro's file map and the Expo CLI: developer and build tooling that matches file paths and is never bundled into the app. It is allowlisted until **2026-11-15** (D-027). Remove the entry in the same commit that picks up a patched `braces`.
- `npm audit` also reports, as before: `node-forge` (high, allowlisted until 2026-12-31, D-022); `uuid` and `decode-uri-component` (moderate, not gated; the second is risk 17).
- Icons and splash image are the Expo placeholders. They must be replaced before any store build.
- Every fee in the store configuration is a cart hint: prepaid ₹75, cash on delivery ₹125, and ₹75 off either from a cart total of ₹200, so free prepaid and ₹50 cash on delivery (D-023, D-031; the ACOD app adds no fee, correcting D-024). The configuration does not yet carry the ₹75 discount amount; that comes with the cart screens. Checkout sets the final amount.
- `userInterfaceStyle` is fixed to light until a dark theme is designed. Since D-043 it is enforced on Android too, by `expo-system-ui`.
- npm 11 on this machine skips package install scripts it has not been told to allow, including `@sentry/cli`'s postinstall. `@sentry/cli` 3.x ships its binary as optional platform packages, so it is still installed; `@sentry/bundler-plugins` also brings `@sentry/cli` 2.58.6, which the React Native build does not use.

## Last passing build

Branch `feat/p4-02-sentry` (P4-02), 4 October 2026: lint, format check, type check, tests (189), audit gate and `expo-doctor` (21 of 21) pass locally, and CI (checks plus secret scan) is green on PR #8. Android development build aa4e95c7 runs it on the owner's phone.

`main` at `df35fa0` (P4-01), 4 October 2026: CI was green on PR #7's latest commit before the merge.

Branch `feat/p4-01-app-shell` (P4-01), 3 October 2026: lint, format check, type check, tests (124), audit gate and `expo-doctor` (21 of 21) pass locally; CI runs on its pull request. Android development build bb476119 runs it on the owner's phone.

`main` at `79d5466` (P3-02), 3 October 2026: lint, format check, type check, tests (86), audit gate and `expo-doctor` pass, and CI was green on PR #5's latest commit before the merge. Android development build bb476119 (P3-01) runs that JavaScript on the owner's phone. `main` at `9d561d9` (P3-03) changed documentation only; CI was green on PR #6 before the merge.
