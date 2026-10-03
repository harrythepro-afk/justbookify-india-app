# Next task (proposal): P3-03, early check 1a: Razorpay test mode inside Checkout Kit

Status: proposal. It starts only after P3-02 is merged and the owner approves this task.

## Goal

Run early check 1a (risk 2, high) on the owner's Android phone, with the Android development build: does a prepaid checkout redirect to Razorpay and come back to the app, with Razorpay in **test mode** on the development store? P3-02 showed that with the "Prepaid" rate selected, the development store offers no payment method at all, because no prepaid provider is installed. iOS waits for Apple access (D-019). UPI Intent (early check 1b) needs live mode and is not part of this task.

## Needs from the owner first

1. On the **development store only**, install Razorpay and switch it to **test mode** with Razorpay's test keys. The owner enters the keys in the Shopify admin; Claude never sees, asks for or stores them. Reading the live store's Razorpay settings is fine; changing anything there is not.
2. Say whether Razorpay's app on the development store needs a paid plan or a live merchant account. If it does, stop and report; do not look for a workaround.
3. Restock "Harry potter" on the development store if more than five copies are needed (P3-02's test order took it to 0), or use the other books.
4. Confirm that more test orders on the development store are acceptable.

## Steps (after the answers)

1. Read Razorpay's Shopify documentation and Shopify's Checkout Kit documentation for anything about offsite payment redirects in mobile apps or web views, and record what each says, with the date.
2. No app code change is expected: the P3-02 test screen builds any cart needed. If one turns out to be needed, it is development-only and tested.
3. On the owner's phone, with the owner, through Checkout Kit (the owner enters the storefront password, as before), with a cart of ₹200 or more and the "Prepaid" rate:
   - Razorpay is offered as the payment method, and "Pay now" leads to Razorpay's test checkout.
   - A successful test payment (Razorpay's published test card or test UPI flow) returns to Shopify's confirmation page inside the sheet; the order is created; the app receives `completed`.
   - A failed or cancelled test payment returns to checkout without an order, and the app does not receive `completed`.
   - Closing the sheet during the Razorpay step gives `close`, and no order is created.
4. Record pass, fail or a named fallback (for example, a browser checkout for prepaid) for each case in `SHOPIFY_INTEGRATION.md`. Update risk 2.
5. Update `docs/CURRENT_STATUS.md` and propose the next task.

## Acceptance checks

- Early check 1a has a written result for each case above: pass, fail, or a named fallback.
- No Razorpay key, storefront password or live-store value appears in the repository, the logs or the screen; nothing on the live store is changed.
- Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green.

## Out of scope

- Razorpay live mode and UPI Intent (early check 1b), which run only at an owner-approved launch rehearsal.
- Anything that changes the live store.
- iOS, login, the catalogue and cart screens, Firebase, Sentry.
