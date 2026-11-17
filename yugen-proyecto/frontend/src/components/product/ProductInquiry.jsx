// Consultas adicionales desde la ficha, con acceso directo al canal de WhatsApp de la tienda.
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../api/client.js";

function whatsappLink(number, message) {
  const digits = String(number || "").replace(/\D/g, "").replace(/^507/, "");
  return digits ? `https://wa.me/507${digits}?text=${encodeURIComponent(message)}` : null;
}

function inquiryLabel(availability) {
  if (availability === "agotado") return "Preguntar por reposición";
  return "Realizar consulta";
}

export default function ProductInquiry({ product }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "", text: "" });
  const [shop, setShop] = useState(null);

  useEffect(() => {
    let active = true;
    apiGet("/contacto/tienda")
      .then((data) => { if (active) setShop(data); })
      .catch(() => { if (active) setShop({ whatsapp: "" }); });
    return () => { active = false; };
  }, []);

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

  const whatsappUrl = whatsappLink(shop?.whatsapp, `Hola, Yugen. Quisiera realizar una consulta adicional sobre ${product.name}${product.slug ? ` (${product.slug})` : ""}.`);

  return (
    <section className="inquiry" aria-labelledby="inquiry-title">
      <h2 id="inquiry-title">Consultas adicionales</h2>
      <p className="inquiry__lead">
        Este espacio es para resolver dudas sobre la pieza. Para solicitarla, utiliza el carrito; también puedes escribirnos directamente por WhatsApp.
      </p>
      <form className="inquiry__form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" required aria-label="Nombre" />
        <input name="email" type="email" placeholder="Correo" required aria-label="Correo" />
        <textarea name="message" rows="3" placeholder="¿Qué quieres saber sobre esta pieza?" required aria-label="Mensaje" />
        <div className="inquiry__actions">
          <button className="button" type="submit" disabled={sending}>
            {sending ? "Enviando…" : inquiryLabel(product.availability)}
          </button>
          {whatsappUrl ? <a className="button button--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a> : null}
          <p className={`status${feedback.kind === "error" ? " status--error" : ""}`} role="status">{feedback.text}</p>
        </div>
      </form>
    </section>
  );
}
