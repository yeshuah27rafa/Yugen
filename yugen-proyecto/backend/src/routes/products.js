// routes/products.js
// Productos: listado con filtros, destacados, novedades y detalle por slug.
const express = require("express");
const Product = require("../models/Product");
const Work = require("../models/Work");
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");

const router = express.Router();

// Orden permitido. Cualquier otro valor se trata como "newest" para no aceptar consultas arbitrarias.
const SORT_KEYS = ["newest", "price_asc", "price_desc"];
const SORT_FIELDS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 }
};
const WORK_FIELDS = "title slug";

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

  const requested = String(req.query.sort || "");
  const sortKey = SORT_KEYS.includes(requested) ? requested : "newest";

  if (sortKey === "newest") {
    const products = await Product.find(filter).sort(SORT_FIELDS.newest).populate("work", WORK_FIELDS);
    return res.json(products);
  }

  // Al ordenar por precio, los productos sin precio se añaden al final, no al inicio.
  const priced = await Product.find({ ...filter, price: { $ne: null } })
    .sort(SORT_FIELDS[sortKey])
    .populate("work", WORK_FIELDS);
  const unpriced = await Product.find({ ...filter, price: null })
    .sort(SORT_FIELDS.newest)
    .populate("work", WORK_FIELDS);
  return res.json(priced.concat(unpriced));
}));

// Destacados para la selección de la portada.
router.get("/featured", asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true })
    .sort({ updatedAt: -1 })
    .limit(6)
    .populate("work", WORK_FIELDS);
  return res.json(products);
}));

// Novedades: productos incorporados más recientemente.
router.get("/new", asyncHandler(async (req, res) => {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("work", WORK_FIELDS);
  return res.json(products);
}));

// Detalle por slug (se usa en la etapa 3).
router.get("/:slug", asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("work", WORK_FIELDS);
  if (product === null) {
    return res.status(404).json({ error: "Producto no encontrado." });
  }
  return res.json(product);
}));

module.exports = router;
