// test/fase8-solicitudes.test.js
// Pruebas con MongoDB en memoria: alerta de correo existente, carrito, fusión, solicitudes, límite y aislamiento.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "100";
process.env.MAIL_PROVIDER = "outbox";
process.env.CONTACT_EMAIL = "tienda@yugen.test";
process.env.CONTACT_WHATSAPP = "61234567";

const { before, after, test } = require("node:test");
const assert = require("node:assert");
const os = require("os");
const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const seedIfEmpty = require("../src/seed");
const { OutboxMailer, setMailer } = require("../src/mail");
const Product = require("../src/models/Product");
const Customer = require("../src/models/Customer");
const Request = require("../src/models/Request");

let mongo;
let server;
let base;
let mailer;
let productIds = [];

const EMAIL = "compradora@yugen.test";
const PASSWORD = "contraseña-segura-1";

function tokenFrom(text) {
  const match = text.match(/token=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

async function post(path, body, headers) {
  return fetch(base + path, {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, headers || {}),
    body: JSON.stringify(body)
  });
}

// Crea una cuenta verificada e inicia sesión. Devuelve la cookie y el token CSRF.
async function verifiedSession(email) {
  await post("/cuenta/registro", { name: "Ana Prueba", email, password: PASSWORD, privacyAccepted: true });
  const mail = mailer.sent.filter((message) => message.to === email).pop();
  await post("/cuenta/verificar", { token: tokenFrom(mail.text) });
  const login = await post("/cuenta/entrar", { email, password: PASSWORD });
  const body = await login.json();
  return { cookie: login.headers.getSetCookie()[0].split(";")[0], csrf: body.csrfToken };
}

function authed(session, extra) {
  return Object.assign({ Cookie: session.cookie, "X-CSRF-Token": session.csrf }, extra || {});
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();
  productIds = (await Product.find().limit(5)).map((product) => String(product._id));
  mailer = new OutboxMailer(path.join(os.tmpdir(), "yugen-outbox-f8"));
  setMailer(mailer);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

test("registrar un correo ya usado muestra la alerta explícita", async () => {
  await post("/cuenta/registro", { name: "Ana", email: EMAIL, password: PASSWORD, privacyAccepted: true });
  const again = await post("/cuenta/registro", { name: "Ana", email: EMAIL, password: PASSWORD, privacyAccepted: true });
  const body = await again.json();
  assert.strictEqual(again.status, 409);
  assert.match(body.error, /Ya existe una cuenta/);
});

test("la página de contacto de la tienda devuelve los datos configurados", async () => {
  const response = await fetch(base + "/contacto/tienda");
  const body = await response.json();
  assert.strictEqual(body.email, "tienda@yugen.test");
  assert.strictEqual(body.whatsapp, "61234567");
});

test("el carrito de invitado se valida con datos actuales del producto", async () => {
  const response = await post("/carrito/resumen", { items: [{ productId: productIds[0], quantity: 2 }] });
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.lines[0].quantity, 2);
  assert.strictEqual(body.lines[0].missing, false);
});

test("una pieza inexistente se marca como no disponible en el carrito", async () => {
  const ghost = "64b000000000000000000999";
  const response = await post("/carrito/resumen", { items: [{ productId: ghost, quantity: 1 }] });
  const body = await response.json();
  assert.strictEqual(body.lines[0].missing, true);
});

test("crear solicitud exige sesión", async () => {
  const response = await post("/solicitudes", { items: [{ productId: productIds[0], quantity: 1 }], deliveryMethod: "retiro", whatsapp: "61234567" });
  assert.strictEqual(response.status, 401);
});

test("crear solicitud sin WhatsApp ni opción de correo se rechaza", async () => {
  const session = await verifiedSession("sinwa@yugen.test");
  const response = await post("/solicitudes", { items: [{ productId: productIds[0], quantity: 1 }], deliveryMethod: "retiro" }, authed(session));
  assert.strictEqual(response.status, 400);
});

test("fusionar el carrito del navegador al iniciar sesión no duplica líneas", async () => {
  const session = await verifiedSession("fusion@yugen.test");
  await fetch(base + "/carrito", {
    method: "PUT",
    headers: authed(session, { "Content-Type": "application/json" }),
    body: JSON.stringify({ items: [{ productId: productIds[0], quantity: 3 }] })
  });
  const merged = await post("/carrito/fusionar", { items: [{ productId: productIds[0], quantity: 4 }, { productId: productIds[1], quantity: 1 }] }, authed(session));
  const body = await merged.json();
  assert.strictEqual(merged.status, 200);
  assert.strictEqual(body.lines.length, 2);
  assert.strictEqual(body.lines.find((line) => line.productId === productIds[0]).quantity, 7);
});

test("una solicitud válida guarda snapshots y vacía el carrito guardado", async () => {
  const session = await verifiedSession("solicitud@yugen.test");
  const response = await post("/solicitudes", {
    items: [{ productId: productIds[0], quantity: 2 }],
    deliveryMethod: "retiro",
    whatsapp: "6123-4567",
    comment: "Prefiero el sábado."
  }, authed(session));
  const body = await response.json();
  assert.strictEqual(response.status, 201);
  assert.match(body.code, /^YG-\d{6}$/);
  const saved = await Request.findOne({ code: body.code });
  assert.ok(saved.items[0].nameSnapshot.length > 0);
  assert.strictEqual(saved.contact.whatsapp, "61234567");
  const customer = await Customer.findOne({ email: "solicitud@yugen.test" });
  assert.strictEqual(customer.savedCart.length, 0);
});

test("el precio enviado por el cliente se ignora: se usa el del servidor", async () => {
  const session = await verifiedSession("precio@yugen.test");
  const response = await post("/solicitudes", {
    items: [{ productId: productIds[0], quantity: 1, price: 0.01 }],
    deliveryMethod: "retiro",
    whatsapp: "61234567"
  }, authed(session));
  const body = await response.json();
  const saved = await Request.findOne({ code: body.code });
  const product = await Product.findById(productIds[0]);
  assert.strictEqual(saved.items[0].priceSnapshot, product.price);
});

test("envíos simultáneos no superan tres solicitudes pendientes", async () => {
  const session = await verifiedSession("limite@yugen.test");
  const attempts = [];
  for (let index = 0; index < 5; index += 1) {
    attempts.push(post("/solicitudes", {
      items: [{ productId: productIds[index % productIds.length], quantity: 1 }],
      deliveryMethod: "retiro",
      whatsapp: "61234567"
    }, authed(session)));
  }
  const results = await Promise.all(attempts);
  const created = results.filter((response) => response.status === 201).length;
  const blocked = results.filter((response) => response.status === 409).length;
  assert.strictEqual(created, 3);
  assert.strictEqual(blocked, 2);
  const customer = await Customer.findOne({ email: "limite@yugen.test" });
  assert.strictEqual(customer.pendingRequestCount, 3);
});

test("un cliente solo ve sus propias solicitudes y sin notas internas", async () => {
  const owner = await verifiedSession("dueno@yugen.test");
  const other = await verifiedSession("otra@yugen.test");
  await post("/solicitudes", { items: [{ productId: productIds[0], quantity: 1 }], deliveryMethod: "retiro", whatsapp: "61234567" }, authed(owner));
  const ownerList = await (await fetch(base + "/solicitudes/mias", { headers: { Cookie: owner.cookie } })).json();
  const otherList = await (await fetch(base + "/solicitudes/mias", { headers: { Cookie: other.cookie } })).json();
  assert.ok(ownerList.requests.length >= 1);
  assert.strictEqual(otherList.requests.length, 0);
  assert.strictEqual(ownerList.requests[0].adminNotes, undefined);
});

test("guardar el carrito sin CSRF responde 403", async () => {
  const session = await verifiedSession("csrf@yugen.test");
  const response = await fetch(base + "/carrito", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: session.cookie },
    body: JSON.stringify({ items: [] })
  });
  assert.strictEqual(response.status, 403);
});
