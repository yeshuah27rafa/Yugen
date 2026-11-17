// routes/admin.js
// Gestión de piezas desde el panel. Todas las rutas exigen sesión válida; las escrituras exigen token CSRF.
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Work = require("../models/Work");
const CatalogCategory = require("../models/CatalogCategory");
const Request = require("../models/Request");
const Contact = require("../models/Contact");
const Customer = require("../models/Customer");
const { recordAdminChange, listAdminChanges } = require("../services/auditLogService");
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
  const categoryExists = result.data.category
    ? await CatalogCategory.exists({ slug: result.data.category, active: true })
    : null;
  if (result.data.category && categoryExists === null) result.errors.push("La categoría seleccionada no existe o está desactivada.");
  if (result.errors.length > 0) {
    return res.status(400).json({ error: result.errors.join(" ") });
  }
  const workExists = await Work.exists({ _id: result.data.work });
  if (workExists === null) {
    return res.status(400).json({ error: "La obra seleccionada no existe." });
  }
  const created = await Product.create(result.data);
  const saved = await Product.findById(created._id).populate("work", WORK_FIELDS);
  await recordAdminChange(req.admin, { entityType: "pieza", entityId: created._id, entityLabel: saved.name, action: "creado", summary: "Se creó una pieza en el catálogo." });
  return res.status(201).json(saved);
}));

router.put("/products/:id", asyncHandler(async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id) === false) {
    return res.status(404).json({ error: "Pieza no encontrada." });
  }
  const currentProduct = await Product.findById(req.params.id).select("category name slug");
  if (currentProduct === null) return res.status(404).json({ error: "Pieza no encontrada." });
  const result = validateProduct(req.body);
  const categoryExists = result.data.category
    ? await CatalogCategory.exists({
        slug: result.data.category,
        $or: [{ active: true }, { active: false, slug: currentProduct.category }]
      })
    : null;
  if (result.data.category && categoryExists === null) result.errors.push("La categoría seleccionada no existe o está desactivada.");
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
  const changedFields = Object.keys(result.data);
  await recordAdminChange(req.admin, { entityType: "pieza", entityId: updated._id, entityLabel: updated.name, action: "actualizado", summary: "Se actualizaron los datos de la pieza.", details: { fields: changedFields } });
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
  await recordAdminChange(req.admin, { entityType: "pieza", entityId: removed._id, entityLabel: removed.name, action: "eliminado", summary: "Se eliminó una pieza del catálogo." });
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

router.post("/solicitudes/:id/estado", asyncHandler(async (req, res) => {
  const before = mongoose.isValidObjectId(req.params.id) ? await Request.findById(req.params.id).select("code status") : null;
  const result = await ops.transition(req.params.id, req.body.to, req.admin.email);
  if (before) await recordAdminChange(req.admin, { entityType: "solicitud", entityId: before._id, entityLabel: before.code, action: "estado", summary: `Estado actualizado: ${before.status} → ${result.status}.` });
  return res.json(result);
}));

router.post("/solicitudes/:id/notas", asyncHandler(async (req, res) => {
  const request = mongoose.isValidObjectId(req.params.id) ? await Request.findById(req.params.id).select("code") : null;
  const result = await ops.addNote(req.params.id, req.body.text, req.admin.email);
  if (request) await recordAdminChange(req.admin, { entityType: "solicitud", entityId: request._id, entityLabel: request.code, action: "nota", summary: "Se añadió una nota interna a la solicitud." });
  return res.status(201).json(result);
}));

router.post("/solicitudes/:id/contactado", asyncHandler(async (req, res) => {
  const request = mongoose.isValidObjectId(req.params.id) ? await Request.findById(req.params.id).select("code") : null;
  const result = await ops.markContacted(req.params.id);
  if (request) await recordAdminChange(req.admin, { entityType: "solicitud", entityId: request._id, entityLabel: request.code, action: "contactado", summary: "Se registró el contacto con el cliente." });
  return res.json(result);
}));

router.post("/conciliar-pendientes", asyncHandler(async (req, res) => {
  const result = await ops.reconcilePending();
  await recordAdminChange(req.admin, { entityType: "sistema", entityLabel: "Contadores de solicitudes", action: "ejecutado", summary: "Se conciliaron los contadores de solicitudes pendientes.", details: result });
  return res.json(result);
}));

router.get("/clientes", asyncHandler(async (req, res) => res.json({ items: await ops.listCustomers(req.query) })));

router.get("/mensajes", asyncHandler(async (req, res) => res.json({ items: await ops.listMessages() })));

router.post("/mensajes/:id/revisado", asyncHandler(async (req, res) => {
  const message = mongoose.isValidObjectId(req.params.id) ? await Contact.findById(req.params.id).select("name subjectType") : null;
  const result = await ops.markMessageReviewed(req.params.id);
  if (message) await recordAdminChange(req.admin, { entityType: "mensaje", entityId: message._id, entityLabel: message.subjectType === "product" ? "Consulta de producto" : "Contacto general", action: "revisado", summary: `Mensaje marcado como revisado (${message.subjectType === "product" ? "consulta de producto" : "contacto general"}).` });
  return res.json(result);
}));

// Gestión de categorías que alimentan el catálogo y la sección de exploración de la portada.
router.get("/catalog/categories", asyncHandler(async (req, res) => {
  const categories = await CatalogCategory.find({}).sort({ sortOrder: 1, name: 1 });
  return res.json(categories);
}));

function normalizeCategory(body) {
  const slug = String(body.slug || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const kanji = String(body.kanji || "").trim();
  const seed = String(body.seed || "Yugen").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const sortOrder = body.sortOrder === "" || body.sortOrder === undefined ? 0 : Number(body.sortOrder);
  const errors = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 40) errors.push("El identificador debe usar minúsculas, números y guiones.");
  if (name === "" || name.length > 60) errors.push("El nombre es obligatorio y no puede superar 60 caracteres.");
  if (description.length > 180 || kanji.length > 12 || seed.length > 80) errors.push("Revisa la longitud de la descripción o los recursos visuales.");
  const safeLocalAsset = /^\/assets\/[a-zA-Z0-9_./-]+$/.test(imageUrl) && !imageUrl.includes("..");
  const safeRemoteAsset = /^https?:\/\/[^\s]+$/i.test(imageUrl);
  if (imageUrl !== "" && !safeLocalAsset && !safeRemoteAsset) errors.push("La imagen debe usar una URL http(s) o una ruta local segura dentro de /assets/.");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) errors.push("El orden debe ser un entero entre 0 y 9999.");
  return { errors, data: { slug, name, description, kanji, seed, imageUrl, sortOrder, active: body.active !== false, showOnHome: body.showOnHome !== false } };
}

router.post("/catalog/categories", asyncHandler(async (req, res) => {
  const result = normalizeCategory(req.body);
  if (result.errors.length) return res.status(400).json({ error: result.errors.join(" ") });
  const created = await CatalogCategory.create(result.data);
  await recordAdminChange(req.admin, { entityType: "categoria", entityId: created._id, entityLabel: created.name, action: "creado", summary: "Se creó una categoría de catálogo." });
  return res.status(201).json(created);
}));

router.put("/catalog/categories/:id", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Categoría no encontrada." });
  const current = await CatalogCategory.findById(req.params.id);
  if (!current) return res.status(404).json({ error: "Categoría no encontrada." });
  const result = normalizeCategory(req.body);
  if (result.errors.length) return res.status(400).json({ error: result.errors.join(" ") });
  if (result.data.slug !== current.slug) {
    const used = await Product.countDocuments({ category: current.slug });
    if (used > 0) return res.status(409).json({ error: "No puedes cambiar el identificador mientras haya piezas usando esta categoría." });
  }
  const updated = await CatalogCategory.findByIdAndUpdate(req.params.id, { $set: result.data }, { new: true, runValidators: true });
  await recordAdminChange(req.admin, { entityType: "categoria", entityId: updated._id, entityLabel: updated.name, action: "actualizado", summary: "Se actualizaron los datos, visibilidad u orden de la categoría.", details: { fields: Object.keys(result.data) } });
  return res.json(updated);
}));

router.delete("/catalog/categories/:id", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Categoría no encontrada." });
  const category = await CatalogCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ error: "Categoría no encontrada." });
  const used = await Product.countDocuments({ category: category.slug });
  if (used > 0) return res.status(409).json({ error: `No se puede eliminar: ${used} piezas utilizan esta categoría. Desactívala o cambia primero esas piezas.` });
  await CatalogCategory.deleteOne({ _id: category._id });
  await recordAdminChange(req.admin, { entityType: "categoria", entityId: category._id, entityLabel: category.name, action: "eliminado", summary: "Se eliminó una categoría del catálogo." });
  return res.json({ ok: true });
}));

// Fase 11: borrado, obras y retención (todas detrás de sesión y CSRF por el router).
const retention = require("../services/retentionService");

router.delete("/clientes/:id", asyncHandler(async (req, res) => {
  const customer = mongoose.isValidObjectId(req.params.id) ? await Customer.findById(req.params.id).select("name") : null;
  const result = await ops.deleteCustomer(req.params.id, req.query.deleteRequests === "true");
  if (customer) await recordAdminChange(req.admin, { entityType: "cliente", entityId: customer._id, entityLabel: "Cuenta de cliente", action: "eliminado", summary: req.query.deleteRequests === "true" ? "Se eliminó la cuenta y sus solicitudes." : "Se eliminó la cuenta y se anonimizaron sus solicitudes." });
  return res.json(result);
}));

router.delete("/solicitudes/:id", asyncHandler(async (req, res) => {
  const request = mongoose.isValidObjectId(req.params.id) ? await Request.findById(req.params.id).select("code") : null;
  const result = await ops.deleteRequest(req.params.id);
  if (request) await recordAdminChange(req.admin, { entityType: "solicitud", entityId: request._id, entityLabel: request.code, action: "eliminado", summary: "Se eliminó una solicitud." });
  return res.json(result);
}));

router.delete("/mensajes/:id", asyncHandler(async (req, res) => {
  const message = mongoose.isValidObjectId(req.params.id) ? await Contact.findById(req.params.id).select("name subjectType") : null;
  const result = await ops.deleteMessage(req.params.id);
  if (message) await recordAdminChange(req.admin, { entityType: "mensaje", entityId: message._id, entityLabel: message.subjectType === "product" ? "Consulta de producto" : "Contacto general", action: "eliminado", summary: `Se eliminó un mensaje (${message.subjectType === "product" ? "consulta de producto" : "contacto general"}).` });
  return res.json(result);
}));

router.get("/obras", asyncHandler(async (req, res) => {
  const works = await Work.find({}).sort({ sortOrder: 1, title: 1 });
  return res.json(works);
}));

router.post("/obras", asyncHandler(async (req, res) => {
  const created = await ops.createWork(req.body);
  await recordAdminChange(req.admin, { entityType: "obra", entityId: created._id, entityLabel: created.title, action: "creado", summary: "Se añadió una obra al archivo de colecciones." });
  return res.status(201).json(created);
}));

router.put("/obras/:id", asyncHandler(async (req, res) => {
  const updated = await ops.updateWork(req.params.id, req.body);
  await recordAdminChange(req.admin, { entityType: "obra", entityId: updated._id, entityLabel: updated.title, action: "actualizado", summary: "Se actualizaron la presentación, sinopsis, portada u orden de la obra.", details: { fields: ["title", "slug", "year", "synopsis", "cover", "sortOrder", "showOnHome"].filter((field) => Object.prototype.hasOwnProperty.call(req.body || {}, field)) } });
  return res.json(updated);
}));

router.delete("/obras/:id", asyncHandler(async (req, res) => {
  const work = mongoose.isValidObjectId(req.params.id) ? await Work.findById(req.params.id).select("title") : null;
  const result = await ops.deleteWork(req.params.id);
  if (work) await recordAdminChange(req.admin, { entityType: "obra", entityId: work._id, entityLabel: work.title, action: "eliminado", summary: "Se eliminó una obra del archivo." });
  return res.json(result);
}));

router.post("/retencion/ejecutar", asyncHandler(async (req, res) => {
  const result = await retention.runRetention();
  await recordAdminChange(req.admin, { entityType: "sistema", entityLabel: "Retención de datos", action: "ejecutado", summary: "Se ejecutó manualmente el proceso de retención de datos.", details: result });
  return res.json(result);
}));

router.get("/registro-ediciones", asyncHandler(async (req, res) => res.json(await listAdminChanges(req.query))));

module.exports = router;
