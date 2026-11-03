// routes/contact.js
// Formulario de contacto público. Valida los datos antes de guardar y asocia la consulta a un producto si se indica.
const express = require("express");
const Contact = require("../models/Contact");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
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
