// Historial de solicitudes con vista previa en drawer y acceso al seguimiento completo.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clienteGet, setCustomerCsrfToken } from "../../api/client.js";
import BackLink from "../../components/layout/BackLink.jsx";
import ProductImage from "../../components/art/ProductImage.jsx";
import RequestPreviewDrawer from "../../components/cuenta/RequestPreviewDrawer.jsx";

const STATUS_LABEL = { nueva: "En proceso", aprobada: "Aprobada", en_proceso: "Aprobada", completada: "Aprobada", rechazada: "No aprobada", cancelada: "Cancelada" };

function statusClass(status) {
  if (status === "nueva") return "nueva";
  if (status === "rechazada" || status === "cancelada") return status;
  if (["aprobada", "en_proceso", "completada"].includes(status)) return "aprobada";
  return "nueva";
}

export default function CuentaSolicitudes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", requests: [], error: "" });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const session = await clienteGet("/cuenta/me");
        setCustomerCsrfToken(session.csrfToken);
        const data = await clienteGet("/cuenta/solicitudes");
        if (active) setState({ status: "ready", requests: data.requests || [], error: "" });
      } catch (failure) {
        if (!active) return;
        if (failure.status === 401) {
          setCustomerCsrfToken("");
          navigate("/cuenta/entrar", {
            replace: true,
            state: { from: { pathname: location.pathname, search: location.search, hash: location.hash }, message: "Inicia sesión para consultar tus solicitudes." }
          });
          return;
        }
        setState({ status: "error", requests: [], error: failure.message || "No pudimos cargar tus solicitudes." });
      }
    }
    load();
    return () => { active = false; };
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!preview) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) { if (event.key === "Escape") setPreview(null); }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [preview]);

  return (
    <section className="cuenta-page cuenta-page--requests">
      <BackLink to="/cuenta">Volver a mi cuenta</BackLink>
      <header className="cuenta-page__heading request-list-heading">
        <div><p className="micro">Tu actividad · Archivo personal</p><h1>Mis solicitudes</h1><p>Un registro de las piezas que elegiste y de cómo avanza cada coordinación.</p></div>
        {state.status === "ready" ? <span className="request-list-heading__count">{String(state.requests.length).padStart(2, "0")} <small>REGISTROS</small></span> : null}
      </header>
      {state.status === "loading" ? <p className="status status--loading" role="status">Comprobando tu cuenta…</p> : null}
      {state.status === "error" ? <div className="status status--error" role="alert">{state.error}</div> : null}
      {state.status === "ready" && state.requests.length === 0 ? (
        <div className="account-empty"><p className="micro">Todavía no hay registros</p><h2>Tu primera solicitud puede empezar aquí.</h2><p>Cuando envíes una solicitud desde tu carrito, podrás seguir sus cambios en este espacio.</p><Link className="button" to="/catalogo">Explorar catálogo</Link></div>
      ) : null}
      {state.status === "ready" && state.requests.length > 0 ? (
        <div className="request-history">
          {state.requests.map((item) => {
            const first = item.items?.[0];
            const units = item.items?.reduce((sum, line) => sum + Number(line.quantity || 1), 0) || 0;
            const detailPath = `/cuenta/solicitudes/${encodeURIComponent(item.code)}`;
            return (
              <article className="request-history__item" key={item.code}>
                <Link className="request-history__item-link" to={detailPath}>
                  <span className="request-history__image">{first?.image?.url ? <ProductImage image={first.image} product={{ name: first.name }} /> : <span aria-hidden="true">幽玄</span>}</span>
                  <span className="request-history__main">
                    <span className="request-history__code">{item.code}</span>
                    <strong>{first?.name || "Solicitud Yugen"}{item.items?.length > 1 ? ` y ${item.items.length - 1} más` : ""}</strong>
                    <small>{units} {units === 1 ? "pieza" : "piezas"} · {new Date(item.createdAt).toLocaleDateString("es-PA", { dateStyle: "medium" })}</small>
                  </span>
                  <span className={`request-status request-status--${statusClass(item.status)}`}>{STATUS_LABEL[item.status] || item.status}</span>
                </Link>
                <div className="request-history__actions">
                  <button className="btn-ghost request-history__preview" type="button" onClick={() => setPreview(item)} aria-label={`Previsualizar solicitud ${item.code}`}>
                    <span aria-hidden="true">◉</span> Vista previa
                  </button>
                  <Link className="text-link request-history__open" to={detailPath}>Ver solicitud ↗</Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {preview ? <RequestPreviewDrawer request={preview} onClose={() => setPreview(null)} /> : null}
    </section>
  );
}

