// pages/Admin.jsx
// Administración: comprueba la sesión al cargar y muestra el login o el panel.
import { useEffect, useState } from "react";
import { apiGet, apiPost, setCsrfToken } from "../api/client.js";
import AdminLogin from "../components/admin/AdminLogin.jsx";
import AdminPanel from "../components/admin/AdminPanel.jsx";

export default function Admin() {
  const [session, setSession] = useState({ status: "checking", email: "" });
  const [logoutError, setLogoutError] = useState("");

  // El panel no debe aparecer en buscadores. Al salir de /admin se restauran el título y la indexación
  // de la portada, porque la navegación es de una sola página y los cambios no se revierten solos.
  useEffect(() => {
    const defaultTitle = "Yugen · Anime y manga con criterio";
    document.title = "Administración · Yugen";
    let meta = document.querySelector('meta[name="robots"]');
    if (meta === null) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      document.title = defaultTitle;
      meta.setAttribute("content", "index, follow");
    };
  }, []);

  useEffect(() => {
    apiGet("/auth/me")
      .then((data) => {
        setCsrfToken(data.csrfToken);
        setSession({ status: "in", email: data.email });
      })
      .catch(() => {
        setCsrfToken("");
        setSession({ status: "out", email: "" });
      });
  }, []);

  function handleLogin(data) {
    setLogoutError("");
    setCsrfToken(data.csrfToken);
    setSession({ status: "in", email: data.email });
  }

  // Solo se muestra la sesión como cerrada si el servidor la cerró o si ya había caducado (401).
  // Si la petición falla por red o por error del servidor, la sesión sigue abierta y se avisa al usuario.
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

  if (session.status === "checking") {
    return <section className="admin-page"><p className="status">Cargando…</p></section>;
  }
  if (session.status === "out") {
    return <section className="admin-page"><AdminLogin onLogin={handleLogin} /></section>;
  }
  return (
    <section className="admin-page">
      <AdminPanel email={session.email} onLogout={handleLogout} logoutError={logoutError} />
    </section>
  );
}
