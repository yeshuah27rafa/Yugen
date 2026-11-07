// test/fase7-config-mail.test.js
// Pruebas sin base de datos: configuración, correo de desarrollo, tokens de un solo uso y formato.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readConfig, validateConfig } = require("../src/config/env");
const { OutboxMailer, ProviderMailer, createMailer } = require("../src/mail");
const { generateToken, hashToken, isWellFormedToken } = require("../src/services/tokenService");

const STRONG = "secreto-de-pruebas-muy-largo-123456";
const OTHER = "otro-secreto-distinto-para-cliente-99999";

test("readConfig aplica valores por defecto seguros", () => {
  const config = readConfig({});
  assert.strictEqual(config.mailProvider, "outbox");
  assert.strictEqual(config.cookieSameSite, "lax");
  assert.strictEqual(config.loginMaxAttempts, 5);
});

test("validateConfig acepta una configuración correcta", () => {
  const config = readConfig({ JWT_SECRET: STRONG, CUSTOMER_JWT_SECRET: OTHER, NODE_ENV: "development" });
  assert.deepStrictEqual(validateConfig(config), []);
});

test("validateConfig rechaza secretos cortos o iguales", () => {
  const short = readConfig({ JWT_SECRET: "corto", CUSTOMER_JWT_SECRET: OTHER });
  const same = readConfig({ JWT_SECRET: STRONG, CUSTOMER_JWT_SECRET: STRONG });
  assert.ok(validateConfig(short).some((msg) => /JWT_SECRET/.test(msg)));
  assert.ok(validateConfig(same).some((msg) => /distintos/.test(msg)));
});

test("validateConfig impide correo de desarrollo en producción", () => {
  const config = readConfig({ JWT_SECRET: STRONG, CUSTOMER_JWT_SECRET: OTHER, NODE_ENV: "production", MAIL_PROVIDER: "outbox" });
  assert.ok(validateConfig(config).some((msg) => /producción/.test(msg)));
});

test("validateConfig exige MONGODB_URI cuando el servidor arranca", () => {
  const config = readConfig({ JWT_SECRET: STRONG, CUSTOMER_JWT_SECRET: OTHER });
  assert.ok(validateConfig(config, { requireMongo: true }).some((msg) => /MONGODB_URI/.test(msg)));
});

test("OutboxMailer guarda el correo en carpeta y en memoria", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yugen-outbox-"));
  const mailer = new OutboxMailer(dir);
  await mailer.send({ to: "a@b.com", subject: "Prueba", text: "Hola" });
  assert.strictEqual(mailer.sent.length, 1);
  const files = fs.readdirSync(dir);
  assert.strictEqual(files.length, 1);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  assert.strictEqual(saved.to, "a@b.com");
});

test("ProviderMailer falla con mensaje claro hasta configurarse", async () => {
  await assert.rejects(() => new ProviderMailer().send({}), /no configurado/);
});

test("createMailer elige según MAIL_PROVIDER", () => {
  assert.ok(createMailer(readConfig({ MAIL_PROVIDER: "outbox" })) instanceof OutboxMailer);
  assert.ok(createMailer(readConfig({ MAIL_PROVIDER: "provider" })) instanceof ProviderMailer);
});

test("el token se guarda como hash y cada uno es distinto", () => {
  const first = generateToken();
  const second = generateToken();
  assert.strictEqual(first.hash, hashToken(first.raw));
  assert.notStrictEqual(first.raw, first.hash);
  assert.notStrictEqual(first.raw, second.raw);
  assert.ok(isWellFormedToken(first.raw));
});

test("un token con formato incorrecto se rechaza antes de consultar la base", () => {
  assert.strictEqual(isWellFormedToken({ $ne: null }), false);
  assert.strictEqual(isWellFormedToken("no-es-hex"), false);
  assert.strictEqual(isWellFormedToken("A".repeat(64)), false);
});
