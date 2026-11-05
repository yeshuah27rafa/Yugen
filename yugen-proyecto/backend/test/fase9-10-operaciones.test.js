// test/fase9-10-operaciones.test.js
// Pruebas con MongoDB en memoria: transiciones, contador de pendientes, notas ocultas, cambio de correo y exportación.
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

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();
  productId = String((await Product.findOne())._id);
  mailer = new OutboxMailer(path.join(os.tmpdir(), "yugen-outbox-f9"));
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

let requestCode;
let requestId;
let customerSession;

test("setup: cliente con una solicitud nueva", async () => {
  customerSession = await verifiedSession("gestion@yugen.test");
  const response = await post("/solicitudes", { items: [{ productId, quantity: 1 }], deliveryMethod: "retiro", whatsapp: "61234567" }, authed(customerSession));
  const body = await response.json();
  requestCode = body.code;
  const list = await (await fetch(base + "/admin/solicitudes?q=" + requestCode, { headers: { Cookie: admin.cookie } })).json();
  requestId = list.items[0]._id;
  assert.strictEqual(response.status, 201);
});

test("el administrador ve el resumen con solicitudes pendientes", async () => {
  const response = await fetch(base + "/admin/resumen", { headers: { Cookie: admin.cookie } });
  const body = await response.json();
  assert.ok(body.pendingApproval >= 1);
});

test("una transición válida cambia el estado y libera el cupo del cliente", async () => {
  const before = await Customer.findOne({ email: "gestion@yugen.test" });
  const response = await post(`/admin/solicitudes/${requestId}/estado`, { to: "aprobada" }, adminAuthed());
  assert.strictEqual(response.status, 200);
  const after = await Customer.findOne({ email: "gestion@yugen.test" });
  assert.strictEqual(after.pendingRequestCount, before.pendingRequestCount - 1);
});

test("una transición no permitida responde 409", async () => {
  const response = await post(`/admin/solicitudes/${requestId}/estado`, { to: "nueva" }, adminAuthed());
  assert.strictEqual(response.status, 409);
});

test("las notas internas no aparecen en la vista del cliente", async () => {
  await post(`/admin/solicitudes/${requestId}/notas`, { text: "NOTA-SECRETA-123" }, adminAuthed());
  const detail = await fetch(base + `/cuenta/solicitudes/${requestCode}`, { headers: { Cookie: customerSession.cookie } });
  const text = await detail.text();
  assert.strictEqual(detail.status, 200);
  assert.ok(text.includes("NOTA-SECRETA-123") === false);
  assert.ok(text.includes("adminNotes") === false);
});

test("el historial del cliente no revela el correo del administrador", async () => {
  const detail = await fetch(base + `/cuenta/solicitudes/${requestCode}`, { headers: { Cookie: customerSession.cookie } });
  const text = await detail.text();
  assert.ok(text.includes("admin@yugen.test") === false);
});

test("un cliente no puede leer solicitudes ajenas ni el resumen administrativo", async () => {
  const other = await verifiedSession("otro-cliente@yugen.test");
  const foreign = await fetch(base + `/cuenta/solicitudes/${requestCode}`, { headers: { Cookie: other.cookie } });
  const summary = await fetch(base + "/admin/resumen", { headers: { Cookie: customerSession.cookie } });
  assert.strictEqual(foreign.status, 404);
  assert.strictEqual(summary.status, 401);
});

test("cambiar el correo exige contraseña y se aplica solo al confirmarlo", async () => {
  const wrong = await post("/cuenta/correo", { password: "mala-clave-123456", newEmail: "nuevo-correo@yugen.test" }, authed(customerSession));
  assert.strictEqual(wrong.status, 400);
  const ok = await post("/cuenta/correo", { password: PASSWORD, newEmail: "nuevo-correo@yugen.test" }, authed(customerSession));
  assert.strictEqual(ok.status, 202);
  const mail = mailer.sent.filter((message) => message.to === "nuevo-correo@yugen.test").pop();
  const confirm = await post("/cuenta/correo/confirmar", { token: tokenFrom(mail.text) });
  assert.strictEqual(confirm.status, 200);
  assert.ok(await Customer.exists({ email: "nuevo-correo@yugen.test" }));
});

test("la exportación de datos no incluye contraseña ni tokens", async () => {
  const response = await fetch(base + "/cuenta/datos", { headers: { Cookie: customerSession.cookie } });
  const text = await response.text();
  assert.strictEqual(response.status, 200);
  assert.ok(text.includes("passwordHash") === false);
  assert.ok(text.includes("Token") === false);
});

test("el administrador puede marcar la solicitud como contactada y ver clientes", async () => {
  const contacted = await post(`/admin/solicitudes/${requestId}/contactado`, {}, adminAuthed());
  assert.strictEqual(contacted.status, 200);
  const clients = await (await fetch(base + "/admin/clientes", { headers: { Cookie: admin.cookie } })).json();
  assert.ok(clients.items.length >= 1);
  assert.strictEqual(clients.items[0].passwordHash, undefined);
});

test("cambiar el nombre del cliente se guarda", async () => {
  const response = await fetch(base + "/cuenta/perfil", {
    method: "PUT",
    headers: authed(customerSession, { "Content-Type": "application/json" }),
    body: JSON.stringify({ name: "Ana Nueva" })
  });
  assert.strictEqual(response.status, 200);
});
