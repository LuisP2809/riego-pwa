# Verificación de Riego 0.1.14

- 74 pruebas aprobadas en local, sin errores. Las pruebas de Apps Script y HTTP usan simulaciones; no crean códigos ni cambian accesos reales.
- La eliminación del listado mantiene el bloqueo del código o token, conserva las mediciones y los demás accesos y persiste al refrescar o entrar desde otro principal.
- Se protegen los dispositivos principales, los accesos activos y los QR pendientes. Se comprueban reintentos, cambios durante el bloqueo, conexiones anteriores y respuestas incorrectas.
- Compilación web y sincronización de Capacitor Android completadas correctamente. El paquete web contiene Eliminar del listado, Finalizados, Activos y pendientes y los cuatro apartados anteriores. El GeoJSON conserva sus 254 polígonos.
- Apps Script preparado: SHA-256 `6e97d783de37cfb7d7cef8b30873245f0770854e710db9b122448ad3edb1c84e`.

La publicación de la APK y la actualización del proyecto de Google se verificarán por separado. No se afirma una prueba en un celular físico ni una publicación de Google sin confirmar su resultado.
