// test/product-detail.test.js
// Pruebas de la fase 3: detalle, galería, características, productos relacionados y consulta por producto.
const { before, after, test } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const seedIfEmpty = require("../src/seed");
const Product = require("../src/models/Product");
const Work = require("../src/models/Work");
const Contact = require("../src/models/Contact");

let mongo;
let server;
let base;
const DETAIL_SLUG = "pieza-de-detalle";

async function getJson(path) {
  const response = await fetch(base + path);
  return { status: response.status, data: await response.json() };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();

  // Producto de prueba con galería, características y ficha. Se crea aquí para no inventar datos en la semilla.
  const work = await Work.findOne({ slug: "evangelion" });
  await Product.create({
    name: "Pieza de detalle",
    slug: DETAIL_SLUG,
    category: "pin",
    work: work._id,
    price: 9,
    availability: "en_stock",
    images: [
      { url: "https://example.com/a.jpg", alt: "Frente", isMain: false },
      { url: "https://example.com/b.jpg", alt: "Reverso", isMain: true }
    ],
    specs: [{ label: "Medidas", value: "3 cm" }],
    contexto: "Ficha de prueba."
  });

  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

test("el detalle devuelve galería, características y ficha", async () => {
  const { status, data } = await getJson(`/products/${DETAIL_SLUG}`);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.images.length, 2);
  assert.strictEqual(data.specs[0].label, "Medidas");
  assert.strictEqual(data.contexto, "Ficha de prueba.");
  assert.strictEqual(data.work.slug, "evangelion");
});

test("mainImage devuelve la imagen marcada como principal", async () => {
  const { data } = await getJson(`/products/${DETAIL_SLUG}`);
  assert.strictEqual(data.mainImage.url, "https://example.com/b.jpg");
});

test("un producto sin características ni ficha devuelve listas vacías", async () => {
  const { data } = await getJson("/products/figura-mima");
  assert.deepStrictEqual(data.specs, []);
  assert.strictEqual(data.contexto, "");
});

test("un slug inexistente en el detalle responde 404", async () => {
  const { status, data } = await getJson("/products/no-existe");
  assert.strictEqual(status, 404);
  assert.ok(data.error);
});

test("los relacionados no incluyen el propio producto y priorizan la misma obra", async () => {
  const { status, data } = await getJson(`/products/${DETAIL_SLUG}/related`);
  assert.strictEqual(status, 200);
  assert.ok(data.length > 0);
  assert.ok(data.length <= 4);
  data.forEach((item) => assert.notStrictEqual(item.slug, DETAIL_SLUG));
  assert.strictEqual(data[0].work.slug, "evangelion");
});

test("los relacionados de un slug inexistente responden 404", async () => {
  const { status } = await getJson("/products/no-existe/related");
  assert.strictEqual(status, 404);
});

test("una consulta asociada a un producto guarda la referencia", async () => {
  const response = await fetch(base + "/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Interesada",
      email: "interesada@example.com",
      message: "¿Sigue disponible?",
      productSlug: DETAIL_SLUG
    })
  });
  assert.strictEqual(response.status, 201);
  const saved = await Contact.findOne({ message: "¿Sigue disponible?" });
  const product = await Product.findOne({ slug: DETAIL_SLUG });
  assert.strictEqual(String(saved.product), String(product._id));
});

test("una consulta sobre un producto inexistente se rechaza", async () => {
  const response = await fetch(base + "/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Interesada",
      email: "interesada@example.com",
      message: "Hola",
      productSlug: "no-existe"
    })
  });
  assert.strictEqual(response.status, 400);
});
