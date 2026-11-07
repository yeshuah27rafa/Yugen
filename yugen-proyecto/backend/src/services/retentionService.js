// services/retentionService.js
// Retención de datos personales (decisión: 24 meses para solicitudes cerradas; 30 días para cuentas sin verificar).
// Se ejecuta cada día desde el servidor y también puede lanzarse desde el panel.
const Request = require("../models/Request");
const Customer = require("../models/Customer");

const FINAL_STATUSES = ["completada", "rechazada", "cancelada"];
const REQUEST_RETENTION_MONTHS = 24;
const UNVERIFIED_RETENTION_DAYS = 30;

async function runRetention(now) {
  const current = now || new Date();
  const requestCutoff = new Date(current);
  requestCutoff.setMonth(requestCutoff.getMonth() - REQUEST_RETENTION_MONTHS);

  // Solicitudes cerradas antes del plazo: se anonimizan (no se borran; conservan productos y fechas).
  const anonymized = await Request.updateMany(
    { status: { $in: FINAL_STATUSES }, updatedAt: { $lt: requestCutoff }, anonymizedAt: null },
    { $set: { "contact.name": "Cliente anonimizado", "contact.email": "anonimo@eliminado.local", "contact.whatsapp": "", "contact.altEmail": "", anonymizedAt: current } }
  );

  // Cuentas que nunca confirmaron el correo y tienen más de 30 días: se eliminan.
  const unverifiedCutoff = new Date(current.getTime() - UNVERIFIED_RETENTION_DAYS * 24 * 3600 * 1000);
  const removed = await Customer.deleteMany({ emailVerifiedAt: null, createdAt: { $lt: unverifiedCutoff } });

  return { requestsAnonymized: anonymized.modifiedCount, unverifiedAccountsRemoved: removed.deletedCount };
}

module.exports = { runRetention, REQUEST_RETENTION_MONTHS, UNVERIFIED_RETENTION_DAYS };
