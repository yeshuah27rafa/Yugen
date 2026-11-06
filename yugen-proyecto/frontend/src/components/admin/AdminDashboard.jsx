// components/admin/AdminDashboard.jsx
// Indicadores del día: solicitudes pendientes, clientes, stock y mensajes sin revisar.
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
  const [report, setReport] = useState("");

  // Ejecuta la retención de datos ahora (solicitudes cerradas de más de 24 meses y cuentas sin verificar).
  async function runRetention() {
    const result = await apiPost("/admin/retencion/ejecutar", {});
    setReport(`Solicitudes anonimizadas: ${result.requestsAnonymized}. Cuentas sin verificar eliminadas: ${result.unverifiedAccountsRemoved}.`);
    summary.reload();
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
      <button className="btn-ghost" type="button" onClick={runRetention}>Ejecutar retención ahora</button>
      <p className="status" role="status">{report}</p>
    </div>
    </>
  );
}
