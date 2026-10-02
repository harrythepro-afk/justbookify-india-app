# Next task: P2-01, repository skeleton and quality gates

## Goal

Create an empty, well-formed project that every later task builds on: an Expo TypeScript app that shows one placeholder screen, with lint, type check, tests and continuous integration all passing. No features.

## Before you start

Read `CLAUDE.md`, `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` (D-003, D-011, D-017, D-018).

## Steps

1. Check the official Expo documentation for the latest stable SDK. Use it. Record the exact SDK and React Native versions in `docs/DECISIONS.md` as a new entry.
2. Scaffold an Expo app with TypeScript and Expo Router. App name "JustBookify". New Architecture enabled.
3. Set the app ID to `com.justbookify.india` for production, with `.dev` and `.staging` suffixes for the other environments, driven by an environment variable in the app config.
4. Turn on TypeScript strict mode.
5. Add ESLint and Prettier with scripts `lint` and `format`. Add a `typecheck` script.
6. Add Jest and React Native Testing Library with one smoke test for the placeholder screen.
7. Create `src/config/` with a typed store configuration for India. Values come from `EXPO_PUBLIC_` environment variables. Commit `.env.example` with empty placeholders only.
8. Make `.gitignore` cover `.env*` (except `.env.example`), signing files, keystores and service-account files.
9. Add a GitHub Actions workflow that runs lint, type check, tests, a secret scan and a dependency audit on every pull request.
10. Fill in the "Commands" section of `CLAUDE.md`.
11. Update `docs/CURRENT_STATUS.md` and write the next `docs/NEXT_TASK.md` as a proposal.

## Acceptance checks

- `lint`, `typecheck` and the test script all pass locally.
- The same checks pass in GitHub Actions on a pull request.
- The app starts and shows the placeholder screen.
- No secret, token or real store value appears anywhere in the repository.

## Out of scope: do not do these

- No Shopify calls, no Checkout Kit, no Firebase, no Sentry.
- No EAS build configuration yet.
- No screens beyond the placeholder.
- Nothing that touches the live Shopify store.
- Do not create any account or credential.

## If something is unclear

Stop and ask the owner. Do not guess.
