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
| R4 | Delivery costs ₹75 and is free for prepaid orders with a subtotal of ₹200 or more; cash on delivery costs more: a ₹125 flat rate, plus the ACOD app's own fee, whose amount is unknown | Shipping rates and an automatic discount; the ₹200 figure is from the store's FAQ (D-023); the cash-on-delivery figures are from the audit (D-024) | Shows an estimate and a free-delivery hint in the cart; every fee figure is a hint and checkout sets the final amount |
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
| Search | Search with suggestions as you type |
| Book page | Cover, rental price beside retail price, author, genre, star rating |
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
| Book detail | Reads about a book, sees price and rating, adds it to the cart | No |
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

## Privacy requirements

- No children's data in version 1. The app deals with the parent only.
- Marketing notifications are opt-in and off by default. Order updates and reminders are separate.
- No advertising SDKs.
- The app collects its own consent for push notifications at a sensible moment, not at first launch.

## Constraints from the owner

- The website and the store's settings are not to be changed for this project. Only the three store additions in `SHOPIFY_INTEGRATION.md` are allowed, each with the owner's go-ahead.
- The developer accounts are the owner's existing Apple and Google accounts.
