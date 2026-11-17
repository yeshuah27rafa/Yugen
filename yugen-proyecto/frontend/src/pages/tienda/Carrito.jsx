// Carrito: revisa precios y disponibilidad actuales. Para solicitar hace falta una cuenta.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost, clienteGet, setCustomerCsrfToken } from "../../api/client.js";
import { useCart } from "../../hooks/useCart.js";
import { formatPrice } from "../../utils/format.js";
import { removeFromCart, setCartQuantity } from "../../utils/cartStorage.js";
import ProductImage from "../../components/art/ProductImage.jsx";
import BackLink from "../../components/layout/BackLink.jsx";

export default function Carrito() {
  const lines = useCart();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(() => ({ status: lines.length ? "loading" : "ready", lines: [], error: "" }));
  const [retryKey, setRetryKey] = useState(0);
  const [loggedIn, setLoggedIn] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [sessionRetry, setSessionRetry] = useState(0);
  const [contact, setContact] = useState(null);
  const linesKey = JSON.stringify(lines);
  const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Datos actuales de cada pieza (precio, disponibilidad). Se vuelve a pedir si cambia el carrito.
  useEffect(() => {
    let active = true;
    if (lines.length === 0) {
      setDetail({ status: "ready", lines: [], error: "" });
      return undefined;
    }
    setDetail({ status: "loading", lines: [], error: "" });
    apiPost("/carrito/resumen", { items: lines })
      .then((data) => { if (active) setDetail({ status: "ready", lines: data.lines, error: "" }); })
      .catch((failure) => { if (active) setDetail({ status: "error", lines: [], error: failure.message }); });
    return () => { active = false; };
  }, [linesKey, retryKey]);

  useEffect(() => {
    let active = true;
    clienteGet("/cuenta/me")
      .then((data) => { if (active) { setCustomerCsrfToken(data.csrfToken); setSessionError(""); setLoggedIn(true); } })
      .catch((failure) => {
        if (!active) return;
        if (failure.status === 401) { setCustomerCsrfToken(""); setLoggedIn(false); }
        else { setSessionError(failure.message || "No pudimos comprobar tu sesión."); setLoggedIn("error"); }
      });
    apiGet("/contacto/tienda").then((data) => { if (active) setContact(data); }).catch(() => { if (active) setContact({ email: "", whatsapp: "" }); });
    return () => { active = false; };
  }, [sessionRetry]);

  function handleRequest() {
    if (loggedIn === true) navigate("/solicitud");
    else if (loggedIn === false) setLoggedIn(false);
  }

  const priced = detail.lines.filter((line) => line.missing === false);
  const total = priced.reduce((sum, line) => (line.price === null ? sum : sum + line.price * line.quantity), 0);
  const hasUnpriced = priced.some((line) => line.price === null);
  const contactLine = contact && contact.whatsapp !== ""
    ? `escríbenos al WhatsApp +507 ${contact.whatsapp}`
    : "escríbenos desde la página de contacto";
  const contactEmail = contact && contact.email !== "" ? ` o al correo ${contact.email}` : "";

  if (lines.length === 0) {
    return (
      <section className="cart-page">
        <BackLink to="/catalogo">Seguir explorando</BackLink>
        <p className="micro">Tu selección</p>
        <h1>Tu carrito está vacío</h1>
        <p className="status">Todavía no agregas piezas. Explora el catálogo y guarda aquí las que te interesan.</p>
        <Link className="button" to="/catalogo">Ver catálogo</Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <BackLink to="/catalogo">Seguir explorando</BackLink>
      <p className="micro">Tu selección · {totalUnits} {totalUnits === 1 ? "pieza" : "piezas"}</p>
      <h1>Tu carrito</h1>
      <p className="status">Se guarda en este navegador. Puedes crear tu cuenta después y seguirá aquí.</p>

      {detail.status === "loading" ? <p className="status status--loading" role="status">Comprobando precios y disponibilidad…</p> : null}
      {detail.status === "error" ? (
        <div className="cart-error" role="alert">
          <p className="status status--error">No pudimos actualizar los datos del carrito. {detail.error}</p>
          <button className="btn-ghost" type="button" onClick={() => setRetryKey((value) => value + 1)}>Reintentar</button>
        </div>
      ) : null}

      {detail.status === "ready" ? (
        <>
          <ul className="cart-lines">
            {detail.lines.map((line) => (
              <li className="cart-line" key={line.productId}>
                <div className="cart-line__product">
                  <div className="cart-line__image">
                    <ProductImage image={line.mainImage} product={{ name: line.name, work: line.work ? { title: line.work } : null }} />
                  </div>
                  <div className="cart-line__description">
                    {line.missing ? (
                      <p className="status status--error">Esta pieza ya no está disponible y no se incluirá en la solicitud.</p>
                    ) : (
                      <>
                        <p className="micro">{line.work || "Yugen"}</p>
                        <h2>{line.slug ? <Link to={`/producto/${line.slug}`}>{line.name}</Link> : line.name}</h2>
                        <p className="status">{line.price === null ? "Precio a consultar" : formatPrice(line.price)}</p>
                        {line.price !== null ? <p className="cart-line__subtotal">Subtotal: <strong>{formatPrice(line.price * line.quantity)}</strong></p> : null}
                      </>
                    )}
                  </div>
                </div>
                <div className="cart-line__actions">
                  {line.missing ? null : (
                    <label className="field">
                      Cantidad
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={line.quantity}
                        aria-label={`Cantidad de ${line.name}`}
                        onChange={(event) => setCartQuantity(line.productId, Number(event.target.value))}
                      />
                    </label>
                  )}
                  <button className="link-button link-button--danger" type="button" onClick={() => removeFromCart(line.productId)}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-summary">
            <p>Total de piezas con precio: <strong>{formatPrice(total)}</strong></p>
            {hasUnpriced ? <p className="status">Algunas piezas se consultan por precio y no suman al total.</p> : null}
            <p className="status">El pago es contra entrega o al retirar, según lo coordinemos.</p>
          </div>
        </>
      ) : null}

      {loggedIn === "error" ? (
        <div className="cart-login-required" role="alert">
          <h2>No pudimos comprobar tu sesión</h2>
          <p className="status status--error">{sessionError}</p>
          <button className="btn-ghost" type="button" onClick={() => { setLoggedIn(null); setSessionRetry((value) => value + 1); }}>Reintentar</button>
        </div>
      ) : null}

      {loggedIn === false ? (
        <div className="cart-login-required" role="status">
          <h2>Para solicitar necesitas una cuenta</h2>
          <p className="status">Tu carrito se conserva. Al iniciar sesión se suma a tu cuenta.</p>
          <div className="form-foot">
            <Link className="button" to="/cuenta/registro" state={{ from: { pathname: "/carrito" } }}>Crear cuenta</Link>
            <Link className="link-button" to="/cuenta/entrar" state={{ from: { pathname: "/carrito" } }}>Ya tengo cuenta</Link>
          </div>
          <p className="status">¿Prefieres no crear cuenta? Puedes consultarnos {contactLine}{contactEmail}.</p>
        </div>
      ) : loggedIn === true ? (
        <button
          className="button"
          type="button"
          onClick={handleRequest}
          disabled={detail.status !== "ready" || priced.length === 0}
        >
          Solicitar piezas
        </button>
      ) : loggedIn === null ? <p className="status status--loading" role="status">Comprobando tu cuenta…</p> : null}
    </section>
  );
}
