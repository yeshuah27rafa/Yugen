// pages/cuenta/CuentaSolicitudes.jsx
// Lista de solicitudes propias con su estado.
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../../components/DataState.jsx";

const STATUS_LABEL = {
  nueva: "Nueva", aprobada: "Aprobada", en_proceso: "En proceso",
  completada: "Completada", rechazada: "Rechazada", cancelada: "Cancelada"
};

export default function CuentaSolicitudes() {
  const list = useApi("/cuenta/solicitudes");
  return (
    <section className="cuenta-page">
      <h1>Mis solicitudes</h1>
      <DataState
        state={list.status === "ready" ? { status: "ready", data: list.data.requests } : list}
        emptyText="Todavía no tienes solicitudes."
        render={(items) => (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item.code}>
                <Link className="link-button" to={`/cuenta/solicitudes/${item.code}`}>
                  {item.code} · {STATUS_LABEL[item.status]} · {new Date(item.createdAt).toLocaleDateString()}
                </Link>
              </li>
            ))}
          </ul>
        )}
      />
      <Link className="link-button" to="/cuenta">Volver a mi cuenta</Link>
    </section>
  );
}
