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
- Product metafields include genre, service city, publisher, pages, ISBN, language and Judge.me ratings. They are readable by the storefront.
- 169 products hold more than one copy. Some titles exist twice as separate products.
- Some best-sellers are set to keep selling at zero stock and show negative inventory. This is deliberate.
- Some ISBN-13 values and barcodes are stored as `9.78E+12` (spreadsheet damage). Do not rely on barcodes.

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
| Cash on delivery | One manual method; rare (7 orders in total). ACOD app adds its fee and limits |
| Contact method | Email. Phone number required with the shipping address |
| Shipping | One zone: Karnataka, Andhra Pradesh, Tamil Nadu, Telangana, Kerala. Flat rates: prepaid ₹75, cash on delivery ₹125 |
| Free delivery | An automatic shipping discount from SMART Checkout Rules on larger orders |
| Rule: Shipping Restriction | Blocks checkout unless the pincode starts with 50 to 53 or 56 to 69 |
| Rule: Shipping Price Restriction | Blocks checkout when the cart subtotal is ₹500 or more. Deliberate |
| Discounts | Influencer codes, a first-order free-shipping code, the automatic shipping discount |
| Marketing opt-in | Email box pre-ticked for India. No WhatsApp consent collected |

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
