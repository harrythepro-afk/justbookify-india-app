# Product requirements

Approved by the owner on 2 October 2026. Changes need the owner's approval and a new entry in `DECISIONS.md`.

## The business

JustBookify India rents children's books by post and courier from Bengaluru to five southern states. Each book has its own rental price. There is no subscription and no deposit. Customers pay through the store's Shopify checkout, by Razorpay or cash on delivery.

## Business rules

| # | Rule | Source | What the app does |
| --- | --- | --- | --- |
| R1 | Each book has its own rental price, ₹34 to ₹99 | Product price in Shopify | Shows Shopify's price; nothing is hard-coded |
| R2 | An order's subtotal must stay under ₹500 | Checkout rule; owner confirmed it is deliberate | Stops the cart at the cap and explains why |
| R3 | Delivery only to pincodes starting with 50 to 53 or 56 to 69 | Checkout rule | Checks the pincode before opening checkout |
| R4 | Prepaid delivery costs ₹75, and is free when the cart total is ₹200 or more. Cash on delivery costs ₹125, and ₹50 when the cart total is ₹200 or more. There is no separate cash-on-delivery fee, and cash on delivery is offered only up to a cart total of ₹500 | Shipping rates, the SMART Checkout Rules automatic shipping discount (₹75 off either rate from ₹200) and the ACOD app (D-023, D-031; D-031 corrects D-024) | Shows an estimate and a delivery-discount hint in the cart; every fee figure is a hint and checkout sets the final amount |
| R5 | A family may order again while holding books; the old books are collected at delivery | Owner | Shows which books will be collected |
| R6 | No limit on the number of books, beyond R2 | Owner | No count limit in the cart |
| R7 | A rental lasts up to one month; late returns get reminders, never a charge | Owner and FAQ | Shows a due date and sends a reminder |
| R8 | A book Shopify marks orderable can be ordered, even at zero stock; any other shows notify-me | Owner | Follows Shopify's availability for each book |
| R9 | The customer requests a return; staff approve it in Shopify | Owner | Return request screen; status shown on the order |
| R10 | Damaged books are never charged to the customer | FAQ | Stated in the return flow |

Values in R2, R3 and R4 are read from configuration, because the store owner can change them in Shopify.

## Version 1 scope

| Area | In version 1 |
| --- | --- |
| Home | Series, authors, age groups and new arrivals |
| Browse | Filter by age group, genre, series, availability and price; sort |
| Search | Search with results as you type; no separate suggestion list (owner, P6-06, D-097) |
| Book page | Cover, rental price beside retail price, author, genre, description (rating with reviews in Phase 13, D-092) |
| Reviews | Read reviews; write one after renting the book |
| Recommendations | A short quiz on age and genres, and "more like this" on book pages |
| Cart | The order cap, the free-delivery hint and a pincode check, all before checkout |
| Checkout | Shopify's checkout inside the app: Razorpay, cash on delivery, discount codes |
| Account | Login by emailed code, profile, addresses, notification settings, account deletion request |
| Orders | Order list, order status, the books in each order |
| Books I have now | Every delivered book not yet returned, with its due date |
| Returns | Request a pickup in the app; staff approve it in Shopify |
| Notify me | An alert when a book Shopify marks unavailable comes back |
| Notifications | Order updates, return reminders, back-in-stock alerts |
| Help | WhatsApp, contact, FAQ and the store policies |

After launch: loyalty points, a saved wishlist, the parenting blog, marketing campaigns by push, more cities, a separate Bahrain app.

Not planned: children's profiles with names or birth dates, advertising trackers, any payment screen of our own.

## Screens

| Screen | What the customer does | Login needed |
| --- | --- | --- |
| Home | Sees series, authors, age groups and new arrivals | No |
| Browse | Filters and sorts the catalogue | No |
| Search | Finds a book by title, author or series | No |
| Book detail | Reads about a book, sees its price, adds it to the cart (rating with reviews in Phase 13, D-092) | No |
| Reviews | Reads reviews for a book | No |
| Recommendation quiz | Answers a few questions and gets a book list | No |
| Cart | Reviews the selection, sees fees and the cap, enters a pincode | No |
| Help | Opens WhatsApp, the FAQ or a policy | No |
| Login | Enters an email and the code sent to it | Starts here |
| Checkout | Pays through Shopify's checkout, or picks cash on delivery | Yes |
| Orders | Sees each order, its status and its books | Yes |
| Books I have now | Sees books at home and when they are due | Yes |
| Return request | Picks the books to return and asks for a pickup | Yes |
| Account | Edits profile, addresses and notification choices; asks to delete the account | Yes |

Writing a review happens from the order screen, after the book has been delivered.

## Design direction (version 1)

Approved by the owner on 3 October 2026 (D-037).

- Version 1 follows the current website's look and structure: its colours, fonts, wording and section order. No new visual identity is designed now. The owner plans to redesign the website and the app together later.
- Every visual value lives in design tokens, and screens never hard-code a colour, font or spacing value, so the later redesign can be applied by changing tokens and a small set of shared components.
- The colours and fonts are taken from the public website and recorded in D-038.
- The approved feature scope (D-001) is unchanged.

## Screen layouts (version 1)

Approved by the owner on 3 October 2026 as the target for later phases (D-037).

- **Navigation:** five tabs, each with an icon and a label: Home, Browse, Cart, My Books, Account. Search sits under Browse. My Books holds books at home, orders and returns, and asks for login when the customer is signed out. Account holds profile, addresses, notification settings and help.
- **Home:** header with the store name and a search button. A banner with a short headline, one line of text and a "Books for Rent" button. A "Popular series" row. A "Popular authors" row of text tiles like the series row, each opening that author's books, showing only the authors the store has, with no "All authors" tile (P6-10, D-114). A "Browse by age" row of chips. A "New arrivals" grid of book cards. It mirrors the website's home page.
- **Book card, used everywhere:** cover image, title on one line, author, rental price in bold with the retail price struck through beside it, and an "Add to Cart" button. A book that cannot be ordered shows a "Rented Out" badge on the cover and a "Notify me" button instead.
- **Book page** (P6-05, D-090): in the live page's order, the cover, the author in small capitals, the title, the website's sentence "Currently not available as another junior reader is enjoying this book." for a rented-out book only, the retail price struck through and the rental price with a green "Rent" badge ("Rented Out" when the book cannot be ordered), the full description as native text (D-091), and "Genre" with one chip per genre. A chip whose genre the Genre filter offers (all books, "Available now" on) opens the books of that genre, on a screen pushed on top of the book page, so Back returns to the book (P6-10, D-113); any other chip is plain text. A book orderable at zero stock has the "Rent" badge and never the sentence. No rating (Phase 13), no other details, and no cart or notify-me button until Phase 8 (D-081).
- **Browse, titled "Books for Rent":** four filter buttons (Age group, Genre, Price, Series) in one row that scrolls sideways, with "Clear" pinned at its right edge (D-105), an "Available now" toggle, a sort control, and a two-column grid of book cards. P6-04 builds Age group and Series, one group at a time, "Available now" on by default and the website's sorts (D-084 to D-086). P6-07 adds the Genre button, one genre at a time, combined with the group, "Available now" and the sort, named by the store's own genre names (D-101, D-102); all books come from the store's "All books" collection (D-100); the Series list is Home's 15 and then a longer list (D-103). P6-08 adds the Price button: "All prices", then "Up to ₹34", "Up to ₹49" and "Up to ₹74", one at a time, by the rental price, combined with the group, the genre, "Available now" and the sort; the price points are store configuration and the labels follow the store's currency format (D-104). The collection screen opened from Home has the Genre and Price buttons too; opened from a book page's genre chip, it lists all books with that genre chosen, "Available now" on and "Alphabetically, A-Z" (D-113). Search has no Genre or Price filter.
- **My Books:** three segments (At home, Orders, Returns). At home shows a summary card with the number of books and the due date, the line "We collect these when your next order arrives.", a list of the books with their delivery date, a "Request return pickup" button and a "Choose your next books" link.

## Privacy requirements

- No children's data in version 1. The app deals with the parent only.
- Marketing notifications are opt-in and off by default. Order updates and reminders are separate.
- No advertising SDKs.
- The app collects its own consent for push notifications at a sensible moment, not at first launch.
- **Analytics is opt-in (D-048).** Nothing is collected until the customer says yes. The choice is not asked, granted or denied, and only granted switches collection on. The Account tab has a "Share app usage" switch, off by default; turning it off stops collection at once and clears the analytics data on the phone. The switch's wording is a draft, to be reviewed by the owner's adviser with the privacy policy (risk 21).
- **Analytics consent request (requirement, Phase 7).** It is never shown at first launch, offers Allow and Don't allow (closing it leaves the choice not asked), and says that usage is linked to the customer's account. The owner decides its placement in Phase 7:
  - (a) right after the first login or sign-up, which never measures customers who browse without logging in; or
  - (b) at a natural pause before login, such as adding the first book to the cart, with the account-linking line shown after login.

  **Release gate:** no build goes to an outside tester without a working consent request (`TESTING.md`).
- **Analytics user ID (requirement, Phase 7, D-050).** After login, and only for customers who granted consent, the app sets a stable per-customer ID. It is random or a salted one-way value, never an email, a phone number or the raw Shopify customer ID. Logging out or withdrawing consent clears it.
- Install-source reporting through the Play install referrer is allowed, under analytics consent only (D-049). Advertising IDs, advertising consents and audiences stay off.
- Google Analytics keeps event data for 14 months (D-051).

## Constraints from the owner

- The website and the store's settings are not to be changed for this project. Only the three store additions in `SHOPIFY_INTEGRATION.md` are allowed, each with the owner's go-ahead.
- The developer accounts are the owner's existing Apple and Google accounts.
