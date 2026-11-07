// test/ratelimit.test.js
// Límite de intentos de login. Archivo aparte porque el límite se lee al cargar la app.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "2";

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

test("tras agotar los intentos, el login responde 429", async () => {
  const attempt = () => fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password: "mala" })
  });
  const first = await attempt();
  const second = await attempt();
  const third = await attempt();
  assert.strictEqual(first.status, 401);
  assert.strictEqual(second.status, 401);
  assert.strictEqual(third.status, 429);
});
