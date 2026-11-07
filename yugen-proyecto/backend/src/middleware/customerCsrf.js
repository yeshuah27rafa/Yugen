// middleware/customerCsrf.js
// CSRF para escrituras de cliente. Debe ir después de requireCustomer.
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

module.exports = function customerCsrf(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();
  const header = req.get("X-CSRF-Token");
  if (header === undefined || header !== req.customer.csrf) {
    return res.status(403).json({ error: "Tu sesión no es válida para esta acción. Recarga la página e intenta de nuevo." });
  }
  return next();
};
