# Next task (proposal): P6-05, the book page

Status: in progress on branch `p6-05-book-page`. P6-04 (Browse, "Books for Rent") is merged as `a57774a` (PR #17); see `CURRENT_STATUS.md`.

## Phase 5: Shopify data layer (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, ac714e8) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (done, 6bb14f2) | Network awareness with `expo-network` (queries pause offline, mutations never queue), a development APK built for `arm64-v8a` only (95.1 MB, was 246 MB), and local debug builds as a fallback | D-064 to D-067 |

## Phase 6: catalogue, search, filtering

| Task | Scope | Decisions |
| --- | --- | --- |
| P6-01 (done, e378fa6) | The development store's sample catalogue (40 real books loaded by the architect) recorded in `SHOPIFY_INTEGRATION.md` and `TESTING.md`; `npm run check:dev-store` asserts it over the Storefront API; `filters` probed | D-068 to D-071 |
| P6-02 (done, fa4c6c9) | Catalogue operations and hooks (`useCollectionBooks`, `useBookCard`), the `toBookCard` mapping, the book card, a development-only preview; `expo-image` and the Expo SDK 57 patch releases in one build (3c8bf273) | D-072 to D-074 |
| P6-03 (done, f9c3212) | The Home screen and the collection screen: Home content in configuration, only collections that exist, a square white cover frame, offline and error states, stale-only focus refetch, no dead card buttons, recovery from a false "offline" | D-075 to D-082 |
| P6-04 (done, a57774a) | Browse: all books through the root `products` query, Age group and Series one at a time, "Available now" on by default (also on the collection screen), the website's sorts, lists that close on back and outside taps; the preview kept until Phase 8 | D-083 to D-089 |
| P6-05 (in progress) | The book page | |
| Later in Phase 6 | Search; the Genre filter (after the architect mirrors the live filters); the longer series list; the offline question, revisited in the last Phase 6 task (D-087) | |

## Goal of P6-05

Tapping a book card opens its book page, so the cards on Home, Browse and the collection screen lead somewhere: cover, title, author, prices, availability, and the details the store records (`SHOPIFY_INTEGRATION.md`, "Product data the app reads"), following `PRODUCT_REQUIREMENTS.md` ("Screen layouts") and the live book page (D-037).

## Proposed scope

1. A stack screen by product handle, with the bottom inset (D-080), reading one book through a new typed operation and hook.
2. Details from the metafields the app may read: genre labels, language, binding (`shopify.book-cover-type`), publisher, pages when present. **Never the ISBN** (damaged on the live store).
3. Ratings from `reviews.rating` and `reviews.rating_count`, handling a rating without a count and a malformed rating (D-071).
4. Availability: a book orderable at zero stock must never show an unavailable message (R8, D-073), unlike the live page.
5. No "Add to Cart" or "Notify me" until Phase 8 and the notify-me task (D-081).
6. Cards on Home, Browse and the collection screen open the page.
7. Phone check on build 3c8bf273 if nothing native changes, with the standing step.

## Questions for the owner and the architect

1. Which details, in which order, and with which labels (the live page's wording)?
2. Description: show Shopify's description as plain text, and how long?
3. Ratings: stars and count, as on the live page, or the value only? What shows with a rating but no count?
4. More than one image per book: show all, or the cover only?
5. A book page for a product that no longer exists: wording ("This book is not available."?).

## Out of scope

- Cart and notify-me actions (Phase 8 and later).
- Search and the Genre filter (later Phase 6 tasks).
- Anything on the live store.

## Follow-ups (recorded, not part of P6-04)

- **Release gate: analytics consent (from P4-04):** no build goes to any tester other than the owner until all of these hold (`TESTING.md`; D-048):
  - the consent request is built (Phase 7, at the placement the owner chooses between the two in D-048) and works;
  - the Account switch withdraws consent at once;
  - a phone without consent sends nothing;
  - the privacy policy's app section is published.
- **Privacy policy app section (owner's task, risk 21):** before any outside tester, the store's privacy policy needs an app section, reviewed by a local adviser together with the draft consent wording. It covers:
  - analytics consent;
  - usage linked to the customer account;
  - the 14-month retention;
  - install-source reporting;
  - the events and data Firebase sends by itself once consent is granted (`ANALYTICS.md`);
  - crash reports (Sentry);
  - Firebase.
- **Analytics retention (owner, D-051):** set event data retention to 14 months, with "Reset user data on new activity" off, in the development Google Analytics property now, and in the staging and production properties when they are created.
- **Phase 7 (D-050):** the analytics user ID for consenting customers after login, cleared on logout and on withdrawal. The consent request must say that usage is linked to the account.
- **First staging build (from P4-02 and P4-03), a release gate:** no build goes to any tester other than the owner until it passes (`TESTING.md`, risks 19 and 20). It needs:
  - `EXPO_PUBLIC_SENTRY_DSN` as an EAS variable for the staging build's environment, an EAS-generated keystore for `com.justbookify.india.staging` (a decision), an installable APK, and a way to trigger the test crash. Sentry must receive a native crash, source maps must upload, and the raw crash event must show no IP address, city, device ID, store domain or token.
  - The staging Firebase project, with `google-services.json` for `com.justbookify.india.staging` as `GOOGLE_SERVICES_JSON` in the EAS preview environment (D-044). The build must be shown to fetch a changed flag (`TESTING.md`, "Release gate: feature flags").
  - The APK permission check (`TESTING.md`), and a permission list holding only what the app needs (`SYSTEM_ALERT_WINDOW`, external storage and `CHANGE_WIFI_MULTICAST_STATE` absent or justified).
  - A fresh install reaches Home on its first launch, with no stuck splash screen.
- `npm run audit:gate` exception for `@grpc/grpc-js` (D-047) is reviewed by 2026-11-15, with the `braces` entry; it never applies to the Phase 10 backend.
- Phase 9: the checkout flag must take effect without waiting for two restarts (D-046).
- Phase 14: restrict the Android API key in each `google-services.json`, then repeat the flag fetch check on every build (D-044).
- **Store variables for EAS (from P5-01):** add `EXPO_PUBLIC_STORE_COUNTRY` and `EXPO_PUBLIC_STORE_LANGUAGE` to the EAS environment when the staging build is set up (D-058).
- **Storefront domain for staging and production (architect, P5-01):** when the staging and production configurations are set up, confirm from Shopify's documentation which store domain the Storefront API calls should use, so that requests are not redirected.
- **Code generator audit entries (D-060):** reviewed by 2026-11-15 with the `braces` and `@grpc/grpc-js` entries; re-checked whenever the preset or the codegen CLI is upgraded; each removed in the commit that picks up a compatible fix.
- **Offline question (architect, D-087):** no change now; queries keep pausing with D-082's safety net. Revisit in the last Phase 6 task, with the evidence from every phone check's standing step until then.
- **Standing phone-check step (owner, D-082):** in every phone check, after more than 5 minutes in the background, no false offline notice (`TESTING.md`).
- **Release gate: list performance (P6-03):** the collection list (and Browse) must scroll and load more smoothly on a release build before any outside tester (`TESTING.md`). Measured so far only with production-mode JavaScript: the 6 extra books of `junior-readers` on screen within 0.8 to 1.8 seconds. Browse reuses the collection screen's list settings (D-080, `34218d5`).
- **Phase 9, Checkout Kit TLS errors (owner, P5-02 phone check):** the app's log showed two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the development store's password page loaded. The page itself loaded. Re-check during Phase 9's checkout tests.
- **Phase 7, logout (D-061):** call `clearAllCaches()`; customer data gets its own key root and is cached in memory only.
- **Sentry, offline case (P5-03):** the owner may confirm that the development Sentry project shows no new event from the P5-03 phone check (7 October 2026, 03:13 to 03:18 IST).
- **Local builds (D-067):** a fallback only, when the EAS queue is stuck. On this computer they need about 5 GB of free memory, other heavy programs closed, and `--max-workers=2`.
- **Longer series list (architect, P6-04):** Browse's Series list is Home's 15 (D-084); the architect supplies a longer list with the later filters task.
- **Genre filter (from P6-01):** the Storefront `filters` on a collection return only Availability and Price on the development store. A later Phase 6 task decides how the Genre filter works (`PRODUCT_REQUIREMENTS.md`, Browse), without parsing tags or `productType` (D-068).
- **Phone checks in Phase 6:** use the named example books in `TESTING.md` ("Sample catalogue (P6-01)").
- **From the live website (architect, view only, 7 October 2026; `SHOPIFY_AUDIT.md`), not built yet:**
  - **Genre filter:** the live store has Genre, tag and Service City filters configured; the development store has only Availability and Price. The architect mirrors the filter setup in the development store before the Genre filter task.
  - **Book page:** it must not show an unavailable message for a book that can be ordered at zero stock (R8, D-073). The live book page does show one ("Currently not available as another junior reader is enjoying this book."); the owner knows.
  - **Ratings:** the book page task reads `reviews.rating` and `reviews.rating_count`, handling a rating without a count and a malformed rating (D-071). The card shows none (D-073).
  - **Website cards** show no author and no stars; the app's card keeps the author (D-073).
- **Book card preview** (D-074, D-088): kept until Phase 8, when customer screens draw the card's buttons.
- **Bottom inset:** Browse is a tab screen, so its tab bar already takes the inset, as on Home; any new stack screen adds it (D-080).
- **Cold test start (P6-03, owner to decide):** with Jest's cache off, the first render in `account.test.tsx`, `tabs.test.tsx` and `BookCard.test.tsx` still takes 2.4 to 4.1 s (under the 5-second limit). A public-import touch does not move it (`CURRENT_STATUS.md`); no deep import is used without the owner's yes.
