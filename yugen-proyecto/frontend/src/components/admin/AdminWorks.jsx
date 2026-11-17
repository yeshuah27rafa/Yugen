// components/admin/AdminWorks.jsx
// Mantiene el índice editorial de obras y su visibilidad/orden en la portada.
import { useEffect, useState } from "react";
import { apiDelete, apiPost, apiPut } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";
import PieceArt from "../art/PieceArt.jsx";

const EMPTY = { title: "", slug: "", year: "", synopsis: "", cover: "", sortOrder: 0, showOnHome: true };

function WorkArtwork({ work, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [work.cover]);
  if (work.cover && !failed) return <img className={className} src={work.cover} alt="" loading="lazy" onError={() => setFailed(true)} />;
  return <PieceArt category="otro" seed={work.title} className={className} />;
}

function toDraft(work) {
  return work ? {
    title: work.title || "", slug: work.slug || "", year: work.year || "", synopsis: work.synopsis || "",
    cover: work.cover || "", sortOrder: work.sortOrder || 0, showOnHome: work.showOnHome !== false
  } : { ...EMPTY };
}

export default function AdminWorks() {
  const works = useApi("/admin/obras");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "", text: "" });

  function edit(work) {
    setEditing(work ? work._id : "new");
    setDraft(toDraft(work));
    setFeedback({ kind: "", text: "" });
  }
  function update(key, value) { setDraft((current) => ({ ...current, [key]: value })); }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback({ kind: "", text: "" });
    try {
      if (editing === "new") await apiPost("/admin/obras", draft);
      else await apiPut(`/admin/obras/${editing}`, draft);
      await works.reload();
      window.dispatchEvent(new Event("yugen:catalog-updated"));
      setEditing(null);
      setDraft(EMPTY);
      setFeedback({ kind: "success", text: "Obra guardada. El índice de colecciones se actualizará automáticamente." });
    } catch (error) {
      setFeedback({ kind: "error", text: error.message || "No pudimos guardar la obra." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(work) {
    if (!window.confirm(`¿Eliminar «${work.title}»? Solo se puede borrar si no tiene piezas asociadas.`)) return;
    setBusy(true);
    setFeedback({ kind: "", text: "" });
    try {
      await apiDelete(`/admin/obras/${work._id}`);
      await works.reload();
      window.dispatchEvent(new Event("yugen:catalog-updated"));
      setFeedback({ kind: "success", text: "Obra eliminada." });
    } catch (error) {
      setFeedback({ kind: "error", text: error.message || "No pudimos eliminar la obra." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-directory" aria-labelledby="admin-works-title">
      <header className="admin-panel__head">
        <div>
          <p className="micro">Colecciones e índice editorial</p>
          <h1 id="admin-works-title">Obras</h1>
          <p className="status">Añade obras, modifica sus datos y decide cuáles aparecen en el índice de la portada.</p>
        </div>
        {editing === null ? <button className="button" type="button" onClick={() => edit(null)}>Nueva obra</button> : null}
      </header>
      {feedback.text ? <p className={feedback.kind === "error" ? "status status--error" : "status"} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p> : null}

      {editing !== null ? (
        <form className="admin-form" onSubmit={save}>
          <h2>{editing === "new" ? "Nueva obra" : `Editar: ${draft.title}`}</h2>
          <section className="admin-form__section" aria-labelledby="work-info-title">
            <header className="admin-form__section-head"><div><p className="micro">01 · Identidad</p><h3 id="work-info-title">Información de la obra</h3></div><p>Nombre, enlace y posición dentro del índice editorial.</p></header>
          <div className="admin-grid">
            <label className="field">Título<input value={draft.title} maxLength={120} onChange={(event) => update("title", event.target.value)} required /></label>
            <label className="field">Slug<input value={draft.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(event) => update("slug", event.target.value.toLowerCase())} required /><span className="status">Se utiliza en el enlace de colección.</span></label>
            <label className="field">Año<input type="number" min="1900" max="2200" value={draft.year} onChange={(event) => update("year", event.target.value)} /></label>
            <label className="field">Orden en el índice<input type="number" min="0" max="9999" value={draft.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></label>
            <label className="field">Portada de la colección<input type="text" value={draft.cover} placeholder="https://… o /assets/…" onChange={(event) => update("cover", event.target.value)} /><span className="status">Esta imagen aparece en el índice y en la página propia de la colección. Puedes usar una URL pública o una ruta local de /assets/.</span></label>
            <label className="field field--check"><input type="checkbox" checked={draft.showOnHome} onChange={(event) => update("showOnHome", event.target.checked)} />Mostrar en el índice de la portada</label>
          </div>
          </section>
          <section className="admin-form__section" aria-labelledby="work-presentation-title">
            <header className="admin-form__section-head"><div><p className="micro">02 · Presentación</p><h3 id="work-presentation-title">Portada y descripción</h3></div><p>Estos datos aparecen en el índice de Home y en la página propia de la colección.</p></header>
          <label className="field">Sinopsis / descripción<textarea rows="4" maxLength={2000} value={draft.synopsis} onChange={(event) => update("synopsis", event.target.value)} /></label>
          <div className="admin-work-preview">
            <div className="admin-work-preview__image"><WorkArtwork work={{ cover: draft.cover, title: draft.title || "Colección" }} /></div>
            <div><p className="micro">Vista previa</p><h3>{draft.title || "Nombre de la obra"}</h3><p>{draft.synopsis || "La descripción aparecerá en la página de colección."}</p></div>
          </div>
          </section>
          <div className="form-foot">
            <button className="button" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar obra"}</button>
            <button className="btn-ghost" type="button" onClick={() => { setEditing(null); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <DataState state={works} emptyText="Todavía no hay obras registradas." render={(items) => (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Obra</th><th>Año</th><th>Descripción</th><th>Orden</th><th>Índice</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{items.map((work) => (
              <tr key={work._id}>
                <td data-label="Obra"><span className="admin-work-cell"><WorkArtwork work={work} /><span><strong>{work.title}</strong><small className="admin-table__sub">{work.slug}</small></span></span></td>
                <td data-label="Año">{work.year || "—"}</td><td data-label="Descripción" className="admin-work-description">{work.synopsis || "Sin descripción"}</td><td data-label="Orden">{work.sortOrder || 0}</td><td data-label="Índice">{work.showOnHome === false ? "Oculta" : "Visible"}</td>
                <td data-label="Acciones" className="admin-table__actions"><button className="link-button" type="button" onClick={() => edit(work)}>Editar</button><button className="link-button link-button--danger" type="button" disabled={busy} onClick={() => remove(work)}>Eliminar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )} />
    </section>
  );
}
