// Presentación neutral del recorrido de una solicitud. No altera los estados del backend.
const FLOW_STAGES = [
  { key: "received", label: "Recibida" },
  { key: "review", label: "Revisión" },
  { key: "approved", label: "Aprobada" },
  { key: "coordination", label: "En coordinación" },
  { key: "completed", label: "Completada" }
];

const STAGE_INDEX = {
  nueva: 1,
  aprobada: 2,
  en_proceso: 3,
  completada: 4
};

const TERMINAL_STATUS = {
  rechazada: {
    key: "not-approved",
    label: "No aprobada",
    message: "En esta ocasión no fue posible continuar con la solicitud. Puedes escribirnos si deseas aclarar alguna duda."
  },
  cancelada: {
    key: "cancelled",
    label: "Cancelada",
    message: "La solicitud se canceló y el proceso terminó aquí. No se completó la coordinación."
  }
};

const ACTIVE_MESSAGES = {
  nueva: "Recibimos tu solicitud y se encuentra en revisión. Te avisaremos cuando haya una actualización.",
  aprobada: "Tu solicitud fue aprobada. El siguiente paso es coordinar los detalles contigo.",
  en_proceso: "La coordinación está en curso. Puedes consultar aquí cada actualización.",
  completada: "La solicitud se marcó como completada. Gracias por coordinar con Yugen."
};

function previousStatusBeforeTerminal(history, terminalStatus) {
  const entries = Array.isArray(history) ? history : [];
  const terminalIndex = entries.findIndex((entry) => entry?.to === terminalStatus);
  if (terminalIndex < 0) return "nueva";

  for (let index = terminalIndex - 1; index >= 0; index -= 1) {
    if (Object.prototype.hasOwnProperty.call(STAGE_INDEX, entries[index]?.to)) {
      return entries[index].to;
    }
  }
  return "nueva";
}

export function buildRequestJourney(request) {
  const status = String(request?.status || "nueva");
  const terminal = TERMINAL_STATUS[status];

  if (terminal) {
    const previousStatus = previousStatusBeforeTerminal(request?.history, status);
    const previousIndex = STAGE_INDEX[previousStatus] ?? STAGE_INDEX.nueva;
    const steps = FLOW_STAGES.slice(0, previousIndex + 1).map((stage) => ({ ...stage, state: "done" }));
    steps.push({ ...terminal, state: "current" });
    return { steps, message: terminal.message, terminal: true, currentLabel: terminal.label };
  }

  const currentIndex = STAGE_INDEX[status] ?? STAGE_INDEX.nueva;
  const steps = FLOW_STAGES.map((stage, index) => ({
    ...stage,
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming"
  }));

  return {
    steps,
    message: ACTIVE_MESSAGES[status] || ACTIVE_MESSAGES.nueva,
    terminal: status === "completada",
    currentLabel: FLOW_STAGES[currentIndex]?.label || FLOW_STAGES[1].label
  };
}

export function getCurrentHistoryIndex(history, status) {
  const entries = Array.isArray(history) ? history : [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.to === status) return index;
  }
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.to !== "contactado") return index;
  }
  return entries.length - 1;
}
