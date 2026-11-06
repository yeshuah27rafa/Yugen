// services/adminRequestService.js
// Operaciones del administrador sobre solicitudes, clientes, mensajes e indicadores.
const mongoose = require("mongoose");
const Request = require("../models/Request");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Work = require("../models/Work");
const Contact = require("../models/Contact");
const { canTransition, isPending, STATUSES } = require("../utils/requestStatus");
const { contactLinks } = require("../utils/whatsappLink");
const { notifyStatusChange } = require("./requestNotifications");

const PAGE_SIZE = 20;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pageNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}

function requireValidId(id) {
  if (mongoose.isValidObjectId(id) === false) throw fail(404, "No encontrado.");
}

function allowedTransitionsFrom(status) {
  return STATUSES.filter((to) => canTransition(status, to));
}

async function listRequests(query) {
  const filter = {};
  if (STATUSES.includes(String(query.status || ""))) filter.status = String(query.status);
  const search = String(query.q || "").trim();
  if (search !== "") {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ code: pattern }, { "contact.name": pattern }, { "contact.email": pattern }];
  }
  const page = pageNumber(query.page);
  const total = await Request.countDocuments(filter);
  const items = await Request.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .select("code status createdAt deliveryMethod contact.name contact.email contact.whatsapp items.nameSnapshot items.quantity contactedAt");
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

async function getRequest(id) {
  requireValidId(id);
  const request = await Request.findById(id);
  if (request === null) return null;
  return {
    request,
    allowedTransitions: allowedTransitionsFrom(request.status),
    links: contactLinks(request, "generic"),
    templates: { approved: contactLinks(request, "approved").text, ready: contactLinks(request, "ready").text }
  };
}

// Cambio de estado: la transición se valida y se aplica de forma condicional al estado leído.
async function transition(id, to, adminEmail) {
  requireValidId(id);
  const current = await Request.findById(id);
  if (current === null) throw fail(404, "Solicitud no encontrada.");
  if (canTransition(current.status, to) === false) {
    throw fail(409, `No se puede pasar de ${current.status} a ${to}.`);
  }
  const updated = await Request.findOneAndUpdate(
    { _id: id, status: current.status },
    { $set: { status: to }, $push: { statusHistory: { from: current.status, to, at: new Date(), by: adminEmail } } },
    { new: true }
  );
  if (updated === null) throw fail(409, "La solicitud cambió mientras la revisabas. Recárgala.");

  // Al salir de "nueva", la solicitud deja de contar para el límite del cliente.
  if (isPending(current.status) && isPending(to) === false) {
    await Customer.updateOne({ _id: current.customer, pendingRequestCount: { $gt: 0 } }, { $inc: { pendingRequestCount: -1 } });
  }
  await notifyStatusChange(updated, to);
  return { status: updated.status };
}

async function addNote(id, text, adminEmail) {
  requireValidId(id);
  const value = String(text || "").trim();
  if (value === "" || value.length > 1000) throw fail(400, "La nota debe tener entre 1 y 1000 caracteres.");
  const updated = await Request.findByIdAndUpdate(
    id,
    { $push: { adminNotes: { text: value, by: adminEmail, at: new Date() } } },
    { new: true }
  );
  if (updated === null) throw fail(404, "Solicitud no encontrada.");
  return { ok: true };
}

async function markContacted(id) {
  requireValidId(id);
  const updated = await Request.findByIdAndUpdate(id, { $set: { contactedAt: new Date() } }, { new: true });
  if (updated === null) throw fail(404, "Solicitud no encontrada.");
  return { contactedAt: updated.contactedAt };
}

async function dashboard() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [pendingApproval, newToday, inProcess, customersTotal, customersVerified, soldOut, lowStock, messagesNew] = await Promise.all([
    Request.countDocuments({ status: "nueva" }),
    Request.countDocuments({ createdAt: { $gte: startOfDay } }),
    Request.countDocuments({ status: { $in: ["aprobada", "en_proceso"] } }),
    Customer.countDocuments({}),
    Customer.countDocuments({ emailVerifiedAt: { $ne: null } }),
    Product.countDocuments({ availability: "agotado" }),
    Product.countDocuments({ availability: "en_stock", stock: { $lte: 2 } }),
    Contact.countDocuments({ status: { $ne: "revisado" } })
  ]);
  return {
    pendingApproval,
    newToday,
    inProcess,
    customersTotal,
    customersVerified,
    customersUnverified: customersTotal - customersVerified,
    soldOut,
    lowStock,
    messagesNew
  };
}

// Clientes: solo datos necesarios para gestionar solicitudes. Nunca contraseñas ni tokens.
async function listCustomers(query) {
  const page = pageNumber(query.page);
  const customers = await Customer.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .select("name email createdAt emailVerifiedAt");
  const ids = customers.map((customer) => customer._id);
  const counts = await Request.aggregate([
    { $match: { customer: { $in: ids } } },
    { $group: { _id: "$customer", total: { $sum: 1 } } }
  ]);
  const byCustomer = {};
  counts.forEach((row) => { byCustomer[String(row._id)] = row.total; });
  return customers.map((customer) => ({
    id: customer._id,
    name: customer.name,
    email: customer.email,
    createdAt: customer.createdAt,
    verified: customer.emailVerifiedAt !== null,
    requestCount: byCustomer[String(customer._id)] || 0
  }));
}

async function listMessages() {
  return Contact.find({}).sort({ createdAt: -1 }).limit(50).populate("product", "name slug");
}

async function markMessageReviewed(id) {
  requireValidId(id);
  const updated = await Contact.findByIdAndUpdate(id, { $set: { status: "revisado", reviewedAt: new Date() } }, { new: true });
  if (updated === null) throw fail(404, "Mensaje no encontrado.");
  return { status: updated.status };
}

// Recalcula el contador de pendientes de cada cliente desde las solicitudes reales.
async function reconcilePending() {
  const customers = await Customer.find({}).select("_id");
  let fixed = 0;
  for (const customer of customers) {
    const total = await Request.countDocuments({ customer: customer._id, status: "nueva" });
    const result = await Customer.updateOne({ _id: customer._id, pendingRequestCount: { $ne: total } }, { $set: { pendingRequestCount: total } });
    if (result.modifiedCount > 0) fixed += 1;
  }
  return { fixed };
}

// Anonimiza las solicitudes de un cliente: se conservan productos y fechas, se borran datos personales.
async function anonymizeCustomerRequests(customerId) {
  await Request.updateMany(
    { customer: customerId },
    { $set: { "contact.name": "Cliente eliminado", "contact.email": "anonimo@eliminado.local", "contact.whatsapp": "", "contact.altEmail": "", anonymizedAt: new Date(), comment: "" } }
  );
}

// Borrado total de solicitudes de un cliente (opción del administrador).
async function deleteCustomerRequests(customerId) {
  await Request.deleteMany({ customer: customerId });
}

// Borra una cuenta desde el panel. Por defecto anonimiza sus solicitudes; con deleteRequests las elimina.
async function deleteCustomer(id, deleteRequests) {
  requireValidId(id);
  const customer = await Customer.findById(id);
  if (customer === null) throw fail(404, "Cliente no encontrado.");
  if (deleteRequests === true) {
    await deleteCustomerRequests(id);
  } else {
    await anonymizeCustomerRequests(id);
  }
  await Customer.deleteOne({ _id: id });
  return { ok: true };
}

// Borra una solicitud (opción del administrador). Si estaba pendiente, libera el cupo del cliente.
async function deleteRequest(id) {
  requireValidId(id);
  const request = await Request.findByIdAndDelete(id);
  if (request === null) throw fail(404, "Solicitud no encontrada.");
  if (isPending(request.status)) {
    await Customer.updateOne({ _id: request.customer, pendingRequestCount: { $gt: 0 } }, { $inc: { pendingRequestCount: -1 } });
  }
  return { ok: true };
}

async function deleteMessage(id) {
  requireValidId(id);
  const removed = await Contact.findByIdAndDelete(id);
  if (removed === null) throw fail(404, "Mensaje no encontrado.");
  return { ok: true };
}

// Obras: el administrador las crea, edita y borra. Una obra con piezas no se puede borrar.
async function createWork(data) {
  const title = String(data.title || "").trim();
  const slug = String(data.slug || "").trim().toLowerCase();
  if (title === "" || /^[a-z0-9-]+$/.test(slug) === false) throw fail(400, "La obra necesita título y un enlace (slug) válido.");
  const year = data.year === "" || data.year === undefined ? undefined : Number(data.year);
  return Work.create({ title, slug, year, synopsis: String(data.synopsis || ""), cover: String(data.cover || "") });
}

async function updateWork(id, data) {
  requireValidId(id);
  const updated = await Work.findByIdAndUpdate(id, {
    $set: {
      title: String(data.title || "").trim(),
      slug: String(data.slug || "").trim().toLowerCase(),
      year: data.year === "" || data.year === undefined ? undefined : Number(data.year),
      synopsis: String(data.synopsis || ""),
      cover: String(data.cover || "")
    }
  }, { new: true, runValidators: true });
  if (updated === null) throw fail(404, "Obra no encontrada.");
  return updated;
}

async function deleteWork(id) {
  requireValidId(id);
  const used = await Product.countDocuments({ work: id });
  if (used > 0) throw fail(409, `No se puede borrar: hay ${used} piezas de esta obra. Muévelas o bórralas primero.`);
  const removed = await Work.findByIdAndDelete(id);
  if (removed === null) throw fail(404, "Obra no encontrada.");
  return { ok: true };
}

module.exports = {
  anonymizeCustomerRequests, deleteCustomer, deleteRequest, deleteMessage,
  createWork, updateWork, deleteWork,
  listRequests, getRequest, transition, addNote, markContacted, dashboard,
  listCustomers, listMessages, markMessageReviewed, reconcilePending
};
