# Analytics

Tool: Google Analytics for Firebase. No advertising SDKs in version 1.

## Rules

- Snake case event names. IDs, never titles or free text.
- No names, emails, phone numbers, addresses or anything about a child.
- Search terms are measured by length, not content.
- The analytics user ID is a random ID or a one-way hash, never the email.
- Analytics starts only after consent where the law or the store's privacy policy requires it.
- Crash reports (Sentry) follow the same rules; the scrubbing is described in `SECURITY.md` and D-042.

## Events (first version)

| Event | Fires when | Parameters |
| --- | --- | --- |
| app_open | App comes to the foreground | source |
| sign_up | First successful login for a new customer | none |
| login | Login succeeds | none |
| logout | Customer logs out | none |
| search | Results shown | term_length, result_count |
| filter_applied | A filter changes | filter_type, value |
| view_collection | Collection opens | collection_id |
| view_book | Book detail opens | product_id, available |
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
