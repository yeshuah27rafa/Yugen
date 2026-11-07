// Indicadores del día y ejecución controlada de la política de retención.
import { useState } from "react";
import { apiPost } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";

const CARDS = [
  { key: "pendingApproval", label: "Pendientes de aprobación" },
  { key: "newToday", label: "Solicitudes nuevas hoy" },
  { key: "inProcess", label: "Aprobadas o en proceso" },
  { key: "customersTotal", label: "Cuentas registradas" },
  { key: "customersUnverified", label: "Cuentas sin verificar" },
  { key: "soldOut", label: "Piezas agotadas" },
  { key: "lowStock", label: "Stock bajo (2 o menos)" },
  { key: "messagesNew", label: "Mensajes sin revisar" }
];

export default function AdminDashboard() {
  const summary = useApi("/admin/resumen");
  const [report, setReport] = useState({ kind: "", text: "" });
  const [running, setRunning] = useState(false);

  async function runRetention() {
    const confirmed = window.confirm(
      "La retención anonimiza solicitudes cerradas con más de 24 meses y elimina cuentas sin verificar según la política configurada. ¿Quieres ejecutar este proceso ahora?"
    );
    if (!confirmed) return;

    setRunning(true);
    setReport({ kind: "", text: "" });
    try {
      const result = await apiPost("/admin/retencion/ejecutar", {});
      setReport({
        kind: "success",
        text: `Solicitudes anonimizadas: ${result.requestsAnonymized}. Cuentas sin verificar eliminadas: ${result.unverifiedAccountsRemoved}.`
      });
      summary.reload();
    } catch (failure) {
      setReport({ kind: "error", text: failure.message || "No pudimos ejecutar la retención." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <DataState
        state={summary.status === "ready" ? { status: "ready", data: [summary.data] } : summary}
        emptyText="Sin datos."
        render={(items) => (
          <div className="admin-cards">
            {CARDS.map((card) => (
              <div className="admin-card" key={card.key}>
                <p className="admin-card__value">{items[0][card.key]}</p>
                <p className="status">{card.label}</p>
              </div>
            ))}
          </div>
        )}
      />
      <div className="form-foot">
        <button className="btn-ghost" type="button" onClick={runRetention} disabled={running}>
          {running ? "Ejecutando…" : "Ejecutar retención ahora"}
        </button>
        {report.text !== "" ? <p className={report.kind === "error" ? "status status--error" : "status"} role={report.kind === "error" ? "alert" : "status"}>{report.text}</p> : null}
      </div>
    </>
  );
}
