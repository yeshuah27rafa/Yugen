// utils/format.js
// Formatos compartidos: precio y etiquetas de disponibilidad en español.
export function formatPrice(value) {
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
