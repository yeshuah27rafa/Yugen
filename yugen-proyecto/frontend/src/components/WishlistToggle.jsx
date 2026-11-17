import { useState } from "react";
import { useWishlist } from "./WishlistContext.jsx";

export default function WishlistToggle({ product, variant = "floating", className = "" }) {
  const { isSaved, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saved = isSaved(product?._id || product?.id);

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await toggle(product);
    if (result?.ok === false) setError(result.message || "No pudimos guardar esta pieza.");
    setBusy(false);
  }

  const label = saved ? "Quitar de favoritos" : "Guardar en favoritos";
  return (
    <>
    <button
      type="button"
      className={`wishlist-toggle wishlist-toggle--${variant}${saved ? " is-saved" : ""}${className ? ` ${className}` : ""}`}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      disabled={busy}
      onClick={handleClick}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      {variant === "inline" ? <span>{saved ? "Guardado en mi lista" : "Guardar en mi lista de deseos"}</span> : null}
    </button>
    {error ? <span className="wishlist-toggle__error" role="alert">{error}</span> : null}
    </>
  );
}
