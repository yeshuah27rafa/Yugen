// routes/products.js
// Productos: listado con filtros, destacados, novedades y detalle por slug.
const express = require("express");
const Product = require("../models/Product");
const Work = require("../models/Work");
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");

const router = express.Router();

// Orden permitido. Cualquier valor desconocido cae en "newest" para no aceptar consultas arbitrarias.
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 }
};

// Listado con búsqueda, filtros por categoría, obra y disponibilidad, y orden.
router.get("/", asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.availability) filter.availability = String(req.query.availability);
  if (req.query.q) filter.name = { $regex: escapeRegex(String(req.query.q)), $options: "i" };
  if (req.query.work) {
    const work = await Work.findOne({ slug: String(req.query.work) });
    if (work === null) return res.json([]);
    filter.work = work._id;
  }
  const sort = SORTS[req.query.sort] || SORTS.newest;
  const products = await Product.find(filter).sort(sort).populate("work", "title slug");
  return res.json(products);
}));

// Destacados para la selección de la portada.
router.get("/featured", asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true })
    .sort({ updatedAt: -1 })
    .limit(6)
    .populate("work", "title slug");
  return res.json(products);
}));

// Novedades: productos incorporados más recientemente.
router.get("/new", asyncHandler(async (req, res) => {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("work", "title slug");
  return res.json(products);
}));

// Detalle por slug (se usa en la etapa 3).
router.get("/:slug", asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("work", "title slug");
  if (product === null) {
    return res.status(404).json({ error: "Producto no encontrado." });
  }
  return res.json(product);
}));

module.exports = router;
