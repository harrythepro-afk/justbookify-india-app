# Next task (proposal): P2-02, protect main and connect the development store

Status: proposal. It starts only after the owner approves P2-01 and replies to the questions below.

## Goal

Make `main` safe to build on, and give the app a development store to talk to, without touching the live store.

## Needs from the owner first

1. Merge the P2-01 pull request after review.
2. Say whether Claude may switch on branch protection for `main` (pull request required, the two CI jobs required, no force pushes). It changes repository settings, so it is not done without a yes.
3. Create the Shopify development store, as `ARCHITECTURE.md` describes, or name who does. Claude does not create accounts.
4. Confirm that the cash-on-delivery fee is a flat shipping rate, as `SHOPIFY_AUDIT.md` says.

Settled in review on 3 October 2026: D-020 to D-022 approved; the `decode-uri-component` advisory is risk 17 and waits for Phase 12; the free-delivery hint is ₹200 for prepaid orders (D-023).

## Steps (after the answers)

1. Turn on branch protection on `main`, if approved.
2. In the development store only, with the owner's go-ahead, install the Headless channel and publish a few sample products to it (`SHOPIFY_INTEGRATION.md`, additions 1 and 2, on the development store).
3. Put the development store's public values in `.env.local` (never committed) and check that `getStoreConfig()` parses them.
4. Pin the Storefront API version and record it in `docs/SHOPIFY_INTEGRATION.md` with the date.
5. Run the six early checks from `docs/SHOPIFY_INTEGRATION.md` that need no phone, and list the ones that do.
6. Update `docs/CURRENT_STATUS.md` and propose the next task.

## Acceptance checks

- A pull request into `main` cannot be merged without passing CI.
- `getStoreConfig()` returns a valid configuration against the development store's values.
- A scripted read of the development store's products succeeds.
- No secret, token or live-store value appears anywhere in the repository.

## Out of scope

- Anything on the live store.
- Screens, checkout, login, Firebase, Sentry, EAS.
- Any credential that is not public by design.
