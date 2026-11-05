// pages/tienda/Carrito.jsx
// Carrito: revisa precios y disponibilidad actuales. Para solicitar hace falta una cuenta.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost, clienteGet, setCustomerCsrfToken } from "../../api/client.js";
import { useCart } from "../../hooks/useCart.js";
import { formatPrice } from "../../utils/format.js";
import { removeFromCart, setCartQuantity, writeCart } from "../../utils/cartStorage.js";

export default function Carrito() {
  const lines = useCart();
  const navigate = useNavigate();
  const [detail, setDetail] = useState({ status: "ready", lines: [], error: "" });
  const [loggedIn, setLoggedIn] = useState(null);
  const [contact, setContact] = useState(null);
  const linesKey = JSON.stringify(lines);

  // Datos actuales de cada pieza (precio, disponibilidad). Se vuelve a pedir si cambia el carrito.
  useEffect(() => {
    let active = true;
    if (lines.length === 0) {
      setDetail({ status: "ready", lines: [], error: "" });
      return undefined;
    }
    setDetail((current) => Object.assign({}, current, { status: "loading" }));
    apiPost("/carrito/resumen", { items: lines })
      .then((data) => { if (active) setDetail({ status: "ready", lines: data.lines, error: "" }); })
      .catch((failure) => { if (active) setDetail({ status: "error", lines: [], error: failure.message }); });
    return () => { active = false; };
  }, [linesKey]);

  useEffect(() => {
    clienteGet("/cuenta/me")
      .then((data) => { setCustomerCsrfToken(data.csrfToken); setLoggedIn(true); })
      .catch(() => setLoggedIn(false));
    apiGet("/contacto/tienda").then(setContact).catch(() => setContact({ email: "", whatsapp: "" }));
  }, []);

  function handleRequest() {
    if (loggedIn) {
      navigate("/solicitud");
    } else {
      setLoggedIn(false);
    }
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
        <h1>Tu carrito</h1>
        <p className="status">Todavía no agregas piezas.</p>
        <Link className="button" to="/catalogo">Ver catálogo</Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1>Tu carrito</h1>
      <p className="status">Se guarda en este navegador. Puedes crear tu cuenta después y seguirá aquí.</p>

      {detail.status === "error" ? <p className="status status--error" role="alert">{detail.error}</p> : null}

      <ul className="cart-lines">
        {detail.lines.map((line) => (
          <li className="cart-line" key={line.productId}>
            <div>
              {line.missing ? (
                <p className="status status--error">Esta pieza ya no está disponible y no se incluirá en la solicitud.</p>
              ) : (
                <>
                  <h2>{line.name}</h2>
                  <p className="status">{line.work} · {line.price === null ? "Precio a consultar" : formatPrice(line.price)}</p>
                </>
              )}
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

      {loggedIn === false ? (
        <div className="cart-login-required" role="status">
          <h2>Para solicitar necesitas una cuenta</h2>
          <p className="status">Tu carrito se conserva. Al iniciar sesión se suma a tu cuenta.</p>
          <div className="form-foot">
            <Link className="button" to="/cuenta/registro">Crear cuenta</Link>
            <Link className="link-button" to="/cuenta/entrar">Ya tengo cuenta</Link>
          </div>
          <p className="status">¿Prefieres no crear cuenta? Puedes consultarnos {contactLine}{contactEmail}.</p>
        </div>
      ) : (
        <button
          className="button"
          type="button"
          onClick={handleRequest}
          disabled={loggedIn === null || priced.length === 0}
        >
          Solicitar piezas
        </button>
      )}
    </section>
  );
}
