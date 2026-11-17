// models/CatalogCategory.js
// Categorías editables desde el panel: alimentan el catálogo, la navegación y la portada.
const mongoose = require("mongoose");

const catalogCategorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, default: "", trim: true, maxlength: 180 },
  kanji: { type: String, default: "", trim: true, maxlength: 12 },
  seed: { type: String, default: "Yugen", trim: true, maxlength: 80 },
  imageUrl: { type: String, default: "", trim: true, maxlength: 600 },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  showOnHome: { type: Boolean, default: true }
}, { timestamps: true });

catalogCategorySchema.index({ active: 1, sortOrder: 1, name: 1 });
module.exports = mongoose.model("CatalogCategory", catalogCategorySchema);
