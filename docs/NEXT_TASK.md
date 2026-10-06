# Next task: P5-02, caching with TanStack Query

Status: in progress (started 6 October 2026, after P5-01 merged as 2f2b3e1).

## Phase 5: Shopify data layer

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (in progress) | Caching with TanStack Query, in memory only | D-059 |

## Goal of P5-02

Add the cache that the catalogue screens (Phase 6) will read through. TanStack Query was chosen in D-059: in memory only, with its own retry off, because `src/shopify/client.ts` already retries safe reads (D-057).
- Install `@tanstack/react-query` at the exact version current on the day (5.104.1 on 6 October 2026), with `npx expo install` if Expo lists it, otherwise `npm install`, pinned exactly, with a decision record. It is JavaScript only: no native change, no new build.
- One `QueryClient` at the root layout, created once, with `retry: false` and no persister.
- Query keys and query functions live in `src/shopify/`, next to the operations; screens call hooks, never the client directly. TanStack's cancel signal is passed to `storefrontQuery`.
- Mutations go through `useMutation`, never retried (D-057).
- `reportStorefrontError` is called in one place (the query cache's error handler), so callers do not repeat the Sentry rule.
- The dev checkout's variant list moves to a query, behaviour unchanged.

## Questions for the owner before starting

1. **Freshness.** How long may catalogue data be shown before it is refetched (`staleTime`), and how long is unused data kept (`gcTime`)? A proposal: 5 minutes fresh, 30 minutes kept. Prices and availability always come fresh from Shopify at checkout.
2. **Online and focus awareness.** Refetching when the app returns to the foreground needs only React Native's AppState. Knowing when the phone comes back online needs a network package (`expo-network` or NetInfo), which is native and so needs a new development build. Include it in P5-02, or leave it to Phase 6?
3. **Clearing the cache.** `SECURITY.md` requires logout to delete caches. P5-02 can add a `clearStorefrontCache()` now for Phase 7 to call. Agreed?

## Steps

1. Read the current TanStack Query documentation for React Native and record the version and date.
2. A decision record for the package and the settings above.
3. The `QueryClient` and provider; hooks for the dev checkout; the cache's error handler applying D-057.
4. Tests: no retry inside TanStack, cancel reaches the client, errors reported once by the rule, cache cleared on request.
5. Lint, format check, type check, `codegen:check`, tests, audit gate and `expo-doctor`; CI green; the on-device dev checkout check.

## Out of scope

- Saving the cache to disk (a later decision, D-059), catalogue screens (Phase 6), the Customer Account API (Phase 7), the backend (Phase 10).
- Anything on the live store.

## Follow-ups (recorded, not part of P5-02)

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
- **Smaller development APK (owner, 6 October 2026):** EAS failed to upload the 246 MB development APK on two of the last four builds (3dd75f68 in P4-03, ed13883d in P4-04; Gradle succeeded both times). Reduce its size, for example by building it only for the phone's processor type, after checking the current Expo and React Native documentation. It needs its own decision.
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
