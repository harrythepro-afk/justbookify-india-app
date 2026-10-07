# Next task (proposal): P6-03, the Home screen

Status: in progress on branch `p6-03-home`, started by the owner on 7 October 2026 with the answers below. P6-02 (catalogue data hooks and the book card) is merged as `fa4c6c9` (PR #15).

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
| P6-03 (in progress) | The Home screen | Records for the Home handles and the offline message |

## Goal of P6-03

The first customer-facing catalogue screen, following `PRODUCT_REQUIREMENTS.md` ("Screen layouts", Home) and the website's home page (D-037): a header with the store name, a banner with a "Books for Rent" button, a "Popular series" row, a "Browse by age" row of chips, and a "New arrivals" grid of book cards (P6-02). Everything reads through the P6-02 hooks; nothing new is native, so no new build is expected.

## Proposed scope

1. **Home handles in configuration** (`src/config/`, D-068): the collection handles, in order, for "Popular series", "Browse by age" and "New arrivals", typed and store-specific, from the architect's list (owner's answer 1 to P6-02).
2. **Operations and hooks:** the collection's own image and title for the series row (`Collection.image`), read by handle; the "New arrivals" grid through `useCollectionBooks`.
3. **A collection screen** (`collection/[handle]`): the two-column grid of book cards with "Load more", opened from a series tile or an age chip, with the not-found state (an empty collection, `tintin-series`, shows an empty state).
4. **Home layout:** header, banner ("Books for Rent" opens Browse), series row, age chips, New arrivals grid; the bottom safe-area inset (P6-02 finding); loading, error and offline states. The offline message's design is Phase 6's (D-065).
5. **Screen focus refetch** (D-062 follow-up): decide whether stack screens refetch when they regain focus.
6. **Remove the development-only book card preview** once Home shows the card (D-074), or keep it until Browse exists (owner).
7. **Phone check** on the existing build 3c8bf273 with JavaScript from Metro, including the Phase 6 foreground-refetch follow-up with real data.
8. **Docs:** decisions, `TESTING.md`, `CURRENT_STATUS.md`, and the next task.

## Questions for the owner and the architect

1. **Handles:** which collections, in which order, for "Popular series", "Browse by age" and "New arrivals" (from the live website)?
2. **Banner:** the headline, the line of text and the "Books for Rent" target, copied from the website (D-037)?
3. **Header search button:** search is a later Phase 6 task. Hide the button until then, or show it and open Browse?
4. **Series tiles:** the collection's own image from Shopify, or the cover of its first book? Some collections may have no image.
5. **Cover frame:** keep the 2:3 frame and cream bands seen in P6-02's phone check, or change `coverAspectRatio` or `coverFrame`?
6. **Offline message:** wording and placement when Home cannot load (a banner over cached content, and a retry control when nothing is cached)?

## Out of scope

- Browse with its filters and sort, search, and the book page (later Phase 6 tasks).
- The Genre filter (the architect mirrors the live filter setup in the development store first).
- Cart and notify-me actions (Phase 8 and later).
- Anything on the live store.

## Follow-ups (recorded, not part of P6-03)

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
- **Phase 6, foreground refetch with real data (owner, P5-02 phone check):** verify on the phone that a screen refetches when the app returns to the foreground. While the app has been in the background for more than 30 seconds, the owner changes a sample book's stock in the development store; on returning to the app, the screen must show the new value. (In P5-02 this was not observable on the phone and was accepted on the unit test `__tests__/query/focus.test.ts`.)
- **Phase 9, Checkout Kit TLS errors (owner, P5-02 phone check):** the app's log showed two TLS handshake errors (`net_error -101`) inside Checkout Kit's web view while the development store's password page loaded. The page itself loaded. Re-check during Phase 9's checkout tests.
- **Phase 6, screen focus (D-062):** decide whether stack screens that stay mounted also refetch when they regain focus (TanStack's `useFocusEffect` pattern).
- **Phase 7, logout (D-061):** call `clearAllCaches()`; customer data gets its own key root and is cached in memory only.
- **Expo SDK 57 patch releases (owner, P5-03):** `expo` 57.0.27, `expo-constants` 57.0.21, `expo-linking` 57.0.12 and `expo-router` 57.0.25 are out; `npx expo-doctor` fails its version check until they are installed with `npx expo install --fix` (pinned exactly afterwards). Grouped into P6-02's one native build, with the image library.
- **Sentry, offline case (P5-03):** the owner may confirm that the development Sentry project shows no new event from the P5-03 phone check (7 October 2026, 03:13 to 03:18 IST).
- **Local builds (D-067):** a fallback only, when the EAS queue is stuck. On this computer they need about 5 GB of free memory, other heavy programs closed, and `--max-workers=2`.
- **Genre filter (from P6-01):** the Storefront `filters` on a collection return only Availability and Price on the development store. A later Phase 6 task decides how the Genre filter works (`PRODUCT_REQUIREMENTS.md`, Browse), without parsing tags or `productType` (D-068).
- **Phone checks in Phase 6:** use the named example books in `TESTING.md` ("Sample catalogue (P6-01)").
- **From the live website (architect, view only, 7 October 2026; `SHOPIFY_AUDIT.md`), not built in P6-02:**
  - **Home and Browse handles (P6-03):** the collection handles for the Home rows and the Browse groups go in `src/config/` with the Home screen; the architect supplies the list from the live website (owner's answer 1).
  - **Browse default:** the website's collection pages open with the "In stock" availability filter already on. Input for the Browse task.
  - **Genre filter:** the live store has Genre, tag and Service City filters configured; the development store has only Availability and Price. The architect mirrors the filter setup in the development store before the Genre filter task.
  - **Book page:** it must not show an unavailable message for a book that can be ordered at zero stock (R8, D-073). The live book page does show one ("Currently not available as another junior reader is enjoying this book."); the owner knows.
  - **Ratings:** the book page task reads `reviews.rating` and `reviews.rating_count`, handling a rating without a count and a malformed rating (D-071). The card shows none (D-073).
  - **Website cards** show no author and no stars; the app's card keeps the author (D-073).
- **Remove the book card preview** (D-074) once Home and Browse show the card.
- **Bottom inset (from P6-02's phone check):** the preview's last row and "Load more" sat partly behind Android's navigation bar, because its scroll view adds no bottom safe-area inset for the edge-to-edge system bar. Home and Browse must add it (P6-03).
- **Cover frame (owner's choice, from P6-02's phone check):** the sample covers carry their own white space, so cream bands show above and below the image in the 2:3 frame. Changing `coverAspectRatio` or `coverFrame` in the tokens changes every card; nothing is changed until the owner decides.
