/**
 * cart.js — pure cart logic (no DOM access), so it can be unit-tested in Node.
 *
 * A cart is an array of line items: { id, title, price, image, qty }
 * Every function returns a NEW array (immutable updates) which makes
 * state management predictable and easy to persist.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CartLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // ---- Pricing rules ------------------------------------------------------
  const TAX_RATE = 0.08;            // 8% sales tax
  const FREE_SHIPPING_MIN = 100;    // subtotal at/above this ships free
  const SHIPPING_FLAT = 9.99;       // otherwise flat-rate shipping

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  /** Add a product (or increase its quantity if already in the cart). */
  function addToCart(cart, product, qty = 1) {
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      return cart.map((i) =>
        i.id === product.id ? { ...i, qty: i.qty + qty } : i
      );
    }
    return [
      ...cart,
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        qty,
      },
    ];
  }

  /** Remove a line item completely. */
  function removeFromCart(cart, id) {
    return cart.filter((i) => i.id !== id);
  }

  /**
   * Change quantity by `delta` (+1 / -1).
   * If the resulting quantity is 0 or less, the item is removed.
   */
  function updateQuantity(cart, id, delta) {
    return cart
      .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
      .filter((i) => i.qty > 0);
  }

  /** Total number of units in the cart (used for the navbar badge). */
  function countItems(cart) {
    return cart.reduce((sum, i) => sum + i.qty, 0);
  }

  /** Subtotal, shipping, tax and grand total — all rounded to cents. */
  function calculateTotal(cart) {
    const subtotal = round2(cart.reduce((s, i) => s + i.price * i.qty, 0));
    const shipping =
      cart.length === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
    const tax = round2(subtotal * TAX_RATE);
    const total = round2(subtotal + shipping + tax);
    return { subtotal, shipping, tax, total };
  }

  return {
    TAX_RATE,
    FREE_SHIPPING_MIN,
    SHIPPING_FLAT,
    addToCart,
    removeFromCart,
    updateQuantity,
    countItems,
    calculateTotal,
  };
});
