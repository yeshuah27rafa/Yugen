// Tabla de piezas del panel con búsqueda, filtros dinámicos y acciones de edición/eliminación.
import { useMemo, useState } from "react";
import { availabilityLabel, categoryLabel, formatPrice } from "../../utils/format.js";

const AVAILABILITY = [
  { value: "", label: "Cualquier disponibilidad" },
  { value: "en_stock", label: "En stock" },
  { value: "pedido_exterior", label: "Pedido al exterior" },
  { value: "agotado", label: "Agotado" }
];

export default function ProductList({ products, categories = [], onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const labelBySlug = Object.fromEntries(categories.map((item) => [item.slug, item.name]));
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesText = term === "" || [product.name, product.slug, product.work?.title]
        .some((value) => String(value || "").toLocaleLowerCase().includes(term));
      return matchesText && (category === "" || product.category === category)
        && (availability === "" || product.availability === availability);
    });
  }, [products, query, category, availability]);

  return (
    <section className="admin-products" aria-label="Inventario de piezas">
      <div className="admin-filters admin-products__filters">
        <label className="field">
          Buscar pieza u obra
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, slug u obra…" />
        </label>
        <label className="field">
          Categoría
          <select className="admin-select" aria-label="Filtrar por categoría" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}{item.active === false ? " · oculta" : ""}</option>)}
          </select>
        </label>
        <label className="field">
          Disponibilidad
          <select className="admin-select" aria-label="Filtrar por disponibilidad" value={availability} onChange={(event) => setAvailability(event.target.value)}>
            {AVAILABILITY.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <p className="status admin-products__count" aria-live="polite">{filtered.length} de {products.length} piezas</p>
      </div>
      {filtered.length === 0 ? (
        <div className="empty"><p>No hay piezas que coincidan con esos filtros.</p><button type="button" className="link-button" onClick={() => { setQuery(""); setCategory(""); setAvailability(""); }}>Limpiar filtros</button></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Pieza</th>
                <th scope="col">Categoría</th>
                <th scope="col">Obra</th>
                <th scope="col">Precio</th>
                <th scope="col">Disponibilidad</th>
                <th scope="col">Hero · orden</th>
                <th scope="col">Recomendación · orden</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product._id}>
                  <td data-label="Pieza">{product.name}<small className="admin-table__sub">{product.slug}</small></td>
                  <td data-label="Categoría">{labelBySlug[product.category] || categoryLabel(product.category)}</td>
                  <td data-label="Obra">{product.work ? product.work.title : "—"}</td>
                  <td data-label="Precio">{formatPrice(product.price)}</td>
                  <td data-label="Disponibilidad">{availabilityLabel(product.availability)}</td>
                  <td data-label="Hero · orden">{product.featured ? `Sí · ${product.featuredOrder ?? 0}` : "No"}</td>
                  <td data-label="Recomendación · orden">{product.recommended ? `Sí · ${product.recommendedOrder ?? 0}` : "No"}</td>
                  <td data-label="Acciones" className="admin-table__actions">
                    <button type="button" className="link-button" onClick={() => onEdit(product)}>Editar</button>
                    <button type="button" className="link-button link-button--danger" onClick={() => onDelete(product)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
