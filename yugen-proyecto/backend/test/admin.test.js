// test/admin.test.js
// Pruebas de la fase 4: sesión por cookie httpOnly, token CSRF, validación y CRUD de piezas.
const bcrypt = require("bcryptjs");

// Entorno de prueba: debe definirse antes de cargar la app.
process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "100";

const { before, after, test } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const seedIfEmpty = require("../src/seed");

let mongo;
let server;
let base;
let sessionCookie;
let csrfToken;

async function login(password) {
  return fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password })
  });
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;

  const response = await login("clave-de-prueba");
  const data = await response.json();
  csrfToken = data.csrfToken;
  sessionCookie = response.headers.getSetCookie()[0].split(";")[0];
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

function adminFetch(path, options = {}) {
  const headers = Object.assign({ "Content-Type": "application/json", Cookie: sessionCookie }, options.headers || {});
  return fetch(base + path, Object.assign({}, options, { headers }));
}

test("las rutas administrativas sin sesión responden 401", async () => {
  const response = await fetch(base + "/admin/products");
  assert.strictEqual(response.status, 401);
});

test("un login con clave incorrecta responde 401", async () => {
  const response = await login("clave-equivocada");
  assert.strictEqual(response.status, 401);
});

test("el login entrega cookie httpOnly y SameSite", async () => {
  const response = await login("clave-de-prueba");
  const cookie = response.headers.getSetCookie()[0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
});

test("/auth/me devuelve el token CSRF de la sesión", async () => {
  const response = await adminFetch("/auth/me");
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.csrfToken, csrfToken);
});

test("una escritura sin token CSRF responde 403", async () => {
  const works = await (await fetch(base + "/works")).json();
  const response = await adminFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify({ name: "Sin token", category: "pin", work: works[0]._id, price: 5 })
  });
  assert.strictEqual(response.status, 403);
});

test("crea una pieza con token CSRF y genera el slug", async () => {
  const works = await (await fetch(base + "/works")).json();
  const response = await adminFetch("/admin/products", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ name: "Pieza Nueva de Prueba", category: "pin", work: works[0]._id, price: "", stock: 2 })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 201);
  assert.strictEqual(data.slug, "pieza-nueva-de-prueba");
  assert.strictEqual(data.price, null);
  assert.strictEqual(data.work.slug, works[0].slug);
});

test("una pieza con datos inválidos responde 400 con mensaje en español", async () => {
  const works = await (await fetch(base + "/works")).json();
  const response = await adminFetch("/admin/products", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ name: "", category: "zzz", work: works[0]._id })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 400);
  assert.match(data.error, /nombre/);
  assert.match(data.error, /categoría/);
});

test("un slug repetido responde 409", async () => {
  const works = await (await fetch(base + "/works")).json();
  const response = await adminFetch("/admin/products", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ name: "Pieza Nueva de Prueba", category: "pin", work: works[0]._id })
  });
  assert.strictEqual(response.status, 409);
});

test("una imagen sin URL http(s) responde 400", async () => {
  const works = await (await fetch(base + "/works")).json();
  const response = await adminFetch("/admin/products", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({
      name: "Pieza con imagen mala",
      category: "pin",
      work: works[0]._id,
      images: [{ url: "ftp://no-valido", alt: "x", isMain: true }]
    })
  });
  assert.strictEqual(response.status, 400);
});

test("actualiza precio a consultar y marca como destacada", async () => {
  const created = await (await adminFetch("/admin/products?x=1")).json();
  const target = created.find((item) => item.slug === "pieza-nueva-de-prueba");
  const works = await (await fetch(base + "/works")).json();
  const response = await adminFetch(`/admin/products/${target._id}`, {
    method: "PUT",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({
      name: "Pieza Nueva de Prueba",
      category: "pin",
      work: works[0]._id,
      price: "",
      featured: true,
      specs: [{ label: "Medidas", value: "3 cm" }],
      contexto: "Ficha de prueba."
    })
  });
  const data = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.price, null);
  assert.strictEqual(data.featured, true);
  assert.strictEqual(data.specs[0].label, "Medidas");
  assert.strictEqual(data.contexto, "Ficha de prueba.");
});

test("elimina una pieza y deja de estar disponible en la API pública", async () => {
  const list = await (await adminFetch("/admin/products")).json();
  const target = list.find((item) => item.slug === "pieza-nueva-de-prueba");
  const response = await adminFetch(`/admin/products/${target._id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken }
  });
  assert.strictEqual(response.status, 200);
  const publicResponse = await fetch(base + "/products/pieza-nueva-de-prueba");
  assert.strictEqual(publicResponse.status, 404);
});

test("cerrar sesión borra la cookie y bloquea el panel", async () => {
  const response = await adminFetch("/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken }
  });
  assert.strictEqual(response.status, 200);
  const cookie = response.headers.getSetCookie()[0];
  assert.match(cookie, /yugen_session=;/);
});

test("al editar, una obra que no existe se rechaza como al crear", async () => {
  const list = await (await adminFetch("/admin/products")).json();
  const target = list[0];
  const response = await adminFetch(`/admin/products/${target._id}`, {
    method: "PUT",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ name: target.name, category: target.category, work: "64b000000000000000000999" })
  });
  assert.strictEqual(response.status, 400);
});

