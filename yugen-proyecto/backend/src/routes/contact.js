// routes/contact.js
// Formulario de contacto público. Valida los datos antes de guardar.
const express = require("express");
const Contact = require("../models/Contact");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim();
  const message = String(req.body.message || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (name === "" || message === "" || emailOk === false) {
    return res.status(400).json({ error: "Revisa tu nombre, correo y mensaje." });
  }
  await Contact.create({ name, email, message });
  return res.status(201).json({ ok: true });
}));

module.exports = router;
