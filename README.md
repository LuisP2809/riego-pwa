# Riego · Campo

Aplicación Android y PWA para capturar y consultar **Humedades, Compactación y Presiones**, con gráficas y mapa. Todos los dispositivos de campo tienen las mismas funciones. El dispositivo principal configura las unidades y entrega accesos; no hay roles de evaluador, supervisor ni administrador.

## Descargar e instalar

Abre **Releases** de este repositorio y descarga el archivo `Riego-0.1.1.apk`. Android puede pedir que permitas la instalación desde el navegador o el gestor de archivos. El identificador de la app es `pe.riego.campo`, independiente de Fenología y Fitosanidad.

El workflow **APK descargable de Riego** compila cada cambio de `main`, guarda el APK en Actions y lo publica en Releases. Para publicar otra versión, aumenta `version` en `package.json`. No sobrescribe versiones ya publicadas con un cambio de código distinto.

El APK inicial es una compilación de prueba. El certificado `scripts/android-debug.keystore` es público y exclusivo de desarrollo, con alias `androiddebugkey` y contraseña `android`; mantiene la firma entre compilaciones de prueba para permitir actualizaciones. No se utiliza para distribuir en Google Play. Para una distribución de producción, configura una firma privada fuera del repositorio mediante `signing.env.example`.

## Conectar tu archivo de Drive

Archivo identificado del propietario: `1JgvxAAqxLuPGjLkBoj6XpHl3f8n_8Q9ouavMOb8BRfA`. El archivo tenía solamente encabezados al inspeccionarlo; la app empieza sin mediciones inventadas. La conexión requiere una configuración en tu cuenta de Google:

1. Abre la hoja de cálculo de riego y entra a **Extensiones → Apps Script**.
2. Pega el contenido completo de **apps-script/Riego.gs**. Este script es independiente del puente usado por la primera PWA privada; no pegues ambos scripts juntos.
3. Ejecuta **configurarRiego** y autoriza el acceso al archivo. El registro de ejecución muestra un **código inicial de 64 caracteres** para tu dispositivo principal. Se usa una vez y vence en 24 horas. Consérvalo en privado.
4. En **Implementar → Nueva implementación**, elige **Aplicación web**, ejecutada **como tú**, con acceso **Cualquier usuario**. Copia el enlace que termina en **/exec**. Cada operación de datos se valida con el acceso del dispositivo.
5. Instala el APK. En **Conexión con Drive**, pega el enlace `/exec`. En **Código de acceso**, pega el código inicial y pulsa **Activar este dispositivo**.
6. Abre el botón de configuración de tu dispositivo principal, indica las unidades de profundidad, compactación y presión y guarda. No se han supuesto unidades para esas columnas.
7. Pulsa **Generar nuevo acceso**. En el otro celular instala el mismo APK y usa **Escanear QR de acceso**. El QR incluye la conexión y un código de 12 caracteres para un único dispositivo; también puedes ingresar manualmente el enlace y el código. El código vence en 24 horas.

Si pierdes el acceso del dispositivo principal, ejecuta **crearAccesoPropietario** en Apps Script para emitir un nuevo código inicial. Esto requiere acceso al proyecto de Google; la app no puede adjudicarse ese acceso por sí sola.

La configuración de Apps Script y su autorización en Google **aún no se han realizado**. No se ha publicado ni modificado tu archivo de Drive durante la creación del APK.

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

`npm test` verifica fechas y semana ISO, humedad cero y límites, identidad exacta del GeoJSON, QR y restricciones del servidor, acceso sin token, códigos de un uso, vencimiento, permisos de configuración, revocación, reintentos sin duplicar, conflictos sin filas parciales, las tres hojas, porcentajes, notas y conservación de lotes confirmados al interrumpirse la sincronización. Las pruebas de Apps Script son simuladas, sin leer ni escribir el archivo de Google.

La conexión real con Apps Script y la cámara/instalación en un celular físico quedan por probar después de la configuración del propietario.
