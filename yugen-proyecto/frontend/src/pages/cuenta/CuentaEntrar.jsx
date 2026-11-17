// pages/cuenta/CuentaEntrar.jsx
// Inicio de sesión de cliente con contador de intentos y bloqueo visible.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clienteGet, clientePost, setCustomerCsrfToken } from "../../api/client.js";
import PasswordField from "../../components/cuenta/PasswordField.jsx";
import { syncCartAfterLogin } from "../../utils/cartSync.js";
import LoginAttemptsNotice from "../../components/cuenta/LoginAttemptsNotice.jsx";
import BackLink from "../../components/layout/BackLink.jsx";

export default function CuentaEntrar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingSession, setCheckingSession] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState({ remainingAttempts: undefined, retryAfterSeconds: 0 });

  useEffect(() => {
    let active = true;
    clienteGet("/cuenta/me")
      .then((session) => {
        if (!active) return;
        setCustomerCsrfToken(session.csrfToken);
        navigate("/cuenta", { replace: true });
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, [navigate]);

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
      const requested = location.state && location.state.from;
      const destination = requested && typeof requested.pathname === "string"
        && requested.pathname.startsWith("/") && requested.pathname.startsWith("//") === false
        ? { pathname: requested.pathname, search: requested.search || "", hash: requested.hash || "" }
        : "/cuenta";
      navigate(destination, { replace: true });
    } catch (failure) {
      setError(failure.message);
      setAttempts({
        remainingAttempts: failure.data ? failure.data.remainingAttempts : undefined,
        retryAfterSeconds: failure.data && failure.data.retryAfterSeconds ? failure.data.retryAfterSeconds : 0
      });
      setSending(false);
    }
  }

  const originPath = location.state && location.state.from && location.state.from.pathname;
  const backTarget = originPath === "/solicitud" ? "/carrito" : (originPath || "/");

  if (checkingSession) return <section className="cuenta-page"><p className="status status--loading" role="status">Comprobando tu sesión…</p></section>;

  return (
    <section className="cuenta-page">
      <BackLink to={backTarget}>{backTarget === "/" ? "Volver a la tienda" : "Volver"}</BackLink>
      <h1>Entrar</h1>
      {location.state && location.state.message ? <p className="account-intent" role="status">{location.state.message}</p> : null}
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">Correo<input name="email" type="email" required autoComplete="username" /></label>
        <label className="field">Contraseña<PasswordField name="password" required autoComplete="current-password" /></label>
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
