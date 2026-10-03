# Next task (proposal): P3-01, Checkout Kit in the development build, for early checks 1 and 2

Status: proposal. It starts only after P2-03 is merged and the owner approves this task.

## Goal

Start Phase 3. Add Checkout Kit to the Android development build with one test path, so early checks 1 (Razorpay, UPI, card, net banking) and 2 (cash on delivery and the checkout rules) can run on the owner's Android phone against the development store. iOS waits for Apple access (D-019).

## Needs from the owner first

1. Approve `@shopify/checkout-sheet-kit` 4.0.x (the package chosen in D-017) as a new native dependency. It gets its own decision record with the exact version.
2. On the development store only: install the ACOD and SMART Checkout Rules apps, and set Razorpay up in test mode. Claude does not do this; it is a store-admin task, and the live store is never touched.
3. Confirm that a test order on the development store is acceptable for the checks. No order is ever placed on the live store.

## Steps (after the answers)

1. Check Shopify's Checkout Kit documentation for React Native and Expo, and record the version used.
2. Install `@shopify/checkout-sheet-kit` with `npx expo install`, pin it exactly, and add its config plugin if one is needed.
3. In the development build only, add a test screen that builds a cart from one development-store product over the Storefront API and opens its checkout URL in Checkout Kit.
4. Rebuild the Android development build on EAS. Native modules change, so the existing build is not enough.
5. Run early checks 1 and 2 on the owner's phone, with the owner, and record each result in `SHOPIFY_INTEGRATION.md`.
6. Update `docs/CURRENT_STATUS.md` and propose the next task.

## Acceptance checks

- Checkout Kit opens the development store's checkout from the Android development build.
- Early checks 1 and 2 have a written result: pass, fail, or a named fallback.
- The test screen exists only in development builds.
- No secret or live-store value appears in the repository.

## Out of scope

- Anything on the live store.
- Login (Customer Account API), the catalogue screens, Firebase, Sentry.
- Early checks 3 to 6.
