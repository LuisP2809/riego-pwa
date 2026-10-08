# Verificación de Riego 0.1.13

Código publicado: `3fab09f1be2b89c09fd7da2183f9ab169495275c`.

- [Compilación de GitHub Actions](https://github.com/LuisP2809/riego-pwa/actions/runs/37824676769): APK y publicación completadas correctamente.
- 68 pruebas aprobadas en local y en CI, sin errores. Las pruebas de HTTP y Apps Script usan simulaciones; no crean códigos ni revocan dispositivos reales.
- Compilación web y preparación Android correctas. El paquete web local contiene las opciones de nombres, cancelación, retiro, referencias y comprobaciones en primer plano, además de los apartados y gráficas anteriores.
- CI verificó `pe.riego.campo`, versión `0.1.13`, código `1013`, SDK mínimo 26, objetivo 36 y `adjustResize`.
- La firma SHA-256 sigue siendo `d3ddb0a20e478eb21fd628e65e0c0fb99b45cc7ff4fc9b469b8a42bdcafe6c4e`.
- [Riego-0.1.13.apk](https://github.com/LuisP2809/riego-pwa/releases/download/v0.1.13/Riego-0.1.13.apk): 35 942 171 bytes. GitHub informa SHA-256 `b39f4a4989214a21018355bd337cf061fd4c19ff32335c5aa64520d2b5bdf478`.
- Artefacto de CI `Riego-APK-0.1.13`, ID `11569859267`, 23 510 640 bytes; digest ZIP `93a9c790f20202758b20063370dfbfdf351e23091153e3db39e2c042edbe6d76`.

La descarga del ZIP a este entorno respondió HTTP 403; no se afirma una inspección local de los bytes de la APK publicada. La firma y el manifiesto se verificaron en CI; la publicación y su digest se comprobaron en GitHub. No se probó en un celular físico.

El código Apps Script preparado tiene SHA-256 `15df816c1079900b89a7f29d77c268405f4d9ffecf21c6e544781adad1f687e2`. **Su actualización en Google sigue pendiente**: el inicio de sesión seguro fue interrumpido y no se obtuvo una sesión autenticada. No se modificaron el código ni la implementación de Google durante esta entrega, no se generaron invitaciones reales, no se retiraron accesos y no se rotó la clave inicial. Debe actualizarse la implementación existente antes de usar la administración de accesos. El README y las notas de la versión explican ese paso.
