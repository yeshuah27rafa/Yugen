// components/Layout.jsx
// Estructura común de todas las páginas: aviso superior, encabezado, contenido y pie.
import { Link, NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <div className="marquee">Yugen · piezas de anime y manga elegidas con criterio</div>
      <header className="site-header">
        <Link className="wordmark" to="/">YUGEN</Link>
        <nav aria-label="Principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/catalogo">Catálogo</NavLink>
          <Link to="/#contacto">Contacto</Link>
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>© Yugen · Nombre provisional</span>
      </footer>
    </>
  );
}
