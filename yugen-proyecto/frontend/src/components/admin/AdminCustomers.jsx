// components/admin/AdminCustomers.jsx
// Clientes en modo lectura: solo lo necesario para gestionar solicitudes.
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";

export default function AdminCustomers() {
  const customers = useApi("/admin/clientes");
  return (
    <DataState
      state={customers.status === "ready" ? { status: "ready", data: customers.data.items } : customers}
      emptyText="Todavía no hay cuentas registradas."
      render={(items) => (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Verificada</th><th scope="col">Solicitudes</th><th scope="col">Registro</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.verified ? "Sí" : "No"}</td>
                  <td>{item.requestCount}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
