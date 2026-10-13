# Next task: P7-01, login with the Customer Account API

Status: **in progress** on branch `p7-01-login` (plan accepted by the owner on 13 October 2026). P6-11 (the wanted list, the last Phase 6 task; D-115 to D-118) is merged (`7c37841`, PR #24), so **Phase 6 is done** (`ROADMAP.md`). P6-10 is merged (`ad12f44`, PR #23).

## Phase 5: Shopify data layer (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P5-01 (done, 2f2b3e1) | Typed Storefront API client: code generation from the saved `2026-10` schema, buyer context, typed errors, retries for queries only, 30-second limit | D-054 to D-060 |
| P5-02 (done, ac714e8) | One app-wide TanStack Query cache, in memory only: freshness presets, error reporting in one place, foreground refetch, `clearStorefrontCache()` and `clearAllCaches()`, hooks-only boundary enforced by ESLint | D-061 to D-063 |
| P5-03 (done, 6bb14f2) | Network awareness with `expo-network` (queries pause offline, mutations never queue), a development APK built for `arm64-v8a` only (95.1 MB, was 246 MB), and local debug builds as a fallback | D-064 to D-067 |

## Phase 6: catalogue, search, filtering (complete)

| Task | Scope | Decisions |
| --- | --- | --- |
| P6-01 (done, e378fa6) | The development store's sample catalogue (40 real books loaded by the architect) recorded in `SHOPIFY_INTEGRATION.md` and `TESTING.md`; `npm run check:dev-store` asserts it over the Storefront API; `filters` probed | D-068 to D-071 |
| P6-02 (done, fa4c6c9) | Catalogue operations and hooks (`useCollectionBooks`, `useBookCard`), the `toBookCard` mapping, the book card, a development-only preview; `expo-image` and the Expo SDK 57 patch releases in one build (3c8bf273) | D-072 to D-074 |
| P6-03 (done, f9c3212) | The Home screen and the collection screen: Home content in configuration, only collections that exist, a square white cover frame, offline and error states, stale-only focus refetch, no dead card buttons, recovery from a false "offline" | D-075 to D-082 |
| P6-04 (done, a57774a) | Browse: all books through the root `products` query, Age group and Series one at a time, "Available now" on by default (also on the collection screen), the website's sorts, lists that close on back and outside taps; the preview kept until Phase 8 | D-083 to D-089 |
| P6-05 (done, 1876ac1) | The book page from every card: cover, author, title, the sentence for a rented-out book only, prices with the "Rent" or "Rented Out" badge, the description as native text from untrusted HTML, genre chips; no rating (Phase 13); `liveStock`; a description sample in the preview | D-090 to D-094 |
| P6-06 (done, ede0acd) | Search: Storefront `search` (books only, partial last word), results as you type from 3 letters or the search key from 2, "Available now" off (`LAST`/`HIDE`), Relevance and the two price sorts, the count line and the website's no-results line, earlier results kept while a new term loads; the term never logged, sent to analytics or reported; the standing phone-check permission; one guard against double taps for every in-app open; a clear button | D-095 to D-099 |
| P6-07 (done, eaa9702) | The Genre filter (the store's own genre names, one at a time, combined with the group, "Available now" and the sort; on Browse and the collection screen), Browse's all books from the `all-books` collection, the longer series list | D-100 to D-103 |
| P6-08 (done, c757ff2) | The Price filter ("All prices", then up to ₹34, ₹49, ₹74; a maximum only; store configuration, labels in the store's currency format) on Browse and the collection screen, not on search; one filter row that scrolls sideways with "Clear" pinned at its right edge; the CI act warnings fixed in the test setup | D-104 to D-106 |
| P6-09 (done, ac0a9fd) | The catalogue usage events under consent: `view_collection` (collection screen, a group chosen on Browse), `view_book`, `filter_applied` (codes only, the customer's own changes), `search` (2 seconds on screen, the search key or a book opened; length, count and the store's own catalogue item matched, never the term); the guard's dependent parameters | D-107 to D-110 |
| P6-10 (done, ad12f44) | The last Phase 6 task: the offline question closed (queries keep pausing, D-082's safety net), description tables (cells joined by " · "), tappable genre chips (all books with that genre, pushed on the book page), "Popular authors" on Home | D-111 to D-114 |
| P6-11 (done, 7c37841) | The wanted list: one JSON Remote Config parameter of names, codes made by the app, validated and frozen per launch; a search that finds no books with "Available now" off and matches nothing in the catalogue records the listed name's code (`wanted`); phone check passed | D-115 to D-118 |

## Phase 7: login and account

| Task | Scope | Decisions |
| --- | --- | --- |
| P7-01 (in progress, branch `p7-01-login`) | Login and logout through the Customer Account API on the development store: OAuth 2.0 with PKCE, state and nonce, in the system browser; tokens in Keystore-backed storage only; refresh; logout clears every cache; the Account tab shows signed in or out | |
| P7-02 (later) | The customer's profile and orders (read only), early check 3 (a guest order from the website appears after login with the same email) | |
| P7-03 (later) | The analytics consent request at the owner's chosen placement (D-048), and the analytics user ID after login (D-050); a release gate | |

## Goal of P7-01

A customer can log in with the store's own customer account (emailed code, D-005) and log out, on the development store. Nothing else changes yet: browsing, search and the book page stay open to everyone, and checkout (Phase 9) is where login becomes required.

## Proposed scope

1. **The login flow** (`SHOPIFY_INTEGRATION.md`, "Customer Account API"): authorization code with PKCE, `state` and `nonce`, scopes `openid email customer-account-api:full`, the `shop.{shop_id}.app://callback` scheme Shopify requires for mobile apps, the system browser session (never an embedded web view). Endpoints discovered from the store's `.well-known` documents, not typed by hand. Store-specific values (shop ID, client ID) in `src/config/` from `EXPO_PUBLIC_` variables; the client ID is public, and no secret exists for a public client.
2. **Tokens:** the access, refresh and ID tokens only in `expo-secure-store` (Android Keystore, iOS Keychain); never logged, never in analytics or Sentry (the scrubber gains the token patterns); refreshed before expiry; a failed refresh logs out cleanly.
3. **Logout:** Shopify's logout endpoint with the ID token, the tokens deleted, and `clearAllCaches()` (D-061).
4. **The Account tab:** "Log in" when signed out; when signed in, the customer's email only (from the ID token, never cached elsewhere) and "Log out". "Share app usage" stays as it is.
5. **Version-sensitive checks** (`CLAUDE.md` rule 10): Shopify's current Customer Account API docs for mobile clients, the API version, and the library's Expo SDK 57 support, each recorded with its date.
6. **Tests** (the flow with Shopify mocked: PKCE values, state and nonce checks, a wrong state refused, token storage and refresh, logout clearing caches, no token in any log or report) and a **phone check**: the owner types their own email and the emailed code on the phone (Claude never types personal data); Claude drives everything else.
7. **Docs:** `DECISIONS.md` (the library and the token rules), `SECURITY.md`, `SHOPIFY_INTEGRATION.md`, `ARCHITECTURE.md`, `TESTING.md`.

## What P7-01 needs from the owner

1. **On the development store** (Shopify admin, Headless channel, Customer Account API settings; the live store is not touched): the **client ID** of a public client for a mobile app, the **shop ID**, and the callback URI `shop.<shop_id>.app://callback` added, with a logout URI if Shopify asks for one. Claude gives the exact screens from Shopify's docs when the task starts. The client ID and shop ID go into `.env.local` (public values only).
2. **A test customer** on the development store whose email inbox the owner can read, for the emailed code.
3. **A decision on the login library:** `expo-auth-session` with `expo-web-browser` (Expo's own, follows the SDK) or `react-native-app-auth` (AppAuth). Claude proposes one with the reasons in the plan; it needs a `DECISIONS.md` entry (`CLAUDE.md` rule 6) and, being native, a new development build on EAS.
4. **The consent placement** (D-048: (a) right after the first login, or (b) at a natural pause before login) can wait for P7-03, but deciding it now lets P7-01 leave the right place for it.

## The architect's answers (13 October 2026)

1. Login only from the Account tab in Phase 7; login at checkout comes in Phase 9.
2. After login, back to the Account tab.
3. Logging out on the website must not log the customer out of the app (owner, 13 October 2026). The app logs out only when the customer taps "Log out", or when Shopify itself refuses the login (for example a refresh that fails because the login expired). Then: tokens deleted, `clearAllCaches()`, and the Account tab shows "Log in" with one line, "You've been logged out. Please log in again." No pop-up.
4. Phone check over USB only.

The owner accepted the plan on 13 October 2026, with the plan's recommended options: `expo-auth-session` with `expo-web-browser` and `expo-crypto`, the drafted Account tab wording, and no `login` or `logout` analytics events until P7-03. The two values (`EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID`, `EXPO_PUBLIC_SHOP_ID`) come from the development store's Headless channel; the owner sets them in `.env.local`, and `EXPO_PUBLIC_SHOP_ID` also as an EAS development variable, because the callback scheme is compiled into the build.

## Out of scope

- Profile, addresses and order history (P7-02); the consent request and the analytics user ID (P7-03).
- Cart and checkout (Phases 8 and 9).
- Anything on the live store, including its Customer Account API settings.

## Follow-ups (recorded, not part of P7-01)

- **Search key in the same moment as the last keystroke (P6-11 phone check, owner to decide):** `onSubmitEditing` in `src/app/search.tsx` (P6-06) reads the field's text from the last render, so a search key sent in the same adb command as the typing searched "zzqx" for "zzqxv" (and the event said 4). A person would need to press the key within milliseconds of the last keystroke. Proposed fix: read the submitted text from the key event (`nativeEvent.text`), with a test; a small task of its own or part of a later search change.
- **Wireless phone checks (P6-11):** the owner chose wireless again; the link dropped during the background step and a new port was needed, and the app's process ended in the background, so the return was a cold start. USB stays the reliable choice for a check with a background step.
- **The wanted list (P6-11, owner):** the list in the production Firebase project (when it exists) is the owner's to keep; it is readable by anyone with the app's public Firebase settings (`SECURITY.md`), so it must never hold anything private. The phone check's test list stays in the development project only.
- **Release gate: before the live store is connected (P6-07 and P6-08, owner):** five read-only checks on the live store with the app's public token, all of which must pass (`TESTING.md`, "Release gate: before the live store is connected"): the `all-books` collection exists, is published to the app's channel only and returns every book the app can see; the Genre filter is offered on it and on a group; the genre entries can be listed and every filter value joins to at least one store name; the eight custom genres show the store's names; the Price filter (`filter.v.price`) is offered on `all-books` and on a group (P6-08). Creating the collection on the live store is the owner's decision at that time (store addition 4, `SHOPIFY_INTEGRATION.md`). Nothing on the live store is touched before then.
- **Wireless phone checks (P6-09):** wireless debugging connected but dropped six times in one check, apparently whenever the screen slept or the app went to the background; each reconnect needed a new port from the owner. Use USB for checks with a background step, or keep the screen awake. `adb connect` and `adb disconnect` are still outside the standing permission (D-095).
- **Wireless phone checks (P6-10):** the owner chose wireless again; the link dropped once (about 07:58, around a phone call that also restarted the app), and a new port was needed. The background step itself (6 min 6 s) kept the link. USB stays the reliable choice; a call during a check stops it (Do Not Disturb does not end a call already in progress).
- **Focus check over wireless adb (P6-10):** the check's `grep -q` ends `dumpsys` early, and `dumpsys` then prints "Broken pipe", which `exec-out` mixes into a screenshot; use `dumpsys window 2>/dev/null | grep -q ...`. The `TESTING.md` form (`adb shell`, no `exec-out`) is not affected.
- **Catalogue usage events (P6-09, on the branch):** D-107 to D-110; `view_collection`, `view_book`, `filter_applied` and `search` are wired (`ANALYTICS.md`, "Catalogue events"). Search matches on the live store follow its own collections and genre entries; the release gate "before the live store is connected" already checks that the entries can be listed.
- **Price filter (P6-08, done, `c757ff2`):** D-104; the ₹0 book and "Mr Big" at ₹79 are owner items for the live store (`SHOPIFY_AUDIT.md`, "Live website prices").
- **Filter row while scrolled to its end (P6-08 phone check, observation):** when a label lengthens while the row is scrolled to its end, the buttons to its left move left on screen (the row keeps its end in view). "Clear" does not appear or disappear then, so D-105 holds; the architect may want it changed.
- **Double taps in phone checks (P6-08):** two `adb shell input tap` commands can land more than 0.5 seconds apart, which the guard allows (D-099); time the pair (both taps within about 0.5 s) before reading a second page as a defect.
- **Wireless debugging (P6-08):** pairing worked from the owner's terminal, connecting did not ("failed to connect"; the cause was not found), so the check used USB. If wireless checks are wanted, `adb connect` and `adb disconnect` need adding to the standing permission (D-095) first.
- **Development store search count (P6-07, resolved):** Shopify's matching of broad words changed on the development store from 8 October 2026; `npm run check:dev-store` now checks only the meaning of "Available now" for "the" and "kid" and keeps exact counts for harry, dahl and zzqxv (architect's review of PR #20; `SHOPIFY_INTEGRATION.md`).
- **Act warnings on CI's Linux runner (P6-07, resolved in P6-08):** `jest.setup.ts` wraps TanStack Query's deliveries in React's `act` (D-106, test only); CI run 37873582381 (`5de6013`) logs no "not wrapped in act" line and no `console.error`, where `main`'s run 37865413339 logged four.
- **Phone checks: notification banners (P6-07):** the 08:08 stop in P6-07's check came from a Do Not Disturb setting that let app notifications through; the owner is changing it. Before each check, Do Not Disturb must block app notifications, not only calls.
- **Genre chips on the book page (owner, P6-07):** done in P6-10 (D-113): a chip whose genre the Genre filter offers opens the all-books collection screen with that genre chosen, pushed on the book page.
- **Browse by author (owner, P6-07):** done in P6-10 as "Popular authors" on Home (D-114). Search matching (D-109) does not add the configured author names.

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
  - the app's own events, including the catalogue events since P6-09 (`view_collection`, `view_book`, `filter_applied`, `search`; `ANALYTICS.md`, "Events" and "Catalogue events");
  - that, under consent, the app records which catalogue item a search matched, by its ID or code, never the search term itself (P6-09, D-108, D-109);
  - that, under consent, the app records which name on the store's wanted list a search matched, by that name's code, never the term (P6-11, D-117, D-118);
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
- **Offline question (architect, D-087):** closed in P6-10 (D-111): queries keep pausing with D-082's safety net; risk 22 mitigated.
- **Standing phone-check step (owner, D-082, D-111):** in every phone check, after more than 5 minutes in the background, no false offline notice (`TESTING.md`), **until the first release build, when it is reviewed**.
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
- **Double tap (P6-06 phone check, fixed in PR #19, D-099):** a book card and the search button opened their screen twice on a fast double tap. One guard for every in-app open now ignores a second open within 0.5 seconds.
- **Description tables (architect's review of PR #18):** fixed in P6-10 (D-112): each row its own line, cells joined by " · ", empty cells skipped.
- **Development store descriptions (architect's review of PR #18):** all 42 are a single `<p>` with no `<br>` or `<strong>`, so their headings and bullets run together on the book page. No re-import now. Before the release-build check, the owner pastes full descriptions into a few books in the development admin.
- **Analytics events for catalogue screens (P6-05):** done in P6-09 (D-107 to D-110).
- **Book page in a release build:** the description and the full-width cover are checked on the development build only; include a long real description in the release-build list check (`TESTING.md`, "Release gate: list performance").
- **Bottom inset:** Browse is a tab screen, so its tab bar already takes the inset, as on Home; any new stack screen adds it (D-080).
- **Cold test start (P6-03, owner to decide):** with Jest's cache off, the first render in `account.test.tsx`, `tabs.test.tsx` and `BookCard.test.tsx` still takes 2.4 to 4.1 s (under the 5-second limit). A public-import touch does not move it (`CURRENT_STATUS.md`); no deep import is used without the owner's yes.
