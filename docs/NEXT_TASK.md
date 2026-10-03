# Next task: P2-02, protect main and connect the development store

Status: approved by the architect on 3 October 2026, with changes. In progress on branch `feat/p2-02-dev-store`.

## Goal

Make `main` safe to build on, and give the app a development store to talk to, without touching the live store.

## Answers from the owner and the architect (3 October 2026)

1. P2-01 is merged (`de4701f`).
2. Branch protection on `main`: yes (pull request required, both CI jobs required, no force pushes). If GitHub refuses because the repository is private on GitHub Free, do not change the plan or the visibility; skip it and record it in `CURRENT_STATUS.md` and `RISKS.md`.
3. The owner creates the development store, installs the Headless channel and publishes sample products. Claude creates `.env.local` from the values the owner gives.
4. Cash on delivery: a ₹125 flat rate named "Cash On Delivery" against ₹75 prepaid, plus the ACOD app's own fee, amount unknown. Both are cart hints only; checkout decides (D-024).
5. Review rule: required approving reviews stay at 0; the architect reviews in chat; merge only on the owner's "approved, merge" (D-026).

Settled earlier: D-020 to D-023 approved; the `decode-uri-component` advisory is risk 17 and waits for Phase 12.

## Steps

1. Try branch protection on `main` once; record the outcome.
2. Add the public Storefront token to the store configuration and pin the Storefront API version (D-025).
3. Create `.env.local` (never committed) and check it with `npm run check:dev-store`: `getStoreConfig()` parses, the store's currency matches, products can be read.
4. Record the API version, the development store and, for each of the six early checks, whether it needs a real phone. The checks themselves run in Phase 3.
5. Add the merge rule and the Shopify Admin MCP tools rule to `CLAUDE.md`; update `RELEASE.md` and `SECURITY.md` for D-026.
6. Update `docs/CURRENT_STATUS.md` and propose the next task.

## Acceptance checks

- A pull request into `main` cannot be merged without passing CI, or the reason it cannot be enforced is recorded.
- `getStoreConfig()` returns a valid configuration against the development store's values.
- A scripted read of the development store's products succeeds, and the store's currency matches the configuration.
- No secret, token or live-store value appears anywhere in the repository.

## Out of scope

- Anything on the live store.
- Running any of the six early checks (Phase 3).
- Screens, checkout, login, Firebase, Sentry, EAS.
- Any credential that is not public by design.
