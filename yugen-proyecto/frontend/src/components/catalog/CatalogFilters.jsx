// components/catalog/CatalogFilters.jsx
// Barra de filtros: categorías, búsqueda por nombre, obra, disponibilidad y orden.
import { useEffect, useState } from "react";
import { AVAILABILITY_OPTIONS, CATEGORY_OPTIONS, SORT_OPTIONS } from "../../utils/catalogOptions.js";

// Espera a que el usuario deje de escribir antes de consultar la API.
const SEARCH_DELAY_MS = 350;

export default function CatalogFilters({ filters, works, onChange }) {
  const [draft, setDraft] = useState(filters.q);

  // Si la URL cambia desde fuera (por ejemplo, al limpiar filtros), el texto se actualiza.
  useEffect(() => {
    setDraft(filters.q);
  }, [filters.q]);

  // Confirma la búsqueda cuando el texto cambia y se detiene la escritura.
  useEffect(() => {
    if (draft === filters.q) return undefined;
    const timer = setTimeout(() => onChange("q", draft.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    onChange("q", draft.trim());
  }

  const workOptions = works.status === "ready" ? works.data : [];

  return (
    <div className="filter-bar">
      <div className="chips" role="group" aria-label="Categorías">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value || "todo"}
            type="button"
            className="chip"
            aria-pressed={filters.category === option.value}
            onClick={() => onChange("category", option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <form className="field" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="catalog-search">Buscar por nombre</label>
          <input
            id="catalog-search"
            type="search"
            value={draft}
            placeholder="Por ejemplo, Lain"
            onChange={(event) => setDraft(event.target.value)}
          />
        </form>

        <div className="field">
          <label htmlFor="catalog-work">Obra</label>
          <select id="catalog-work" value={filters.work} onChange={(event) => onChange("work", event.target.value)}>
            <option value="">Todas las obras</option>
            {workOptions.map((work) => (
              <option key={work._id} value={work.slug}>{work.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="catalog-availability">Disponibilidad</label>
          <select
            id="catalog-availability"
            value={filters.availability}
            onChange={(event) => onChange("availability", event.target.value)}
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value || "todas"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="catalog-sort">Ordenar</label>
          <select id="catalog-sort" value={filters.sort} onChange={(event) => onChange("sort", event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      {works.status === "error" ? (
        <p className="status status--error" role="alert">No pudimos cargar la lista de obras. Los demás filtros siguen funcionando.</p>
      ) : null}
    </div>
  );
}
