// pages/cuenta/Cuenta.jsx
// Panel del cliente: datos, correo (con confirmación), contraseña, exportación de datos y acceso a solicitudes.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clienteDelete, clienteGet, clientePost, clientePut, setCustomerCsrfToken } from "../../api/client.js";
import { writeCart } from "../../utils/cartStorage.js";
import BackLink from "../../components/layout/BackLink.jsx";
import { useWishlist } from "../../components/WishlistContext.jsx";
import ProductImage from "../../components/art/ProductImage.jsx";

export default function Cuenta() {
  const navigate = useNavigate();
  const wishlist = useWishlist();
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [session, setSession] = useState({ status: "loading", name: "", email: "" });
  const [notice, setNotice] = useState({ kind: "", text: "" });
  const [sessionRetry, setSessionRetry] = useState(0);

  useEffect(() => {
    let active = true;
    clienteGet("/cuenta/me")
      .then((data) => {
        if (!active) return;
        setCustomerCsrfToken(data.csrfToken);
        setSession({ status: "in", name: data.name, email: data.email, error: "" });
        clienteGet("/cuenta/solicitudes").then((result) => { if (active) setRequests(result.requests || []); }).catch(() => { if (active) setRequests([]); }).finally(() => { if (active) setRequestsLoading(false); });
      })
      .catch((failure) => {
        if (!active) return;
        setCustomerCsrfToken("");
        if (failure.status === 401) { setSession({ status: "out", name: "", email: "", error: "" }); setRequestsLoading(false); }
        else setSession({ status: "error", name: "", email: "", error: failure.message || "No pudimos comprobar tu cuenta." });
      });
    return () => { active = false; };
  }, [sessionRetry]);

  function show(kind, text) {
    setNotice({ kind, text });
  }

  async function handleName(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const response = await clientePut("/cuenta/perfil", { name: data.get("name") });
      setSession((current) => Object.assign({}, current, { name: response.name }));
      show("ok", "Tus datos se guardaron.");
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleEmail(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await clientePost("/cuenta/correo", { password: data.get("password"), newEmail: data.get("newEmail") });
      form.reset();
      show("ok", response.message);
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handlePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await clientePost("/cuenta/clave", { currentPassword: data.get("currentPassword"), newPassword: data.get("newPassword") });
      setCustomerCsrfToken(response.csrfToken);
      form.reset();
      show("ok", "Tu contraseña fue actualizada.");
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();
    if (window.confirm("¿Seguro que quieres eliminar tu cuenta?") === false) return;
    const data = new FormData(event.currentTarget);
    try {
      await clienteDelete("/cuenta/eliminar", { password: data.get("password") });
      writeCart([]);
      setCustomerCsrfToken("");
      navigate("/");
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleExport() {
    try {
      const response = await clienteGet("/cuenta/datos");
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mis-datos-yugen.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleLogout() {
    try {
      await clientePost("/cuenta/salir");
    } catch (failure) {
      // Si la sesión ya no es válida en el servidor, se cierra igualmente en la interfaz.
    }
    // El carrito es del navegador: al cerrar sesión se vacía para no mostrarlo a la siguiente cuenta.
    writeCart([]);
    setCustomerCsrfToken("");
    navigate("/cuenta/entrar");
  }

  if (session.status === "loading") return <section className="cuenta-page"><p className="status status--loading" role="status">Comprobando tu cuenta…</p></section>;

  if (session.status === "error") {
    return <section className="cuenta-page"><BackLink to="/">Volver a la tienda</BackLink><h1>No pudimos conectar con tu cuenta</h1><p className="status status--error" role="alert">{session.error}</p><button className="button" type="button" onClick={() => { setSession({ status: "loading", name: "", email: "", error: "" }); setSessionRetry((value) => value + 1); }}>Reintentar</button></section>;
  }

  if (session.status === "out") {
    return (
      <section className="cuenta-page">
        <BackLink to="/">Volver a la tienda</BackLink>
        <h1>Tu cuenta</h1>
        <p className="status">Inicia sesión para ver tu cuenta.</p>
        <Link className="button" to="/cuenta/entrar">Entrar</Link>
      </section>
    );
  }

  return (
    <section className="cuenta-page cuenta-page--dashboard">
      <BackLink to="/">Volver a la tienda</BackLink>
      <header className="account-dashboard__head">
        <div className="account-dashboard__welcome">
          <p className="micro">Tu archivo personal · YUGEN / MEMBER</p>
          <h1>Hola, {session.name}.</h1>
          <p>{session.email}</p>
        </div>
        <div className="account-dashboard__head-mark" aria-hidden="true"><span>幽玄</span><small>ESPACIO<br/>PERSONAL</small></div>
      </header>
      {notice.text !== "" ? <p className={notice.kind === "error" ? "status status--error account-notice" : "status account-notice"} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p> : null}

      <nav className="account-shortcuts" aria-label="Navegación de tu cuenta">
        <Link to="/cuenta/solicitudes"><span className="account-shortcuts__index">01</span><strong>Mis solicitudes</strong><span>Consultar actividad ↗</span></Link>
        <Link to="/favoritos"><span className="account-shortcuts__index">02</span><strong>Lista de deseos</strong><span>{wishlist.count} {wishlist.count === 1 ? "pieza guardada" : "piezas guardadas"} ↗</span></Link>
        <a href="#datos-cuenta"><span className="account-shortcuts__index">03</span><strong>Mis datos</strong><span>Perfil y seguridad ↓</span></a>
      </nav>

      <section className="account-overview" aria-label="Resumen de actividad">
        <div className="account-overview__intro"><p className="micro">Una vista de tu actividad</p><h2>Lo que has reunido<br/>y lo que sigue.</h2><p>Este espacio mantiene a mano tus solicitudes, tus piezas guardadas y la información de tu cuenta.</p></div>
        <div className="account-overview__stats">
          <div><span>Solicitudes registradas</span><strong>{requestsLoading ? "—" : String(requests.length).padStart(2, "0")}</strong></div>
          <div><span>En revisión</span><strong>{requestsLoading ? "—" : String(requests.filter((item) => item.status === "nueva").length).padStart(2, "0")}</strong></div>
          <div><span>En tu lista</span><strong>{String(wishlist.count).padStart(2, "0")}</strong></div>
        </div>
      </section>

      <section className="account-recent" aria-labelledby="account-recent-title">
        <div className="account-recent__head"><div><p className="micro">Actividad reciente</p><h2 id="account-recent-title">Tus últimas solicitudes.</h2></div><Link className="text-link" to="/cuenta/solicitudes">Ver historial ↗</Link></div>
        {requestsLoading ? <p className="status status--loading">Cargando tu actividad…</p> : requests.length === 0 ? <div className="account-recent__empty"><span aria-hidden="true">✳</span><div><strong>Aquí comenzará tu historial.</strong><p>Cuando envíes una solicitud, podrás consultar su evolución desde este espacio.</p></div><Link className="link-button" to="/catalogo">Explorar catálogo ↗</Link></div> : (
          <div className="account-recent__list">{requests.slice(0, 3).map((request) => { const first = request.items?.[0]; return <Link className="account-recent__item" key={request.code} to={`/cuenta/solicitudes/${request.code}`}>
            <div className="account-recent__image">{first?.image?.url ? <ProductImage image={first.image} product={{ name: first.name }} /> : <span aria-hidden="true">幽玄</span>}</div>
            <div className="account-recent__copy"><small>{request.code} · {new Date(request.createdAt).toLocaleDateString()}</small><strong>{first?.name || "Solicitud"}{request.items?.length > 1 ? ` y ${request.items.length - 1} más` : ""}</strong><span>{request.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} piezas</span></div>
            <span className={`request-status request-status--${request.status === "nueva" ? "process" : ["rechazada", "cancelada"].includes(request.status) ? "danger" : "success"}`}>{request.status === "nueva" ? "En proceso" : ["rechazada", "cancelada"].includes(request.status) ? "Cancelada" : "Aprobada"}</span>
            <span className="account-recent__arrow" aria-hidden="true">↗</span>
          </Link>; })}</div>
        )}
      </section>

      <div className="account-dashboard__section-title" id="datos-cuenta"><p className="micro">Tu información</p><h2>Datos y preferencias.</h2><p>Administra lo necesario desde un mismo lugar.</p></div>
      <div className="account-dashboard__grid">
        <section className="account-card account-card--profile">
          <p className="micro">Perfil</p>
          <h2>Mis datos</h2>
          <form className="cuenta-form" onSubmit={handleName}>
            <label className="field">Nombre<input name="name" required minLength="2" maxLength="120" defaultValue={session.name} /></label>
            <div className="form-foot"><button className="button" type="submit">Guardar nombre</button></div>
          </form>
        </section>

        <section className="account-card">
          <p className="micro">Correo</p>
          <h2>Cambiar correo</h2>
          <p className="status">Te enviaremos un enlace al correo nuevo. El cambio se aplica al confirmarlo.</p>
          <form className="cuenta-form" onSubmit={handleEmail}>
            <label className="field">Contraseña actual<input name="password" type="password" required autoComplete="current-password" /></label>
            <label className="field">Correo nuevo<input name="newEmail" type="email" required autoComplete="email" /></label>
            <div className="form-foot"><button className="button" type="submit">Enviar enlace</button></div>
          </form>
        </section>

        <section className="account-card">
          <p className="micro">Seguridad</p>
          <h2>Cambiar contraseña</h2>
          <form className="cuenta-form" onSubmit={handlePassword}>
            <label className="field">Contraseña actual<input name="currentPassword" type="password" required autoComplete="current-password" /></label>
            <label className="field">Contraseña nueva (mínimo 10 caracteres)<input name="newPassword" type="password" required minLength="10" maxLength="128" autoComplete="new-password" /></label>
            <div className="form-foot"><button className="button" type="submit">Actualizar contraseña</button></div>
          </form>
        </section>

        <section className="account-card">
          <p className="micro">Tus datos</p>
          <h2>Exportar información</h2>
          <p className="status">Descarga una copia de tus datos y de tus solicitudes.</p>
          <div className="form-foot"><button className="btn-ghost" type="button" onClick={handleExport}>Descargar mis datos</button></div>
        </section>

        <section className="account-card account-card--danger">
          <p className="micro">Decisión irreversible</p>
          <h2>Eliminar mi cuenta</h2>
          <p className="status">Tu cuenta se borra y tus solicitudes quedan anonimizadas. Esta acción no se puede deshacer.</p>
          <form className="cuenta-form" onSubmit={handleDeleteAccount}>
            <label className="field">Contraseña actual<input name="password" type="password" required autoComplete="current-password" /></label>
            <div className="form-foot"><button className="btn-ghost link-button--danger" type="submit">Eliminar cuenta</button></div>
          </form>
        </section>
      </div>
      <div className="account-dashboard__logout"><button className="btn-ghost" type="button" onClick={handleLogout}>Cerrar sesión</button></div>
    </section>
  );
}
