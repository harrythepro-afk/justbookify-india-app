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

Created by the owner on 3 October 2026. For P3-01 the owner sets up delivery rates and a manual cash-on-delivery payment method on it. Razorpay, ACOD and SMART Checkout Rules are not installed there yet; they come in later tasks. Test orders are allowed on the development store only, never on the live store. The owner reports it is on the Basic plan, like the live store. Its currency is INR (it was created in BHD and the owner changed it). `npm run check:dev-store` confirmed on 3 October 2026 that the store's currency matches the configuration and that the public token reads products published to the Headless channel. The plan cannot be read with the public Storefront token; confirm it through the Admin API's `shop.plan` once the backend custom app exists, or in the store's admin.

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

- Order subtotal under ₹500 (R2).
- Pincode prefix rule (R3).
- Flat shipping rates and the automatic shipping discount (R4).
- Razorpay is an offsite provider; UPI may hand off to another app.

## Checks to run first, on a development store

All six run at the start of Phase 3, not before (`TESTING.md`).

| # | Check | Needs a real phone |
| --- | --- | --- |
| 1a | Razorpay inside Checkout Kit: redirect to Razorpay and return to the app, on a real iPhone and a real Android phone | Yes. Testable with Razorpay in test mode on the development store |
| 1b | Razorpay UPI Intent: hand-off to a real UPI app and back | Yes. Testable only in Razorpay live mode, so it runs at an owner-approved launch rehearsal, never as a routine test |
| 2 | Cash on delivery and the checkout rules inside Checkout Kit | No. A development build on an emulator or simulator is enough. The development store needs the ACOD and SMART Checkout Rules apps installed first |
| 3 | A guest order from the website appears after login with the same email | No |
| 4 | A return filed through the Admin API appears for staff to approve, on the Basic plan | No. The development store is on the Basic plan (owner-reported; see above), so the check can run there |
| 5 | Links from justbookify.in open the app (verification files on a Shopify-hosted domain) | Yes. A signed build on a device. The verification files go on the live domain, so this check needs the owner's go-ahead |
| 6 | Judge.me allows reading and submitting reviews on the store's plan | No |

Razorpay test mode and live mode: Razorpay's documentation says UPI Intent can be tested only in Live Mode, not in Test Mode (recorded on 3 October 2026 at the architect's instruction). That is why check 1 is split. Check 1a needs Razorpay in test mode on the development store. Check 1b needs live mode and real money, so it is done only at a launch rehearsal the owner approves.

### P3-01: Checkout Kit opens the development store's checkout

Scope: Checkout Kit opens the development store's checkout from the Android development build, and a test order completes with cash on delivery. This is not early check 1 or 2. Neither Razorpay nor the ACOD or SMART Checkout Rules apps are involved.

How: the development-only screen `src/app/dev-checkout.tsx` builds a one-item cart with the named Storefront operations `DevCheckoutProduct` and `DevCheckoutCartCreate`, then presents the cart's checkout URL in Checkout Kit. A password-protected storefront is reported by Checkout Kit as the error code `storefront_password_required`, which the screen shows.

Result: pending the on-device check with the owner.
