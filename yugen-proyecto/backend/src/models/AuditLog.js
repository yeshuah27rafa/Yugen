// Registro de cambios administrativos. No almacena contraseñas, tokens ni el contenido privado de mensajes/solicitudes.
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actorLabel: { type: String, required: true, trim: true, maxlength: 254 },
  entityType: { type: String, required: true, enum: ["pieza", "categoria", "obra", "solicitud", "mensaje", "cliente", "sistema"] },
  entityId: { type: String, default: "", maxlength: 80 },
  entityLabel: { type: String, required: true, trim: true, maxlength: 180 },
  action: { type: String, required: true, enum: ["creado", "actualizado", "eliminado", "estado", "nota", "contactado", "revisado", "ejecutado"] },
  summary: { type: String, required: true, trim: true, maxlength: 500 },
  details: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
