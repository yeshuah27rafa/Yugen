// components/Layout.jsx
// Estructura común de todas las páginas: aviso superior, encabezado con carrito, contenido y pie.
import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCart } from "../hooks/useCart.js";

export default function Layout() {
  const location = useLocation();
  const cartLines = useCart();

  // Al cambiar de página, el foco va al contenido principal (teclado y lectores de pantalla).
  useEffect(() => {
    const main = document.getElementById("main");
    if (main !== null) main.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <div className="marquee">Yugen · piezas de anime y manga elegidas con criterio</div>
      <header className="site-header">
        <Link className="wordmark" to="/">YUGEN</Link>
        <nav aria-label="Principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/catalogo">Catálogo</NavLink>
          <NavLink to="/carrito">Carrito ({cartLines.length})</NavLink>
          <Link to="/#contacto">Contacto</Link>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>© Yugen · Nombre provisional</span>
        <Link to="/cuenta">Mi cuenta</Link>
        <Link to="/admin">Administración</Link>
      </footer>
    </>
  );
}
