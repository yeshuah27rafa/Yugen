// pages/tienda/Solicitud.jsx
// Formulario de solicitud. Requiere sesión de cliente. WhatsApp obligatorio, o correo si no hay WhatsApp.
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { clientePost, clienteGet, setCustomerCsrfToken } from "../../api/client.js";
import { useCart } from "../../hooks/useCart.js";
import { writeCart } from "../../utils/cartStorage.js";
import BackLink from "../../components/layout/BackLink.jsx";
import ProductImage from "../../components/art/ProductImage.jsx";
import { formatPrice } from "../../utils/format.js";

export default function Solicitud() {
  const lines = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [useEmail, setUseEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [sessionRetry, setSessionRetry] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    clienteGet("/cuenta/me")
      .then((data) => { if (!active) return; setCustomerCsrfToken(data.csrfToken); setSessionError(""); setChecking(false); })
      .catch((failure) => {
        if (!active) return;
        if (failure.status === 401) {
          setCustomerCsrfToken("");
          navigate("/cuenta/entrar", {
            replace: true,
            state: { from: { pathname: location.pathname, search: location.search, hash: location.hash }, message: "Inicia sesión para enviar tu solicitud." }
          });
        } else {
          setSessionError(failure.message || "No pudimos comprobar tu sesión.");
          setChecking(false);
        }
      });
    return () => { active = false; };
  }, [navigate, location.pathname, location.search, location.hash, sessionRetry]);

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const response = await clientePost("/solicitudes", {
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        deliveryMethod: data.get("deliveryMethod"),
        whatsapp: String(data.get("whatsapp") || ""),
        useEmailOnly: useEmail,
        contactEmail: String(data.get("contactEmail") || ""),
        comment: String(data.get("comment") || "")
      });
      writeCart([]);
      let requestDetail = null;
      try { requestDetail = await clienteGet(`/cuenta/solicitudes/${encodeURIComponent(response.code)}`); } catch { /* La confirmación conserva el código aunque el detalle tarde en estar disponible. */ }
      setResult({ ...response, request: requestDetail });
    } catch (failure) {
      if (failure.status === 401) {
        setCustomerCsrfToken("");
        navigate("/cuenta/entrar", {
          replace: true,
          state: { from: { pathname: location.pathname, search: location.search, hash: location.hash }, message: "Tu sesión ya no está activa. Inicia sesión para enviar la solicitud." }
        });
      } else setError(failure.message || "No pudimos enviar tu solicitud.");
    } finally {
      setSending(false);
    }
  }

  if (checking) return <section className="cart-page"><p className="status status--loading" role="status">Comprobando tu sesión…</p></section>;

  if (sessionError) return <section className="cart-page"><BackLink to="/carrito">Volver al carrito</BackLink><h1>No pudimos comprobar tu sesión</h1><p className="status status--error" role="alert">{sessionError}</p><button className="button" type="button" onClick={() => { setChecking(true); setSessionError(""); setSessionRetry((value) => value + 1); }}>Reintentar</button></section>;

  if (result !== null) {
    const request = result.request;
    const total = request?.items?.reduce((sum, item) => sum + (item.price === null ? 0 : item.price * item.quantity), 0) || 0;
    const delivery = { retiro: "Retiro personal", entrega_personal: "Entrega personal", envio_nacional: "Envío nacional en Panamá" };
    return (
      <section className="cart-page request-confirmation">
        <div className="request-confirmation__intro"><p className="micro">YUGEN / CONFIRMACIÓN DE RECEPCIÓN</p><span className="request-confirmation__seal" aria-hidden="true">幽玄</span><p className="request-confirmation__eyebrow" role="status">Solicitud recibida correctamente</p><h1>Tu selección<br/><em>ya está con nosotros.</em></h1><p>Recibimos tu solicitud y quedó registrada para revisión. Aún no representa un pago ni una confirmación de entrega; nos pondremos en contacto contigo para coordinar los siguientes pasos.</p></div>
        <div className="request-confirmation__code"><div><small>Código de seguimiento</small><strong>{result.code}</strong></div><span>Conserva este código para consultar tu solicitud.</span></div>
        {request ? <section className="request-confirmation__summary"><header><div><p className="micro">Tu selección</p><h2>Lo que nos compartiste.</h2></div><span>{request.items.length} {request.items.length === 1 ? "pieza" : "piezas"}</span></header><ul>{request.items.map((item, index) => <li key={`${item.name}-${index}`}><div className="request-confirmation__image">{item.image?.url ? <ProductImage image={item.image} product={{ name: item.name }} /> : <span aria-hidden="true">幽玄</span>}</div><div><strong>{item.name}</strong><small>{item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}</small></div><b>{item.price === null ? "A consultar" : formatPrice(item.price * item.quantity)}</b></li>)}</ul><div className="request-confirmation__total"><span>Total de piezas con precio</span><strong>{formatPrice(total)}</strong></div><div className="request-confirmation__delivery"><span>Forma de entrega indicada</span><strong>{delivery[request.deliveryMethod] || request.deliveryMethod}</strong></div></section> : <p className="status">Tu resumen estará disponible desde el seguimiento de la cuenta.</p>}
        <section className="request-confirmation__next"><p className="micro">Qué sigue</p><ol><li><span>01</span><div><strong>Revisaremos tu solicitud.</strong><p>Comprobaremos las piezas y la disponibilidad.</p></div></li><li><span>02</span><div><strong>Te contactaremos.</strong><p>Coordinaremos contigo el pago y la entrega.</p></div></li><li><span>03</span><div><strong>Podrás seguir el estado.</strong><p>Tu cuenta conserva el código y los cambios de la solicitud.</p></div></li></ol></section>
        <div className="request-confirmation__actions"><Link className="button" to={`/cuenta/solicitudes/${result.code}`}>Ver seguimiento</Link><Link className="text-link" to="/catalogo">Seguir explorando</Link></div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="cart-page">
        <h1>Solicitud</h1>
        <p className="status">Tu carrito está vacío.</p>
        <Link className="button" to="/catalogo">Ver catálogo</Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <BackLink to="/carrito">Volver al carrito</BackLink>
      <h1>Solicitud</h1>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">
          Número de WhatsApp (8 dígitos, con o sin 507)
          <input name="whatsapp" inputMode="tel" disabled={useEmail} required={useEmail === false} autoComplete="tel" />
        </label>
        <label className="field field--check">
          <input type="checkbox" checked={useEmail} onChange={(event) => setUseEmail(event.target.checked)} />
          No tengo WhatsApp: usaré otro correo para coordinar.
        </label>
        {useEmail ? (
          <label className="field">
            Correo de contacto
            <input name="contactEmail" type="email" required autoComplete="email" maxLength="254" />
          </label>
        ) : null}
        <label className="field">
          Forma de entrega
          <select name="deliveryMethod" required defaultValue="retiro">
            <option value="retiro">Retiro personal</option>
            <option value="entrega_personal">Entrega personal</option>
            <option value="envio_nacional">Envío nacional en Panamá</option>
          </select>
        </label>
        <label className="field">
          Comentario (opcional, máximo 500 caracteres)
          <textarea name="comment" rows="3" maxLength="500" />
        </label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>{sending ? "Enviando…" : "Enviar solicitud"}</button>
        </div>
        <p className="status status--error" role="alert">{error}</p>
      </form>
    </section>
  );
}
