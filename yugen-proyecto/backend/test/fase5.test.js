// test/fase5.test.js
// Pruebas de fase 5 sin base de datos: revocación de sesión, límite de contacto y accesibilidad de la API de errores.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "100";
process.env.CONTACT_MAX_ATTEMPTS = "2";

const { before, after, test } = require("node:test");
const assert = require("node:assert");
const app = require("../src/app");

let server;
let base;

before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

async function login() {
  const response = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password: "clave-de-prueba" })
  });
  const data = await response.json();
  return {
    csrfToken: data.csrfToken,
    cookie: response.headers.getSetCookie()[0].split(";")[0]
  };
}

test("una sesión cerrada no puede reutilizarse aunque la cookie se haya copiado", async () => {
  const session = await login();
  const logout = await fetch(base + "/auth/logout", {
    method: "POST",
    headers: { Cookie: session.cookie, "X-CSRF-Token": session.csrfToken }
  });
  assert.strictEqual(logout.status, 200);
  const reuse = await fetch(base + "/auth/me", { headers: { Cookie: session.cookie } });
  assert.strictEqual(reuse.status, 401);
});

test("el formulario de contacto limita los envíos por IP", async () => {
  const send = () => fetch(base + "/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", email: "", message: "" })
  });
  const first = await send();
  const second = await send();
  const third = await send();
  assert.strictEqual(first.status, 400);
  assert.strictEqual(second.status, 400);
  assert.strictEqual(third.status, 429);
});
