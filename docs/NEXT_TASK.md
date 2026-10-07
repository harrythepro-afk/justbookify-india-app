# Next task (proposal): P6-04, Browse ("Books for Rent")

Status: proposal. P6-03 (the Home screen and the collection screen) is on branch `p6-03-home`; see `CURRENT_STATUS.md`. P6-04 starts when the owner starts it.

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
| P6-03 (branch `p6-03-home`, PR open) | The Home screen and the collection screen: Home content in configuration, only collections that exist, a square white cover frame, offline and error states, stale-only focus refetch, no dead card buttons | D-075 to D-081 |
| P6-04 (proposed) | Browse, "Books for Rent" | Records for the Browse groups, the "Available now" toggle and sort |

## Goal of P6-04

The Browse tab, titled "Books for Rent", following `PRODUCT_REQUIREMENTS.md` ("Screen layouts", Browse) and the website's collection pages (D-037): filter buttons for Age group and Series, an "Available now" toggle, a sort control, and a two-column grid of book cards. Groups are the store's own collections by handle (D-068); the Home content's series and age groups (D-075) are the natural starting list. Home's "Books for Rent" and "All series" already open this tab.

## Proposed scope

1. **Browse groups in configuration** (`src/config/`): the Age group and Series lists, store-specific and typed, probably shared with Home's (D-075); only collections that exist are offered (D-076).
2. **"Available now" toggle**, on by default as on the website, applied to Browse and to the collection screen (D-080), through the Storefront `filters` argument (`available: true`), which the development store supports (P6-01).
3. **Sort:** the options the website offers, mapped to Storefront `ProductCollectionSortKeys`.
4. **What Browse shows with no group chosen** (all books needs a collection or a product search; a question for the owner).
5. **Remove the development-only book card preview** (D-074) once Browse shows the card, unless the owner keeps it.
6. **Phone check** on the existing build 3c8bf273 if nothing native changes.
7. **Docs:** decisions, `TESTING.md`, `CURRENT_STATUS.md`, and the next task.

## Questions for the owner and the architect

1. **No group chosen:** what does Browse list first: the `frontpage` collection, an all-books collection on the live store, or a Storefront product search?
2. **Series filter:** the same 15 series as Home, or a longer list (the live store has more than 50 collections)?
3. **Sort options:** which ones, in which order, and the default (from the website)?
4. **"Available now" off:** is a rented-out book still shown with its badge and no button (D-081), as today?
5. **Genre filter:** still waits for the architect to mirror the live filters in the development store (from P6-01)?

## Out of scope

- Search and the book page (later Phase 6 tasks).
- The Genre filter until the development store has it.
- Cart and notify-me actions (Phase 8 and later; until then the card shows no button, D-081).
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
- **Phase 6, foreground refetch with real data (owner, P5-02 phone check):** step 9 of P6-03's phone check (`TESTING.md`), on `one-of-us-2-next`, with more than 5 minutes in the background because Home uses the `catalogue` preset. Remove this entry once that step passes.
- **Phase 9, Checkout Kit TLS errors (owner, P5-02 phone check):** the app's log showed two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the development store's password page loaded. The page itself loaded. Re-check during Phase 9's checkout tests.
- **Phase 7, logout (D-061):** call `clearAllCaches()`; customer data gets its own key root and is cached in memory only.
- **Sentry, offline case (P5-03):** the owner may confirm that the development Sentry project shows no new event from the P5-03 phone check (7 October 2026, 03:13 to 03:18 IST).
- **Local builds (D-067):** a fallback only, when the EAS queue is stuck. On this computer they need about 5 GB of free memory, other heavy programs closed, and `--max-workers=2`.
- **Genre filter (from P6-01):** the Storefront `filters` on a collection return only Availability and Price on the development store. A later Phase 6 task decides how the Genre filter works (`PRODUCT_REQUIREMENTS.md`, Browse), without parsing tags or `productType` (D-068).
- **Phone checks in Phase 6:** use the named example books in `TESTING.md` ("Sample catalogue (P6-01)").
- **From the live website (architect, view only, 7 October 2026; `SHOPIFY_AUDIT.md`), not built yet:**
  - **Browse default:** the website's collection pages open with the "In stock" availability filter already on. Input for P6-04 ("Available now", D-080).
  - **Genre filter:** the live store has Genre, tag and Service City filters configured; the development store has only Availability and Price. The architect mirrors the filter setup in the development store before the Genre filter task.
  - **Book page:** it must not show an unavailable message for a book that can be ordered at zero stock (R8, D-073). The live book page does show one ("Currently not available as another junior reader is enjoying this book."); the owner knows.
  - **Ratings:** the book page task reads `reviews.rating` and `reviews.rating_count`, handling a rating without a count and a malformed rating (D-071). The card shows none (D-073).
  - **Website cards** show no author and no stars; the app's card keeps the author (D-073).
- **Remove the book card preview** (D-074) once Browse shows the card (owner, P6-03: kept until then).
- **Bottom inset:** Browse is a tab screen, so its tab bar already takes the inset, as on Home; any new stack screen adds it (D-080).
- **Cold test start (P6-03, owner to decide):** with Jest's cache off, the first render in `account.test.tsx`, `tabs.test.tsx` and `BookCard.test.tsx` still takes 2.4 to 4.1 s (under the 5-second limit). A public-import touch does not move it (`CURRENT_STATUS.md`); no deep import is used without the owner's yes.
