# Riego 0.1.9

Presiones muestra **todos los lotes del módulo seleccionado**, cada uno con sus filas **Este** y **Oeste** y la casilla de **Presión final** al costado. Basta seleccionar fecha, lugar, fundo y módulo. Cada título muestra el número del lote y su código completo; la unidad configurada aparece en el encabezado.

**OLMOS → CHALLAPAMPA → M11** muestra los 23 lotes del mapa original, comenzando por Lote 39 y Lote 40, con 46 casillas en total. Incluye el lote 42B y los lotes 101–104. El listado se filtra por sede, fundo y módulo.

**Guardar presiones** valida y guarda juntas las lecturas ingresadas en una transacción local. Puedes guardar por partes: las casillas vacías se omiten y el cero es una medición válida. Cada lectura se envía como una fila en las columnas originales de PRESIONES, con LADO igual a ESTE u OESTE. Los valores negativos o no numéricos se rechazan antes de guardar el conjunto.

Después de guardar se vacían las lecturas y se conserva la fecha y el módulo. Cambiar fecha, sede, fundo o módulo limpia las casillas. Humedades conserva sus profundidades por sede; Compactación conserva los seis puntos con M1, M2 y M3. Ambos mantienen el selector de lote individual.

Instala **Riego-0.1.9.apk** sobre la versión actual, sin desinstalar ni borrar datos, para conservar el acceso y los registros. No se requiere volver a implementar Apps Script.

Se ejecutan 38 pruebas de captura, selectores, acceso, transporte, sincronización y mapa, además de la compilación web y Android. Las nuevas pruebas verifican el módulo M11 completo, las 46 casillas, lecturas parciales, validación, columnas originales, registros previos y reintentos sin duplicar. Las pruebas de Apps Script y HTTP son simuladas; la revisión visual, teclado y sincronización desde el celular requieren la comprobación del propietario. La compilación verifica la firma de actualización, el ID y la versión Android de la APK y que se conserve adjustResize.
