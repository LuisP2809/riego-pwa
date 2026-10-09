# Riego 0.1.14

**Mis accesos** muestra primero los accesos activos y pendientes para mantener despejada la pantalla.

- En **Mostrar → Finalizados**, usa **Eliminar del listado** para quitar los accesos retirados, cancelados, vencidos o cerrados, con confirmación.
- Los accesos eliminados siguen bloqueados y no vuelven a aparecer al actualizar o al usar otro dispositivo principal. Sus mediciones se conservan.
- Los accesos activos, los QR pendientes y los dispositivos principales quedan protegidos. Primero retira un acceso activo o cancela su QR para poder quitarlo del listado.
- Se mantienen los nombres, referencias, códigos y QR del equipo, junto con los cuatro apartados de captura, las gráficas y el mapa.

Cada código activa un celular y vence en 24 horas. La lista muestra códigos creados y dispositivos activados; no detecta a quién se reenvió una imagen del QR ni verifica la identidad real de quien la use.

El servidor rechaza las solicitudes de un acceso retirado. La APK comprueba su vigencia al reconectarse, al volver a abrirse y cada minuto mientras esté abierta con internet. Sin conexión, el celular conserva su funcionamiento local hasta comprobar el retiro. Los datos descargados y pendientes no se borran.

**Eliminar del listado requiere el código de Apps Script de esta versión.** Actualiza el proyecto existente con **apps-script/Riego.gs** y publica una nueva versión de la misma implementación, conservando su enlace y configuración. No ejecutes **configurarRiego** ni generes otra clave inicial para esta actualización. **verificarGestionAccesos** solo comprueba los dispositivos existentes, sin crear códigos ni retirar accesos. Si la conexión aún es anterior, la app pide actualizarla antes de enviar una eliminación.

La conexión del propietario ya fue actualizada el 9 de octubre de 2026 a las 16:54 (Perú): Google confirmó la versión 4 y conservó el enlace `/exec` y los permisos existentes. La comprobación de accesos finalizó correctamente, sin modificar sus propiedades ni las mediciones.

Instala **Riego-0.1.14.apk** sobre la versión actual para conservar tu acceso y registros. Si Android rechaza la actualización, conserva la app instalada y anota el mensaje exacto para revisar el problema.

Validación: 74 pruebas automatizadas, compilación web y preparación Android. Las pruebas del servidor y HTTP son simuladas y no generan códigos ni revocan dispositivos reales. La limpieza se comprueba con reintentos, cambios durante la espera, conexiones antiguas, sesiones del principal, refresco del listado y conservación de mediciones. GitHub comprueba la firma, el identificador, la versión Android y el ajuste del teclado antes de publicar la APK.
