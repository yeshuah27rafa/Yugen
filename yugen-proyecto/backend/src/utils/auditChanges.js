// Compara valores normalizados y prepara un resumen seguro y legible de los campos que sí cambiaron.
const IGNORED_KEYS = new Set(["_id", "__v", "createdAt", "updatedAt"]);

function comparableValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (Array.isArray(value)) return value.map(comparableValue);
  if (value && typeof value.toObject === "function") {
    return comparableValue(value.toObject({ depopulate: true, getters: false, virtuals: false }));
  }
  if (typeof value === "object") {
    if (value._id !== undefined && value._id !== null) return comparableValue(value._id);
    return Object.keys(value).filter((key) => !IGNORED_KEYS.has(key)).sort().reduce((result, key) => {
      result[key] = comparableValue(value[key]);
      return result;
    }, {});
  }
  return value;
}

function safeText(value, maxLength = 150) {
  const normalized = String(value);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function resourceLabel(value, emptyLabel) {
  if (value === null || value === undefined || value === "") return emptyLabel;
  try {
    const url = new URL(String(value), "https://yugen.local");
    const file = url.pathname.split("/").filter(Boolean).pop();
    return file ? safeText(file, 100) : "Recurso configurado";
  } catch {
    return "Recurso configurado";
  }
}

function describeAuditValue(field, value) {
  if (value === null || value === undefined || value === "") return field === "price" ? "Consultar precio" : "Vacío";
  if (field === "work" && typeof value === "object" && value.title) return safeText(value.title);
  if (field === "images" && Array.isArray(value)) {
    if (value.length === 0) return "Sin imágenes";
    const main = value.find((image) => image && image.isMain) || value[0];
    return `${value.length} ${value.length === 1 ? "imagen" : "imágenes"}${main?.alt ? ` · Principal: ${safeText(main.alt, 70)}` : ""}`;
  }
  if (field === "specs" && Array.isArray(value)) {
    if (value.length === 0) return "Sin características";
    const sample = value.slice(0, 2).map((spec) => `${safeText(spec.label || "Dato", 35)}: ${safeText(spec.value || "—", 45)}`).join(" · ");
    return `${value.length} ${value.length === 1 ? "característica" : "características"}${sample ? ` · ${sample}` : ""}`;
  }
  if (["imageUrl", "cover"].includes(field)) return resourceLabel(value, field === "cover" ? "Sin portada" : "Sin imagen");
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return value;
  if (typeof value === "string") return safeText(value, ["description", "contexto", "synopsis"].includes(field) ? 180 : 150);
  if (Array.isArray(value)) return `${value.length} elementos`;
  return safeText(JSON.stringify(value));
}

function createAuditChanges(before, after, fields) {
  return fields.reduce((changes, field) => {
    const previous = before && typeof before.get === "function" ? before.get(field) : before?.[field];
    const next = after && typeof after.get === "function" ? after.get(field) : after?.[field];
    if (JSON.stringify(comparableValue(previous)) === JSON.stringify(comparableValue(next))) return changes;
    changes.push({
      field,
      before: describeAuditValue(field, previous),
      after: describeAuditValue(field, next)
    });
    return changes;
  }, []);
}

module.exports = { createAuditChanges };
