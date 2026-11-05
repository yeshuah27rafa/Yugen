// routes/admin.js
// Gestión de piezas desde el panel. Todas las rutas exigen sesión válida; las escrituras exigen token CSRF.
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Work = require("../models/Work");
const requireAdmin = require("../middleware/requireAdmin");
const csrfProtection = require("../middleware/csrfProtection");
const asyncHandler = require("../utils/asyncHandler");
const validateProduct = require("../utils/validateProduct");

const router = express.Router();
const WORK_FIELDS = "title slug";

router.use(requireAdmin, csrfProtection);

router.get("/products", asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ updatedAt: -1 }).populate("work", WORK_FIELDS);
  return res.json(products);
}));

router.post("/products", asyncHandler(async (req, res) => {
  const result = validateProduct(req.body);
  if (result.errors.length > 0) {
    return res.status(400).json({ error: result.errors.join(" ") });
  }
  const workExists = await Work.exists({ _id: result.data.work });
  if (workExists === null) {
    return res.status(400).json({ error: "La obra seleccionada no existe." });
  }
  const created = await Product.create(result.data);
  const saved = await Product.findById(created._id).populate("work", WORK_FIELDS);
  return res.status(201).json(saved);
}));

router.put("/products/:id", asyncHandler(async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id) === false) {
    return res.status(404).json({ error: "Pieza no encontrada." });
  }
  const result = validateProduct(req.body);
  if (result.errors.length > 0) {
    return res.status(400).json({ error: result.errors.join(" ") });
  }
  const workExists = await Work.exists({ _id: result.data.work });
  if (workExists === null) {
    return res.status(400).json({ error: "La obra seleccionada no existe." });
  }
  const updated = await Product.findByIdAndUpdate(req.params.id, result.data, { new: true, runValidators: true })
    .populate("work", WORK_FIELDS);
  if (updated === null) {
    return res.status(404).json({ error: "Pieza no encontrada." });
  }
  return res.json(updated);
}));

router.delete("/products/:id", asyncHandler(async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id) === false) {
    return res.status(404).json({ error: "Pieza no encontrada." });
  }
  const removed = await Product.findByIdAndDelete(req.params.id);
  if (removed === null) {
    return res.status(404).json({ error: "Pieza no encontrada." });
  }
  return res.json({ ok: true });
}));

// Operaciones de solicitudes, clientes, mensajes e indicadores.
const ops = require("../services/adminRequestService");

router.get("/resumen", asyncHandler(async (req, res) => res.json(await ops.dashboard())));

router.get("/solicitudes", asyncHandler(async (req, res) => res.json(await ops.listRequests(req.query))));

router.get("/solicitudes/:id", asyncHandler(async (req, res) => {
  const detail = await ops.getRequest(req.params.id);
  if (detail === null) return res.status(404).json({ error: "Solicitud no encontrada." });
  return res.json(detail);
}));

router.post("/solicitudes/:id/estado", asyncHandler(async (req, res) => res.json(await ops.transition(req.params.id, req.body.to, req.admin.email))));

router.post("/solicitudes/:id/notas", asyncHandler(async (req, res) => res.status(201).json(await ops.addNote(req.params.id, req.body.text, req.admin.email))));

router.post("/solicitudes/:id/contactado", asyncHandler(async (req, res) => res.json(await ops.markContacted(req.params.id))));

router.post("/conciliar-pendientes", asyncHandler(async (req, res) => res.json(await ops.reconcilePending())));

router.get("/clientes", asyncHandler(async (req, res) => res.json({ items: await ops.listCustomers(req.query) })));

router.get("/mensajes", asyncHandler(async (req, res) => res.json({ items: await ops.listMessages() })));

router.post("/mensajes/:id/revisado", asyncHandler(async (req, res) => res.json(await ops.markMessageReviewed(req.params.id))));

module.exports = router;
