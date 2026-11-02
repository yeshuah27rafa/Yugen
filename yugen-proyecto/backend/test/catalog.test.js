// test/catalog.test.js
// Pruebas funcionales de la API pública de la etapa 1, contra una base MongoDB en memoria (no toca Atlas).
const { before, after, test } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const seedIfEmpty = require("../src/seed");

let mongo;
let server;
let base;

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

test("GET /works devuelve las obras cargadas", async () => {
  const response = await fetch(base + "/works");
  const works = await response.json();
  assert.strictEqual(response.status, 200);
  assert.ok(works.length > 0);
});

test("GET /products/featured devuelve solo productos destacados", async () => {
  const products = await (await fetch(base + "/products/featured")).json();
  assert.ok(products.length > 0);
  products.forEach((product) => assert.strictEqual(product.featured, true));
});

test("cada producto expone mainImage para las tarjetas", async () => {
  const products = await (await fetch(base + "/products")).json();
  products.forEach((product) => assert.ok(product.mainImage, `sin imagen: ${product.name}`));
});

test("GET /products?work=slug filtra por obra", async () => {
  const products = await (await fetch(`${base}/products?work=evangelion`)).json();
  products.forEach((product) => assert.strictEqual(product.work.slug, "evangelion"));
});

test("una obra inexistente devuelve lista vacía, no error", async () => {
  const response = await fetch(base + "/products?work=no-existe");
  const products = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(products, []);
});

test("GET /products?sort=price_asc ordena por precio ascendente", async () => {
  const products = await (await fetch(base + "/products?sort=price_asc")).json();
  for (let index = 1; index < products.length; index += 1) {
    assert.ok(products[index - 1].price <= products[index].price);
  }
});

test("GET /products?availability=agotado filtra por disponibilidad", async () => {
  const products = await (await fetch(base + "/products?availability=agotado")).json();
  products.forEach((product) => assert.strictEqual(product.availability, "agotado"));
});

test("un slug inexistente responde 404 con mensaje", async () => {
  const response = await fetch(base + "/products/no-existe");
  const data = await response.json();
  assert.strictEqual(response.status, 404);
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
