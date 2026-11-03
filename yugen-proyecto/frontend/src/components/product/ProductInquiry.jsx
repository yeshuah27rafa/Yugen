// components/product/ProductInquiry.jsx
// Consulta para coordinar la compra personalmente. Usa el endpoint de contacto asociado al producto.
import { useState } from "react";
import { apiPost } from "../../api/client.js";

// El texto del botón cambia según la disponibilidad, sin prometer nada que no se pueda cumplir.
function inquiryLabel(availability) {
  if (availability === "agotado") return "Preguntar por reposición";
  if (availability === "pedido_exterior") return "Consultar pedido";
  return "Consultar por esta pieza";
}

export default function ProductInquiry({ product }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "", text: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setFeedback({ kind: "", text: "" });
    try {
      await apiPost("/contact", {
        name: data.get("name"),
        email: data.get("email"),
        message: data.get("message"),
        productSlug: product.slug
      });
      form.reset();
      setFeedback({ kind: "ok", text: "Recibimos tu consulta. Te escribimos para coordinar." });
    } catch (error) {
      setFeedback({ kind: "error", text: error.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="inquiry" aria-labelledby="inquiry-title">
      <h2 id="inquiry-title">Coordina tu compra</h2>
      <p className="inquiry__lead">
        Escríbenos sobre esta pieza y coordinamos disponibilidad, precio y entrega contigo.
      </p>
      <form className="inquiry__form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" required aria-label="Nombre" />
        <input name="email" type="email" placeholder="Correo" required aria-label="Correo" />
        <textarea name="message" rows="3" placeholder="¿Qué quieres saber o pedir?" required aria-label="Mensaje" />
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>
            {sending ? "Enviando…" : inquiryLabel(product.availability)}
          </button>
          <p className="status" role="status">{feedback.text}</p>
        </div>
      </form>
    </section>
  );
}
