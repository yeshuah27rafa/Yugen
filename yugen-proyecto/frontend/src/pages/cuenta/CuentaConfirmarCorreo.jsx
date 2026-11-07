// pages/cuenta/CuentaConfirmarCorreo.jsx
// Confirma el cambio de correo desde el enlace enviado al correo nuevo.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiPost } from "../../api/client.js";

export default function CuentaConfirmarCorreo() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    if (token === "") {
      setState({ status: "error", message: "El enlace no es válido." });
      return;
    }
    apiPost("/cuenta/correo/confirmar", { token })
      .then((data) => setState({ status: "ready", message: data.message }))
      .catch((failure) => setState({ status: "error", message: failure.message }));
  }, [token]);

  return (
    <section className="cuenta-page">
      <h1>Confirmar nuevo correo</h1>
      <p className={state.status === "error" ? "status status--error" : "status"} role="status">
        {state.status === "loading" ? "Confirmando…" : state.message}
      </p>
      {state.status === "ready" ? <Link className="button" to="/cuenta/entrar">Entrar</Link> : null}
    </section>
  );
}
