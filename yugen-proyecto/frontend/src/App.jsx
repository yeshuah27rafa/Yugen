// App.jsx
// Mapa de rutas. Administración, cuentas, carrito y solicitudes se cargan bajo demanda.
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

const Admin = lazy(() => import("./pages/Admin.jsx"));
const Cuenta = lazy(() => import("./pages/cuenta/Cuenta.jsx"));
const CuentaRegistro = lazy(() => import("./pages/cuenta/CuentaRegistro.jsx"));
const CuentaEntrar = lazy(() => import("./pages/cuenta/CuentaEntrar.jsx"));
const CuentaVerificar = lazy(() => import("./pages/cuenta/CuentaVerificar.jsx"));
const CuentaRecuperar = lazy(() => import("./pages/cuenta/CuentaRecuperar.jsx"));
const CuentaRestablecer = lazy(() => import("./pages/cuenta/CuentaRestablecer.jsx"));
const Carrito = lazy(() => import("./pages/tienda/Carrito.jsx"));
const Solicitud = lazy(() => import("./pages/tienda/Solicitud.jsx"));

const LOADING = <section className="admin-page"><p className="status">Cargando…</p></section>;

// Envuelve una página diferida con su estado de carga.
function lazyPage(element) {
  return <Suspense fallback={LOADING}>{element}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="producto/:slug" element={<ProductDetail />} />
        <Route path="carrito" element={lazyPage(<Carrito />)} />
        <Route path="solicitud" element={lazyPage(<Solicitud />)} />
        <Route path="cuenta" element={lazyPage(<Cuenta />)} />
        <Route path="cuenta/registro" element={lazyPage(<CuentaRegistro />)} />
        <Route path="cuenta/entrar" element={lazyPage(<CuentaEntrar />)} />
        <Route path="cuenta/verificar" element={lazyPage(<CuentaVerificar />)} />
        <Route path="cuenta/recuperar" element={lazyPage(<CuentaRecuperar />)} />
        <Route path="cuenta/restablecer" element={lazyPage(<CuentaRestablecer />)} />
        <Route path="admin" element={lazyPage(<Admin />)} />
        <Route path="*" element={<ComingSoon title="Página no encontrada" stage="" />} />
      </Route>
    </Routes>
  );
}
