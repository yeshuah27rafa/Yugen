// components/admin/AdminPanel.jsx
// Panel de piezas: lista, alta, edición y eliminación. Recarga los datos tras cada cambio.
import { useState } from "react";
import { apiDelete } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import DataState from "../DataState.jsx";
import ProductList from "./ProductList.jsx";
import ProductForm from "./ProductForm.jsx";

export default function AdminPanel({ email, onLogout, logoutError }) {
  const products = useApi("/admin/products");
  const works = useApi("/works");
  const [editing, setEditing] = useState(null); // null: lista; "new": alta; objeto: edición
  const [notice, setNotice] = useState("");

  const sessionExpired = products.status === "error" && products.httpStatus === 401;

  function handleSaved() {
    setEditing(null);
    setNotice("Cambios guardados.");
    products.reload();
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`);
    if (confirmed === false) return;
    try {
      await apiDelete(`/admin/products/${product._id}`);
      setNotice("Pieza eliminada.");
      products.reload();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Piezas</h1>
          <p className="status">Sesión: {email}</p>
        </div>
        <div className="admin-panel__actions">
          {editing === null ? (
            <button className="button" type="button" onClick={() => { setNotice(""); setEditing("new"); }}>
              Nueva pieza
            </button>
          ) : null}
          <button className="btn-ghost" type="button" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      {notice !== "" ? <p className="status" role="status">{notice}</p> : null}
      {logoutError !== "" ? <p className="status status--error" role="alert">{logoutError}</p> : null}

      {sessionExpired ? (
        <div className="status status--error">
          Tu sesión expiró. <button className="link-button" type="button" onClick={onLogout}>Vuelve a iniciar sesión</button>
        </div>
      ) : editing === null ? (
        <DataState
          state={products}
          emptyText="Todavía no hay piezas. Crea la primera con «Nueva pieza»."
          render={(items) => (
            <ProductList
              products={items}
              onEdit={(product) => { setNotice(""); setEditing(product); }}
              onDelete={handleDelete}
            />
          )}
        />
      ) : (
        <ProductForm
          product={editing === "new" ? null : editing}
          worksState={works}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
