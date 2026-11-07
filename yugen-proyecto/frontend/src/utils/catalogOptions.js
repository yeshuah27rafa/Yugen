// utils/catalogOptions.js
// Opciones de filtros y orden del catálogo. Los valores coinciden con los que acepta la API.
export const DEFAULT_SORT = "newest";

export const CATEGORY_OPTIONS = [
  { value: "", label: "Todo" },
  { value: "pin", label: "Pines" },
  { value: "manga", label: "Mangas" },
  { value: "figura", label: "Figuras" },
  { value: "mousepad", label: "Mousepads" }
];

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
