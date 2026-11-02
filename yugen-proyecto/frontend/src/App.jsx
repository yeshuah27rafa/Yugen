// App.jsx
// Mapa de rutas. Las rutas de catálogo y detalle son marcadores hasta sus etapas (2 y 3).
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<ComingSoon title="Catálogo" stage="Etapa 2" />} />
        <Route path="producto/:slug" element={<ComingSoon title="Detalle de producto" stage="Etapa 3" />} />
        <Route path="*" element={<ComingSoon title="Página no encontrada" stage="" />} />
      </Route>
    </Routes>
  );
}
