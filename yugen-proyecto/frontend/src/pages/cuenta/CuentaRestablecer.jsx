// pages/cuenta/CuentaRestablecer.jsx
// Define una contraseña nueva con el token del enlace recibido.
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiPost } from "../../api/client.js";

export default function CuentaRestablecer() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [sending, setSending] = useState(false);
  const [state, setState] = useState({ kind: "", message: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setState({ kind: "", message: "" });
    try {
      const response = await apiPost("/cuenta/restablecer", { token, password: data.get("password") });
      setState({ kind: "ok", message: response.message });
    } catch (failure) {
      setState({ kind: "error", message: failure.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="cuenta-page">
      <h1>Nueva contraseña</h1>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">
          Contraseña nueva (mínimo 10 caracteres)
          <input name="password" type="password" required minLength="10" maxLength="128" autoComplete="new-password" />
        </label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending || token === ""}>{sending ? "Guardando…" : "Guardar"}</button>
        </div>
        <p className={state.kind === "error" ? "status status--error" : "status"} role="status">{state.message}</p>
        {state.kind === "ok" ? <Link className="link-button" to="/cuenta/entrar">Ir a entrar</Link> : null}
      </form>
    </section>
  );
}
