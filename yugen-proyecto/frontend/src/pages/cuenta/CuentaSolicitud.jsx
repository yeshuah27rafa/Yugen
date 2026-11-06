// pages/cuenta/CuentaSolicitud.jsx
// Detalle de una solicitud propia: productos, estado, historial y contacto por WhatsApp con el código.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, clientePost } from "../../api/client.js";
import { useApi } from "../../hooks/useApi.js";
import { formatPrice } from "../../utils/format.js";

const STATUS_LABEL = {
  nueva: "Nueva", aprobada: "Aprobada", en_proceso: "En proceso",
  completada: "Completada", rechazada: "Rechazada", cancelada: "Cancelada"
};

export default function CuentaSolicitud() {
  const { code } = useParams();
  const detail = useApi(`/cuenta/solicitudes/${encodeURIComponent(code)}`);
  const [shop, setShop] = useState(null);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    apiGet("/contacto/tienda").then(setShop).catch(() => setShop({ email: "", whatsapp: "" }));
  }, []);

  if (detail.status === "loading") return <section className="cuenta-page"><p className="status">Cargando…</p></section>;
  if (detail.status === "error") {
    return (
      <section className="cuenta-page">
        <h1>Solicitud no encontrada</h1>
        <p className="status status--error" role="alert">{detail.error}</p>
        <Link className="link-button" to="/cuenta/solicitudes">Volver a mis solicitudes</Link>
      </section>
    );
  }

  const request = detail.data;

  // D8: solo se puede cancelar mientras la solicitud está en "nueva".
  async function handleCancel() {
    if (window.confirm("¿Cancelar esta solicitud?") === false) return;
    try {
      await clientePost(`/cuenta/solicitudes/${encodeURIComponent(request.code)}/cancelar`, {});
      detail.reload();
    } catch (failure) {
      setCancelError(failure.message);
    }
  }
  const text = `Hola, escribo sobre mi solicitud ${request.code} en Yugen.`;
  const whatsappUrl = shop && shop.whatsapp ? `https://wa.me/507${shop.whatsapp}?text=${encodeURIComponent(text)}` : null;

  return (
    <section className="cuenta-page">
      <h1>{request.code}</h1>
      <p className="status">Estado: <strong>{STATUS_LABEL[request.status]}</strong></p>
      <ul className="admin-lines">
        {request.items.map((item, index) => (
          <li key={index}>{item.name} × {item.quantity} · {item.price === null ? "a consultar" : formatPrice(item.price)}</li>
        ))}
      </ul>
      {request.comment ? <p className="status">Tu comentario: {request.comment}</p> : null}
      <h2>Historial</h2>
      <ul className="admin-lines">
        {request.history.map((entry, index) => (
          <li key={index}>{STATUS_LABEL[entry.to]} · {new Date(entry.at).toLocaleString()}</li>
        ))}
      </ul>
      {whatsappUrl ? <a className="button" href={whatsappUrl} target="_blank" rel="noreferrer">Escribir por WhatsApp</a> : null}
      {request.status === "nueva" ? <button className="btn-ghost" type="button" onClick={handleCancel}>Cancelar solicitud</button> : null}
      {cancelError !== "" ? <p className="status status--error" role="alert">{cancelError}</p> : null}
      <Link className="link-button" to="/cuenta/solicitudes">Volver a mis solicitudes</Link>
    </section>
  );
}
