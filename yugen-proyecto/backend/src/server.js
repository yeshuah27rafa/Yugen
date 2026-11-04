// server.js
// Punto de entrada: valida la configuración, conecta a MongoDB, carga datos de ejemplo y arranca el servidor.
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const seedIfEmpty = require("./seed");

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD_HASH"];
const PORT = process.env.PORT || 4000;

// Falla con un mensaje claro si falta configuración o el secreto es demasiado corto.
function checkConfig() {
  const missing = REQUIRED_ENV.filter((name) => process.env[name] === undefined || process.env[name] === "");
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");
  }
}

async function start() {
  checkConfig();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB.");
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}/api`));
}

start().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});
