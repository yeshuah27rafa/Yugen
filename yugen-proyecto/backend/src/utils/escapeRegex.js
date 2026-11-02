// utils/escapeRegex.js
// Escapa caracteres especiales para que la búsqueda por texto se trate como texto literal.
module.exports = function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
