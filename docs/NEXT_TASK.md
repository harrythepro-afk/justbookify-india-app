# Next task: P6-06, search

Status: in progress on branch `p6-06-search` (plan accepted by the owner on 8 October 2026). P6-05 (the book page) is merged (`1876ac1`, PR #18).

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
| P6-05 (done, 1876ac1) | The book page from every card: cover, author, title, the sentence for a rented-out book only, prices with the "Rent" or "Rented Out" badge, the description as native text from untrusted HTML, genre chips; no rating (Phase 13); `liveStock`; a description sample in the preview | D-090 to D-094 |
| P6-06 (in progress, branch `p6-06-search`) | Search: Storefront `search` (books only, partial last word), results as you type from 3 letters or the search key from 2, "Available now" off (`LAST`/`HIDE`), Relevance and the two price sorts, the count line and the website's no-results line, earlier results kept while a new term loads; the term never logged, sent to analytics or reported; the standing phone-check permission | D-095 to D-098 |
| Later in Phase 6 | The Genre filter (after the architect mirrors the live filters); the longer series list; the offline question, revisited in the last Phase 6 task (D-087) | |

## Goal of P6-06

A customer finds a book by title, author or series (`PRODUCT_REQUIREMENTS.md`: "Search with suggestions as you type"; "Search sits under Browse"; Home's header has a search button). Results use the book card and open the book page (P6-05).

## Proposed scope

1. A search screen opened from Home's header and from Browse, with a text field, suggestions while typing and a results grid of book cards (`BookGrid`, "Load more").
2. Typed Storefront operations: `predictiveSearch` for suggestions and `search` (or the root `products` query) for results, checked against the saved `2026-10` schema and Shopify's documentation before building, with the version recorded.
3. The query text is never logged, cached under a personal key or sent to analytics (`search` event: `term_length` and `result_count` only, if the owner wants it wired now).
4. Offline, error and empty states as on the other catalogue screens (D-078, D-082).
5. Phone check on build 3c8bf273 if nothing native changes, with the standing step.

## Questions for the owner and the architect

1. What does the live website's search show: suggestions while typing (books only, or also collections and authors), and what does its results page show and in which order (architect, view only)?
2. Does "Available now" apply to search results, on by default as on Browse?
3. From how many letters do suggestions start, and how many show?
4. Wording for no results.
5. Wire the `search` analytics event now (consent is still required, D-048), or with the other catalogue events?

## Out of scope

- The Genre filter and the longer series list (later Phase 6 tasks).
- Cart and notify-me actions (Phase 8 and later).
- Anything on the live store.

## Follow-ups (recorded, not part of P6-05)

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
  - **Book page:** done in P6-05: the app shows the website's sentence only for a book that cannot be ordered (D-090).
  - **Ratings:** not on the book page (D-092). Phase 13 (reviews) reads `reviews.rating` and `reviews.rating_count`, handling a rating without a count and a malformed rating (D-071).
  - **Website cards** show no author and no stars; the app's card keeps the author (D-073).
- **Book card preview** (D-074, D-088): kept until Phase 8, when customer screens draw the card's buttons. Since P6-05 it also holds the book page links and the description sample (D-094).
- **Description tables (architect's review of PR #18):** cells in one table row run together with no space ("AB"). Fix in the last Phase 6 task, with a test.
- **Development store descriptions (architect's review of PR #18):** all 42 are a single `<p>` with no `<br>` or `<strong>`, so their headings and bullets run together on the book page. No re-import now. Before the release-build check, the owner pastes full descriptions into a few books in the development admin.
- **Analytics events for catalogue screens (P6-05):** `view_collection` and `view_book` (`ANALYTICS.md`) are not wired; screen views are (D-053). Wire them in one task, with the owner's choice of timing.
- **Book page in a release build:** the description and the full-width cover are checked on the development build only; include a long real description in the release-build list check (`TESTING.md`, "Release gate: list performance").
- **Bottom inset:** Browse is a tab screen, so its tab bar already takes the inset, as on Home; any new stack screen adds it (D-080).
- **Cold test start (P6-03, owner to decide):** with Jest's cache off, the first render in `account.test.tsx`, `tabs.test.tsx` and `BookCard.test.tsx` still takes 2.4 to 4.1 s (under the 5-second limit). A public-import touch does not move it (`CURRENT_STATUS.md`); no deep import is used without the owner's yes.
