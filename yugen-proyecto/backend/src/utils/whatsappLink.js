// utils/whatsappLink.js
// Enlaces para abrir la conversación con el cliente sin API de WhatsApp: wa.me y mailto.
// Las plantillas solo usan nombre, código y texto fijo. Nunca incluyen notas internas ni tokens.
const TEMPLATES = {
  generic: (data) => `Hola ${data.name}, te escribo sobre tu solicitud ${data.code} en Yugen.`,
  approved: (data) => `Hola ${data.name}, tu solicitud ${data.code} fue aprobada. ¿Cómo prefieres coordinar el pago contra entrega y la entrega?`,
  ready: (data) => `Hola ${data.name}, tu solicitud ${data.code} ya está lista para coordinar la entrega o el retiro.`
};

function whatsappUrl(local, text) {
  if (/^\d{8}$/.test(String(local || "")) === false) return null;
  return `https://wa.me/507${local}?text=${encodeURIComponent(text)}`;
}

function mailtoUrl(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Devuelve los enlaces de contacto de una solicitud para una plantilla concreta.
function contactLinks(request, templateKey) {
  const key = TEMPLATES[templateKey] ? templateKey : "generic";
  const data = { name: request.contact.name, code: request.code };
  const text = TEMPLATES[key](data);
  return {
    whatsapp: request.contact.whatsapp ? whatsappUrl(request.contact.whatsapp, text) : null,
    email: mailtoUrl(request.contact.altEmail || request.contact.email, `Tu solicitud ${request.code}`, text),
    text
  };
}

module.exports = { contactLinks, TEMPLATES };
