// utils/requestStatus.js
// Única fuente de verdad de los estados de una solicitud y de las transiciones permitidas.
const TRANSITIONS = {
  nueva: ["aprobada", "rechazada", "cancelada"],
  aprobada: ["en_proceso", "cancelada"],
  en_proceso: ["completada", "cancelada"],
  completada: [],
  rechazada: [],
  cancelada: []
};

const STATUSES = Object.keys(TRANSITIONS);

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Solo las solicitudes "nueva" cuentan para el límite de pendientes.
function isPending(status) {
  return status === "nueva";
}

module.exports = { STATUSES, canTransition, isPending };
