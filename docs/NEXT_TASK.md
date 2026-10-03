# Next task: P3-02, early check 2: cash on delivery and the checkout rules inside Checkout Kit

Status: in progress on branch `feat/p3-02-checkout-apps`. Plan approved by the architect on 3 October 2026.

## Goal

Run early check 2 (risk 1, high) on the owner's Android phone, with the Android development build: do the ACOD and SMART Checkout Rules apps behave inside Checkout Kit as the live store's settings say they should? P3-01 proved that Checkout Kit opens the development store's checkout and completes a plain cash-on-delivery order. This task adds the two checkout apps on top. iOS waits for Apple access (D-019).

## Owner's setup (done, 3 October 2026)

- ACOD and SMART Checkout Rules are installed on the **development store only**, with the live store's settings copied by hand (`SHOPIFY_AUDIT.md`, D-031). All three SMART Checkout Rules rules and both ACOD features are active.
- ACOD's plan screen was a test charge, never billed on a development store; no payment method was added. The architect ruled that this is not the paid-plan stop (D-032).
- Shipping rates on the development store: "Prepaid" ₹75 and "Cash on Delivery" ₹125. Its India zone covers the whole country.
- Two sample products have a stock of 10; a third has 1.
- More test orders on the development store are acceptable.

## Rules under test (from the live store's settings, D-031)

| Rule | Where it lives | Setting |
| --- | --- | --- |
| R2 | SMART Checkout Rules validation "Shipping Price Restriction" | Blocks checkout when the cart subtotal is ₹500 or more |
| R3 | SMART Checkout Rules validation "Shipping Restriction" | Blocks checkout when the postal code does not start with 50 to 53 or 56 to 69 |
| R4 | SMART Checkout Rules automatic "Shipping discount" | ₹75 off shipping, both rates, when the cart total is ₹200 or more |
| Cash on delivery | ACOD | No fee. The cash-on-delivery rate goes with the Cash on Delivery payment method. Cash on delivery only up to a cart total of ₹500 |

## Steps

1. Record the facts above in the docs (D-031, D-032, `SHOPIFY_AUDIT.md`, R4, `SHOPIFY_INTEGRATION.md`).
2. Read the two apps' documentation for any statement about Checkout Kit, headless or mobile checkouts, and record what it says.
3. Development-only cart builder on the test screen: list the store's available variants with prices, a quantity stepper for each, and show Shopify's cart subtotal after the cart is created. No other app code changes; no new dependency or native change, so the existing development build is reused.
4. On the owner's phone, with the owner, through Checkout Kit (the owner enters the storefront password as in P3-01):

   | # | Case | Cart / input | Expected |
   | --- | --- | --- | --- |
   | 1 | Rates under ₹200 | Subtotal under ₹200, Karnataka 560001 | "Prepaid" ₹75 and "Cash on Delivery" ₹125; no separate cash-on-delivery fee |
   | 2 | ACOD ties rate and payment | Case 1 cart | "Cash on Delivery" rate: Cash on Delivery payment offered. "Prepaid" rate: Cash on Delivery payment not offered |
   | 3 | Shipping discount | Subtotal from ₹200 to under ₹500 (exactly ₹200 if prices allow) | Prepaid ₹0, cash on delivery ₹50 |
   | 4 | R2 | Subtotal ₹500 or more | Checkout blocked by "Shipping Price Restriction" |
   | 5 | ACOD ₹500 limit | Subtotal just under ₹500, so that ₹50 cash-on-delivery shipping takes the total over ₹500, if prices allow | Record whether cash on delivery is offered (shows whether ACOD's cart total includes shipping) |
   | 6 | R3 | Outside: Maharashtra 400001 (a valid pair, so address validation does not interfere). Inside: Karnataka 560001 | Outside blocked by "Shipping Restriction"; inside accepted |
   | 7 | Completion | One cash-on-delivery order, preferably from case 3 | Order completes; the status line shows "Checkout completed"; the owner sees the order in the development store's admin |

   The expected results come from the live store's own settings, so a matching result needs no second run. Only when the app's result differs is the same cart tried on the development store's website checkout, to tell a Checkout Kit difference from a setup difference.
5. Record pass, fail or a named fallback for each case in `SHOPIFY_INTEGRATION.md`. Update risk 1 and `TESTING.md`.
6. Update `docs/CURRENT_STATUS.md` and propose the next task (early check 1a, Razorpay test mode).

## Acceptance checks

- Early check 2 has a written result for each case above: pass, fail, or a named fallback.
- Any app code change is development-only and tested.
- No secret, storefront password or live-store value appears in the repository; nothing on the live store is changed.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Anything that changes the live store.
- Razorpay (early checks 1a and 1b), login, the catalogue screens, Firebase, Sentry.
- The app's own cart-side cap, pincode and fee hints (R2 to R4 in the cart), including adding the ₹75 discount amount to the store configuration. Those are built with the cart screens.

## Open note from P3-01

On the development store, checkout did not appear straight after the storefront password; the sheet had to be closed and the checkout opened again. This is a development-store artifact (the live store has no password page) and needs no code.
