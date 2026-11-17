// Registro cronológico de cambios administrativos, con filtros y fichas expandibles independientes.
import { useMemo, useState } from "react";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";

const TYPES = [
  { value: "", label: "Todas las áreas" },
  { value: "pieza", label: "Piezas" },
  { value: "categoria", label: "Categorías" },
  { value: "obra", label: "Obras" },
  { value: "solicitud", label: "Solicitudes" },
  { value: "mensaje", label: "Mensajes" },
  { value: "cliente", label: "Clientes" },
  { value: "sistema", label: "Sistema" }
];
const ACTIONS = {
  creado: "Creación", actualizado: "Edición", eliminado: "Eliminación", estado: "Cambio de estado",
  nota: "Nota interna", contactado: "Contacto registrado", revisado: "Revisión", ejecutado: "Proceso ejecutado"
};
const ACTION_FILTERS = [{ value: "", label: "Todas las acciones" }, ...Object.entries(ACTIONS).map(([value, label]) => ({ value, label }))];
const TYPE_LABELS = { pieza: "Pieza", categoria: "Categoría", obra: "Obra", solicitud: "Solicitud", mensaje: "Mensaje", cliente: "Cliente", sistema: "Sistema" };
const DETAIL_LABELS = {
  fields: "Campos modificados", itemCount: "Piezas incluidas", deliveryMethod: "Forma de entrega",
  created: "Registros creados", updated: "Registros actualizados", deleted: "Registros eliminados",
  scanned: "Registros revisados", anonymized: "Registros anonimizados", removed: "Registros eliminados",
  pending: "Solicitudes pendientes", reconciled: "Contadores conciliados", total: "Total procesado"
};
const FIELD_LABELS = {
  name: "Nombre", title: "Título", slug: "Identificador", description: "Descripción", price: "Precio",
  category: "Categoría", work: "Obra asociada", availability: "Disponibilidad", stock: "Existencias", images: "Galería de imágenes",
  specs: "Características", contexto: "Contexto editorial", featured: "Destacada en portada", featuredOrder: "Orden en portada",
  recommended: "Recomendación editorial", recommendedOrder: "Orden de recomendación", sortOrder: "Orden", showOnHome: "Visible en inicio",
  active: "Activa", imageUrl: "Imagen", seed: "Ilustración", kanji: "Carácter visual", year: "Año", synopsis: "Sinopsis", cover: "Portada"
};
const DELIVERY_LABELS = { retiro: "Retiro personal", entrega_personal: "Entrega personal", envio_nacional: "Envío nacional en Panamá" };
const AVAILABILITY_LABELS = { en_stock: "En stock", agotado: "Agotado", pedido_exterior: "Pedido exterior" };

function humanizeKey(key) {
  return DETAIL_LABELS[key] || String(key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function humanizeValue(value) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  if (value == null || value === "") return "—";
  if (typeof value === "string") return DELIVERY_LABELS[value] || AVAILABILITY_LABELS[value] || value;
  if (typeof value === "number") return new Intl.NumberFormat("es-PA").format(value);
  if (Array.isArray(value)) return value.map((entry) => typeof entry === "string" ? (FIELD_LABELS[entry] || entry) : humanizeValue(entry)).join(" · ");
  if (typeof value === "object") return Object.entries(value).map(([key, entry]) => `${humanizeKey(key)}: ${humanizeValue(entry)}`).join(" · ");
  return String(value);
}

function auditDetailRows(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  return Object.entries(details)
    .filter(([key]) => key !== "changes" && !(key === "fields" && Array.isArray(details.changes)))
    .map(([key, value]) => ({ key, label: humanizeKey(key), value: Array.isArray(value) && key === "fields" ? value.map((field) => FIELD_LABELS[field] || field) : humanizeValue(value) }));
}

function changeValue(value, field) {
  if (value === null || value === undefined || value === "") return "Vacío";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("es-PA", { minimumFractionDigits: field === "price" ? 2 : 0, maximumFractionDigits: 2 }).format(value);
    return field === "price" ? `B/. ${formatted}` : formatted;
  }
  return humanizeValue(value);
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("es-PA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminAuditLog() {
  const [type, setType] = useState("");
  const [action, setAction] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const state = useApi("/admin/registro-ediciones?limit=200");
  const items = state.status === "ready" ? state.data.items : [];
  const filtered = useMemo(() => items.filter((item) => {
    const matchesType = type === "" || item.entityType === type;
    const matchesAction = action === "" || item.action === action;
    const term = query.trim().toLocaleLowerCase();
    const changedText = Array.isArray(item.details?.changes) ? item.details.changes.map((change) => `${FIELD_LABELS[change.field] || change.field} ${change.before || ""} ${change.after || ""}`).join(" ") : "";
    const matchesQuery = term === "" || [item.entityLabel, item.summary, item.actorLabel, item.action, changedText]
      .some((value) => String(value || "").toLocaleLowerCase().includes(term));
    return matchesType && matchesAction && matchesQuery;
  }), [items, type, action, query]);

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <section className="admin-audit" aria-labelledby="admin-audit-title">
      <header className="admin-panel__head">
        <div><p className="micro">Trazabilidad · Actividad administrativa</p><h1 id="admin-audit-title">Registro de ediciones</h1><p className="status">Un historial de las modificaciones realizadas en la tienda, ordenado desde la más reciente.</p></div>
        <button className="btn-ghost" type="button" onClick={state.reload}>Actualizar registro ↻</button>
      </header>
      <div className="admin-audit__filters">
        <label className="field">Área del sitio<select className="admin-select" value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="field">Tipo de cambio<select className="admin-select" value={action} onChange={(event) => setAction(event.target.value)}>{ACTION_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="field">Buscar en el registro<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, acción o administrador…" /></label>
        <p className="status" aria-live="polite">{filtered.length} visibles · {state.status === "ready" ? `últimos ${items.length} de ${state.data.total}` : "cargando"}</p>
      </div>
      <DataState state={state} emptyText="Todavía no hay modificaciones registradas." render={() => filtered.length === 0 ? (
        <div className="empty"><p>No hay movimientos que coincidan con estos filtros.</p><button className="link-button" type="button" onClick={() => { setType(""); setAction(""); setQuery(""); }}>Limpiar filtros</button></div>
      ) : (
        <div className="admin-audit__list">
          {filtered.map((item) => {
            const isOpen = expanded.has(item._id);
            return (
              <article className={`admin-audit-entry${isOpen ? " admin-audit-entry--open" : ""}`} key={item._id}>
                <button className="admin-audit-entry__trigger" type="button" aria-expanded={isOpen} onClick={() => toggle(item._id)}>
                  <span className="admin-audit-entry__date"><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time><small>{item.actorLabel}</small></span>
                  <span className="admin-audit-entry__main"><span className="micro">{TYPE_LABELS[item.entityType] || item.entityType} · {ACTIONS[item.action] || item.action}</span><strong>{item.entityLabel}</strong><span>{item.summary}</span></span>
                  <span className="admin-audit-entry__toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <div className="admin-audit-entry__details">
                    <p className="admin-audit-entry__details-summary">{item.summary}</p>
                    {Array.isArray(item.details?.changes) && item.details.changes.length > 0 ? (
                      <div className="admin-audit-entry__changes" aria-label="Campos que cambiaron">
                        {item.details.changes.map((change) => (
                          <article className="admin-audit-entry__change" key={change.field}>
                            <small>{FIELD_LABELS[change.field] || humanizeKey(change.field)}</small>
                            <div><span className="admin-audit-entry__before">{changeValue(change.before, change.field)}</span><span className="admin-audit-entry__arrow" aria-hidden="true">→</span><strong>{changeValue(change.after, change.field)}</strong></div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                    {auditDetailRows(item.details).length > 0 ? (
                      <dl className="admin-audit-entry__details-grid">
                        {auditDetailRows(item.details).map((detail) => (
                          <div key={detail.key}>
                            <dt>{detail.label}</dt>
                            <dd>{Array.isArray(detail.value) ? detail.value.map((value) => <span className="admin-audit-entry__chip" key={value}>{value}</span>) : detail.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : !Array.isArray(item.details?.changes) || item.details.changes.length === 0 ? <p className="admin-audit-entry__details-empty">No hay información adicional para este movimiento.</p> : null}
                    <small>Identificador · {item.entityId || "No aplica"}</small>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )} />
      <p className="admin-audit__note">El registro guarda quién realizó el cambio, cuándo y sobre qué elemento. Los filtros se aplican sobre los últimos 200 movimientos cargados. No almacena contraseñas, tokens ni el contenido privado de mensajes o solicitudes.</p>
    </section>
  );
}
