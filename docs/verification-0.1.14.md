# Verificación de Riego 0.1.14

- 74 pruebas aprobadas en local y en GitHub Actions, sin errores. Las pruebas de Apps Script y HTTP usan simulaciones; no crean códigos ni cambian accesos reales.
- La eliminación del listado mantiene el bloqueo del código o token, conserva las mediciones y los demás accesos y persiste al refrescar o entrar desde otro principal.
- Se protegen los dispositivos principales, los accesos activos y los QR pendientes. Se comprueban reintentos, cambios durante el bloqueo, conexiones anteriores y respuestas incorrectas.
- Compilación web y sincronización de Capacitor Android completadas correctamente. El paquete web contiene Eliminar del listado, Finalizados, Activos y pendientes y los cuatro apartados anteriores. El GeoJSON conserva sus 254 polígonos.
- Apps Script preparado: SHA-256 `6e97d783de37cfb7d7cef8b30873245f0770854e710db9b122448ad3edb1c84e`.

## APK publicada

- Código publicado: commit `4c1abda35839b29b4191972e17b936cf6fef4d10`.
- [GitHub Actions 37995347134](https://github.com/LuisP2809/riego-pwa/actions/runs/37995347134): tareas APK y release completadas correctamente.
- `apksigner` confirmó la firma v2 y el certificado SHA-256 `d3ddb0a20e478eb21fd628e65e0c0fb99b45cc7ff4fc9b469b8a42bdcafe6c4e`, igual al de las versiones anteriores. La comprobación de la APK confirmó `pe.riego.campo`, versión `0.1.14`, código `1014`, Android mínimo 8, SDK objetivo 36 y `adjustResize`.
- [Riego-0.1.14.apk](https://github.com/LuisP2809/riego-pwa/releases/download/v0.1.14/Riego-0.1.14.apk): activo publicado, 35 942 723 bytes. SHA-256 del activo de GitHub: `76a3c9ef7449ccb4c2148beea758e61e1e29f58f6b0e3bbb857ac3f789a59ed1`.
- [Release v0.1.14](https://github.com/LuisP2809/riego-pwa/releases/tag/v0.1.14) contiene también el archivo de comprobación SHA-256.

## Conexión publicada en Google

- El código anterior del editor coincidía con Riego 0.1.13, salvo el salto final de línea. Se reemplazó por el código probado de esta versión y se comprobó su igualdad exacta antes de guardar.
- Se ejecutó únicamente **verificarGestionAccesos**. A las 16:53:08 (Perú), el registro confirmó la gestión de nombres, lista, cancelación, retiro y eliminación del listado; conservó el dispositivo compartido existente y completó la ejecución. Esta función no crea códigos, no cambia propiedades y no lee ni escribe las hojas.
- Se editó la implementación activa existente, que estaba en la versión 3. Google confirmó **La implementación se ha actualizado correctamente**, **Versión 4 del 9 oct 2026, 16:54**.
- Se mantuvieron el ID de implementación `AKfycbymt9cKVuzFMc0orOQqDBGGyDxIO8-bXSZzUCFxXFQCRh90U-RgSNY10wvj08hG17Tb`, su enlace `/exec`, la ejecución por el propietario y **Cualquier usuario** como opciones preexistentes.
- No se ejecutó **configurarRiego** ni **crearAccesoPropietario**. No se crearon, retiraron ni ocultaron accesos reales como prueba.

La publicación y el registro se comprobaron en el editor de Google. No se afirma una solicitud HTTP real de limpieza ni una actualización probada en un celular físico. El propietario debe comprobar esa acción desde la APK publicada.
