// components/admin/AdminCatalogManager.jsx
// Administra las categorías, sus textos y los recursos gráficos de la sección de exploración.
import { useState } from "react";
import { apiDelete, apiPost, apiPut } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";
import CategoryArtwork from "../home/CategoryArtwork.jsx";

const EMPTY = {
  name: "", slug: "", description: "", kanji: "", seed: "Yugen", imageUrl: "",
  sortOrder: "0", active: true, showOnHome: true
};

function toDraft(category) {
  return category ? {
    name: category.name || "", slug: category.slug || "", description: category.description || "",
    kanji: category.kanji || "", seed: category.seed || "Yugen", imageUrl: category.imageUrl || "",
    sortOrder: String(Number.isInteger(category.sortOrder) ? category.sortOrder : 0), active: category.active !== false, showOnHome: category.showOnHome !== false
  } : { ...EMPTY };
}

export default function AdminCatalogManager() {
  const categories = useApi("/admin/catalog/categories");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "", text: "" });

  function edit(category) {
    setEditing(category ? category._id : "new");
    setDraft(toDraft(category));
    setFeedback({ kind: "", text: "" });
  }

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    const sortOrder = Number(draft.sortOrder);
    if (draft.sortOrder === "" || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      setFeedback({ kind: "error", text: "El orden debe ser un número entero entre 0 y 9999." });
      return;
    }
    const payload = { ...draft, sortOrder };
    setBusy(true);
    setFeedback({ kind: "", text: "" });
    try {
      if (editing === "new") await apiPost("/admin/catalog/categories", payload);
      else await apiPut(`/admin/catalog/categories/${editing}`, payload);
      await categories.reload();
      window.dispatchEvent(new Event("yugen:catalog-updated"));
      setEditing(null);
      setDraft(EMPTY);
      setFeedback({ kind: "success", text: "Categoría guardada. El catálogo y la portada recibirán los cambios." });
    } catch (error) {
      setFeedback({ kind: "error", text: error.message || "No pudimos guardar la categoría." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(category) {
    if (!window.confirm(`¿Eliminar la categoría «${category.name}»? Si tiene piezas asignadas, primero tendrás que moverlas a otra categoría.`)) return;
    setBusy(true);
    setFeedback({ kind: "", text: "" });
    try {
      await apiDelete(`/admin/catalog/categories/${category._id}`);
      await categories.reload();
      window.dispatchEvent(new Event("yugen:catalog-updated"));
      setFeedback({ kind: "success", text: "Categoría eliminada." });
    } catch (error) {
      setFeedback({ kind: "error", text: error.message || "No pudimos eliminar la categoría." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-directory" aria-labelledby="admin-categories-title">
      <header className="admin-panel__head">
        <div>
          <p className="micro">Estructura de la tienda</p>
          <h1 id="admin-categories-title">Categorías</h1>
          <p className="status">Controla qué filtros aparecen en el catálogo y qué paneles se muestran en la portada.</p>
        </div>
        {editing === null ? <button className="button" type="button" onClick={() => edit(null)}>Nueva categoría</button> : null}
      </header>

      {feedback.text ? <p className={feedback.kind === "error" ? "status status--error" : "status"} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p> : null}

      {editing !== null ? (
        <form className="admin-form" onSubmit={save} aria-busy={busy}>
          <h2>{editing === "new" ? "Nueva categoría" : `Editar: ${draft.name}`}</h2>
          <section className="admin-form__section" aria-labelledby="category-data-title">
            <header className="admin-form__section-head"><div><p className="micro">01 · Identidad</p><h3 id="category-data-title">Nombre y contenido</h3></div><p>Define cómo se presenta la categoría en filtros, tarjetas y navegación.</p></header>
          <div className="admin-grid">
            <label className="field">Nombre visible<input value={draft.name} maxLength={60} onChange={(event) => update("name", event.target.value)} required /></label>
            <label className="field">Identificador / slug<input value={draft.slug} maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(event) => update("slug", event.target.value.toLowerCase())} required /><span className="status">Se usa en enlaces y filtros. Evita cambiarlo cuando ya tenga piezas.</span></label>
            <label className="field">Texto de la tarjeta<textarea rows="2" maxLength={180} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
            <label className="field">Carácter / microtexto<input value={draft.kanji} maxLength={12} onChange={(event) => update("kanji", event.target.value)} /><span className="status">Opcional; puede ser texto japonés, símbolo o dejarse vacío.</span></label>
            <label className="field">Semilla de ilustración<input value={draft.seed} maxLength={80} onChange={(event) => update("seed", event.target.value)} /><span className="status">Modifica la ilustración SVG generada cuando no se usa una imagen propia.</span></label>
            <label className="field">Imagen de categoría · reemplaza la ilustración<input type="text" value={draft.imageUrl} placeholder="https://… o /assets/…" onChange={(event) => update("imageUrl", event.target.value)} /><span className="status">Usa una URL pública o un archivo dentro de /assets/. Si dejas el campo vacío, se usa la ilustración generada a partir de la semilla.</span></label>
            <label className="field">Orden<input type="number" min="0" max="9999" step="1" required value={draft.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} /><span className="status">Número entero de prioridad; los valores menores aparecen primero.</span></label>
            <label className="field field--check"><input type="checkbox" checked={draft.active} onChange={(event) => update("active", event.target.checked)} />Visible en el catálogo y filtros</label>
            <label className="field field--check"><input type="checkbox" checked={draft.showOnHome} onChange={(event) => update("showOnHome", event.target.checked)} />Mostrar en «Formas de llevarse una obra»</label>
          </div>
          </section>
          <section className="admin-form__section" aria-labelledby="category-preview-title">
            <header className="admin-form__section-head"><div><p className="micro">02 · Apariencia</p><h3 id="category-preview-title">Vista previa</h3></div><p>Comprueba la imagen y el texto antes de guardar.</p></header>
          <div className="admin-category-editor-preview">
            <div className="admin-category-editor-preview__art"><CategoryArtwork category={{ ...draft, slug: draft.slug || "otro", name: draft.name || "Categoría" }} /></div>
            <div><p className="micro">Vista previa</p><h3>{draft.name || "Nombre de la categoría"}</h3><p>{draft.description || "El texto breve aparecerá en la portada."}</p>{draft.imageUrl ? <button className="link-button" type="button" onClick={() => update("imageUrl", "")}>Usar ilustración generada ↺</button> : <span className="status">Ilustración generada activa.</span>}</div>
          </div>
          </section>
          <div className="form-foot">
            <button className="button" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar categoría"}</button>
            <button className="btn-ghost" type="button" onClick={() => { setEditing(null); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <DataState state={categories} emptyText="Todavía no hay categorías configuradas." render={(items) => (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Categoría</th><th>Slug</th><th>Orden</th><th>Catálogo</th><th>Portada</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{items.map((category) => (
              <tr key={category._id}>
                <td data-label="Categoría"><span className="admin-category-cell"><span className="admin-category-cell__art"><CategoryArtwork category={category} /></span><span><strong>{category.name}</strong><small className="admin-table__sub">{category.description}</small></span></span></td>
                <td data-label="Slug"><code>{category.slug}</code></td>
                <td data-label="Orden">{category.sortOrder}</td>
                <td data-label="Catálogo">{category.active ? "Visible" : "Oculta"}</td>
                <td data-label="Portada">{category.showOnHome && category.active ? "Visible" : "No"}</td>
                <td data-label="Acciones" className="admin-table__actions"><button className="link-button" type="button" onClick={() => edit(category)}>Editar</button><button className="link-button link-button--danger" type="button" disabled={busy} onClick={() => remove(category)}>Eliminar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )} />
    </section>
  );
}
