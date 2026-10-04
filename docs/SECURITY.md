# Security baseline

The app is an untrusted client. Every permission check happens on Shopify or on the backend. Follows OWASP MASVS and the OWASP Mobile Top 10.

## Checklist

### Authentication
- [ ] Customer Account API with OAuth 2.0 and PKCE in the system browser session
- [ ] The app never handles a password
- [ ] Access tokens are short-lived and refreshed; one shared refresh in flight
- [ ] Logout ends the Shopify session, deletes local tokens and caches, and unregisters the push token

### Authorization
- [ ] Customer identity is derived on the server from a validated token
- [ ] No endpoint accepts a customer, order or return ID without checking it belongs to the caller

### Device storage
- [ ] Tokens only in iOS Keychain and Android Keystore-backed storage
- [ ] Nothing sensitive in AsyncStorage, plain files, logs or crash reports
- [x] Crash reports (Sentry, D-042): `sendDefaultPii` off; no tracing, replay, screenshots, view hierarchy, logs or failed-request capture. `beforeSend` and `beforeBreadcrumb` (`src/crashReporting/scrub.ts`) remove the user, request headers, cookies, bodies and query strings, the device name, frame variables and console breadcrumbs. They also filter emails, phone numbers, tokens, customer and order GIDs, the store domain and the Storefront token from every string. Unit tests prove it. Native crashes skip that code; Sentry's server-side data scrubbing and "Prevent Storing of IP Addresses" cover them. Sentry's server derives a location from the address each report arrives from, even though the IP is not stored. Two Advanced Data Scrubbing rules in the Sentry project (Remove `user.geo.city`, Remove `user.geo.subdivision`) leave only the country; checked on 4 October 2026. Sentry's server also fills `device.name` with the public marketing name of the Android model; the app's own device name is never sent. The source-map upload token is an EAS secret only

### Network
- [ ] TLS everywhere; no cleartext exceptions
- [ ] Request timeouts; retries only for safe reads, with backoff and jitter
- [ ] Checkout and writes are never retried automatically

### Secrets
- [ ] No secret in the app bundle or the repository
- [ ] Server secrets in a managed secret store; CI secrets scoped per environment
- [ ] Rotation at least yearly and on any change of people

### API protection
- [ ] Rate limits per customer and per device on the backend
- [ ] Schema validation on every request; idempotency keys on writes
- [ ] Webhooks verified by signature, with replay rejection

### App integrity
- [ ] Apple App Attest and Google Play Integrity verified by the backend on sensitive writes; log first, then block
- [ ] Phase 14: restrict the Android API key in each environment's `google-services.json` to the app's package and signing certificate, keeping the Firebase Installations and Remote Config APIs allowed (D-044). Afterwards every build must be shown to fetch a changed flag again (`TESTING.md`, "Release gate: feature flags")

### Data
- [ ] Collect only what a rental needs; no children's data
- [ ] No personal data in analytics, logs or push text
- [x] No advertising identifiers, permanently for version 1 (D-009, D-045): `AD_ID` blocked in the manifest, Advertising ID and SSAID collection off and every advertising consent denied in `firebase.json`, pinned by a unit test. Firebase Analytics is installed (Remote Config requires it) with collection off until P4-04
- [ ] Remote Config fetches send Firebase's per-install identifier (Firebase Installations). Declare it in the store privacy labels in Phases 17 and 18

### Payments
- [ ] Payment stays inside the store's checkout or at the door
- [ ] The app and backend never see card, UPI or bank details

### Supply chain
- [ ] Exact versions pinned; lockfile committed
- [ ] Dependency audit and secret scan on every pull request
- [ ] A new native module needs a decision record

### Development
- [ ] Protected main branch: pull request required, both CI jobs required, no force pushes. Not available on GitHub Free for a private repository; the merge rule in `CLAUDE.md` stands in (risk 18)
- [x] Review: the architect reviews every pull request in chat; merge only on the owner's "approved, merge" (D-026)
- [ ] No production credentials on developer machines
- [ ] Separate Shopify apps and tokens per environment

## Threats specific to JustBookify

1. Scripted cash-on-delivery orders that take books out of circulation.
2. A logged-in customer filing a return against someone else's order.
3. A leaked Admin token exposing every family's address and phone number.

## Secret inventory

Names and locations only. Fill in as each secret is created.

| Secret | Where it lives | Created | Last rotated |
| --- | --- | --- | --- |
| Android signing keystore, development app ID only (D-029) | EAS servers, project `@hemant6626/justbookify-india` | 2026-10-03 | Never |
| `google-services.json`, development project `justbookify-india-dev` (D-044). Not a secret in Firebase's model (its API key is public by design), but kept out of git | EAS file variable `GOOGLE_SERVICES_JSON` (Secret, development) and the gitignored local file | 2026-10-04 | Never |
