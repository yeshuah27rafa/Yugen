// test/fase7-sesiones-contador.test.js
// Pruebas sin base de datos: sesiones separadas por secreto y audiencia, y contador de fallos del administrador.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.CUSTOMER_JWT_SECRET = "otro-secreto-distinto-para-cliente-99999";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "3";

const { before, after, test } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

let server;
let base;

before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

async function adminLogin(password) {
  return fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password })
  });
}

test("un token de administrador no sirve en las rutas de cliente", async () => {
  const login = await adminLogin("clave-de-prueba");
  const cookie = login.headers.getSetCookie()[0].split(";")[0];
  const response = await fetch(base + "/cuenta/me", { headers: { Cookie: cookie } });
  assert.strictEqual(response.status, 401);
});

test("un token de cliente no sirve en las rutas de administración", async () => {
  const forged = jwt.sign(
    { sub: "64b000000000000000000001", email: "x@y.com", tv: 0, csrf: "c", jti: "j1", aud: "cliente" },
    process.env.CUSTOMER_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "2h" }
  );
  const response = await fetch(base + "/admin/products", { headers: { Cookie: `yugen_session=${forged}` } });
  assert.strictEqual(response.status, 401);
});

test("un token de administrador sin audiencia 'admin' se rechaza", async () => {
  const noAudience = jwt.sign({ email: "admin@yugen.test", csrf: "c", jti: "j2" }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const response = await fetch(base + "/auth/me", { headers: { Cookie: `yugen_session=${noAudience}` } });
  assert.strictEqual(response.status, 401);
});

test("el contador solo cuenta fallos: un acceso correcto no consume cupo", async () => {
  // Límite de 3 fallos. Secuencia: fallo, fallo, acierto, fallo.
  const first = await adminLogin("mala-1");
  const firstBody = await first.json();
  assert.strictEqual(first.status, 401);
  assert.strictEqual(firstBody.remainingAttempts, 2);

  const second = await adminLogin("mala-2");
  const secondBody = await second.json();
  assert.strictEqual(secondBody.remainingAttempts, 1);

  const success = await adminLogin("clave-de-prueba");
  assert.strictEqual(success.status, 200);

  const third = await adminLogin("mala-3");
  const thirdBody = await third.json();
  assert.strictEqual(thirdBody.remainingAttempts, 0);
});

test("al agotar los intentos, el login responde 429 con tiempo de espera", async () => {
  const blocked = await adminLogin("mala-4");
  const body = await blocked.json();
  assert.strictEqual(blocked.status, 429);
  assert.ok(body.retryAfterSeconds > 0);
});
