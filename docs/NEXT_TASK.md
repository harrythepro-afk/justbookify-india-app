# Next task: P4-03, feature flags with Firebase Remote Config (in progress)

Status: in progress on branch `feat/p4-03-remote-config`. Code, tests and docs are done; the EAS development build and the on-device check remain. Nothing is merged until the owner writes "approved, merge".

## Phase 4: mobile foundation

| Task | Scope | Needs |
| --- | --- | --- |
| P4-01 (done, `df35fa0`) | Navigation shell, design tokens, environment banner | Done: D-039, D-040, D-041 |
| P4-02 (done, `f783367`) | Crash reporting with Sentry, personal data scrubbed; Android navigation buttons | Done: D-042, D-043 |
| **P4-03 (this task)** | Feature-flag plumbing with Firebase Remote Config: typed flags with safe in-app defaults, including the checkout presentation flag (D-033) | D-044 to D-047; a new development build |
| P4-04 | Analytics plumbing with Google Analytics for Firebase: the event names in `ANALYTICS.md`, no personal data. May switch on analytics collection only: `AD_ID`, `ACCESS_ADSERVICES_AD_ID` and `ACCESS_ADSERVICES_ATTRIBUTION` stay blocked and the advertising consents stay denied for all of version 1 (D-009, D-045). Open question for the owner: is install-source reporting wanted (the Play install referrer permission, kept for now)? | P4-03's Firebase project, consent rules, the owner's answer on install source |

## Answers from the owner and the architect (4 October 2026)

1. One Firebase project per environment, created when needed. `justbookify-india-dev` exists (owner's Google account, Spark plan, Analytics enabled, Android app `com.justbookify.india.dev`). D-044.
2. `asia-south1` wherever Firebase asks; Remote Config has no region. D-044.
3. `google-services.json` is gitignored and supplied as an EAS file variable per environment. Restricting the Android API key is a Phase 14 item. D-044.
4. React Native Firebase 26.4.0, confirmed against Expo SDK 57, React Native 0.86 and the New Architecture. Remote Config requires the Analytics package; Claude stopped and reported, and the architect chose to install it with collection off (D-045). The audit gate then failed on `@grpc/grpc-js`; the exception covers the mobile app only, after proof that the Android bundle does not contain it (D-047).
5. to 7. Start-up never waits; one snapshot per session; consumers wait up to 3 seconds for local activation; new values apply from the next cold start; ordinary fetch failures are not reported. Production minimum fetch interval 1 hour. D-046.

## What is done

- `src/config/featureFlags.ts`: typed flags, `checkout_presentation` = `sheet` | `browser`, default `sheet`; parser; fetch settings per environment.
- `src/featureFlags/remoteConfig.ts` (the only Firebase import) and `src/featureFlags/session.ts` (`startFeatureFlags`, `loadFeatureFlags`, `useFeatureFlags`).
- Sentry: `reportFeatureFlagProblem` and `reportMalformedFeatureFlag`, codes and flag names only.
- A development-only line on Home: each flag's value and source, and the fetch status.
- `firebase.json` (analytics off, advertising off), `AD_ID` blocked, Firebase config plugins, `google-services.json` path from `GOOGLE_SERVICES_JSON`.
- 252 tests pass (63 new); lint, format check, type check, audit gate and `expo-doctor` (21 of 21) pass.

## Owner steps before the build

1. Firebase console → `justbookify-india-dev` → Project settings → General → Your apps → Android app `com.justbookify.india.dev` → download `google-services.json`.
2. Save it as `D:\Desktop\justbookify-india-app\google-services.json` (the repository root, next to `app.config.ts`). It is gitignored; `git status` must not list it.
3. Add it to EAS for the development environment:
   ```bash
   npx eas-cli@24.10.0 env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment development --visibility secret
   ```
   Or on expo.dev: the project → Environment variables → Add, type File, environment development, visibility Secret.

## Remaining steps

1. `npx eas-cli@24.10.0 build --platform android --profile development`, then `eas build:inspect`: `firebase.json` present; `google-services.json`, `.env.local` and keystores absent; no store domain or token.
2. The APK permission check in `TESTING.md`: the full permission list, failing on any name containing `AD_ID` or `ADSERVICES`, and the Firebase settings in the manifest.
   - Build d211bdae (commit `bd144a4`, 4 October 2026; the first attempt, 3dd75f68, compiled but EAS failed to upload the APK) passed for `AD_ID` and every Firebase setting, but listed `ACCESS_ADSERVICES_AD_ID`, `ACCESS_ADSERVICES_ATTRIBUTION` and the Play install referrer. The first two are now blocked (D-045); a new build is needed, and all phone checks run on it.
3. On the phone, JavaScript from `npx expo start --dev-client`:
   1. First launch: "Feature flags: not ready" briefly, then `checkout_presentation: sheet (in-app default)`.
   2. The owner creates the parameter `checkout_presentation` = `browser` in the Firebase console and publishes. Cold-start the app twice: `browser (Remote Config)`.
   3. Wi-Fi and mobile data off, cold start: still `browser` (the last activated values), fetch `failure`. No Sentry issue appears.
   4. Clear the app's storage while offline, cold start: `sheet (in-app default)`.
   5. Online, set the value to `Browser` (malformed), cold-start twice: `sheet (in-app default)`, and one Sentry warning naming `checkout_presentation` only.
   6. Firebase console → Analytics → Realtime: no users from the app.
4. If the build fails, or the app fails to start or misbehaves on the phone (including after the permission removals), stop and report (answer 4).
5. Update `CURRENT_STATUS.md`, propose P4-04, open the pull request.

## Acceptance checks

- Unit tests: defaults when Remote Config is empty, unreachable or malformed; a valid value overrides; an early read waits for activation; the 3-second timeout freezes the defaults. Done.
- Tests run without Firebase (no network in CI). Done.
- The development build shows the console's value after two cold starts; the last activated value offline; the default on a fresh install offline.
- `AD_ID` absent from the built APK.
- No secret in the repository or the build upload.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Using the checkout flag in checkout screens (Phase 9), including making it act without two restarts (D-046).
- Analytics events (P4-04), push notifications.
- iOS builds (Apple access in Phase 9, D-036).
- Anything on the live store.

## Follow-ups (recorded, not part of P4-03)

- **First staging build (from P4-02), a release gate:** no build goes to any tester other than the owner until this passes (`TESTING.md`, risk 19). Check that Sentry receives a native crash and that source maps upload during the build. The raw crash event must show no IP address, city, device ID, store domain or token. Needs `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for the staging build's environment, an EAS-generated keystore for `com.justbookify.india.staging` (a decision), an installable APK, and a way to trigger the test crash. **Since P4-03 it also needs the staging Firebase project** (`google-services.json` for `com.justbookify.india.staging` as `GOOGLE_SERVICES_JSON` in the EAS preview environment; D-044), and it must pass the feature-flag release gate (`TESTING.md`).
- `npm run audit:gate` exception for `@grpc/grpc-js` (D-047) is reviewed by 2026-11-15, with the `braces` entry; it never applies to the Phase 10 backend.
