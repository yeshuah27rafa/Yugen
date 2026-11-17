// Indicadores del día y ejecución controlada de la política de retención.
import { useState } from "react";
import { apiPost } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";

const CARDS = [
  { key: "pendingApproval", label: "Pendientes de aprobación", section: "solicitudes" },
  { key: "newToday", label: "Solicitudes nuevas hoy", section: "solicitudes" },
  { key: "inProcess", label: "Aprobadas o en proceso", section: "solicitudes" },
  { key: "customersTotal", label: "Cuentas registradas", section: "clientes" },
  { key: "customersUnverified", label: "Cuentas sin verificar", section: "clientes" },
  { key: "soldOut", label: "Piezas agotadas", section: "piezas" },
  { key: "lowStock", label: "Stock bajo (2 o menos)", section: "piezas" },
  { key: "messagesNew", label: "Mensajes sin revisar", section: "mensajes" }
];

export default function AdminDashboard({ onNavigate }) {
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
              <button className="admin-card admin-card--button" key={card.key} type="button" onClick={() => onNavigate(card.section)} aria-label={`${card.label}: abrir ${card.section}`}>
                <span className="admin-card__value">{items[0][card.key]}</span>
                <span className="status">{card.label}</span>
                <span className="admin-card__hint">Abrir sección ↗</span>
              </button>
            ))}
          </div>
        )}
      />
      <nav className="admin-quicklinks" aria-label="Configuración de la tienda">
        <button type="button" className="btn-ghost" onClick={() => onNavigate("categorias")}>Administrar categorías ↗</button>
        <button type="button" className="btn-ghost" onClick={() => onNavigate("obras")}>Administrar obras ↗</button>
      </nav>
      <div className="form-foot">
        <button className="btn-ghost" type="button" onClick={runRetention} disabled={running}>
          {running ? "Ejecutando…" : "Ejecutar retención ahora"}
        </button>
        {report.text !== "" ? <p className={report.kind === "error" ? "status status--error" : "status"} role={report.kind === "error" ? "alert" : "status"}>{report.text}</p> : null}
      </div>
    </>
  );
}
