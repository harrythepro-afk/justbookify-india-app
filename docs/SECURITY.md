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

### Data
- [ ] Collect only what a rental needs; no children's data
- [ ] No personal data in analytics, logs or push text

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
