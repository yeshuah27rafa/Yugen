// Vista previa compartida de solicitudes: se reutiliza en el historial y en la actividad reciente de Cuenta.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import ProductImage from "../art/ProductImage.jsx";
import { formatPrice } from "../../utils/format.js";

const STATUS_LABEL = { nueva: "En proceso", aprobada: "Aprobada", en_proceso: "Aprobada", completada: "Aprobada", rechazada: "No aprobada", cancelada: "Cancelada" };
const DELIVERY_LABEL = { retiro: "Retiro personal", entrega_personal: "Entrega personal", envio_nacional: "Envío nacional en Panamá" };

function statusClass(status) {
  if (status === "nueva") return "nueva";
  if (status === "rechazada" || status === "cancelada") return status;
  return "aprobada";
}

function requestTotal(request) {
  return (request.items || []).reduce((sum, item) => {
    const price = item.price;
    const quantity = Number(item.quantity || 1);
    return sum + (price == null || !Number.isFinite(Number(price)) ? 0 : Number(price) * quantity);
  }, 0);
}

export default function RequestPreviewDrawer({ request, onClose, returnLabel = "Seguir en mis solicitudes" }) {
  useEffect(() => {
    if (!request) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [request, onClose]);

  if (!request) return null;
  const items = request.items || [];
  const total = requestTotal(request);
  const hasUnpriced = items.some((item) => item.price == null || !Number.isFinite(Number(item.price)));
  const detailPath = `/cuenta/solicitudes/${encodeURIComponent(request.code)}`;

  return (
    <div className="request-preview-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="request-preview-drawer" role="dialog" aria-modal="true" aria-labelledby="request-preview-title">
        <header className="request-preview-drawer__head">
          <div><p className="micro">Vista rápida · Archivo Yugen</p><h2 id="request-preview-title">Tu solicitud</h2></div>
          <button className="request-preview-drawer__close" type="button" onClick={onClose} aria-label="Cerrar vista previa" autoFocus>×</button>
        </header>
        <div className="request-preview-drawer__body">
          <div className="request-preview-drawer__identity">
            <div><small>CÓDIGO DE SOLICITUD</small><strong>{request.code}</strong></div>
            <span className={`request-status request-status--${statusClass(request.status)}`}>{STATUS_LABEL[request.status] || request.status}</span>
          </div>
          <p className="request-preview-drawer__date">Registrada el {new Date(request.createdAt).toLocaleString("es-PA", { dateStyle: "long", timeStyle: "short" })}</p>
          <div className="request-preview-drawer__items-head"><h3>Piezas incluidas</h3><span>{items.length} {items.length === 1 ? "referencia" : "referencias"}</span></div>
          <ul className="request-preview-drawer__items">
            {items.map((item, index) => (
              <li key={`${item.productId || item.slug || item.name}-${index}`}>
                <div className="request-preview-drawer__image">{item.image?.url ? <ProductImage image={item.image} product={{ name: item.name }} /> : <span aria-hidden="true">幽玄</span>}</div>
                <div className="request-preview-drawer__item-copy"><strong>{item.name}</strong><small>Cantidad · {item.quantity || 1}</small></div>
                <span className="request-preview-drawer__price">{item.price == null || !Number.isFinite(Number(item.price)) ? "A consultar" : formatPrice(Number(item.price) * Number(item.quantity || 1))}</span>
              </li>
            ))}
          </ul>
          <div className="request-preview-drawer__delivery"><span>Forma de entrega</span><strong>{DELIVERY_LABEL[request.deliveryMethod] || request.deliveryMethod || "Por coordinar"}</strong></div>
          <div className="request-preview-drawer__total"><span>Total de piezas con precio</span><strong>{formatPrice(total)}</strong></div>
          {hasUnpriced ? <p className="request-preview-drawer__note">Algunas piezas requieren confirmar su precio durante la coordinación.</p> : null}
        </div>
        <footer className="request-preview-drawer__foot">
          <Link className="button" to={detailPath} onClick={onClose}>Ver seguimiento completo ↗</Link>
          <button className="link-button" type="button" onClick={onClose}>{returnLabel}</button>
        </footer>
      </aside>
    </div>
  );
}
