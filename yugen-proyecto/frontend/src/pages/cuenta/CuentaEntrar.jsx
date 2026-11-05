// pages/cuenta/CuentaEntrar.jsx
// Inicio de sesión de cliente con contador de intentos y bloqueo visible.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clientePost, setCustomerCsrfToken } from "../../api/client.js";
import { syncCartAfterLogin } from "../../utils/cartSync.js";
import LoginAttemptsNotice from "../../components/cuenta/LoginAttemptsNotice.jsx";

export default function CuentaEntrar() {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState({ remainingAttempts: undefined, retryAfterSeconds: 0 });

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const session = await clientePost("/cuenta/entrar", {
        email: data.get("email"),
        password: data.get("password")
      });
      setCustomerCsrfToken(session.csrfToken);
      await syncCartAfterLogin();
      navigate("/cuenta");
    } catch (failure) {
      setError(failure.message);
      setAttempts({
        remainingAttempts: failure.data ? failure.data.remainingAttempts : undefined,
        retryAfterSeconds: failure.data && failure.data.retryAfterSeconds ? failure.data.retryAfterSeconds : 0
      });
      setSending(false);
    }
  }

  return (
    <section className="cuenta-page">
      <h1>Entrar</h1>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">Correo<input name="email" type="email" required autoComplete="username" /></label>
        <label className="field">Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>{sending ? "Entrando…" : "Entrar"}</button>
          <Link className="link-button" to="/cuenta/recuperar">Olvidé mi contraseña</Link>
        </div>
        <p className="status status--error" role="alert">{error}</p>
        <LoginAttemptsNotice remainingAttempts={attempts.remainingAttempts} retryAfterSeconds={attempts.retryAfterSeconds} />
      </form>
      <p className="status">¿No tienes cuenta? <Link className="link-button" to="/cuenta/registro">Crear cuenta</Link></p>
    </section>
  );
}
