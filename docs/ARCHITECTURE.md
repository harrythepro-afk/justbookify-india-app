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
| Third-party services | APNs and FCM delivery, crash reporting, analytics, feature switches, WhatsApp, Razorpay, Judge.me |

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
| Customers | Invented | Invented | Real |

A production build cannot be pointed at another store. Non-production builds show their environment name.

## Built for a second country

Everything specific to the India store sits in configuration: store domain, currency, fees, order cap, pincode rule. A Bahrain app can be produced from the same code with its own configuration and its own app ID.
