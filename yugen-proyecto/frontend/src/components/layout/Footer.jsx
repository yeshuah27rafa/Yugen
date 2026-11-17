// components/layout/Footer.jsx
// Pie breve: catálogo, cuenta y contacto real de la tienda. Acceso administrativo discreto.
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi.js";

export default function Footer({ categories }) {
  const contact = useApi("/contacto/tienda");
  const info = contact.status === "ready" ? contact.data : { email: "", whatsapp: "" };
  const whatsappDigits = String(info.whatsapp || "").replace(/\D/g, "").replace(/^507/, "");
  return (
    <footer className="site-footer">
      <p className="site-footer__mark" aria-hidden="true">YUGEN<span lang="ja">幽玄</span></p>
      <div className="site-footer__cols">
        <nav aria-label="Catálogo">
          <h2>Catálogo</h2>
          {(categories && categories.status === "ready" ? categories.data.slice(0, 4) : []).map((c) => <Link key={c.slug} to={`/catalogo?category=${c.slug}`}>{c.name}</Link>)}
          <Link to="/catalogo">Ver todo el catálogo ↗</Link>
        </nav>
        <nav aria-label="Cuenta">
          <h2>Cuenta</h2>
          <Link to="/cuenta/entrar">Entrar</Link>
          <Link to="/cuenta/solicitudes">Mis solicitudes</Link>
          <Link to="/carrito">Carrito</Link>
          <Link to="/manifiesto">Nuestra mirada</Link>
        </nav>
        <div>
          <h2>Contacto</h2>
          {info.email !== "" ? <a href={`mailto:${info.email}`}>{info.email}</a> : null}
          {whatsappDigits !== "" ? <a className="button button--whatsapp site-footer__whatsapp" href={`https://wa.me/507${whatsappDigits}?text=${encodeURIComponent("Hola, Yugen. Quisiera realizar una consulta general.")}`} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a> : null}
          <Link to="/#contacto">Escríbenos</Link>
        </div>
      </div>
      <div className="site-footer__base">
        <span>© Yugen · Panamá</span>
        <Link to="/admin">Administración</Link>
      </div>
    </footer>
  );
}
