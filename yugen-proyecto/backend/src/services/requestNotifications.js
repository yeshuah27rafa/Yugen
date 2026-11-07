// services/requestNotifications.js
// Correos de solicitudes. Un fallo de envío se registra sin datos personales y no afecta la operación principal.
const { getMailer } = require("../mail");
const { readConfig } = require("../config/env");

const NOTIFIED_STATUSES = ["aprobada", "en_proceso", "completada", "rechazada", "cancelada"];
const STATUS_TEXT = {
  aprobada: "fue aprobada. Te escribiremos para coordinar el pago contra entrega y la entrega.",
  en_proceso: "está en proceso de coordinación.",
  completada: "fue completada. ¡Gracias por tu compra!",
  rechazada: "no pudo atenderse en este momento. Si quieres, escríbenos para revisar otras opciones.",
  cancelada: "fue cancelada."
};

function itemLines(request) {
  return request.items.map((item) => `- ${item.nameSnapshot} x${item.quantity}`).join("\n");
}

async function notifyNewRequest(request) {
  const config = readConfig();
  try {
    if (config.adminEmail !== "") {
      await getMailer().send({
        from: config.mailFrom,
        to: config.adminEmail,
        subject: `Nueva solicitud ${request.code}`,
        text: `Hay una nueva solicitud ${request.code}:\n${itemLines(request)}\nRevísala en el panel de administración.`
      });
    }
    await getMailer().send({
      from: config.mailFrom,
      to: request.contact.email,
      subject: `Recibimos tu solicitud ${request.code}`,
      text: `Hola ${request.contact.name}. Recibimos tu solicitud ${request.code}. Te contactaremos para coordinar.\n${itemLines(request)}`
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de la nueva solicitud.");
  }
}

async function notifyStatusChange(request, to) {
  if (NOTIFIED_STATUSES.includes(to) === false) return;
  const config = readConfig();
  try {
    await getMailer().send({
      from: config.mailFrom,
      to: request.contact.email,
      subject: `Tu solicitud ${request.code} ${STATUS_TEXT[to].split(".")[0]}`,
      text: `Hola ${request.contact.name}. Tu solicitud ${request.code} ${STATUS_TEXT[to]}`
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de cambio de estado.");
  }
}

module.exports = { notifyNewRequest, notifyStatusChange };
