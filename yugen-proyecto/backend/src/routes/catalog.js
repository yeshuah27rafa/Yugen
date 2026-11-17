// routes/catalog.js
// Opciones públicas del catálogo administrables desde la interfaz.
const express = require("express");
const CatalogCategory = require("../models/CatalogCategory");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/categories", asyncHandler(async (req, res) => {
  const categories = await CatalogCategory.find({ active: true })
    .sort({ sortOrder: 1, name: 1 })
    .select("slug name description kanji seed imageUrl sortOrder showOnHome");
  return res.json(categories);
}));

module.exports = router;
