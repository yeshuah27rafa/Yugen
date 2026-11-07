// routes/works.js
// Catálogo de obras: se usa en la portada y en los filtros del catálogo.
const express = require("express");
const Work = require("../models/Work");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const works = await Work.find().sort({ title: 1 });
  return res.json(works);
}));

module.exports = router;
