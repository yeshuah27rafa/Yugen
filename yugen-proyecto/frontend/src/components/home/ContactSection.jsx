// components/home/ContactSection.jsx
// Formulario de contacto real: envía a la API y el mensaje se guarda en MongoDB.
import { useState } from "react";
import { apiPost } from "../../api/client.js";

export default function ContactSection() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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

  return (
    <section id="contacto" className="contact" aria-labelledby="contact-title">
      <div>
        <h2 id="contact-title">Escríbenos</h2>
        <p className="contact__lead">¿Buscas una serie o una pieza en específico? Cuéntanos y la buscamos.</p>
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
