// components/Layout.jsx
// Estructura común de todas las páginas: encabezado fijo con carrito, contenido y pie.
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { apiGet } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useCart } from "../hooks/useCart.js";
import { AdminContext } from "./AdminContext.jsx";
import { CatalogProvider } from "./CatalogContext.jsx";
import Header from "./layout/Header.jsx";
import Footer from "./layout/Footer.jsx";
import CartDrawer from "./cart/CartDrawer.jsx";
import { openCartDrawer } from "../utils/cartStorage.js";
import WishlistDrawer from "./WishlistDrawer.jsx";
import { WishlistProvider, openWishlistDrawer, useWishlist } from "./WishlistContext.jsx";

function LayoutContent() {
  const wishlist = useWishlist();
  const location = useLocation();
  const cartLines = useCart();
  const works = useApi("/works");
  const categories = useApi("/catalog/categories");
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

  useEffect(() => {
    function refreshCatalog() {
      categories.reload();
      works.reload();
    }
    window.addEventListener("yugen:catalog-updated", refreshCatalog);
    return () => window.removeEventListener("yugen:catalog-updated", refreshCatalog);
  }, [categories.reload, works.reload]);

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      <CatalogProvider categories={categories.status === "ready" ? categories.data : []}>
        <a className="skip-link" href="#main">Saltar al contenido</a>
        <Header works={works} categories={categories} cartCount={cartCount} onOpenCart={openCartDrawer} wishlistCount={wishlist.count} onOpenWishlist={openWishlistDrawer} />
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer categories={categories} />
        <CartDrawer />
        <WishlistDrawer />
        {isAdmin ? <Link className="admin-pill" to="/admin">Modo administración</Link> : null}
      </CatalogProvider>
    </AdminContext.Provider>
  );
}

export default function Layout() {
  return <WishlistProvider><LayoutContent /></WishlistProvider>;
}
