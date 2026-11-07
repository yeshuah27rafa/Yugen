// services/cartService.js
// Reglas del carrito: validación estricta (entradas del cliente) y fusión tolerante (carrito del navegador).
const Product = require("../models/Product");

const MAX_LINES = 20;
const MAX_QTY = 10;
const OBJECT_ID = /^[a-f0-9]{24}$/;

// Valida cada línea. Un error en cualquier línea rechaza el carrito completo.
function validateLines(items) {
  const errors = [];
  if (Array.isArray(items) === false) {
    return { errors: ["El carrito no es válido."], lines: [] };
  }
  const merged = {};
  const order = [];
  items.forEach((item) => {
    const id = item && typeof item.productId === "string" ? item.productId : "";
    const qty = item ? Number(item.quantity) : NaN;
    if (OBJECT_ID.test(id) === false || Number.isInteger(qty) === false || qty < 1 || qty > MAX_QTY) {
      errors.push("Una línea del carrito no es válida.");
      return;
    }
    if (merged[id] === undefined) {
      merged[id] = 0;
      order.push(id);
    }
    merged[id] = Math.min(MAX_QTY, merged[id] + qty);
  });
  if (order.length > MAX_LINES) {
    errors.push(`El carrito puede tener como máximo ${MAX_LINES} piezas distintas.`);
  }
  return { errors, lines: order.map((id) => ({ productId: id, quantity: merged[id] })) };
}

// Fusiona dos carritos. Las líneas inválidas se descartan; las cantidades se suman y se limitan a MAX_QTY.
function mergeLines(serverLines, guestLines) {
  const merged = {};
  const order = [];
  const all = (serverLines || []).concat(guestLines || []);
  all.forEach((item) => {
    const id = item && typeof item.productId === "string" ? item.productId : "";
    const qty = item ? Number(item.quantity) : NaN;
    if (OBJECT_ID.test(id) === false || Number.isInteger(qty) === false || qty < 1) return;
    if (merged[id] === undefined) {
      merged[id] = 0;
      order.push(id);
    }
    merged[id] = Math.min(MAX_QTY, merged[id] + qty);
  });
  return order.slice(0, MAX_LINES).map((id) => ({ productId: id, quantity: merged[id] }));
}

// Añade datos actuales del producto a cada línea. Las piezas eliminadas se marcan como no disponibles.
async function enrichLines(lines) {
  const ids = lines.map((line) => line.productId);
  const products = await Product.find({ _id: { $in: ids } }).populate("work", "title slug");
  const byId = {};
  products.forEach((product) => { byId[String(product._id)] = product; });
  return lines.map((line) => {
    const product = byId[line.productId];
    if (product === undefined) {
      return { productId: line.productId, quantity: line.quantity, missing: true, name: "Pieza no disponible" };
    }
    return {
      productId: line.productId,
      quantity: line.quantity,
      missing: false,
      name: product.name,
      slug: product.slug,
      price: product.price,
      availability: product.availability,
      mainImage: product.mainImage,
      work: product.work ? product.work.title : ""
    };
  });
}

module.exports = { validateLines, mergeLines, enrichLines, MAX_LINES, MAX_QTY };
