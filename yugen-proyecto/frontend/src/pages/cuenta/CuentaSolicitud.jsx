// Detalle de una solicitud propia: carga protegida, historial, contacto y cancelación.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiGet, clienteGet, clientePost, setCustomerCsrfToken } from "../../api/client.js";
import { formatPrice } from "../../utils/format.js";
import BackLink from "../../components/layout/BackLink.jsx";
import ProductImage from "../../components/art/ProductImage.jsx";
import { buildRequestJourney, getCurrentHistoryIndex } from "../../utils/requestJourney.js";

const STATUS_LABEL = { nueva: "En revisión", aprobada: "Aprobada", en_proceso: "En coordinación", completada: "Completada", rechazada: "No aprobada", cancelada: "Cancelada", contactado: "Yugen se puso en contacto contigo" };
const STATUS_CLASS = { nueva: "nueva", aprobada: "aprobada", en_proceso: "aprobada", completada: "completada", rechazada: "rechazada", cancelada: "cancelada" };
const DELIVERY_LABEL = { retiro: "Retiro personal", entrega_personal: "Entrega personal", envio_nacional: "Envío nacional en Panamá" };

export default function CuentaSolicitud() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", request: null, error: "" });
  const [shop, setShop] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const session = await clienteGet("/cuenta/me");
        setCustomerCsrfToken(session.csrfToken);
        const request = await clienteGet(`/cuenta/solicitudes/${encodeURIComponent(code)}`);
        if (active) setState({ status: "ready", request, error: "" });
      } catch (failure) {
        if (!active) return;
        if (failure.status === 401) {
          setCustomerCsrfToken("");
          navigate("/cuenta/entrar", {
            replace: true,
            state: { from: { pathname: location.pathname, search: location.search, hash: location.hash }, message: "Inicia sesión para consultar esta solicitud." }
          });
          return;
        }
        setState({ status: "error", request: null, error: failure.message || "No pudimos cargar esta solicitud." });
      }
    }
    load();
    return () => { active = false; };
  }, [code, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    let active = true;
    apiGet("/contacto/tienda").then((data) => { if (active) setShop(data); }).catch(() => { if (active) setShop({ email: "", whatsapp: "" }); });
    return () => { active = false; };
  }, []);

  // Mantiene el seguimiento al día mientras la solicitud sigue abierta, sin exigir recargar la página.
  useEffect(() => {
    if (state.status !== "ready" || !["nueva", "aprobada", "en_proceso"].includes(state.request?.status)) return undefined;
    const timer = window.setInterval(() => {
      clienteGet(`/cuenta/solicitudes/${encodeURIComponent(code)}`)
        .then((fresh) => setState((current) => current.status === "ready" ? { ...current, request: fresh } : current))
        .catch(() => {});
    }, 30000);
    return () => window.clearInterval(timer);
  }, [code, state.status, state.request?.status]);

  async function handleCancel() {
    if (window.confirm("¿Cancelar esta solicitud?") === false) return;
    setCanceling(true);
    setCancelError("");
    try {
      const session = await clienteGet("/cuenta/me");
      setCustomerCsrfToken(session.csrfToken);
      const updated = await clientePost(`/cuenta/solicitudes/${encodeURIComponent(code)}/cancelar`, {});
      setState((current) => current.status === "ready" ? { ...current, request: { ...current.request, ...updated } } : current);
      // El detalle se vuelve a consultar para mostrar el historial canónico guardado por el servidor.
      const refreshed = await clienteGet(`/cuenta/solicitudes/${encodeURIComponent(code)}`);
      setState({ status: "ready", request: refreshed, error: "" });
    } catch (failure) {
      if (failure.status === 401) {
        setCustomerCsrfToken("");
        navigate("/cuenta/entrar", { replace: true, state: { from: { pathname: location.pathname, search: location.search, hash: location.hash }, message: "Tu sesión ya no está activa. Vuelve a entrar para continuar." } });
      } else setCancelError(failure.message || "No pudimos cancelar la solicitud.");
    } finally {
      setCanceling(false);
    }
  }

  if (state.status === "loading") return <section className="cuenta-page"><BackLink to="/cuenta/solicitudes">Volver a mis solicitudes</BackLink><p className="status status--loading">Comprobando tu cuenta…</p></section>;
  if (state.status === "error") return <section className="cuenta-page"><BackLink to="/cuenta/solicitudes">Volver a mis solicitudes</BackLink><h1>Solicitud no disponible</h1><p className="status status--error" role="alert">{state.error}</p><Link className="button" to="/cuenta/solicitudes">Ver mis solicitudes</Link></section>;

  const request = state.request;
  const text = `Hola, escribo sobre mi solicitud ${request.code} en Yugen.`;
  const whatsappDigits = shop && shop.whatsapp ? String(shop.whatsapp).replace(/\D/g, "").replace(/^507/, "") : "";
  const whatsappUrl = whatsappDigits ? `https://wa.me/507${whatsappDigits}?text=${encodeURIComponent(text)}` : null;
  const total = request.items.reduce((sum, item) => sum + (item.price == null ? 0 : Number(item.price) * Number(item.quantity || 1)), 0);
  const units = request.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const journey = buildRequestJourney(request);
  const currentHistoryIndex = getCurrentHistoryIndex(request.history, request.status);

  return (
    <section className="cuenta-page cuenta-page--request-detail">
      <BackLink to="/cuenta/solicitudes">Volver a mis solicitudes</BackLink>
      <header className="request-detail-head request-detail-head--editorial">
        <div><p className="micro">Archivo de solicitud · {new Date(request.createdAt).toLocaleDateString()}</p><h1>{request.code}</h1><p className="request-detail-head__lead">Conservamos aquí los detalles de tu selección y los cambios que ocurran durante la coordinación.</p></div>
        <div className="request-detail-current"><span className={`request-status request-status--${STATUS_CLASS[request.status] || "process"}`}>{STATUS_LABEL[request.status] || request.status}</span><small>Estado actual</small></div>
      </header>
      <section className="request-progress request-progress--journey" aria-label="Recorrido de tu solicitud">
        <div className="request-progress__heading">
          <div><p className="micro">Recorrido de la solicitud</p><p className="request-progress__summary">Desde que la recibimos hasta su cierre.</p></div>
          <span className={`request-progress__state${journey.terminal ? " is-terminal" : ""}`}>{journey.currentLabel}</span>
        </div>
        <ol className="request-journey">
          {journey.steps.map((step, index) => (
            <li className={`request-journey__step is-${step.state}`} key={step.key} aria-current={step.state === "current" ? "step" : undefined}>
              <span className="request-journey__marker">{step.state === "done" ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <span className="request-journey__connector" aria-hidden="true" />
              <strong>{step.label}</strong>
            </li>
          ))}
        </ol>
        <p className="request-progress__message" role="status">{journey.message}</p>
      </section>
      <section className="request-detail-card request-detail-card--timeline request-detail-card--timeline-top">
        <div className="request-detail-card__heading"><div><p className="micro">Seguimiento detallado</p><h2>La evolución de tu solicitud</h2></div><small>Se actualiza automáticamente</small></div>
        <ol className="request-timeline">{request.history.map((entry, index) => <li className={index === currentHistoryIndex ? "is-current" : undefined} key={`${entry.to}-${entry.at}-${index}`}>
          <span className={`request-timeline__dot ${entry.to === "contactado" ? "is-contacted" : ""}`} />
          <div><strong>{entry.to === "nueva" ? "Recibimos tu solicitud" : entry.to === "contactado" ? STATUS_LABEL.contactado : entry.to === "aprobada" ? "Solicitud aprobada" : entry.to === "en_proceso" ? "La coordinación continúa" : entry.to === "completada" ? "Solicitud completada" : entry.to === "rechazada" ? "Solicitud no aprobada" : entry.to === "cancelada" ? "Solicitud cancelada" : STATUS_LABEL[entry.to] || entry.to}</strong>
            {index === currentHistoryIndex ? <span className="request-timeline__current" aria-label="Estado actual">Estás aquí</span> : null}
            <time>{new Date(entry.at).toLocaleString()}</time>
          </div>
        </li>)}</ol>
      </section>
      <section className="request-detail-overview" aria-label="Resumen de la solicitud">
        <div><span>REFERENCIAS</span><strong>{String(request.items.length).padStart(2, "0")}</strong><small>Piezas diferentes</small></div>
        <div><span>UNIDADES</span><strong>{String(units).padStart(2, "0")}</strong><small>En esta solicitud</small></div>
        <div><span>TOTAL REGISTRADO</span><strong>{formatPrice(total)}</strong><small>{request.items.some((item) => item.price == null) ? "Hay precios por confirmar" : "Suma de piezas con precio"}</small></div>
      </section>
      <section className="request-detail-card request-detail-card--items">
        <div className="request-detail-card__heading"><div><p className="micro">La selección que enviaste</p><h2>Piezas solicitadas</h2></div><span>{request.items.length} {request.items.length === 1 ? "referencia" : "referencias"}</span></div>
        <ul className="request-detail-product-list">
          {request.items.map((item, index) => <li key={index}>
            <div className="request-detail-product-image">{item.image?.url ? <ProductImage image={item.image} product={{ name: item.name }} /> : <span aria-hidden="true">幽玄</span>}</div>
            <div className="request-detail-product-copy"><strong>{item.name}</strong><span>Cantidad · {item.quantity}</span></div>
            <strong className="request-detail-product-price">{item.price == null ? "A consultar" : formatPrice(Number(item.price) * Number(item.quantity || 1))}</strong>
          </li>)}
        </ul>
        <div className="request-detail-total"><span>Total de piezas con precio</span><strong>{formatPrice(total)}</strong></div>
        {request.items.some((item) => item.price === null) ? <p className="status">Hay piezas cuyo precio se confirmará durante la coordinación.</p> : null}
      </section>
      <div className="request-detail-meta-grid">
        <section className="request-detail-card"><p className="micro">Entrega</p><h2>{DELIVERY_LABEL[request.deliveryMethod] || request.deliveryMethod}</h2><p>Este detalle queda asociado a tu solicitud para coordinar contigo.</p></section>
        {request.comment ? <section className="request-detail-card"><p className="micro">Tu indicación</p><h2>Comentario</h2><p>{request.comment}</p></section> : null}
      </div>
      <div className="form-foot">
        {whatsappUrl ? <a className="button button--whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">Escribir por WhatsApp</a> : null}
        {shop && shop.email ? <a className="link-button" href={`mailto:${shop.email}?subject=${encodeURIComponent(`Solicitud ${request.code}`)}`}>Escribir por correo</a> : null}
        {request.status === "nueva" ? <button className="btn-ghost link-button--danger" type="button" disabled={canceling} onClick={handleCancel}>{canceling ? "Cancelando…" : "Cancelar solicitud"}</button> : null}
      </div>
      {cancelError ? <p className="status status--error" role="alert">{cancelError}</p> : null}
      <p className="status">¿Necesitas ayuda con esta solicitud? <Link className="link-button" to="/#contacto">Escríbenos.</Link></p>
    </section>
  );
}
