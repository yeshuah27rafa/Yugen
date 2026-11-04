// App.jsx
// Mapa de rutas. El panel de administración se carga bajo demanda para no pesar en la portada pública.
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

const Admin = lazy(() => import("./pages/Admin.jsx"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="producto/:slug" element={<ProductDetail />} />
        <Route
          path="admin"
          element={
            <Suspense fallback={<section className="admin-page"><p className="status">Cargando…</p></section>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<ComingSoon title="Página no encontrada" stage="" />} />
      </Route>
    </Routes>
  );
}
