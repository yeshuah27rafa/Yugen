// server.js
// Punto de entrada: conecta a MongoDB (Atlas o local), carga datos de ejemplo y arranca el servidor.
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const seedIfEmpty = require("./seed");

const PORT = process.env.PORT || 4000;

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB.");
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}/api`));
}

start().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error.message);
  process.exit(1);
});
