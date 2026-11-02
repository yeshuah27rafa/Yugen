// middleware/requireAdmin.js
// Verifica el JWT del administrador. En la etapa 4 este token pasará a cookie httpOnly.
const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token === "") {
    return res.status(401).json({ error: "Inicia sesión como administrador." });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  }
};
