# Analytics

Tool: Google Analytics for Firebase. No advertising SDKs in version 1.

State since P4-04 (D-048 to D-053): the app records the events below through one typed module, `src/analytics/`, and **only after the customer's consent**. Collection is opt-in and off by default. The customer turns it on with "Allow" on the consent request, shown right after a login (P7-03, D-129), or with the "Share app usage" switch on the Account tab (below). `firebase.json` keeps collection off at install (`analytics_auto_collection_enabled` false, `analytics_default_allow_analytics_storage` false). `analytics_collection_deactivated` is false, so that the app can switch collection on at runtime when the customer agrees (D-053). Automatic screen reporting stays off; screens are logged by route name.

**Permanent for all of version 1 (D-009 as amended by D-049, D-045):** these stay off:
- the `AD_ID`, `ACCESS_ADSERVICES_AD_ID` and `ACCESS_ADSERVICES_ATTRIBUTION` permissions (blocked)
- Advertising ID and SSAID collection
- the advertising consents (`ad_storage`, `ad_user_data`, `ad_personalization`, denied in every `setConsent` call)
- audiences and Google signals

**Allowed (D-049):** install-source reporting through the Play install referrer (`BIND_GET_INSTALL_REFERRER_SERVICE`). It reports only under consent, because collection is off otherwise.

## Consent (D-048)

- **Three states:** `not asked` (nothing stored), `granted` and `denied`, stored with `expo-secure-store` (D-052). Only `granted` switches collection on. A value that cannot be read counts as `not asked`.
- **Every launch:** Firebase's own setting, which persists across launches, is synced to the stored choice before anything is sent. Nothing is sent while the choice is still being read.
- **Granting:** the choice is saved first, then collection is switched on.
- **Withdrawing:** sending stops at once. Collection is switched off, the analytics data on the phone is reset (`resetAnalyticsData`, which also starts a new app instance ID), then `denied` is saved.
- **Android backup is off** (D-052), so a restored phone never starts with collection on and no consent record.
- **Account switch wording (a draft, to be reviewed by the owner's adviser with the privacy policy, risk 21):** "Share app usage. Helps us improve the app. We record which screens you open, what you do in the app and the link you installed it from. When you're logged in, it's linked to your account. We never record your name, email, phone number or address, and the app never asks for or records a child's name or date of birth. Turning this off stops it at once and clears the usage data on this phone."
- **Consent request (P7-03, D-129, D-130).** Placement (a), the owner's choice: right after a login that succeeds on the Account tab, only while the choice is `not asked`, once per login. Never at a launch, for a login restored from storage, after a cancelled or failed login, or on any other screen. In Phase 9, a first login at checkout waits for the order to be confirmed; the request never interrupts checkout.
  - **Wording (a draft, approved by the owner, for the adviser's review with the privacy policy, risk 21):** "Help us improve the app?" / "If you allow it, we record how you use the app, such as the screens you open and the books you look at, along with basic device information, and link it to your account. We never record the words you type in search or any payment details." / "You can change this at any time on the Account tab." / [Don't allow] [Allow].
  - "Allow" grants (saved first, then collection on); "Don't allow" denies, as the switch does; "Close" or Android's Back stores nothing and leaves `not asked`, so it shows again after a later login. Nothing is sent before "Allow" has been saved.
  - The two answers look the same and neither is chosen in advance; tapping outside does nothing.
  - **Development builds only (D-131):** Home's "Reset analytics choice" puts the choice back to `not asked` for phone checks.
- **Release gate:** no build goes to an outside tester without a working consent request (`TESTING.md`, "Release gate: analytics consent").

## Analytics user ID (D-050)

- **None in P4-04 or P7-03.** The Firebase wrapper has no user ID function. The Phase 10 backend issues it (D-132); the release gate "analytics consent" requires it before any outside tester, because the consent wording says usage is linked to the account.
- **Phase 7:** after login, and only for customers who granted consent, set a stable per-customer ID. It is random or a salted one-way value, never an email, a phone number or the raw Shopify customer ID. How it is issued is designed in Phase 7.
- Logging out or withdrawing consent clears it.

## Data retention (D-051)

Event data is kept for 14 months in each Google Analytics property, with "Reset user data on new activity" off. The owner sets this in Admin → Data collection and modification → Data retention:
- the development property in P4-04;
- the staging and production properties when they are created.

## How events are sent (D-053)

- One typed function per event in `src/analytics/events.ts`, for example `trackViewBook({ product_id, available })`.
- **IDs** come from `analyticsProductId()`, `analyticsCollectionId()`, `analyticsOrderId()` and, for a genre, `analyticsTaxonomyValueId()` (P6-09). Each takes a Shopify GID and keeps the numeric part.
- **Fixed codes** (filter types, stages, error codes, channels) come from `analyticsToken()`: lowercase snake case, starting with a letter. Free text does not type-check.
- **The guard** (`src/analytics/guard.ts`) checks every event again and drops the whole event if any parameter fails. Sentry is told which event and parameter, never the value.
- **A parameter whose kind depends on a code** (D-110): `filter_applied`'s `value` follows its `filter_type`, and `search`'s `match_id` follows its `match_type` (and is not sent for `other`). The guard checks the pairing, and the TypeScript types rule out a wrong one.
- **Screens** are named by their file route with groups removed: `index`, `browse`, `cart`, `my-books`, `account`, `dev-checkout`, `dev-catalogue`, `collection/[handle]`, `book/[handle]` (P6-05). Never the address or its parameters.
- `app_open` fires with `source` `cold_start` or `foreground`. The phases that build the other screens wire their events.
- **Catalogue events (P6-09):** `view_collection`, `view_book`, `filter_applied` and `search` are wired (below, "Catalogue events").
- **Login events (P7-03, D-130):** `login` and `logout` are wired, with no parameters; `sign_up` is not sent.
- Nothing is sent under Jest, or before or without consent.

## What Firebase sends by itself once consent is granted

Besides the app's own events, Firebase Analytics sends events and data of its own, **only while consent is granted** (collection is off otherwise). Google's "[GA4] Automatically collected events" page, read on 6 October 2026, lists them.

**Seen in DebugView on 6 October 2026** (build e571370c, P4-04 on-device check):
- `session_start`: the customer starts using the app.
- `user_engagement`: the app has been in the foreground for at least one second; it carries the time spent.
- User property `first_open_time`, set by Firebase.
- User property `non_personalized_ads` = 1, which follows from the denied advertising consents (D-049).

**Listed by Google as automatic for Android apps, and able to occur in this app under consent:**
- `first_open`: the first launch after an install or reinstall. It was not seen on 6 October, because collection was off at that install's first launch.
- `app_update`: the first launch after an update.
- `os_update`: the phone's Android version changed.
- `app_remove` and `app_clear_data` (Android only): the app is uninstalled, or its data is cleared.
- `firebase_campaign`: the app is opened with campaign parameters. This is the install-source reporting allowed by D-049.
- `error`: logged in place of an event Firebase rejects as invalid.
- **From Phase 12, with push notifications:** `notification_receive`, `notification_foreground`, `notification_open` and `notification_dismiss`.

**Never in version 1**, because the app has no ads SDK, Crashlytics, in-app purchases, Dynamic Links or In-App Messaging:
- the `ad_*` events and `adunit_exposure`;
- `app_exception`;
- `in_app_purchase` and the `app_store_*` events;
- the `dynamic_link_*` events;
- the `fiam_*` events.

**Sent with every event:**
- `app_version`;
- the screen parameters `firebase_screen_id` and `firebase_screen_class`. Because automatic screen reporting is off, the screen class is the route name the app sets.

Google Analytics also derives device model, operating system version, language and an approximate location (country and city, from the network address) for its reports. Firebase keeps an app instance ID, which a withdrawal resets.

**The privacy policy's app section (risk 21) must cover these automatic events and data as well as the app's own events,** including the catalogue events (`view_collection`, `view_book`, `filter_applied`, `search`) and the fact that, under consent, the app records which catalogue item a search matched (P6-09, D-109). If a later phase adds an SDK that brings more automatic events (for example, push notifications in Phase 12), this list and the privacy policy are updated together.

## Catalogue events (P6-09, D-107 to D-110)

Wired in `src/analytics/catalogueEvents.ts` (codes and the three catalogue events), `searchEvent.ts` (when `search` is sent) and `searchMatch.ts` (what a term matched). Every value is one of Shopify's numeric IDs or one of the app's codes; never a handle, a title, a name or the typed term.

**`view_collection`** (`collection_id`): once per opening of the collection screen (from Home), when it shows its collection; and when an age group or a series is chosen on Browse. Not for all books (Browse's screen view covers them, and the collection screen sends none when a genre chip opens it on all books, D-113), and not again for "Load more", the sort, "Available now", a genre or a price.

**`view_book`** (`product_id`, `available`): once per opening of the book page, when it first shows its book. `available` is `yes` when the book can be ordered (a book orderable at zero stock is `yes`), `no` when it is rented out.

**`filter_applied`** (`filter_type`, `value`): on Browse and the collection screen, never on search; only when the customer changes a choice. Never for the defaults when a screen opens, for a change the screen makes itself, or for the option already chosen.

| filter_type | value |
| --- | --- |
| `age_group` (Browse) | the collection's numeric ID |
| `series` (Browse) | the collection's numeric ID |
| `genre` | the taxonomy value's number; `all` for "All genres" |
| `price` | `up_to_34`, `up_to_49`, `up_to_74`: `up_to_` and each configured maximum (`BROWSE_CONTENT.price.maxima`), never typed by hand; `all` for "All prices" |
| `available` | `on` or `off` |
| `sort` | the sort's name in snake case: `featured`, `best_selling`, `title_ascending`, `title_descending`, `price_ascending`, `price_descending`, `created_ascending`, `created_descending` |
| `clear` (Browse) | `all`; one event, none for the choices it resets |

Choosing an age group or a series sends `view_collection` and then `filter_applied` with the same number.

**A genre chip on the book page (P6-10, D-113)** opens the collection screen on all books with that genre chosen: the collection screen sends one `filter_applied` (`genre`, the taxonomy value's number) once it has chosen it, and nothing for its defaults; the book page sends nothing for the tap. The link itself carries the number only, never the genre's name, and the screen view is logged by route name only (`collection/[handle]`).

**`search`** (`term_length`, `result_count`, `match_type`, `match_id`):
- **When:** once per term in one visit to the search screen, when that term's results have stayed on screen for 2 seconds; at once when the search key was pressed for it (as soon as its results arrive), or when a book is opened from its results before then. Never twice for the same term (letter case ignored), and not again for "Load more", the sort or "Available now". Nothing for a term that is replaced or cleared, or whose read fails, before then.
- `term_length`: the letters and digits in the cleaned term, counted as the search counts them (D-097).
- `result_count`: Shopify's `totalCount`, at most 1,000, including 0.
- `match_type`: `title`, `author`, `series`, `age_group`, `genre`, `wanted` (P6-11, D-118) or `other`. `match_id`: the matched item's ID or code (below), or the wanted name's code; none for `other`.

**Search-match rules (D-109).** The cleaned term is matched against the books on its own first page of results (their titles and authors), the configured series and age groups the store has (by their shown names) and the store's genre names (D-102), so a match works when the search finds nothing too.
1. The term and every name are normalised alike: accents removed, lowercase, apostrophes deleted, every other character that is not a letter or a digit a space. `DAHL`, `Dahl!` and `dahl` are the same; `J.K. Rowling` is `j k rowling`; `6-8 years` is `6 8 years`.
2. A term that uses Shopify's search syntax (a word starting with `-`; a colon, a quote mark, an asterisk or a bracket; `AND`, `OR` or `NOT` in capitals) is `other`.
3. **Level 1:** the term is the whole name.
4. **Level 2:** the term's words are consecutive whole words in the name. **Partial words never match** (`harr` is not `harry`). A term made **only of common words** (store configuration, `SEARCH_CONTENT.matchCommonWords`: a, an, the, and, of, in, on, at, to, for, with, by, is, my) matches only at level 1, so "the" never matches a book or a series because its name contains it.
5. **A term that matches two things:** a type matches only when all its hits share one ID; an ambiguous type is skipped. Level 1 comes before level 2; within a level the order is series, age group, genre, author, title. "harry" is the Harry Potter series (seven titles hold it, one series does); "Harry Potter" is the series even though one book has that exact title.
6. **`match_id`:** a title is the product's number, a series or an age group the collection's number, a genre the taxonomy value's number, an author `analyticsToken()` of the store's own author name (`roald_dahl`, at most 40 characters). An author name that cannot be made into a code never matches.

A typed word can therefore appear in an event only inside the store's own code it matched (`dahl` inside `roald_dahl`), never on its own (owner, P6-09 plan review).

On the development store (`npm run check:dev-store`): harry is the series `harry-potter-series`, dahl the author `roald_dahl`, zzqxv `other`, tintin the series `tintin-series` with 0 results.

**The wanted match (P6-11, D-115 to D-118).** The owner keeps a list of names they are thinking of stocking (authors, series or titles) in Remote Config: one JSON parameter, `search_wanted_list`, a plain list of strings, at most 200 names of at most 100 characters, read once per launch with the flags (D-046's timing). The app makes each name's code as it makes an author's (`David Walliams` is `david_walliams`). **Only when a search finds no books with "Available now" off, and the store's own catalogue gave `other`**, the term is matched against the list with rules 1 to 4 above (whole words only, Shopify's syntax and common-word-only terms never match): an exact name first, then a run of whole words, then the first entry in the list's order. A hit sends `match_type` `wanted` and `match_id` that name's code. The store's catalogue always wins: tintin with 0 results stays the store's series. A listed name that is also a store author shows as `wanted` only when the search found no books (D-117). **Never the name as written in the list, never the term.**

With the phone check's list (`["David Walliams", "Rick Riordan", "Tintin", "Harry Potter"]`) on the development store: walliams is `wanted` `david_walliams`, riordan `wanted` `rick_riordan`, tintin the series 528439279891, harry the series 528438755603 (7 results), zzqxv `other`; walliams with "Available now" on is `other`.

## Rules

- Snake case event names. IDs, never titles or free text.
- No names, emails, phone numbers or addresses. The app never asks for or records a child's name or date of birth. Age-group filters and the books viewed are recorded as IDs and codes.
- **The search term itself is never sent, logged or reported.** The `search` event records its length and, only when it matches the store's own catalogue, that item's ID or code (D-108, amending this rule's earlier wording "Search terms are measured by length, not content", owner's decision of 9 October 2026), or, for a search that finds nothing, the code of the name it matched on the store's wanted list (D-117, D-118).
- The analytics user ID is random or a salted one-way value, never the email, a phone number or the raw Shopify customer ID (D-050).
- Analytics starts only after the customer's consent (opt-in, D-048).
- Crash reports (Sentry) follow the same rules; the scrubbing is described in `SECURITY.md` and D-042.

## Events (first version)

| Event | Fires when | Parameters |
| --- | --- | --- |
| app_open | App comes to the foreground | source |
| sign_up | First successful login for a new customer. **Not sent:** the app cannot tell a new customer from a returning one (D-130) | none |
| login | A login on the Account tab succeeds: at once when consent is granted; when the consent request was shown, right after "Allow" has been saved; never after "Don't allow" or "Close" (D-130) | none |
| logout | The customer taps "Log out", before the session ends; not when Shopify ends the login (D-130) | none |
| search | One term's results stayed on screen for 2 seconds, or at once after the search key or when a book is opened from them; once per term per visit (D-108) | term_length, result_count, match_type (including `wanted`, D-118), match_id (not with `other`) |
| filter_applied | The customer changes a filter, "Available now" or the sort, or taps "Clear", on Browse or the collection screen (D-107) | filter_type, value |
| view_collection | The collection screen shows its collection; an age group or series is chosen on Browse (D-107) | collection_id |
| view_book | The book page shows its book, once per opening (D-107) | product_id, available |
| select_book | Book added to the cart | product_id, cart_size |
| remove_book | Book removed from the cart | product_id, cart_size |
| book_unavailable_shown | A selected book went unavailable | product_id, stage |
| notify_me_requested | Customer asks for a back-in-stock alert | product_id |
| view_cart | Cart is opened | book_count, cart_value |
| order_cap_reached | Cart hits the order cap | cart_value |
| begin_checkout | Checkout is presented | book_count, cart_value |
| rental_order_success | Checkout completes | order_id, book_count, payment_type |
| checkout_failed | Checkout errors or is abandoned | stage, error_code |
| return_initiated | Return request sent | book_count |
| return_completed | Staff mark the return received | book_count |
| repeat_rental | Second or later order completes | rental_number |
| review_submitted | Customer submits a review | product_id, rating |
| recommendation_quiz_completed | Quiz finished | result_count |
| notification_received | Push arrives in the foreground | type |
| notification_opened | Push is tapped | type, destination |
| support_opened | WhatsApp or contact is opened | channel |
