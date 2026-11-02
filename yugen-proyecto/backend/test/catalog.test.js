// test/catalog.test.js
// Pruebas funcionales de la API pública, contra una base MongoDB en memoria (no toca Atlas).
const { before, after, test } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const seedIfEmpty = require("../src/seed");

let mongo;
let server;
let base;

async function getJson(path) {
  const response = await fetch(base + path);
  return { status: response.status, data: await response.json() };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

// ---------- Portada (etapa 1) ----------
test("GET /works devuelve las obras cargadas", async () => {
  const { status, data } = await getJson("/works");
  assert.strictEqual(status, 200);
  assert.ok(data.length > 0);
});

test("GET /products/featured devuelve solo productos destacados", async () => {
  const { data } = await getJson("/products/featured");
  assert.ok(data.length > 0);
  data.forEach((product) => assert.strictEqual(product.featured, true));
});

test("cada producto expone mainImage para las tarjetas", async () => {
  const { data } = await getJson("/products");
  data.forEach((product) => assert.ok(product.mainImage, `sin imagen: ${product.name}`));
});

test("una obra inexistente devuelve lista vacía, no error", async () => {
  const { status, data } = await getJson("/products?work=no-existe");
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(data, []);
});

test("un slug inexistente responde 404 con mensaje", async () => {
  const { status, data } = await getJson("/products/no-existe");
  assert.strictEqual(status, 404);
  assert.ok(data.error);
});

test("el formulario de contacto rechaza datos inválidos", async () => {
  const response = await fetch(base + "/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", email: "no-es-correo", message: "" })
  });
  assert.strictEqual(response.status, 400);
});

// ---------- Catálogo (etapa 2) ----------
test("GET /products?work=slug filtra por obra", async () => {
  const { data } = await getJson("/products?work=evangelion");
  assert.ok(data.length > 0);
  data.forEach((product) => assert.strictEqual(product.work.slug, "evangelion"));
});

test("GET /products?category=pin devuelve solo pines", async () => {
  const { data } = await getJson("/products?category=pin");
  assert.ok(data.length > 0);
  data.forEach((product) => assert.strictEqual(product.category, "pin"));
});

test("GET /products?availability=agotado filtra por disponibilidad", async () => {
  const { data } = await getJson("/products?availability=agotado");
  assert.ok(data.length > 0);
  data.forEach((product) => assert.strictEqual(product.availability, "agotado"));
});

test("combina categoría y disponibilidad", async () => {
  const { data } = await getJson("/products?category=figura&availability=agotado");
  assert.ok(data.length > 0);
  data.forEach((product) => {
    assert.strictEqual(product.category, "figura");
    assert.strictEqual(product.availability, "agotado");
  });
});

test("la búsqueda por nombre ignora mayúsculas y minúsculas", async () => {
  const { data } = await getJson("/products?q=PIN");
  assert.ok(data.length > 0);
  data.forEach((product) => assert.match(product.name.toLowerCase(), /pin/));
});

test("una búsqueda sin coincidencias devuelve lista vacía", async () => {
  const { status, data } = await getJson("/products?q=zzz-no-existe");
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(data, []);
});

test("GET /products?sort=price_asc ordena por precio ascendente", async () => {
  const { data } = await getJson("/products?sort=price_asc");
  const priced = data.filter((product) => product.price !== null);
  for (let index = 1; index < priced.length; index += 1) {
    assert.ok(priced[index - 1].price <= priced[index].price);
  }
});

test("los productos sin precio quedan al final al ordenar por precio", async () => {
  const { data } = await getJson("/products?sort=price_asc");
  const last = data[data.length - 1];
  assert.strictEqual(last.price, null);
});

test("un valor de orden desconocido no rompe la consulta", async () => {
  const { status, data } = await getJson("/products?sort=constructor");
  assert.strictEqual(status, 200);
  assert.ok(Array.isArray(data));
});
