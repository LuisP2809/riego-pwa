# Verificación de Riego 0.1.15

## Diseño

- Logo vectorial propio de Riego: gota de agua, hoja y surcos de campo. Se usa el mismo símbolo en el encabezado, la entrada y los íconos Android/PWA.
- Verde bosque, fondos claros, controles de al menos 46 px y campos de 16 px. Se conservan los selectores nativos y el ajuste del teclado de Android.
- Los registros recientes se presentan como tarjetas a anchos de hasta 620 px, con etiquetas de fecha, sede, ubicación, medición y estado. En pantallas mayores se conserva la tabla.
- Las reglas para pantallas de 320, 360, 420, 620 y 900 px usan columnas con mínimos de cero, texto que puede ajustarse y paneles sin ancho fijo. La fecha ocupa una fila completa en celulares pequeños.
- Contrastes calculados: texto principal/fondo 11.58:1, texto secundario/blanco 4.72:1, texto blanco/botón verde 7.01:1.
- Íconos PNG RGBA verificados en 192 y 512 px. El primer plano adaptable es transparente y mantiene la figura dentro de la zona central; el fondo del ícono y la apertura nativa usan el verde de Riego.

## Funciones

- 74 pruebas automatizadas aprobadas en local, sin errores. Se mantuvieron las pruebas de captura, sincronización, gráficas, colores, mapa y gestión de accesos.
- Compilación TypeScript/Vite y sincronización de Capacitor Android completadas correctamente. La versión nativa preparada es 0.1.15, código 1015, con adjustResize.
- El código de Apps Script se conserva exactamente: SHA-256 `6e97d783de37cfb7d7cef8b30873245f0770854e710db9b122448ad3edb1c84e`. La implementación de Google continúa en la versión 4, publicada el 9 de octubre de 2026 a las 16:54 (Perú).
- El GeoJSON conserva sus 254 polígonos. No se cambiaron claves, tokens, almacenamiento local, parámetros ni límites de las gráficas y mapas.

## APK publicada

- Código publicado: commit `c2aff97cb4079ed3f71f5c5cec057eac7deaf9f4`.
- [GitHub Actions 37998100688](https://github.com/LuisP2809/riego-pwa/actions/runs/37998100688): tareas APK y release completadas correctamente; 74 pruebas aprobadas, sin errores.
- El proceso Android compiló correctamente los nuevos recursos y la apertura nativa. La comprobación local verificó que los íconos y archivos web se copiaran al proyecto Android.
- `apksigner` confirmó la firma v2 y el certificado SHA-256 `d3ddb0a20e478eb21fd628e65e0c0fb99b45cc7ff4fc9b469b8a42bdcafe6c4e`, igual al de las versiones anteriores. La comprobación de la APK confirmó `pe.riego.campo`, versión `0.1.15`, código `1015`, Android mínimo 8, SDK objetivo 36 y `adjustResize`.
- [Riego-0.1.15.apk](https://github.com/LuisP2809/riego-pwa/releases/download/v0.1.15/Riego-0.1.15.apk): activo publicado, 36 179 741 bytes. SHA-256 del activo de GitHub: `fbdfe9211e43a2cd69114990e51df164ebd783c2b4adcfc9cb005bb99b822cc5`.
- [Release v0.1.15](https://github.com/LuisP2809/riego-pwa/releases/tag/v0.1.15) contiene también su archivo de comprobación SHA-256.

Las pruebas del servidor y HTTP son simuladas. Esta verificación de diseño comprueba código, recursos, contraste y compilación; no equivale a una prueba visual en un celular físico. La firma y publicación se verificaron en GitHub Actions y Releases, sin ejecutar ni crear accesos reales en Google.
