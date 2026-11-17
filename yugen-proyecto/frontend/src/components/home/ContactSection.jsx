// Contacto general de la tienda: formulario y canal directo de WhatsApp.
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../api/client.js";

function whatsappLink(number) {
  const digits = String(number || "").replace(/\D/g, "").replace(/^507/, "");
  return digits ? `https://wa.me/507${digits}?text=${encodeURIComponent("Hola, Yugen. Quisiera realizar una consulta general sobre la tienda.")}` : null;
}

export default function ContactSection() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    let active = true;
    apiGet("/contacto/tienda").then((data) => { if (active) setWhatsapp(data.whatsapp || ""); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setMessage("");
    try {
      await apiPost("/contact", {
        name: data.get("name"),
        email: data.get("email"),
        message: data.get("message")
      });
      form.reset();
      setMessage("Mensaje enviado. Te respondemos pronto.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }

  const whatsappUrl = whatsappLink(whatsapp);

  return (
    <section id="contacto" className="contact" aria-labelledby="contact-title">
      <div className="contact__intro">
        <h2 id="contact-title">Escríbenos</h2>
        <p className="contact__lead">¿Buscas una serie o una pieza en específico? Cuéntanos y la buscamos.</p>
        {whatsappUrl ? <a className="button button--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a> : null}
      </div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" required aria-label="Nombre" />
        <input name="email" type="email" placeholder="Correo" required aria-label="Correo" />
        <textarea name="message" rows="4" placeholder="Tu mensaje" required aria-label="Mensaje" />
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>
            {sending ? "Enviando…" : "Enviar mensaje"}
          </button>
          <p className="status" role="status">{message}</p>
        </div>
      </form>
    </section>
  );
}
