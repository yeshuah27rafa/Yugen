// pages/tienda/Solicitud.jsx
// Formulario de solicitud. Requiere sesión de cliente. WhatsApp obligatorio, o correo si no hay WhatsApp.
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { clientePost, clienteGet, setCustomerCsrfToken } from "../../api/client.js";
import { useCart } from "../../hooks/useCart.js";
import { writeCart } from "../../utils/cartStorage.js";

export default function Solicitud() {
  const lines = useCart();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [useEmail, setUseEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    clienteGet("/cuenta/me")
      .then((data) => { setCustomerCsrfToken(data.csrfToken); setChecking(false); })
      .catch(() => navigate("/cuenta/entrar"));
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const response = await clientePost("/solicitudes", {
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        deliveryMethod: data.get("deliveryMethod"),
        whatsapp: String(data.get("whatsapp") || ""),
        useEmailOnly: useEmail,
        comment: String(data.get("comment") || "")
      });
      writeCart([]);
      setResult(response);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  if (checking) return <section className="cart-page"><p className="status">Comprobando tu sesión…</p></section>;

  if (result !== null) {
    return (
      <section className="cart-page">
        <h1>Solicitud enviada</h1>
        <p className="status" role="status">Tu código es <strong>{result.code}</strong>. Guárdalo: te contactaremos para coordinar pago y entrega.</p>
        <Link className="button" to="/cuenta">Ver mi cuenta</Link>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="cart-page">
        <h1>Solicitud</h1>
        <p className="status">Tu carrito está vacío.</p>
        <Link className="button" to="/catalogo">Ver catálogo</Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1>Solicitud</h1>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <label className="field">
          Número de WhatsApp (8 dígitos, con o sin 507)
          <input name="whatsapp" inputMode="tel" disabled={useEmail} required={useEmail === false} autoComplete="tel" />
        </label>
        <label className="field field--check">
          <input type="checkbox" checked={useEmail} onChange={(event) => setUseEmail(event.target.checked)} />
          No tengo WhatsApp: usaré mi correo para coordinar.
        </label>
        <label className="field">
          Forma de entrega
          <select name="deliveryMethod" required defaultValue="retiro">
            <option value="retiro">Retiro personal</option>
            <option value="entrega_personal">Entrega personal</option>
            <option value="envio_nacional">Envío nacional en Panamá</option>
          </select>
        </label>
        <label className="field">
          Comentario (opcional, máximo 500 caracteres)
          <textarea name="comment" rows="3" maxLength="500" />
        </label>
        <div className="form-foot">
          <button className="button" type="submit" disabled={sending}>{sending ? "Enviando…" : "Enviar solicitud"}</button>
        </div>
        <p className="status status--error" role="alert">{error}</p>
      </form>
    </section>
  );
}
