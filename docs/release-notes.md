Riego 0.1.3: respuesta de la conexión con Google en Android.

- La APK procesa explícitamente las redirecciones de Apps Script y lee su resultado sin reenviar la clave de activación o el token a la URL de contenido.
- La solicitud conserva el formato JSON y su método al pasar dentro de la misma implementación.
- Los mensajes distinguen páginas de Google, respuestas vacías, formatos inesperados y publicación que exige iniciar sesión.
- Se rechazan redirecciones ajenas al servicio de Riego y sesiones de activación incompletas.

- Humedades, Compactación y Presiones, sin roles de evaluador o supervisor.
- Acceso a dispositivos por código de un solo uso o QR, con vencimiento de 24 horas.
- Formularios y datos locales para trabajar sin internet después de activar el celular.
- Gráficas por fecha y lote, con filtros de lugar, fundo, profundidad y lado.
- GeoJSON original de Fenología: 254 lotes de Olmos y Motupe.
- Conexión de Apps Script publicada y encabezados de las tres hojas verificados. La activación y sincronización desde el celular quedan pendientes de comprobar con esta actualización.

Instala `Riego-0.1.3.apk` sobre la app existente, sin desinstalarla. Usa la misma firma que 0.1.1 y 0.1.2. Conserva el enlace de conexión y la clave inicial entregados al configurar Google; la clave se usa una vez y vence en 24 horas. Es un APK de prueba firmado con un certificado de desarrollo estable. La base de mapa necesita internet; los polígonos y las mediciones se conservan en el celular.

Validación: 17 pruebas automáticas de datos, acceso y transporte HTTP, más compilación web y Android. Esta actualización corrige el manejo de la respuesta; su activación real en el celular requiere una prueba del propietario.
