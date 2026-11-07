// test/fase11-operaciones.test.js
// Pruebas con MongoDB en memoria: cancelación (D8), eliminación de cuenta (D20), borrado de solicitudes,
// retención (24 meses), correo alterno, honeypot y obras.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "100";
process.env.MAIL_PROVIDER = "outbox";

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
const { runRetention } = require("../src/services/retentionService");

let mongo;
let server;
let base;
let mailer;
let productId;
let admin;

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

function adminAuthed(extra) {
  return Object.assign({ Cookie: admin.cookie, "X-CSRF-Token": admin.csrf }, extra || {});
}

async function createRequest(session) {
  const response = await post("/solicitudes", { items: [{ productId, quantity: 1 }], deliveryMethod: "retiro", whatsapp: "61234567" }, authed(session));
  return (await response.json()).code;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();
  productId = String((await Product.findOne())._id);
  mailer = new OutboxMailer(path.join(os.tmpdir(), "yugen-outbox-f11"));
  setMailer(mailer);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const login = await post("/auth/login", { email: "admin@yugen.test", password: "clave-de-prueba" });
  const body = await login.json();
  admin = { cookie: login.headers.getSetCookie()[0].split(";")[0], csrf: body.csrfToken };
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

test("el cliente cancela una solicitud nueva y no puede cancelarla dos veces", async () => {
  const session = await verifiedSession("cancela@yugen.test");
  const code = await createRequest(session);
  const first = await post(`/cuenta/solicitudes/${code}/cancelar`, {}, authed(session));
  const second = await post(`/cuenta/solicitudes/${code}/cancelar`, {}, authed(session));
  assert.strictEqual(first.status, 200);
  assert.strictEqual(second.status, 409);
});

test("una solicitud ya aprobada no se puede cancelar desde la cuenta", async () => {
  const session = await verifiedSession("aprobada@yugen.test");
  const code = await createRequest(session);
  const list = await (await fetch(base + "/admin/solicitudes?q=" + code, { headers: { Cookie: admin.cookie } })).json();
  await post(`/admin/solicitudes/${list.items[0]._id}/estado`, { to: "aprobada" }, adminAuthed());
  const response = await post(`/cuenta/solicitudes/${code}/cancelar`, {}, authed(session));
  assert.strictEqual(response.status, 409);
});

test("borrar la cuenta anonimiza sus solicitudes y la cuenta deja de existir", async () => {
  const session = await verifiedSession("borrar@yugen.test");
  const code = await createRequest(session);
  const response = await fetch(base + "/cuenta/eliminar", {
    method: "DELETE",
    headers: authed(session, { "Content-Type": "application/json" }),
    body: JSON.stringify({ password: PASSWORD })
  });
  assert.strictEqual(response.status, 200);
  const saved = await Request.findOne({ code });
  assert.strictEqual(saved.contact.name, "Cliente eliminado");
  assert.strictEqual(await Customer.exists({ email: "borrar@yugen.test" }), null);
});

test("el administrador puede borrar una solicitud y libera el cupo del cliente", async () => {
  const session = await verifiedSession("cupo@yugen.test");
  const code = await createRequest(session);
  const list = await (await fetch(base + "/admin/solicitudes?q=" + code, { headers: { Cookie: admin.cookie } })).json();
  const before = await Customer.findOne({ email: "cupo@yugen.test" });
  const response = await fetch(base + `/admin/solicitudes/${list.items[0]._id}`, { method: "DELETE", headers: adminAuthed() });
  const after = await Customer.findOne({ email: "cupo@yugen.test" });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(after.pendingRequestCount, before.pendingRequestCount - 1);
});

test("la retención anonimiza solicitudes cerradas hace más de 24 meses", async () => {
  const session = await verifiedSession("retencion@yugen.test");
  const code = await createRequest(session);
  const list = await (await fetch(base + "/admin/solicitudes?q=" + code, { headers: { Cookie: admin.cookie } })).json();
  const id = list.items[0]._id;
  await post(`/admin/solicitudes/${id}/estado`, { to: "rechazada" }, adminAuthed());
  const future = new Date();
  future.setMonth(future.getMonth() + 25);
  const result = await runRetention(future);
  const saved = await Request.findById(id);
  assert.ok(result.requestsAnonymized >= 1);
  assert.strictEqual(saved.contact.name, "Cliente anonimizado");
});

test("sin WhatsApp, el correo de contacto es obligatorio y válido", async () => {
  const session = await verifiedSession("alterno@yugen.test");
  const missing = await post("/solicitudes", { items: [{ productId, quantity: 1 }], deliveryMethod: "retiro", useEmailOnly: true }, authed(session));
  const valid = await post("/solicitudes", { items: [{ productId, quantity: 1 }], deliveryMethod: "retiro", useEmailOnly: true, contactEmail: "contacto@yugen.test" }, authed(session));
  assert.strictEqual(missing.status, 400);
  assert.strictEqual(valid.status, 201);
});

test("el campo trampa lleno no crea nada", async () => {
  const before = await Request.countDocuments({});
  const response = await post("/contacto", { name: "Robot", email: "robot@x.com", message: "hola", website: "http://spam" });
  const after = await Request.countDocuments({});
  assert.strictEqual(response.status, 201);
  assert.strictEqual(after, before);
});

test("una obra con piezas no se puede borrar", async () => {
  const product = await Product.findOne();
  const response = await fetch(base + `/admin/obras/${product.work}`, { method: "DELETE", headers: adminAuthed() });
  assert.strictEqual(response.status, 409);
});

test("el administrador crea una obra nueva", async () => {
  const response = await post("/admin/obras", { title: "Obra de prueba", slug: "obra-de-prueba", year: "2020" }, adminAuthed());
  assert.strictEqual(response.status, 201);
});
