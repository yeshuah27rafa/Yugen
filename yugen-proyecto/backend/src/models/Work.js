// models/Work.js
// Obra (serie o película) a la que pertenecen los productos. Permite filtrar y explorar por obra.
const mongoose = require("mongoose");

const workSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  year: { type: Number },
  synopsis: { type: String, default: "" },
  cover: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Work", workSchema);
