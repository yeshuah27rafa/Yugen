// pages/cuenta/Cuenta.jsx
// Panel del cliente: datos, correo (con confirmación), contraseña, exportación de datos y acceso a solicitudes.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clienteGet, clientePost, clientePut, setCustomerCsrfToken } from "../../api/client.js";

export default function Cuenta() {
  const navigate = useNavigate();
  const [session, setSession] = useState({ status: "loading", name: "", email: "" });
  const [notice, setNotice] = useState({ kind: "", text: "" });

  useEffect(() => {
    clienteGet("/cuenta/me")
      .then((data) => { setCustomerCsrfToken(data.csrfToken); setSession({ status: "in", name: data.name, email: data.email }); })
      .catch(() => { setCustomerCsrfToken(""); setSession({ status: "out", name: "", email: "" }); });
  }, []);

  function show(kind, text) {
    setNotice({ kind, text });
  }

  async function handleName(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const response = await clientePut("/cuenta/perfil", { name: data.get("name") });
      setSession((current) => Object.assign({}, current, { name: response.name }));
      show("ok", "Tus datos se guardaron.");
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleEmail(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await clientePost("/cuenta/correo", { password: data.get("password"), newEmail: data.get("newEmail") });
      form.reset();
      show("ok", response.message);
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handlePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await clientePost("/cuenta/clave", { currentPassword: data.get("currentPassword"), newPassword: data.get("newPassword") });
      setCustomerCsrfToken(response.csrfToken);
      form.reset();
      show("ok", "Tu contraseña fue actualizada.");
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleExport() {
    try {
      const response = await clienteGet("/cuenta/datos");
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mis-datos-yugen.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (failure) {
      show("error", failure.message);
    }
  }

  async function handleLogout() {
    try {
      await clientePost("/cuenta/salir");
    } catch (failure) {
      // Si la sesión ya no es válida en el servidor, se cierra igualmente en la interfaz.
    }
    setCustomerCsrfToken("");
    navigate("/cuenta/entrar");
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
      <p><Link className="button" to="/cuenta/solicitudes">Mis solicitudes</Link></p>

      <form className="cuenta-form" onSubmit={handleName}>
        <h2>Mis datos</h2>
        <label className="field">Nombre<input name="name" required minLength="2" maxLength="120" defaultValue={session.name} /></label>
        <div className="form-foot"><button className="button" type="submit">Guardar nombre</button></div>
      </form>

      <form className="cuenta-form" onSubmit={handleEmail}>
        <h2>Cambiar correo</h2>
        <p className="status">Te enviaremos un enlace al correo nuevo. El cambio se aplica al confirmarlo.</p>
        <label className="field">Contraseña actual<input name="password" type="password" required autoComplete="current-password" /></label>
        <label className="field">Correo nuevo<input name="newEmail" type="email" required autoComplete="email" /></label>
        <div className="form-foot"><button className="button" type="submit">Enviar enlace</button></div>
      </form>

      <form className="cuenta-form" onSubmit={handlePassword}>
        <h2>Cambiar contraseña</h2>
        <label className="field">Contraseña actual<input name="currentPassword" type="password" required autoComplete="current-password" /></label>
        <label className="field">Contraseña nueva (mínimo 10 caracteres)<input name="newPassword" type="password" required minLength="10" maxLength="128" autoComplete="new-password" /></label>
        <div className="form-foot"><button className="button" type="submit">Actualizar contraseña</button></div>
      </form>

      <div className="cuenta-form">
        <h2>Mis datos personales</h2>
        <p className="status">Descarga una copia de tus datos y de tus solicitudes.</p>
        <div className="form-foot"><button className="btn-ghost" type="button" onClick={handleExport}>Descargar mis datos</button></div>
      </div>

      <div className="form-foot">
        <button className="btn-ghost" type="button" onClick={handleLogout}>Cerrar sesión</button>
      </div>
      {notice.text !== "" ? <p className={notice.kind === "error" ? "status status--error" : "status"} role="status">{notice.text}</p> : null}
    </section>
  );
}
