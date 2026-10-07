# Riego 0.1.8

Compactación muestra seis bloques fijos, de **Punto 1 (P1)** a **Punto 6 (P6)**. Cada bloque tiene sus casillas **M1, M2 y M3**, con la unidad configurada. Los puntos aparecen al completar fecha, lugar, fundo, módulo y lote.

**Guardar compactación** valida las 18 lecturas y guarda los seis puntos juntos en una transacción local. Cada punto se envía como una fila en las columnas originales de COMPACTACION: PUNTOS contiene P1–P6, y M1, M2 y M3 conservan las lecturas de ese punto. Se admiten cero y decimales; los valores incompletos, negativos o no numéricos se rechazan antes de guardar.

Después de guardar se vacían las lecturas y se conserva la fecha y ubicación para elegir el siguiente lote. Cambiar fecha, sede, fundo, módulo o lote también limpia las casillas. Humedades conserva las profundidades de Olmos y Motupe, y los selectores y el ajuste del teclado de la versión anterior permanecen.

Instala **Riego-0.1.8.apk** sobre la versión actual, sin desinstalar ni borrar datos, para conservar el acceso y los registros. No se requiere volver a implementar Apps Script.

Se ejecutan 33 pruebas de captura, selectores, acceso, transporte, sincronización y mapa, además de la compilación web y Android. Las nuevas pruebas verifican P1–P6, las 18 casillas, la validación completa, las columnas originales y los reintentos sin duplicar. Las pruebas de Apps Script y HTTP son simuladas; la revisión visual, teclado y sincronización desde el celular requieren la comprobación del propietario. La APK conserva la firma de desarrollo de las versiones anteriores.
