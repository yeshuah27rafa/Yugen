// pages/cuenta/CuentaRegistro.jsx
// Registro de cliente. La respuesta es la misma exista o no el correo.
import { useState } from "react";
import { apiPost } from "../../api/client.js";

export default function CuentaRegistro() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setError("");
    setMessage("");
    try {
      const response = await apiPost("/cuenta/registro", {
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
        privacyAccepted: data.get("privacyAccepted") === "on"
      });
      form.reset();
      setMessage(response.message);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="cuenta-page">
      <h1>Crear cuenta</h1>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">Nombre<input name="name" required minLength="2" maxLength="120" autoComplete="name" /></label>
        <label className="field">Correo<input name="email" type="email" required autoComplete="email" /></label>
        <label className="field">
          Contraseña (mínimo 10 caracteres)
          <input name="password" type="password" required minLength="10" maxLength="128" autoComplete="new-password" />
        </label>
        <label className="field field--check">
          <input name="privacyAccepted" type="checkbox" required />
          Acepto el aviso de privacidad de Yugen.
        </label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>{sending ? "Creando…" : "Crear cuenta"}</button>
        </div>
        <p className="status" role="status">{message}</p>
        <p className="status status--error" role="alert">{error}</p>
      </form>
    </section>
  );
}
