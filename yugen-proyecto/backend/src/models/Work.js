// models/Work.js
// Obra (serie o película) a la que pertenecen los productos. Permite filtrar y explorar por obra.
const mongoose = require("mongoose");

const workSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  year: { type: Number },
  synopsis: { type: String, default: "" },
  cover: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 },
  showOnHome: { type: Boolean, default: true }
}, { timestamps: true });

workSchema.index({ showOnHome: 1, sortOrder: 1, title: 1 });

module.exports = mongoose.model("Work", workSchema);
