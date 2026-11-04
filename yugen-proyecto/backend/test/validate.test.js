// test/validate.test.js
// Pruebas unitarias de validateProduct: sin base de datos.
const { test } = require("node:test");
const assert = require("node:assert");
const validateProduct = require("../src/utils/validateProduct");

const VALID_WORK = "64b000000000000000000001";
const base = { name: "Pin Unidad 01", category: "pin", work: VALID_WORK };

test("genera el slug sin acentos ni símbolos", () => {
  const result = validateProduct(Object.assign({}, base, { name: "Llavero Violet, edición ñandú" }));
  assert.strictEqual(result.data.slug, "llavero-violet-edicion-nandu");
});

test("precio vacío o null se guarda como consultar", () => {
  assert.strictEqual(validateProduct(Object.assign({}, base, { price: "" })).data.price, null);
  assert.strictEqual(validateProduct(Object.assign({}, base, { price: null })).data.price, null);
});

test("rechaza precio negativo o no numérico", () => {
  assert.ok(validateProduct(Object.assign({}, base, { price: -1 })).errors.length > 0);
  assert.ok(validateProduct(Object.assign({}, base, { price: "abc" })).errors.length > 0);
});

test("solo puede haber una imagen principal", () => {
  const result = validateProduct(Object.assign({}, base, {
    images: [{ url: "https://a.com/1.jpg", isMain: true }, { url: "https://a.com/2.jpg", isMain: true }]
  }));
  assert.deepStrictEqual(result.data.images.map((image) => image.isMain), [true, false]);
});

test("si ninguna imagen es principal, la primera lo pasa a ser", () => {
  const result = validateProduct(Object.assign({}, base, { images: [{ url: "https://a.com/1.jpg" }] }));
  assert.strictEqual(result.data.images[0].isMain, true);
});

test("rechaza URLs que no son http(s), como javascript:", () => {
  const result = validateProduct(Object.assign({}, base, { images: [{ url: "javascript:alert(1)" }] }));
  assert.ok(result.errors.length > 0);
});

test("una característica con solo nombre o solo valor es un error", () => {
  const result = validateProduct(Object.assign({}, base, { specs: [{ label: "Medidas", value: "" }] }));
  assert.ok(result.errors.length > 0);
});

test("ignora campos que no son de la pieza (asignación masiva)", () => {
  const result = validateProduct(Object.assign({}, base, { _id: "abc", createdAt: "2000-01-01", role: "admin" }));
  const keys = Object.keys(result.data).sort();
  assert.deepStrictEqual(keys, [
    "availability", "category", "contexto", "description", "featured", "images",
    "name", "price", "slug", "specs", "stock", "work"
  ]);
});

test("un ObjectId de obra inválido se rechaza", () => {
  const result = validateProduct(Object.assign({}, base, { work: "no-es-id" }));
  assert.ok(result.errors.some((message) => /obra/.test(message)));
});

test("el nombre no puede superar 120 caracteres", () => {
  const result = validateProduct(Object.assign({}, base, { name: "x".repeat(121) }));
  assert.ok(result.errors.length > 0);
});
