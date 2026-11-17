// Bandeja editorial de mensajes: distingue el contacto general de las consultas sobre piezas.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiDelete, apiPost } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import { useCatalogCategories } from "../CatalogContext.jsx";
import ProductImage from "../art/ProductImage.jsx";
import DataState from "../DataState.jsx";

export default function AdminMessages() {
  const messages = useApi("/admin/mensajes");
  const categories = useCatalogCategories();
  const categoryName = Object.fromEntries(categories.map((item) => [item.slug, item.name]));
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const items = messages.status === "ready" ? (messages.data.items || []) : [];
  const messageState = messages.status === "ready" ? { ...messages, data: items } : messages;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const type = item.product || item.subjectType === "product" ? "product" : "general";
      const statusMatches = filter === "all" || filter === type || filter === item.status;
      const searchable = [item.name, item.email, item.message, item.product?.name, item.product?.work?.title].filter(Boolean).join(" ").toLocaleLowerCase();
      return statusMatches && (term === "" || searchable.includes(term));
    });
  }, [items, filter, search]);

  async function markReviewed(id) {
    setBusyId(id);
    setError("");
    try {
      await apiPost(`/admin/mensajes/${id}/revisado`, {});
      await messages.reload();
    } catch (failure) {
      setError(failure.message || "No pudimos actualizar el mensaje.");
    } finally { setBusyId(""); }
  }

  async function deleteMessage(id) {
    if (window.confirm("¿Borrar este mensaje? No se puede deshacer.") === false) return;
    setBusyId(id);
    setError("");
    try {
      await apiDelete(`/admin/mensajes/${id}`);
      await messages.reload();
    } catch (failure) {
      setError(failure.message || "No pudimos borrar el mensaje.");
    } finally { setBusyId(""); }
  }

  return (
    <section className="admin-messages" aria-labelledby="admin-messages-title">
      <header className="admin-section-intro"><div><p className="micro">Bandeja de entrada</p><h1 id="admin-messages-title">Mensajes</h1><p className="status">Identifica el origen de cada consulta, revisa la pieza relacionada y responde desde el canal adecuado.</p></div><span className="admin-section-intro__count">{filtered.length} / {items.length}</span></header>
      <div className="admin-message-tools">
        <label className="field">Buscar mensaje<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo, pieza u obra…" /></label>
        <label className="field">Mostrar<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos los mensajes</option><option value="general">Contacto general</option><option value="product">Consultas sobre piezas</option><option value="nuevo">Sin revisar</option><option value="revisado">Revisados</option></select></label>
      </div>
      {error ? <p className="status status--error" role="alert">{error}</p> : null}
      <DataState state={messageState} emptyText="Todavía no hay mensajes." render={() => filtered.length === 0 ? <div className="empty"><p>No hay mensajes que coincidan con la búsqueda.</p><button className="link-button" type="button" onClick={() => { setSearch(""); setFilter("all"); }}>Limpiar filtros</button></div> : (
        <ul className="admin-message-grid">
          {filtered.map((item) => {
            const isProduct = Boolean(item.product) || item.subjectType === "product";
            const category = item.product ? categoryName[item.product.category] || item.product.category : "";
            return (
              <li key={item._id} className={`admin-message-card${item.status === "nuevo" ? " admin-message-card--new" : ""}`}>
                <div className="admin-message-card__top"><span className={`admin-message-type ${isProduct ? "admin-message-type--product" : "admin-message-type--general"}`}>{isProduct ? "Consulta sobre pieza" : "Contacto general"}</span><span className={`admin-message-status admin-message-status--${item.status}`}>{item.status === "revisado" ? "Revisado" : "Sin revisar"}</span></div>
                <div className="admin-message-card__sender"><div><h2>{item.name}</h2><a href={`mailto:${item.email}`}>{item.email}</a></div><time>{new Date(item.createdAt).toLocaleString()}</time></div>
                {isProduct ? (
                  <div className="admin-message-product">
                    {item.product ? <>
                      <div className="admin-message-product__image"><ProductImage image={item.product.mainImage || (item.product.images || []).find((image) => image.isMain) || (item.product.images || [])[0]} product={{ name: item.product.name, category: item.product.category, work: item.product.work }} /></div>
                      <div><p className="micro">Pieza relacionada</p><h3><Link to={`/producto/${item.product.slug}`} target="_blank" rel="noreferrer">{item.product.name}</Link></h3><p>{category}{item.product.work ? ` · ${item.product.work.title}` : ""}</p></div>
                    </> : <p className="status">La pieza asociada ya no está en el catálogo; se conserva la consulta original.</p>}
                  </div>
                ) : <p className="admin-message-card__origin">Formulario de contacto general · Página de inicio</p>}
                <p className="admin-message-card__body">{item.message}</p>
                <div className="admin-message-card__actions">
                  <a className="btn-ghost" href={`mailto:${item.email}?subject=${encodeURIComponent(isProduct && item.product ? `Consulta: ${item.product.name}` : "Consulta sobre Yugen")}`}>Responder por correo</a>
                  {item.status === "nuevo" ? <button className="button" type="button" disabled={busyId === item._id} onClick={() => markReviewed(item._id)}>{busyId === item._id ? "Guardando…" : "Marcar revisado"}</button> : null}
                  <button className="link-button link-button--danger" type="button" disabled={busyId === item._id} onClick={() => deleteMessage(item._id)}>Borrar</button>
                </div>
              </li>
            );
          })}
        </ul>
      )} />
    </section>
  );
}
