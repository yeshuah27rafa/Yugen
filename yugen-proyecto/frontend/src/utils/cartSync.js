// utils/cartSync.js
// Al iniciar sesión, suma el carrito del navegador al de la cuenta. Si falla, el carrito local se conserva.
import { clientePost } from "../api/client.js";
import { readCart, writeCart } from "./cartStorage.js";

export async function syncCartAfterLogin() {
  const local = readCart();
  try {
    const response = await clientePost("/carrito/fusionar", { items: local });
    writeCart(response.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })));
  } catch (error) {
    // Sin conexión o sin sesión válida: el carrito del navegador sigue disponible.
  }
}
