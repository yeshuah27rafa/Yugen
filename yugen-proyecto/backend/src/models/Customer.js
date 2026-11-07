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
  privacyAcceptedAt: { type: Date, default: null },
  // Carrito guardado en la cuenta. Se fusiona con el del navegador al iniciar sesión.
  savedCart: {
    type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: { type: Number, min: 1, max: 10 } }],
    default: []
  },
  // Solicitudes en estado "nueva". Se modifica solo con operaciones atómicas (ver requestService).
  pendingRequestCount: { type: Number, default: 0, min: 0 },
  // Cambio de correo: el nuevo correo solo se aplica al confirmarlo desde el enlace.
  pendingEmail: { type: String, default: null },
  emailChangeTokenHash: { type: String, default: null },
  emailChangeExpires: { type: Date, default: null }
}, { timestamps: true });

// Consultas de tokens: índices dispersos para no ocupar espacio en cuentas sin token.
customerSchema.index({ verifyTokenHash: 1 }, { sparse: true });
customerSchema.index({ resetTokenHash: 1 }, { sparse: true });

module.exports = mongoose.model("Customer", customerSchema);
