# Next task (proposal): P4-03, feature flags with Firebase Remote Config

Status: proposal. It starts only after P4-02 is merged and the owner starts it in a new session.

## Phase 4: mobile foundation

| Task | Scope | Needs |
| --- | --- | --- |
| P4-01 (done, `df35fa0`) | Navigation shell, design tokens, environment banner | Done: D-039, D-040, D-041 |
| P4-02 (done, awaiting review) | Crash reporting with Sentry, personal data scrubbed; Android navigation buttons | Done: D-042, D-043 |
| **P4-03 (this task)** | Feature-flag plumbing with Firebase Remote Config: typed flags with safe in-app defaults, including the checkout presentation flag (D-033) | A Firebase project (owner), a dependency decision, a new development build |
| P4-04 | Analytics plumbing with Google Analytics for Firebase: the event names in `ANALYTICS.md`, no personal data | P4-03's Firebase project, a dependency decision |

## Goal of P4-03

The app reads typed feature flags from Firebase Remote Config (D-012). Every flag has a safe default compiled into the app, so a missing network, an empty Remote Config or a failed fetch leaves the app working. The first flag is the checkout presentation switch from D-033: the Checkout Kit sheet or the system browser with a return link. Its plumbing is built now; its use comes with the checkout screens in Phase 9.

## Questions for the owner before starting

1. **Firebase project:** the owner creates it (Firebase console, on the owner's Google account), adds an Android app with package `com.justbookify.india.dev`, and later the staging and production IDs. Which Google account should own it?
2. **Region:** D-012 and `CLAUDE.md` say the backend runs in `asia-south1`. Remote Config has no region, but the project's default resource location is fixed at creation. Confirm `asia-south1`.
3. **Config files:** `google-services.json` is not a secret in Firebase's model, but it identifies the project. Should it be committed (Expo's usual setup) or supplied as an EAS file variable?

## Steps

1. Read the current React Native Firebase and Expo documentation for Remote Config on Expo SDK 57 (`@react-native-firebase/app` and `/remote-config` with their config plugins, or the Firebase JS SDK), and record versions and dates. If the documentation requires something unexpected, stop and ask.
2. A decision record for the packages, pinned exactly with `npx expo install`, approved by the owner before installing. Run the audit gate.
3. `src/config/featureFlags.ts`: one typed list of flags with in-app defaults; Remote Config values are parsed and anything unknown or malformed falls back to the default. The first flag: `checkout_presentation` = `sheet` | `browser`, default `sheet`.
4. Fetch and activate once at start, with a short timeout and a minimum fetch interval suited to each environment. A failure is reported to Sentry without personal data and leaves the defaults in place.
5. A development-only line on Home showing each flag's current value and whether it came from Remote Config or the default.
6. A new Android development build on EAS, checked with `eas build:inspect`; then the on-device check: change the flag in the Firebase console, reopen the app, see the new value; turn off Wi-Fi, see the default.
7. Update `ARCHITECTURE.md` (flags), `SECURITY.md` if needed, `CURRENT_STATUS.md`, and propose P4-04.

## Acceptance checks

- Unit tests: defaults when Remote Config is empty, unreachable or returns a malformed value; a valid value overrides the default.
- The development build shows the flag's value from the Firebase console, and the default with no network.
- Tests run without Firebase (no network in CI).
- No secret in the repository or the build upload.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Using the checkout flag in checkout screens (Phase 9).
- Analytics (P4-04), push notifications.
- iOS builds (Apple access in Phase 9, D-036).
- Anything on the live store.

## Follow-ups (recorded, not part of P4-03)

- **First staging build (from P4-02), a release gate:** no build goes to any tester other than the owner until this passes (`TESTING.md`, risk 19). Check that Sentry receives a native crash (the development build's dev client catches it, so it cannot be checked there) and that source maps upload during the build. Needs `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for the staging build's environment, an EAS-generated keystore for `com.justbookify.india.staging` (a decision), an installable APK for internal testing, and a way to trigger the test crash on a staging build. The raw crash event must show no IP address, city, device ID, store domain or token.
