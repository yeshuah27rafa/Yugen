// hooks/useCart.js
// Devuelve las líneas del carrito y se actualiza cuando cambia en cualquier parte de la página.
import { useEffect, useState } from "react";
import { CART_EVENT, readCart } from "../utils/cartStorage.js";

export function useCart() {
  const [lines, setLines] = useState(() => readCart());

  useEffect(() => {
    function refresh() {
      setLines(readCart());
    }
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return lines;
}
