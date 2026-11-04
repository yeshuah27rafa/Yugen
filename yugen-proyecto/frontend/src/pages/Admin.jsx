// pages/Admin.jsx
// Administración: comprueba la sesión al cargar y muestra el login o el panel.
import { useEffect, useState } from "react";
import { apiGet, apiPost, setCsrfToken } from "../api/client.js";
import AdminLogin from "../components/admin/AdminLogin.jsx";
import AdminPanel from "../components/admin/AdminPanel.jsx";

export default function Admin() {
  const [session, setSession] = useState({ status: "checking", email: "" });

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
    setCsrfToken(data.csrfToken);
    setSession({ status: "in", email: data.email });
  }

  async function handleLogout() {
    try {
      await apiPost("/auth/logout");
    } catch (error) {
      // Aunque el servidor no responda, la sesión se cierra en el cliente.
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
      <AdminPanel email={session.email} onLogout={handleLogout} />
    </section>
  );
}
