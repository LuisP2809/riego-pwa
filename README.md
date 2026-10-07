# Riego · Campo

Aplicación Android y PWA para capturar y consultar **Humedades, Compactación y Presiones**, con gráficas y mapa. Todos los dispositivos de campo tienen las mismas funciones. El dispositivo principal configura las unidades y entrega accesos; no hay roles de evaluador, supervisor ni administrador.

## Descargar e instalar

Abre **Releases** de este repositorio y descarga el archivo `Riego-0.1.5.apk`. Android puede pedir que permitas la instalación desde el navegador o el gestor de archivos. El identificador de la app es `pe.riego.campo`, independiente de Fenología y Fitosanidad.

El workflow **APK descargable de Riego** compila cada cambio de `main`, guarda el APK en Actions y lo publica en Releases. Para publicar otra versión, aumenta `version` en `package.json`. No sobrescribe versiones ya publicadas con un cambio de código distinto.

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
7. En **Mis accesos**, pulsa **Generar código y QR**. En el otro celular instala el mismo APK, elige **Tengo un código o QR** y usa **Escanear mi QR**. El QR incluye la conexión y un código de 12 caracteres para un único dispositivo; también puedes pegar el **acceso completo** compartido o ingresar manualmente el enlace y el código. El código vence en 24 horas.

Si pierdes el acceso del dispositivo principal, ejecuta **crearAccesoPropietario** en Apps Script para emitir un nuevo código inicial. Esto requiere acceso al proyecto de Google; la app no puede adjudicarse ese acceso por sí sola.

La conexión del propietario fue publicada el 7 de octubre de 2026 y la función de configuración verificó los encabezados de las tres hojas. El enlace público se integra en el APK; las claves y los tokens no se incluyen en el repositorio. El propietario confirmó que ya pudo entrar el 7 de octubre de 2026. La sincronización desde el teléfono aún requiere su comprobación.

## Capturar humedades

Selecciona una sola vez **Fecha, Sede, Fundo, Módulo y Lote**. Las casillas aparecen debajo cuando esos datos están completos.

| Sede | Profundidades |
| --- | --- |
| OLMOS | 20, 40 y 60 cm |
| MOTUPE | 20, 40, 60 y 80 cm |

Cada fila muestra la profundidad y una casilla de humedad (%) al costado. Completa todas las lecturas de la sede con valores de 0 a 100 y pulsa **Guardar humedades**. Se guardan juntas en una transacción local; al sincronizar se envía una fila por profundidad con la misma fecha y ubicación. Cambiar cualquiera de los cinco datos vacía las humedades para otra evaluación. El guardado vacía las casillas y conserva la ubicación seleccionada.

## Columnas originales

El script conserva tus tres hojas, nombres, orden y columnas. No crea hojas adicionales, columnas de acceso ni columnas de identificadores. Cada registro usa una nota `RIEGO_ID` en la celda de AÑO para que reintentar no duplique filas; conserva las notas previas.

| Hoja | Columnas |
| --- | --- |
| HUMEDADES | AÑO, MES, SEMANA, FECHA, LUGAR, FUNDO, MODULO, LOTE, PROF, %HUMEDAD |
| COMPACTACION | AÑO, MES, SEMANA, FECHA, LUGAR, FUNDO, MODULO, LOTE, PUNTOS, M1, M2, M3 |
| PRESIONES | AÑO, MES, SEMANA, FECHA, LUGAR, FUNDO, MODULO, LOTE, LADO, PRESION FINAL |

Año, mes y semana ISO se calculan desde la fecha. Los porcentajes de humedad almacenados con formato de porcentaje de Sheets se convierten a puntos porcentuales. Las nuevas filas de humedad usan valores de 0 a 100 con formato numérico.

## Sin conexión y sincronización

Los recursos web van incluidos en el APK; no necesita iniciar sesión en ChatGPT ni cargar la PWA privada. El primer acceso por código o QR requiere internet. Después, el celular conserva el acceso y permite registrar, consultar y representar sus datos locales sin conexión. El mapa incluye los polígonos; la base de OpenStreetMap requiere conexión.

Las mediciones se guardan primero en IndexedDB. **Sincronizar con Drive** envía hasta 100 por solicitud, conserva las confirmaciones de cada lote y descarga las mediciones de las tres hojas. Las lecturas importadas reflejan los cambios del archivo; los registros locales que faltan por enviar se conservan. Si una respuesta se pierde, reintentar usa el mismo UUID. No desinstales ni borres los datos de la app antes de sincronizar lo pendiente. El cierre de acceso se bloquea cuando existen mediciones pendientes.

Los accesos se almacenan mediante hashes en las propiedades de Apps Script. Los códigos son temporales y de un solo uso. El servidor valida el token antes de acceder al archivo y utiliza un bloqueo para la activación y la sincronización. Al volver a conectarse, verifica la vigencia del acceso; sin conexión utiliza la activación guardada localmente.

## Mapa

`data/lotes-mapa.geojson` conserva los bytes de `LuisP2809/fenologia-pwa`, blob `fb6d005ae6994a0aca9c0c4f54f4194cea6a83e0`. Incluye 254 polígonos: 166 de OLMOS y 88 de MOTUPE. Vincula cada medición por lugar/campo, fundo, módulo y lote, evitando confundir códigos iguales en ubicaciones distintas.

Las gráficas de humedad separan profundidades y las de presión separan lados. Compactación usa M1, M2 y M3. El color del mapa compara promedios de los datos filtrados; no representa umbrales agronómicos supuestos.

## Desarrollo y comprobaciones

Requiere Node 22 o posterior. Para Android, Java 21 y SDK 36.

```sh
npm ci
npm test
npm run android:init
npm run apk:debug
```

El proyecto Android se genera desde Capacitor y queda fuera de Git. `scripts/configure-android.mjs` aplica el nombre, ID, versión, Android mínimo 8, enlaces `riego://activate`, icono y desactiva la copia de seguridad automática de datos de dispositivos.

`npm test` verifica perfiles de humedad de Olmos y Motupe, captura completa, decimal con coma, filas originales y reintentos sin duplicar, fechas y semana ISO, humedad cero y límites, identidad exacta del GeoJSON, QR y restricciones del servidor, acceso sin token, códigos de un uso, vencimiento, permisos de configuración, revocación, reintentos sin duplicar, conflictos sin filas parciales, las tres hojas, porcentajes, notas y conservación de lotes confirmados al interrumpirse la sincronización. También prueba el envío nativo, las redirecciones de Google, el rechazo de otros destinos, los errores de formato, la lectura fallida sin reenviar la activación y la conservación de la sesión nativa. Las pruebas también verifican que la comprobación use GET sin credenciales, que un servicio incorrecto o un fallo de red detenga la activación, que un enlace previo no cambie el destino del principal y que cliente y Apps Script simulado permitan activar al principal y entregar acceso a un segundo dispositivo. Las pruebas de Apps Script y HTTP son simuladas, sin leer ni escribir el archivo de Google.

La conexión se publicó y sus encabezados se comprobaron en Google. La respuesta HTTP real no se pudo verificar desde este navegador porque bloqueó la apertura del enlace de la implementación. El propietario confirmó que pudo entrar desde su teléfono. La captura de humedades, sincronización y cámara desde un celular físico requieren la prueba del propietario con la nueva APK.
