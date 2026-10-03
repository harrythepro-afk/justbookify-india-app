# Next task (proposal): P3-02, early check 2: cash on delivery and the checkout rules inside Checkout Kit

Status: proposal. It starts only after P3-01 is merged and the owner approves this task.

## Goal

Run early check 2 (risk 1, high) on the owner's Android phone, with the Android development build: do the ACOD and SMART Checkout Rules apps behave inside Checkout Kit as they do on the website? P3-01 proved that Checkout Kit opens the development store's checkout and completes a plain cash-on-delivery order. This task adds the two checkout apps on top. iOS waits for Apple access (D-019).

Why before early check 1a (Razorpay test mode): it builds directly on the cash-on-delivery order already proven, and needs no payment-provider credentials.

## Needs from the owner first

1. On the **development store only**, install the ACOD and SMART Checkout Rules apps. Copy the live store's settings into them by hand: the shipping restriction for pincodes 50 to 53 and 56 to 69 (R3), the free-delivery shipping discount (R4, D-023), the ₹500 subtotal rule (R2), wherever the live store sets it, and the ACOD fee and limits. Reading the live store's settings in its admin is fine; changing anything there is not. Claude does not do this; it is a store-admin task.
2. Make sure the development store has products priced so that a cart can sit under ₹200, between ₹200 and ₹500, and at or above ₹500.
3. Confirm that more test orders on the development store are acceptable.

## Steps (after the answers)

1. Read the two apps' documentation for any statement about Checkout Kit, headless or mobile checkouts, and record what it says.
2. If the checks need a bigger cart, add a development-only quantity control to the test screen. No other app code changes.
3. On the owner's phone, with the owner, through Checkout Kit (entering the storefront password as in P3-01):
   - Cash on delivery shows the ACOD fee and limits as on the website.
   - A pincode outside R3 is blocked; one inside is accepted.
   - A subtotal at or above ₹500 is blocked (R2).
   - The free-delivery discount applies from ₹200 for prepaid orders and not for cash on delivery (R4). Prepaid is checked only as far as the shipping line, because Razorpay is not set up.
   - One cash-on-delivery order completes, and the app receives `completed`.
4. Compare each result with the website's checkout on the development store, and record pass, fail or a named fallback in `SHOPIFY_INTEGRATION.md`. Update risk 1.
5. Update `docs/CURRENT_STATUS.md` and propose the next task (early check 1a, Razorpay test mode).

## Acceptance checks

- Early check 2 has a written result for each rule above: pass, fail, or a named fallback.
- Any app code change is development-only and tested.
- No secret, storefront password or live-store value appears in the repository; nothing on the live store is changed.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Anything that changes the live store.
- Razorpay (early checks 1a and 1b), login, the catalogue screens, Firebase, Sentry.
- The app's own cart-side cap, pincode and fee hints (R2 to R4 in the cart). Those are built with the cart screens.

## Open note from P3-01

On the development store, checkout did not appear straight after the storefront password; the sheet had to be closed and the checkout opened again. This is a development-store artifact (the live store has no password page) and needs no code.
