# Store UX, page by page

Shoppers decide fast and leave faster. Every page removes one doubt and makes the next step obvious: find the product, believe it's right, know what it costs and when it arrives, buy without friction. Combine this with the shared design language; stores lean on product photography, clear prices and calm, consistent controls.

## Contents
1. Global elements
2. Home
3. Category pages (product listing)
4. Product page
5. Cart
6. Checkout
7. Order confirmation and post-purchase
8. Account and the withdrawal function
9. Search
10. Wishlist, reviews and recommendations
11. Promotions and pricing display
12. Mobile
13. Accessibility specifics
14. Checklist

## 1. Global elements

- **USP bar** (top or under the header): the three reasons to buy here (free shipping from €X, free returns within 30 days, delivered tomorrow when ordered before 22:00). Only true, specific promises. It must not shift the layout or animate endlessly.
- **Header:** logo, category navigation (at most about 7 top-level items; a mega menu with images for large catalogues), a prominent search field (a pill on desktop, an icon that expands on mobile), account, wishlist, and a cart with a live count.
- **Footer:** customer service (shipping, returns, withdrawal function, FAQ, contact), payment methods, company details, legal links, newsletter.
- **Trust everywhere:** secure payment marks, the returns promise, real contact options, reviews.

## 2. Home

Job: show what the store is about and route people into the catalogue fast.
- Hero: a seasonal collection or flagship product with one clear CTA ("Shop the linen edit"); never an autoplaying slider.
- Category entry points: image cards or chips directly under the hero.
- Product rails: best-sellers, new arrivals, staff picks (horizontal scroll-snap on mobile with the next card peeking).
- Social proof: rating summary, review quotes, customer photos.
- Story: what makes the brand different (materials, sourcing, craft), with real photography.
- Newsletter with a concrete incentive and promise of frequency.

## 3. Category pages (product listing)

- **Header block:** H1 (the category's keyword), a short intro (expandable if long), subcategory chips.
- **Controls:** product count, sort (featured, newest, price low/high, best rated), filters. Desktop: a sidebar with collapsible groups and counts. Mobile: a "Filters" button opening a full-height sheet with "Show 48 products" as its apply button. Applied filters appear as removable chips with "Clear all".
- **Product card:** image (second image on hover for desktop), name, price including VAT (sale price + prior price when discounted), color swatches with names, rating with count, honest badges (New, Sale, Low stock if true), wishlist heart, quick add for simple products. The whole card is one link (single anchor stretched over the card) with separate buttons for heart and quick add.
- **Grid:** two columns on mobile, 3–4 at 1440px and more on wider screens (the grid spans the full width; no centred container); consistent aspect ratio; no layout shift while images load.
- **Pagination:** "Load more" with real paginated links underneath, or numbered pages; keep scroll position when returning from a product.
- **Empty state:** "No products match these filters" with one-click removal of the last filter.

## 4. Product page

The page that sells. Above the fold on mobile: image, name, price, rating, variant choice, add to cart.
- **Gallery:** swipeable on mobile (with a peek or dots), thumbnails and click-to-zoom on desktop, variant-specific images, optional short video (poster first). Images in a consistent aspect ratio.
- **Buy box:** brand/name (H1), price (+ prior price and saving when discounted), rating summary linking to reviews, variant selectors (color swatches with visible names, size buttons showing availability, size guide link), quantity, **Add to cart** (full width on mobile; a sticky bar once the buy box scrolls away), wishlist.
- **Reassurance right under the button:** delivery estimate ("Delivered Thursday" only when it's reliable), shipping cost or free-shipping threshold, returns promise, payment methods.
- **Details:** short benefit-led description first, then accordions for description, materials and care, specifications (a real table), size and fit, shipping and returns, product safety information.
- **Reviews:** summary with distribution, filters (rating, with photos), verified-purchase labels, newest/most helpful sort, a note on how reviews are verified.
- **Cross-sell:** "Complete the look" or "Often bought together" (one rail), plus recently viewed. Keep it below the buy box, never between image and price.
- **Out of stock:** clear status, back-in-stock email signup, alternatives in the same category.
- **Context without a trail:** no breadcrumb trail above the title. The header highlights the active category, the category is a link in the details ("Part of: Trail running"), and a rail offers more from it ("More trail running shoes"). Returning to the category keeps the scroll position.

## 5. Cart

- **Drawer on add:** slides in, focus moves into it, shows the added item with variant, subtotal, a free-shipping progress bar, one relevant upsell at most, "Checkout" (primary) and "View cart" (secondary). Escape and outside click close it; focus returns to the button.
- **Cart page:** editable quantities, remove (with undo), estimated shipping and delivery, discount code field (collapsed behind a link so it doesn't send people hunting for codes), totals including VAT, express checkout buttons, returns promise, continue shopping.
- **Persisting:** the cart survives reloads and returns visits.

## 6. Checkout

Hosted checkouts handle most of this; brand them and make the hand-off seamless. For custom checkouts:
- Guest checkout by default; account creation offered afterwards.
- Express wallets at the top (Apple Pay, Google Pay, PayPal).
- Minimal fields, address autocomplete, correct `autocomplete` attributes, inline validation.
- Order summary always visible (collapsible on mobile) with item images, shipping, VAT and total.
- No surprises: costs known before the payment step; the final button says the order is binding and paid ("Order and pay").
- Errors keep everything the shopper typed and say exactly what to fix.

## 7. Order confirmation and post-purchase

- Confirmation page: order number, items, delivery estimate, what happens next, contact options; offer a passwordless account to track the order.
- Emails: confirmation (with withdrawal information and the link to the withdrawal function), shipped (tracking), delivered, review request a few days later.
- Returns: a simple self-service returns flow or clear instructions.

## 8. Account and the withdrawal function

- Orders with status and tracking, invoices, addresses, saved payment methods (stored at the payment provider), wishlist, preferences, data export/deletion. Use ngd-panel patterns for the logged-in area (skeletons, lazy data, `noindex`).
- **Withdrawal function (EU, required since 19 June 2026):** on each order within its withdrawal period, a clearly labelled "Withdraw from contract here" action; a public page for guests (order number + email) linked in the footer and confirmation email; a short confirmation form and a "Confirm withdrawal" button; an immediate acknowledgement email with date and time.

## 9. Search

- Suggestions after two characters: products (with image and price), categories and popular queries.
- Results page with the same filters and sorting as category pages.
- No results: show spelling suggestions, popular categories and best-sellers, plus a contact option.
- Keyboard accessible (combobox pattern), Escape clears, recent searches optional.

## 10. Wishlist, reviews and recommendations

- **Wishlist:** works without an account (stored locally) and merges into the account on login; a heart on cards and product pages with a clear toggled state.
- **Reviews:** collect after delivery; allow photos; show negative reviews with responses (it builds trust); never filter out honest criticism.
- **Recommendations:** few and relevant; label why ("Often bought together").

## 11. Promotions and pricing display

- Sale prices show the prior price (lowest of the previous 30 days) and the saving calculated from it (EU rule).
- Countdown timers only for real deadlines; banners are dismissible and never push content down after load.
- Discount code fields are collapsed by default.
- Gift cards and loyalty programmes only if the platform supports them properly.

## 12. Mobile

- Thumb-friendly: a sticky add-to-cart bar on product pages, full-width primary buttons, bottom sheets for filters and variant pickers.
- Fast image swiping with preloaded neighbours (not the whole gallery).
- Apple Pay and Google Pay prominently; keyboard types and autofill on every field.
- Tap targets at least 44px; no hover-dependent features.

## 13. Accessibility specifics

- Variant selectors are radio groups with visible text labels (color names, not just swatches); unavailable options are announced as such.
- Cart updates are announced in a polite live region; drawers and sheets manage focus and close with Escape.
- Product images have alt text naming the product, variant and angle; zoom works with the keyboard.
- Prices are read correctly (no visually split digits); sale and original prices are labelled for screen readers ("Original price", "Sale price").
- Filters are buttons and checkboxes with accessible names; results count changes are announced.

## 14. Checklist

- [ ] From any page, a shopper reaches a product in two clicks and the cart in one.
- [ ] Product pages show price incl. VAT, delivery estimate/costs, returns promise and payment methods near the add-to-cart button.
- [ ] Discounts show the 30-day prior price.
- [ ] Filters work on mobile in a sheet and as removable chips; empty states help.
- [ ] Add to cart gives immediate feedback (drawer + live count + announcement).
- [ ] Checkout tested in test mode: success, failure, cancellation.
- [ ] Withdrawal function and returns information reachable from footer, account and confirmation email (EU).
- [ ] All the above works at 390px with one thumb.
