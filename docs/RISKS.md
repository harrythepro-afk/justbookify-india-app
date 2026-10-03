# Risks

Reviewed at the end of every phase.

| # | Risk | Why it matters | Mitigation | Severity | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Checkout apps behave differently inside the app | ACOD and SMART Checkout Rules alter checkout and must work inside Checkout Kit | Early check 2 | High | Open |
| 2 | Razorpay redirect and UPI hand-off inside an in-app checkout | A payment could fail or strand the customer between apps | Early check 1; fallback is browser checkout with a return link | High | Open |
| 3 | Rental records may be incomplete | About 600 fulfilled orders have no return recorded | Spot-check the oldest before launch | High | Open |
| 4 | Old books not collected when a new order arrives | A family may hold two sets | Show the books due for collection at checkout | High | Open |
| 5 | Testing on the live store | Test orders remove real books and trigger deliveries | Development stores only; one approved launch rehearsal | High | Open |
| 6 | Cash-on-delivery abuse | Orders take books out of circulation without payment | Login required; rate limits; integrity checks | Medium | Open |
| 7 | Return requests do not reach staff | A new return path through the Admin API | Early check 4; fallback is the same email the website sends | Medium | Open |
| 8 | App Store rejection for minimum functionality | A thin wrapper is refused | Native browsing, rental status and notifications | Medium | Open |
| 9 | Half the catalogue is unavailable | Disappointing browsing | "Available now" as the default filter; notify-me | Medium | Open |
| 10 | Privileged token leak | Exposes customers' addresses and phone numbers | Server-only tokens; least scopes; rotation | Medium | Open |
| 11 | Developer accounts are in an individual's name | The business is a sole proprietorship today | Move the app to the company's accounts once the company exists. This includes the EAS project, which is on the owner's personal Expo account (D-028) | Medium | Open |
| 12 | Deep-link verification on a Shopify-hosted domain | Links may not open the app | Early check 5; fallback is a link subdomain | Medium | Open |
| 13 | WhatsApp consent gap | Reminders go to the checkout phone number with no separate consent | Owner to review with a local adviser; the app collects its own consent | Medium | Open |
| 14 | Reviews API not available on the store's plan | Reviews are in version 1 | Early check 6; fallback is ratings only | Medium | Open |
| 15 | Dependency churn | Checkout Kit is being renamed; Expo and store rules change yearly | Pin versions; quarterly upgrade window | Low | Open |
| 16 | Damaged ISBN and barcode data | Cannot be used for lookups | Do not rely on barcodes in version 1 | Low | Open |
| 17 | Vulnerable URL parser in the deep-link path | Expo Router's `query-string` depends on `decode-uri-component` (GHSA-vcc3-ghjq-m6fr, affects 0.4.2 and below). A malformed percent-encoded link could stall the app's JavaScript thread. The fix is a major upgrade of `query-string` under Expo Router, deferred on 2026-10-03 | Must be fixed or mitigated before deep links are enabled in Phase 12. Re-check at every Expo upgrade, since a later Expo Router may carry the fix | Medium | Open |
| 18 | `main` has no branch protection | GitHub refused on 3 October 2026 (HTTP 403): branch protection needs GitHub Pro or a public repository. Direct pushes, force pushes and merges without passing CI are technically possible | The merge rule in `CLAUDE.md` (pull requests only, CI green on the latest commit, merge only on the owner's "approved, merge"); never push to `main` directly; CI also runs on every push to `main`. Changing the GitHub plan is the owner's decision | Medium | Open |
