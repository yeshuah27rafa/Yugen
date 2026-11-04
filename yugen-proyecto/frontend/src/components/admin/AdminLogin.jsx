// components/admin/AdminLogin.jsx
// Formulario de inicio de sesión. La sesión queda en una cookie httpOnly; aquí solo se recibe el token CSRF.
import { useState } from "react";
import { apiPost } from "../../api/client.js";

export default function AdminLogin({ onLogin }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const session = await apiPost("/auth/login", {
        email: data.get("email"),
        password: data.get("password")
      });
      onLogin(session);
    } catch (failure) {
      setError(failure.message);
      setSending(false);
    }
  }

  return (
    <div className="admin-login">
      <h1>Administración</h1>
      <form className="admin-stack" onSubmit={handleSubmit}>
        <label className="field">
          Correo
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label className="field">
          Contraseña
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>
            {sending ? "Entrando…" : "Entrar"}
          </button>
          <p className="status status--error" role="alert">{error}</p>
        </div>
      </form>
    </div>
  );
}
