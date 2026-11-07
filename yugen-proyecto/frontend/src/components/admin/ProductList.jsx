// components/admin/ProductList.jsx
// Tabla de piezas del panel con acciones de edición y eliminación.
import { availabilityLabel, categoryLabel, formatPrice } from "../../utils/format.js";

export default function ProductList({ products, onEdit, onDelete }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Pieza</th>
            <th scope="col">Categoría</th>
            <th scope="col">Obra</th>
            <th scope="col">Precio</th>
            <th scope="col">Disponibilidad</th>
            <th scope="col">Destacada</th>
            <th scope="col"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{categoryLabel(product.category)}</td>
              <td>{product.work ? product.work.title : "—"}</td>
              <td>{formatPrice(product.price)}</td>
              <td>{availabilityLabel(product.availability)}</td>
              <td>{product.featured ? "Sí" : "No"}</td>
              <td className="admin-table__actions">
                <button type="button" className="link-button" onClick={() => onEdit(product)}>Editar</button>
                <button type="button" className="link-button link-button--danger" onClick={() => onDelete(product)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
