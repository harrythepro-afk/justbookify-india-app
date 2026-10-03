# Testing

## Layers

| Category | Covers | Tooling | Runs |
| --- | --- | --- | --- |
| Unit | Fee thresholds, cart rules, link router, date logic | Jest | Every pull request |
| Component | Screens with fixed data, including empty and error states | React Native Testing Library | Every pull request |
| Integration | Data layer against a mocked GraphQL server | Mock service worker | Every pull request |
| Contract | Every GraphQL operation against the pinned Shopify schema | GraphQL code generation | Every pull request |
| Shopify API | Real queries against the development store | Scripted checks | Nightly |
| End-to-end | Browse, select, login, checkout, confirmation on a built app | Maestro or Detox | Nightly and before release |
| Security | Dependency audit, secret scan, backend authorization tests | CI scanners | Pull request and before release |
| Accessibility | Screen-reader labels, text scaling, contrast, touch-target size | Automated and manual | Before release |
| Performance | Launch time, scrolling, memory on reference devices | Profilers and traces | Before release |
| Backend load | Webhook bursts and push fan-out | k6 or similar | Before launch |

Mocks are for unit and component tests only. Anything touching cart, checkout or login is tested against a real development store. Never test on the live store.

## Edge cases

| Case | Expected behaviour |
| --- | --- |
| Offline | Cached catalogue and cart readable; banner shown; checkout disabled |
| Connection drops during checkout | On reconnect, look for a new order before offering checkout again |
| Duplicate taps | One cart line, one checkout, one return request |
| Stale inventory | Availability re-checked at cart review and at checkout |
| Book becomes unavailable | The book is flagged; the customer removes or swaps it; totals refresh |
| Session expires | Silent refresh; if that fails, login prompt; cart kept |
| Invalid discount | Shopify's message shown; checkout continues without it |
| Backend timeout | Returns and push settings show a retry; browsing unaffected |
| Shopify timeout | Cached content shown; a retry control; no blank screens |
| Push opened while logged out | Login, then the intended screen |
| Deep link while the app is closed | Routed once after startup |
| Upgrade with old cached state | Cache carries a schema version; mismatches are discarded |
| Payment pending | "Confirming payment" state; never invite a second payment |
| Two devices at once | Cart is per device; orders and returns always consistent |
| Order cap reached | Cart explains the ₹500 cap and blocks checkout |
| Subtotal under ₹500, total with shipping over ₹500 | Checkout allowed, including cash on delivery (R2 and ACOD check the subtotal; P3-02) |
| Cash on delivery from ₹200 | Shipping hint ₹50, not free (D-031) |
| Pincode outside the service area | Clear message before checkout opens |
| Checkout presentation flag set to browser | Checkout opens in the system browser; the return link brings the customer back to the app; no rebuild needed (D-033) |

## Device matrix

Three iPhones and four Android phones, including one with 2 to 3 GB of memory. Exact models are chosen in Phase 16.

## Early checks

The checks in `SHOPIFY_INTEGRATION.md` each run before anything is built on their result.

| Check | When |
| --- | --- |
| 1a (redirect to Razorpay and back) and 1b (hand-off to a real UPI app) | Both at the owner-approved launch rehearsal on the live store, with one small real order (D-033). Razorpay cannot be installed on the development store, whose business entity is in Bahrain, and UPI Intent works only in Razorpay live mode |
| 2 (cash on delivery and checkout rules) | Passed on Android in Phase 3 (P3-02). iOS when Apple access exists (D-019) |
| 3 (guest order after login) | The phase that builds login (D-034) |
| 4 (return through the Admin API) | The phase that builds the backend (D-034) |
| 5 (links open the app) | The phase that builds deep links, Phase 12 (D-034, risk 17) |
| 6 (Judge.me reviews) | The phase that builds reviews (D-034) |

Until the rehearsal, nothing proves that a prepaid payment works inside Checkout Kit (risk 2). The checkout screens therefore ship with a remote flag that can move checkout to the system browser with a return link (D-033). Tests for the checkout screens cover both settings of the flag.
