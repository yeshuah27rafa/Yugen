// middleware/csrfProtection.js
// Protección CSRF por token sincronizado. Debe ir después de requireAdmin.
// Un sitio ajeno puede hacer que el navegador envíe la cookie, pero no puede leer el token ni poner la cabecera X-CSRF-Token.
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

module.exports = function csrfProtection(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();
  const header = req.get("X-CSRF-Token");
  if (header === undefined || header !== req.admin.csrf) {
    return res.status(403).json({ error: "Tu sesión no es válida para esta acción. Recarga la página e intenta de nuevo." });
  }
  return next();
};
