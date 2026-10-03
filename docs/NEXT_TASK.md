# Next task (proposal): P4-01, app shell: navigation, design tokens and environment banner

Status: proposal. It starts only after P3-03 is merged and the owner starts it in a new session.

## Phase 4: mobile foundation

Phase 4 (`ROADMAP.md`) lays the base every feature screen builds on: navigation, design tokens, config, crash reporting, analytics plumbing and feature flags. It is split into small tasks so each pull request stays reviewable:

| Task | Scope | Needs |
| --- | --- | --- |
| **P4-01 (this task)** | Navigation shell, design tokens, environment banner | Two small dependency decisions (tab icons, fonts); no account |
| P4-02 | Crash reporting with Sentry, with personal data scrubbed (`SECURITY.md`, `ANALYTICS.md`) | A Sentry account (owner), a dependency decision, a new development build |
| P4-03 | Feature-flag plumbing with Firebase Remote Config: typed flags with safe in-app defaults, including the checkout presentation flag (D-033) | A Firebase project (owner), a dependency decision, a new development build |
| P4-04 | Analytics plumbing with Google Analytics for Firebase: the event names in `ANALYTICS.md`, no personal data | P4-03's Firebase project, a dependency decision |

## Goal of P4-01

Replace the placeholder start screen with the app's navigation shell: five tabs with placeholder screens, styled only from design tokens taken from the website, and a banner that names the environment on non-production builds.

## Answers recorded (3 October 2026)

- **Tabs** (owner approved, D-037): five tabs, each with an icon and a label: **Home**, **Browse**, **Cart**, **My Books**, **Account**. Search sits under Browse. My Books holds books at home, orders and returns, and asks for login when the customer is signed out. Account holds profile, addresses, notification settings and help. Layouts for later phases are in `PRODUCT_REQUIREMENTS.md`, "Screen layouts (version 1)".
- **Colours and fonts** (architect, D-038): taken read-only from the public pages of justbookify.in. Values, source and contrast results are in D-038. Cream text on green fails contrast, so the tokens never pair them; the adjusted green `#3E7916` is proposed for the owner to confirm.
- **Design direction** (owner, D-037): version 1 follows the website's look and structure. Every visual value is a token; screens never hard-code a colour, font or spacing value.

## Steps

1. Read Expo's SDK 57 documentation for Expo Router tab layouts, icons and fonts, and record what it says, with the date. Expo Router 57.0.24 already ships `expo-router/tabs` with React Navigation bundled.
2. Stop for two decision records, each approved by the owner before anything is installed:
   - Tab icons: `expo-symbols` and `@expo/vector-icons` are not direct dependencies today. Propose one, installed with `npx expo install`.
   - Fonts: Asul and Archivo (D-038) are not in the app. Propose how they are bundled (for example the Google Fonts packages for Expo, or the font files with `expo-font`), with each font's licence.
3. `src/theme/tokens.ts`: the D-038 colours as named roles (text, background, primary button, link, badge and so on), spacing, type sizes (headings 1.1 times body), corner radius, and the two font families. Light theme only (`userInterfaceStyle` stays light).
4. `src/app/(tabs)/_layout.tsx` and one placeholder screen per tab, each with an accessible title, icon and label. My Books shows a placeholder only; its login prompt comes in Phase 7.
5. An environment banner ("Development" or "Staging") on non-production builds, using the existing `getAppEnvironment()` and `getEnvironmentLabel()` in `src/config/`. Nothing on production. The store configuration status line moves into it; values are never shown.
6. Keep the development-only checkout test screen reachable from the shell in development builds only, with its existing tests.
7. Tests for the tabs, the banner on each environment, and the development-only link. Run on the owner's Android phone with development build bb476119 and JavaScript from Metro. If either new package needs native code missing from that build, say so and build a new development build.
8. Update `docs/CURRENT_STATUS.md` and propose P4-02.

## Acceptance checks

- The app opens on the Home tab; all five tabs, with icon and label, open their placeholder screens on the owner's Android phone, in the website's fonts.
- Screens take colours, fonts and spacing only from `src/theme/tokens.ts`; a test or lint rule fails on a colour literal outside it.
- Every text and background pair in the tokens meets WCAG AA (4.5:1 for text), and a unit test checks the ratios.
- The banner shows the environment name on development and staging builds and nothing on production, and tests prove it.
- The checkout test screen is reachable only on development builds, and tests prove it.
- The only new dependencies are the two approved in step 2; no store value, token or secret in the repository, the logs or the screen.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Sentry (P4-02), Remote Config (P4-03), analytics (P4-04).
- Real catalogue data, login, cart logic, checkout screens, the screen layouts beyond placeholders.
- The dark theme, app icon and splash image.
- Anything on the live store.
