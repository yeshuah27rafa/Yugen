# Yugen — Fase 12 · V1.2.8 · Corrección de precios históricos y trazabilidad de cambios

**Fecha:** 16 de noviembre de 2026  
**Estado:** candidata de validación local; no desplegar todavía.  
**Base directa:** V1.2.7, cuya compilación y pruebas de frontend/backend fueron confirmadas por el usuario.  
**Objetivo:** corregir el total de la vista previa de solicitudes, compartir esa vista previa con la actividad reciente de Cuenta y registrar únicamente los campos administrativos que realmente cambiaron.

## 1. Resumen de la entrega

V1.2.8 es una iteración incremental y localizada. Conserva las correcciones de navegación, Cuenta, drawer, contraseña, WhatsApp, manifiesto y contacto aprobadas en V1.2.7. La entrega base V1.2.8 contiene cambios de backend limitados al DTO que alimenta el historial de solicitudes y a la comparación real de campos en el registro administrativo. El complemento de seguimiento descrito en 2.5 es exclusivamente frontend.

No se cambiaron contratos de creación de solicitudes, precios de catálogo, stock, disponibilidad, autenticación, cookies, CSRF, rate limits, modelos de negocio ni rutas públicas.

## 2. Cambios implementados

### 2.1 Precio histórico correcto en la vista previa

**Causa identificada:** `listMyRequests()` devolvía código, estado, fecha, forma de entrega, nombre, cantidad e imagen de cada pieza, pero omitía `priceSnapshot`. La vista previa recibía `price` como `undefined` y por eso mostraba `B/. 0.00` como total, mientras el endpoint de detalle sí devolvía el snapshot correcto.

**Corrección:**
- La proyección de la consulta ahora incluye `items.priceSnapshot`.
- La respuesta del historial mapea `priceSnapshot` como `price` por línea.
- Los importes se siguen leyendo del snapshot guardado al crear la solicitud; no se consulta ni recalcula el precio actual del catálogo.
- Las piezas con precio `null` continúan mostrándose como «A consultar» y no se suman al total.
- Se amplió la prueba existente de solicitudes para comprobar que el historial devuelve el mismo precio histórico que `Request.items.priceSnapshot`.

Esta corrección beneficia tanto al drawer de «Mis solicitudes» como a cualquier resumen que consuma el historial, incluida la actividad reciente de Cuenta.

### 2.2 Vista previa también en «Actividad reciente» de Cuenta

- El drawer se extrajo a `components/cuenta/RequestPreviewDrawer.jsx` para compartir una sola implementación entre Cuenta y el historial.
- La sección «Actividad reciente · Tus últimas solicitudes» mantiene el acceso al seguimiento completo y añade una acción independiente de «Vista previa».
- El drawer presenta código, estado, fecha, piezas, miniaturas, cantidades, precios históricos, forma de entrega y total de las piezas con precio.
- Desde el drawer se puede abrir el seguimiento completo o regresar al área desde la que se abrió.
- La vista previa usa la misma respuesta y la misma lógica de totales que el historial, evitando que ambos espacios diverjan visualmente o en comportamiento.

### 2.3 Registro administrativo: diferencias reales por campo

**Problema anterior:** las rutas de edición registraban todas las claves enviadas por el formulario. Como el formulario envía el objeto completo, editar únicamente el nombre podía aparentar que se habían modificado también precio, imágenes, disponibilidad, características y el resto de los campos.

**Corrección:**
- Se añadió `backend/src/utils/auditChanges.js` para normalizar y comparar el estado anterior con el nuevo.
- La comparación cubre piezas, categorías y obras.
- Se registran únicamente las propiedades cuyo valor persistido cambió realmente.
- Cada cambio guarda el campo y un resumen de valor anterior y valor nuevo.
- Para galerías y características se conserva un resumen descriptivo (cantidad e información principal) en lugar de almacenar un volcado extenso de objetos.
- Las URLs de imagen/portada se presentan mediante una etiqueta del recurso y no como enlaces largos en el historial.
- Si el usuario guarda el formulario sin modificar ningún dato, no se genera un movimiento de edición ficticio.
- Las etiquetas de la interfaz se amplían para distinguir obra asociada, orden de portada, orden editorial, galería, carácter visual y otros campos.
- Los importes se muestran con el prefijo `B/.`.
- La búsqueda del registro puede encontrar los cambios por nombre del campo o por los valores anterior/nuevo.

**Compatibilidad:** las entradas antiguas del registro permanecen válidas. No se reescriben ni se intenta reconstruir cambios que no fueron almacenados en su momento. Las entradas nuevas de edición mostrarán el detalle anterior → nuevo.


### 2.5 Seguimiento completo y estado actual en la parte superior

A petición del usuario, el resumen visual del seguimiento y el historial detallado ahora aparecen juntos, inmediatamente después del encabezado de la solicitud y antes del resumen de piezas. Se conserva la información histórica y no se modifica el modelo ni las transiciones de estado del backend.

- La ruta superior deja de limitarse a «Recibida» y «Revisión» y representa el recorrido completo: **Recibida → Revisión → Aprobada → En coordinación → Completada**.
- El marcador activo cambia según el estado real (`nueva`, `aprobada`, `en_proceso` o `completada`). Los pasos posteriores se muestran como pendientes, sin sugerir que una solicitud recibida ya está aprobada o pagada.
- Si la solicitud termina como `rechazada`, el recorrido se muestra hasta **No aprobada**. Si termina como `cancelada`, se muestran los pasos recorridos hasta **Cancelada**. Para identificar dónde se detuvo, la presentación lee el último estado previo de `history`; no inventa transiciones.
- Los cierres tienen mensajes neutrales y comprensibles. Para una cancelación se indica que el proceso terminó y que **no se completó la coordinación**, sin hablar de una transacción o pago que el sistema no realiza.
- El historial detallado se reubicó justo debajo de la ruta superior. El evento que corresponde al estado actual lleva la etiqueta **«Estás aquí»** y un tratamiento visual discreto. Los eventos de contacto no sustituyen el estado real de la solicitud.
- El detalle de seguimiento y su orden se adaptan a pantallas pequeñas; la ruta horizontal permite desplazamiento lateral en móvil para evitar comprimir las etapas.

**Archivo nuevo:** `frontend/src/utils/requestJourney.js` centraliza la presentación del recorrido y permite comprobar los estados activos y terminales sin acoplar la lógica visual al componente.

### 2.4 Pruebas ampliadas

- `backend/test/fase8-solicitudes.test.js`: añade la comprobación de que el endpoint de historial incluye el precio snapshot de cada pieza.
- `backend/test/admin.test.js`: comprueba que modificar únicamente el nombre registre solo `name`, con su valor anterior y nuevo, y que guardar el mismo payload otra vez no cree un movimiento adicional.

## 3. Archivos modificados

**Backend:**
- `src/services/requestService.js` — incorpora `priceSnapshot` a la respuesta del historial.
- `src/routes/admin.js` — calcula diferencias reales al editar piezas, categorías y obras.
- `src/utils/auditChanges.js` — nuevo comparador y formateador de valores para auditoría.
- `test/fase8-solicitudes.test.js` — prueba del precio histórico en el historial.
- `test/admin.test.js` — prueba de campos cambiados y guardado sin cambios.

**Frontend:**
- `src/utils/requestJourney.js` — construye el recorrido completo y resuelve el evento de estado actual.
- `src/pages/cuenta/CuentaSolicitud.jsx` — muestra ambas capas de seguimiento al inicio y destaca «Estás aquí».
- `src/components/cuenta/RequestPreviewDrawer.jsx` — nuevo drawer reutilizable.
- `src/pages/cuenta/CuentaSolicitudes.jsx` — reutiliza el componente compartido.
- `src/pages/cuenta/CuentaSolicitud.jsx` — seguimiento superior completo y detalle de actividad con marca «Estás aquí».
- `src/pages/cuenta/Cuenta.jsx` — acción de vista previa en actividad reciente.
- `src/components/admin/AdminAuditLog.jsx` — presentación anterior → nuevo y búsqueda por campos cambiados.
- `src/styles/global.css` — composición de actividad reciente y tarjetas de diferencias.

No se modificaron `package.json`, `package-lock.json`, dependencias ni configuración de Vite.

## 4. Validación técnica realizada en esta sesión

**Comprobaciones estáticas realizadas:**
- 77 archivos JS/JSX del frontend transpilados como comprobación sintáctica mediante TypeScript: cero errores.
- Imports relativos del frontend: cero rutas faltantes.
- `frontend/src/styles/global.css`: parseo PostCSS correcto.
- 60 archivos JavaScript de `backend/src` y `backend/test`: pasan `node --check`.
- El helper `auditChanges` pasó tres comprobaciones aisladas: detectar solo el nombre modificado, no detectar diferencias cuando los valores son iguales y detectar un cambio en galería.
- El helper `requestJourney` pasó ocho comprobaciones aisladas que cubren revisión, aprobación, coordinación, completada, rechazada, cancelada, mensaje de cierre y ubicación del estado actual en el historial.
- La comparación entre V1.2.7 y V1.2.8 confirma que los cambios se limitan a los archivos enumerados.
- `package.json` y ambos lockfiles no se modificaron.

**No se ejecutó** `npm install`, `npm ci`, `npm run build`, `npm test`, MongoDB Memory Server, ni pruebas reales del navegador. La comprobación de sintaxis no equivale a compilar Vite ni a ejecutar las pruebas de integración.

## 5. Validación que corresponde realizar localmente

Como los manifiestos y lockfiles no cambiaron, no se necesita reinstalar dependencias si las instalaciones de V1.2.7 siguen disponibles.

Desde `frontend`:

```bash
npm run build
```

Desde `backend`:

```bash
npm test
```

En esta versión sí hay cambios de backend; por eso conviene ejecutar la suite backend completa, además del build frontend. No se requiere `npm install` por cambios de dependencias.

### Checklist funcional específico

1. Abrir «Mis solicitudes» y comprobar que el precio por pieza coincide con el precio del seguimiento completo.
2. Comprobar el total con solicitudes que tienen todos los precios definidos y con solicitudes que incluyen piezas «A consultar».
3. Entrar a Cuenta → «Actividad reciente» y abrir la vista previa desde cada una de las últimas solicitudes.
4. Comprobar que el drawer de actividad reciente muestra los mismos importes, piezas, cantidades y forma de entrega que el drawer del historial.
5. Desde ambas ubicaciones, abrir el seguimiento completo y volver/cerrar el drawer.
6. En Administración → Piezas, editar solo el nombre y comprobar que el registro muestre únicamente «Nombre», con el valor anterior y el nuevo.
7. Guardar una pieza sin modificar sus datos y comprobar que no se añade una entrada de edición.
8. Repetir una edición pequeña de categoría y obra para confirmar que solo aparecen los campos modificados.
9. Cambiar, si se necesita probarlo, una imagen, característica, precio, stock, disponibilidad y flags editoriales por separado; comprobar que la auditoría muestra el campo correcto.
10. Confirmar que las entradas históricas anteriores siguen abriendo correctamente y que los filtros de fecha, área, acción y búsqueda se mantienen.
11. Abrir solicitudes en estado nueva, aprobada, en coordinación y completada; verificar que la ruta superior señala la etapa correspondiente y que «Estás aquí» coincide con el evento de estado.
12. Revisar una solicitud rechazada y otra cancelada desde distintos puntos del flujo; verificar que la ruta termina en «No aprobada» o «Cancelada» y que el mensaje explica el cierre sin hablar de pagos o transacciones.
13. En móvil, comprobar que todas las etapas de la ruta pueden consultarse mediante desplazamiento horizontal y que el historial detallado permanece legible.

## 6. Áreas protegidas

- Se conserva íntegro el rediseño de Cuenta aprobado en V1.2.6 y los ajustes de acceso/solicitudes/contacto de V1.2.7.
- No se modifica el cálculo de precios al crear solicitudes ni se cambia el snapshot almacenado.
- El nuevo precio del endpoint de historial es el precio histórico de la solicitud, no el precio actual del producto.
- No se altera la información privada del cliente, notas internas, cookies, autenticación ni reglas de autorización.
- No se cambian los contratos de los endpoints de detalle de solicitud.
- No se modifican carrito, wishlist, catálogo, detalle de producto, Hero, manifiesto, WhatsApp ni navegación fuera de esta corrección.
- Sin cambios de dependencias ni lockfiles. No se realizó deploy.

## 7. Recomendaciones finales para cerrar Fase 12

Estas propuestas no están implementadas en V1.2.8. Son los últimos puntos que revisaría antes de considerar cerrada la Fase 12 y preparar staging/deploy:

### Bloqueadores o verificaciones previas al lanzamiento

1. **Privacidad y contenido legal:** garantizar que el aviso de privacidad exista, sea accesible desde registro y explique finalidad, retención, anonimización/eliminación y contacto. Revisar textos de coordinación y condiciones de entrega para que no prometan un proceso de pago o compra automatizado que Yugen no ofrece.
2. **Activos editoriales y derechos:** validar las fotografías finales, derechos de uso, recortes, peso de archivos y textos alternativos. Sustituir cualquier imagen de muestra antes de hacer pública la tienda.
3. **Configuración de producción:** revisar secretos, cookies seguras, CSRF, proxy/CORS, conexión de Atlas, correo, `CONTACT_EMAIL` y `CONTACT_WHATSAPP`, además de copias de seguridad y procedimiento de restauración.
4. **Smoke test de staging:** probar registro, login, cerrar sesión, catálogo, filtros, pieza, carrito, solicitud, historial, preview, cancelación permitida, contacto/WhatsApp y administración con datos de prueba. Probar en escritorio, móvil y ventana dividida.

### Mejoras que reforzarían la identidad de Yugen después del cierre

5. **Archivo curatorial con relaciones:** explorar recorridos entre obras por sensibilidad, atmósfera, experimentación y afinidad estética. Mantener la curaduría humana como fuente; no convertirlo en recomendaciones automáticas genéricas.
6. **Ficha editorial consistente:** crear una pequeña guía interna para el campo de contexto —conexión con la obra, estética o emoción que motiva la selección— sin forzar texto en piezas donde no aporte nada.
7. **Previsualización administrativa de publicación:** permitir revisar la ficha tal como la verá un visitante antes de guardar/publicar, sobre todo para comprobar fotografías, galería, texto y orden visual.
8. **Seguimiento del cliente:** tras observar solicitudes reales, evaluar qué estados o mensajes necesitan explicación adicional. Evitar incorporar plazos automáticos, promesas de entrega o pagos online mientras no exista una operación que los respalde.
9. **Rendimiento de imágenes:** optimizar formatos y tamaños responsivos, lazy loading y dimensiones reservadas para evitar saltos de layout en el catálogo y las galerías.

Mi recomendación es no ampliar más el alcance funcional de Fase 12 antes de validar V1.2.8. Primero cerraría la corrección de snapshots y auditoría, completaría legal/configuración y smoke tests, y solo entonces abriría una candidata de staging. La parte que más puede distinguir a Yugen a mediano plazo sigue siendo la coherencia entre selección, fotografía y relato editorial, no añadir más widgets o complejidad visual.

## 8. Estado y continuidad

| Versión | Estado |
|---|---|
| V1.2.4 | Base estable aprobada |
| V1.2.5 | Candidata anterior |
| V1.2.6 | Validada por el usuario |
| V1.2.7 | Validada por el usuario |
| **V1.2.8** | Candidata actualizada; pendiente de `npm run build`, `npm test` y revisión visual local |

No desplegar todavía. La validación local debe confirmar el build frontend, la suite backend y el comportamiento visual del drawer reutilizado y el registro detallado.

### Frase de continuidad

> Continuemos Yugen desde V1.2.8, derivada de V1.2.7 que ya validé. Esta versión corrige el precio histórico en el endpoint del historial, reutiliza la vista previa de solicitudes en «Actividad reciente» de Cuenta y registra en la auditoría únicamente los campos que realmente cambiaron, con valores anterior → nuevo; guardar sin cambios no genera una entrada. Se modificaron backend y frontend, pero no dependencias ni lockfiles. Primero revisemos mis resultados locales de `npm run build` y `npm test`, más las observaciones visuales. No desplegar hasta aprobar esta candidata.


## 9. Complemento de seguimiento incorporado a la misma entrega

Este apartado documenta el ajuste solicitado después de preparar la primera V1.2.8. Se conserva el número de versión y el resto del informe; no se crea una línea de desarrollo diferente ni se descartan los cambios previos.

**Alcance adicional:** únicamente se modificaron `frontend/src/pages/cuenta/CuentaSolicitud.jsx`, `frontend/src/styles/global.css` y se añadió `frontend/src/utils/requestJourney.js`. No se modificó backend, los contratos API, modelos, dependencias ni lockfiles en este complemento.

**Comprobación específica:** `requestJourney` pasó 8/8 aserciones locales con Node para los estados normal, completado, rechazado y cancelado, además de comprobar que un evento `contactado` posterior no desplaza la marca «Estás aquí» del estado actual. Se comprobó también el balance de llaves CSS. No se ejecutó `npm ci`, `npm run build` ni `npm test`; quedan para la validación del usuario.

La lista de archivos y el checklist de esta versión incluyen este complemento. La prueba recomendada sigue siendo ejecutar `npm run build` en frontend y `npm test` en backend, y revisar visualmente todas las etapas y los dos estados terminales antes de aprobar la candidata. El JSX de `CuentaSolicitud.jsx` pasó un análisis sintáctico aislado con TypeScript y el helper pasó `node --check`.
