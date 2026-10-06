# Next task (proposal): P5-01, typed Storefront API client

Status: proposal. It starts only after P4-04 is merged and the owner starts it in a new session.

## Phase 4: mobile foundation (complete when P4-04 merges)

| Task | Scope | Decisions |
| --- | --- | --- |
| P4-01 (done, `df35fa0`) | Navigation shell, design tokens, environment banner | D-039, D-040, D-041 |
| P4-02 (done, `f783367`) | Crash reporting with Sentry, personal data scrubbed; Android navigation buttons | D-042, D-043 |
| P4-03 (done, `5e8827d`) | Feature flags with Firebase Remote Config; `checkout_presentation` kill switch plumbing | D-044 to D-047 |
| P4-04 (done, awaiting review) | Analytics with opt-in consent, typed events, no personal data; Android backup off | D-048 to D-053 |

## Goal of P5-01

Phase 5 starts the Shopify data layer (`ARCHITECTURE.md`: "Typed GraphQL operations, caching, retry and error mapping"). P5-01 builds its first piece: one Storefront API client through which every named GraphQL operation passes.
- Every operation is typed by code generation (`CLAUDE.md`: "Every operation is named and typed through code generation").
- Errors map to a small set of app errors (no network, timeout, throttled, Shopify error, unexpected). They reach Sentry by code only, never with the store domain or token.
- P5-01 moves the development checkout screen's two operations (`src/shopify/devCheckout.ts`) onto the client, with the same behaviour.

Caching and the catalogue queries follow in later Phase 5 tasks.

## Questions for the owner before starting

1. **Code generator.** The convention needs one. GraphQL Code Generator (`@graphql-codegen/cli` with the client preset), or the lighter `gql.tada`, which types operations from the schema at compile time without a build step. Both are new dependencies and need a decision. Claude will compare them against the current documentation and recommend one.
2. **Schema source.** Generate from Shopify's published Storefront API schema for `2026-10` (D-025), saved in the repository, or introspect the development store each time? Proposed: the saved schema file, refreshed when the API version changes, so CI never needs a store connection.
3. **Caching library** (a later Phase 5 task, asked now so the client is shaped for it): TanStack Query, Apollo Client, or a small hand-written cache? It also needs a decision.

## Steps

1. Read the current Shopify Storefront API (2026-10), code generator and React Native documentation, and record versions and dates.
2. A decision for the generator and the schema source.
3. `src/shopify/client.ts`: one `storefrontRequest(operation, variables)`. It uses the store configuration (`src/config/`), the version pin and a timeout, and maps errors.
4. Move the development checkout's operations onto it, behaviour unchanged.
5. Tests: typed operations, error mapping, no domain or token in any reported error, timeout.
6. Lint, format check, type check, tests, audit gate and `expo-doctor`; CI green. No new development build is needed unless a native package is added.

## Out of scope

- Screens (Phase 6 onwards), caching (a later Phase 5 task), the Customer Account API (Phase 7), the backend (Phase 10).
- Anything on the live store.

## Follow-ups (recorded, not part of P5-01)

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
