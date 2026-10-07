# Riego 0.1.4

La conexión de RIEGO Y FERTILIZACION viene preparada en el APK. El acceso principal requiere tu nombre y la clave inicial; ya no necesitas pegar un enlace ni configurar Apps Script en la pantalla de entrada. La clave y los tokens no se incluyen en el APK ni en el repositorio.

Antes de enviar la clave, la app comprueba la bienvenida de Riego mediante GET sin credenciales. Si falla esa comprobación, no envía la clave ni guarda un acceso. El principal usa la conexión preparada aunque quede guardado otro enlace de un intento anterior. Los códigos y QR del equipo conservan su conexión.

La versión aparece desde la pantalla inicial. Un rechazo sin explicación muestra versión, operación e identificador RIEGO_REPLY_REJECTED; los fallos de comprobación muestran RIEGO_CONNECTION. Se mantiene el manejo explícito de las redirecciones de Google.

Instala Riego-0.1.4.apk sobre la versión actual, sin desinstalar ni borrar datos. Usa la clave inicial entregada, mientras siga vigente y sin consumir. Tras entrar, Mis accesos permite generar códigos y QR.

Se ejecutan 22 pruebas de acceso, transporte, sincronización y mapa, además de la compilación web y Android. Las pruebas de HTTP y Apps Script son simuladas. La activación en un teléfono físico está pendiente de confirmar. La APK conserva el certificado de desarrollo de las versiones anteriores; no es una distribución de Google Play.
