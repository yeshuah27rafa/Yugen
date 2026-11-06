// routes/contact.js
// Formulario de contacto público y datos de contacto de la tienda.
const express = require("express");
const rateLimit = require("express-rate-limit");
const Contact = require("../models/Contact");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const honeypot = require("../middleware/honeypot");
const { readConfig } = require("../config/env");

const router = express.Router();

// Límite de envíos del formulario por IP en 15 minutos (configurable con CONTACT_MAX_ATTEMPTS).
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: readConfig().contactMaxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Has enviado demasiados mensajes. Espera unos minutos e intenta de nuevo." }
});

// Datos de contacto para quien no quiere crear cuenta.
router.get("/tienda", (req, res) => {
  const config = readConfig();
  return res.json({ email: config.contactEmail, whatsapp: config.contactWhatsapp });
});

router.post("/", contactLimiter, honeypot, asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim();
  const message = String(req.body.message || "").trim();
  const productSlug = String(req.body.productSlug || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (name === "" || message === "" || emailOk === false) {
    return res.status(400).json({ error: "Revisa tu nombre, correo y mensaje." });
  }

  let productId = null;
  if (productSlug !== "") {
    const product = await Product.findOne({ slug: productSlug });
    if (product === null) {
      return res.status(400).json({ error: "La pieza indicada ya no está disponible para consulta." });
    }
    productId = product._id;
  }

  await Contact.create({ name, email, message, product: productId });
  return res.status(201).json({ ok: true });
}));

module.exports = router;
