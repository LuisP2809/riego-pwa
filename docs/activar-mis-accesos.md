# Habilitar Mis accesos en Riego 0.1.13

La APK 0.1.13 y el código están preparados. La actualización de la conexión de Google sigue pendiente: el 8 de octubre de 2026 el inicio de sesión respondió **502 Bad Gateway / Connection refused**, también tras una recarga. No se publicaron cambios en Google en ese intento.

## Publicar desde tu cuenta

1. Abre el proyecto existente **Riego - Conexión de campo** en Google Apps Script, con la cuenta del propietario. Usa el mismo proyecto que conecta el archivo **RIEGO Y FERTILIZACION**.
2. Abre [Riego.gs](../apps-script/Riego.gs), copia su contenido completo y reemplaza el contenido del archivo de código de ese proyecto. Guarda con **Guardar proyecto en Drive**. No crees un proyecto ni una implementación adicionales.
3. Abre **Implementar → Gestionar implementaciones**. Selecciona la implementación existente y pulsa **Editar** (el lápiz).
4. En **Versión**, elige **Versión nueva**. Puedes escribir la descripción **Riego 0.1.13 – Mis accesos**. Conserva las opciones actuales de **Ejecutar como** y **Quién tiene acceso**. Pulsa **Implementar** y comprueba que Google confirme que la implementación se actualizó correctamente. Su enlace `/exec` debe ser el mismo que antes.
5. Abre **Riego 0.1.13** en tu celular principal y entra en **Mis accesos → Actualizar**. La lista debe mostrar los accesos compartidos actuales, con su estado y referencia. Los anteriores que no tenían nombre pueden identificarse con **Poner nombre**.

**No ejecutes configurarRiego ni crearAccesoPropietario**: esta actualización utiliza la conexión y los accesos existentes; esas funciones de preparación no hacen falta y pueden reemplazar la clave inicial.

Si deseas comprobar el código desde el editor, selecciona únicamente **verificarGestionAccesos** antes de pulsar **Ejecutar**. Esa función solo cuenta los dispositivos compartidos; no crea códigos, no retira accesos y no modifica propiedades. Publicar la nueva versión del paso 4 sigue siendo necesario.

## Funciones disponibles después de publicar

- Crear códigos y QR con el nombre de cada persona.
- Ver y buscar accesos pendientes, activos e históricos.
- Editar nombres de accesos nuevos o anteriores.
- Cancelar QR pendientes y retirar accesos activados, con confirmación en la app.

Cada código activa un celular y vence en 24 horas. El nombre identifica a quien decides entregarlo; la lista no detecta reenvíos de una imagen del QR ni verifica la identidad real de su usuario.

El servidor bloquea las solicitudes de un acceso retirado. Los celulares actualizados comprueban su acceso al reconectarse, al volver al primer plano y cada minuto mientras estén abiertos y conectados. Sin internet pueden seguir usando su copia local hasta comprobar el retiro. Los datos descargados y pendientes no se borran.
