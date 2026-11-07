# Yugen — Fase 12 V1.1

Esta versión parte del ZIP `Yugen-RespaldoClaude-Fase12.zip` entregado por Claude. Es una iteración de refinamiento UX/funcional sobre la primera implementación visual de Fase 12; no reemplaza la arquitectura ni pretende cerrar todo el rediseño.

## Cambios incluidos

### Navegación y continuidad
- Se añadió el componente reutilizable `BackLink` con destino alternativo seguro.
- Las tarjetas de producto guardan la ruta de origen en el estado de navegación; el enlace de regreso del detalle puede volver a la página y conservar sus filtros/búsqueda.
- Se añadieron enlaces de retorno visibles en detalle, carrito, solicitud, páginas principales de cuenta, solicitudes y administración.
- El inicio de sesión de cliente conserva el destino pendiente (`/carrito` o `/solicitud`) y vuelve a él tras autenticar.

### Carrito
- El contador del encabezado ahora suma las unidades, no solo las líneas/productos distintos.
- El carrito muestra miniaturas, obra, enlace a la ficha y subtotal de cada línea cuando existe precio.
- Se incorporaron estados explícitos de carga y error, con acción para reintentar la consulta del resumen.
- El botón de agregar al carrito ofrece un acceso real a `/carrito` después de agregar una pieza.
- Se mantiene `/carrito` como experiencia principal; no se añadió un drawer que simule o duplique el estado del carrito.

### Administración
- El estado compartido de sesión admin ahora se actualiza inmediatamente después de comprobar sesión, iniciar sesión o cerrar sesión.
- Al borrar una solicitud, la selección del detalle se limpia; también se limpia si los filtros dejan fuera la solicitud seleccionada.
- Las acciones de detalle de solicitudes muestran estados ocupados y evitan envíos duplicados.
- Los errores de eliminación de clientes ahora se muestran en pantalla.
- La ejecución manual de retención solicita confirmación, muestra progreso y presenta errores de forma explícita.
- Los errores al eliminar productos se distinguen de los avisos de éxito.
- Se añadió acceso visible para volver a la tienda desde administración.

### Refinamientos adicionales
- La galería restablece la miniatura seleccionada cuando cambia el producto.
- `useReveal` deja de reconstruir el `IntersectionObserver` en cada render.
- `useScrollBands` deja de mantener un `requestAnimationFrame` activo mientras la página está en reposo.
- Se ajustó el texto de selección destacada para no prometer que todas las fichas contienen un texto contextual.
- Se retiró la leyenda pública temporal «Nombre provisional» del footer.

## Archivos principales modificados

- `frontend/src/components/AdminContext.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/components/layout/BackLink.jsx` (nuevo)
- `frontend/src/components/layout/Header.jsx` (recibe el nuevo contador a través de Layout)
- `frontend/src/components/ProductCard.jsx`
- `frontend/src/components/cart/AddToCartButton.jsx`
- `frontend/src/components/product/ProductGallery.jsx`
- `frontend/src/components/admin/AdminCustomers.jsx`
- `frontend/src/components/admin/AdminDashboard.jsx`
- `frontend/src/components/admin/AdminPanel.jsx`
- `frontend/src/components/admin/AdminRequests.jsx`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/pages/ProductDetail.jsx`
- `frontend/src/pages/tienda/Carrito.jsx`
- `frontend/src/pages/tienda/Solicitud.jsx`
- `frontend/src/pages/cuenta/Cuenta.jsx`
- `frontend/src/pages/cuenta/CuentaEntrar.jsx`
- `frontend/src/pages/cuenta/CuentaSolicitudes.jsx`
- `frontend/src/pages/cuenta/CuentaSolicitud.jsx`
- `frontend/src/hooks/useReveal.js`
- `frontend/src/hooks/useScrollBands.js`
- `frontend/src/styles/global.css`
- `frontend/src/components/home/FeaturedSection.jsx`
- `frontend/src/components/layout/Footer.jsx`

## Validación de esta entrega

- Análisis sintáctico de todos los archivos `.js` y `.jsx` del frontend: correcto (sin errores de sintaxis).
- `node --check` sobre los archivos JavaScript de `backend/src` y `backend/test`: correcto.
- No se pudo ejecutar `npm run build` ni la suite de pruebas en este entorno porque el ZIP no contenía dependencias y los intentos de `npm ci` agotaron el tiempo disponible/conexión. Por tanto, **no se afirma que el build ni los tests hayan pasado en esta versión V1.1**.
- No se modificó el backend ni se cambiaron dependencias o archivos de lock.

## Verificación local recomendada

Desde `frontend`:

```bash
npm ci
npm run build
```

Desde `backend`:

```bash
npm ci
npm test
```

Después conviene probar manualmente: añadir varias unidades de una misma pieza, navegar desde catálogo con filtros a un detalle y regresar, iniciar sesión desde el carrito, abrir `/solicitud` sin sesión, iniciar/cerrar sesión admin y borrar una solicitud en el panel.

## Pendiente para siguientes iteraciones

- Rediseño más profundo de panel administrativo (tablas, filtros, formularios, distribución responsive y jerarquía de tareas).
- Refinamiento UX de cuenta y solicitudes más allá de los enlaces de retorno y la corrección de continuidad.
- Decidir, tras probar el flujo real, si se añade un mini-cart lateral o toast ampliado. La página `/carrito` sigue siendo la fuente principal.
- Revisar visualmente el carrito y el panel admin en escritorio y móvil con productos y datos reales.
- Validar login, solicitud y administración contra backend/MongoDB reales.
- Incorporar y validar imágenes definitivas, política de privacidad y otros contenidos legales antes de publicación.
