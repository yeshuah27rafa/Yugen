// services/requestService.js
// Creación de solicitudes: validación en servidor, snapshots, límite atómico de pendientes y código legible.
const Customer = require("../models/Customer");
const Counter = require("../models/Counter");
const Product = require("../models/Product");
const Request = require("../models/Request");
const { validateLines } = require("./cartService");
const { normalizePanamaWhatsapp } = require("../utils/phone");

const MAX_PENDING = 3;
const DELIVERY_METHODS = ["retiro", "entrega_personal", "envio_nacional"];
const MAX_COMMENT = 500;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Resuelve el medio de contacto. Regla: WhatsApp obligatorio; sin WhatsApp, se usa el correo de la cuenta.
function resolveWhatsapp(body) {
  if (body.useEmailOnly === true) return "";
  const local = normalizePanamaWhatsapp(body.whatsapp);
  if (local === null) {
    throw fail(400, "Escribe tu número de WhatsApp de 8 dígitos (con o sin 507), o marca la opción de usar tu correo.");
  }
  return local;
}

// Código legible YG-000001. Reintenta una vez si dos primeras solicitudes crean el contador a la vez.
async function nextCode() {
  let counter = null;
  for (let attempt = 0; attempt < 3 && counter === null; attempt += 1) {
    try {
      counter = await Counter.findOneAndUpdate({ _id: "request" }, { $inc: { seq: 1 } }, { upsert: true, new: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  if (counter === null) throw fail(500, "No pudimos generar el código de la solicitud.");
  return "YG-" + String(counter.seq).padStart(6, "0");
}

async function createRequest(customerId, body) {
  const checked = validateLines(body.items);
  if (checked.errors.length > 0) throw fail(400, checked.errors.join(" "));
  if (checked.lines.length === 0) throw fail(400, "Tu carrito está vacío.");

  const deliveryMethod = String(body.deliveryMethod || "");
  if (DELIVERY_METHODS.includes(deliveryMethod) === false) throw fail(400, "Elige una forma de entrega.");

  const comment = String(body.comment || "").trim();
  if (comment.length > MAX_COMMENT) throw fail(400, `El comentario no puede superar ${MAX_COMMENT} caracteres.`);

  const whatsapp = resolveWhatsapp(body);

  // Las piezas se leen del servidor: nunca se usan precios ni nombres enviados por el cliente.
  const ids = checked.lines.map((line) => line.productId);
  const products = await Product.find({ _id: { $in: ids } });
  if (products.length !== ids.length) {
    throw fail(400, "Una de las piezas ya no está disponible. Revisa tu carrito.");
  }
  const productById = {};
  products.forEach((product) => { productById[String(product._id)] = product; });

  // Límite atómico: solo incrementa si el cliente tiene menos de tres pendientes.
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, pendingRequestCount: { $lt: MAX_PENDING } },
    { $inc: { pendingRequestCount: 1 } },
    { new: true }
  );
  if (customer === null) {
    throw fail(409, "Tienes tres solicitudes pendientes de aprobación. Espera a que el administrador las revise antes de enviar otra.");
  }

  try {
    const code = await nextCode();
    const items = checked.lines.map((line) => {
      const product = productById[line.productId];
      return {
        product: product._id,
        nameSnapshot: product.name,
        priceSnapshot: product.price,
        quantity: line.quantity
      };
    });
    const request = await Request.create({
      code,
      customer: customer._id,
      contact: { name: customer.name, email: customer.email, whatsapp },
      items,
      comment,
      deliveryMethod,
      status: "nueva",
      statusHistory: [{ from: null, to: "nueva", at: new Date(), by: "cliente" }]
    });
    await Customer.updateOne({ _id: customerId }, { $set: { savedCart: [] } });
    return { code: request.code, status: request.status };
  } catch (error) {
    // Si la solicitud no se guardó, el cupo vuelve a quedar disponible.
    await Customer.updateOne({ _id: customerId }, { $inc: { pendingRequestCount: -1 } });
    throw error;
  }
}

// Solo datos que el cliente necesita: sin notas internas ni historial completo.
async function listMyRequests(customerId) {
  const requests = await Request.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("code status createdAt deliveryMethod items.nameSnapshot items.quantity");
  return requests.map((request) => ({
    code: request.code,
    status: request.status,
    createdAt: request.createdAt,
    deliveryMethod: request.deliveryMethod,
    items: request.items.map((item) => ({ name: item.nameSnapshot, quantity: item.quantity }))
  }));
}

module.exports = { createRequest, listMyRequests, MAX_PENDING };
