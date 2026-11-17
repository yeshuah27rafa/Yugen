// Lista de solicitudes propias. Los visitantes se envían a login sin mostrar un falso aviso de sesión expirada.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clienteGet, setCustomerCsrfToken } from "../../api/client.js";
import BackLink from "../../components/layout/BackLink.jsx";
import ProductImage from "../../components/art/ProductImage.jsx";

const STATUS_LABEL = { nueva: "En proceso", aprobada: "Aprobada", en_proceso: "Aprobada", completada: "Aprobada", rechazada: "No aprobada", cancelada: "Cancelada" };
const STATUS_CLASS = { nueva: "process", aprobada: "success", en_proceso: "success", completada: "success", rechazada: "danger", cancelada: "danger" };

export default function CuentaSolicitudes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", requests: [], error: "" });

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

  return (
    <section className="cuenta-page cuenta-page--requests">
      <BackLink to="/cuenta">Volver a mi cuenta</BackLink>
      <header className="cuenta-page__heading"><p className="micro">Tu actividad</p><h1>Mis solicitudes</h1><p>Consulta el estado y los detalles de cada solicitud que has enviado.</p></header>
      {state.status === "loading" ? <p className="status status--loading" role="status">Comprobando tu cuenta…</p> : null}
      {state.status === "error" ? <div className="status status--error" role="alert">{state.error}</div> : null}
      {state.status === "ready" && state.requests.length === 0 ? (
        <div className="account-empty"><p className="micro">Todavía no hay registros</p><h2>Tu primera solicitud puede empezar aquí.</h2><p>Cuando envíes una solicitud desde tu carrito, podrás seguir sus cambios en este espacio.</p><Link className="button" to="/catalogo">Explorar catálogo</Link></div>
      ) : null}
      {state.status === "ready" && state.requests.length > 0 ? (
        <div className="request-history">
          {state.requests.map((item) => {
            const first = item.items?.[0];
            const units = item.items?.reduce((sum, line) => sum + line.quantity, 0) || 0;
            return (
              <Link className="request-history__item" key={item.code} to={`/cuenta/solicitudes/${item.code}`}>
                <span className="request-history__image">{first?.image?.url ? <ProductImage image={first.image} product={{ name: first.name }} /> : <span aria-hidden="true">幽玄</span>}</span>
                <span className="request-history__main"><span className="request-history__code">{item.code}</span><strong>{first?.name || "Solicitud Yugen"}{item.items?.length > 1 ? ` y ${item.items.length - 1} más` : ""}</strong><small>{units} {units === 1 ? "pieza" : "piezas"}</small></span>
                <span className={`request-status request-status--${STATUS_CLASS[item.status] || "process"}`}>{STATUS_LABEL[item.status] || item.status}</span>
                <span className="request-history__date">{new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="request-history__arrow" aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
