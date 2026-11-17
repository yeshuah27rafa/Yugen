// Botón de la ficha de producto. Las piezas agotadas no se pueden agregar.
import { useState } from "react";
import { Link } from "react-router-dom";
import { addToCart, openCartDrawer } from "../../utils/cartStorage.js";

export default function AddToCartButton({ productId, availability }) {
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const soldOut = availability === "agotado";

  function handleClick() {
    const result = addToCart(productId, 1);
    setMessage(result.ok ? "Pieza agregada a tu carrito." : result.message);
    setAdded(result.ok);
    if (result.ok) openCartDrawer();
  }

  return (
    <div className="add-to-cart">
      <button className="button" type="button" onClick={handleClick} disabled={soldOut}>
        {soldOut ? "Agotado" : "Agregar al carrito"}
      </button>
      {message !== "" ? (
        <div className="add-to-cart__feedback" role="status" aria-live="polite">
          <p className={added ? "status" : "status status--error"}>{message}</p>
          {added ? <Link className="link-button" to="/carrito">Ver carrito →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
