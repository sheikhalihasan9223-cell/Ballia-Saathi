// Simple cart state management using localStorage
const CART_KEY = 'zappr_cart';

export function getCart() {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
}

export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.product_id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
      unit: product.unit,
      quantity: 1,
    });
  }
  saveCart(cart);
}

export function removeFromCart(productId) {
  const cart = getCart().filter(item => item.product_id !== productId);
  saveCart(cart);
}

export function updateQuantity(productId, quantity) {
  const cart = getCart();
  if (quantity <= 0) {
    saveCart(cart.filter(item => item.product_id !== productId));
    return;
  }
  const item = cart.find(item => item.product_id === productId);
  if (item) {
    item.quantity = quantity;
  }
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}