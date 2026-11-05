// middleware/requireCustomer.js
// Verifica la sesión de cliente: cookie propia, secreto propio, audiencia "cliente", no revocada y versión vigente.
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const { CUSTOMER_COOKIE } = require("../utils/cookies");
const { isRevoked } = require("../utils/revokedSessions");
const { readConfig } = require("../config/env");

module.exports = async function requireCustomer(req, res, next) {
  const token = req.cookies ? req.cookies[CUSTOMER_COOKIE] : undefined;
  if (token === undefined || token === "") {
    return res.status(401).json({ error: "Inicia sesión para continuar." });
  }
  try {
    const payload = jwt.verify(token, readConfig().customerJwtSecret, { algorithms: ["HS256"], audience: "cliente" });
    if (isRevoked(payload.jti)) {
      return res.status(401).json({ error: "Tu sesión se cerró. Vuelve a iniciar sesión." });
    }
    const customer = await Customer.findById(payload.sub);
    if (customer === null || customer.emailVerifiedAt === null || customer.tokenVersion !== payload.tv) {
      return res.status(401).json({ error: "Tu sesión ya no es válida. Vuelve a iniciar sesión." });
    }
    req.customer = {
      id: String(customer._id),
      name: customer.name,
      email: customer.email,
      csrf: payload.csrf,
      jti: payload.jti,
      exp: payload.exp
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  }
};
