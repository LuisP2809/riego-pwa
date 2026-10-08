# Riego 0.1.13

**Mis accesos** permite administrar los celulares de tu equipo desde el dispositivo principal:

- Escribe el nombre de la persona al generar un código y QR.
- Revisa accesos pendientes, activos, cancelados, retirados, vencidos o cerrados. Busca por nombre o referencia.
- Usa **Poner nombre** o **Editar nombre** para identificar los accesos anteriores sin cambiar su activación.
- **Cancelar QR** impide activar un código pendiente. **Retirar acceso** bloquea la conexión del celular activado.
- El acceso principal queda protegido. Para devolver un acceso retirado, genera un nuevo código.

Cada código activa un celular y vence en 24 horas. La lista muestra códigos creados y dispositivos activados; no detecta a quién se reenvió una imagen del QR ni verifica la identidad real de quien la use.

El servidor rechaza las solicitudes de un acceso retirado. La APK comprueba su vigencia al reconectarse, al volver a abrirse y cada minuto mientras esté abierta con internet. Sin conexión, el celular conserva su funcionamiento local hasta comprobar el retiro. Los datos descargados y pendientes no se borran.

**La conexión de Drive requiere el código de Apps Script de esta versión.** Actualiza el proyecto existente con **apps-script/Riego.gs** y publica una nueva versión de la misma implementación, conservando su enlace y configuración. No ejecutes **configurarRiego** ni generes otra clave inicial. **verificarGestionAccesos** solo comprueba los dispositivos existentes, sin crear códigos ni retirar accesos.

Instala **Riego-0.1.13.apk** sobre la versión actual para conservar tu acceso y registros. Actualiza también los celulares del equipo para que muestren su referencia y comprueben el retiro al abrir la app.

Validación: 68 pruebas automatizadas, compilación web y preparación Android. Las pruebas del servidor y HTTP son simuladas y no generan códigos ni revocan dispositivos reales. GitHub comprueba la firma, el identificador, la versión Android y el ajuste del teclado antes de publicar la APK.
