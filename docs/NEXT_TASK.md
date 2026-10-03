# Next task (proposal): P2-03, first development build

Status: proposal. It starts only after P2-02 is merged and the owner approves this task.

## Goal

Get the app running as a development build on an Android emulator or phone, pointed at the development store, so Phase 3's early checks have something to run in.

## Needs from the owner first

1. Create an Expo account (or organisation) for the app, or name who does, and sign the Expo CLI in on this machine. Claude does not create accounts or enter passwords.
2. Approve `expo-dev-client` as a new dependency (a development build needs it). It gets its own decision record.

## Steps (after the answers)

1. Add `eas.json` with `development`, `staging` and `production` profiles that set `APP_ENV`, matching D-021.
2. Install `expo-dev-client` with `npx expo install` and record the version in a decision.
3. Build an Android development build with EAS and run it on an emulator. iOS waits for Apple access in Phase 3 (D-019).
4. Show the development store's configuration in the development build's placeholder screen only as "configured" or "not configured", never the values.
5. Update `docs/CURRENT_STATUS.md` and propose the next task.

## Acceptance checks

- The Android development build installs and opens on an emulator, named "JustBookify (Dev)" with app ID `com.justbookify.india.dev`.
- The build reads the development store's configuration through `getStoreConfig()`.
- No secret, token or live-store value appears anywhere in the repository or in the EAS project's committed configuration.

## Out of scope

- Anything on the live store.
- Checkout Kit, login, screens beyond the placeholder, Firebase, Sentry, store listings.
- The six early checks (Phase 3).
