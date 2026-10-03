# Shopify integration

## APIs

| Surface | Used for | Runs where | Credential |
| --- | --- | --- | --- |
| Storefront API (GraphQL) | Catalogue, collections, search, filters, metafields, cart, checkout URL | In the app | Public Storefront access token |
| Customer Account API | Login, profile, addresses, order history | In the app | Public client ID, OAuth 2.0 with PKCE; no secret |
| Checkout Kit | Shows Shopify's own checkout inside the app | In the app | None; uses the cart's checkout URL |
| Admin GraphQL API | Filing return requests; reading order, fulfilment, return and stock state | Backend only | Admin API access token |
| Webhooks | Orders, fulfilments, returns, inventory | Backend only | Webhook signing secret |

Rules:

- GraphQL only. The REST Admin API is not used.
- Pin one dated API version. Record it here. Review it every quarter.
- Do not use Storefront API customer login mutations or Multipass.
- Authenticated carts carry the Customer Account API token as buyer identity.

## API version

Storefront API `2026-10`, pinned on 3 October 2026 in `src/config/shopifyApi.ts` (D-025). Source: the API versions page on shopify.dev, which that day listed `2026-10` as latest stable (released 1 October 2026, accessible until 16 October 2027) and `2027-01` as a release candidate. Next quarterly review: January 2027, when `2027-01` becomes stable.

## Checkout Kit version

`@shopify/checkout-sheet-kit` 3.9.1, pinned on 3 October 2026 (D-030). 4.0.x, named in D-017, was not published that day. Sources: npm registry, the package's GitHub releases and README, and shopify.dev's Checkout Kit page for React Native. Recheck when 4.0.0 is published, and at each quarterly API review.

## Credentials

Values are never written in this repository. Names and locations only.

| May ship inside the app | Server only, never inside the app |
| --- | --- |
| Shop domain | Admin API access token |
| Storefront API public access token | Custom app client secret |
| Customer Account API client ID | Webhook signing secret |
| Shop ID (for the login callback scheme) | APNs auth key and FCM service-account key |
| Sentry DSN and Firebase app config | Judge.me private API token |
| Deep-link hosts | Any database or cloud credential |

The Storefront token gets the minimum scopes: products, collections, cart and checkout. Nothing customer-related.

In the app the shop domain and the public Storefront token are `EXPO_PUBLIC_STORE_DOMAIN` and `EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN`, read through `src/config/`. For development they sit in `.env.local`, which is never committed. The Headless channel's private token is never used in the app.

## Store additions (owner approval required for each)

| # | Addition | Purpose | Status |
| --- | --- | --- | --- |
| 1 | Headless sales channel | Issues the Storefront token and the Customer Account API client ID | Live store: not done; needs the owner's go-ahead. Development store: installed by the owner, 3 October 2026 |
| 2 | Publish products to the Headless channel | The app sees only products published to it | Live store: not done. Development store: sample products published by the owner, 3 October 2026 |
| 3 | One custom app for the backend | Admin API access and webhooks | Not done |

Nothing else on the live store is changed. See D-008.

## Development store

Created by the owner on 3 October 2026. For P3-01 the owner set up delivery rates and a manual cash-on-delivery payment method on it. For P3-02 the owner installed ACOD and SMART Checkout Rules on it on 3 October 2026 and copied the live store's settings by hand (`SHOPIFY_AUDIT.md`, D-031): all three SMART Checkout Rules rules ("Shipping discount", "Shipping Price Restriction", "Shipping Restriction") and both ACOD features are active. ACOD showed a plan screen that Shopify marked as a test charge, which is never billed on a development store; no payment method was added (D-032). The shipping rates are named "Prepaid" (₹75) and "Cash on Delivery" (₹125). Its India shipping zone covers the whole country, unlike the live store's five states, so a pincode outside R3 still gets rates and only the SMART rule can block it. Two sample products have a stock of 10 and a third has 1. Razorpay is not installed there and will not be: Razorpay is offered only to stores with an Indian business entity, and the development store's entity is in Bahrain (D-033). So the development store has no prepaid payment method. Test orders are allowed on the development store only, never on the live store. It is a development store with Basic-plan features (corrected on 3 October 2026; earlier noted as "on the Basic plan"). Like every development store it is always password protected, and Shopify does not allow the password to be removed. Its currency is INR (it was created in BHD and the owner changed it). `npm run check:dev-store` confirmed on 3 October 2026 that the store's currency matches the configuration and that the public token reads products published to the Headless channel. The plan cannot be read with the public Storefront token; confirm it through the Admin API's `shop.plan` once the backend custom app exists, or in the store's admin.

Storefront password: on the development store, the Checkout Kit sheet first shows the store's password page. The tester types the storefront password there; this is the normal way to reach checkout on a development store (architect, 3 October 2026). The live store has no password page, so customers never see it. The app never fills in, stores or logs the password, and no code may be added to do so. The password is not a repository value and never goes into `.env.local`.

## Customer Account API

- Public mobile client. Authorization code flow with PKCE, state and nonce.
- Scopes: `openid email customer-account-api:full`.
- The callback URI uses the `shop.{shop_id}` custom scheme that Shopify requires for mobile apps.
- Login opens in the system browser session, never in an embedded web view.

## Backend custom app: scopes

Keep to the minimum the four backend jobs need: read orders, read products and inventory, write returns. Add a scope only with a decision record.

## Webhook topics (planned)

Order created, order cancelled, fulfilment created and updated, return requested and closed, inventory level updated. Each handler verifies the signature, deduplicates by event ID and is idempotent.

## Product data the app reads

Title, handle, cover image, vendor (author), product type (age groups), tags (series, new arrival), price, compare-at price, availability, and the product metafields for genre, service city and ratings. Record each metafield's exact namespace and key here when the data layer is built.

## Checkout behaviour to respect

- Order subtotal under ₹500 (R2). The rule checks the subtotal, not the total with shipping (P3-02).
- Pincode prefix rule (R3).
- Flat shipping rates and the automatic shipping discount: ₹75 off either rate from ₹200 (R4, D-031).
- ACOD: the cash-on-delivery rate goes with the Cash on Delivery payment method, which is offered only up to a cart total of ₹500 (D-031).
- Razorpay is an offsite provider; UPI may hand off to another app.

## Early checks

Each check runs before anything is built on its result. Check 2 ran in Phase 3. Checks 1a and 1b run at the launch rehearsal (D-033). Checks 3 to 6 run in the phase that builds the feature each one needs (D-034). Phase numbers beyond Phase 4 are not yet recorded, except deep links in Phase 12 (risk 17).

| # | Check | Needs a real phone | When and where |
| --- | --- | --- | --- |
| 1a | Razorpay inside Checkout Kit: redirect to Razorpay and return to the app, on a real iPhone and a real Android phone | Yes | Launch rehearsal, live store, one small real order (D-033). Cannot run on the development store (see "Development store") |
| 1b | Razorpay UPI Intent: hand-off to a real UPI app and back | Yes | Launch rehearsal, live store, same order or session as 1a (D-033). Razorpay supports it only in live mode |
| 2 | Cash on delivery and the checkout rules inside Checkout Kit | No. A development build on an emulator or simulator is enough | **Passed on Android, 3 October 2026 (P3-02, below).** iOS on the development store when Apple access exists (D-019) |
| 3 | A guest order from the website appears after login with the same email | No | The phase that builds login (Customer Account API), on the development store |
| 4 | A return filed through the Admin API appears for staff to approve, on the Basic plan | No | The phase that builds the backend (needs store addition 3, the custom app), on the development store, which has Basic-plan features (see above) |
| 5 | Links from justbookify.in open the app (verification files on a Shopify-hosted domain) | Yes. A signed build on a device | The phase that builds deep links, Phase 12 (risk 17). The verification files go on the live domain, so this check needs the owner's go-ahead |
| 6 | Judge.me allows reading and submitting reviews on the store's plan | No | The phase that builds reviews |

Razorpay test mode and live mode: Razorpay's documentation says UPI Intent can be tested only in Live Mode, not in Test Mode (recorded on 3 October 2026 at the architect's instruction). That is why check 1 was split into 1a and 1b in P3-01. 1a was to run in test mode on the development store; D-033 moved it to the launch rehearsal with 1b.

### Launch rehearsal: early checks 1a and 1b

Decided on 3 October 2026 (D-033). Not scheduled yet; it needs the owner's approval when it is scheduled.

Why not earlier: Razorpay is offered only to stores with an Indian business entity. The development store's entity is in Bahrain, and changing it requires the owner's personal identity details, which the owner declined to enter for a test store. So no prepaid checkout can be tested before the rehearsal. Risk 2 stays open and high until then.

What it is: on the live store, with the owner's approval on the day, one small real order through the app's checkout. Claude never places an order on the live store (`CLAUDE.md` rule 5). The book taken out of circulation and the delivery it triggers are accepted by the owner for this one order (risk 5).

Needs first:

- Store additions 1 and 2 on the live store (Headless channel and published products), each with the owner's go-ahead (D-008).
- A build that points at the live store.
- The checkout presentation flag below, so a failure can be handled without a rebuild.
- Apple access (D-019) for the iPhone half of 1a.

What to record, for each of iPhone and Android:

- 1a: Razorpay is offered with the "Prepaid" rate; "Pay now" opens Razorpay; a completed payment returns to Shopify's confirmation page inside the sheet, the order exists, and the app receives `completed`. A cancelled payment returns to checkout without an order. Closing the sheet during the Razorpay step gives `close` and no order.
- 1b: paying by UPI Intent hands off to a real UPI app and comes back to checkout, then to the confirmation page.

Mitigation to build with the checkout screens: how checkout is presented is switchable by a remote feature flag (Firebase Remote Config, D-012): the in-app Checkout Kit sheet, or the system browser with a return link to the app. If 1a or 1b fails at the rehearsal, the flag moves checkout to the browser with no rebuild. The flag's plumbing is part of the Phase 4 mobile foundation; its use is part of the checkout screens.

### P3-01: Checkout Kit opens the development store's checkout

Scope: Checkout Kit opens the development store's checkout from the Android development build, and a test order completes with cash on delivery. This is not early check 1 or 2. Neither Razorpay nor the ACOD or SMART Checkout Rules apps are involved.

How: the development-only screen `src/app/dev-checkout.tsx` builds a one-item cart with the named Storefront operations `DevCheckoutProduct` and `DevCheckoutCartCreate`, then presents the cart's checkout URL in Checkout Kit. The screen shows Checkout Kit's `completed`, `close` and `error` events in its status line and logs nothing, so the status line is the record of what the app received.

Result, 3 October 2026, on the owner's Android phone (development build bb476119, JavaScript from Metro): **pass, with the development store's password page in front of checkout.**

1. Tapping "Open test checkout" created a cart over the Storefront API and opened the Checkout Kit sheet ("Checkout").
2. Inside the sheet Shopify first showed its development-store password page: the Shopify logo, "JustBookify Dev", "This store is password protected. Use the password to enter the store.", a password field, "Enter", and "Are you the store owner? Log in here". Claude stopped here and reported it. The architect ruled it a development-store artifact (see "Storefront password" above).
3. The owner typed the storefront password. Checkout did **not** appear straight after the password. It appeared only after the owner closed the sheet and tapped "Open test checkout" again, which created a second cart (the first is left abandoned on the development store).
4. The owner completed the order with the manual cash-on-delivery method. The test screen's status line then read "Checkout completed: the order was placed.", so the app received Checkout Kit's `completed` event (owner-reported; the screen logs nothing, so the Metro log shows only the bundle loads).
5. The order appears in the development store's admin (owner-confirmed). Claude did not read it: the Admin tools are not used in this project.

What this shows:

- Checkout Kit 3.9.1 builds and runs on Expo SDK 57 / React Native 0.86.3 on Android, presents a checkout URL from the Storefront API, and reports `completed` to the app.
- On a development store the storefront password gates the checkout URL inside Checkout Kit. Checkout Kit renders the password page; it does not raise `storefront_password_required` as an error. After the password is accepted the sheet does not continue to checkout by itself; the checkout has to be presented again. Checkout Kit has no supported bypass (open feature request Shopify/checkout-sheet-kit-swift#151), and none is wanted.
- Not covered: Razorpay, ACOD and SMART Checkout Rules (early checks 1 and 2), iOS, and the fees and shipping rate shown at checkout.

Acceptance checks (wording as approved for P3-01, updated 3 October 2026):

| Check | Result |
| --- | --- |
| Checkout Kit pinned to an exact version, with a decision record citing the documentation checked and the date | Pass: 3.9.1, D-030 |
| From the Android development build, the test screen opens the development store's checkout in Checkout Kit. On a development store the sheet first shows the store password page; the tester enters the storefront password, which the app never fills in, stores or logs. The live store has no password page | Pass |
| A test order completes on the development store with cash on delivery, and the app receives Checkout Kit's `completed` event | Pass (owner-confirmed: status line and the development store's admin) |
| The test screen and its link exist only in development builds, and tests prove it | Pass |
| No secret, store domain, token, storefront password or live-store value in the repository, the logs or the screen | Pass |
| Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green | Pass (CI result on the pull request) |
| Razorpay's live-mode-only UPI Intent recorded, and early check 1 split into 1a and 1b | Pass |

### P3-02: early check 2, ACOD and SMART Checkout Rules inside Checkout Kit

Scope: on the owner's Android phone, with the Android development build, check that the cash-on-delivery rules (ACOD) and the three SMART Checkout Rules rules behave inside Checkout Kit as the live store's settings say they should (D-031). Razorpay and iOS are not covered.

What the documentation says (read 3 October 2026):

- ACOD (App Store listing "ACOD: Cash On Delivery COD Fee", E-TRADE PARTNER): the app edits Shopify Functions, namely delivery customizations and payment customizations. It links Cash on Delivery payment to shipping methods and can limit cash on delivery by order total. A "Development Store" tier is free with all features. The listing says nothing about Checkout Kit, headless storefronts or mobile apps.
- SMART Checkout Rules (App Store listing, E-TRADE PARTNER, Built for Shopify): the app edits Shopify Functions, namely delivery customizations, payment customizations, and cart and checkout validations, and edits discounts. The listing says nothing about Checkout Kit, headless storefronts or mobile apps.
- Shopify ("Embed Checkout Kit", shopify.dev): Checkout Kit renders the same checkout that buyers see on the web, and Shopify Functions run discounts, payment customizations and delivery rules at checkout. So both apps are expected to apply inside Checkout Kit; the on-device check confirms it.

How: the development-only test screen `src/app/dev-checkout.tsx` lists the development store's variants that are available for sale (named operation `DevCheckoutProduct`), with a quantity stepper (0 to 10) for each and an estimated subtotal. "Open test checkout" creates a cart from the chosen lines (`DevCheckoutCartCreate`) and presents it in Checkout Kit. The screen then shows Shopify's own cart subtotal and any cart warning codes (for example `MERCHANDISE_NOT_ENOUGH_STOCK`), never the URL, domain or token. No dependency or native change, so development build bb476119 is reused with JavaScript from Metro.

The expected results come from the live store's own settings, so a matching result needs no second run. Only a case whose result differs is tried again on the development store's website checkout.

Result, 3 October 2026, on the owner's Android phone (development build bb476119, JavaScript from Metro): **pass on every case.** All three sample books cost ₹49, so carts were built from 1, 4, 5, 9, 10 and 11 books. Exactly ₹200 cannot be reached with ₹49 books; ₹196 and ₹245 bracket it. No result differed from the expected one, so no case was repeated on the website checkout.

| # | Case | Cart / input | Expected | Result |
| --- | --- | --- | --- | --- |
| 1 | Rates under ₹200 | 1 book, ₹49; Karnataka 560001 | "Prepaid" ₹75 and "Cash on Delivery" ₹125; no separate cash-on-delivery fee | **Pass.** Prepaid ₹75.00, Cash on Delivery ₹125.00. With Cash on Delivery: subtotal ₹49, shipping ₹125, total ₹174, no fee line. 4 books (₹196): the same two rates, no discount |
| 2 | ACOD ties rate and payment | 1 book | "Cash on Delivery" rate: Cash on Delivery payment offered. "Prepaid" rate: not offered | **Pass.** Cash on Delivery rate: "Cash on Delivery (COD)" is the only payment method. Prepaid rate: Cash on Delivery is hidden; checkout shows "This store can't accept payments right now" and a disabled "Pay now", because the development store has no prepaid provider (Razorpay cannot be installed there, D-033) |
| 3 | Shipping discount | 5 books, ₹245 | Prepaid ₹0, cash on delivery ₹50 | **Pass.** Prepaid ₹75 struck through, "FREE"; Cash on Delivery ₹125 struck through, ₹50, labelled "SHIPPING DISCOUNT". Total with cash on delivery ₹295, "Total savings ₹75" |
| 4 | R2 "Shipping Price Restriction" | 11 books, ₹539 | Checkout blocked | **Pass.** Banner: "Your order doesn't meet our current requirements. At the moment, we accept orders with a total amount of ₹500 or less." No order could be placed |
| 5 | ACOD ₹500 limit | 9 books (₹441) and 10 books (₹490) | Record whether cash on delivery is offered | **Recorded.** 9 books: offered, total ₹491. 10 books: still offered with a total of ₹540 (₹490 + ₹50 shipping), and the order completed (case 7). So ACOD's limit does not count shipping |
| 6 | R3 "Shipping Restriction" | Outside: Maharashtra 400001. Inside: Karnataka 560001 | Outside blocked; inside accepted | **Pass.** Maharashtra 400001: both rates still appear (the development store's zone is all of India), and Complete order with cash on delivery shows the banner "Your order doesn't meet our current requirements. At the moment, we accept orders only within Karnataka, Andhra Pradesh, Tamil Nadu, Telangana and Kerala." Karnataka 560001: accepted (case 7) |
| 7 | Completion | 10 books, ₹490, cash on delivery, Karnataka 560001 | Order completes; status line "Checkout completed"; order in the development store's admin | **Pass.** Shopify's confirmation page: cash-on-delivery shipping and payment, ₹540.00 (₹615.00 before the discount). The status line read "Checkout completed: the order was placed." The owner confirmed the ₹540 order in the development store's admin. Claude did not read it |

What this shows:

- On Android, ACOD and all three SMART Checkout Rules rules behave inside Checkout Kit as the live store's settings say they should. Shopify Functions run in Checkout Kit as on the web, as Shopify's documentation states. No fallback is needed.
- R2 is checked against the **subtotal**: a ₹490 subtotal with ₹50 shipping (total ₹540) is accepted. Its customer-facing message says "total amount of ₹500 or less", which is the SMART rule's own wording, set by the owner. The app's cart hint must use the subtotal (R2).
- ACOD's ₹500 cash-on-delivery limit does not count shipping either. With R2 blocking subtotals of ₹500 or more, it never removes cash on delivery from an order that R2 allows.
- R3 also blocks an empty pincode: changing the state clears the address fields, and submitting then shows the R3 banner.
- The test order took Harry potter's stock on the development store from 10 to 0. The owner can restock it in the development store's admin.
- Differences between the development store and the live store, not caused by Checkout Kit: the development store's zone is all of India (the live zone is five states), and its checkout shows the phone number as optional (the audit says the live store requires it with the shipping address).
- Not covered: iOS (D-019) and Razorpay (early check 1a).

Acceptance checks:

| Check | Result |
| --- | --- |
| Early check 2 has a written result for each case: pass, fail or a named fallback | Pass: seven cases above |
| Any app code change is development-only and tested | Pass: the test screen and its helper only; 86 tests |
| No secret, storefront password or live-store value in the repository; nothing on the live store changed | Pass |
| Lint, format check, type check, tests, audit gate and `expo-doctor` pass, and CI is green | Pass locally; CI result on the pull request |
