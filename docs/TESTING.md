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

### Design token checks (P4-01)

- Colour literals: ESLint's `no-restricted-syntax` rule in `eslint.config.js` fails any string in `src/` that starts like a colour (`#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(`, `rgba(`, `hsl(`, `hsla(`), except in `src/theme/tokens.ts`. `__tests__/theme/colourLiterals.test.ts` runs ESLint on sample code, so removing the rule fails a test. Named colours such as `white` are not caught; reviews check for them.
- Contrast: `__tests__/theme/tokens.test.ts` checks every pair in `textPairs` (`src/theme/tokens.ts`) at 4.5:1 or more (WCAG 2.2 AA for normal text), checks the ratios recorded in D-038 and D-039, and fails if cream text is ever paired with the brand green. A new text colour or background needs a new entry in `textPairs`.
- Environment banner and tabs: component tests render the banner on each environment and the tab navigator through `expo-router/testing-library`.

### Crash report checks (P4-02)

- Scrubbing: `__tests__/crashReporting/scrub.test.ts` passes a sample event carrying an email, a phone number, a Shopify secret token, a token-like string, the store domain, the Storefront token, a URL with a query string, headers, cookies, a request body, a user and a device name through `scrubEvent`. The output must hold none of them, with stack frames unchanged apart from their local variables. It also lists strings that must be left alone, such as timestamps, product GIDs and UUIDs, so over-filtering shows up too. A new kind of personal data in the app needs a new case here.
- Switching on: `__tests__/config/crashReporting.test.ts` shows crash reporting is off with no DSN, with a malformed DSN and always under Jest. `__tests__/crashReporting/sentry.test.ts` checks the `Sentry.init` options: no personal data, tracing, replay or attachments, and the environment tag.
- Native crashes skip the JavaScript scrubber; Sentry's server-side data scrubbing covers them. They **cannot be proven on a development build**. Sentry's test call, `Sentry.nativeCrash()` ("Trigger a native crash (test)" on Home), throws on React Native's native-modules thread. React Native hands that exception to its host's error handler (`ReactHostImpl.handleHostException`). In a development build that handler belongs to the dev client (`DevLauncherBridgelessDevSupportManager`), which shows "There was a problem loading the project" instead of letting the app crash. The exception therefore never reaches Android's uncaught-exception handler, where Sentry records native crashes, and no report is saved or sent. Seen on the owner's phone with build aa4e95c7 on 4 October 2026. Staging and production builds have no dev client: React Native's default handler rethrows (`DefaultReactHostDelegate`), the app crashes, and Sentry records it.
- Source maps are not uploaded by development builds either: Sentry's Gradle script skips debug variants, and a development build loads its JavaScript from Metro.

### Release gate: crash reporting (P4-02, architect's review of PR #8)

No build goes to any tester other than the owner until all three checks below have passed on a **staging** build, with the result recorded in `CURRENT_STATUS.md`:

1. A real native crash, triggered with "Trigger a native crash (test)" or an equivalent, arrives in Sentry after the app is reopened, under environment `staging`.
2. Source maps upload during the EAS build, and that crash's JavaScript stack trace, or a test error's, is readable (original file names and lines, not the minified bundle).
3. The raw crash event (Sentry's JSON view) shows no IP address, no city, no device ID, no store domain and no token.

Until then the risk stays open (risk 19 in `RISKS.md`). The test controls on Home exist only on development builds; the staging check needs a way to trigger the crash on staging, decided when that build is planned.

### Feature flag checks (P4-03)

- Parsing: `__tests__/config/featureFlags.test.ts`. Empty Remote Config, a missing key, `default` or `static` sources and malformed values (wrong case, spaces, empty, unknown words) all give the compiled default; only an exact allowed value with source `remote` overrides it.
- Session: `__tests__/featureFlags/session.test.ts` mocks `src/featureFlags/remoteConfig.ts`, so no test loads Firebase or touches a network. With fake timers it shows that start-up does not wait; an early read waits for activation and gets the Remote Config value; the defaults are frozen after 3 seconds and a late activation changes nothing; a failed activation or a missing native module gives the defaults; a background fetch never changes the snapshot. It also checks what reaches Sentry: `remoteConfig/failure` and `remoteConfig/throttled` never do; other errors do, by code or class name only; a malformed value is reported by flag name, never the value. `__tests__/featureFlags/useFeatureFlags.test.tsx` follows the hook from `not ready` to the frozen value.
- Settings: `__tests__/firebaseJson.test.ts` pins every advertising key in `firebase.json` to false (D-009, permanent for version 1) and analytics collection off; `__tests__/app.config.test.ts` checks the Firebase plugins, the `google-services.json` path and the blocked `AD_ID` permission.

### APK permission check (P4-03, architect's decision)

Run on the APK of **every build that adds or upgrades a native package**, and on every staging and production build as part of the release gate. Native libraries can add permissions to the merged manifest that the app's own config never names: build d211bdae showed Firebase Analytics adding `ACCESS_ADSERVICES_AD_ID` and `ACCESS_ADSERVICES_ATTRIBUTION` beside `AD_ID`.

1. Download the build's APK (with the owner's permission) into a scratch folder outside the repository.
2. List the full permission list with `aapt2 dump permissions <apk>` (Android build-tools; 36.1.0 on the development machine) and record it in `CURRENT_STATUS.md`.
3. **Fail** if any permission name contains `AD_ID` or `ADSERVICES`, or is `USE_BIOMETRIC` or `USE_FINGERPRINT` (D-052). Such a permission is blocked in `app.config.ts` (`android.blockedPermissions`) and in `__tests__/app.config.test.ts`, and the build is repeated (D-009, D-045). `BIND_GET_INSTALL_REFERRER_SERVICE` is expected (D-049).
4. Any other permission not seen in the previous build's list is reported to the owner before the build is used.
5. `aapt2 dump xmltree --file AndroidManifest.xml <apk>`: the Firebase settings read as in `firebase.json`. From P4-04 (D-053) that means:
   - automatic collection off, and collection **not** deactivated (`firebase_analytics_collection_deactivated` false), so consent can switch it on;
   - default analytics storage denied;
   - advertising ID and SSAID off, and every advertising consent denied.

   **From the built APK, not only from the config** (owner's addition, P4-04): the application tag has `android:allowBackup` false and points `android:dataExtractionRules` and `android:fullBackupContent` at the no-backup rules (D-052), and both rules files are present in the APK. `aapt2 dump xmltree --file res/xml/no_backup_data_extraction_rules.xml <apk>` shows every domain excluded from both cloud backup and device transfer.
6. Delete the APK.

### Phone checks over USB with adb (P4-03, owner's method)

Used when a check needs the phone offline but the development build still needs JavaScript from Metro on this machine.

- Tool: Google's SDK Platform-Tools only (the standard `adb`; on the development machine at `D:\platform-tools`, adb 1.0.41, version 37.0.1). No third-party MCP server, skill or app.
- The phone is connected by a **data** USB cable with USB debugging on. `adb devices` must list it as `device`; `unauthorized` means the owner taps Allow on the phone. If adb lists nothing, Windows is not seeing the phone as a USB device: a charge-only cable or port, or a loose plug (4 October 2026: fixed by re-seating the cable).
- `adb reverse tcp:8081 tcp:8081` maps the phone's port 8081 to Metro on this machine over USB. In the development build, connect to `http://localhost:8081`. The phone can then turn off Wi-Fi and mobile data and still load JavaScript, so offline behaviour can be tested.
- **adb rule** (architect's review of PR #9; the same rule is in `CLAUDE.md`):
  - Allowed at any time: `adb devices`; `adb reverse tcp:8081 tcp:8081` and `adb reverse --remove tcp:8081`; reading logs filtered to this app's own process from the very first command, `adb logcat -d --pid=$(adb shell pidof com.justbookify.india.dev)`.
  - **Standing permission for phone checks** (owner, 8 October 2026, D-095). It replaces the permission for one whole phone check at a time and covers the phone check in this task and every later task. Claude does not ask again for these. Inside JustBookify only, with each input behind the focus check in the same command:
    - launch JustBookify (`adb shell monkey -p com.justbookify.india.dev -c android.intent.category.LAUNCHER 1`), and bring it back with the same command after the background step;
    - tap (`adb shell input tap`), swipe (`adb shell input swipe`), press Back (`adb shell input keyevent KEYCODE_BACK`), and press Home for the background step (`adb shell input keyevent KEYCODE_HOME`);
    - type (`adb shell input text`) the development server address, `http://localhost:8081`, and the test words written in the task's accepted plan, which are plain book words only (such as harry, dahl, zzqxv);
    - take screenshots of JustBookify (`adb exec-out screencap -p`) and delete them afterwards;
    - read the app's own log filtered to its process, as above;
    - run the read-only commands `adb reverse --list` and `adb shell wm size`.
  - Unchanged, and covered by no permission:
    - Never type a password, a payment detail or any personal data, and never place an order.
    - Never open, read or screenshot anything outside JustBookify. If a screenshot shows anything else, delete it at once, stop and tell the owner.
    - Never take a screenshot while the phone's keyboard is showing: it is not part of JustBookify, and its suggestion strip can show clipboard text. Hide it first, with a swipe on the results, or one Back press when there is nothing to swipe. If a screenshot shows the keyboard anyway, delete it at once, record it, hide the keyboard and continue.
    - Never an unfiltered log or a package listing.
    - Any adb command not listed above still needs the owner's yes each time, including read-only ones.
    - Record every command in `docs/CURRENT_STATUS.md`.
  - From P4-03 to P6-05 the owner gave permission one check at a time; on 8 October 2026 the owner replaced it with the standing permission above (D-095).
  - **Before and during every phone check** (architect's review of PR #12). In P5-02's check the owner used the phone between messages: one tap and the typed server address went into WhatsApp's search box, and later an incoming-call notification covered the app.
    - Once, at the start, Claude asks the owner to switch on **Do Not Disturb** and to **leave the phone untouched** until Claude says the check is over.
    - **Immediately before every tap, swipe, key press or text entry**, Claude checks that JustBookify is the focused app, in the same command as the input, so nothing can come to the front in between. Reading the focused app's package name is allowed for this purpose only; the full window list never leaves the phone:

      ```
      adb shell 'dumpsys window | grep -q "mCurrentFocus=.* com.justbookify.india.dev/" && input tap X Y || echo "JustBookify is not in front: no input sent"'
      ```

      The same form wraps `input text`. The check reads the focused window only: a notification banner over the app does not take focus. Do Not Disturb and the screenshot rule cover banners (owner, P5-03): a screenshot showing anything else still stops the check.
    - If anything other than JustBookify is in front, Claude sends **no input at all**, stops the check and tells the owner. Claude does not try to return to the app (no Back, no Home, no relaunch). The launch command is used only to end the background step, never to recover from an interruption.
    - **Text entry** by adb (`adb shell input text`) is limited to the development server address, `http://localhost:8081`, and the plain test words written in the task's accepted plan (D-095). It runs only behind the focus check above. Nothing else is ever typed.
- **Standing step in every phone check from P6-03 on** (owner, D-082, risk 22): after more than 5 minutes in the background, the app returns with no false offline notice, and the development tools' "Query cache" line says online. If it fails, read the development tools' network events before anything else and stop.
- After the checks, `adb reverse --remove tcp:8081`. Stopping Metro's background task can leave the Expo CLI's `node` process listening on port 8081; check the port and stop that process.
- The `adb reverse` mapping can drop during a check (P5-02: the dev client showed "Failed to connect to localhost/127.0.0.1:8081"). Set it again before tapping Connect.
- First used for P4-03 on 4 October 2026 (build 97582938, all six flag checks passed). For those checks the owner approved cold starts (`am force-stop` and `monkey -p <package> 1`), `pm clear` for the fresh-install check, typing the Metro address into the dev client and tapping Connect (`input text`, `input tap`), and screenshots of the app (`exec-out screencap`). Wi-Fi, mobile data and the Firebase and Sentry consoles stay with the owner. Two commands that day were outside what had been approved; see `CURRENT_STATUS.md`.
- After `pm clear`, the dev client forgets its server; enter `http://localhost:8081` again. The first reopen straight after `pm clear` once left Android's starting window on screen with no app process; a normal cold start fixed it.

### Release gate: feature flags (P4-03, architect's addition)

Every staging and production build must be shown, before release, to fetch a changed flag value: change a flag in that environment's Firebase project, cold-start the app twice, and see the new value used. Repeat for every build after the Phase 14 restriction of the Android API key (D-044), because a wrong restriction would silently leave every phone on its last values or the defaults. Record the result in `CURRENT_STATUS.md`.

The same release gate includes the APK permission check above: no staging or production build goes to anyone other than the owner while its APK lists a permission whose name contains `AD_ID` or `ADSERVICES`.

Two more release-gate checks on every staging build (architect's review of PR #9):

1. **Fresh install reaches Home.** Installed fresh (or after clearing the app's data), the staging build reaches Home on its first launch. The stuck splash screen seen on development build 97582938, where the first reopen after `pm clear` left Android's starting window on screen with no app process, must not appear.
2. **Only the permissions the app needs.** The staging build's permission list contains only what the app needs. `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` and `CHANGE_WIFI_MULTICAST_STATE` are expected only in development builds (they come with the dev client and debug tooling) and must be absent from the staging build or justified in `CURRENT_STATUS.md` with where they come from and why they stay. `ACCESS_WIFI_STATE` (from expo-network, D-064; a normal permission, no Wi-Fi details read) is justified at the same review.

### Analytics checks (P4-04)

Unit tests cover:
- every event's typed parameters (personal data does not type-check);
- the guard (emails, phone numbers, free text, unknown or missing parameters and screen names carrying values are dropped, and only the event and parameter are reported);
- the consent states, and the order of grant and withdrawal (including failed saves);
- that nothing is sent under Jest, while consent loads, or without consent;
- that no user ID function exists;
- the Account switch;
- the no-backup rules.

**On-device check with Firebase DebugView** (development build, owner's phone, over USB):
- **The owner's yes is needed for each adb command outside the allowed list** (`CLAUDE.md`), including `adb shell setprop debug.firebase.analytics.app com.justbookify.india.dev` and, at the end, `adb shell setprop debug.firebase.analytics.app .none.`. The owner watches DebugView in the development Firebase project.
1. Switch off (consent `not asked`): DebugView shows nothing from the phone. The Home development line says "Analytics: off (consent: not asked)".
2. Turn the Account switch on: `screen_view` for `account` arrives, then `screen_view` for each tab opened (`index`, `browse`, `cart`, `my-books`), with no parameter beyond Firebase's own. A return from the background sends `app_open` with `source` `foreground`.
3. Cold start: the switch is still on, and `app_open` arrives with `source` `cold_start`.
4. Turn the switch off: nothing more arrives, and after a cold start the switch is still off.
5. The app's own log (`adb logcat -d --pid=...`) shows no crash.

### Release gate: analytics consent (P4-04, D-048)

No build goes to any tester other than the owner until:
1. **The consent request works.** It is built in Phase 7 at the placement the owner chose. It is never shown at first launch, says that usage is linked to the customer's account, and stores Allow as `granted` and Don't allow as `denied`; closing it stores nothing.
2. **The Account switch withdraws consent at once.** Events stop in DebugView and stay stopped after a cold start.
3. **No consent, no events.** A fresh install that has not said yes sends nothing to DebugView.
4. **The privacy policy's app section is published** (risk 21).

Record the result in `CURRENT_STATUS.md`.

### Storefront client checks (P5-01)

Unit tests, with `fetch` mocked and fake timers; nothing reaches a store:
- `__tests__/shopify/client.test.ts`: the request (endpoint, token header, buyer context that callers cannot replace); every error kind; retries for queries only, with backoff bounds checked through a fixed `Math.random`; Retry-After honoured up to 10 seconds; cancel during a request and during a wait; the 30-second limit, including a shortened last attempt and no retry with less than 2 seconds left; and, for every error, no domain, token, variable value or Shopify text in the message or in `JSON.stringify`.
- `__tests__/shopify/errors.test.ts`: retryable kinds, enum-code filtering, user errors, and the Sentry rule (configuration faults at most once per session for each status).
- `__tests__/shopify/operations.test.ts`: every `#graphql` operation in `src/shopify/` validates against the saved schema, is one named operation without `${}`, and declares `@inContext(country: $country, language: $language)`.
- `__tests__/shopify/devCheckout.test.ts`: the dev checkout on the client, the cart's `buyerIdentity`, and no retry of the cart mutation.

CI step `npm run codegen:check`: regenerates the types from the saved schema and fails if an operation does not validate or if the committed types are out of date. Shown on 6 October 2026: a misspelled field fails both `codegen` and the operations test; an operation without `@inContext` fails the operations test; an operation changed without `npm run codegen` fails `codegen:check`.

`npm run check:dev-store` (development store only) also checks that Shopify resolves the configured buyer context to the configured country, language and currency.

### Query cache checks (P5-02)

Unit tests; the Storefront client is mocked and nothing reaches a store:
- `__tests__/query/queryClient.test.ts`: TanStack's retry is off for queries and mutations; a failed query is reported once however many screens watch it; a mutation's `meta.handledCodes` is respected; an error that is not a Storefront error is reported by its code only; a cancelled query is not reported; `clearAllCaches()` cancels a query in flight and empties both caches.
- `__tests__/query/errorReporting.test.ts`: the dispatch by error type (D-061), including TanStack's `CancelledError` and an `AbortError`, and no message text reaching Sentry.
- `__tests__/query/focus.test.ts`: going to the background and back refetches a stale query and leaves a fresh one alone.
- `__tests__/query/freshness.test.ts`: the approved preset numbers (D-062).
- `__tests__/query/lintGuards.test.ts`: the import boundary in `eslint.config.js` (D-063), 21 cases linted in one ESLint process.
- `__tests__/shopify/cache.test.ts`: `clearStorefrontCache()` removes only `['storefront', …]` queries and mutations and cancels one in flight.
- `__tests__/shopify/hooks/devCheckout.test.tsx`: the cache's cancel signal reaches `storefrontQuery` and aborts on unmount; the `liveStock` preset; a refetch each time a screen opens; no retry of the query or the cart mutation.
- `__tests__/shopify/operations.test.ts`: every Storefront operation selects no personal field.
- `__tests__/app/dev-checkout.test.tsx`: unchanged assertions, now with a query provider around the screen.

### Network awareness checks (P5-03)

Unit tests; `expo-network` is mocked and nothing reaches a store:
- `__tests__/query/online.test.ts`: the offline mapping (offline only when `isConnected` is false and the type is not `UNKNOWN`; an empty state counts as online); the first read, a change event winning over a slower first read, a failed first read counting as online, and the stop function removing the listener (D-064). A query started offline is paused without being called and runs once on reconnect; cached data stays offline; stale data refetches on reconnect and fresh data does not. Offline, a mutation on the app's client calls `fetch` once, fails with `no-network`, is not paused, is not reported, and nothing runs after reconnect (D-065). Shown on 6 October 2026: with the mutations' `networkMode: 'always'` removed, the mutation test fails.
- `__tests__/easJson.test.ts`: only the development profile limits the processor types (D-066); every profile keeps its `APP_ENV`.

On the phone (P5-03 check, development build): the owner switches airplane mode, never Claude. Airplane mode on, the dev checkout screen stays loading with no error; off, the books appear with no tap; on again, the books stay and creating a checkout fails at once with the no-network message; off again, nothing fires by itself.

Test helper: `__tests__/helpers/queryClient.tsx` (not run as a test) gives each test the app's client settings. Unmount before emptying the cache, and give mutations no garbage-collection timer: otherwise TanStack's timers hold Jest open after the tests.

### Sample catalogue (P6-01)

The development store's sample catalogue is the fixture for Phase 6 (D-069): 40 real books copied from the live store by the architect on 7 October 2026. Field names are in `SHOPIFY_INTEGRATION.md` ("Product data the app reads"). `npm run check:dev-store` asserts everything below over the Storefront API, with the expected values in `scripts/dev-store-catalogue.mjs`; change the two together, and only when the development store changes. If a number differs, report it; never adjust the expected value to make the check pass.

**Products.** The Headless channel sees 42: 3 older test products and 39 sample books. The 40th book, `the-giraffe-and-the-pelly-and-me`, is a draft and must never appear.

**Availability** (one variant per book):

| State | Storefront fields | 39 sample books | All 42 |
| --- | --- | --- | --- |
| In stock | `availableForSale`, not `currentlyNotInStock` | 19 | 21 |
| Rented out (stock 0, "deny") | not `availableForSale` | 12 | 13 |
| Orderable at zero stock (stock 0, "continue selling") | `availableForSale` and `currentlyNotInStock` | 8 | 8 |

**"Available now" (P6-04, D-083).** The root `products(query: "available_for_sale:true")` returns 29 of the 42: exactly the in-stock and the orderable-at-zero products. `junior-readers` with `filters: [{ available: true }]` returns 21 of its 26: exactly its `availableForSale` books. So the root query and a collection's Availability filter mean the same thing, Shopify's `availableForSale`. Checked on 8 October 2026; `npm run check:dev-store` asserts both counts and both handle sets.

**Prices** are ₹34, ₹49, ₹74 and ₹99. Every sample book has a compare-at price.

**Covers.** 37 products have a featured image; 5 have none: `ruskin-bond-great-stories-for-children`, `peter-and-the-wolf-read-it-yourself` and the 3 older test products (`harry-potter`, `harry-potter-the-sorcerer-stone`, `harry-potter-and-the-chamber-of-secrets`).

**Authors** are `vendor`. The older products use "J.k. Rowling", the sample books "J.K. Rowling".

**Named examples**, one fixed book per case, for phone checks and screen tests:

| Case | Handle |
| --- | --- |
| In stock | `the-diary-of-a-wimpy-kid-no-brainer` |
| Rented out | `the-gruffalo` |
| Orderable at zero stock | `harry-potter-and-the-deathly-hallows-book-7` |
| In stock with "continue selling" on (counts as in stock) | `sudha-murty-three-thousand-stitches` |
| No cover | `peter-and-the-wolf-read-it-yourself` |
| Hardcover | `cat-kid-comic-club-on-purpose` |
| Missing pages and ISBN | `jujutsu-kaisen-0` |
| Every metafield (except target audience), rating with a count | `harry-potter-and-the-half-blood-prince-book-6` |
| Rating without a count | `harry-potter-and-the-philosophers-stone-by-j-k-rowling` |

**Collections**, all smart and published to the Headless channel, with their Storefront counts. The Admin API shows one more in `emerging-readers`, `junior-readers` and `roald-dahl`, because it counts the draft.

| Group | Handle and count |
| --- | --- |
| Age groups | `early-readers` 5, `emerging-readers` 22, `junior-readers` 26, `pre-teen-readers` 16, `teenage-readers` 8 |
| Series | `harry-potter-series` 4, `wimpy-kid-series` 4, `geronimo-stilton` 3, `my-hero-academia` 3, `secret-seven-series` 4, `read-it-yourself` 2, `manga-collections` 3, `cat-kid-comic-club` 3, `tintin-series` 0 (the empty state) |
| Authors | `roald-dahl` 3, `ruskin-bond` 3, `enid-blyton` 4, `jeff-kinney` 4, `sudha-murthy` 2, `j-k-rowling` 7, `julia-donaldson` 3 |
| Others | `new-arrivals` 5, `frontpage` 1, `all-books` 42 (P6-07: every visible book; 29 with "Available now") |

`new-arrivals` matches tag `new-arrival` **and** inventory above 0, so three tagged books with zero stock are left out.

**Genre filter (P6-07, 8 October 2026).** On `all-books`, Shopify's Genre filter (`filter.v.t.shopify.genre`) has 11 values. Shown name (the store's genre entry) / Shopify's filter label / `TaxonomyValue` / books without and with "Available now": Action & adventure / same / 15724 / 16, 12; Biography / same / 15726 / 1, 1; Comics & graphic novels / same / 15728 / 3, 3; Crime & mystery / same / 15729 / 4, 3; **Fairy tale / Family** / 15733 / 2, 1; Fantasy / same / 20853 / 13, 10; Humor & comedy / same / 15741 / 13, 12; **Manga / Design** / 15730 / 4, 2; **Non-fiction / Documentary** / 15731 / 1, 1; **Picture book / Children** / 15727 / 3, 1; **Realistic fiction / Drama** / 15732 / 14, 9. `junior-readers` offers 8 of them (no Fairy tale, Manga or Picture book). The 11 `shopify--genre` entries can be listed over the Storefront API, one per value.

**Deliberate gap, copied from the live store.** `one-of-us-1-lying` and `one-of-us-2-next` (product type "Teenage Readers") and `artemis-fowl-1-artemis-fowl` and `artemis-fowl-2-the-arctic-incident` (product type "Junior readers; Pre-teen readers") are in no age-group collection. They do not appear under any age group, and the app must not work around this (D-068).

**Metafields.** Genre on every sample book (one to three values). Across all 40 books, counting the draft: English language version on all, paperback on 37 and hardcover on 3. No book uses `shopify.target-audience`, so the check can only show that it queries without error. `custom.pages` and `custom.isbn_13` are missing on 5 books. Five books have a rating, all 5.0; one of them has no count.

### Catalogue hooks and book card (P6-02)

Unit tests; the Storefront client is mocked and nothing reaches a store. Fixtures are shaped like the named examples above (`__tests__/helpers/catalogue.ts`):
- `__tests__/shopify/bookCard.test.ts`: the three availability states; a book orderable at zero stock maps exactly like an in-stock one apart from `availability`; "continue selling" with stock is in stock; no cover gives `null`; `vendor` as stored; "₹49", "₹49.50", "₹1,00,000" and no space between symbol and digits; no retail price unless the compare-at price is above the price; a price in another currency throws `catalogue/currency-mismatch` without naming the currency; no variant gives no card (D-073).
- `__tests__/shopify/catalogue.test.ts`: 20 books per page by handle, the cursor and the cancel signal reach the client, a missing collection is `not-found`, a book without a variant is left out and reported once per session by code, a currency mismatch fails the page.
- `__tests__/shopify/hooks/catalogue.test.tsx`: `junior-readers` (26 books) in two pages, 20 then 6, then no next page; the `catalogue` preset under the `storefront` key root.
- `__tests__/components/BookCard.test.tsx`: each state; zero stock renders the same tree as in stock; the badge and "Notify me" only when rented out; the struck-through retail price; one-line title; the missing cover shows no visible text and is labelled with the title; accessible labels; 44-point buttons; the callbacks receive the book.
- `__tests__/app/dev-catalogue.test.tsx` and `__tests__/app/home.test.tsx`: the preview exists only on development builds; the named examples; "Load more".
- `__tests__/shopify/operations.test.ts`: the catalogue operations validate, carry `@inContext`, select no personal field and read no rating.

Shown on 7 October 2026: removing `currentlyNotInStock` from `BookCardByHandle` fails the type check, and mapping zero stock to "rented out" fails 3 tests.

**Phone check** (development build, owner's phone, under `CLAUDE.md`'s phone check rules), on the development-only book card preview (D-074):
1. Each named example shows its state: `the-gruffalo` has the "Rented Out" badge and "Notify me"; `harry-potter-and-the-deathly-hallows-book-7` and `sudha-murty-three-thousand-stitches` look exactly like in stock; `peter-and-the-wolf-read-it-yourself` shows the cream frame and the book icon only; no rating anywhere; long titles stay on one line.
2. **Price text:** read the exact text on screen. It must be "₹49" style, the same as the unit tests expect. Another symbol, "Rs.", "INR", a space or other grouping stops the check, and is reported; the tests are never changed to match (owner).
3. "Add to Cart" and "Notify me" each change the status line.
4. `junior-readers` shows 20 books, then 26 after "Load more", and the button disappears.
5. Covers load. (Reuse from expo-image's disk cache after a cold start cannot be observed: the query cache is in memory only, so a cold start reads Shopify again before any card appears. P6-02 recorded this as not observable.)
6. The app's own log shows no crash and no JavaScript error.

### Home and the collection screen (P6-03)

Unit tests; the Storefront client or the catalogue fetchers are mocked and nothing reaches a store:
- `__tests__/config/home.test.ts`: the 15 series and 5 age groups in the website's order with their labels, `ella-dairies` labelled "Ella Diaries", 6 new arrivals, the banner wording, unique handles (D-075).
- `__tests__/shopify/catalogue.test.ts` and `operations.test.ts`: the handle listing is one request of 250 with the cancel signal, follows `pageInfo`, stops on a missing cursor, and selects handles only (no image) (D-076).
- `__tests__/query/screenFocus.test.tsx`: no refetch on the first focus; a later focus refetches stale data, leaves fresh data alone and touches no other query; an equal key on re-render does not re-run (D-079). Shown on 7 October 2026: without `stale: true` the fresh-data test fails.
- `__tests__/components/catalogueViewState.test.ts`: data wins; loading; offline by the signal or by `no-network`; any other failure is an error; the notice only over saved data (D-078).
- `__tests__/components/BookCard.test.tsx` and `__tests__/theme/tokens.test.ts`: no button without its action, the badge kept (D-081); square white frame, cream only for no cover (D-077); every new text colour pair at 4.5:1.
- `__tests__/app/home.test.tsx`: store name and banner; no search button; only the development store's 5 series in order, Tintin shown, "All series" last, the 5 age chips; 6 of 8 new arrivals and "See all"; "New arrivals" hidden when missing or empty; no tile before the handles are known; offline with nothing saved, the notice over saved books, `no-network` while "online", the error and "Try again", one part failed; development tools on development builds only.
- `__tests__/app/collection.test.tsx`: handle and header title; two columns in Shopify's order; 20 then 26 with "Load more"; a failed page keeps the button as the retry; empty, not found and a malformed handle; offline, notice and error; the bottom inset.
- `__tests__/app/tabs.test.tsx`, with the real router: "Books for Rent" and "All series" open Browse; a series tile opens `/collection/tintin-series` and its empty state.
- `__tests__/query/online.test.ts` (D-082): a return to the foreground re-reads the network and goes back online; while offline in the foreground it re-reads every 3 seconds until online, then stops; no timer while online or in the background; a failed re-read tries again; `recheckNetwork()` re-reads, and does nothing when not connected. Shown on 7 October 2026: removing the read on return, the timer or `recheckNetwork` each fails its own tests. `home.test.tsx` and `collection.test.tsx`: "Try again" re-reads the network before it refetches.
- `__tests__/query/networkLog.test.ts` and `home.test.tsx` (development builds only): the last 10 network events newest first, the times the app went to the background and came back, the reads on return and 3 s later; the "Query cache: online/offline" line; none of it on staging or production builds.

**Phone check** (development build 3c8bf273, JavaScript from Metro, owner's phone, under `CLAUDE.md`'s phone check rules; swipes need the owner's yes, asked up front):
1. Home shows the store name, the banner, the 5 development-store series in order (Wimpy Kid, Harry Potter, Tintin, Geronimo Stilton, Read It Yourself) and "All series", the 5 age chips, and New arrivals with 5 books. No search button, no cart or notify-me button.
2. Covers fill a square white frame with no bands; `peter-and-the-wolf-read-it-yourself` (no cover) shows cream with the book icon.
3. Price text reads exactly as in P6-02 ("₹74" style, no space).
4. The Tintin tile opens its collection with "No books here yet."; back returns to Home.
5. The "9-10 years" chip opens `junior-readers`: 20 books, then 26 after "Load more"; the last row clears Android's navigation bar.
6. "Books for Rent" and "All series" open Browse.
7. Home's last row clears the tab bar (the tab bar takes the bottom inset; Home adds none).
8. Airplane mode (the owner switches it): the notice "You're offline. Showing saved books." over the books on Home.
9. Foreground refetch with real data, on `one-of-us-2-next` (in `new-arrivals` while its stock is 1): with the app in the background, the owner sets its stock to 0 in the development store; after **more than 5 minutes** (the `catalogue` preset's freshness) the app returns to the foreground and New arrivals shows 4 books, with no offline notice. The owner sets the stock back to 1 and `npm run check:dev-store` must pass again. (Shopify updates the smart collection about a minute after the stock change: if the check fails on `new-arrivals` straight away, wait a minute and run it again.)
10. 30 seconds in the background and back: no offline notice.
11. "Load more" on `junior-readers` with Metro serving production-mode JavaScript (`npx expo start --dev-client --no-dev --minify`; Expo's "Development and production mode" page): the 6 extra books appear within about 2 seconds.
12. The app's own log shows no crash and no JavaScript error.

React Native's "VirtualizedList: You have a large list that is slow to update" line is **not** a measure of slowness in a phone check: its `dt` is the time between two scroll events (`@react-native/virtualized-lists`, `VirtualizedList.js`), so the pauses between adb swipes set it off. Judge the list by timings and by eye.

### Browse and the collection screen's controls (P6-04)

Unit tests; the Storefront client or the catalogue fetchers are mocked and nothing reaches a store:
- `__tests__/shopify/sort.test.ts`: every sort option maps to the keys in D-085 for both reads; Featured has no all-books key and falls back to A-Z if it ever arrives there.
- `__tests__/config/browse.test.ts`: the title; the groups are Home's own lists (D-084); the website's 8 sorts in order and wording, no "Most relevant"; Featured only inside a group; `effectiveSort`: the defaults, a picked sort kept, a picked Featured becoming A-Z for all books (D-085).
- `__tests__/shopify/catalogue.test.ts`: `fetchAllBooksPage` reads one page of 20 from the root `products` query with the sort and `available_for_sale:true`, no query when off, rented-out books mapped, the cursor; `fetchCollectionBooksPage` with a list sends the sort and `filters: [{ available: true }]`, or `null` when off (D-083, D-086).
- `__tests__/shopify/hooks/catalogue.test.tsx`: without options, P6-03's key and variables unchanged; each combination cached on its own; `useAllBooks` reads 20 then 6 and never the whole catalogue; the `catalogue` preset under the `storefront` root.
- `__tests__/shopify/operations.test.ts`: `AllBooks` and the extended `CollectionBooks` validate against the saved schema, carry `@inContext` and select no personal field.
- `__tests__/components/BookListControls.test.tsx` (D-089): a list opens, marks the chosen option and closes on a choice; **Android's back button (`onRequestClose`) closes it without leaving the screen or changing the choice; a tap outside closes it the same way**; the switch passes its change on; Featured only inside a group.
- `__tests__/app/browse.test.tsx`: opens on all books, "Available now" on, A-Z, 20 books; no Featured for all books; Age group and Series only, no Genre; only collections that exist; no group button before the handles are known; a chosen age group reads its collection with Featured and shows on its button; a series replaces an age group; "Clear" returns to all books and A-Z; a picked sort kept across a group change; a picked Featured becomes A-Z on "Clear"; a book orderable at zero stock shown with the toggle on, a rented-out book with its badge and no button with it off; both empty messages; "Load more" 20 then 26; offline with the controls kept, the notice over saved books, the error and "Try again" after `recheckNetwork()`; a group removed after listing says it is not available.
- `__tests__/app/collection.test.tsx`: "Available now" on and Featured by default; off reads again without the filter and keeps the title; all 8 sorts in order with Featured marked, and a chosen sort read; both empty messages. `__tests__/app/tabs.test.tsx`: the Tintin tile's empty state now shows the "Available now" wording.

**Development store numbers for the phone check** (`npm run check:dev-store`, 8 October 2026): all books 29 with "Available now" on (20, then 29 after "Load more") and 42 with it off (20, 40, 42; the 3 older test products are among them); `junior-readers` 21 on (20, then 21) and 26 off; `tintin-series` empty either way.

**Phone check** (development build 3c8bf273, JavaScript from Metro, owner's phone, under `CLAUDE.md`'s phone check rules; Do Not Disturb on; the focus check and each tap, swipe or key in the same command):
1. Browse shows "Books for Rent", Age group and Series buttons (no Genre), "Available now" on, "Sort: Alphabetically, A-Z", and two columns of cards with no cart or notify-me button.
2. "Load more": 29 books in all, then the button disappears.
3. `harry-potter-and-the-deathly-hallows-book-7` (orderable at zero stock) is in the list with "Available now" on, with no badge.
4. "Available now" off: `the-gruffalo` shows with "Rented Out" and no button.
5. Age group "9-10 years": `junior-readers` with "Sort: Featured"; then Series "Harry Potter" replaces it; "Clear" returns to all books with A-Z.
6. Each sort once on all books; with "Price, low to high" the prices rise down the list, with "Alphabetically, Z-A" the titles run backwards.
7. **With the Sort list open, Android's back button once: the list closes and Browse stays.** A tap outside an open list closes it too.
8. From Home, the Tintin tile: "No books available right now. Switch off Available now to see rented-out books."; off: "No books here yet." The "9-10 years" chip: "Available now" on, "Sort: Featured", 21 books.
9. Home and the development preview are unchanged.
10. Standing step (D-082, D-087): more than 5 minutes in the background, then back: no false offline notice.
11. The app's own log shows no crash and no JavaScript error.

Passed on 8 October 2026 (all 11 steps; one interruption by a phone call, handled by the focus check; details in `CURRENT_STATUS.md`).

### The book page (P6-05)

Unit tests; the Storefront client or the catalogue fetchers are mocked and nothing reaches a store:
- `__tests__/shopify/richText.test.ts` (D-091), the description as untrusted input: the live shape (bold headings, "•" lines, ✅ and ❌, a `span`); every kept tag in any case; nested bold and italic; bullets, numbering per list, nested lists by depth, `li` wrapping `p`, a second paragraph in an item, an unclosed `li`, an `li` outside a list; `div`, `blockquote`, `tr` and `table` end a paragraph with no style; **`h1` to `h6` end a paragraph and are bold**; links as plain text with nothing of the address kept; attributes never read, `>` inside a quoted value; `script` and `style` (and the other dropped elements) lose their content, also when unclosed or in capitals, a self-closed one is empty; comments, doctype, CDATA, processing instructions; control characters; unclosed, stray and misnested tags; a `<` that starts no tag; an unfinished tag at the end; 22 hostile fragments never throw; named, decimal, hex, Windows-1252, invalid and unknown references; an encoded tag stays text; whitespace, line breaks and empty paragraphs; a 200 KB description, 10,000 nested tags and 50,000 stray `<` each read within 2 seconds.
- `__tests__/shopify/bookPage.test.ts`: the card's fields plus the description and genres; the three availability states; no description; no variant; a foreign currency throws; genre labels in order, trimmed and once, skipping other types and blank labels.
- `__tests__/shopify/catalogue.test.ts`: `fetchBook` reads `BookPage` by handle with the cancel signal; null for a missing book; null for a book without a variant, reported once by code.
- `__tests__/shopify/hooks/catalogue.test.tsx`: `useBook` caches under `book(handle)` with the `liveStock` preset and reads Shopify again when the page opens again.
- `__tests__/shopify/operations.test.ts`: `BookPage` validates and carries `@inContext`; it reads only the `shopify.genre` metafield and no rating, ISBN, publisher, pages, language or binding; the no-rating check now covers `AllBooks` too.
- `__tests__/app/book.test.tsx`: the header with the back arrow only; the live order; the author in small capitals and the title as a header; rented out: "Rented Out" badge and the sentence, no "Rent"; in stock and orderable at zero stock: the green "Rent" badge and never the sentence or any unavailable wording; the screen reader's price label; no retail price below the price; the cream frame with no cover; the full description with bold headings and emoji lines; genre chips under "Genre", not tappable; no rating, cart, buy, notify or shipping text; "This book is not available."; offline, the notice over a saved page, the error and "Try again" after `recheckNetwork()`; the bottom inset.
- `__tests__/components/BookCard.test.tsx` and `RichText.test.tsx`: `onOpen` makes the card one link and leaves its buttons apart; no link without it; bold, italic, markers and indents; a link with nothing to tap.
- `__tests__/app/home.test.tsx`, `browse.test.tsx`, `collection.test.tsx`, `dev-catalogue.test.tsx`: a tapped card opens `/book/[handle]`; the preview's missing-book link and description sample.

**Phone check** (development build 3c8bf273, JavaScript from Metro, owner's phone, under `CLAUDE.md`'s phone check rules; Do Not Disturb on; the focus check and each tap or swipe in the same command):
1. The development preview's "Book page" section: the description sample shows bold headings, "•" lines and ✅ and ❌ lines; the link is plain text.
2. An in-stock book (`the-diary-of-a-wimpy-kid-no-brainer`), opened from its card: cover, author in capitals, title, prices with the green "Rent" badge, description, genre chips; no sentence, rating or buttons. Back returns to the list.
3. `the-gruffalo`: the sentence and the "Rented Out" badge in the price row.
4. `harry-potter-and-the-deathly-hallows-book-7` (orderable at zero stock): the "Rent" badge and no sentence.
5. `peter-and-the-wolf-read-it-yourself`: the cream frame with the book icon.
6. "Open a missing book": "This book is not available."
7. A card on Browse opens its page; back returns to Browse with its settings.
8. Pause: the owner takes their own screenshots of Browse and one book page for the architect.
9. Standing step (D-082, D-087): more than 5 minutes in the background, then back on a book page: no false offline notice.
10. The app's own log shows no crash and no JavaScript error.

Passed on 8 October 2026 (all 10 steps; details in `CURRENT_STATUS.md`). The development store's own descriptions are single paragraphs with no markup, so only the preview's sample shows the live shape there.

### Search (P6-06)

Unit tests; the Storefront client or the catalogue fetchers are mocked and nothing reaches a store:
- `__tests__/shopify/searchTerm.test.ts` (D-097): trimming and single spaces; Shopify syntax kept as typed (quotes, `title:`, `harry:`, a leading minus, `OR`); emoji and Hindi kept whole; the cut at 100 code points never splits an emoji; 12 hostile inputs (control characters, lone surrogates, backslashes, operation-like text, a million characters) never throw; letters and digits counted in any script; typing from 3, the search key from 2; symbols alone never search.
- `__tests__/config/search.test.ts`: the agreed wording; Relevance then the two price sorts in Browse's wording; 300 ms and 100 characters; "1 result", "7 results", "1,000+ results"; both no-results lines.
- `__tests__/shopify/sort.test.ts`: the search sorts to `RELEVANCE` and `PRICE` (reversed for high to low).
- `__tests__/shopify/catalogue.test.ts`: `fetchSearchPage` sends the term, 20, the cursor, the sort and `LAST` or `HIDE` with the cancel signal; books only, `prefix: LAST`, no `predictiveSearch`; untrusted terms only as a variable, exactly as given; Shopify's count; only books kept; a book without a variant left out and reported by code; a failure passed on.
- `__tests__/shopify/hooks/search.test.tsx`: nothing read without a term; 20 then the rest; each term and setting cached on its own under `storefront`, `catalogue` preset; **the earlier request's signal aborted when the term changes**; **the earlier results kept while a new term loads** (`isPlaceholderData`).
- `__tests__/shopify/searchPrivacy.test.tsx` (D-097): a GraphQL error whose text repeats the term, a server error after the retries, an unreadable answer and a data fault each reach Sentry by code and operation name only; no Sentry call and no console call carries the term. Shown: with one `console.log` of the term added, all 4 tests fail.
- `__tests__/app/search.test.tsx`: header, focused field, placeholder and hint, nothing read before a search; the field's settings (100 characters, no autocorrect, search key); the hint below 3 letters; symbols never search; the 300 ms pause, one request for quick typing, the search key at once from 2, the term trimmed; the count line, two columns, a card opening its book page; "1 result" and "1,000+ results"; "Load more" 20 then 26; both no-results lines with the cleaned term; **earlier results kept with no count line and no "Load more" while a new term loads, and no no-results line for a term still loading** (shown: without either part, 2 tests fail); the keyboard settings on the list; the keyboard closed when the screen loses focus; the bottom inset; "Available now" off and Relevance by default, on reads again; the three sorts only; offline, the error with "Try again" after `recheckNetwork()`, the error replacing earlier results when a new term fails; the term never logged and never in a route.
- `__tests__/app/home.test.tsx` and `browse.test.tsx`: a button named "Search", at least 44 points square, opens `/search`; Home's other buttons stay absent. `__tests__/components/BookListControls.test.tsx`: Featured first inside a group; only the sorts a screen passes (search's three).

**Development store numbers for the phone check** (`npm run check:dev-store`, 8 October 2026): harry 7 (6 orderable, then `harry-potter` rented out; 6 with "Available now" on); dahl 3 (`danny-the-champion-of-the-world`, `james-and-the-giant-peach`, `the-bfg`); zzqxv 0. "Price, low to high" for harry: ₹49 first, with `harry-potter` after the orderable ₹49 books; "Price, high to low": ₹74 first.

**Phone check** (development build 3c8bf273, JavaScript from Metro, owner's phone, under `CLAUDE.md`'s phone check rules and the standing permission, D-095; Do Not Disturb on; the focus check and each input in the same command; **no screenshot while the keyboard shows**). Test words typed: `harry`, `dahl`, `zzqxv`.
1. Home's search button opens Search; one Back press, then a screenshot: still on Search with the hint means the keyboard was open and the field focused.
2. Type "harry"; one swipe on the results hides the keyboard; "7 results", "Sort: Relevance", "Available now" off, `harry-potter` with "Rented Out" last.
3. "Price, low to high", then "Price, high to low": the order recorded.
4. "Available now" on: "6 results", no "Rented Out". Off again.
5. Tap into the field (keyboard up), then one tap on a card with no screenshot between: the book page opens on the first tap. Screenshot of the book page; Back returns to "harry" with the results.
6. Double tap: two taps on one card in one command, then Back once; report whether it returned to the list or to a second copy of the book page.
7. Back to Home, Browse's search button, type "dahl": "3 results", the Dahl books.
8. Back, Search again, type "zzqxv": the website's no-results line.
9. Standing step (D-082, D-087): more than 5 minutes in the background on the results, then back: no false offline notice; the term and the results kept.
10. The app's own log: no crash and no JavaScript error; harry, dahl and zzqxv appear nowhere in it.

Run on 8 October 2026: steps 1 to 5 and 7 to 10 passed; **step 6 found that a double tap opens the book page twice**, fixed in the same pull request (D-099, below).

**Double tap and the clear button (architect's review of PR #19, D-099).** Unit tests:
- `__tests__/navigation/openGuard.test.tsx`, with fake timers: `openScreen` ignores a second open at 499 ms and opens at 500 ms; any second open inside the window is ignored, whichever control it comes from; push by default, navigate when asked; a clock moved back never blocks. For each kind of control: a book card (double tap opens once; another card after Back and the window opens; a different book later opens), the search button, a series tile and an age chip (both `Link`s, through `guardLinkPress`, with `Link` mocked as its source behaves): a second open inside the window ignored, one after it works. `guardLinkPress` prevents the default only inside the window. Shown: with the guard switched off, 7 of the 11 tests fail.
- `__tests__/app/search.test.tsx`: the clear button only while the field has text, named "Clear search", at least 44 points; it empties the field, brings back the hint, hides the results, focuses the field again (the keyboard stays) and never dismisses the keyboard (shown: without the focus call, that test fails); it stops a search waiting for the pause, and the next term searches.
- `jest.setup.ts` clears the guard after each test; it loads the guard only after the test, so the test file's own `expo-router` mock applies.

**Phone check before the fix** (8 October 2026, 04:54 to 04:56 IST, standing permission, Do Not Disturb on): a fast double tap (two taps in one adb command), then Back: book card on Home, **opened twice**; search button on Home, **opened twice** (three Back presses back to Home: the keyboard, then each Search); series tile ("Wimpy Kid") and age chip ("6-8 years"), **once**.

**Short phone check after the fix:** a double tap on a book card, on the search button and on a series tile, each followed by Back: back where the tap was made; type "harry", tap the clear button: the hint is back; type "dahl": "3 results". No screenshot while the keyboard shows. **Passed on 8 October 2026, 05:23 to 05:25 IST** (commit `4b964d7`; details in `CURRENT_STATUS.md`). In step 10, "harry" appears only in Glide's debug lines naming cover image files on Shopify's CDN (`harry-potter-and-the-…`), never as the typed term; dahl and zzqxv 0. Details in `CURRENT_STATUS.md`.

### Release gate: list performance (P6-03)

No build goes to any tester other than the owner until the collection list scrolls and loads more smoothly on a **release** build: the collection screen and, when it exists, Browse, on the owner's phone. In P6-03 the list was measured only with production-mode JavaScript in the development build (7 October 2026: "Load more" on `junior-readers`, the 6 extra books on screen within 0.8 to 1.8 seconds of the tap, request included).

### Release gate: before the live store is connected (P6-07, owner)

Before any build points at the live store, all four checks below must pass on the live store, **read-only, with the app's public Storefront token** (the same reads as `npm run check:dev-store`; no Admin API, nothing written). If any fails, the build does not point at the live store until the owner decides.

1. The `all-books` collection exists, is published to the app's channel only, and returns every book the app can see.
2. The Genre filter (`filter.v.t.shopify.genre`) is offered on that collection and on a group.
3. The genre entries (`metaobjects(type: "shopify--genre")`) can be listed, and every filter value joins to at least one store name (D-102).
4. The eight custom genres show the store's names, not Shopify's: Manga, Picture Book, Realistic fiction, non fiction, Fairy tale, Mythology, Classic Literature, activity book (`SHOPIFY_AUDIT.md`, "Live website filters").

Creating the collection on the live store is the owner's decision at that time (store addition 4, `SHOPIFY_INTEGRATION.md`). Nothing on the live store is touched before then. If the genre entries cannot be listed, the app shows no Genre button and never Shopify's built-in names (D-102).

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
| 1a (redirect to Razorpay and back) and 1b (hand-off to a real UPI app) | Both at the owner-approved launch rehearsal in Phase 19, on the live store, with one small real order (D-033). Razorpay cannot be installed on the development store, whose business entity is in Bahrain, and UPI Intent works only in Razorpay live mode |
| 2 (cash on delivery and checkout rules) | Passed on Android in Phase 3 (P3-02). iPhone side in Phase 9 (D-036) |
| 3 (guest order after login) | Phase 7, login and account (D-034, D-035) |
| 4 (return through the Admin API) | Phase 10, backend foundation (D-034, D-035) |
| 5 (links open the app) | Phase 12, notifications and deep links (D-034, D-035, risk 17) |
| 6 (Judge.me reviews) | Phase 13, reviews (D-034, D-035) |

Until the rehearsal, nothing proves that a prepaid payment works inside Checkout Kit (risk 2). The checkout screens (Phase 9) therefore ship with a remote flag that can move checkout to the system browser with a return link (D-033). Tests for the checkout screens cover both settings of the flag.
