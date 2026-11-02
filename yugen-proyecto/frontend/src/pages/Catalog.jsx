// pages/Catalog.jsx
// Catálogo: combina los filtros de la URL con la lista de productos que devuelve la API.
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { useCatalogFilters } from "../hooks/useCatalogFilters.js";
import CatalogFilters from "../components/catalog/CatalogFilters.jsx";
import ProductCard from "../components/ProductCard.jsx";
import DataState from "../components/DataState.jsx";

export default function Catalog() {
  const { filters, updateFilter, clearFilters, queryString, hasActiveFilters } = useCatalogFilters();
  const products = useApi("/products?" + queryString);
  const works = useApi("/works");

  return (
    <section className="catalog-page">
      <header className="section__head">
        <div>
          <h1>Catálogo</h1>
        </div>
        <p>Consulta disponibilidad y precio. Coordinamos la compra directamente contigo.</p>
      </header>

      <CatalogFilters filters={filters} works={works} onChange={updateFilter} />

      {products.status === "ready" ? (
        <p className="catalog-count" aria-live="polite">
          {products.data.length === 1 ? "1 pieza" : `${products.data.length} piezas`}
        </p>
      ) : null}

      <DataState
        state={products}
        emptyText={<EmptyResults hasActiveFilters={hasActiveFilters} onClear={clearFilters} />}
        render={(items) => (
          <div className="grid">
            {items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      />
    </section>
  );
}

// Estado vacío: distingue "no hay coincidencias con mis filtros" de "todavía no hay piezas".
function EmptyResults({ hasActiveFilters, onClear }) {
  return (
    <div className="empty">
      {hasActiveFilters ? (
        <>
          <p>No encontramos piezas con esos criterios.</p>
          <button type="button" className="link-button" onClick={onClear}>Limpiar filtros</button>
        </>
      ) : (
        <p>Todavía no hay piezas en el catálogo.</p>
      )}
      <Link className="link-button" to="/#contacto">¿Buscas algo en específico? Escríbenos.</Link>
    </div>
  );
}
