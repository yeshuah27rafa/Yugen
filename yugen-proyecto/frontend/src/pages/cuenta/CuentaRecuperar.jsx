// pages/cuenta/CuentaRecuperar.jsx
// Solicitud de recuperación. La respuesta es la misma exista o no el correo.
import { useState } from "react";
import { apiPost } from "../../api/client.js";

export default function CuentaRecuperar() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    try {
      const response = await apiPost("/cuenta/recuperar", { email: data.get("email") });
      setMessage(response.message);
    } catch (failure) {
      setMessage(failure.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="cuenta-page">
      <h1>Recuperar contraseña</h1>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">Correo<input name="email" type="email" required autoComplete="username" /></label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>{sending ? "Enviando…" : "Enviar enlace"}</button>
        </div>
        <p className="status" role="status">{message}</p>
      </form>
    </section>
  );
}
