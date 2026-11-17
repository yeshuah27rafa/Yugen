import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiPost } from "../../api/client.js";
import { useCart } from "../../hooks/useCart.js";
import { formatPrice } from "../../utils/format.js";
import ProductImage from "../art/ProductImage.jsx";
import { CART_OPEN_EVENT, removeFromCart, setCartQuantity } from "../../utils/cartStorage.js";

export default function CartDrawer() {
  const lines = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState({ status: "ready", lines: [], error: "" });
  const [retry, setRetry] = useState(0);
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  const linesKey = JSON.stringify(lines);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = useMemo(() => detail.lines.reduce((sum, line) => sum + (!line.missing && line.price !== null ? line.price * line.quantity : 0), 0), [detail.lines]);
  const hasUnpriced = detail.lines.some((line) => !line.missing && line.price === null);

  useEffect(() => {
    function show() {
      previousFocus.current = document.activeElement;
      setOpen(true);
    }
    window.addEventListener(CART_OPEN_EVENT, show);
    return () => window.removeEventListener(CART_OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 20);
    function onKey(event) {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector(".cart-drawer");
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prior;
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      if (previousFocus.current && typeof previousFocus.current.focus === "function") previousFocus.current.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    if (lines.length === 0) {
      setDetail({ status: "ready", lines: [], error: "" });
      return undefined;
    }
    setDetail({ status: "loading", lines: [], error: "" });
    apiPost("/carrito/resumen", { items: lines })
      .then((data) => { if (active) setDetail({ status: "ready", lines: data.lines || [], error: "" }); })
      .catch((failure) => { if (active) setDetail({ status: "error", lines: [], error: failure.message || "No pudimos comprobar el carrito." }); });
    return () => { active = false; };
  }, [open, linesKey, retry]);

  if (!open) return null;

  return (
    <div className="cart-drawer-layer">
      <button className="cart-drawer-backdrop" type="button" aria-label="Cerrar vista rápida del carrito" onClick={() => setOpen(false)} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <header className="cart-drawer__head">
          <div><p className="micro">Tu selección</p><h2 id="cart-drawer-title">Carrito <span>{count}</span></h2></div>
          <button className="cart-drawer__close" ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Cerrar carrito">×</button>
        </header>
        {detail.status === "loading" ? <div className="cart-drawer__state"><p className="status status--loading">Comprobando piezas…</p></div> : null}
        {detail.status === "error" ? (
          <div className="cart-drawer__state"><p className="status status--error" role="alert">{detail.error}</p><button className="btn-ghost" type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div>
        ) : null}
        {detail.status === "ready" && detail.lines.length === 0 ? (
          <div className="cart-drawer__empty"><span aria-hidden="true">✳</span><h3>Aún no hay piezas aquí.</h3><p>Explora el catálogo y guarda las que quieras tener cerca.</p><Link className="button" to="/catalogo" onClick={() => setOpen(false)}>Explorar catálogo</Link></div>
        ) : null}
        {detail.status === "ready" && detail.lines.length > 0 ? (
          <>
            <ul className="cart-drawer__lines">
              {detail.lines.map((line) => (
                <li className="cart-drawer__line" key={line.productId}>
                  <div className="cart-drawer__image"><ProductImage image={line.mainImage} product={{ name: line.name, category: line.category, work: line.work ? { title: line.work } : null }} /></div>
                  <div className="cart-drawer__info">
                    {line.missing ? <>
                      <h3>{line.name || "Pieza del carrito"}</h3>
                      <p className="status status--error">Ya no está disponible. Puedes quitarla del carrito.</p>
                    </> : <>
                      <p className="micro">{line.work || "Yugen"}</p>
                      <h3>{line.slug ? <Link to={`/producto/${line.slug}`} onClick={() => setOpen(false)}>{line.name}</Link> : line.name}</h3>
                      <p>{line.price === null ? "Precio a consultar" : formatPrice(line.price)}</p>
                      {line.price !== null ? <p className="cart-drawer__subtotal">Subtotal: {formatPrice(line.price * line.quantity)}</p> : null}
                      <div className="cart-drawer__qty">
                        <button type="button" aria-label={`Restar una unidad de ${line.name}`} disabled={line.quantity <= 1} onClick={() => setCartQuantity(line.productId, line.quantity - 1)}>−</button>
                        <span>{line.quantity}</span>
                        <button type="button" aria-label={`Sumar una unidad de ${line.name}`} disabled={line.quantity >= 10} onClick={() => setCartQuantity(line.productId, line.quantity + 1)}>+</button>
                      </div>
                    </>}
                    <button className="link-button link-button--danger" type="button" onClick={() => removeFromCart(line.productId)}>Quitar</button>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="cart-drawer__foot">
              <div className="cart-drawer__total"><span>Total de piezas con precio</span><strong>{formatPrice(total)}</strong></div>
              {hasUnpriced ? <p className="status">Algunas piezas se consultan por precio.</p> : null}
              <Link className="button cart-drawer__checkout" to="/carrito" onClick={() => setOpen(false)}>Ver carrito completo</Link>
              <button className="link-button cart-drawer__continue" type="button" onClick={() => setOpen(false)}>Seguir explorando</button>
            </footer>
          </>
        ) : null}
      </aside>
    </div>
  );
}
