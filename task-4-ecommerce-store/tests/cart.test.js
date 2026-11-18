// Run with:  node tests/cart.test.js   (no dependencies needed)
const assert = require("assert");
const C = require("../js/cart.js");

const a = { id: 1, title: "A", price: 10.0, image: "a.png" };
const b = { id: 2, title: "B", price: 0.1, image: "b.png" };

let cart = [];
cart = C.addToCart(cart, a);
cart = C.addToCart(cart, a);
assert.strictEqual(cart.length, 1, "same product merges into one line");
assert.strictEqual(cart[0].qty, 2, "quantity increments");

cart = C.addToCart(cart, b);
assert.strictEqual(C.countItems(cart), 3, "badge count = total units");

cart = C.updateQuantity(cart, 1, -1);
assert.strictEqual(cart.find((i) => i.id === 1).qty, 1, "decrement works");
cart = C.updateQuantity(cart, 1, -1);
assert.ok(!cart.find((i) => i.id === 1), "qty 0 removes the line");

cart = C.removeFromCart(cart, 2);
assert.deepStrictEqual(cart, [], "remove empties cart");
assert.deepStrictEqual(C.calculateTotal([]), { subtotal: 0, shipping: 0, tax: 0, total: 0 }, "empty cart totals zero");

// Under free-shipping threshold: $50 -> ship 9.99, tax 4.00, total 63.99
let t = C.calculateTotal([{ id: 1, price: 25, qty: 2 }]);
assert.deepStrictEqual(t, { subtotal: 50, shipping: 9.99, tax: 4, total: 63.99 });

// At threshold: $100 -> free shipping, tax 8.00, total 108.00
t = C.calculateTotal([{ id: 1, price: 100, qty: 1 }]);
assert.deepStrictEqual(t, { subtotal: 100, shipping: 0, tax: 8, total: 108 });

// Floating-point safety: 3 x 0.1 should be exactly 0.3 subtotal
t = C.calculateTotal([{ id: 2, price: 0.1, qty: 3 }]);
assert.strictEqual(t.subtotal, 0.3);

// Immutability: original cart not mutated
const original = [{ id: 1, price: 5, qty: 1 }];
C.updateQuantity(original, 1, +1);
assert.strictEqual(original[0].qty, 1, "inputs are never mutated");

console.log("All cart tests passed ✅");
