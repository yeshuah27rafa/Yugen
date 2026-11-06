// utils/revokedSessions.js
// Revocación de sesiones. Persistente en MongoDB: sobrevive a reinicios y funciona con varias instancias.
// Sin conexión a la base (solo en pruebas sin base de datos) usa una lista en memoria.
const mongoose = require("mongoose");
const RevokedSession = require("../models/RevokedSession");

const memory = new Map();

function databaseReady() {
  return mongoose.connection.readyState === 1;
}

async function revoke(jti, expiresAtSeconds) {
  if (jti === undefined || expiresAtSeconds === undefined) return;
  const expiresAt = new Date(expiresAtSeconds * 1000);
  if (databaseReady()) {
    await RevokedSession.updateOne({ jti }, { $set: { jti, expiresAt } }, { upsert: true });
    return;
  }
  memory.set(jti, expiresAtSeconds);
}

async function isRevoked(jti) {
  if (jti === undefined) return true;
  if (databaseReady()) {
    return (await RevokedSession.exists({ jti })) !== null;
  }
  return memory.has(jti);
}

module.exports = { revoke, isRevoked };
