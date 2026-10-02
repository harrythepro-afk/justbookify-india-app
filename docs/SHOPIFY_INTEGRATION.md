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

Not pinned yet. Pin the latest stable version when the data layer is built, and record it here with the date.

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

## Store additions (owner approval required for each)

| # | Addition | Purpose | Status |
| --- | --- | --- | --- |
| 1 | Headless sales channel | Issues the Storefront token and the Customer Account API client ID | Not done; needs the owner's go-ahead |
| 2 | Publish products to the Headless channel | The app sees only products published to it | Not done |
| 3 | One custom app for the backend | Admin API access and webhooks | Not done |

Nothing else on the live store is changed. See D-008.

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

1. Razorpay inside Checkout Kit on a real iPhone and a real Android phone: UPI, card, net banking.
2. Cash on delivery and the checkout rules inside Checkout Kit.
3. A guest order from the website appears after login with the same email.
4. A return filed through the Admin API appears for staff to approve, on the Basic plan.
5. Links from justbookify.in open the app (verification files on a Shopify-hosted domain).
6. Judge.me allows reading and submitting reviews on the store's plan.
