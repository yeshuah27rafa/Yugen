// utils/revokedSessions.js
// Lista de sesiones cerradas (identificador jti) hasta su fecha de caducidad.
// Limitación: vive en memoria; se vacía al reiniciar el servidor y no se comparte entre varias instancias.
const revoked = new Map();

function purgeExpired() {
  const now = Date.now();
  revoked.forEach((expiresAtSeconds, jti) => {
    if (expiresAtSeconds * 1000 < now) revoked.delete(jti);
  });
}

function revoke(jti, expiresAtSeconds) {
  if (jti === undefined || expiresAtSeconds === undefined) return;
  revoked.set(jti, expiresAtSeconds);
  purgeExpired();
}

function isRevoked(jti) {
  if (jti === undefined) return true;
  return revoked.has(jti);
}

module.exports = { revoke, isRevoked };
