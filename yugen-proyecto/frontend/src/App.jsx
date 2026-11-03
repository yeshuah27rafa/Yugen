// App.jsx
// Mapa de rutas: portada, catálogo, detalle de producto y página no encontrada.
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="producto/:slug" element={<ProductDetail />} />
        <Route path="*" element={<ComingSoon title="Página no encontrada" stage="" />} />
      </Route>
    </Routes>
  );
}
