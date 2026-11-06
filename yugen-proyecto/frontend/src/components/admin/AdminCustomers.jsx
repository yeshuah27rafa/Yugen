// components/admin/AdminCustomers.jsx
// Clientes en modo lectura: solo lo necesario para gestionar solicitudes.
import { useState } from "react";
import { apiDelete } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";

export default function AdminCustomers() {
  const customers = useApi("/admin/clientes");
  const [error, setError] = useState("");

  // Dos confirmaciones: primero la cuenta, después qué hacer con sus solicitudes (anonimizar o borrar).
  async function removeCustomer(item) {
    if (window.confirm(`¿Eliminar la cuenta de ${item.email}?`) === false) return;
    const deleteRequests = window.confirm("¿Borrar también sus solicitudes? Aceptar = borrar. Cancelar = solo anonimizarlas.");
    try {
      await apiDelete(`/admin/clientes/${item.id}?deleteRequests=${deleteRequests ? "true" : "false"}`);
      customers.reload();
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <DataState
      state={customers.status === "ready" ? { status: "ready", data: customers.data.items } : customers}
      emptyText="Todavía no hay cuentas registradas."
      render={(items) => (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Verificada</th><th scope="col">Solicitudes</th><th scope="col">Registro</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.verified ? "Sí" : "No"}</td>
                  <td>{item.requestCount}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td><button className="link-button link-button--danger" type="button" onClick={() => removeCustomer(item)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
