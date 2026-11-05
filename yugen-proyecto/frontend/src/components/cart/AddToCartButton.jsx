// components/cart/AddToCartButton.jsx
// Botón de la ficha de producto. Las piezas agotadas no se pueden agregar.
import { useState } from "react";
import { addToCart } from "../../utils/cartStorage.js";

export default function AddToCartButton({ productId, availability }) {
  const [message, setMessage] = useState("");
  const soldOut = availability === "agotado";

  function handleClick() {
    const result = addToCart(productId, 1);
    setMessage(result.ok ? "Agregado a tu carrito." : result.message);
  }

  return (
    <div className="add-to-cart">
      <button className="button" type="button" onClick={handleClick} disabled={soldOut}>
        {soldOut ? "Agotado" : "Agregar al carrito"}
      </button>
      <p className="status" role="status">{message}</p>
    </div>
  );
}
