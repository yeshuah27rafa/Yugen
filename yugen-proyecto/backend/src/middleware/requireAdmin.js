// middleware/requireAdmin.js
// Verifica la sesión del administrador leyendo la cookie httpOnly (el navegador la envía sola, JavaScript no la ve).
const jwt = require("jsonwebtoken");
const { SESSION_COOKIE } = require("../utils/cookies");

module.exports = function requireAdmin(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : undefined;
  if (token === undefined || token === "") {
    return res.status(401).json({ error: "Inicia sesión como administrador." });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  }
};
