// test/fase9-10-logica.test.js
// Pruebas sin base de datos: enlaces de WhatsApp y plantillas sin datos internos.
const { test } = require("node:test");
const assert = require("node:assert");
const { contactLinks } = require("../src/utils/whatsappLink");

const request = { code: "YG-000007", contact: { name: "Ana", email: "ana@yugen.test", whatsapp: "61234567" } };

test("el enlace de WhatsApp usa el prefijo 507 y codifica el texto", () => {
  const links = contactLinks(request, "approved");
  assert.ok(links.whatsapp.startsWith("https://wa.me/50761234567?text="));
  assert.ok(links.whatsapp.includes(encodeURIComponent("YG-000007")));
  assert.ok(links.text.includes("fue aprobada"));
});

test("sin WhatsApp no hay enlace de WhatsApp, pero siempre hay correo", () => {
  const links = contactLinks({ code: "YG-000008", contact: { name: "Luis", email: "luis@yugen.test", whatsapp: "" } }, "generic");
  assert.strictEqual(links.whatsapp, null);
  assert.ok(links.email.startsWith("mailto:luis@yugen.test?"));
});

test("las plantillas no incluyen notas internas ni tokens", () => {
  const links = contactLinks(request, "ready");
  assert.ok(links.text.includes("lista para coordinar"));
  assert.ok(/token|nota|interna/i.test(links.text) === false);
});
