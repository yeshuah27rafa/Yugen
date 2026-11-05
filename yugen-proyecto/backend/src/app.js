// app.js
// Configura la aplicación Express: seguridad de cabeceras, CORS con credenciales, rutas y errores.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const customerAuthRoutes = require("./routes/customerAuth");
const worksRoutes = require("./routes/works");
const productsRoutes = require("./routes/products");
const contactRoutes = require("./routes/contact");

const app = express();

// Detrás de un proxy (por ejemplo, en producción), el límite de intentos debe ver la IP real del cliente.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

app.use(helmet());
// Solo el origen del frontend puede leer respuestas. credentials permite enviar la cookie de sesión.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cuenta", customerAuthRoutes);
app.use("/api/works", worksRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/contact", contactRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

// Manejador central de errores: no expone detalles internos al cliente y devuelve el código correcto.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "La solicitud no tiene un formato JSON válido." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "La solicitud es demasiado grande." });
  }
  // Errores de servicio con código HTTP explícito (validación, token inválido, credenciales).
  if (error.status === 400 || error.status === 401 || error.status === 403) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: "Ya existe una pieza con ese enlace (slug). Cámbialo e intenta de nuevo." });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: "Faltan datos o son inválidos." });
  }
  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor." });
});

module.exports = app;
