# Riego 0.1.5

En Humedades, selecciona fecha, sede, fundo, módulo y lote. Debajo aparecen las profundidades con una casilla de humedad al costado: **20, 40 y 60 cm para Olmos**; **20, 40, 60 y 80 cm para Motupe**.

**Guardar humedades** guarda las tres o cuatro lecturas juntas en el dispositivo, con la misma fecha y ubicación. Cada humedad admite valores de 0 a 100%, incluido cero. Completa todas las profundidades antes de guardar. Al cambiar fecha o ubicación, las casillas se vacían para iniciar otra evaluación. La profundidad se muestra en centímetros también en los registros y las gráficas.

Al sincronizar, cada profundidad ocupa una fila en HUMEDADES y conserva las diez columnas originales del archivo. Los identificadores existentes evitan duplicar filas al reintentar. No se requiere volver a implementar Apps Script para esta actualización.

Instala Riego-0.1.5.apk sobre la versión actual, sin desinstalar ni borrar datos, para conservar el acceso y los registros. El propietario confirmó que ya pudo entrar con la versión anterior el 7 de octubre de 2026.

Se ejecutan 25 pruebas de captura, acceso, transporte, sincronización y mapa, además de la compilación web y Android. La sincronización de perfiles completos y los reintentos se prueban con Apps Script simulado; el registro y envío de un perfil desde el teléfono requieren la comprobación del propietario. La APK conserva el certificado de desarrollo de las versiones anteriores.
