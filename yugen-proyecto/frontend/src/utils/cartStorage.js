// utils/cartStorage.js
// Carrito del navegador (invitados y cuentas). Guarda solo identificador y cantidad, nunca precios.
// Límites: 20 piezas distintas y 10 unidades por pieza. Cada cambio avisa a los componentes que lo muestran.
const KEY = "yugen_carrito";
const MAX_LINES = 20;
const MAX_QTY = 10;
export const CART_EVENT = "yugen-cart-changed";

// Lee el carrito y descarta cualquier dato corrupto o manipulado sin romper la página.
export function readCart() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (Array.isArray(data) === false) return [];
    return data
      .filter((line) => line && typeof line.productId === "string" && Number.isInteger(line.quantity))
      .filter((line) => line.quantity >= 1 && line.quantity <= MAX_QTY)
      .slice(0, MAX_LINES);
  } catch (error) {
    return [];
  }
}

export function writeCart(lines) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch (error) {
    // Si el almacenamiento no está disponible, el carrito funciona solo durante la visita.
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

// Agrega una pieza. Devuelve { ok, message } para mostrar el resultado al usuario.
export function addToCart(productId, quantity) {
  const lines = readCart();
  const index = lines.findIndex((line) => line.productId === productId);
  if (index === -1) {
    if (lines.length >= MAX_LINES) {
      return { ok: false, message: `Tu carrito puede tener como máximo ${MAX_LINES} piezas distintas.` };
    }
    lines.push({ productId, quantity: Math.min(MAX_QTY, quantity) });
  } else {
    lines[index] = { productId, quantity: Math.min(MAX_QTY, lines[index].quantity + quantity) };
  }
  writeCart(lines);
  return { ok: true, message: "" };
}

export function setCartQuantity(productId, quantity) {
  const safe = Math.max(1, Math.min(MAX_QTY, quantity));
  writeCart(readCart().map((line) => (line.productId === productId ? { productId, quantity: safe } : line)));
}

export function removeFromCart(productId) {
  writeCart(readCart().filter((line) => line.productId !== productId));
}
