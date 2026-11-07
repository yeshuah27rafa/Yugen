// utils/phone.js
// Normaliza un WhatsApp panameño: 8 dígitos locales, con o sin prefijo 507.
// Devuelve el número local de 8 dígitos o null si no es válido.
function normalizePanamaWhatsapp(raw) {
  const digits = String(raw || "").replace(/[\s\-()+]/g, "");
  let local = digits;
  if (local.length === 11 && local.startsWith("507")) {
    local = local.slice(3);
  }
  if (/^\d{8}$/.test(local) === false) return null;
  return local;
}

module.exports = { normalizePanamaWhatsapp };
