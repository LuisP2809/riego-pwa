# Riego 0.1.6

Después de guardar una evaluación, los campos de Fundo, Módulo y Lote muestran listas completas para elegir otra ubicación. Las sugerencias anteriores se filtraban por el texto ya escrito y podían mostrar únicamente la selección actual.

Puedes cambiar directamente a otro lote del mismo módulo. También puedes escoger otro módulo sin borrar primero el lote: al cambiar el módulo, el lote anterior se vacía y aparecen los lotes del nuevo módulo. La opción **Selecciona un lote** permite quitarlo; el módulo sigue disponible. Cambiar de fundo limpia módulo y lote, y cambiar de sede limpia los tres campos.

Las listas usan el mapa original y las ubicaciones de las mediciones disponibles, incluyendo las guardadas en el dispositivo. La fecha se conserva al cambiar ubicación. Los registros guardados conservan sus datos originales. Humedades mantiene 20, 40 y 60 cm en Olmos y añade 80 cm en Motupe.

Instala Riego-0.1.6.apk sobre la versión actual, sin desinstalar ni borrar datos, para conservar el acceso y los registros. No se requiere volver a implementar Apps Script.

Se ejecutan 28 pruebas, incluida la selección de los 13 lotes de M08 y los módulos M07, M08 y M10 de CHOLOCAL con una evaluación previa, además de la compilación web y Android. Las pruebas de sincronización usan Apps Script simulado. El propietario confirmó pruebas de captura en su teléfono con la versión anterior; esta corrección de los selectores aún requiere su comprobación en el teléfono. La APK conserva la firma de desarrollo de las versiones anteriores.
