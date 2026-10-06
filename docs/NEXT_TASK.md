# Next task (proposal): P5-03, network awareness and a smaller development APK

Status: proposal. It starts after P5-02 is merged and the owner starts it.

## Phase 5: Shopify data layer

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, awaiting review) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (proposed) | Network awareness for the cache, and a smaller development APK, in one new build | to be recorded |

## Goal of P5-03

Two native changes that share one new development build, so the owner installs one build instead of two (the architect's answer 2 in P5-02).

1. **Network awareness.** Tell TanStack Query when the phone goes offline and comes back, so queries pause offline and refetch on reconnect (D-063 deferred this). TanStack's React Native guide shows both `@react-native-community/netinfo` and `expo-network`. Choose after checking each package's current documentation and the version Expo SDK 57 lists, install it with `npx expo install`, and record a decision with its exact version. Wire it in `src/query/` next to `connectFocusToAppState()`.
2. **Smaller development APK.** EAS failed to upload the 246 MB development APK on two of four builds (3dd75f68 in P4-03, ed13883d in P4-04). Reduce it, for example by building the development profile only for the phone's processor type (arm64-v8a), after checking the current Expo and React Native documentation for the supported setting. Record a decision; the staging and production builds keep every processor type the stores need.

## Questions for the owner before starting

1. **Package.** `expo-network` (an Expo module, versioned with the SDK) or NetInfo (the community package TanStack shows first)? Claude will recommend one after reading both documents.
2. **Offline behaviour.** With network awareness, a query started offline waits instead of failing (TanStack's default `networkMode: 'online'`). Keep that default, or fail at once so the screen can say "no connection"? Phase 6 designs the offline message.
3. **Processor types.** Build the development APK for the owner's phone's processor type only (to be read with `adb shell getprop ro.product.cpu.abi`, with the owner's yes)? Another test phone or an emulator on this computer might need another type; it would then need its own build.

## Steps

1. Read the current documentation (TanStack's onlineManager, the chosen package, Expo's build properties for Android architectures) and record versions and dates.
2. Decision records for the package and the APK setting.
3. `onlineManager` wired to the package, with tests: offline pauses a query, reconnect refetches, the listener is removed.
4. The development build on EAS (owner's Expo login), its APK size compared with 246 MB, and an upload that succeeds.
5. Lint, format check, type check, `codegen:check`, tests, audit gate and `expo-doctor`; CI green; the on-device check (airplane mode on and off on the dev checkout screen), under the owner's permission for one whole phone check.

## Out of scope

- Saving the cache to disk (D-059), catalogue screens (Phase 6), the offline message's design (Phase 6), the Customer Account API (Phase 7), the backend (Phase 10).
- Anything on the live store.

## Follow-ups (recorded, not part of P5-03)

- **Release gate: analytics consent (from P4-04):** no build goes to any tester other than the owner until all of these hold (`TESTING.md`; D-048):
  - the consent request is built (Phase 7, at the placement the owner chooses between the two in D-048) and works;
  - the Account switch withdraws consent at once;
  - a phone without consent sends nothing;
  - the privacy policy's app section is published.
- **Privacy policy app section (owner's task, risk 21):** before any outside tester, the store's privacy policy needs an app section, reviewed by a local adviser together with the draft consent wording. It covers:
  - analytics consent;
  - usage linked to the customer account;
  - the 14-month retention;
  - install-source reporting;
  - the events and data Firebase sends by itself once consent is granted (`ANALYTICS.md`);
  - crash reports (Sentry);
  - Firebase.
- **Analytics retention (owner, D-051):** set event data retention to 14 months, with "Reset user data on new activity" off, in the development Google Analytics property now, and in the staging and production properties when they are created.
- **Phase 7 (D-050):** the analytics user ID for consenting customers after login, cleared on logout and on withdrawal. The consent request must say that usage is linked to the account.
- **First staging build (from P4-02 and P4-03), a release gate:** no build goes to any tester other than the owner until it passes (`TESTING.md`, risks 19 and 20). It needs:
  - `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for the staging build's environment, an EAS-generated keystore for `com.justbookify.india.staging` (a decision), an installable APK, and a way to trigger the test crash. Sentry must receive a native crash, source maps must upload, and the raw crash event must show no IP address, city, device ID, store domain or token.
  - The staging Firebase project, with `google-services.json` for `com.justbookify.india.staging` as `GOOGLE_SERVICES_JSON` in the EAS preview environment (D-044). The build must be shown to fetch a changed flag (`TESTING.md`, "Release gate: feature flags").
  - The APK permission check (`TESTING.md`), and a permission list holding only what the app needs (`SYSTEM_ALERT_WINDOW`, external storage and `CHANGE_WIFI_MULTICAST_STATE` absent or justified).
  - A fresh install reaches Home on its first launch, with no stuck splash screen.
- `npm run audit:gate` exception for `@grpc/grpc-js` (D-047) is reviewed by 2026-11-15, with the `braces` entry; it never applies to the Phase 10 backend.
- Phase 9: the checkout flag must take effect without waiting for two restarts (D-046).
- Phase 14: restrict the Android API key in each `google-services.json`, then repeat the flag fetch check on every build (D-044).
- **Store variables for EAS (from P5-01):** add `EXPO_PUBLIC_STORE_COUNTRY` and `EXPO_PUBLIC_STORE_LANGUAGE` to the EAS environment when the staging build is set up (D-058).
- **Storefront domain for staging and production (architect, P5-01):** when the staging and production configurations are set up, confirm from Shopify's documentation which store domain the Storefront API calls should use, so that requests are not redirected.
- **Code generator audit entries (D-060):** reviewed by 2026-11-15 with the `braces` and `@grpc/grpc-js` entries; re-checked whenever the preset or the codegen CLI is upgraded; each removed in the commit that picks up a compatible fix.
- **Phase 6, foreground refetch with real data (owner, P5-02 phone check):** verify on the phone that a screen refetches when the app returns to the foreground. While the app has been in the background for more than 30 seconds, the owner changes a sample book's stock in the development store; on returning to the app, the screen must show the new value. (In P5-02 this was not observable on the phone and was accepted on the unit test `__tests__/query/focus.test.ts`.)
- **Phase 9, Checkout Kit TLS errors (owner, P5-02 phone check):** the app's log showed two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the development store's password page loaded. The page itself loaded. Re-check during Phase 9's checkout tests.
- **Phase 6, screen focus (D-062):** decide whether stack screens that stay mounted also refetch when they regain focus (TanStack's `useFocusEffect` pattern).
- **Phase 7, logout (D-061):** call `clearAllCaches()`; customer data gets its own key root and is cached in memory only.
