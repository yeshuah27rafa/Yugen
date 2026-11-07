// server.js
// Punto de entrada: valida la configuración, conecta a MongoDB, carga datos de ejemplo y arranca el servidor.
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const seedIfEmpty = require("./seed");

const { readConfig, validateConfig } = require("./config/env");

const PORT = process.env.PORT || 4000;

// Falla con mensajes claros si la configuración no es válida para el servidor.
function checkConfig() {
  const errors = validateConfig(readConfig(), { requireMongo: true });
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}

async function start() {
  checkConfig();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB.");
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}/api`));

  // Retención diaria. unref() evita que este temporizador mantenga vivo el proceso.
  const DAY_MS = 24 * 3600 * 1000;
  setInterval(() => {
    require("./services/retentionService").runRetention().catch(() => console.error("La retención diaria falló."));
  }, DAY_MS).unref();
}

start().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});
