// routes/works.js
// Catálogo de obras: se usa en la portada y en los filtros del catálogo.
const express = require("express");
const Work = require("../models/Work");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const works = await Work.find().sort({ sortOrder: 1, title: 1 });
  return res.json(works);
}));

router.get("/:slug", asyncHandler(async (req, res) => {
  const work = await Work.findOne({ slug: String(req.params.slug || "").toLowerCase() });
  if (work === null) return res.status(404).json({ error: "Colección no encontrada." });
  return res.json(work);
}));

module.exports = router;
