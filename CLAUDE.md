# JustBookify India mobile app: rules for Claude Code

This file holds durable, project-wide rules only. Status lives in `docs/CURRENT_STATUS.md`; the task to do now lives in `docs/NEXT_TASK.md`.

## What this project is

A production mobile app for iPhone and Android for JustBookify's India store, justbookify.in: a children's book rental business that runs on Shopify. Customers browse books, rent them, pay through the store's own Shopify checkout, track what they have at home and request returns.

- App ID on both stores: `com.justbookify.india`
- The store has real customers and real orders. Treat every change as production work.
- A separate Bahrain app may later be built from this codebase. Keep every store-specific value in configuration, never in screen code.

## Read before you work

1. This file.
2. `docs/NEXT_TASK.md`: the one task to do now.
3. `docs/CURRENT_STATUS.md`: what exists, what works, what is broken.
4. Every doc that `NEXT_TASK.md` links to.

## Rules that are never broken

1. Inspect existing code and docs before editing anything.
2. Never guess business logic. The rules are in `docs/PRODUCT_REQUIREMENTS.md`. A gap there is a question for the owner, not a licence to invent.
3. Never print, log, commit or ask for a secret. No Admin API token, client secret, webhook secret, signing key or service-account key belongs in the app or in this repository.
4. Never touch the live Shopify store, its theme, checkout, payments, shipping, apps or settings. All development and testing uses the development store.
5. Never place a test order on the live store. It would take a real book out of circulation.
6. Do not change the architecture or add a dependency without a new entry in `docs/DECISIONS.md` approved by the owner.
7. Work in small steps on a feature branch. One task, one pull request.
8. Run lint, type check and tests before reporting. Report failures as failures. Never weaken or delete a test to make it pass.
9. "It compiles" is not "production ready". A task is done when its acceptance checks pass and the docs are updated.
10. For anything version-sensitive (Shopify APIs, Checkout Kit, Expo, Apple and Google requirements), check the official documentation and record the version used.
11. Preserve existing behaviour unless the task says to change it.
12. End every session by updating `docs/CURRENT_STATUS.md` and proposing the next `docs/NEXT_TASK.md`.
13. Never call the Shopify Admin MCP tools in this project (products, orders, customers, inventory, collections, discounts, analytics, GraphQL queries and mutations, store switching). They may be connected to the live store. Searching Shopify's documentation is allowed.

## Merging pull requests

- Never merge a pull request unless the owner writes the words "approved, merge".
- Then: confirm CI is green on the pull request's latest commit, squash-merge, delete the branch, switch to `main` and pull.
- If any check is not green, stop and show the owner the failure instead of merging.
- `main` has no branch protection (a private repository on GitHub Free), so this rule is the only gate. Never push to `main` directly (D-026, risk 18).

## Phone checks with adb

Standard `adb` from Google's SDK Platform-Tools only; no third-party MCP server, skill or app. Method in `docs/TESTING.md` ("Phone checks over USB with adb").

- Allowed without asking: `adb devices`; `adb reverse tcp:8081 tcp:8081` and `adb reverse --remove tcp:8081`; reading logs filtered to this app's own process from the very first command, `adb logcat -d --pid=$(adb shell pidof com.justbookify.india.dev)`.
- A screenshot needs the owner's yes each time, with the JustBookify app in the foreground.
- Every other adb command needs the owner's yes each time, including read-only ones.
- Never run an unfiltered log or a package listing.
- **Permission for one whole phone check.** The owner may give permission for one whole phone check at a time. Under it, and only until that check ends, Claude may:
  - launch JustBookify (`adb shell monkey -p com.justbookify.india.dev -c android.intent.category.LAUNCHER 1`);
  - tap inside JustBookify (`adb shell input tap`);
  - take screenshots of JustBookify only (`adb exec-out screencap -p`), and delete them afterwards.

  Under that permission Claude never enters a password or payment detail, never places an order, and never opens or reads anything outside JustBookify. If a screenshot shows anything other than JustBookify, Claude deletes it at once, stops and tells the owner. Every command is recorded in `docs/CURRENT_STATUS.md`. Any other command still needs its own yes. Without that permission, the rules above apply.
- **Before and during every phone check** (architect's review of PR #12, after input reached WhatsApp in P5-02's check):
  - Before the check starts, ask the owner to switch on Do Not Disturb and to leave the phone untouched until Claude says the check is over.
  - Immediately before every tap or text entry, check that JustBookify is the focused app, in the same command where possible. Reading the focused app's package name is allowed for this purpose only. The command form is in `docs/TESTING.md`.
  - If anything else is in front, send no input at all, stop the check and tell the owner. Do not try to return to the app.
  - Text entry by adb (`adb shell input text`) is limited to the development server address, `http://localhost:8081`. Under the owner's permission for one whole phone check, typing that fixed address needs no separate yes; outside such a check it needs the owner's yes. It still runs only behind the focus check. Nothing else is ever typed.
  - A notification banner does not take focus, so the focus check cannot see it. Do Not Disturb and the screenshot rule cover banners.

## Stop and ask the owner when

- A task needs a credential or access you do not have.
- Shopify behaves differently from its documentation.
- A test cannot be made to pass without weakening it.
- A task would touch anything in production: the live store, production keys, a store listing.
- A business rule is missing or two documents disagree.

## Stack (approved in Phase 1)

| Part | Choice |
| --- | --- |
| App | React Native with Expo development builds, TypeScript strict, New Architecture, Expo Router |
| Catalogue, search, cart | Shopify Storefront API (GraphQL) |
| Login, profile, orders | Shopify Customer Account API, OAuth 2.0 with PKCE, public mobile client |
| Checkout | Shopify Checkout Kit, package `@shopify/checkout-sheet-kit` 4.0.x |
| Backend | Firebase Cloud Functions, Firestore, Cloud Tasks, region `asia-south1` |
| Push | Firebase Cloud Messaging and APNs |
| Feature switches | Firebase Remote Config |
| Analytics | Google Analytics for Firebase |
| Crash reports | Sentry |
| Builds and releases | GitHub, EAS Build, EAS Submit |

## Conventions

- Shopify is the single source of truth. Never store a copy of products, customers or orders.
- GraphQL only. Every operation is named and typed through code generation.
- Store-specific values (store domain, currency, fees, order cap, pincode rule) live in `src/config/`.
- Tokens are stored only in iOS Keychain and Android Keystore-backed storage.
- No personal data in logs, analytics events or crash reports.
- The app is an untrusted client. Every permission check happens on Shopify or on the backend.

## Commands

Node 24 (see `.nvmrc`). Install with `npm ci`. Add Expo packages with `npx expo install <package>`, never `npm install`, so versions match the SDK. Versions are pinned exactly (`.npmrc`).

| Command | What it does |
| --- | --- |
| `npm start` | Starts the Expo dev server |
| `npm run lint` | ESLint with Prettier rules; warnings fail |
| `npm run format` | Rewrites files with Prettier (`docs/` and `CLAUDE.md` are excluded) |
| `npm run format:check` | Checks formatting without writing |
| `npm run typecheck` | TypeScript strict, no emit |
| `npm test` | Jest and React Native Testing Library (watch-free; `npm run test:ci` for CI) |
| `npm run audit:gate` | Dependency audit; fails on high or critical advisories not in `.github/audit-allowlist.json` |
| `npx expo-doctor` | Checks the project against the SDK |
| `npm run check:dev-store` | Reads `.env.local`: checks `getStoreConfig()`, the store's currency and a product read over the Storefront API. Development store only; not run in CI |
| `npx eas-cli@24.10.0 build --platform android --profile development` | Builds the Android development app (`com.justbookify.india.dev`) on EAS. Needs the owner's Expo login on this machine; the keystore stays on EAS (D-028, D-029) |
| `npx expo start --dev-client` | Serves JavaScript, with `.env.local` values, to an installed development build on the same Wi-Fi |

Run `lint`, `format:check`, `typecheck`, `test` and `audit:gate` before reporting. CI runs the same five, plus a secret scan.

Environments: `APP_ENV` (`development`, `staging`, `production`) is read by `app.config.ts` and sets the app ID and the app name. Unset means `development`. Example: `APP_ENV=staging npx expo start`.

Store configuration: copy `.env.example` to `.env.local` and fill in the development store's values. Only `EXPO_PUBLIC_` variables, and nothing secret, belong there. Code reads them through `src/config/`.

## Map of the docs folder

| File | Holds |
| --- | --- |
| `docs/ROADMAP.md` | Numbered phases 0 to 20; use these numbers everywhere |
| `docs/PRODUCT_REQUIREMENTS.md` | Scope, business rules, screens, design direction, screen layouts |
| `docs/ARCHITECTURE.md` | Components, data flow, environments |
| `docs/SHOPIFY_AUDIT.md` | What the live store contains and how it works |
| `docs/SHOPIFY_INTEGRATION.md` | APIs, scopes, credentials by name, webhooks |
| `docs/SECURITY.md` | Security baseline as a checklist |
| `docs/DECISIONS.md` | Numbered decisions with reasons |
| `docs/TESTING.md` | Test layers, edge cases, early checks |
| `docs/ANALYTICS.md` | Event names and privacy rules |
| `docs/RELEASE.md` | Versioning, rollout, rollback |
| `docs/RISKS.md` | Risk register |
| `docs/CURRENT_STATUS.md` | Latest state of the build |
| `docs/NEXT_TASK.md` | The single next task |
