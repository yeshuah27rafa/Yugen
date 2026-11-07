// components/Layout.jsx
// Estructura común de todas las páginas: encabezado fijo con carrito, contenido y pie.
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { apiGet } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useCart } from "../hooks/useCart.js";
import { AdminContext } from "./AdminContext.jsx";
import Header from "./layout/Header.jsx";
import Footer from "./layout/Footer.jsx";

export default function Layout() {
  const location = useLocation();
  const cartLines = useCart();
  const works = useApi("/works");
  const [isAdmin, setIsAdmin] = useState(false);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  // Al cambiar de página, el foco va al contenido principal (teclado y lectores de pantalla).
  useEffect(() => {
    const main = document.getElementById("main");
    if (main !== null) main.focus({ preventScroll: true });
    if (location.hash === "") window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // La tienda es una sola: si hay sesión de administración, se muestran accesos de edición.
  useEffect(() => {
    let active = true;
    apiGet("/auth/me").then(() => { if (active) setIsAdmin(true); }).catch(() => { if (active) setIsAdmin(false); });
    return () => { active = false; };
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <Header works={works} cartCount={cartCount} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {isAdmin ? <Link className="admin-pill" to="/admin">Modo administración</Link> : null}
    </AdminContext.Provider>
  );
}
