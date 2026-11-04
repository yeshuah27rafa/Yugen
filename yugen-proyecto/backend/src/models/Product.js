// models/Product.js
// Producto de la tienda. Cada producto pertenece a una obra y puede tener varias imágenes.
const mongoose = require("mongoose");

// Imagen con marca de principal: la principal aparece en tarjetas y secciones destacadas.
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: "" },
  isMain: { type: Boolean, default: false }
}, { _id: false });

// Característica adicional (por ejemplo, "Medidas": "5 cm"). Opcional y editable desde el panel.
const specSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  category: { type: String, enum: ["pin", "manga", "figura", "mousepad", "otro"], required: true },
  work: { type: mongoose.Schema.Types.ObjectId, ref: "Work", required: true },
  // Precio opcional: null significa "consultar". Se administrará desde el panel en la etapa 4.
  price: { type: Number, min: 0, default: null },
  stock: { type: Number, default: 0, min: 0 },
  availability: { type: String, enum: ["en_stock", "agotado", "pedido_exterior"], default: "en_stock" },
  images: { type: [imageSchema], default: [] },
  description: { type: String, default: "" },
  specs: { type: [specSchema], default: [] },
  // Ficha contextual: opcional, explica la conexión del producto con su obra. Nunca se inventa.
  contexto: { type: String, default: "", maxlength: 1200 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

// Imagen principal calculada: la marcada como principal o, si no hay ninguna, la primera.
productSchema.virtual("mainImage").get(function getMainImage() {
  const marked = this.images.find((image) => image.isMain === true);
  if (marked !== undefined) return marked;
  return this.images.length > 0 ? this.images[0] : null;
});

// Incluye los virtuales al convertir a JSON para que la API entregue mainImage.
productSchema.set("toJSON", { virtuals: true });

// Índices para las consultas frecuentes: catálogo por categoría y obra, destacados y novedades.
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ work: 1, createdAt: -1 });
productSchema.index({ featured: 1, updatedAt: -1 });

module.exports = mongoose.model("Product", productSchema);
