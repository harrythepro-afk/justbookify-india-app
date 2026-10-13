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
- **Most Popular Authors** (architect, 13 October 2026, view only, read for P6-10), in the website's order, as handle and name: `julia-donaldson` Julia Donaldson; `enid-blyton` Enid Blyton; `sudha-murthy` Sudha Murty; `roald-dahl` Roald Dahl; `r-l-stine` R. L. Stine; `david-williams-collection` David Walliams; `rick-riordan` Rick Riordan; `r-k-narayan` R. K. Narayan; `ruskin-bond` Ruskin Bond; `mary-pope-osborne` Mary Pope Osborne; `jeff-kinney` Jeff Kinney; `j-k-rowling` J. K. Rowling. The website shows them as tabs, each tab listing that author's books with a "View all" link. The app shows a row of text tiles like its series row, each opening the author's collection screen (D-114). Two handles differ from the names: `sudha-murthy` (Sudha Murty) and `david-williams-collection` (David Walliams). On the development store 7 of the 12 collections exist (all but `r-l-stine`, `david-williams-collection`, `rick-riordan`, `r-k-narayan` and `mary-pope-osborne`).
- **On the development store** only 5 of the 15 series exist (`wimpy-kid-series`, `harry-potter-series`, `tintin-series`, `geronimo-stilton`, `read-it-yourself`), and `tintin-series` is empty (D-076).

### Live "Books for Rent" page, architect's view (7 October 2026, view only)

Recorded in P6-04 from the architect's reading of the website's "Books for Rent" page, `/collections/all`. Nothing on the live store was changed or read through an API. The app's Browse follows it (D-083 to D-086).

- **No real collection behind it:** `/collections/all` is a page Shopify's online store builds from every product; the store has no collection with that handle. The app reads all books with the Storefront API's root `products` query (D-083).
- **Size:** 2,026 products: 993 in stock and 1,033 out of stock.
- **Opens with** the "In stock" availability filter on, sorted "Alphabetically, A-Z".
- **Sort options**, in the website's order and wording: Featured; Most relevant; Best selling; Alphabetically, A-Z; Alphabetically, Z-A; Price, low to high; Price, high to low; Date, old to new; Date, new to old. The app leaves out "Most relevant" and offers "Featured" only inside a group (D-085).
- **Filters offered:** Availability, Price, Genre, "More filters" (tags) and Service City. The app has Age group, Series and "Available now" in P6-04; Genre waits for its own task.

### Live website filters, architect's view (8 October 2026, view only)

Recorded in P6-07 from the architect's reading of the website's "Books for Rent" page. Nothing on the live store was changed or read through an API. The app's Genre filter follows it (D-101, D-102).

- **Filters offered:** Availability, Price, Genre, "More filters" (tags: about 100 raw tag names) and Service City (one value, `bengaluru`). The app offers Genre only; no tag filter and no Service City; Price is a later task (owner, P6-07).
- **Genre is a category attribute filter:** the page parameter is `filter.v.t.shopify.genre` and each value is a `TaxonomyValue` ID. 20 values.
- **The filter shows Shopify's built-in name, not the store's own genre name, for eight genres.** Book pages show the store's name. Filter name = book page name (`TaxonomyValue`):

  | Filter name | Store's name (book page) | `TaxonomyValue` |
  | --- | --- | --- |
  | Design | Manga | 15730 |
  | Children | Picture Book | 15727 |
  | Drama | Realistic fiction | 15732 |
  | Documentary | non fiction | 15731 |
  | Family | Fairy tale | 15733 |
  | Other | Mythology | 20866 |
  | Literature | Classic Literature | 20858 |
  | Education | activity book | 20852 |

- **The other twelve keep their names:** Action & adventure 15724, Biography 15726, Comics & graphic novels 15728, Crime & mystery 15729, Fantasy 20853, Historical fiction 15739, Horror 20857, Humor & comedy 15741, Religion & spirituality 15749, Sci-fi 20862, Sports 20863, Technology 20864 (0 books).
- **The app always shows the store's own name** (the genre entry's `label`, such as Manga), never Shopify's built-in name (owner, answer 5, P6-07; D-102).
- **No real "all" collection** (P6-04): Storefront filters work only on a collection's products and on search, so Genre across all books needs a collection that holds every book. On the live store that collection (`all-books`) is store addition 4, the owner's decision at the live-store connection (D-100).

### Live website prices, architect's view (9 October 2026, view only)

Recorded in P6-08 from the architect's reading of the website's "Books for Rent" page. Nothing on the live store was changed or read through an API. The app's Price filter follows it (owner and architect, P6-08 answers).

- **The website's Price filter** is two text boxes, From and To, under the line "The highest price is ₹ 99.00". The page parameters are `filter.v.price.gte` and `filter.v.price.lte`, so both ends are inclusive on the website.
- **2,014 books.** Rental prices: ₹34 (298 books), ₹49 (671), ₹74 (680), ₹99 (363).
- **Two outliers**, both owner items for the live store: "Horrible geography - Intrepid Explorer" at ₹0 (rented out) and "Mr Big" at ₹79.
- **The ₹0 book and the app:** the `all-books` collection's rule (price greater than 0, store addition 4) leaves a ₹0 book out of Browse's all books; that is accepted (owner, P6-08). Inside a group that holds it, with "Available now" off, a ₹0 book would show under every price choice, because the app sends a maximum only and Shopify's minimum defaults to 0. It is rented out, so it never shows with "Available now" on. Recorded, not handled in the app (owner, answer 5, P6-08).
- **"Mr Big" at ₹79** shows only under "All prices" in the app, not under "Up to ₹74".
- **The app** offers one choice at a time: "All prices", "Up to ₹34", "Up to ₹49", "Up to ₹74", by the rental price (Shopify's `price`), never the compare-at price (owner and architect, answers 1 and 2, P6-08).

### Live book page, architect's view (8 October 2026, view only)

Recorded in P6-05 from the architect's reading of the live page of `harry-potter-and-the-half-blood-prince-book-6`. Nothing on the live store was changed or read through an API. The app's book page follows it, with the differences in D-090 to D-092.

- **In order:** the author in small capitals; the title; the sentence "Currently not available as another junior reader is enjoying this book."; the retail price struck through and the rental price with a green "Rent" badge; "Shipping calculated at checkout."; "Add to Cart" and "Buy it now"; the description; then "Genre:" with one chip per genre.
- **One image.** No rating, no review section, and no language, publisher, pages, binding or ISBN.
- **The description** is about 750 characters of HTML using `p`, `strong`, `br` and `span`: bold headings ("Perfect for readers, who:", "Why You'll Love It:"), bullet lines starting with "•", and lines starting with the emoji ✅ and ❌.
- **The app differs** (owner and architect, P6-05): it leaves out "Shipping calculated at checkout." and, until Phase 8, the buttons (D-081); it shows the sentence only for a book that cannot be ordered, and the "Rent" badge for a book orderable at zero stock (R8, D-073); it puts a "Rented Out" badge in the price row for a rented-out book (D-090).

### Live search, architect's view (8 October 2026, view only)

Recorded in P6-06 from the architect's reading of justbookify.in's search. Nothing on the live store was changed or read through an API. The app's search follows it, with the differences in D-096 to D-098.

- **The header search form** goes to `/search` with `options[prefix]=last` (partial match on the last word).
- **No suggestions while typing:** the theme's suggestion box is in the page, but its script is not loaded.
- **Results page:** the heading "Search results", a count such as "12 results", the collection page's cards with "Rent" or "Rented Out" badges, blog articles mixed in, 24 per page with page numbers.
- **Sort:** Relevance (the default), Price low to high, Price high to low.
- **Filters:** Availability, Price, Genre, More filters. None is on by default; rented-out books are shown, after the available ones in the two searches read.
- **Authors match as well as titles:** "roald dahl" gave 31 results.
- **No results:** No results found for “zzqxv”. Check the spelling or use a different word or phrase.

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
