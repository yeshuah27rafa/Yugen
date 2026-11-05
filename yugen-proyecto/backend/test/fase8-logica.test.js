// test/fase8-logica.test.js
// Pruebas sin base de datos: transiciones, teléfono, reglas del carrito y derivación del secreto de cliente.
const { test } = require("node:test");
const assert = require("node:assert");
const { canTransition, isPending } = require("../src/utils/requestStatus");
const { normalizePanamaWhatsapp } = require("../src/utils/phone");
const { validateLines, mergeLines } = require("../src/services/cartService");
const { readConfig, validateConfig } = require("../src/config/env");

const ID_A = "64b000000000000000000001";
const ID_B = "64b000000000000000000002";

test("transiciones permitidas y prohibidas", () => {
  assert.strictEqual(canTransition("nueva", "aprobada"), true);
  assert.strictEqual(canTransition("aprobada", "en_proceso"), true);
  assert.strictEqual(canTransition("en_proceso", "completada"), true);
  assert.strictEqual(canTransition("completada", "cancelada"), false);
  assert.strictEqual(canTransition("nueva", "completada"), false);
  assert.strictEqual(canTransition("cancelada", "nueva"), false);
});

test("solo las solicitudes nuevas cuentan como pendientes", () => {
  assert.strictEqual(isPending("nueva"), true);
  assert.strictEqual(isPending("aprobada"), false);
});

test("normaliza WhatsApp panameño con o sin 507", () => {
  assert.strictEqual(normalizePanamaWhatsapp("6123 4567"), "61234567");
  assert.strictEqual(normalizePanamaWhatsapp("+507 6123-4567"), "61234567");
  assert.strictEqual(normalizePanamaWhatsapp("12345"), null);
  assert.strictEqual(normalizePanamaWhatsapp("abc"), null);
});

test("el carrito valida cantidades y rechaza líneas inválidas", () => {
  const ok = validateLines([{ productId: ID_A, quantity: 2 }]);
  assert.deepStrictEqual(ok.errors, []);
  const badQty = validateLines([{ productId: ID_A, quantity: 11 }]);
  assert.ok(badQty.errors.length > 0);
  const badId = validateLines([{ productId: "no-es-id", quantity: 1 }]);
  assert.ok(badId.errors.length > 0);
});

test("el carrito no admite más de 20 piezas distintas", () => {
  const items = [];
  for (let index = 0; index < 21; index += 1) {
    items.push({ productId: index.toString(16).padStart(24, "0"), quantity: 1 });
  }
  assert.ok(validateLines(items).errors.length > 0);
});

test("fusionar carritos suma cantidades, limita a 10 y no duplica líneas", () => {
  const merged = mergeLines([{ productId: ID_A, quantity: 8 }], [{ productId: ID_A, quantity: 5 }, { productId: ID_B, quantity: 1 }]);
  assert.strictEqual(merged.length, 2);
  assert.strictEqual(merged.find((line) => line.productId === ID_A).quantity, 10);
});

test("fusionar descarta líneas inválidas del navegador sin romper el resto", () => {
  const merged = mergeLines([], [{ productId: "basura", quantity: 1 }, { productId: ID_B, quantity: 2 }]);
  assert.deepStrictEqual(merged, [{ productId: ID_B, quantity: 2 }]);
});

test("en desarrollo el secreto de cliente se deriva y es distinto del administrativo", () => {
  const secret = "secreto-de-pruebas-muy-largo-123456";
  const config = readConfig({ NODE_ENV: "development", JWT_SECRET: secret });
  assert.strictEqual(config.customerJwtSecret.length, 64);
  assert.notStrictEqual(config.customerJwtSecret, secret);
  assert.deepStrictEqual(validateConfig(config), []);
});

test("en producción el secreto de cliente no se deriva y es obligatorio", () => {
  const config = readConfig({ NODE_ENV: "production", JWT_SECRET: "secreto-de-pruebas-muy-largo-123456", MAIL_PROVIDER: "provider" });
  assert.strictEqual(config.customerJwtSecret, "");
  assert.ok(validateConfig(config).some((msg) => /CUSTOMER_JWT_SECRET/.test(msg)));
});
