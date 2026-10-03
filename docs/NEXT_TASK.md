# Next task: P3-01, Checkout Kit opens the development store's checkout

Status: approved by the architect on 3 October 2026, with a narrower scope. In progress on branch `feat/p3-01-checkout-kit`.

## Goal

Start Phase 3. Prove two things on the owner's Android phone, with the Android development build:

1. Checkout Kit opens the development store's checkout.
2. A test order can be completed there with cash on delivery.

iOS waits for Apple access (D-019). Early checks 1 and 2 are **not** run in this task.

## Owner's answers

1. Checkout Kit package: D-017 named `@shopify/checkout-sheet-kit` 4.0.x, but 4.0.x is not published. The owner chose 3.9.1, the latest stable release (D-030).
2. The owner sets up the development store with delivery rates and a manual cash-on-delivery payment method only. Razorpay, ACOD and SMART Checkout Rules are not part of this task.
3. Test orders on the development store are acceptable. Never on the live store.

## Steps

1. Check Shopify's Checkout Kit documentation, pin the exact version and record a decision (D-030).
2. Install `@shopify/checkout-sheet-kit` with `npx expo install` and pin it exactly.
3. Add a development-only test screen that builds a one-item cart over the Storefront API and opens its checkout URL in Checkout Kit.
4. Rebuild the Android development build on EAS. The native modules changed.
5. On the owner's phone, with the owner: open the test checkout and complete a cash-on-delivery order. **If the checkout lands on the store's password page, stop and report what is on screen. Do not work around it.**
6. Record the result in `SHOPIFY_INTEGRATION.md`. Record the Razorpay test-mode/live-mode split of early check 1 there.
7. Update `docs/CURRENT_STATUS.md` and propose the next task.

## Acceptance checks

- The Checkout Kit package is pinned to an exact version, with a decision record that cites the documentation checked and the date.
- From the Android development build, the test screen opens the development store's checkout in Checkout Kit. If the password page appears instead, that is a recorded stop, not a pass.
- A test order completes on the development store with cash on delivery, and the app receives Checkout Kit's completed event. The owner confirms it.
- The test screen and its link exist only in development builds, and tests prove it.
- No secret, store domain, token or live-store value appears in the repository, the logs or the screen.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.
- `SHOPIFY_INTEGRATION.md` records that Razorpay's UPI Intent is testable only in live mode, and splits early check 1 into 1a (test mode, development store) and 1b (live mode, at an owner-approved launch rehearsal).

## Out of scope

- Anything on the live store.
- Early checks 1 and 2: Razorpay, ACOD, SMART Checkout Rules.
- Login (Customer Account API), the catalogue screens, Firebase, Sentry.
- Early checks 3 to 6.
