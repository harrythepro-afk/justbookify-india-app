# Current status

Last updated: 7 October 2026 (P5-03: network awareness and a smaller development APK on branch `p5-03-network-and-apk-size`, PR #13; local checks, CI, EAS build 022646a4 and the on-device check pass; awaiting review. P6-01 proposed).

## Phase

Phase 4 (mobile foundation) is complete. P4-01 (`df35fa0`, PR #7), P4-02 (`f783367`, PR #8), P4-03 (`5e8827d`, PR #9) and P4-04 (`08f2273`, PR #10, analytics with opt-in consent) are merged. Phase 5 (Shopify data layer) is complete once P5-03 is merged: P5-01 (typed Storefront API client, `2f2b3e1`, PR #11) and P5-02 (app-wide query cache, `ac714e8`, PR #12) are merged; P5-03 (network awareness and a smaller development APK, PR #13) awaits review. `NEXT_TASK.md` proposes P6-01 (a sample catalogue in the development store), the start of Phase 6. Phase 3 is complete on Android. P3-01 (`874b4c2`), P3-02 (`79d5466`) and P3-03 (`9d561d9`, PR #6) are merged. P3-03 re-planned the remaining early checks and recorded the roadmap and design direction: early checks 1a and 1b move to an owner-approved launch rehearsal on the live store in Phase 19 (D-033), checks 3 to 6 move to the phases that build their features (D-034), and phases are numbered 0 to 20 in `ROADMAP.md` (D-035). Phase 2 is complete: P2-01 (`de4701f`), P2-02 (`e676f66`) and P2-03 (`762ddef`) are merged.

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

- P4-02 (merged, `f783367`):
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

- P4-03 (merged, `5e8827d`, PR #9):
  - D-044: one Firebase project per environment; `justbookify-india-dev` exists (owner's Google account, Spark plan). `google-services.json` is gitignored and comes from the EAS file variable `GOOGLE_SERVICES_JSON`; restricting its API key is a Phase 14 item.
  - D-045: React Native Firebase 26.4.0 (`app`, `remote-config`, `analytics`). Remote Config requires the Analytics package; Claude stopped and reported, and the architect chose to install it with collection off. D-009 is permanent for version 1: `AD_ID` blocked, Advertising ID and SSAID off, advertising consents denied (`firebase.json`, pinned by a test).
  - D-047: the audit gate's new high advisory in `@grpc/grpc-js` is allowlisted for the mobile app only, until 2026-11-15, after a source-map check showed the Android bundle holds no `@grpc`, `@firebase` or `protobufjs` module.
  - D-046: typed flags in `src/config/featureFlags.ts`, first `checkout_presentation` (`sheet` | `browser`, default `sheet`). Start-up never waits; consumers await local activation for at most 3 seconds, then one snapshot is frozen for the session; new values are fetched in the background and apply from the next cold start. Minimum fetch interval: production 1 hour, staging 15 minutes, development 0. A production change reaches a phone at its second cold start after the change: typically within a day, not minutes (`RELEASE.md` corrected). Phase 9 must make the checkout flag act without two restarts.
  - Sentry gets unexpected flag problems by code only, and malformed values by flag name only; `remoteConfig/failure` and `remoteConfig/throttled` are never sent.
  - Development line on Home: each flag's value and source, and the fetch status.
  - Release gate added to `TESTING.md` (risk 20): every staging and production build is shown to fetch a changed flag before release, and again after the Phase 14 key restriction.
  - 255 tests (66 new).
  - The owner put `google-services.json` in the project folder and added `GOOGLE_SERVICES_JSON` (file, Secret, development only) to EAS; Claude checked both by name, package and project only.
  - EAS build 3dd75f68 compiled (prebuild copied `google-services.json`, Gradle succeeded) but EAS failed to upload the 246 MB APK ("Failed to upload application archive"). The rebuild from the same commit, d211bdae, finished. Its APK had no `AD_ID` and the expected Firebase settings, but listed `ACCESS_ADSERVICES_AD_ID` and `ACCESS_ADSERVICES_ATTRIBUTION` (Privacy Sandbox, from Firebase Analytics) and the Play install referrer. The architect had the first two blocked (D-045) and the install referrer left as a P4-04 question; `TESTING.md` now checks every new build's full permission list.
  - EAS Android development build **97582938** (commit `50494e6`): the first `eas build` call was refused with "Service Unavailable" (no build created; Expo's status page showed all systems operational), the second created it. Prebuild copied `google-services.json` from `GOOGLE_SERVICES_JSON`; Gradle succeeded.
  - APK permission check (`TESTING.md`), build 97582938: no permission name contains `AD_ID` or `ADSERVICES`. Full list: `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, `VIBRATE`, `SYSTEM_ALERT_WINDOW`, `CHANGE_WIFI_MULTICAST_STATE`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (both up to SDK 32), `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE`, and the app's own `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Against d211bdae only the two blocked permissions are gone. The manifest's Firebase settings match `firebase.json`. An optional `uses-library android.ext.adservices` (`required=false`) remains; it is a library entry, not a permission.
  - On-device check, 4 October 2026, build 97582938 on the owner's Redmi Note 12 Pro 5G over USB with `adb reverse` (`TESTING.md`, "Phone checks over USB with adb"), JavaScript from Metro: **all six passed.**
    1. First launch: `checkout_presentation: sheet (in-app default)`. The app started normally after the permission removals.
    2. The owner published `checkout_presentation` = `browser`. First cold start: still `sheet`, fetch `success` (the snapshot did not change mid-session); second cold start: `browser (Remote Config)`.
    3. Wi-Fi and mobile data off, cold start: `browser (Remote Config)` (the last activated value), fetch `failure`.
    4. App data cleared while offline, cold start: `sheet (in-app default)`, fetch `failure`. The first reopen straight after `pm clear` left Android's starting window on screen with no app process and no crash entry; the next cold start opened normally.
    5. The owner published the malformed value `Browser`. Second cold start: `sheet (in-app default)`. Sentry received one warning (REACT-NATIVE-2, "Remote Config: malformed value for checkout_presentation; the in-app default is used", 0 users); the owner checked that the raw event does not contain the value. No Remote Config event came from the offline checks.
    6. Firebase console, Analytics → Realtime: the report area was empty, no users shown. The APK's manifest separately shows analytics collection deactivated.
  - Afterwards the owner set `checkout_presentation` back to a valid value in the development project. `adb reverse` removed, Metro stopped.
  - Two adb commands during the check were outside what the owner had approved, both read only: `adb shell dumpsys activity activities` (once, to see which screen was in the foreground), and an `adb logcat -d -b crash,main` search that was not filtered to the app's process (once, while looking for a crash). The second printed an unrelated MIUI system line listing the apps installed on the owner's phone; it was not kept or used. The architect's review of PR #9 then set the adb rule now in `CLAUDE.md` and `TESTING.md`.
  - Architect's review of PR #9 added two staging release-gate checks (`TESTING.md`): a fresh install must reach Home on its first launch, and the permission list must hold only what the app needs (`SYSTEM_ALERT_WINDOW`, external storage and `CHANGE_WIFI_MULTICAST_STATE` absent or justified).

- P4-04 (merged, `08f2273`, PR #10):
  - The owner's answers are recorded as decisions:
    - D-048: opt-in consent with three states, stored with `expo-secure-store`. Withdrawing stops collection at once and resets the analytics data on the phone. The customer-facing consent request is a Phase 7 requirement with a release gate; the owner chooses between two placements in Phase 7.
    - D-049: amends D-009. Advertising IDs, Privacy Sandbox permissions, advertising consents, audiences and Google signals stay off. The Play install referrer is allowed, under consent only.
    - D-050: no analytics user ID until Phase 7, then a random or salted one-way per-customer ID for consenting customers only.
    - D-051: 14-month retention, with "Reset user data on new activity" off.
    - D-052: `expo-secure-store` 57.0.4; `USE_BIOMETRIC` and `USE_FINGERPRINT` blocked; Android backup and device transfer off.
    - D-053: the event layer and collection settings.
  - **Backup finding (architect's addition 3):** `expo-secure-store`'s own backup rules include every SharedPreferences file except its own, and that includes the file where Firebase keeps its persisted "collection enabled" setting. A restore or phone-to-phone transfer could therefore start a new install with collection on and no consent record. On Android 12 and later, `allowBackup="false"` alone does not stop device transfer on some phones. A local config plugin (`plugins/withNoAndroidBackup.js`) sets `allowBackup` false and points both backup attributes at rules that exclude every domain.
  - `src/analytics/`:
    - a typed function for each of the 25 events in `ANALYTICS.md`, with branded IDs and tokens, so free text does not type-check;
    - a runtime guard that drops a bad event whole and reports only the event and parameter names to Sentry;
    - the consent state;
    - screen tracking by Expo Router file route;
    - `app_open` on cold start and on return from the background.
  - The "Share app usage" switch on the Account tab, off by default. Its wording is a draft for the owner's adviser (risk 21). A development line on Home shows the analytics state.
  - `firebase.json`: only `analytics_collection_deactivated` changed, to false.
  - 390 tests (135 new). `src/crashReporting/errorCode.ts` is shared with the feature-flag session.
  - EAS build ed13883d (commit `f39b224`): Gradle succeeded (`BUILD SUCCESSFUL in 11m 45s`), then EAS failed to upload the 246 MB APK ("Upload to upload session failed"), as with 3dd75f68 in P4-03. Claude stopped and reported. On the owner's go-ahead, the same commit was rebuilt unchanged. The first request failed with a network error before reaching EAS (the build list showed no build), and the second created **e571370c**, which finished.
  - APK permission check, build e571370c, 6 October 2026: **passed.**
    - The permission list is identical to build 97582938's: nothing containing `AD_ID` or `ADSERVICES`, no `USE_BIOMETRIC` or `USE_FINGERPRINT`, and no new permission. `BIND_GET_INSTALL_REFERRER_SERVICE` is present, as D-049 allows.
    - The built manifest (owner's addition: read from the APK, not the config) has `android:allowBackup` false. `android:dataExtractionRules` resolves to `xml/no_backup_data_extraction_rules`, which excludes all nine domains from both cloud backup and device transfer. `android:fullBackupContent` resolves to `xml/no_backup_rules`, which excludes all nine. `expo-secure-store`'s own rule files are packaged with its library but not referenced.
    - Firebase settings in the manifest: collection disabled at install, not deactivated, default analytics storage denied, automatic screen reporting off, advertising ID and SSAID off, every advertising consent denied.
    - The APK was deleted.
  - On-device check, 6 October 2026, build e571370c on the owner's Redmi Note 12 Pro 5G over USB, with JavaScript from Metro via `adb reverse`: **all four checks passed.**
    - DebugView (Google Analytics → Admin → DebugView, device Xiaomi 22101316I) showed 12 events, matching each step:
      1. Consent not asked (14:30): nothing. Home showed "Analytics: off (consent: not asked)", and Firebase logged "App measurement disabled via the manifest".
      2. Switch on (14:31): `session_start` and six `screen_view`s (account, index, browse, cart, my-books, account). Back from the background (14:32): `app_open` and `user_engagement`.
      3. Cold start (14:33): `app_open` and `screen_view` `index`. The switch was still on; consent re-applied with the advertising consents denied; user property `non_personalized_ads` = 1.
      4. Switch off (14:34): the last `screen_view` came just before. Firebase logged collection off, analytics storage denied, then "Resetting analytics data". Nothing arrived from 14:35 onwards. After a cold start the switch was still off ("App measurement disabled by setAnalyticsCollectionEnabled(false)").
    - Screen names in the app's log were route names only.
    - No crash and no JavaScript error.
  - adb commands that day, all with the owner's go-ahead ("do it yourself", then "do whatever you want"):
    - `setprop debug.firebase.analytics.app` (on, then `.none.`);
    - `setprop log.tag.FA` and `log.tag.FA-SVC` (verbose, then reset);
    - `monkey` launches and `am force-stop` for the cold starts;
    - `input tap` and `input keyevent` to drive the app;
    - app screenshots (`exec-out screencap`);
    - `dumpsys window` filtered to the focused-window line, to confirm the app was in front;
    - logs filtered to the app's process only;
    - `adb reverse` set and removed.

    Metro was stopped afterwards.
  - Follow-up recorded in `NEXT_TASK.md` (owner): the development APK's size, after two upload failures in four builds.

- P5-01 (merged, `2f2b3e1`, PR #11):
  - The architect's answers and conditions are recorded as decisions:
    - D-054: GraphQL Code Generator with Shopify's preset, development dependencies only (`@shopify/api-codegen-preset` 3.0.0, `@graphql-codegen/cli` 6.3.1, `graphql` 16.14.2). The preset supports `2026-10` (checked against its source and Shopify's schema address).
    - D-055: the `2026-10` schema is saved in the repository; CI needs no store and no token; `npm run schema:update` is the deliberate step at a version change.
    - D-056: a thin `fetch` wrapper, not `@shopify/storefront-api-client` 2.0.0, so no new runtime package.
    - D-057: typed errors; 15 seconds per attempt and 30 seconds per call; retries for queries only; the Sentry rule for callers, with configuration faults at most once per session for each status.
    - D-058: buyer context `IN`, `EN` from configuration on every operation, and `buyerIdentity.countryCode` on the cart.
    - D-059: TanStack Query, in memory only, in P5-02.
    - D-060: two high advisories in the generator's tree (`@graphql-tools/utils`, `lodash`) allowlisted for development tooling only until 2026-11-15, after a source-map check of the Android bundle (1,848 modules, none from the generator); no npm override.
  - `src/shopify/client.ts` is the only module that calls the Storefront API; `src/shopify/errors.ts` holds `StorefrontError`, `throwIfUserErrors` and `reportStorefrontError`. ESLint stops `fetch` outside `client.ts` and operation strings outside `src/shopify/`.
  - The dev checkout's two operations run on the client with generated types. Transport errors and user errors are now `StorefrontError`s, whose own wording the test screen shows; the cart is created with `buyerIdentity.countryCode`.
  - `.env.example` and `.env.local` gained `EXPO_PUBLIC_STORE_COUNTRY=IN` and `EXPO_PUBLIC_STORE_LANGUAGE=EN` (`.env.local` was appended without being printed).
  - CI gained the step "Generated GraphQL types are current" (`npm run codegen:check`).
  - 482 tests (92 new). Negative checks: a misspelled field fails `codegen` and the operations test; an operation without `@inContext` fails the operations test; an operation changed without regenerating fails `codegen:check`.
  - `npm run check:dev-store`, 6 October 2026: passed; the development store resolves `IN`, `EN` to INR and 3 products were read.
  - No native change and no new build: the generator's packages are development only, and the app's new code is JavaScript.
  - On-device check, 6 October 2026, build e571370c on the owner's phone over USB, with JavaScript from Metro (commit `b4cf3e9`, 2,046 modules bundled): **passed.**
    1. The test checkout screen listed the development store's two available books at INR 49.00 each, read through `storefrontQuery` with the buyer context.
    2. One copy added: estimated subtotal INR 49.00.
    3. "Open test checkout" created the cart through `storefrontMutation` and Checkout Kit opened, showing the development store's password page (expected, as in P3-01). The password was not entered and no order was placed.
    4. Closing the sheet showed "Checkout closed without an order." and "Cart subtotal from Shopify: INR 49.00."
    5. The app's own log (filtered to its process, 722 lines) shows no crash and no JavaScript error. Its one error-level entry is React Native's `ReactNoCrashSoftException` for a window-focus event at launch, 13 seconds before JavaScript started, unrelated to this change.
  - adb commands that day, with the owner's go-ahead ("do it yourself"): `devices`; `reverse tcp:8081` (set, then removed); `monkey` to launch the app; `dumpsys window` filtered to the focused-window line; `input tap` (four taps); `exec-out screencap` with the app in front (five screenshots, deleted afterwards); `shell pidof` and `logcat -d --pid`. Metro was stopped afterwards.

- P5-02 (awaiting review, branch `feat/p5-02-query-cache`):
  - The architect's answers, conditions and plan-review addition (an app-wide client) are recorded as decisions:
    - D-061: `@tanstack/react-query` 5.104.1 with `@tanstack/query-core` 5.104.1 (MIT, JavaScript only, pinned exactly); one client for the whole app in `src/query/`; TanStack's retry off; no persister; errors reported in one place by type (Storefront errors by D-057, cancels never, anything else as unexpected by code only); `clearStorefrontCache()` and `clearAllCaches()`; each data source keeps its own key root and its own rule on personal data.
    - D-062: freshness presets `catalogue` (5 min, 30 min), `liveStock` (30 s, 5 min, refetched on open), `staticContent` (6 h, 24 h) and `checkout` (never cached).
    - D-063: the hooks-only boundary, enforced by ESLint; foreground refetch through AppState; network awareness deferred to P5-03.
  - The dev checkout screen reads its books through `useDevCheckoutVariants` (`liveStock`) and creates the cart through `useCreateDevCheckout`; its wording and layout are unchanged. Two intended differences: the list refetches when the app returns to the foreground after 30 seconds, and its failures now reach Sentry by the D-061 rule (development builds only).
  - The cache's cancel signal reaches `storefrontQuery`. `DevCheckoutError` gained a code (`devCheckout/<kind>`) for unexpected-error reports.
  - New Sentry helper `reportUnexpectedDataError(code)`.
  - Jest ignores `__tests__/helpers/`, which holds the shared query-client helper.
  - 536 tests (54 new), in 36 files; Jest exits cleanly. Negative checks: the lint-guard test lints 11 forbidden imports (each fails) and 10 allowed ones (each passes); the personal-field check finds `buyerIdentity { email phone customer { firstName } }` in a sample selection.
  - Checked on 6 October 2026: the 5.104.1 source shows that a cancelled fetch that is neither "silent" nor "revert" still reaches the query cache's `onError`, so the cancel filter is needed.
  - No native change and no new build: the two packages hold no native code and no install script; `npx expo-doctor` passes 21 of 21 checks; the audit gate passes with no new advisory.
  - On-device check, 6 October 2026, under the owner's permission for one whole phone check ("Yes, do the whole phone check"), existing development build on the owner's phone over USB, JavaScript from Metro (commit `8b5fe4f`, 2,098 modules bundled): **passed, with one step accepted on unit-test coverage.**
    1. The test checkout screen listed the development store's two available books at INR 49.00 each, read through `useDevCheckoutVariants` (the query cache).
    2. One copy added: estimated subtotal INR 49.00. "Open test checkout" created the cart through `useCreateDevCheckout` and Checkout Kit opened on the development store's password page (expected). Nothing was entered and no order was placed.
    3. Closing the sheet showed "Checkout closed without an order." and "Cart subtotal from Shopify: INR 49.00."
    4. Refetch on return to the foreground: not observable on the phone, because the screen keeps showing its data during a refetch and the app logs nothing. The owner accepted the unit test (`__tests__/query/focus.test.ts`) as coverage; a check with real data is a Phase 6 follow-up (`NEXT_TASK.md`).
    5. The app's own log (filtered to its process, 41,396 lines): no crash, no JavaScript error. Error-level entries unrelated to this change: React Native's `ReactNoCrashSoftException` for a window-focus event at Connect (as in P5-01); two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the password page loaded (to re-check in Phase 9, `NEXT_TASK.md`); and messages from the phone's own system software.
  - adb commands that day: `devices`; `reverse tcp:8081 tcp:8081` (set three times, because the mapping dropped once and Connect failed with "Failed to connect to localhost/127.0.0.1:8081"), `reverse --list` (twice; not on the allowed list, a read of the mapping only), `reverse --remove tcp:8081`; `monkey` to launch the app; `input tap` (eleven taps); `input text "http://localhost:8081"` (three times, with the owner's separate yes, "do it yourself"; the first went into WhatsApp, see below); `exec-out screencap` (sixteen screenshots, all deleted); `shell pidof` and `logcat -d --pid`. Metro was stopped afterwards.
  - **Two incidents during the check, both stopped as the rule requires.**
    - About 16 minutes passed between the owner's yes and the first typing command, and in that time WhatsApp had come to the front. One tap and the typed address `http://localhost:8081` went into WhatsApp's search box; nothing was sent. The screenshot showed WhatsApp, was deleted at once unread, and the check stopped; the owner was asked to clear the search box. From then on a screenshot was taken immediately before every tap or typed command.
    - Later an incoming-call notification covered the app in one screenshot. It was deleted at once, nothing was tapped, and the check resumed only on the owner's "go".

- P5-03 (branch `p5-03-network-and-apk-size`, PR #13), 6 and 7 October 2026: network awareness for the query cache and a smaller development APK. Completes Phase 5.
  - Decisions: D-064 (`expo-network` 57.0.2, pinned exactly; offline only when `isConnected` is false and the type is not `UNKNOWN`; `isInternetReachable` not used; `ACCESS_WIFI_STATE` new), D-065 (queries pause offline and resume or refetch on reconnect; mutations use `networkMode: 'always'`, never queue, and fail at once with `no-network`; no offline check in the Storefront client), D-066 (development profile built for `arm64-v8a` only through `ORG_GRADLE_PROJECT_reactNativeArchitectures` in `eas.json`; staging and production unchanged), D-067 (local debug builds on the owner's computer as a fallback when the EAS queue is stuck; written and then amended at the owner's request within this pull request, before merge).
  - Code: `src/query/online.ts` (`connectOnlineToNetwork()`, `isOfflineState()`), wired in `AppQueryProvider`; mutation default `networkMode: 'always'` in `src/query/queryClient.ts`. Tests: `__tests__/query/online.test.ts` (16), `__tests__/easJson.test.ts` (6); `__tests__/app/tabs.test.tsx` mocks `expo-network`, because jest-expo's automatic mock returns no subscription. 558 tests in 38 files. Shown: with the mutations' `'always'` removed, the offline mutation test fails.
  - Housekeeping (first commit): `NEXT_TASK.md` marked P5-02 done; the adb rule in `CLAUDE.md` and `TESTING.md` now lets the permission for one whole phone check cover typing `http://localhost:8081` (still behind the focus check), and records that Do Not Disturb and the screenshot rule cover notification banners.
  - Package comparison, 6 October 2026: Expo SDK 57 lists `expo-network` `~57.0.2` and `@react-native-community/netinfo` `12.0.1`; both have change listeners, work with the New Architecture and declare `ACCESS_NETWORK_STATE` and `ACCESS_WIFI_STATE`.
  - Phone processor type, read with the owner's yes: `adb shell getprop ro.product.cpu.abi` = `arm64-v8a`.
  - **EAS builds.** c5cd05c7 (commit `7d0e0b5`) sat in the free queue for over two hours without starting and was cancelled on the owner's instruction. **022646a4** (same commit) waited about 2 h 25 min in the queue, then finished in about 10 minutes, and **its upload succeeded**. APK: **95.1 MB** (95,127,262 bytes) against 246 MB before (about 61% smaller); `native-code: 'arm64-v8a'` only.
  - **APK permission check, build 022646a4: passed.** Nothing containing `AD_ID` or `ADSERVICES`, no `USE_BIOMETRIC` or `USE_FINGERPRINT`. Full list: `SYSTEM_ALERT_WINDOW`, `INTERNET`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (both up to SDK 32), `VIBRATE`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, `CHANGE_WIFI_MULTICAST_STATE`, **`ACCESS_WIFI_STATE` (new, from expo-network, D-064)**, `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE`, and the app's own `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. The APK was downloaded into the scratch folder, installed on the phone by the owner from EAS's link, and then deleted.
  - **Local debug build (D-067), 7 October 2026.** Free space checked first (C: 62 GB, D: 64.7 GB). `android/` is git-ignored; `npx expo prebuild --platform android --no-install` also rewrote two `package.json` scripts, which were restored at once (no project file changed). Gradle's own install of NDK 27.1.12297006 stalled at 0 bytes; with the owner's yes the stalled folder was removed and the NDK installed with `sdkmanager --install "ndk;27.1.12297006"` (no licence prompt; `source.properties` reads `Pkg.Revision = 27.1.12297006`). Runs 2 and 3 failed: a temporary DNS failure on this computer ("No such host is known"), then Gradle worker processes that timed out with about 1 GB of memory free. With other programs closed (about 5.5 GB free) and `--max-workers=2` (owner's yes), `assembleDebug` succeeded in 21 m 3 s: 95.1 MB, `arm64-v8a` only, the same permission list as 022646a4, and Firebase settings and backup rules as `TESTING.md` requires (collection off and not deactivated; analytics storage denied; advertising ID and SSAID off; every advertising consent denied; `allowBackup` false; both backup attributes resolve to the no-backup rules, which exclude every domain from cloud backup and device transfer). Not installed: EAS build 022646a4 finished first, and the owner chose it. The local APK was deleted.
  - **On-device check, 7 October 2026, EAS build 022646a4** installed by the owner as an update (the app's data kept), JavaScript from Metro over USB (commit `33c8e39`, 2,102 modules), under the owner's permission for one whole phone check, with Do Not Disturb on. The owner switched airplane mode; Claude changed no setting. **Passed on all five steps:**
    1. Airplane mode on (status bar: airplane icon, no Wi-Fi), the test checkout screen opened from Home: after 15 seconds it still showed "Loading books from the store…" with no error (the query paused).
    2. Airplane mode off, no tap: within 8 seconds both development-store books appeared at INR 49.00 each (the paused query resumed).
    3. One copy set while online (estimated subtotal INR 49.00); airplane mode on; "Open test checkout": within 3 seconds the screen showed "The Storefront API could not be reached. (DevCheckoutCartCreate)", the `no-network` error. No checkout opened and the books stayed on screen.
    4. Airplane mode off, no tap, 15 seconds: nothing ran by itself; no checkout opened and the screen was unchanged.
    5. The app's own log (filtered to its process, 13,250 lines): no crash, no JavaScript error or warning, and no Sentry line after start-up. Known, unrelated entries: `ReactNoCrashSoftException` for a window-focus event at Connect (as in P5-01 and P5-02), and the dev launcher's own `ClassNotFoundException` for `SplashScreenManager` and `NoSuchFieldException` for `colorScheme`, before the app's JavaScript started. That nothing was reported to Sentry for the offline case rests on the unit test (`no-network` is never reported, D-057, D-065); the owner may confirm that the development Sentry project shows no new event from 03:13 to 03:18 IST.
  - adb commands during P5-03: `devices` (four times; once the phone was not connected), `shell getprop ro.product.cpu.abi` (owner's yes), `reverse tcp:8081 tcp:8081`, `reverse --list` (twice, a read of the mapping only), `reverse --remove tcp:8081`; `monkey` to launch the app; the focus check (`dumpsys window` filtered to JustBookify's focus line) before each input and screenshot; `input tap` (five taps: address field, Connect, test checkout link, plus, "Open test checkout"); `input text "http://localhost:8081"` (once, behind the focus check); `exec-out screencap` (nine screenshots of JustBookify only, all deleted); `shell pidof` and `logcat -d --pid` (twice). One `adb install -r` was declined by the owner, who installed the APK from EAS's link instead. Metro was stopped and port 8081 freed afterwards.
  - Memory on this computer during the local build (for D-067): 15.6 GB usable. Leftover Gradle and Kotlin daemons from the failed runs held about 3 GB and were stopped. The owner closed VS Code, Microsoft Edge and Ollama. VS Code was being opened by a Twelve Labs MCP server from a Cowork plugin, whose start command opens a `.js` file in VS Code instead of running it. That is outside this project; the owner can switch the plugin off in Claude's settings.

## What works

- `npm run lint`, `format:check`, `typecheck`, `test` (86 tests) and `audit:gate` pass on `main` after P3-02. `npx expo-doctor` passes 21 of 21 checks.
- The Android development build runs on the owner's Android phone (3 October 2026). It installed from EAS, loaded JavaScript from `npx expo start --dev-client` on this machine over Wi-Fi, and showed "JustBookify", "Development build" and "Store configuration: configured" (owner-reported; Metro logged the Android bundle).
- `npm run check:dev-store` passes against the development store, It fails cleanly, without printing the token or the domain, when `.env.local` is missing, when the currency does not match, when the token is wrong (HTTP 401) or looks like a secret token, and when the host cannot be reached.
- From P2-01: `npx expo-doctor` passed 21 of 21 checks; the app bundles for iOS and Android with Metro; the app config gives the right name and app ID for each `APP_ENV`.

## Not done

- **Analytics consent request** (Phase 7, placement for the owner to choose) and the **privacy policy's app section** (owner's task, risk 21): both are release-gate items (`TESTING.md`, "Release gate: analytics consent"). No build goes to an outside tester without them.
- **14-month retention** in the development Google Analytics property: the owner sets it (D-051). Staging and production properties are set when created.

- **Branch protection on `main`.** GitHub refused on 3 October 2026 (HTTP 403: "Upgrade to GitHub Pro or make this repository public"). As instructed, the plan and the visibility were not changed. The merge rule in `CLAUDE.md` is the gate (risk 18, D-026).
- The development store is a development store with Basic-plan features. Development stores cannot remove the storefront password. The public Storefront token cannot read the plan; confirm it through the Admin API's `shop.plan` once the backend custom app exists.
- No prepaid checkout has been tested. Razorpay cannot be installed on the development store (business entity in Bahrain), so early check 1a waits, with 1b, for the launch rehearsal (D-033). Risk 2 is open and high. ACOD and SMART Checkout Rules were installed on the development store by the owner on 3 October 2026 for P3-02. P3-02's test order left the book "Harry potter" at a stock of 0 there; the owner can restock it.
- Launch rehearsal (early checks 1a and 1b, Phase 19): not scheduled. It needs the Headless channel and published products on the live store (owner's go-ahead, D-008), a build pointing at the live store, the checkout presentation flag, and Apple access for the iPhone half. See `SHOPIFY_INTEGRATION.md`.
- Early checks 3 to 6 wait for their features: Phase 7 login, Phase 10 backend, Phase 12 deep links, Phase 13 reviews (D-034, D-035).
- The checkout presentation flag (D-033): plumbing built and checked on the phone in P4-03; its use comes with the checkout screens in Phase 9, which must also make it act without waiting for two restarts (D-046).
- Staging and production Firebase projects: not created (D-044). The first staging build needs the staging project.
- iOS development build: waits for Apple access, requested in Phase 9 (D-036).
- No store additions on the live store. No access to the Apple or Google developer accounts yet (D-036: Apple in Phase 9, Google Play in Phase 18).
- Sentry, still unproven (release gate in `TESTING.md`, risk 19; no build to any tester other than the owner until it passes): the native-crash report and the source-map upload. Sentry's upload script skips debug variants, and a development build's dev client catches native crashes. Both are checked at the first staging build, which also needs `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for that environment.
- Screens that read through the cache come from Phase 6; logout, which calls `clearAllCaches()`, from Phase 7. The offline message's design is Phase 6 (D-065).
- **Expo SDK 57 patch releases** published after P5-02 (`expo` 57.0.27, `expo-constants` 57.0.21, `expo-linking` 57.0.12, `expo-router` 57.0.25): `npx expo-doctor` fails its version check (20 of 21) until they are installed. The owner chose to leave them for a later task, with the next native build (`NEXT_TASK.md`).
- The two new store variables are not yet EAS environment variables; they are needed when the staging build is set up (follow-up in `NEXT_TASK.md`).

## Known issues

- **Codex note (owner, 6 October 2026).** On 5 October 2026 the Codex Desktop app on this computer created an `AGENTS.md` file from `CLAUDE.md` and imported Claude Code session history. No project file was changed. The untracked file was deleted on the owner's instruction, and `AGENTS.md` is now in `.gitignore`. This project is worked on with Claude Code only.

- Checkout Kit 3.9.1 ships its TypeScript source as its types, so the type check reads it. `src/types/error-capture-stack-trace.d.ts` declares `Error.captureStackTrace` (present in Hermes), which that source uses. Remove the file if a later release ships compiled types.

- `npm audit` reports a high advisory, GHSA-vfj7-8cjw-p6xm (CVE-2026-93687, stack exhaustion through deeply nested brace patterns) in `braces` 3.0.3. Every version is affected and no patched release exists; an upstream fix is in progress. GitHub updated the advisory on 2 October 2026, which made `main` fail the gate. `braces` comes in only through `micromatch` 4.0.8, used by Jest, Metro's file map and the Expo CLI: developer and build tooling that matches file paths and is never bundled into the app. It is allowlisted until **2026-11-15** (D-027). Remove the entry in the same commit that picks up a patched `braces`.
- Since P5-01, `npm audit` reports two high advisories in the code generator's development-only tree: GHSA-7mx3-vvmw-hjmv in `@graphql-tools/utils` (11.2.2 and 10.11.0) and GHSA-r5fr-rjxr-66jc in `lodash` 4.17.23 (under `@shopify/graphql-codegen`). No compatible fix exists; both are allowlisted until **2026-11-15** (D-060). The generator is run only on this repository's own config, saved schema and operations.
- npm 11 skipped `@parcel/watcher`'s install script (a development dependency of the code generator, used only for its watch mode, which this project does not use).
- `npm audit` also reports, as before: `node-forge` (high, allowlisted until 2026-12-31, D-022); `uuid` and `decode-uri-component` (moderate, not gated; the second is risk 17).
- Since P4-03, `npm audit` reports GHSA-m9gg-hp2v-232j (high) and GHSA-f596-whhp-79r4 (low) in `@grpc/grpc-js` 1.9.16, which Firebase's JS SDK pins through `@firebase/firestore`. The Android bundle does not contain it (source-map check); the high one is allowlisted for the mobile app only until **2026-11-15**, never for the Phase 10 backend (D-047).
- npm 11 skipped the install scripts of `@firebase/util` and `protobufjs` (web and Node.js side of Firebase's JS SDK, not in the Android bundle; D-045).
- Icons and splash image are the Expo placeholders. They must be replaced before any store build.
- Every fee in the store configuration is a cart hint: prepaid ₹75, cash on delivery ₹125, and ₹75 off either from a cart total of ₹200, so free prepaid and ₹50 cash on delivery (D-023, D-031; the ACOD app adds no fee, correcting D-024). The configuration does not yet carry the ₹75 discount amount; that comes with the cart screens. Checkout sets the final amount.
- `userInterfaceStyle` is fixed to light until a dark theme is designed. Since D-043 it is enforced on Android too, by `expo-system-ui`.
- npm 11 on this machine skips package install scripts it has not been told to allow, including `@sentry/cli`'s postinstall. `@sentry/cli` 3.x ships its binary as optional platform packages, so it is still installed; `@sentry/bundler-plugins` also brings `@sentry/cli` 2.58.6, which the React Native build does not use.

## Last passing build

Branch `p5-03-network-and-apk-size` (P5-03), 7 October 2026: lint, format check, type check, `codegen:check`, tests (558, `npm run test:ci`) and audit gate pass locally; `expo-doctor` passes 20 of 21 (the Expo patch-version check, see "Not done"). CI is green on PR #13. One full local `npm test` run during the work had 11 timeouts in `useFeatureFlags` and `dev-checkout` while the computer was busy; both suites pass alone and in the next full run. Android development build **022646a4** (EAS, 95.1 MB, `arm64-v8a`) runs it on the owner's phone.

Branch `feat/p5-02-query-cache` (P5-02), 6 October 2026: lint, format check, type check, `codegen:check`, tests (536), audit gate and `expo-doctor` (21 of 21) pass locally; the on-device check passes. CI runs on PR #12.

Branch `feat/p5-01-storefront-client` (P5-01), 6 October 2026: lint, format check, type check, `codegen:check`, tests (482), audit gate and `expo-doctor` (21 of 21) pass locally; `check:dev-store` and the on-device check pass. CI runs on PR #11.

Branch `feat/p4-04-analytics` (P4-04), 6 October 2026: lint, format check, type check, tests (390), audit gate and `expo-doctor` (21 of 21) pass locally; CI runs on the pull request. Android development build e571370c runs it on the owner's phone.

Branch `feat/p4-03-remote-config` (P4-03), 4 October 2026: lint, format check, type check, tests (255), audit gate and `expo-doctor` (21 of 21) pass locally; CI runs on PR #9. Android development build 97582938 runs it on the owner's phone.

`main` at `f783367` (P4-02), 4 October 2026: CI was green on PR #8's latest commit before the merge.

Branch `feat/p4-02-sentry` (P4-02), 4 October 2026: lint, format check, type check, tests (189), audit gate and `expo-doctor` (21 of 21) pass locally, and CI (checks plus secret scan) is green on PR #8. Android development build aa4e95c7 runs it on the owner's phone.

`main` at `df35fa0` (P4-01), 4 October 2026: CI was green on PR #7's latest commit before the merge.

Branch `feat/p4-01-app-shell` (P4-01), 3 October 2026: lint, format check, type check, tests (124), audit gate and `expo-doctor` (21 of 21) pass locally; CI runs on its pull request. Android development build bb476119 runs it on the owner's phone.

`main` at `79d5466` (P3-02), 3 October 2026: lint, format check, type check, tests (86), audit gate and `expo-doctor` pass, and CI was green on PR #5's latest commit before the merge. Android development build bb476119 (P3-01) runs that JavaScript on the owner's phone. `main` at `9d561d9` (P3-03) changed documentation only; CI was green on PR #6 before the merge.
