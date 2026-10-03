# Next task (proposal): P4-01, app shell: navigation, design tokens and environment banner

Status: proposal. It starts only after P3-03 is merged and the owner approves this task.

## Phase 4: mobile foundation

Phase 4 lays the base every feature screen builds on: navigation shell, design tokens, environment config, crash reporting and feature-flag plumbing. It is split into three small tasks so each pull request stays reviewable:

| Task | Scope | Needs |
| --- | --- | --- |
| **P4-01 (this task)** | Navigation shell, design tokens, environment banner | Nothing new: no dependency, no account, no native change |
| P4-02 | Crash reporting with Sentry, with personal data scrubbed (`SECURITY.md`, `ANALYTICS.md`) | A Sentry account (owner), a dependency decision, a new development build |
| P4-03 | Feature-flag plumbing with Firebase Remote Config: typed flags with safe in-app defaults, including the checkout presentation flag (D-033) | A Firebase project (owner), a dependency decision, a new development build |

## Goal of P4-01

Replace the placeholder start screen with the app's navigation shell: four tabs with placeholder screens, styled only from a small set of design tokens, and a banner that names the environment on non-production builds.

## Needs from the owner first

1. Confirm the four tabs: **Home**, **Browse** (search lives here), **Cart**, **Account** (orders, books I have now, returns and help sit under it later). This is taken from the screens in `PRODUCT_REQUIREMENTS.md`; the grouping is a proposal, not a recorded rule.
2. Say where the token colours come from. Proposal: justbookify.in's own colours, read from the public website without changing anything, then confirmed by the owner. The project has no design system of its own yet; if the owner prefers, one or two brands from the local design reference library are used as a starting point instead, named in the pull request.

## Steps (after the answers)

1. Read Expo Router's documentation for SDK 57 tab layouts and record what it says, with the date. Expo Router 57.0.24 already ships `expo-router/tabs`, with React Navigation bundled, so no new package is expected. If one turns out to be needed, stop for a decision record.
2. `src/theme/tokens.ts`: colours, spacing, type sizes and corner radius, light theme only (`userInterfaceStyle` stays light). System fonts. No values in screen code.
3. `src/app/(tabs)/_layout.tsx` and one placeholder screen per tab, each with an accessible title. Text labels on the tabs; icons wait for a later task, because `expo-symbols` and `@expo/vector-icons` are not direct dependencies.
4. An environment banner ("Development" or "Staging") on non-production builds, using the existing `getAppEnvironment()` and `getEnvironmentLabel()` in `src/config/`. Nothing on production. The store configuration status line moves into it; values are never shown.
5. Keep the development-only checkout test screen reachable from the shell in development builds only, with its existing tests.
6. Tests for the tabs, the banner on each environment, and the development-only link. Run on the owner's Android phone with development build bb476119 and JavaScript from Metro (no native change, so no new build is expected).
7. Update `docs/CURRENT_STATUS.md` and propose P4-02.

## Acceptance checks

- The app opens on the Home tab; all four tabs open their placeholder screens on the owner's Android phone.
- Screens take colours, spacing and type only from `src/theme/tokens.ts`; a test or lint rule fails on a colour literal outside it.
- The banner shows the environment name on development and staging builds and nothing on production, and tests prove it.
- The checkout test screen is reachable only on development builds, and tests prove it.
- No new dependency; no store value, token or secret in the repository, the logs or the screen.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Sentry (P4-02) and Firebase Remote Config (P4-03).
- Real catalogue data, login, cart logic, checkout screens.
- Tab icons, custom fonts, the dark theme, app icon and splash image.
- Anything on the live store.
