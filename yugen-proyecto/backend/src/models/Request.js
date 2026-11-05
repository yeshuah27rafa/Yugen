// models/Request.js
// Solicitud de pedido. Guarda snapshots de nombre y precio para conservar la historia aunque el producto cambie.
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  nameSnapshot: { type: String, required: true },
  priceSnapshot: { type: Number, default: null },
  quantity: { type: Number, required: true, min: 1, max: 10 }
}, { _id: false });

const historySchema = new mongoose.Schema({
  from: { type: String, default: null },
  to: { type: String, required: true },
  at: { type: Date, required: true },
  by: { type: String, required: true }
}, { _id: false });

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 1000 },
  by: { type: String, required: true },
  at: { type: Date, required: true }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  contact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    whatsapp: { type: String, default: "" }
  },
  items: { type: [itemSchema], required: true },
  comment: { type: String, default: "", maxlength: 500 },
  deliveryMethod: { type: String, enum: ["retiro", "entrega_personal", "envio_nacional"], required: true },
  status: { type: String, enum: ["nueva", "aprobada", "en_proceso", "completada", "rechazada", "cancelada"], default: "nueva" },
  statusHistory: { type: [historySchema], default: [] },
  adminNotes: { type: [noteSchema], default: [] },
  contactedAt: { type: Date, default: null }
}, { timestamps: true });

// Consultas frecuentes: solicitudes de un cliente y bandeja por estado.
requestSchema.index({ customer: 1, createdAt: -1 });
requestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Request", requestSchema);
