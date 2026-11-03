// utils/format.js
// Formatos compartidos: precio (opcional), etiquetas de disponibilidad y categoría en español.
export function formatPrice(value) {
  if (value === null || value === undefined) return "Consultar precio";
  return "$" + Number(value).toFixed(2);
}

const AVAILABILITY_LABELS = {
  en_stock: "En stock",
  agotado: "Agotado",
  pedido_exterior: "Pedido al exterior"
};

export function availabilityLabel(value) {
  return AVAILABILITY_LABELS[value] || "Consultar";
}

const CATEGORY_LABELS = {
  pin: "Pin",
  manga: "Manga",
  figura: "Figura",
  mousepad: "Mousepad",
  otro: "Otro"
};

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || "Otro";
}
