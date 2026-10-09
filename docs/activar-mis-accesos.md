# Actualizar Mis accesos en Riego 0.1.14

La versión 0.1.14 muestra primero los accesos activos y pendientes y permite quitar los accesos finalizados del listado. El código de Google necesita actualizarse para habilitar esta última función. No se ha comprobado su publicación en la cuenta del propietario durante esta entrega.

## Publicar desde tu cuenta

1. Abre el proyecto existente **Riego - Conexión de campo** en Google Apps Script, con la cuenta del propietario. Usa el mismo proyecto que conecta el archivo **RIEGO Y FERTILIZACION**.
2. Abre [Riego.gs](../apps-script/Riego.gs), copia su contenido completo y reemplaza el contenido del archivo de código de ese proyecto. Guarda con **Guardar proyecto en Drive**.
3. Abre **Implementar → Gestionar implementaciones**. Selecciona la implementación existente y pulsa **Editar** (el lápiz).
4. En **Versión**, elige **Versión nueva**, con la descripción **Riego 0.1.14 – Limpieza de accesos**. Conserva las opciones actuales de **Ejecutar como** y **Quién tiene acceso**. Pulsa **Implementar** y comprueba que Google confirme la actualización. Su enlace `/exec` debe ser el mismo que antes.
5. Instala **Riego 0.1.14** sobre la app actual y entra en **Mis accesos → Actualizar**. Si Android rechaza actualizar, conserva la app instalada y anota el mensaje exacto.
6. En **Mostrar → Finalizados**, pulsa **Eliminar del listado** en un acceso retirado, cancelado, vencido o cerrado. Revisa su nombre y referencia y pulsa **Confirmar eliminación**. El acceso desaparece de la lista y sigue bloqueado; las mediciones se conservan.

**Esta actualización conserva los accesos existentes.** No ejecutes **configurarRiego** ni **crearAccesoPropietario** para actualizarla. Si desinstalaste la app y perdiste tu acceso principal, sí puedes ejecutar únicamente **crearAccesoPropietario** en tu proyecto para recuperar ese acceso con una nueva clave inicial, válida 24 horas y de un solo uso; esta recuperación conserva los accesos del equipo y las mediciones de Drive.

Para comprobar el código sin cambiar accesos, selecciona **verificarGestionAccesos** antes de pulsar **Ejecutar**. Esa función solo cuenta los dispositivos compartidos; no crea códigos, no retira accesos y no modifica propiedades. Publicar la versión nueva del paso 4 sigue siendo necesario.

## Comportamiento del listado

- La vista inicial muestra **Activos y pendientes**.
- **Finalizados** muestra los accesos retirados, cancelados, vencidos o cerrados que todavía no has quitado.
- **Eliminar del listado** quita un acceso finalizado del listado compartido. No reaparece al refrescar, reinstalar ni entrar desde otro dispositivo principal. El servidor mantiene el bloqueo de su código o token.
- Los accesos activos, los QR pendientes y el acceso principal quedan protegidos. Primero cancela un QR o retira un acceso compartido para poder quitarlo del listado.
- Se mantienen los nombres, las referencias y las opciones para crear códigos y QR del equipo.

Cada código activa un celular y vence en 24 horas. La lista no detecta reenvíos de una imagen del QR ni verifica la identidad real de quien lo use. Para devolver un acceso retirado, crea un código nuevo.

El servidor bloquea las solicitudes de un acceso retirado. Los celulares actualizados comprueban su acceso al reconectarse, al volver al primer plano y cada minuto mientras estén abiertos y conectados. Sin internet pueden seguir usando su copia local hasta comprobar el retiro. Las mediciones descargadas y pendientes no se borran.
