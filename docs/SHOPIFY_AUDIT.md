# Shopify audit: justbookify.in

Read-only audit completed on 2 October 2026, through the Shopify connection, the owner's screenshots and the public website. No customer personal data is recorded here. Re-check any fact older than three months before relying on it.

## Store

| Item | Finding |
| --- | --- |
| Plan | Basic. No custom-app Shopify Functions and no checkout UI extensions |
| Market | India; INR; English |
| Size | About 2,300 products (about 2,040 active), 8,900 customers, 3,100 orders |
| Locations | Bangalore and Kolkata |
| Sales channels | Online Store, Point of Sale, Facebook & Instagram, Google & YouTube, Inbox. Headless is not installed |
| Live theme | A copy exported from the Bahrain store's theme |

## Customers and login

- New customer accounts are active. Login is by emailed code.
- Sign-in is not required at checkout on the website, so guest orders exist.
- Customer fields for children's names and birth dates are defined by an app but hold no data. The app does not use them.

## Products

- One variant per book. SKU is empty. Inventory is tracked.
- The vendor field holds the author. The product type holds age groups. Series are tags.
- Product metafields include genre, service city, publisher, pages, ISBN, language and Judge.me ratings. They are readable by the storefront. Exact keys are below.
- 169 products hold more than one copy. Some titles exist twice as separate products.
- Some best-sellers are set to keep selling at zero stock and show negative inventory. This is deliberate.
- Some ISBN-13 values and barcodes are stored as `9.78E+12` (spreadsheet damage). Do not rely on barcodes.

### Product fields in detail (architect, 7 October 2026)

Read by the architect from the live store on 7 October 2026 through a read-only connection. Claude did not read the live store.

- **Author:** `vendor`.
- **Age group:** `productType`, with inconsistent values. There are 16 variants, for example `early-readers`, `emerging-readers; junior-readers`, `Junior readers; Pre-teen readers` and `Teenage Readers`: several groups joined with `"; "`, mixing hyphens, spaces and capitals. **The app does not parse `productType`.**
- **Series:** tags, in mixed formats, for example `HarryPotter`, `WimpyKids`, `GeronimoStilton`, `My Hero Academia`, `a-z-mysteries`, `Storey Treehouse`.
- **New arrivals:** the tag `new-arrival`.

### Collections (architect, 7 October 2026)

The store's own groupings. All are smart collections; there are more than 50. A sample, by handle:

- **Age groups**, by `productType`: `early-readers`, `emerging-readers`, `junior-readers`, `pre-teen-readers`, `teenage-readers`.
- **Series**, by tag: for example `harry-potter-series` (tag `HarryPotter`), `wimpy-kid-series` (`WimpyKids`), `geronimo-stilton` (`GeronimoStilton` or `Geronimo`), `tintin-series`, `famous-five-series`, `dog-man-series`, `magic-tree-house-series`, `goosebumps-series`.
- **Authors**, by `vendor`: for example `roald-dahl`, `ruskin-bond`, `enid-blyton`, `jeff-kinney`, `rick-riordan`, `sudha-murthy`.
- **Others:** `manga-collections`, `flip-flap-books`, `touch-feel-books`, `read-it-yourself`.

### Product metafields (architect, 7 October 2026)

All are readable by the Storefront API. Listed as `namespace.key`, type, and the number of products using it:

| Metafield | Type | Products |
| --- | --- | --- |
| `shopify.genre` | list of metaobject references | 2,297 |
| `shopify.language-version` | list of metaobject references | 2,160 |
| `shopify.book-cover-type` | list of metaobject references | 2,021 |
| `shopify.target-audience` | list of metaobject references | 212 |
| `reviews.rating` | rating | 75 |
| `reviews.rating_count` | integer | 59 |
| `custom.service_city` | list of text | 2,107 |
| `custom.publisher` | list of text | 1,941 |
| `custom.language` | text | 2,023 |
| `custom.net_quantity` | text | 1,893 |
| `custom.pages` | text | 1,308 |
| `custom.isbn_10`, `custom.isbn_13` | text | not recorded |
| `custom.item_weight` | text | 1,386 |

- The `shopify.*` metafields are Shopify's standard category metafields for the "Books in Media" category.
- `custom.net_quantity` is displayed as **"Book Type"** (paperback or hardcover); its key is misleading.
- Some `custom.isbn_10` and `custom.isbn_13` values are damaged. Do not rely on them.

**Design consequence for Phase 6 (proposed, not yet a decision):** browse by age group, series and author through **collections by handle**, not by parsing `productType` or tags. See `NEXT_TASK.md`.

### Live website, architect's view (7 October 2026, view only)

Recorded in P6-02. Nothing on the live store was changed or read through an API.

- **Book cards** on the website show no author and no star rating. The app's card keeps the approved layout, which includes the author (D-073).
- **Books orderable at zero stock** show a working "Add to Cart" and no "Rented Out" badge on the series page, the same as in-stock books (D-073).
- **Collection pages** open with the "In stock" availability filter already on. Input for the Browse task.
- **Filters:** the live collection pages offer Genre, tag and Service City filters, so these are configured on the live store. The development store has only the default Availability and Price filters (`SHOPIFY_INTEGRATION.md`). The architect mirrors the filter setup in the development store before the Genre filter task.
- **Book page:** it shows "Currently not available as another junior reader is enjoying this book." even for a book that can be ordered at zero stock. The owner knows. The app's book page must not show an unavailable message for a book that can be ordered (R8, D-073).

### Live home page, architect's view (7 October 2026, view only)

Recorded in P6-03 from the architect's reading of justbookify.in's home page. Nothing on the live store was changed or read through an API. The app's Home follows it (D-075).

- **Banner:** headline "Children's books rental in Bengaluru"; line "Now delivering across South India. No subscription. No deposit."; a "Books for Rent" button.
- **Popular series**, in the website's order, as handle and label: `dog-man-series` Dog Man; `wimpy-kid-series` Wimpy Kid; `harry-potter-series` Harry Potter; `tintin-series` Tintin; `captain-underpants-series` Captain Underpants; `peppa-pig-series` Peppa Pig; `disney-series` Disney; `dork-diaries-series` Dork Diaries; `naruto-series` Naruto; `geronimo-stilton` Geronimo Stilton; `ella-dairies` Ella Diaries; `read-it-yourself` Read It Yourself; `demon-slayer-series` Demon Slayer; `famous-five-series` Famous Five; `asterix` Asterix. The row scrolls sideways.
- **The handle `ella-dairies` really is spelled "dairies"** in the store; the label is "Ella Diaries".
- **Browse by age**, in order: `early-readers` Up to 5 years; `emerging-readers` 6-8 years; `junior-readers` 9-10 years; `pre-teen-readers` 11-12 years; `teenage-readers` 13+ years.
- **New arrivals:** the collection `new-arrivals`. On the development store it holds books with stock above 0 (`TESTING.md`, "Sample catalogue (P6-01)").
- **On the development store** only 5 of the 15 series exist (`wimpy-kid-series`, `harry-potter-series`, `tintin-series`, `geronimo-stilton`, `read-it-yourself`), and `tintin-series` is empty (D-076).

### Live "Books for Rent" page, architect's view (7 October 2026, view only)

Recorded in P6-04 from the architect's reading of the website's "Books for Rent" page, `/collections/all`. Nothing on the live store was changed or read through an API. The app's Browse follows it (D-083 to D-086).

- **No real collection behind it:** `/collections/all` is a page Shopify's online store builds from every product; the store has no collection with that handle. The app reads all books with the Storefront API's root `products` query (D-083).
- **Size:** 2,026 products: 993 in stock and 1,033 out of stock.
- **Opens with** the "In stock" availability filter on, sorted "Alphabetically, A-Z".
- **Sort options**, in the website's order and wording: Featured; Most relevant; Best selling; Alphabetically, A-Z; Alphabetically, Z-A; Price, low to high; Price, high to low; Date, old to new; Date, new to old. The app leaves out "Most relevant" and offers "Featured" only inside a group (D-085).
- **Filters offered:** Availability, Price, Genre, "More filters" (tags) and Service City. The app has Age group, Series and "Available now" in P6-04; Genre waits for its own task.

### Live book page, architect's view (8 October 2026, view only)

Recorded in P6-05 from the architect's reading of the live page of `harry-potter-and-the-half-blood-prince-book-6`. Nothing on the live store was changed or read through an API. The app's book page follows it, with the differences in D-090 to D-092.

- **In order:** the author in small capitals; the title; the sentence "Currently not available as another junior reader is enjoying this book."; the retail price struck through and the rental price with a green "Rent" badge; "Shipping calculated at checkout."; "Add to Cart" and "Buy it now"; the description; then "Genre:" with one chip per genre.
- **One image.** No rating, no review section, and no language, publisher, pages, binding or ISBN.
- **The description** is about 750 characters of HTML using `p`, `strong`, `br` and `span`: bold headings ("Perfect for readers, who:", "Why You'll Love It:"), bullet lines starting with "•", and lines starting with the emoji ✅ and ❌.
- **The app differs** (owner and architect, P6-05): it leaves out "Shipping calculated at checkout." and, until Phase 8, the buttons (D-081); it shows the sentence only for a book that cannot be ordered, and the "Rent" badge for a book orderable at zero stock (R8, D-073); it puts a "Rented Out" badge in the price row for a rented-out book (D-090).

## Orders and rentals

- A rental is an order. Staff mark delivery as a fulfilment and pickup as a return. About 2,930 orders are fulfilled and 2,330 are returned.
- Orders carry no tags, metafields or custom attributes.
- Couriers seen on fulfilments: Delhivery (reports a delivered date) and Ekart (does not).
- Stock and returns are tracked only in Shopify.

## Checkout and payment

| Item | Finding |
| --- | --- |
| Checkout | Shopify's own. No third-party checkout app |
| Payment | Razorpay as an offsite provider: UPI, cards, wallets, net banking. PayPal inactive |
| Cash on delivery | One manual method; rare (7 orders in total). The ACOD app adds no fee (corrected 3 October 2026, D-031). It ties the cash-on-delivery shipping rate to the Cash on Delivery payment method and allows cash on delivery only up to a cart total of ₹500 |
| Contact method | Email. Phone number required with the shipping address |
| Shipping | One zone: Karnataka, Andhra Pradesh, Tamil Nadu, Telangana, Kerala. Flat rates: prepaid ₹75, cash on delivery ₹125 |
| Shipping discount | SMART Checkout Rules, automatic: when the cart total is ₹200 or more, a fixed ₹75 comes off shipping, on both rates. Prepaid delivery: ₹75 under ₹200, free from ₹200. Cash on delivery: ₹125 under ₹200, ₹50 from ₹200 |
| Rule: Shipping Restriction (R3) | SMART Checkout Rules validation. Blocks checkout when the postal code does not start with 50, 51, 52, 53, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68 or 69 |
| Rule: Shipping Price Restriction (R2) | SMART Checkout Rules validation. Blocks checkout when the cart subtotal is ₹500 or more. Deliberate |
| Discounts | Influencer codes, a first-order free-shipping code, the automatic shipping discount |
| Marketing opt-in | Email box pre-ticked for India. No WhatsApp consent collected |

The app settings in the rows for cash on delivery, the shipping discount and the two rules were read in the live store's admin by the owner on 3 October 2026 and copied by hand to the development store. Nothing on the live store was changed.

## Returns

The website's Return Request page is a contact form that emails the store. Staff then create the return in Shopify by hand.

## Installed apps (25)

| Group | Apps |
| --- | --- |
| Affect the mobile app | ACOD: COD Fee; SMART Checkout Rules; Account & Checkout by SureCust; Judge.me Reviews; Essential Loyalty; Search & Discovery |
| Operations and messaging | Delhivery; Elite - Ekart Lite; Proship; AiSensy; WhatsApp by Meta; EAZE Button; Messaging by Shopify; Flow; Knowledge Base |
| Custom apps | Zoho CRM Connector; #1hourless Campaign |
| Web marketing only | BixGrow Affiliate; Collabs; 1ClickPopup; Lucky Orange; Ravoo; SweepWidget; POWR Customer Survey; Section Store |

## Automation

Flow has eight workflows, six active: abandoned cart and checkout recovery, a welcome email, a thank-you after purchase, tagging new arrivals for 90 days. None sends rental reminders. Reminders go out automatically through AiSensy to the checkout phone number.
