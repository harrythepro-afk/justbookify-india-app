# Security baseline

The app is an untrusted client. Every permission check happens on Shopify or on the backend. Follows OWASP MASVS and the OWASP Mobile Top 10.

## Checklist

### Authentication
- [x] Customer Account API with OAuth 2.0 and PKCE in the system browser session (P7-01, D-119): authorization code with PKCE S256, the app's own 32-byte `state` checked twice, a 32-byte nonce checked in the ID token with the issuer, audience, expiry and `iat` (D-121); a Custom Tab on Android, `ASWebAuthenticationSession` on iOS, never a web view. Endpoints come from the store's discovery document, refused unless https with the issuer naming the configured shop (D-120). Unit tests prove it; the phone check is recorded in `CURRENT_STATUS.md`
- [x] The app never handles a password: the customer types the email and the emailed code on Shopify's own page (D-005)
- [x] Access tokens are short-lived and refreshed; one shared refresh in flight (D-121): refreshed with 5 minutes or less left; only Shopify's `invalid_grant` logs the customer out, every other failure keeps them signed in
- [ ] Logout ends the Shopify session, deletes local tokens and caches, and unregisters the push token. Done in P7-01 (D-122): local tokens deleted (pointer first), `clearAllCaches()`, then Shopify's mobile logout call with `id_token_hint`. The push token comes with Phase 12. A website logout does not log the app out (owner, answer 3)

### Authorization
- [ ] Customer identity is derived on the server from a validated token. The app's profile and orders (P7-02) come from the Customer Account API, where Shopify derives the customer from the access token; the app sends no customer ID. The backend (Phase 10) is still to do
- [ ] No endpoint accepts a customer, order or return ID without checking it belongs to the caller

### Device storage
- [x] Tokens only in iOS Keychain and Android Keystore-backed storage (P7-01, D-121): `expo-secure-store` through `src/customerAccount/tokenStorage.ts` only (ESLint), `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, Android backup off (D-052). Saved crash-safely (two slots and a pointer; a test kills the save after every write) and in chunks of at most 1,500 characters. Never in logs, analytics, Sentry, the query cache or screen state; the Account tab shows the email from the ID token only
- [ ] Nothing sensitive in AsyncStorage, plain files, logs or crash reports. Since P7-02 (D-127) the customer's profile and orders are held in memory only, under `['customer', …]`, emptied by `clearAllCaches()` at logout and on a refused refresh, and never logged or reported (privacy test)
- [x] Crash reports (Sentry, D-042): `sendDefaultPii` off; no tracing, replay, screenshots, view hierarchy, logs or failed-request capture. `beforeSend` and `beforeBreadcrumb` (`src/crashReporting/scrub.ts`) remove the user, request headers, cookies, bodies and query strings, the device name, frame variables and console breadcrumbs. They also filter emails, phone numbers, tokens, customer and order GIDs, the store domain and the Storefront token from every string. Since P7-01 (D-121) also the customer's tokens held in memory by value, `shc…_` tokens, the login callback URL whole, other app schemes' query strings, the shop ID by value, and the login's own keys (`nonce`, `verifier`, `code_challenge`, `code`, `state`). Unit tests prove it. Native crashes skip that code; Sentry's server-side data scrubbing and "Prevent Storing of IP Addresses" cover them. Sentry's server derives a location from the address each report arrives from, even though the IP is not stored. Two Advanced Data Scrubbing rules in the Sentry project (Remove `user.geo.city`, Remove `user.geo.subdivision`) leave only the country; checked on 4 October 2026. Sentry's server also fills `device.name` with the public marketing name of the Android model; the app's own device name is never sent. The source-map upload token is an EAS secret only

### Network
- [ ] TLS everywhere; no cleartext exceptions
- [x] Request timeouts; retries only for safe reads, with backoff and jitter. Storefront API (D-057): 15 seconds per attempt, 30 seconds per call; queries only, at most 2 retries with random backoff; unit tests prove it. Since P7-02 the Customer Account API uses the same shared transport (`src/graphql/transport.ts`, D-126), with one refresh after a 401 inside the same 30 seconds; it has no mutation yet
- [ ] Checkout and writes are never retried automatically. Storefront mutations are never retried (D-057, tested); still open for Checkout Kit (Phase 9) and the backend (Phase 10)

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
- [x] **Remote Config values are untrusted input, and not secret** (P6-11, D-116): every value is parsed against a fixed shape (a flag's allowed values; the wanted list's JSON list of names with its limits), never shown on screen as written, never logged, and reported to Sentry by parameter name and reason codes only. Remote Config is readable by anyone who has the app's public Firebase settings, which ship inside every build, so **nothing private may be put in it**: the wanted list (the names the owner is thinking of stocking) can be read by a determined outsider
- [ ] Phase 14: restrict the Android API key in each environment's `google-services.json` to the app's package and signing certificate, keeping the Firebase Installations and Remote Config APIs allowed (D-044). Afterwards every build must be shown to fetch a changed flag again (`TESTING.md`, "Release gate: feature flags")

### Data
- [ ] Collect only what a rental needs; no children's data
- [ ] No personal data in analytics, logs or push text. Analytics part done in P4-04 (D-053): typed events and a runtime guard; screens by route name only; no user ID until Phase 7 (D-050). Logs and push text remain. P7-02 (D-127): profile and order values only on screen; `CustomerAccountApiError` carries codes only; a privacy test runs the real client, cache, hooks and screens with marker values and finds none in console, Sentry or analytics
- [x] Analytics is opt-in (D-048): collection off until the customer's consent, withdrawal stops it at once and resets the phone's analytics data. Android backup and device transfer are off, so a restored phone never starts with collection on and no consent record (D-052)
- [ ] Before any outside tester: a working consent request and the privacy policy's app section (`TESTING.md`, "Release gate: analytics consent"; risk 21)
- [x] No advertising identifiers, permanently for version 1 (D-009, D-045): `AD_ID`, `ACCESS_ADSERVICES_AD_ID` and `ACCESS_ADSERVICES_ATTRIBUTION` blocked in the manifest and checked on each new build's APK (`TESTING.md`, "APK permission check"), Advertising ID and SSAID collection off and every advertising consent denied in `firebase.json`, pinned by a unit test. From P4-04, analytics collection is on only with the customer's consent (D-048); the advertising keys are unchanged (D-049). `USE_BIOMETRIC` and `USE_FINGERPRINT` (from `expo-secure-store`'s biometric library) are blocked as well (D-052)
- [ ] Store privacy labels (Apple) and the Data safety form (Google), in Phases 17 and 18. Declare:
  - Firebase's per-install identifier (Firebase Installations), sent by Remote Config fetches whatever the consent;
  - with analytics consent only: app interactions (screens viewed, events in `ANALYTICS.md`), the analytics app instance ID, and the install source from the Play install referrer (D-049);
  - after Phase 7, for consenting customers: the per-customer analytics ID linked to the account (D-050);
  - crash reports (Sentry, D-042);
  - analytics data retained 14 months (D-051).

  None of it is used for advertising or tracking across other companies' apps.

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
