// components/admin/AdminRequests.jsx
// Bandeja de solicitudes con filtros, detalle, cambios de estado, notas internas y enlaces de contacto.
import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import { formatPrice } from "../../utils/format.js";
import DataState from "../DataState.jsx";

const STATUS_LABEL = {
  nueva: "Nueva", aprobada: "Aprobada", en_proceso: "En proceso",
  completada: "Completada", rechazada: "Rechazada", cancelada: "Cancelada"
};
const DELIVERY_LABEL = { retiro: "Retiro", entrega_personal: "Entrega personal", envio_nacional: "Envío nacional" };

export default function AdminRequests() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const params = new URLSearchParams();
  if (status !== "") params.set("status", status);
  if (query !== "") params.set("q", query);
  const list = useApi("/admin/solicitudes?" + params.toString());

  function handleSearch(event) {
    event.preventDefault();
    setQuery(search.trim());
  }

  return (
    <div className="admin-requests">
      <div className="admin-filters">
        <label className="field">
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {Object.keys(STATUS_LABEL).map((key) => <option key={key} value={key}>{STATUS_LABEL[key]}</option>)}
          </select>
        </label>
        <form className="field" role="search" onSubmit={handleSearch}>
          Buscar por código, nombre o correo
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </form>
      </div>
      <div className="admin-split">
        <div>
          <DataState
            state={list.status === "ready" ? { status: "ready", data: list.data.items } : list}
            emptyText="No hay solicitudes con esos filtros."
            render={(items) => (
              <ul className="admin-list">
                {items.map((item) => (
                  <li key={item._id}>
                    <button type="button" className={selected === item._id ? "admin-list__item admin-list__item--on" : "admin-list__item"} onClick={() => setSelected(item._id)}>
                      <strong>{item.code}</strong> · {item.contact.name} · {STATUS_LABEL[item.status]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          />
        </div>
        <div>
          {selected === null ? <p className="status">Elige una solicitud para revisarla.</p> : <RequestDetail id={selected} onChanged={list.reload} />}
        </div>
      </div>
    </div>
  );
}

function RequestDetail({ id, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    apiGet(`/admin/solicitudes/${id}`)
      .then((data) => { if (active) setDetail(data); })
      .catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [id, version]);

  function refresh() {
    setVersion((current) => current + 1);
    onChanged();
  }

  async function changeStatus(to) {
    try {
      await apiPost(`/admin/solicitudes/${id}/estado`, { to });
      refresh();
    } catch (failure) {
      setError(failure.message);
    }
  }

  async function addNote(event) {
    event.preventDefault();
    try {
      await apiPost(`/admin/solicitudes/${id}/notas`, { text: note });
      setNote("");
      refresh();
    } catch (failure) {
      setError(failure.message);
    }
  }

  async function deleteRequest() {
    const confirmed = window.confirm(`¿Borrar la solicitud ${request.code}? Esta acción no se puede deshacer.`);
    if (confirmed === false) return;
    try {
      await apiDelete(`/admin/solicitudes/${id}`);
      onChanged();
      setDetail(null);
    } catch (failure) {
      setError(failure.message);
    }
  }

  async function markContacted() {
    try {
      await apiPost(`/admin/solicitudes/${id}/contactado`, {});
      refresh();
    } catch (failure) {
      setError(failure.message);
    }
  }

  if (error !== "") return <p className="status status--error" role="alert">{error}</p>;
  if (detail === null) return <p className="status">Cargando solicitud…</p>;

  const request = detail.request;
  const total = request.items.reduce((sum, item) => (item.priceSnapshot === null ? sum : sum + item.priceSnapshot * item.quantity), 0);

  return (
    <div className="admin-detail">
      <h2>{request.code} · {STATUS_LABEL[request.status]}</h2>
      <p className="status">{request.contact.name} · {request.contact.email} · {request.contact.whatsapp ? `WhatsApp ${request.contact.whatsapp}` : "sin WhatsApp (usa correo)"}</p>
      <p className="status">Entrega: {DELIVERY_LABEL[request.deliveryMethod]}{request.contactedAt ? ` · contactado ${new Date(request.contactedAt).toLocaleString()}` : ""}</p>
      {request.comment ? <p>{request.comment}</p> : null}

      <ul className="admin-lines">
        {request.items.map((item, index) => (
          <li key={`${item.product}-${index}`}>{item.nameSnapshot} × {item.quantity} · {item.priceSnapshot === null ? "a consultar" : formatPrice(item.priceSnapshot)}</li>
        ))}
      </ul>
      <p><strong>Total con precio:</strong> {formatPrice(total)}</p>

      <div className="admin-actions">
        {detail.links.whatsapp ? <a className="button" href={detail.links.whatsapp} target="_blank" rel="noreferrer">Abrir WhatsApp</a> : null}
        <a className="btn-ghost" href={detail.links.email}>Escribir por correo</a>
        <button className="btn-ghost" type="button" onClick={markContacted}>Marcar contactado</button>
        <button className="btn-ghost link-button--danger" type="button" onClick={deleteRequest}>Borrar solicitud</button>
      </div>
      <p className="status">Plantilla sugerida: {detail.links.text}</p>

      <div className="admin-actions">
        {detail.allowedTransitions.map((to) => (
          <button key={to} className="btn-ghost" type="button" onClick={() => changeStatus(to)}>Pasar a {STATUS_LABEL[to]}</button>
        ))}
      </div>

      <form className="admin-stack" onSubmit={addNote}>
        <label className="field">
          Nota interna (solo administración)
          <textarea rows="2" maxLength="1000" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button className="btn-ghost" type="submit" disabled={note.trim() === ""}>Guardar nota</button>
      </form>

      <h3>Notas internas</h3>
      <ul className="admin-lines">
        {request.adminNotes.map((entry, index) => (
          <li key={index}>{entry.text} <span className="status">({entry.by}, {new Date(entry.at).toLocaleString()})</span></li>
        ))}
      </ul>

      <h3>Historial de estados</h3>
      <ul className="admin-lines">
        {request.statusHistory.map((entry, index) => (
          <li key={index}>{entry.from ? `${STATUS_LABEL[entry.from]} → ` : ""}{STATUS_LABEL[entry.to]} · {new Date(entry.at).toLocaleString()} · {entry.by}</li>
        ))}
      </ul>
    </div>
  );
}
