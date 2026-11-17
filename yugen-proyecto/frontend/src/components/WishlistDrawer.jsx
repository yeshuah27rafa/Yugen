import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ProductImage from "./art/ProductImage.jsx";
import { formatPrice } from "../utils/format.js";
import { useWishlist, WISHLIST_OPEN_EVENT } from "./WishlistContext.jsx";

export default function WishlistDrawer() {
  const { items, count, remove, syncError } = useWishlist();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    function show() { previousFocus.current = document.activeElement; setOpen(true); }
    window.addEventListener(WISHLIST_OPEN_EVENT, show);
    return () => window.removeEventListener(WISHLIST_OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 20);
    function onKey(event) {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector(".wishlist-drawer");
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled])')];
      if (!focusable.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prior;
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  if (!open) return null;

  return (
    <div className="cart-drawer-layer wishlist-drawer-layer">
      <button className="cart-drawer-backdrop" type="button" aria-label="Cerrar lista de deseos" onClick={() => setOpen(false)} />
      <aside className="cart-drawer wishlist-drawer" role="dialog" aria-modal="true" aria-labelledby="wishlist-drawer-title">
        <header className="cart-drawer__head">
          <div><p className="micro">Piezas para volver a mirar</p><h2 id="wishlist-drawer-title">Mi lista <span>{count}</span></h2></div>
          <button className="cart-drawer__close" ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Cerrar lista">×</button>
        </header>
        {syncError ? <p className="status status--error wishlist-drawer__error" role="alert">{syncError}</p> : null}
        {items.length === 0 ? (
          <div className="cart-drawer__empty"><span aria-hidden="true">♡</span><h3>Tu lista está empezando.</h3><p>Guarda las piezas que te interesan y vuelve a ellas cuando quieras.</p><Link className="button" to="/catalogo" onClick={() => setOpen(false)}>Explorar catálogo</Link></div>
        ) : (
          <ul className="cart-drawer__lines wishlist-drawer__lines">
            {items.map((item) => (
              <li className="cart-drawer__line" key={item.id}>
                <Link className="cart-drawer__image" to={item.slug ? `/producto/${item.slug}` : "/favoritos"} onClick={() => setOpen(false)}>
                  <ProductImage image={item.mainImage} product={item} />
                </Link>
                <div className="cart-drawer__info">
                  <p className="micro">{item.work?.title || "Archivo Yugen"}</p>
                  <h3><Link to={item.slug ? `/producto/${item.slug}` : "/favoritos"} onClick={() => setOpen(false)}>{item.name}</Link></h3>
                  <p>{formatPrice(item.price)}</p>
                  <button className="link-button link-button--danger" type="button" onClick={() => remove(item.id)}>Quitar de mi lista</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 ? <footer className="cart-drawer__foot"><Link className="button cart-drawer__checkout" to="/favoritos" onClick={() => setOpen(false)}>Ver lista completa</Link><button className="link-button cart-drawer__continue" type="button" onClick={() => setOpen(false)}>Seguir explorando</button></footer> : null}
      </aside>
    </div>
  );
}
