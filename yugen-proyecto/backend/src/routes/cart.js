// routes/cart.js
// Carrito: vista pública para invitados y guardado en cuenta para clientes verificados.
const express = require("express");
const Customer = require("../models/Customer");
const asyncHandler = require("../utils/asyncHandler");
const requireCustomer = require("../middleware/requireCustomer");
const customerCsrf = require("../middleware/customerCsrf");
const { validateLines, mergeLines, enrichLines } = require("../services/cartService");

const router = express.Router();

// Invitado: revisa su carrito del navegador con datos actuales (precio, disponibilidad).
router.post("/resumen", asyncHandler(async (req, res) => {
  const checked = validateLines(req.body.items);
  if (checked.errors.length > 0) return res.status(400).json({ error: checked.errors.join(" ") });
  return res.json({ lines: await enrichLines(checked.lines) });
}));

router.get("/", requireCustomer, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer.id);
  const lines = customer.savedCart.map((line) => ({ productId: String(line.product), quantity: line.quantity }));
  return res.json({ lines: await enrichLines(lines) });
}));

// Reemplaza el carrito guardado por el enviado (cambios hechos con la cuenta abierta).
router.put("/", requireCustomer, customerCsrf, asyncHandler(async (req, res) => {
  const checked = validateLines(req.body.items);
  if (checked.errors.length > 0) return res.status(400).json({ error: checked.errors.join(" ") });
  await Customer.updateOne({ _id: req.customer.id }, { $set: { savedCart: checked.lines.map((line) => ({ product: line.productId, quantity: line.quantity })) } });
  return res.json({ lines: await enrichLines(checked.lines) });
}));

// Al iniciar sesión: suma el carrito del navegador al de la cuenta, sin duplicar líneas.
router.post("/fusionar", requireCustomer, customerCsrf, asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer.id);
  const serverLines = customer.savedCart.map((line) => ({ productId: String(line.product), quantity: line.quantity }));
  const guestLines = Array.isArray(req.body.items) ? req.body.items : [];
  const merged = mergeLines(serverLines, guestLines);
  await Customer.updateOne({ _id: req.customer.id }, { $set: { savedCart: merged.map((line) => ({ product: line.productId, quantity: line.quantity })) } });
  return res.json({ lines: await enrichLines(merged) });
}));

module.exports = router;
