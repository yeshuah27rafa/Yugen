# Yugen — Fase 12 · V1.2.4 consolidada

**Base aprobada:** V1.2.3. El usuario confirmó que V1.2.3 pasó las pruebas locales de frontend y backend y la estableció como nueva base de trabajo. Esta entrega consolidada conserva las mejoras aprobadas de Fase 12 y reúne las implementaciones acordadas para el panel del cliente, las solicitudes, la lista de deseos y la página «Por qué existe Yūgen».

**Identidad y dirección visual:** editorial alternativo, atmósfera psicológica, curaduría visual y experimentación. Evitar minimalismo vacío, frialdad corporativa, lujo frío y saturación. El tono combina información editorial y evocación sensorial; la curaduría invita a encontrar una conexión, no dicta una interpretación.

> Esta es la V1.2.4 consolidada. Reemplaza la entrega preliminar anterior de igual numeración, que el usuario decidió no revisar. No reinicia Fase 11 ni sustituye la base validada V1.2.3.

## 1. Corrección de Administración → Categorías

Se conserva la corrección estructural de la ilustración que se desprende y cubre los campos. `CategoryArtwork` reutiliza `.cat__art` con `position:absolute`; los wrappers del preview y de la celda de tabla ahora tienen contexto de posicionamiento propio, aislamiento, dimensiones y recorte (`position:relative`, `isolation:isolate`, `overflow:hidden`).

- `admin-category-editor-preview__art` contiene la ilustración dentro del marco de vista previa.
- `admin-category-cell__art` contiene la ilustración dentro de la miniatura de la tabla.
- La ilustración no debe superponerse al formulario ni cubrir otros controles.
- Se conservan los campos, la edición de imagen/ilustración, la semilla, el orden y la visibilidad de la categoría.
- El editor mantiene los estilos reforzados de contraste y enfoque incorporados en versiones anteriores.

## 2. Panel del cliente · Cuenta personal

La página `/cuenta` deja de ser solamente un conjunto de formularios. Ahora funciona como un archivo personal con:

- Cabecera de bienvenida «Tu archivo personal».
- Navegación directa a solicitudes, lista de deseos y datos personales.
- Resumen de actividad: solicitudes registradas, solicitudes en revisión y piezas guardadas.
- Solicitudes recientes, con miniatura histórica, código, fecha, estado y acceso al detalle.
- Estados vacíos y accesos para comenzar a explorar.
- Se conservan los formularios existentes de perfil, cambio de correo con confirmación, contraseña, exportación y eliminación de cuenta.

La dirección visual prioriza el patrón de panel de actividad acordado (referencia 02), con una pequeña aportación ilustrativa de la referencia 01. Se evita convertir el área en un panel genérico o excesivamente decorado.

## 3. Lista de deseos · Nueva funcionalidad

Se incorpora una lista de deseos accesible tanto a visitantes como a clientes con sesión.

### Interfaz
- Botón de corazón flotante en la esquina superior derecha de la imagen de las tarjetas de producto.
- Botón flotante equivalente sobre la galería principal de la página de detalle.
- Acción secundaria «Guardar en mi lista de deseos» debajo de «Agregar al carrito».
- Botón «Deseos» en el header con contador actualizado.
- Drawer de deseos con miniaturas, datos de pieza, acción para quitar y enlace a la lista completa.
- Nueva página `/favoritos` con la selección completa, tarjetas reutilizables y estado vacío.

Todos los accesos operan sobre una única lista; no hay una lista distinta por botón.

### Persistencia y sincronización
- Visitantes: lista local en `localStorage` (`yugen_lista_deseos`).
- Clientes registrados: los identificadores se guardan en `Customer.wishlist` en MongoDB.
- Al iniciar sesión, la lista local se fusiona con la lista de la cuenta sin duplicar identificadores; luego se limpia el almacenamiento local cuando la sincronización termina correctamente.
- Si expira la sesión al guardar un favorito, la acción se conserva localmente para fusionarla al volver a entrar.
- La lectura requiere sesión de cliente. La modificación requiere sesión y token CSRF.
- Los productos eliminados o referencias que ya no se puedan poblar no se muestran como piezas activas.

Backend: `GET /api/cuenta/favoritos` y `PUT /api/cuenta/favoritos`. La exportación de datos de cuenta incluye la lista de deseos.

## 4. Solicitudes · Imagen histórica de cada pieza

Al crear una solicitud, cada línea guarda una instantánea adicional `imageSnapshot` con la URL y el texto alternativo de la imagen principal vigente, además de los datos que ya se conservaban: nombre, precio y cantidad.

- La lista de solicitudes del cliente devuelve la imagen guardada.
- El detalle de una solicitud devuelve la imagen guardada.
- El resumen posterior al envío muestra las miniaturas históricas.
- El panel de cuenta usa la imagen histórica para identificar cada solicitud.
- Las solicitudes antiguas que no tengan `imageSnapshot` siguen siendo válidas y muestran el recurso gráfico de respaldo.

**Alcance de la instantánea:** se conserva la referencia de imagen (URL y texto alternativo) vigente al enviar la solicitud; no se duplica físicamente el archivo binario. Por tanto, cambiar la URL de imagen del producto no altera la referencia de la solicitud histórica. Si alguien sobrescribe físicamente el mismo archivo en la misma URL, la URL por sí sola no puede conservar la versión binaria anterior; evitar esa sustitución de archivos es la manera de mantenerla inmutable.

Prueba añadida en `backend/test/fase8-solicitudes.test.js`: tras crear la solicitud se cambia temporalmente la imagen del producto del catálogo y se comprueba que la imagen histórica de la lista y del detalle sigue siendo la inicial; al final se restaura la imagen del fixture.

## 5. Confirmación editorial de solicitud

Después de enviar, `/solicitud` muestra una pantalla de confirmación de recepción con:

- Código de solicitud destacado.
- Mensaje de recepción correcta.
- Resumen visual de piezas, cantidades, precio y total de las piezas con precio.
- Forma de entrega indicada.
- Explicación de los próximos pasos y acceso a seguimiento.

El texto aclara que la recepción no representa un pago ni una confirmación de entrega. Si el detalle no está disponible en ese instante, el código sigue visible y el cliente puede consultar el resumen desde su cuenta.

## 6. Seguimiento del cliente

El detalle `/cuenta/solicitudes/:code` presenta el código, fecha, estado actual, piezas solicitadas con imagen histórica, forma de entrega, comentario del cliente y cronología de eventos.

### Estados simplificados para el cliente

| Estado interno | Texto visible | Tratamiento |
|---|---|---|
| `nueva` | En proceso | Amarillo |
| `aprobada`, `en_proceso`, `completada` | Aprobada | Verde |
| `cancelada` | Cancelada | Rojo |
| `rechazada` | No aprobada | Rojo |

Se conserva la distinción interna entre cancelación y rechazo; no se mezclan en los datos administrativos.

- «Contactado» es un acontecimiento de cronología, no un cuarto estado principal. Si existe `contactedAt`, se muestra como «Yugen se puso en contacto contigo».
- La cronología muestra fechas y horas de los cambios que el cliente puede conocer; no expone notas internas ni información privada del administrador.
- La vista consulta el detalle cada 30 segundos mientras la solicitud siga en una fase activa (`nueva`, `aprobada` o `en_proceso`), para reflejar cambios hechos desde administración sin obligar al cliente a recargar.
- La cancelación desde la cuenta sigue disponible únicamente cuando la solicitud está en `nueva`.
- No se muestran estados de pago, envío logístico, tracking de transportista ni fechas estimadas que el sistema todavía no gestiona.

El backend ya guardaba el estado compartido, el historial de transiciones y `contactedAt`; la implementación expone el evento de contacto en la cronología del cliente y consulta periódicamente los cambios.

## 7. Página «Por qué existe Yūgen» · Rediseño editorial

Se sustituye el bloque explicativo anterior que comenzaba con «Yūgen es un punto de partida para mirar más allá de lo evidente» por una nueva sección **«Por qué Yūgen»**. Incluye capas tipográficas y gráficas, el kanji 幽玄, órbitas sutiles, un tratamiento asimétrico y tres facetas visuales que acompañan la explicación del concepto.

Copy central:

> Yūgen (幽玄) es un concepto estético japonés que suele evocar una belleza profunda, sutil y misteriosa: algo que se percibe más allá de lo evidente, pero que nunca se revela por completo.

El texto aclara que la tienda no busca convertir el concepto en una definición rígida; se inspira en lo sugerido por las obras, lo que permanece después de mirarlas y las conexiones que despiertan. La sección combina los recursos A, B y C acordados: identidad visual propia para los principios, composición editorial asimétrica y narrativa progresiva por capas.

### Secciones que deben permanecer protegidas

- **«Nuestra mirada»:** se conserva el contenido y solo se mantiene la reducción leve del tamaño del titular principal en monitor (máximo 88 px, previamente acordado).
- **«Una tienda construida desde la conexión»:** se mantiene su texto, composición y comportamiento estático.
- **«Un mismo espacio, distintos registros»:** se mantiene su texto y su sección; no se sustituye ni se reescribe.

Las demás partes del manifiesto sí pueden seguir refinándose con composición asimétrica y transiciones suaves, sin saturar la página. Se mantienen las transiciones de entrada y salida al avanzar, detenerse o regresar con scroll y se respeta `prefers-reduced-motion`.

## 8. Elementos que se conservan de V1.2.2 y V1.2.3

La entrega sigue incluyendo las funcionalidades ya aceptadas en Fase 12:

- Home: encabezado «Maneras de llevarse una obra.» y carrusel horizontal de categorías con scroll-snap, touch, trackpad, rueda y teclado.
- Colecciones: clic en «Colecciones» abre `/colecciones`; el menú rápido permanece accesible por hover/foco, sin el glifo de flecha. Índice completo, portadas, sinopsis y navegación individual.
- Orden editorial independiente para Hero (`featuredOrder`) y Recomendaciones (`recommendedOrder`).
- Página de obras y secciones de Home existentes, con contenido administrable.
- `/manifiesto`: mantiene el bloque breve de Home y los elementos editoriales aprobados.
- Administración → Registro de ediciones, con filtros, fichas expandibles y controles de privacidad.
- Selector de categoría con estados de carga/selección/vacío y selección automática de una categoría activa válida.
- Corrección del test de detalle de producto que antes trataba como vacío un producto de muestra que ya tenía una ficha contextual válida.
- Corrección de `useReveal` para detectar contenido dinámico y permitir entrada/salida repetible.

## 9. Archivos principales incorporados o modificados

Frontend (entre otros):
- `src/components/WishlistContext.jsx`
- `src/components/WishlistDrawer.jsx`
- `src/components/WishlistToggle.jsx`
- `src/utils/wishlistStorage.js`
- `src/pages/Favoritos.jsx`
- `src/components/Layout.jsx`
- `src/components/layout/Header.jsx`
- `src/components/ProductCard.jsx`
- `src/pages/ProductDetail.jsx`
- `src/pages/cuenta/Cuenta.jsx`
- `src/pages/cuenta/CuentaSolicitudes.jsx`
- `src/pages/cuenta/CuentaSolicitud.jsx`
- `src/pages/tienda/Solicitud.jsx`
- `src/pages/Manifiesto.jsx`
- `src/App.jsx`
- `src/styles/global.css`

Backend:
- `src/models/Customer.js` — referencias de lista de deseos.
- `src/models/Request.js` — instantánea de imagen por pieza.
- `src/services/requestService.js` — guarda y entrega las imágenes históricas y evento de contacto.
- `src/routes/customerAuth.js` — API de favoritos, exportación y rutas protegidas.
- `test/fase7-cuentas.test.js` — persistencia, lectura y controles de sesión/CSRF para favoritos.
- `test/fase8-solicitudes.test.js` — comprobación de instantánea histórica de imagen.

## 10. Validación disponible

Validación estática realizada en el árbol consolidado:

- 74 archivos JS/JSX del frontend analizados mediante transpile TypeScript: **0 errores sintácticos**.
- Imports relativos del frontend: **0 rutas faltantes**.
- 59 archivos JS de backend y tests: `node --check` **sin errores**.
- `global.css`: parseo PostCSS **correcto**.
- Se intentó `npm run build`, pero no pudo arrancar porque la instalación parcial no dejó disponible el ejecutable `vite` (`vite: not found`).
- Se intentó `npm test`; las pruebas que requieren dependencias no pudieron cargar `bcryptjs` o `mongoose` (`MODULE_NOT_FOUND`). Algunos tests sin dependencias sí ejecutaron, pero no se considera aprobada la suite completa.
- No se realizó prueba visual de navegador en este entorno.

Por tanto, **no se afirma que V1.2.4 haya pasado build ni tests completos**. En la máquina local del usuario se deben instalar las dependencias y ejecutar:

```bash
cd frontend
npm ci
npm run build
```

```bash
cd backend
npm ci
npm test
```

## 11. Revisión visual recomendada

1. Admin → Categorías: crear y editar una categoría, usar ilustración generada y URL propia; confirmar que la ilustración permanece dentro del marco y no tapa campos.
2. Tarjetas de producto: guardar/quitar con el corazón de esquina; verificar contador y drawer.
3. Detalle de producto: probar el corazón sobre la imagen y «Guardar en mi lista de deseos» debajo de «Agregar al carrito».
4. Wishlist como visitante: guardar varias piezas, recargar, abrir drawer, visitar `/favoritos` y quitar piezas.
5. Wishlist con sesión: iniciar sesión, verificar fusión de deseos locales, cerrar sesión y comprobar que el siguiente inicio recupera la lista de la cuenta.
6. Cuenta: revisar bienvenida, actividad, solicitudes recientes, favoritos, perfil y seguridad en escritorio y móvil.
7. Solicitud: enviar una solicitud y revisar confirmación editorial, código, miniaturas históricas y forma de entrega.
8. Seguimiento: cambiar desde Admin los estados y marcar contacto; verificar que el cliente ve el estado correspondiente y el evento «Yugen se puso en contacto contigo» después de la consulta automática (máximo aproximado 30 segundos).
9. Imagen histórica: modificar la URL de imagen de una pieza tras crear una solicitud y confirmar que la solicitud sigue mostrando la referencia que guardó al enviarse.
10. Manifiesto: comprobar «Por qué Yūgen» y su composición en escritorio y móvil; confirmar que las tres secciones protegidas siguen intactas y las transiciones funcionan al bajar y subir.

## 12. Continuidad

La base de trabajo funcional validada por el usuario es V1.2.3; esta entrega es la consolidación V1.2.4 que integra corrección de categorías y las mejoras aprobadas. No avanzar a despliegue ni cambiar la arquitectura. La siguiente tarea tras las pruebas locales es revisar los resultados de build/test y luego corregir cualquier incidencia visual o funcional concreta detectada en la revisión del navegador.

### Frase para continuar en otro chat

> Continuemos Yugen desde la V1.2.4 consolidada, derivada de V1.2.3 (que ya había pasado las pruebas locales). Revisa primero los resultados de `npm run build` y `npm test`. La V1.2.4 incorpora la corrección de ilustraciones en Categorías, panel de cliente, wishlist local y persistente, imagen histórica por solicitud, confirmación editorial, seguimiento de estados y nueva sección «Por qué Yūgen». Mantén protegidas «Nuestra mirada» (solo reducción leve del titular en monitor), «Una tienda construida desde la conexión» y «Un mismo espacio, distintos registros». No desplegar ni reiniciar fases previas.
