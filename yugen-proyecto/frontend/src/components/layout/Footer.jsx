// components/layout/Footer.jsx
// Pie breve: catálogo, cuenta y contacto real de la tienda. Acceso administrativo discreto.
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi.js";
import { CATEGORY_OPTIONS } from "../../utils/catalogOptions.js";

export default function Footer() {
  const contact = useApi("/contacto/tienda");
  const info = contact.status === "ready" ? contact.data : { email: "", whatsapp: "" };
  return (
    <footer className="site-footer">
      <p className="site-footer__mark" aria-hidden="true">YUGEN<span lang="ja">幽玄</span></p>
      <div className="site-footer__cols">
        <nav aria-label="Catálogo">
          <h2>Catálogo</h2>
          {CATEGORY_OPTIONS.filter((c) => c.value !== "").map((c) => <Link key={c.value} to={`/catalogo?category=${c.value}`}>{c.label}</Link>)}
        </nav>
        <nav aria-label="Cuenta">
          <h2>Cuenta</h2>
          <Link to="/cuenta/entrar">Entrar</Link>
          <Link to="/cuenta/solicitudes">Mis solicitudes</Link>
          <Link to="/carrito">Carrito</Link>
        </nav>
        <div>
          <h2>Contacto</h2>
          {info.email !== "" ? <a href={`mailto:${info.email}`}>{info.email}</a> : null}
          {info.whatsapp !== "" ? <a href={`https://wa.me/507${String(info.whatsapp).replace(/\D/g, "").replace(/^507/, "")}`} rel="noopener">WhatsApp</a> : null}
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
