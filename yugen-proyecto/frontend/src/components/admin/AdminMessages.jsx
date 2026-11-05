// components/admin/AdminMessages.jsx
// Mensajes del formulario de contacto, con marca de revisado.
import { useState } from "react";
import { apiPost } from "../../api/client.js";
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
              </li>
            ))}
          </ul>
        )}
      />
    </>
  );
}
