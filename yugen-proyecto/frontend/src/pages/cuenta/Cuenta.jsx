// pages/cuenta/Cuenta.jsx
// Página mínima de la cuenta: sesión, cambio de contraseña y cierre de sesión.
// El panel completo del cliente llega en la Fase 10.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clienteGet, clientePost, setCustomerCsrfToken } from "../../api/client.js";

export default function Cuenta() {
  const navigate = useNavigate();
  const [session, setSession] = useState({ status: "loading", name: "", email: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    clienteGet("/cuenta/me")
      .then((data) => {
        setCustomerCsrfToken(data.csrfToken);
        setSession({ status: "in", name: data.name, email: data.email });
      })
      .catch(() => {
        setCustomerCsrfToken("");
        setSession({ status: "out", name: "", email: "" });
      });
  }, []);

  async function handleLogout() {
    try {
      await clientePost("/cuenta/salir");
    } catch (failure) {
      // Si la sesión ya no es válida en el servidor, se cierra igualmente en la interfaz.
    }
    setCustomerCsrfToken("");
    navigate("/cuenta/entrar");
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await clientePost("/cuenta/clave", {
        currentPassword: data.get("currentPassword"),
        newPassword: data.get("newPassword")
      });
      setCustomerCsrfToken(response.csrfToken);
      form.reset();
      setMessage("Tu contraseña fue actualizada.");
    } catch (failure) {
      setMessage(failure.message);
    }
  }

  if (session.status === "loading") return <section className="cuenta-page"><p className="status">Cargando…</p></section>;

  if (session.status === "out") {
    return (
      <section className="cuenta-page">
        <h1>Tu cuenta</h1>
        <p className="status">Inicia sesión para ver tu cuenta.</p>
        <Link className="button" to="/cuenta/entrar">Entrar</Link>
      </section>
    );
  }

  return (
    <section className="cuenta-page">
      <h1>Hola, {session.name}</h1>
      <p className="status">{session.email}</p>
      <form className="cuenta-form" onSubmit={handlePasswordChange}>
        <h2>Cambiar contraseña</h2>
        <label className="field">Contraseña actual<input name="currentPassword" type="password" required autoComplete="current-password" /></label>
        <label className="field">Contraseña nueva (mínimo 10 caracteres)<input name="newPassword" type="password" required minLength="10" maxLength="128" autoComplete="new-password" /></label>
        <div className="form-foot">
          <button className="button" type="submit">Actualizar contraseña</button>
          <button className="btn-ghost" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
        <p className="status" role="status">{message}</p>
      </form>
    </section>
  );
}
