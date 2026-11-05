// middleware/requireAdmin.js
// Verifica la sesión del administrador: cookie httpOnly, firma HS256, audiencia "admin" y no revocada.
const jwt = require("jsonwebtoken");
const { SESSION_COOKIE } = require("../utils/cookies");
const { isRevoked } = require("../utils/revokedSessions");
const { readConfig } = require("../config/env");

module.exports = function requireAdmin(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : undefined;
  if (token === undefined || token === "") {
    return res.status(401).json({ error: "Inicia sesión como administrador." });
  }
  try {
    const payload = jwt.verify(token, readConfig().jwtSecret, { algorithms: ["HS256"], audience: "admin" });
    if (isRevoked(payload.jti)) {
      return res.status(401).json({ error: "Tu sesión se cerró. Vuelve a iniciar sesión." });
    }
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  }
};
