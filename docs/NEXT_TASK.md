# Next task (proposal): P4-02, crash reporting with Sentry, personal data scrubbed

Status: proposal. It starts only after P4-01 is merged and the owner starts it in a new session.

## Phase 4: mobile foundation

| Task | Scope | Needs |
| --- | --- | --- |
| P4-01 (done, awaiting review) | Navigation shell, design tokens, environment banner | Done: D-039, D-040, D-041 |
| **P4-02 (this task)** | Crash reporting with Sentry, with personal data scrubbed (`SECURITY.md`, `ANALYTICS.md`) | A Sentry account (owner), a dependency decision, a new development build |
| P4-03 | Feature-flag plumbing with Firebase Remote Config: typed flags with safe in-app defaults, including the checkout presentation flag (D-033) | A Firebase project (owner), a dependency decision, a new development build |
| P4-04 | Analytics plumbing with Google Analytics for Firebase: the event names in `ANALYTICS.md`, no personal data | P4-03's Firebase project, a dependency decision |

## Goal of P4-02

Crashes and unhandled errors in development, staging and production builds reach Sentry (D-012) with the build's environment and release, and with no personal data: no names, emails, phone numbers, addresses, order details, tokens, store domain or URLs with query strings.

## Questions for the owner before work starts

1. **Sentry account and project.** Create a Sentry organisation and one React Native project (or say who should). Which data region: US or EU? It cannot be changed later.
2. **Plan.** The free plan's limits are enough for development; confirm before anything paid is chosen.
3. **Source maps.** Readable stack traces need an upload during EAS builds with a Sentry auth token. The token is a secret: the owner stores it as an EAS environment variable (secret visibility); it never enters this repository, `.env.local` or the chat. Approve this, or choose no source maps for now.

## Steps

1. Read Sentry's and Expo's current documentation for `@sentry/react-native` on Expo SDK 57 (install, Expo config plugin, Metro config, EAS source map upload), and record the versions and dates.
2. Decision record for the package (pinned exactly, `npx expo install`) and its config plugin, approved by the owner before installing. Run the audit gate. If the documentation requires a different package, stop and ask.
3. The DSN is a public value: `EXPO_PUBLIC_SENTRY_DSN` in `.env.example` (empty) and read through `src/config/`. Unset DSN means Sentry stays off, with no error.
4. Initialise Sentry once in the root layout with the environment from `getAppEnvironment()` and the app version. `sendDefaultPii` off; no session replay, screenshots or view hierarchy; a `beforeSend` and `beforeBreadcrumb` that drop request bodies, query strings, user fields and anything matching the store domain or a token prefix. Tested with unit tests.
5. A development-only way to raise a test error (on the Home placeholder beside the test checkout link), so the owner can see one event arrive.
6. A new Android development build on EAS (native code is added), checked with `eas build:inspect` for no secrets; then the on-device check with the owner: one test error appears in Sentry with environment `development`, readable stack trace if source maps were approved, and no personal data.
7. Update `SECURITY.md` (crash report line), `CURRENT_STATUS.md`, and propose P4-03.

## Acceptance checks

- A test error from the development build appears in Sentry under environment `development` with the app version.
- Unit tests prove the scrubbing: a sample event carrying an email, a phone number, a token-like string and a URL with a query string comes out without them.
- With no DSN set, the app starts and tests pass, and nothing is sent.
- No secret in the repository, the build upload or the logs; the auth token exists only as an EAS secret.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Remote Config (P4-03), analytics (P4-04).
- Performance tracing and session replay.
- iOS builds (Apple access in Phase 9, D-036).
- Anything on the live store.
