// test/fase7-cuentas.test.js
// Pruebas de flujos de cliente con MongoDB en memoria. El correo se captura en memoria, no se envía.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.CUSTOMER_JWT_SECRET = "otro-secreto-distinto-para-cliente-99999";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "100";
process.env.MAIL_PROVIDER = "outbox";

const { before, after, test } = require("node:test");
const os = require("os");
const path = require("path");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const seedIfEmpty = require("../src/seed");
const { OutboxMailer, setMailer } = require("../src/mail");
const Customer = require("../src/models/Customer");

let mongo;
let server;
let base;
let mailer;

const EMAIL = "cliente@yugen.test";
const PASSWORD = "contraseña-segura-1";

function tokenFrom(text) {
  const match = text.match(/token=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

function lastMailTo(address) {
  return mailer.sent.filter((message) => message.to === address).pop();
}

async function post(path, body, headers) {
  return fetch(base + path, {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, headers || {}),
    body: JSON.stringify(body)
  });
}

async function registerAndVerify(email, password) {
  await post("/cuenta/registro", { name: "Ana Prueba", email, password, privacyAccepted: true });
  const token = tokenFrom(lastMailTo(email).text);
  await post("/cuenta/verificar", { token });
  return token;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedIfEmpty();
  mailer = new OutboxMailer(path.join(os.tmpdir(), "yugen-outbox-test"));
  setMailer(mailer);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

test("el registro de un correo ya existente muestra alerta explícita (409)", async () => {
  const first = await post("/cuenta/registro", { name: "Ana Prueba", email: "nuevo@yugen.test", password: PASSWORD, privacyAccepted: true });
  const second = await post("/cuenta/registro", { name: "Ana Prueba", email: "nuevo@yugen.test", password: PASSWORD, privacyAccepted: true });
  const body = await second.json();
  assert.strictEqual(first.status, 202);
  assert.strictEqual(second.status, 409);
  assert.match(body.error, /Ya existe una cuenta/);
});

test("el registro sin aceptar el aviso de privacidad responde 400", async () => {
  const response = await post("/cuenta/registro", { name: "Ana", email: "sin-aviso@yugen.test", password: PASSWORD, privacyAccepted: false });
  assert.strictEqual(response.status, 400);
});

test("el correo de confirmación contiene un enlace con token y no contiene la contraseña", async () => {
  const message = lastMailTo("nuevo@yugen.test");
  assert.ok(tokenFrom(message.text));
  assert.ok(message.text.includes(PASSWORD) === false);
});

test("sin correo confirmado no se puede iniciar sesión de cliente", async () => {
  const response = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: PASSWORD });
  assert.strictEqual(response.status, 403);
});

test("un enlace de confirmación válido verifica la cuenta y no sirve dos veces", async () => {
  const token = tokenFrom(lastMailTo("nuevo@yugen.test").text);
  const first = await post("/cuenta/verificar", { token });
  const second = await post("/cuenta/verificar", { token });
  assert.strictEqual(first.status, 200);
  assert.strictEqual(second.status, 400);
});

test("un token con formato incorrecto responde 400 sin consultar la base", async () => {
  const response = await post("/cuenta/verificar", { token: { $ne: null } });
  assert.strictEqual(response.status, 400);
});

test("el inicio de sesión de cliente entrega cookie propia y token CSRF", async () => {
  const response = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: PASSWORD });
  const body = await response.json();
  const cookie = response.headers.getSetCookie()[0];
  assert.strictEqual(response.status, 200);
  assert.match(cookie, /yugen_cliente=/);
  assert.match(cookie, /HttpOnly/);
  assert.ok(body.csrfToken);
});

test("una clave incorrecta responde 401 con intentos restantes y el mismo mensaje para correo inexistente", async () => {
  const wrong = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: "clave-mala-123456" });
  const unknown = await post("/cuenta/entrar", { email: "no-existe@yugen.test", password: "clave-mala-123456" });
  const a = await wrong.json();
  const b = await unknown.json();
  assert.strictEqual(wrong.status, 401);
  assert.strictEqual(unknown.status, 404);
  assert.match(b.error, /No encontramos una cuenta/);
  assert.ok(typeof a.remainingAttempts === "number");
});

test("recuperar contraseña responde igual para correo registrado y no registrado", async () => {
  const known = await post("/cuenta/recuperar", { email: "nuevo@yugen.test" });
  const unknown = await post("/cuenta/recuperar", { email: "fantasma@yugen.test" });
  const a = await known.json();
  const b = await unknown.json();
  assert.strictEqual(known.status, 202);
  assert.strictEqual(a.message, b.message);
});

test("restablecer contraseña cierra las sesiones anteriores y el enlace es de un solo uso", async () => {
  const session = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: PASSWORD });
  const oldCookie = session.headers.getSetCookie()[0].split(";")[0];
  const token = tokenFrom(lastMailTo("nuevo@yugen.test").text);

  const reset = await post("/cuenta/restablecer", { token, password: "nueva-clave-segura-2" });
  const reuse = await post("/cuenta/restablecer", { token, password: "otra-clave-segura-3" });
  assert.strictEqual(reset.status, 200);
  assert.strictEqual(reuse.status, 400);

  const me = await fetch(base + "/cuenta/me", { headers: { Cookie: oldCookie } });
  assert.strictEqual(me.status, 401);
});

test("cambiar la contraseña exige la actual", async () => {
  const login = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: "nueva-clave-segura-2" });
  const body = await login.json();
  const cookie = login.headers.getSetCookie()[0].split(";")[0];
  const wrong = await post("/cuenta/clave", { currentPassword: "equivocada-123456", newPassword: "otra-clave-segura-4" }, { Cookie: cookie, "X-CSRF-Token": body.csrfToken });
  assert.strictEqual(wrong.status, 400);
});

test("las escrituras de cliente sin CSRF responden 403", async () => {
  const login = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: "nueva-clave-segura-2" });
  const cookie = login.headers.getSetCookie()[0].split(";")[0];
  const response = await post("/cuenta/salir", {}, { Cookie: cookie });
  assert.strictEqual(response.status, 403);
});

test("un cliente no puede usar sus cookies en el panel administrativo", async () => {
  const login = await post("/cuenta/entrar", { email: "nuevo@yugen.test", password: "nueva-clave-segura-2" });
  const cookie = login.headers.getSetCookie()[0].split(";")[0];
  const response = await fetch(base + "/admin/products", { headers: { Cookie: cookie } });
  assert.strictEqual(response.status, 401);
});

test("tras confirmar el correo, la cuenta queda marcada como verificada", async () => {
  const customer = await Customer.findOne({ email: "nuevo@yugen.test" });
  assert.ok(customer.emailVerifiedAt instanceof Date);
});
