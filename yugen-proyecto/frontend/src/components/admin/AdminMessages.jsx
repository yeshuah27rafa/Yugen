// components/admin/AdminMessages.jsx
// Mensajes del formulario de contacto, con marca de revisado.
import { useState } from "react";
import { apiDelete, apiPost } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";

export default function AdminMessages() {
  const messages = useApi("/admin/mensajes");
  const [error, setError] = useState("");

  async function markReviewed(id) {
    try {
      await apiPost(`/admin/mensajes/${id}/revisado`, {});
      messages.reload();
    } catch (failure) {
      setError(failure.message);
    }
  }

  async function deleteMessage(id) {
    const confirmed = window.confirm("¿Borrar este mensaje? No se puede deshacer.");
    if (confirmed === false) return;
    try {
      await apiDelete(`/admin/mensajes/${id}`);
      messages.reload();
    } catch (failure) {
      setError(failure.message);
    }
  }

  return (
    <>
      {error !== "" ? <p className="status status--error" role="alert">{error}</p> : null}
      <DataState
        state={messages.status === "ready" ? { status: "ready", data: messages.data.items } : messages}
        emptyText="No hay mensajes."
        render={(items) => (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item._id} className="admin-message">
                <p><strong>{item.name}</strong> · {item.email} · {new Date(item.createdAt).toLocaleString()} · {item.status === "revisado" ? "Revisado" : "Nuevo"}</p>
                {item.product ? <p className="status">Sobre: {item.product.name}</p> : null}
                <p>{item.message}</p>
                {item.status === "revisado" ? null : (
                  <button className="btn-ghost" type="button" onClick={() => markReviewed(item._id)}>Marcar revisado</button>
                )}
                <button className="btn-ghost link-button--danger" type="button" onClick={() => deleteMessage(item._id)}>Borrar</button>
              </li>
            ))}
          </ul>
        )}
      />
    </>
  );
}
