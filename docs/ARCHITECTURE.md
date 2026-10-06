# Architecture

Approved in Phase 1 on 2 October 2026. Rationale for each choice is in `DECISIONS.md`.

## Shape of the system

```
Mobile app (React Native, Expo)
  |-- Storefront API ---------> Shopify   catalogue, search, cart
  |-- Customer Account API ---> Shopify   login, profile, orders
  |-- Checkout Kit -----------> Shopify checkout -> Razorpay or cash on delivery
  |-- HTTPS ------------------> Our backend (Firebase, asia-south1)
                                   |-- Admin GraphQL API --> Shopify   return requests
                                   |<- Webhooks ------------ Shopify   orders, fulfilments, returns, stock
                                   |-- FCM / APNs ---------> phones    notifications
                                   |-- Judge.me API                    review text and submission
```

The app talks straight to Shopify for everything a shopper does. The backend exists only for the four jobs Shopify cannot do from a phone.

## What lives where

| Place | What lives there |
| --- | --- |
| App to Shopify directly | Catalogue, collections, search, filters, cart, Checkout Kit, login, profile, addresses, order history |
| Through our backend | Push token registration and sending, return requests, back-in-stock alerts, reviews proxy, app attestation checks |
| Only inside Shopify | Prices, inventory, order creation, payment methods, discounts, checkout rules, customer records, marketing consent |
| Third-party services | APNs and FCM delivery, crash reporting (Sentry), analytics, feature switches (Firebase Remote Config), WhatsApp, Razorpay, Judge.me |

## The backend's four jobs

1. Send push notifications when Shopify reports an order, fulfilment, return or stock change.
2. File a return request in Shopify on the customer's behalf.
3. Remember who asked to be told when a book is back, and tell them.
4. Pass review text to and from Judge.me.

Rules for the backend:

- It stores device tokens, alert requests, idempotency keys and logs. It never stores products, customers or orders.
- Every request carries the customer's Customer Account API token. The backend validates it and derives the customer ID itself. It never trusts an ID sent by the app.
- Webhooks are verified by signature, acknowledged quickly and processed from a queue. Each event is handled once.
- Stateless functions; region `asia-south1` (Mumbai).

## App structure (target)

| Layer | Responsibility |
| --- | --- |
| Screens (Expo Router) | Layout and interaction only |
| Features | Catalogue, cart, checkout, auth, orders, returns, reviews, notifications |
| Data layer | Typed GraphQL operations, caching, retry and error mapping |
| Config | Store-specific values per country and per environment |
| Platform | Secure storage, push, deep links, analytics, crash reporting |

## Rental state

Shopify already records rentals. Staff mark every delivery as a fulfilment and every pickup as a return.

- "Books I have now" = line items on fulfilled orders with no completed return.
- Rental start = delivered date when the courier reports one, otherwise the fulfilment date.
- Due date = rental start plus one month.

## Availability

Follow Shopify for each book: if Shopify marks it available for sale, it can be ordered, even at zero stock. Otherwise show it as unavailable and offer notify-me.

## Checkout

1. Build the cart with the Storefront API; keep the cart ID on the device.
2. After login, attach the customer's token as buyer identity.
3. Check the order cap and pincode in the app before opening checkout.
4. Present the cart's checkout URL with Checkout Kit.
5. On the completed event, show confirmation and clear the cart.
6. The Shopify order is the source of truth for everything afterwards.

The app never handles card, UPI or bank details.

## Environments

| Item | Development | Staging | Production |
| --- | --- | --- | --- |
| Shopify store | Development store | Second development store | Live store, justbookify.in |
| App ID | `com.justbookify.india.dev` | `com.justbookify.india.staging` | `com.justbookify.india` |
| Backend | Local emulators | Staging Firebase project | Production Firebase project |
| Firebase project (flags, later analytics and push) | `justbookify-india-dev` (created 4 October 2026) | Created when first needed | Created when first needed |
| `google-services.json` | EAS file variable `GOOGLE_SERVICES_JSON`, environment development | Same, environment preview | Same, environment production |
| Customers | Invented | Invented | Real |

A production build cannot be pointed at another store. Non-production builds show their environment name.

Firebase (D-044): one project per environment, on the owner's Google account, location `asia-south1` wherever Firebase asks. `google-services.json` is gitignored; a build without its own environment's file fails at prebuild, so no build can reach another environment's project. The first staging build therefore needs the staging Firebase project.

## Feature flags

Typed flags with compiled defaults in `src/config/featureFlags.ts`, read from Firebase Remote Config (D-012, D-045, D-046). The first flag is `checkout_presentation` (`sheet` or `browser`, default `sheet`), the kill switch for D-033 and risk 2.

```
App start ── render at once (never waits for Remote Config)
   └─ activate()  local read: promotes values fetched last session
        ├─ done      → snapshot = last activated values ─┐
        ├─ failed    → snapshot = defaults (Sentry)      ├─ frozen for the session
        └─ 3 s pass  → snapshot = defaults (Sentry)    ──┘
                          └─ fetchConfig() in background, not activated:
                             new values apply from the next cold start
Consumers: await loadFeatureFlags(), or useFeatureFlags() ("not ready" until frozen)
```

- `src/featureFlags/remoteConfig.ts` is the only file that imports Firebase; `src/featureFlags/session.ts` holds the snapshot. `ensureInitialized()` is never called: on Android it also fetches and activates, blocking.
- Minimum fetch interval: production 1 hour, staging 15 minutes, development 0. A change reaches a production phone at its second cold start after the change, the first of them at least an hour after its previous fetch: typically within a day. An app left running does not switch until it restarts.
- Only a valid Remote Config value overrides a default; a malformed one gives the default and a Sentry warning naming the flag.
- **Phase 9 design item:** the checkout flag must take effect without waiting for two restarts, for example by activating fetched values when checkout is opened (D-046).

## Data layer: Storefront API (P5-01)

One module, `src/shopify/client.ts`, calls the Storefront API (D-056). Operations are `#graphql` strings in `src/shopify/`, typed by code generation from the saved schema (D-054, D-055).

```
Screen / feature code
   └─ a function in src/shopify/ (for example listDevCheckoutVariants)
        └─ storefrontQuery(OPERATION, { variables, signal })   or   storefrontMutation(...)
             ├─ adds country and language from src/config/ (D-058)
             ├─ POST https://<store>/api/2026-10/graphql.json, public token header
             ├─ each attempt ≤ 15 s; the whole call ≤ 30 s (D-057)
             ├─ query only: retry after no network, timeout, throttling or 500/502/503/504,
             │    at most 2 retries, random backoff, Retry-After up to 10 s honoured
             └─ result: typed data, or a StorefrontError (kind, code, operation name, status,
                  Shopify enum codes; never Shopify's text, variables, domain or token)
   Caller: reportStorefrontError(error, handledCodes) applies the Sentry rule (D-057)
```

- ESLint stops `fetch` anywhere in `src/` except `client.ts`, and GraphQL operation strings anywhere outside `src/shopify/`.
- Generated files live in `src/shopify/generated/`: the saved schema and `.d.ts` types only. Nothing generated reaches the app bundle.
- Since P5-02, screens reach these functions only through hooks and the query cache (next section), and the cache, not the caller, applies `reportStorefrontError`.

## Query cache (P5-02)

One TanStack Query client for the whole app (D-061), in `src/query/`, shared by every data source: the Storefront API now, the Customer Account API in Phase 7, the backend in Phase 10. In memory only, with no persister (D-059).

```
Screen (src/app/, src/components/)
   └─ hook in a data source's hooks folder (for example src/shopify/hooks/devCheckout.ts)
        ├─ useQuery: key under the source's root (['storefront', …]), a freshness preset (D-062),
        │    and the cache's cancel signal passed to the function in src/shopify/
        └─ useMutation: key under the same root, never retried; meta.handledCodes for user errors
   Query client (src/query/queryClient.ts): retry off; QueryCache and MutationCache onError
        └─ reportQueryError (src/query/errorReporting.ts), the one place errors are reported:
             StorefrontError → reportStorefrontError (D-057); cancel → never reported;
             anything else → "unexpected", by safeErrorCode() only
   AppQueryProvider (src/query/QueryProvider.tsx) at the root layout; AppState drives
        focusManager, so stale queries refetch when the app returns to the foreground (D-063);
        expo-network drives onlineManager (src/query/online.ts, D-064): offline, queries pause
        and keep their data, and resume or refetch on reconnect; mutations always run (D-065)
```

- **Freshness presets** (`src/query/freshness.ts`, D-062): `catalogue` (default) 5 min fresh, 30 min kept; `liveStock` 30 s fresh, 5 min kept, refetched whenever a screen using it opens; `staticContent` 6 h fresh, 24 h kept; `checkout` never cached.
- **Clearing:** `clearStorefrontCache()` (`src/shopify/cache.ts`) cancels and removes only `['storefront', …]` queries and mutations. `clearAllCaches()` (`src/query/queryClient.ts`) cancels every query in flight and empties the cache; Phase 7's logout calls it.
- **Personal data:** each data source has its own key root and its own rule. Storefront operations select no personal field (a test enforces it); customer data (Phase 7) will be cached in memory only and cleared on logout.
- **Boundary** (ESLint, D-063): TanStack only in `src/query/` and data-source `hooks/` folders; the Storefront client only from `src/shopify/`; screens and components import values only from hooks, `src/shopify/errors.ts` and the provider, and types from anywhere.
- **Network awareness** (D-064, D-065): offline only when expo-network reports `isConnected` false with a known type; an unknown state counts as online. Queries pause offline; a mutation is never paused or queued, so offline it fails at once with `no-network`, which is never reported.

## Built for a second country

Everything specific to the India store sits in configuration: store domain, currency, fees, order cap, pincode rule. A Bahrain app can be produced from the same code with its own configuration and its own app ID.
