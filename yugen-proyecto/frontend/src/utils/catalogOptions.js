// utils/catalogOptions.js
// Opciones de filtros y orden del catálogo. Los valores coinciden con los que acepta la API.
export const DEFAULT_SORT = "newest";

// Respaldo visual si la API de categorías no está disponible. En operación normal
// las opciones provienen de CatalogCategory y se administran desde el panel.
export const DEFAULT_CATEGORY_OPTIONS = [
  { value: "pin", label: "Pines" },
  { value: "manga", label: "Mangas" },
  { value: "figura", label: "Figuras" },
  { value: "mousepad", label: "Mousepads" }
];

export const CATEGORY_OPTIONS = [
  { value: "", label: "Todo" },
  ...DEFAULT_CATEGORY_OPTIONS
];

export function categoryOptionsFromState(state, includeAll = true) {
  const categories = state && state.status === "ready" && Array.isArray(state.data)
    ? state.data
    : DEFAULT_CATEGORY_OPTIONS.map((item, index) => ({ slug: item.value, name: item.label, sortOrder: index }));
  const options = categories.filter((category) => category.active !== false)
    .map((category) => ({ value: category.slug, label: category.name }));
  return includeAll ? [{ value: "", label: "Todo" }, ...options] : options;
}

export const AVAILABILITY_OPTIONS = [
  { value: "", label: "Cualquier disponibilidad" },
  { value: "en_stock", label: "En stock" },
  { value: "pedido_exterior", label: "Pedido al exterior" },
  { value: "agotado", label: "Agotado" }
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Novedades" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" }
];
