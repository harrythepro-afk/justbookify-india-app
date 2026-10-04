# Next task (proposal): P4-04, analytics plumbing with Google Analytics for Firebase

Status: proposal. It starts only after P4-03 (PR #9) is merged and the owner starts it in a new session.

## Phase 4: mobile foundation

| Task | Scope | Needs |
| --- | --- | --- |
| P4-01 (done, `df35fa0`) | Navigation shell, design tokens, environment banner | Done: D-039, D-040, D-041 |
| P4-02 (done, `f783367`) | Crash reporting with Sentry, personal data scrubbed; Android navigation buttons | Done: D-042, D-043 |
| P4-03 (done, awaiting review, PR #9) | Feature flags with Firebase Remote Config; `checkout_presentation` kill switch plumbing | Done: D-044 to D-047; on-device check passed on build 97582938 |
| **P4-04 (this task)** | Analytics plumbing: a typed event layer for the events in `ANALYTICS.md`, collection switched on under the owner's consent rule, no personal data | The owner's answers below; a new development build |

## Goal of P4-04

The app can record the events listed in `ANALYTICS.md` through one typed module, with no personal data, and Google Analytics for Firebase receives them from the development build. `@react-native-firebase/analytics` 26.4.0 is already in the app, switched off (D-045). P4-04 builds the event layer and switches on **analytics collection only**: the advertising ID, the Privacy Sandbox permissions and the advertising consents stay off for all of version 1 (D-009, D-045). Most events fire from screens built in later phases; P4-04 wires the layer and the events that already have a screen.

## Questions for the owner before starting

1. **Consent.** `ANALYTICS.md` says analytics starts only after consent "where the law or the store's privacy policy requires it". Does the app ask before collecting analytics (opt-in), collect by default with a way to turn it off (opt-out), or something else? India's Digital Personal Data Protection Act 2023 and the store's privacy policy may decide this; it is a business and legal question, not a technical one.
2. **Install source.** Firebase Analytics keeps the Play Store install referrer permission (`BIND_GET_INSTALL_REFERRER_SERVICE`) in the app (D-045). Is install-source reporting wanted? If not, P4-04 blocks it, like the advertising permissions.
3. **Analytics user ID.** `ANALYTICS.md` allows a random ID or a one-way hash, never the email. Login arrives in Phase 7; should P4-04 set no user ID at all until then? (Proposed: none.)
4. **Data retention** in Google Analytics (2 or 14 months for event-level data). Proposed: the shortest, 2 months.

## Steps

1. Read the current React Native Firebase Analytics and Google Analytics for Firebase documentation (consent mode, `setAnalyticsCollectionEnabled`, `setConsent`, event and parameter limits), and record versions and dates. If the documentation requires something unexpected, stop and ask.
2. A decision record for the consent rule and the collection settings: which `firebase.json` keys change (only `analytics_auto_collection_enabled`, `analytics_collection_deactivated`, `google_analytics_automatic_screen_reporting_enabled` and `analytics_default_allow_analytics_storage` may change; the advertising keys and the blocked permissions never do; `__tests__/firebaseJson.test.ts` keeps pinning them).
3. `src/analytics/`: one typed function per event in `ANALYTICS.md`, with typed parameters; anything that could carry personal data (free text, emails, phone numbers, names, addresses) is impossible to pass by type, and a runtime guard drops it. Analytics is a no-op under Jest and when collection is off.
4. Screen tracking by Expo Router route name, never with parameters that carry personal data.
5. The events that already have a screen (for example `app_open`); the rest are wired by the phases that build their screens.
6. A development-only line on Home showing whether collection is on.
7. A new Android development build, the APK permission check in `TESTING.md` (no `AD_ID` or `ADSERVICES` permission; any new permission reported), and an on-device check with Firebase DebugView (`adb shell setprop debug.firebase.analytics.app com.justbookify.india.dev`, with the owner's agreement under the adb rules in `TESTING.md`).
8. Update `ANALYTICS.md`, `SECURITY.md` (store privacy labels), `CURRENT_STATUS.md`, and propose the next task.

## Acceptance checks

- Unit tests: each event's parameters are typed; personal data cannot pass the guard; nothing is sent under Jest or with collection off.
- `firebase.json` advertising keys and the three blocked permissions unchanged (tests).
- The APK permission check passes on the new build.
- DebugView shows the development build's events with only the documented parameters.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Events for screens that do not exist yet (they come with their phases).
- Advertising, attribution or audiences of any kind (D-009, permanent for version 1).
- iOS builds (Apple access in Phase 9, D-036).
- Anything on the live store.

## Follow-ups (recorded, not part of P4-04)

- **First staging build (from P4-02 and P4-03), a release gate:** no build goes to any tester other than the owner until it passes (`TESTING.md`, risks 19 and 20). It needs:
  - `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for the staging build's environment, an EAS-generated keystore for `com.justbookify.india.staging` (a decision), an installable APK, and a way to trigger the test crash. Sentry must receive a native crash, source maps must upload, and the raw crash event must show no IP address, city, device ID, store domain or token.
  - The staging Firebase project, with `google-services.json` for `com.justbookify.india.staging` as `GOOGLE_SERVICES_JSON` in the EAS preview environment (D-044). The build must be shown to fetch a changed flag (`TESTING.md`, "Release gate: feature flags").
  - The APK permission check (`TESTING.md`), and a permission list holding only what the app needs (`SYSTEM_ALERT_WINDOW`, external storage and `CHANGE_WIFI_MULTICAST_STATE` absent or justified).
  - A fresh install reaches Home on its first launch, with no stuck splash screen.
- `npm run audit:gate` exception for `@grpc/grpc-js` (D-047) is reviewed by 2026-11-15, with the `braces` entry; it never applies to the Phase 10 backend.
- Phase 9: the checkout flag must take effect without waiting for two restarts (D-046).
- Phase 14: restrict the Android API key in each `google-services.json`, then repeat the flag fetch check on every build (D-044).
