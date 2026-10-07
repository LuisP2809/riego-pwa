# Riego 0.1.12

Nuevo apartado **Calidad de agua**. Selecciona Fecha, Sede y Filtrado para ingresar **pH, CE, Na y Ca** al costado de cada parámetro.

| Sede | Filtrados |
| --- | --- |
| OLMOS | FILTRADO PESQUERA, FILTRADO CHOLOCAL |
| MOTUPE | FRANCO, CHOLOQUE, PALACIOS, CHOC CHOC, ANDINA |

Cada evaluación se guarda en el dispositivo como un registro de cuatro lecturas. Al sincronizar se envía una fila a **CALIDAD AGUA**, conservando sus columnas originales: AÑO, MES, SEMANA, FECHA, LUGAR, FILTRADO, PH, C.E, Na y Ca. El historial muestra fecha, sede, filtrado, valores y estado de sincronización. Cambiar sede limpia el filtrado; cambiar fecha, sede o filtrado vacía las lecturas.

**La conexión de Drive necesita la actualización de Apps Script incluida en esta versión.** Reemplaza el código del proyecto existente por **apps-script/Riego.gs** y publica una nueva versión de la misma implementación, conservando el enlace actual. No ejecutes configurarRiego ni generes otra clave inicial. Mientras siga publicada la conexión anterior, la APK conserva el agua pendiente en el celular y permite sincronizar los otros apartados. Las APK anteriores siguen recibiendo solo sus tres apartados.

Instala **Riego-0.1.12.apk** sobre la versión actual para conservar el acceso y los registros.

Comprobaciones: 55 pruebas, compilación web y preparación Android. Se verifican filtrados, campos obligatorios, cero, decimales, filas sin duplicados, rechazos sin escrituras parciales, historial y compatibilidad. Las pruebas HTTP y de Apps Script son simuladas; la hoja nueva y sus encabezados se comprobaron en Google. La compilación valida firma, ID, versión Android y ajuste del teclado antes de publicar. La captura y sincronización en un celular físico requieren la prueba del propietario.
