// services/tokenService.js
// Tokens de un solo uso para confirmar correo y recuperar contraseña.
// Se guarda solo el hash SHA-256: si la base se filtra, los tokens no sirven.
const crypto = require("crypto");

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function generateToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

// Formato válido: 64 caracteres hexadecimales. Rechazar otro formato evita inyección en consultas.
function isWellFormedToken(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

module.exports = { generateToken, hashToken, isWellFormedToken };
