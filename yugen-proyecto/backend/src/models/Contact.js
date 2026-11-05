// models/Contact.js
// Mensajes enviados desde el formulario de contacto. Pueden referirse a un producto concreto.
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  status: { type: String, enum: ["nuevo", "revisado"], default: "nuevo" },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);
