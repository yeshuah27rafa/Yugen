// pages/Admin.jsx
// Administración: comprueba la sesión y muestra el login o el panel con sus secciones.
import { useEffect, useState } from "react";
import { apiGet, apiPost, setCsrfToken } from "../api/client.js";
import AdminLogin from "../components/admin/AdminLogin.jsx";
import AdminPanel from "../components/admin/AdminPanel.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";
import AdminRequests from "../components/admin/AdminRequests.jsx";
import AdminCustomers from "../components/admin/AdminCustomers.jsx";
import AdminMessages from "../components/admin/AdminMessages.jsx";

const SECTIONS = [
  { key: "resumen", label: "Resumen" },
  { key: "piezas", label: "Piezas" },
  { key: "solicitudes", label: "Solicitudes" },
  { key: "clientes", label: "Clientes" },
  { key: "mensajes", label: "Mensajes" }
];

export default function Admin() {
  const [session, setSession] = useState({ status: "checking", email: "" });
  const [logoutError, setLogoutError] = useState("");
  const [section, setSection] = useState("resumen");

  useEffect(() => {
    document.title = "Administración · Yugen";
    let meta = document.querySelector('meta[name="robots"]');
    if (meta === null) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      document.title = "Yugen · Anime y manga con criterio";
      meta.setAttribute("content", "index, follow");
    };
  }, []);

  useEffect(() => {
    apiGet("/auth/me")
      .then((data) => { setCsrfToken(data.csrfToken); setSession({ status: "in", email: data.email }); })
      .catch(() => { setCsrfToken(""); setSession({ status: "out", email: "" }); });
  }, []);

  function handleLogin(data) {
    setLogoutError("");
    setCsrfToken(data.csrfToken);
    setSession({ status: "in", email: data.email });
  }

  // Solo se muestra la sesión como cerrada si el servidor lo confirma o si la sesión ya caducó (401).
  async function handleLogout() {
    setLogoutError("");
    try {
      await apiPost("/auth/logout");
    } catch (failure) {
      if (failure.status !== 401) {
        setLogoutError("No pudimos cerrar la sesión en el servidor. Tu sesión sigue activa; inténtalo de nuevo.");
        return;
      }
    }
    setCsrfToken("");
    setSession({ status: "out", email: "" });
  }

  if (session.status === "checking") return <section className="admin-page"><p className="status">Cargando…</p></section>;
  if (session.status === "out") return <section className="admin-page"><AdminLogin onLogin={handleLogin} /></section>;

  return (
    <section className="admin-page">
      <nav className="admin-nav" aria-label="Secciones de administración">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={section === item.key ? "admin-nav__item admin-nav__item--on" : "admin-nav__item"}
            aria-current={section === item.key ? "page" : undefined}
            onClick={() => setSection(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {section === "resumen" ? <AdminDashboard /> : null}
      {section === "piezas" ? <AdminPanel email={session.email} onLogout={handleLogout} logoutError={logoutError} /> : null}
      {section === "solicitudes" ? <AdminRequests /> : null}
      {section === "clientes" ? <AdminCustomers /> : null}
      {section === "mensajes" ? <AdminMessages /> : null}
      {section !== "piezas" ? (
        <div className="form-foot">
          <p className="status">Sesión: {session.email}</p>
          <button className="btn-ghost" type="button" onClick={handleLogout}>Cerrar sesión</button>
          {logoutError !== "" ? <p className="status status--error" role="alert">{logoutError}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
