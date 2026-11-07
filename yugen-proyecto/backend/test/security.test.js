// test/security.test.js
// Auditoría de seguridad sin base de datos: sesión, cookies, CSRF, CORS, cabeceras, JSON malformado y tamaño.
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-de-pruebas-muy-largo-123456";
process.env.ADMIN_EMAIL = "admin@yugen.test";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("clave-de-prueba", 10);
process.env.LOGIN_MAX_ATTEMPTS = "100";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

const { before, after, test } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

let server;
let base;
let sessionCookie;
let csrfToken;

before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const response = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password: "clave-de-prueba" })
  });
  const data = await response.json();
  csrfToken = data.csrfToken;
  sessionCookie = response.headers.getSetCookie()[0].split(";")[0];
});

after(() => server.close());

test("las rutas admin sin sesión responden 401", async () => {
  const get = await fetch(base + "/admin/products");
  const post = await fetch(base + "/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.strictEqual(get.status, 401);
  assert.strictEqual(post.status, 401);
});

test("una cookie de sesión falsificada con otra clave se rechaza", async () => {
  const forged = jwt.sign({ email: "admin@yugen.test", csrf: "x" }, "otra-clave-completamente-distinta-999");
  const response = await fetch(base + "/auth/me", { headers: { Cookie: `yugen_session=${forged}` } });
  assert.strictEqual(response.status, 401);
});

test("una sesión caducada se rechaza", async () => {
  const expired = jwt.sign({ email: "admin@yugen.test", csrf: "x", exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
  const response = await fetch(base + "/auth/me", { headers: { Cookie: `yugen_session=${expired}` } });
  assert.strictEqual(response.status, 401);
});

test("una cookie con algoritmo 'none' se rechaza", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ email: "admin@yugen.test", csrf: "x" })).toString("base64url");
  const response = await fetch(base + "/auth/me", { headers: { Cookie: `yugen_session=${header}.${body}.` } });
  assert.strictEqual(response.status, 401);
});

test("clave incorrecta y correo incorrecto responden 401 con el mismo mensaje", async () => {
  const wrongPassword = await fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password: "mala" })
  });
  const wrongEmail = await fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "otro@yugen.test", password: "clave-de-prueba" })
  });
  const a = await wrongPassword.json();
  const b = await wrongEmail.json();
  assert.strictEqual(wrongPassword.status, 401);
  assert.strictEqual(wrongEmail.status, 401);
  assert.strictEqual(a.error, b.error);
});

test("la cookie de sesión es HttpOnly, SameSite=Lax y Path=/", async () => {
  const response = await fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yugen.test", password: "clave-de-prueba" })
  });
  const cookie = response.headers.getSetCookie()[0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
});

test("una escritura sin cabecera CSRF responde 403", async () => {
  const response = await fetch(base + "/admin/products", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: sessionCookie }, body: "{}"
  });
  assert.strictEqual(response.status, 403);
});

test("una escritura con token CSRF incorrecto responde 403", async () => {
  const response = await fetch(base + "/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie, "X-CSRF-Token": "token-inventado" },
    body: "{}"
  });
  assert.strictEqual(response.status, 403);
});

test("el cierre de sesión sin CSRF responde 403 y la sesión sigue activa", async () => {
  const logout = await fetch(base + "/auth/logout", { method: "POST", headers: { Cookie: sessionCookie } });
  const me = await fetch(base + "/auth/me", { headers: { Cookie: sessionCookie } });
  assert.strictEqual(logout.status, 403);
  assert.strictEqual(me.status, 200);
});

test("una petición con JSON malformado responde 400, no 500", async () => {
  const response = await fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{ esto no es json"
  });
  assert.strictEqual(response.status, 400);
});

test("un cuerpo demasiado grande responde 413", async () => {
  const big = JSON.stringify({ name: "x".repeat(200 * 1024) });
  const response = await fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: big
  });
  assert.strictEqual(response.status, 413);
});

test("CORS: nunca refleja un origen ajeno y solo permite credenciales al frontend", async () => {
  const allowed = await fetch(base + "/auth/me", { headers: { Origin: "http://localhost:5173" } });
  const foreign = await fetch(base + "/auth/me", { headers: { Origin: "https://sitio-ajeno.example" } });
  assert.strictEqual(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.strictEqual(allowed.headers.get("access-control-allow-credentials"), "true");
  assert.notStrictEqual(foreign.headers.get("access-control-allow-origin"), "https://sitio-ajeno.example");
});

test("helmet añade cabeceras de seguridad", async () => {
  const response = await fetch(base + "/auth/me");
  assert.strictEqual(response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(response.headers.get("x-frame-options") || response.headers.get("content-security-policy"));
});

test("cerrar sesión con CSRF válido borra la cookie", async () => {
  const logout = await fetch(base + "/auth/logout", {
    method: "POST", headers: { Cookie: sessionCookie, "X-CSRF-Token": csrfToken }
  });
  assert.strictEqual(logout.status, 200);
  assert.match(logout.headers.getSetCookie()[0], /yugen_session=;/);
});
