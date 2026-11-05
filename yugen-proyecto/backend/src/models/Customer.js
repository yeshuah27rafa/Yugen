// models/Customer.js
// Cuenta de cliente. Separada de la administración: no tiene roles ni acceso al panel.
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  passwordHash: { type: String, required: true },
  emailVerifiedAt: { type: Date, default: null },
  // Aumenta al cambiar la contraseña: invalida todas las sesiones de cliente anteriores.
  tokenVersion: { type: Number, default: 0 },
  // Solo se guarda el hash de los tokens de un solo uso.
  verifyTokenHash: { type: String, default: null },
  verifyTokenExpires: { type: Date, default: null },
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
  privacyNoticeVersion: { type: String, default: "" },
  privacyAcceptedAt: { type: Date, default: null }
}, { timestamps: true });

// Consultas de tokens: índices dispersos para no ocupar espacio en cuentas sin token.
customerSchema.index({ verifyTokenHash: 1 }, { sparse: true });
customerSchema.index({ resetTokenHash: 1 }, { sparse: true });

module.exports = mongoose.model("Customer", customerSchema);
