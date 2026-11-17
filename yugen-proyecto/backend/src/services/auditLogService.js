const AuditLog = require("../models/AuditLog");
const escapeRegex = require("../utils/escapeRegex");

async function recordAdminChange(admin, entry) {
  try {
    await AuditLog.create({
      actorLabel: String(admin?.email || "Administrador"),
      entityType: entry.entityType,
      entityId: entry.entityId ? String(entry.entityId) : "",
      entityLabel: String(entry.entityLabel || "Registro").slice(0, 180),
      action: entry.action,
      summary: String(entry.summary || "Se realizó un cambio.").slice(0, 500),
      details: entry.details || null
    });
  } catch (error) {
    // Un fallo del registro no debe convertir una modificación ya aplicada en un error aparente.
    console.error("No se pudo guardar el registro administrativo:", error.message);
  }
}

async function listAdminChanges(query = {}) {
  const filter = {};
  const allowed = ["pieza", "categoria", "obra", "solicitud", "mensaje", "cliente", "sistema"];
  if (allowed.includes(String(query.type || ""))) filter.entityType = String(query.type);
  if (query.action && ["creado", "actualizado", "eliminado", "estado", "nota", "contactado", "revisado", "ejecutado"].includes(String(query.action))) filter.action = String(query.action);
  const term = String(query.q || "").trim().slice(0, 100);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ entityLabel: pattern }, { summary: pattern }, { actorLabel: pattern }];
  }
  const limit = Math.min(200, Math.max(1, Number.parseInt(query.limit, 10) || 100));
  const items = await AuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).lean();
  return { items, total: await AuditLog.countDocuments(filter) };
}

module.exports = { recordAdminChange, listAdminChanges };
