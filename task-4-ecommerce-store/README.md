# Shopwave — E-Commerce Storefront

Responsive storefront built with vanilla JavaScript, HTML and CSS Grid. Products come from [FakeStoreAPI](https://fakestoreapi.com/products).

## Features
- Live product data with an offline fallback catalogue
- Product cards with ratings, prices and badges (Top Rated, Best Seller, Deal)
- Category filters (All, Electronics, Jewelry, Clothing), search and sorting
- Slide-out cart drawer with navbar badge; `addToCart()`, `removeFromCart()`, `updateQuantity()`, `calculateTotal()`
- 8% tax, $9.99 shipping (free over $100), cart saved in `localStorage`
- Simulated checkout modal with validation and order confirmation
- Responsive grid, keyboard and screen-reader friendly, HTML-escaped API data

## Structure
```
index.html · css/styles.css
js/cart.js (pure logic) · js/app.js (UI) · js/fallback-products.js
tests/cart.test.js
```

## Run
Open `index.html`, or `python -m http.server 8000`. Tests: `node tests/cart.test.js`.
