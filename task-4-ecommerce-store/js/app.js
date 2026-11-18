/**
 * app.js — UI layer: fetching, rendering, events, persistence.
 * Cart maths lives in cart.js (CartLogic).
 */
(function () {
  "use strict";

  const API_URL = "https://fakestoreapi.com/products";
  const CART_KEY = "shopwave.cart.v1";
  const { addToCart, removeFromCart, updateQuantity, countItems, calculateTotal, FREE_SHIPPING_MIN } = window.CartLogic;

  // ---- State ---------------------------------------------------------------
  const state = {
    products: [],
    category: "all",
    query: "",
    sort: "featured",
    cart: loadCart(),
  };

  // ---- DOM helpers ----------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    grid: $("grid"), status: $("status"), search: $("search"), sort: $("sort"), filters: $("filters"),
    badge: $("cart-badge"), cartBtn: $("cart-btn"), drawer: $("drawer"), overlay: $("overlay"),
    closeCart: $("close-cart"), items: $("cart-items"), shipHint: $("ship-hint"),
    subtotal: $("t-subtotal"), shipping: $("t-shipping"), tax: $("t-tax"), total: $("t-total"),
    checkoutBtn: $("checkout-btn"), clearBtn: $("clear-btn"),
    modal: $("modal"), form: $("checkout-form"), formError: $("form-error"), modalTotal: $("modal-total"),
    cancelCheckout: $("cancel-checkout"), confirmation: $("confirmation"), doneBtn: $("done-btn"),
    toast: $("toast"),
  };

  const money = (n) => "$" + n.toFixed(2);
  /** Escape text before putting it in innerHTML (API data is untrusted). */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---- Persistence ------------------------------------------------------------
  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (_) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (_) { /* storage may be blocked */ }
  }

  // ---- Data -----------------------------------------------------------------
  async function loadProducts() {
    el.status.textContent = "Loading products…";
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      state.products = await res.json();
      el.status.textContent = "";
    } catch (err) {
      console.warn("FakeStoreAPI unreachable, using offline fallback:", err);
      state.products = window.FALLBACK_PRODUCTS;
      el.status.textContent = "Couldn't reach the live API — showing a sample catalogue.";
    }
    renderProducts();
  }

  // ---- Product rendering --------------------------------------------------------
  /** Map UI category buttons to API categories. */
  function matchesCategory(p) {
    switch (state.category) {
      case "all": return true;
      case "clothing": return p.category === "men's clothing" || p.category === "women's clothing";
      default: return p.category === state.category;
    }
  }

  function visibleProducts() {
    const q = state.query.trim().toLowerCase();
    let list = state.products.filter(
      (p) => matchesCategory(p) && (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
    switch (state.sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "rating": list = [...list].sort((a, b) => b.rating.rate - a.rating.rate); break;
    }
    return list;
  }

  function badgesFor(p) {
    const tags = [];
    if (p.rating.rate >= 4.5) tags.push('<span class="tag top">Top Rated</span>');
    if (p.rating.count >= 300) tags.push('<span class="tag best">Best Seller</span>');
    if (p.price < 20) tags.push('<span class="tag hot">Deal</span>');
    return tags.length ? `<div class="badges">${tags.join("")}</div>` : "";
  }

  const prettyCategory = (c) => (c === "jewelery" ? "Jewelry" : c);

  function renderProducts() {
    const list = visibleProducts();
    if (!list.length) {
      el.grid.innerHTML = "";
      el.status.textContent = "No products match your search.";
      return;
    }
    if (el.status.textContent === "No products match your search.") el.status.textContent = "";
    el.grid.innerHTML = list.map((p) => `
      <article class="card">
        ${badgesFor(p)}
        <div class="card-img"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" /></div>
        <div class="card-body">
          <span class="card-cat">${esc(prettyCategory(p.category))}</span>
          <h3 class="card-title" title="${esc(p.title)}">${esc(p.title)}</h3>
          <div class="rating">
            <span class="stars" aria-hidden="true"><span style="width:${(p.rating.rate / 5) * 100}%"></span></span>
            <span>${p.rating.rate.toFixed(1)} (${p.rating.count})</span>
          </div>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            <button class="btn primary sm" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`).join("");
  }

  // ---- Cart rendering --------------------------------------------------------------
  function renderCart() {
    const totals = calculateTotal(state.cart);
    const count = countItems(state.cart);

    // navbar badge
    el.badge.textContent = count;
    el.badge.hidden = count === 0;

    // line items
    if (!state.cart.length) {
      el.items.innerHTML = '<p class="empty">Your cart is empty.<br />Add something you like!</p>';
    } else {
      el.items.innerHTML = state.cart.map((i) => `
        <div class="line">
          <img src="${esc(i.image)}" alt="" />
          <div>
            <p class="line-title">${esc(i.title)}</p>
            <span class="line-price">${money(i.price)} each</span>
            <div class="qty">
              <button data-dec="${i.id}" aria-label="Decrease quantity">−</button>
              <span aria-live="polite">${i.qty}</span>
              <button data-inc="${i.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="line-side">
            <span class="line-total">${money(i.price * i.qty)}</span>
            <button class="remove" data-remove="${i.id}">Remove</button>
          </div>
        </div>`).join("");
    }

    // totals
    el.subtotal.textContent = money(totals.subtotal);
    el.shipping.textContent = totals.shipping === 0 ? (state.cart.length ? "FREE" : money(0)) : money(totals.shipping);
    el.tax.textContent = money(totals.tax);
    el.total.textContent = money(totals.total);

    // free-shipping hint
    if (!state.cart.length) {
      el.shipHint.textContent = "";
    } else if (totals.subtotal >= FREE_SHIPPING_MIN) {
      el.shipHint.textContent = "🎉 You've unlocked free shipping!";
      el.shipHint.className = "ship-hint ok";
    } else {
      el.shipHint.textContent = `Add ${money(FREE_SHIPPING_MIN - totals.subtotal)} more for free shipping.`;
      el.shipHint.className = "ship-hint";
    }

    el.checkoutBtn.disabled = el.clearBtn.disabled = state.cart.length === 0;
  }

  function commitCart(next) {
    state.cart = next;
    saveCart();
    renderCart();
  }

  // ---- Drawer / modal / toast ------------------------------------------------------
  function openDrawer() {
    el.drawer.classList.add("open");
    el.drawer.setAttribute("aria-hidden", "false");
    el.overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    el.drawer.classList.remove("open");
    el.drawer.setAttribute("aria-hidden", "true");
    el.overlay.hidden = true;
    document.body.style.overflow = "";
  }
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 1800);
  }

  function openCheckout() {
    el.form.hidden = false;
    el.confirmation.hidden = true;
    el.formError.textContent = "";
    el.modalTotal.textContent = money(calculateTotal(state.cart).total);
    el.modal.hidden = false;
    el.form.elements.name.focus();
  }
  function closeCheckout() { el.modal.hidden = true; }

  function submitCheckout(e) {
    e.preventDefault();
    const f = el.form.elements;
    [...el.form.querySelectorAll("input")].forEach((i) => i.classList.remove("invalid"));

    const problems = [];
    if (f.name.value.trim().length < 2) problems.push([f.name, "Please enter your full name."]);
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) problems.push([f.email, "Please enter a valid email."]);
    if (f.address.value.trim().length < 5) problems.push([f.address, "Please enter your shipping address."]);
    if (f.card.value.replace(/\s/g, "").length < 12 || !/^[\d\s]+$/.test(f.card.value)) problems.push([f.card, "Enter a valid demo card number (digits only)."]);

    if (problems.length) {
      problems.forEach(([input]) => input.classList.add("invalid"));
      el.formError.textContent = problems[0][1];
      problems[0][0].focus();
      return;
    }

    const { total } = calculateTotal(state.cart);
    $("conf-name").textContent = f.name.value.trim();
    $("conf-email").textContent = f.email.value.trim();
    $("conf-id").textContent = "#SW-" + Date.now().toString(36).toUpperCase();
    $("conf-total").textContent = money(total);

    commitCart([]);           // empty the cart after a successful order
    el.form.reset();
    el.form.hidden = true;
    el.confirmation.hidden = false;
  }

  // ---- Events ------------------------------------------------------------------------
  // Event delegation: one listener per container instead of one per button.
  el.grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const product = state.products.find((p) => p.id === Number(btn.dataset.add));
    if (!product) return;
    commitCart(addToCart(state.cart, product));
    el.badge.classList.remove("bump"); void el.badge.offsetWidth; el.badge.classList.add("bump");
    toast("Added to cart");
  });

  el.items.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.inc) commitCart(updateQuantity(state.cart, Number(t.dataset.inc), +1));
    else if (t.dataset.dec) commitCart(updateQuantity(state.cart, Number(t.dataset.dec), -1));
    else if (t.dataset.remove) commitCart(removeFromCart(state.cart, Number(t.dataset.remove)));
  });

  el.filters.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.category;
    el.filters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderProducts();
  });

  el.search.addEventListener("input", () => { state.query = el.search.value; renderProducts(); });
  el.sort.addEventListener("change", () => { state.sort = el.sort.value; renderProducts(); });

  el.cartBtn.addEventListener("click", openDrawer);
  el.closeCart.addEventListener("click", closeDrawer);
  el.overlay.addEventListener("click", closeDrawer);
  el.clearBtn.addEventListener("click", () => { commitCart([]); });
  el.checkoutBtn.addEventListener("click", () => { closeDrawer(); openCheckout(); });
  el.cancelCheckout.addEventListener("click", closeCheckout);
  el.form.addEventListener("submit", submitCheckout);
  el.doneBtn.addEventListener("click", closeCheckout);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeCheckout(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!el.modal.hidden) closeCheckout(); else closeDrawer();
  });

  // Keep the cart in sync across browser tabs.
  window.addEventListener("storage", (e) => { if (e.key === CART_KEY) { state.cart = loadCart(); renderCart(); } });

  // ---- Boot --------------------------------------------------------------------------
  renderCart();
  loadProducts();
})();
