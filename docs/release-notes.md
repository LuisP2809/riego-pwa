# Riego 0.1.10

**Gráficas** incorpora los análisis seleccionados, con filtros por sede, fundo, módulo, lote y periodo.

Humedades muestra **Evolución semanal por profundidad**, **Promedio por fundo** y **Matriz módulo–profundidad**. Las profundidades de Olmos son 20, 40 y 60 cm, y Motupe incluye 80 cm. La evolución usa semanas ISO y deja huecos si no hay lecturas; la matriz conserva los ceros y distingue las profundidades sin datos.

Compactación y Presiones muestran un **ranking por módulo o por lote acompañado del mapa de polígonos**, con fondo blanco como la referencia. Mapa y ranking comparten los filtros y el promedio; los polígonos sin datos aparecen grises. Puedes tocar un lote en el mapa para consultar el promedio y abrir la tabla de valores del ranking.

| Apartado | Rojo | Azul | Verde |
| --- | --- | --- | --- |
| Compactación | 0 a 40 inclusive | Mayor de 40 hasta 60 inclusive | Mayor de 60 |
| Presiones | Menor de 8 | Mayor de 12 | 8 a 12 inclusive |

El último bloque solicitado se interpreta como **Presiones**, con sus límites de 0–7, 8–12 y mayores de 12. Los decimales se clasifican sin huecos: 40.5 de compactación es azul y 7.5 de presión es rojo. Compactación promedia M1, M2 y M3 de los puntos registrados; puedes consultar cada lectura por separado. Presiones incluye Este y Oeste o el lado seleccionado. Los promedios del módulo incluyen todas las lecturas de sus lotes dentro del filtro.

En el celular, mapa y ranking se muestran uno debajo del otro. La matriz tiene desplazamiento propio cuando sea necesario. Las capturas de humedades por profundidad, compactación de seis puntos y presiones por lote y lado permanecen disponibles.

Instala **Riego-0.1.10.apk** sobre la versión actual para conservar acceso y registros. No se requiere volver a implementar Apps Script.

Se ejecutan **47 pruebas** de cálculos, filtros, colores, vistas, captura, acceso, transporte, sincronización y mapa, junto con la compilación web y Android. La compilación comprueba la firma de actualización, el ID, versión Android y adjustResize de la APK. Las pruebas de Apps Script y HTTP son simuladas; la revisión visual de las gráficas y la sincronización en un celular físico requieren la prueba del propietario.
