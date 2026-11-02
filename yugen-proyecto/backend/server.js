// server.js
// API de Nekoya: catálogo, contacto y acceso del administrador. Conecta a MongoDB (Atlas o local).

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ---------- 1. Configuración ----------
// Las variables sensibles viven en .env para no subirlas a Git.
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// ---------- 2. Modelos ----------
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ["llavero", "pin", "figura", "personaje", "otro"], required: true },
  anime: { type: String, default: "", trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  image: { type: String, default: "" },
  description: { type: String, default: "" }
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
const Contact = mongoose.model("Contact", contactSchema);

// ---------- 3. Utilidades ----------
// Envuelve funciones async para que los errores lleguen al manejador central.
function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// Escapa caracteres especiales para que la búsqueda por nombre no rompa la expresión regular.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Verifica el token JWT del administrador antes de permitir escrituras.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token === "") {
    return res.status(401).json({ error: "Inicia sesión como administrador." });
  }
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  }
}

// ---------- 4. Aplicación y rutas ----------
const app = express();
app.use(cors()); // En producción, limita el origen al dominio de tu frontend.
app.use(express.json());

// Autenticación del administrador.
app.post("/api/auth/login", wrap(async (req, res) => {
  const email = String(req.body.email || "");
  const password = String(req.body.password || "");
  const passwordOk = await bcrypt.compare(password, ADMIN_PASSWORD_HASH || "");
  if (email !== ADMIN_EMAIL || passwordOk === false) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token });
}));

// Catálogo público, con filtro por categoría y búsqueda por nombre.
app.get("/api/products", wrap(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) filter.name = { $regex: escapeRegex(String(req.query.q)), $options: "i" };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  return res.json(products);
}));

// Detalle de un producto.
app.get("/api/products/:id", wrap(async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id) === false) {
    return res.status(404).json({ error: "Producto no encontrado." });
  }
  const product = await Product.findById(req.params.id);
  if (product === null) {
    return res.status(404).json({ error: "Producto no encontrado." });
  }
  return res.json(product);
}));

// Alta de producto: solo administrador.
app.post("/api/products", requireAdmin, wrap(async (req, res) => {
  const product = await Product.create(req.body);
  return res.status(201).json(product);
}));

// Formulario de contacto público.
app.post("/api/contact", wrap(async (req, res) => {
  const { name = "", email = "", message = "" } = req.body;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (name.trim() === "" || message.trim() === "" || emailOk === false) {
    return res.status(400).json({ error: "Revisa tu nombre, correo y mensaje." });
  }
  await Contact.create({ name, email, message });
  return res.status(201).json({ ok: true });
}));

// Manejador de errores: validaciones de Mongoose llegan aquí con mensaje claro.
app.use((error, req, res, next) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: "Faltan datos o son inválidos. Revisa el formulario." });
  }
  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor." });
});

// ---------- 5. Datos de ejemplo ----------
// Solo se cargan si la colección está vacía, para que la tienda no se vea vacía al probar.
const SAMPLE_PRODUCTS = [
  { name: "Pin Eva-01", category: "pin", anime: "Neon Genesis Evangelion", price: 6.5, stock: 12, image: "https://placehold.co/600x600/F4EBD9/1F2A44?text=Pin", description: "Pin esmaltado con el color icónico de la unidad 01." },
  { name: "Llavero Lain", category: "llavero", anime: "Serial Experiments Lain", price: 5, stock: 8, image: "https://placehold.co/600x600/F4EBD9/8B1E2B?text=Llavero", description: "Llavero acrílico con diseño minimalista de Lain." },
  { name: "Figura Mima", category: "figura", anime: "Perfect Blue", price: 38, stock: 3, image: "https://placehold.co/600x600/F4EBD9/1F2A44?text=Figura", description: "Figura de 15 cm inspirada en el thriller psicológico de Perfect Blue." },
  { name: "Pin Madoka", category: "pin", anime: "Puella Magi Madoka Magica", price: 7, stock: 0, image: "https://placehold.co/600x600/F4EBD9/D9A441?text=Pin", description: "Pin metálico con el escudo de Madoka." },
  { name: "Personaje Kaneda", category: "personaje", anime: "Akira", price: 22, stock: 5, image: "https://placehold.co/600x600/F4EBD9/8B1E2B?text=Personaje", description: "Figura articulada de Kaneda con motocicleta." },
  { name: "Llavero Violet", category: "llavero", anime: "Violet Evergarden", price: 4.5, stock: 20, image: "https://placehold.co/600x600/F4EBD9/5E6B4A?text=Llavero", description: "Llavero de metal con la pluma de Violet." }
];

async function seedIfEmpty() {
  const total = await Product.countDocuments();
  if (total > 0) return;
  await Product.insertMany(SAMPLE_PRODUCTS);
  console.log("Catálogo de ejemplo cargado.");
}

// ---------- 6. Arranque ----------
async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log("Conectado a MongoDB.");
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});
