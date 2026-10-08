# Riego · Campo

Aplicación Android y PWA para capturar y consultar **Humedades, Compactación, Presiones y Calidad de agua**, con gráficas y mapa de los tres apartados por lote. Todos los dispositivos de campo tienen las mismas funciones. El dispositivo principal configura las unidades y entrega accesos; no hay roles de evaluador, supervisor ni administrador.

## Descargar e instalar

Abre **Releases** de este repositorio y descarga el archivo `Riego-0.1.13.apk`. Android puede pedir que permitas la instalación desde el navegador o el gestor de archivos. El identificador de la app es `pe.riego.campo`, independiente de Fenología y Fitosanidad.

El workflow **APK descargable de Riego** compila cada cambio de `main`, verifica la firma de actualización, el ID, la versión Android y el ajuste del teclado, guarda el APK en Actions y lo publica en Releases. Para publicar otra versión, aumenta `version` en `package.json`. No sobrescribe versiones ya publicadas con un cambio de código distinto.

El APK inicial es una compilación de prueba. El certificado `scripts/android-debug.keystore` es público y exclusivo de desarrollo, con alias `androiddebugkey` y contraseña `android`; mantiene la firma entre compilaciones de prueba para permitir actualizaciones. No se utiliza para distribuir en Google Play. Para una distribución de producción, configura una firma privada fuera del repositorio mediante `signing.env.example`.

## Primero, tu acceso principal

La pantalla inicial destaca **Crear mi acceso principal**. Primero escribes tu nombre y apellidos; luego ingresas la clave inicial. La conexión pública de **RIEGO Y FERTILIZACION** ya viene preparada en el APK, sin incluir claves ni tokens. Después de entrar, **Mis accesos** permite generar los códigos y QR del equipo. Los demás eligen **Tengo un código o QR** en una pantalla separada. Sus códigos no crean otro acceso principal.

Instala las actualizaciones sobre la app existente para conservar su acceso y los registros. Si el dispositivo ya está activado, no necesitas repetir la configuración.

La versión 0.1.4 integra la conexión del archivo en `src/lib/connection.ts` y muestra la versión también antes de activar. Comprueba con GET la bienvenida de Riego antes de enviar una clave: si el enlace devuelve otro servicio o falla la red, no envía la clave ni guarda una sesión. El dispositivo principal usa la conexión preparada aunque haya un enlace distinto guardado de un intento anterior. El código y la firma de cada actualización se mantienen independientes de las credenciales. También procesa explícitamente las redirecciones de Apps Script en Android. Envía la solicitud al enlace de la implementación y lee el resultado de Google con GET sin reenviar el código o el token a la URL de contenido. Ante una página web, una respuesta vacía o un formato distinto, muestra un mensaje específico; no guarda una sesión incompleta. Un rechazo sin explicación identifica la versión y la operación mediante `RIEGO_REPLY_REJECTED`; los fallos de comprobación se identifican mediante `RIEGO_CONNECTION`. Los mensajes no copian cuerpos de respuestas, claves ni tokens.

## Conectar tu archivo de Drive

Archivo identificado del propietario: `1JgvxAAqxLuPGjLkBoj6XpHl3f8n_8Q9ouavMOb8BRfA`. El archivo tenía solamente encabezados al inspeccionarlo; la app empieza sin mediciones inventadas. La conexión requiere una configuración en tu cuenta de Google:

1. Abre la hoja de cálculo de riego y entra a **Extensiones → Apps Script**.
2. Pega el contenido completo de **apps-script/Riego.gs**. Este script es independiente del puente usado por la primera PWA privada; no pegues ambos scripts juntos.
3. Ejecuta **configurarRiego** y autoriza el acceso al archivo. El registro de ejecución muestra un **código inicial de 64 caracteres** para tu dispositivo principal. Se usa una vez y vence en 24 horas. Consérvalo en privado.
4. En **Implementar → Nueva implementación**, elige **Aplicación web**, ejecutada **como tú**, con acceso **Cualquier usuario**. Copia el enlace que termina en **/exec**. Cada operación de datos se valida con el acceso del dispositivo.
5. Instala el APK y pulsa **Crear mi acceso principal**. Escribe tu nombre y apellidos y pulsa **Continuar**. En el segundo paso, la conexión al archivo ya está preparada: pega el código inicial en **Clave inicial de configuración** y pulsa **Crear mi acceso y entrar**. Si vuelves a implementar el script con otro enlace, actualiza `RIEGO_ENDPOINT` en `src/lib/connection.ts` y compila una nueva versión del APK.
6. Abre **Mis accesos → Unidades y archivo de Drive**, indica las unidades de compactación y presión y guarda. Humedades usa profundidades en centímetros según lo solicitado por el propietario.
7. En **Mis accesos**, escribe el nombre de la persona y pulsa **Generar código y QR**. En el otro celular instala el mismo APK, elige **Tengo un código o QR** y usa **Escanear mi QR**. El QR incluye la conexión y un código de 12 caracteres para un único dispositivo; también puedes pegar el **acceso completo** compartido o ingresar manualmente el enlace y el código. El código vence en 24 horas.

Si pierdes el acceso del dispositivo principal, ejecuta **crearAccesoPropietario** en Apps Script para emitir un nuevo código inicial. Esto requiere acceso al proyecto de Google; la app no puede adjudicarse ese acceso por sí sola.

La conexión del propietario fue publicada el 7 de octubre de 2026 y la función de configuración verificó los encabezados de las tres hojas. El enlace público se integra en el APK; las claves y los tokens no se incluyen en el repositorio. El propietario confirmó que ya pudo entrar el 7 de octubre de 2026. El propietario también confirmó pruebas de captura de humedades en el teléfono. La sincronización desde el teléfono aún requiere su comprobación.

## Capturar humedades

Selecciona una sola vez **Fecha, Sede, Fundo, Módulo y Lote**. Las casillas aparecen debajo cuando esos datos están completos.

| Sede | Profundidades |
| --- | --- |
| OLMOS | 20, 40 y 60 cm |
| MOTUPE | 20, 40, 60 y 80 cm |

Cada fila muestra la profundidad y una casilla de humedad (%) al costado. Completa todas las lecturas de la sede con valores de 0 a 100 y pulsa **Guardar humedades**. Se guardan juntas en una transacción local; al sincronizar se envía una fila por profundidad con la misma fecha y ubicación. Cambiar cualquiera de los cinco datos vacía las humedades para otra evaluación. El guardado vacía las casillas y conserva la ubicación seleccionada.

Fundo, Módulo y Lote usan listas desplegables con todas las opciones de la sede y los datos anteriores. Puedes escoger otro lote inmediatamente después de guardar, o cambiar de módulo directamente. Al cambiar de módulo se limpia el lote, y al cambiar de fundo se limpian módulo y lote. Para quitar un lote, vuelve a la opción **Selecciona un lote**; eso no bloquea el selector de módulo.

Sede y los filtros también usan el selector del dispositivo. La pantalla conserva el ancho completo al abrir listas o enfocar campos. La APK configura el teclado con `adjustResize`, y el documento web solicita `interactive-widget=resizes-content` para los navegadores compatibles. Los campos mantienen una fuente de al menos 16 px y las columnas del formulario se adaptan al ancho del celular.

## Capturar compactación

Selecciona **Fecha, Lugar, Fundo, Módulo y Lote**. Aparecen seis bloques fijos, de **Punto 1 (P1)** a **Punto 6 (P6)**, cada uno con sus casillas **M1, M2 y M3**. Las unidades configuradas se muestran en las etiquetas.

Completa las 18 lecturas con números mayores o iguales a cero y pulsa **Guardar compactación**. Se guardan los seis puntos juntos en una transacción local; al sincronizar, cada punto ocupa una fila de COMPACTACION, con P1–P6 en PUNTOS y sus tres valores en M1, M2 y M3. El guardado vacía las casillas y conserva la fecha y ubicación. Cambiar la fecha, sede, fundo, módulo o lote vacía las lecturas para empezar otra evaluación.

## Capturar presiones

Selecciona **Fecha, Lugar, Fundo y Módulo**. Debajo aparecen todos los lotes de ese módulo, cada uno con sus filas **Este** y **Oeste** y una casilla de **Presión final** al costado. El título muestra el número del lote y su código completo para identificarlo. La unidad configurada aparece en el encabezado.

Por ejemplo, **OLMOS → CHALLAPAMPA → M11** muestra los 23 lotes del mapa original, comenzando por **Lote 39 (M11T01-39)** y **Lote 40 (M11T01-40)**, e incluye el lote 42B y los lotes 101–104.

Pulsa **Guardar presiones** para guardar todas las lecturas ingresadas juntas en una transacción local. Puedes avanzar por partes: las casillas vacías se omiten y el cero se conserva como una lectura válida. Cada lectura ocupa una fila de PRESIONES con el lote completo, LADO igual a ESTE u OESTE y su PRESION FINAL. Se admiten decimales y valores mayores o iguales a cero. Un valor inválido detiene el guardado del conjunto.

Después de guardar, las casillas se vacían y se conserva la fecha y el módulo. Cambiar fecha, sede, fundo o módulo vacía el formulario para otra evaluación. Humedades y Compactación mantienen su selector de lote individual.

## Capturar calidad de agua

Selecciona **Fecha, Sede y Filtrado**. La lista de filtrados cambia con la sede:

| Sede | Filtrados |
| --- | --- |
| OLMOS | FILTRADO PESQUERA, FILTRADO CHOLOCAL |
| MOTUPE | FRANCO, CHOLOQUE, PALACIOS, CHOC CHOC, ANDINA |

Debajo aparecen **pH, CE, Na y Ca**, cada uno con su casilla al costado. Completa las cuatro lecturas con números mayores o iguales a cero; se admiten decimales. **Guardar calidad de agua** conserva las cuatro lecturas juntas en un registro local. **Sincronizar con Drive** envía una fila a **CALIDAD AGUA**, con año, mes y semana calculados desde la fecha. El historial muestra sede, filtrado y los cuatro valores. Cambiar fecha, sede o filtrado vacía las lecturas; cambiar sede también limpia el filtrado seleccionado.

La hoja **CALIDAD AGUA** y sus encabezados se comprobaron con la conexión de Google el 7 de octubre de 2026. La conexión existente del propietario se actualizó correctamente a la **versión 2** el mismo día, a las 12:45 de Perú, conservando el enlace /exec, la ejecución como propietario y el acceso de la implementación. **verificarCalidadAgua** terminó correctamente y el código guardado coincide con la versión probada en este repositorio. Los dispositivos conectados a este archivo no necesitan volver a configurar el acceso. Los pasos siguientes sirven para actualizar otra copia de la conexión. Para habilitar el envío a esta hoja, actualiza el proyecto existente de Apps Script con **apps-script/Riego.gs**, guarda y edita la implementación actual en **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Conserva el mismo enlace y configuración de acceso. Puedes ejecutar **verificarCalidadAgua** para comprobar solo los encabezados; no vuelvas a ejecutar **configurarRiego** ni **crearAccesoPropietario**, porque no necesitas otra clave inicial.

La APK comprueba si la conexión admite agua antes de enviarla. Mientras el script anterior siga publicado, el agua permanece pendiente en el dispositivo y las otras tres clases de mediciones pueden sincronizarse. Tras actualizar la implementación, vuelve a pulsar **Sincronizar con Drive**. Las APK anteriores siguen recibiendo sus tres apartados sin registros de agua que no puedan interpretar.

## Columnas originales

El script conserva tus cuatro hojas, nombres, orden y columnas. No crea hojas adicionales, columnas de acceso ni columnas de identificadores. Cada registro usa una nota `RIEGO_ID` en la celda de AÑO para que reintentar no duplique filas; conserva las notas previas.

| Hoja | Columnas |
| --- | --- |
| HUMEDADES | AÑO, MES, SEMANA, FECHA, LUGAR, FUNDO, MODULO, LOTE, PROF, %HUMEDAD |
| COMPACTACION | AÑO, MES, SEMANA, FECHA, LUGAR, FUNDO, MODULO, LOTE, PUNTOS, M1, M2, M3 |
| PRESIONES | AÑO, MES, SEMANA, FECHA, LUGAR, FUNDO, MODULO, LOTE, LADO, PRESION FINAL |
| CALIDAD AGUA | AÑO, MES, SEMANA, FECHA, LUGAR, FILTRADO, PH, C.E, Na, Ca |

Año, mes y semana ISO se calculan desde la fecha. Los porcentajes de humedad almacenados con formato de porcentaje de Sheets se convierten a puntos porcentuales. Las nuevas filas de humedad usan valores de 0 a 100 con formato numérico.

## Sin conexión y sincronización

Los recursos web van incluidos en el APK; no necesita iniciar sesión en ChatGPT ni cargar la PWA privada. El primer acceso por código o QR requiere internet. Después, el celular conserva el acceso y permite registrar, consultar y representar sus datos locales sin conexión. El mapa incluye los polígonos; la base de OpenStreetMap requiere conexión.

Las mediciones se guardan primero en IndexedDB. **Sincronizar con Drive** envía hasta 100 por solicitud, conserva las confirmaciones de cada lote y descarga las mediciones de las cuatro hojas, con la implementación de Apps Script actualizada. Las lecturas importadas reflejan los cambios del archivo; los registros locales que faltan por enviar se conservan. Si una respuesta se pierde, reintentar usa el mismo UUID. No desinstales ni borres los datos de la app antes de sincronizar lo pendiente. El cierre de acceso se bloquea cuando existen mediciones pendientes.

En **Mis accesos → Accesos de tu equipo**, el principal ve los códigos pendientes y los celulares activados, busca por nombre o referencia, edita nombres, cancela QR pendientes y retira accesos activos. Cada código activa un solo celular. El nombre lo asigna el principal; la lista no identifica a las personas a quienes se reenvió una imagen del QR ni verifica su identidad real. No se crea un nuevo rol.

Los accesos de versiones anteriores se conservan: al abrir la lista reciben una referencia pública, sin cambiar sus tokens ni su fecha de vencimiento. Si aparecen sin nombre, usa **Poner nombre**. La APK actualizada muestra en cada celular compartido **Mi acceso** y su referencia; el principal puede comparar esa referencia con la lista. El historial incluye códigos cancelados o vencidos y accesos retirados o cerrados.

**Cancelar QR** impide activar ese código. **Retirar acceso** bloquea sus solicitudes en el servidor desde el retiro. Las APK actualizadas comprueban el acceso al reconectarse, al volver al primer plano y cada minuto mientras estén abiertas y conectadas. Un celular sin internet puede seguir usando su copia local hasta comprobar el retiro; los datos descargados y las mediciones pendientes no se borran. Las APK antiguas reciben el rechazo al volver a consultar Drive. Para devolver el acceso, crea un código nuevo.

Esta función requiere publicar el código actualizado de **apps-script/Riego.gs** como nueva versión de la implementación existente, conservando el mismo enlace y permisos. **verificarGestionAccesos** solo cuenta los dispositivos compartidos existentes; no crea invitaciones, no retira accesos ni modifica propiedades. No ejecutes **configurarRiego** ni **crearAccesoPropietario** para esta actualización.

Los accesos se almacenan mediante hashes en las propiedades de Apps Script. Los códigos son temporales y de un solo uso. El servidor valida el token antes de acceder al archivo y utiliza un bloqueo para la activación y la sincronización. Al volver a conectarse, verifica la vigencia del acceso; sin conexión utiliza la activación guardada localmente.

## Mapa

`data/lotes-mapa.geojson` conserva los bytes de `LuisP2809/fenologia-pwa`, blob `fb6d005ae6994a0aca9c0c4f54f4194cea6a83e0`. Incluye 254 polígonos: 166 de OLMOS y 88 de MOTUPE. Vincula cada medición por lugar/campo, fundo, módulo y lote, evitando confundir códigos iguales en ubicaciones distintas.

En **Gráficas**, elige el apartado y filtra por sede, fundo, módulo, lote y periodo. Los selectores de ubicación mantienen las alternativas y limpian los filtros dependientes al cambiar de sede, fundo o módulo.

### Humedades

- **Evolución semanal por profundidad**: promedio semanal para cada profundidad de la sede, con una línea por profundidad. El eje vertical usa 0–45% con marcas cada 5 puntos para distinguir mejor las profundidades. Si un promedio semanal supera 45%, la escala se amplía al siguiente múltiplo de 10 para mantenerlo visible. Las semanas usan su año ISO; una semana sin lecturas deja un hueco en la línea. Si solo hay una semana, se muestran los puntos de cada profundidad.
- **Promedio por fundo**: promedio de las lecturas de humedad registradas en el periodo y la ubicación seleccionados.
- **Matriz módulo–profundidad**: humedad promedio (%) para cada módulo y profundidad. El cero se muestra como cero; una profundidad sin lecturas aparece con un guion y fondo gris.

### Compactación y Presiones

Cada apartado muestra un **ranking horizontal y su mapa de polígonos**, con los mismos filtros, promedio y colores. El control **Ranking y mapa** permite alternar entre **Por módulo** y **Por lote**. El mapa del análisis tiene fondo blanco como la referencia; puedes tocar un lote para consultar su ubicación y promedio. La tabla **Ver promedios del ranking** muestra los valores y la ubicación completa. En pantalla pequeña el mapa y el ranking se apilan.

Compactación usa por defecto todas las lecturas M1, M2 y M3 de los puntos registrados. Puedes consultar también M1, M2 o M3 por separado. Presiones promedia las lecturas de los lados registrados; el filtro **Lado** permite consultar Este u Oeste. Los promedios del módulo incluyen todas las lecturas de sus lotes dentro del filtro.

| Apartado | Rojo | Azul | Verde |
| --- | --- | --- | --- |
| Compactación | 0 a 40 inclusive | Mayor de 40 hasta 60 inclusive | Mayor de 60 |
| Presiones | Menor de 8 | Mayor de 12 | 8 a 12 inclusive |

Los límites son los indicados por el propietario. Para que los decimales no queden sin categoría, 40.5 de compactación es azul y 7.5 de presión es rojo. Los polígonos sin lecturas para el filtro son grises; si se elige **Por módulo**, sus lotes comparten el promedio del módulo. El apartado **Mapa** conserva la base de OpenStreetMap y usa estos mismos límites de Compactación y Presiones. Humedades usa una escala verde de 0 a 100%.

No se mezclan módulos ni lotes de sedes o fundos distintos, aunque tengan el mismo código.

## Desarrollo y comprobaciones

Requiere Node 22 o posterior. Para Android, Java 21 y SDK 36.

```sh
npm ci
npm test
npm run android:init
npm run apk:debug
```

El proyecto Android se genera desde Capacitor y queda fuera de Git. `scripts/configure-android.mjs` aplica el nombre, ID, versión, Android mínimo 8, enlaces `riego://activate`, icono y desactiva la copia de seguridad automática de datos de dispositivos.

`npm test` ejecuta 68 pruebas. Trece pruebas de gestión cubren nombres, referencias estables, migración de accesos anteriores, activación de un único celular, cancelación, retiro, caducidad, cierre, controles solo para el principal, protección de sus sesiones, errores en listas desactualizadas, bloqueo antes de leer hojas, renombre sin cambiar tokens, búsquedas y escape de HTML, compatibilidad con conexiones antiguas y solicitudes tardías que no restauran ni borran otras sesiones.  Ocho pruebas de agua verifican los filtrados por sede, las cuatro lecturas obligatorias, cero y decimales, las diez columnas originales, reintentos sin duplicar, rechazos sin filas parciales, conservación de accesos, formularios y compatibilidad con APK y conexiones anteriores. Las restantes comprobaciones se describen a continuación. Verifica límites y colores, promedios del ranking y mapa, filtros de fecha y ubicación, lecturas por lado, identidad completa por sede/fundo/módulo/lote, semana ISO y huecos sin datos, promedios por fundo, matriz por profundidad, cero y ausencia de lecturas, las vistas y etiquetas de Gráficas, además de los lotes completos del módulo para Presiones, filas Este y Oeste, lecturas parciales, cero y decimales, etiquetas de lote y lado y reintentos en las columnas originales, la captura de los seis puntos de compactación, sus 18 lecturas, ceros y decimales, rechazos de valores incompletos o inválidos, las filas originales y reintentos sin duplicar, el formulario con etiquetas por punto y unidad, el selector nativo de Sede y el cambio de lote y módulo después de guardar, las opciones completas y el reinicio de los campos dependientes, perfiles de humedad de Olmos y Motupe, captura completa, decimal con coma, filas originales y reintentos sin duplicar, fechas y semana ISO, humedad cero y límites, identidad exacta del GeoJSON, QR y restricciones del servidor, acceso sin token, códigos de un uso, vencimiento, permisos de configuración, revocación, reintentos sin duplicar, conflictos sin filas parciales, las tres hojas, porcentajes, notas y conservación de lotes confirmados al interrumpirse la sincronización. También prueba el envío nativo, las redirecciones de Google, el rechazo de otros destinos, los errores de formato, la lectura fallida sin reenviar la activación y la conservación de la sesión nativa. Las pruebas también verifican que la comprobación use GET sin credenciales, que un servicio incorrecto o un fallo de red detenga la activación, que un enlace previo no cambie el destino del principal y que cliente y Apps Script simulado permitan activar al principal y entregar acceso a un segundo dispositivo. Las pruebas de Apps Script y HTTP son simuladas, sin leer ni escribir el archivo de Google.

La conexión se publicó y sus encabezados se comprobaron en Google. La respuesta HTTP real no se pudo verificar desde este navegador porque bloqueó la apertura del enlace de la implementación. El propietario confirmó que pudo entrar desde su teléfono. El propietario confirmó pruebas de captura de humedades. Las gráficas, la captura de presiones por módulo y de compactación de seis puntos, la corrección visual al abrir Sede o el teclado, sincronización y cámara desde un celular físico requieren la prueba del propietario con la nueva APK.
