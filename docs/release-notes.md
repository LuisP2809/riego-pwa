# Riego 0.1.7

Sede y los filtros usan el selector del dispositivo, igual que Fundo, Módulo y Lote. Se elimina el menú de Sede que bloqueaba el desplazamiento de la página y aplicaba un margen lateral al abrirse.

El documento y el formulario declaran su ancho completo, las columnas de celular permiten reducirse dentro de la pantalla y las pestañas pueden partir textos largos. Los campos mantienen una fuente de al menos 16 px y el tamaño de texto permanece estable al enfocar una humedad. El desplazamiento de la página es vertical.

La APK declara **adjustResize** para que Android ajuste el espacio disponible al mostrar el teclado. La PWA solicita **interactive-widget=resizes-content** para los navegadores compatibles. No se desactiva el zoom del navegador ni se modifican las mediciones guardadas.

Instala Riego-0.1.7.apk sobre la versión actual, sin desinstalar ni borrar datos, para conservar el acceso y los registros. No se requiere volver a implementar Apps Script. Humedades conserva 20, 40 y 60 cm en Olmos y añade 80 cm en Motupe.

Se ejecutan 29 pruebas de selectores, captura, acceso, transporte, sincronización y mapa, además de la compilación web y Android. Se verifica que el selector de Sede muestre ambas sedes sin el menú anterior. Las pruebas de Apps Script son simuladas. La vista local no pudo abrirse en el navegador de revisión; el comportamiento visual del teclado en el celular requiere la comprobación del propietario. La APK conserva la firma de desarrollo de las versiones anteriores.
