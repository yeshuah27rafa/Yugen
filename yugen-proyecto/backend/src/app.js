// app.js
// Configura la aplicación Express: CORS, rutas y manejo de errores. No abre puertos (eso lo hace server.js).
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const worksRoutes = require("./routes/works");
const productsRoutes = require("./routes/products");
const contactRoutes = require("./routes/contact");

const app = express();

// Solo el origen del frontend puede consumir la API desde el navegador.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/works", worksRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/contact", contactRoutes);

// Ruta inexistente de la API.
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

// Manejador central de errores: no expone detalles internos al cliente.
app.use((error, req, res, next) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: "Faltan datos o son inválidos." });
  }
  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor." });
});

module.exports = app;
