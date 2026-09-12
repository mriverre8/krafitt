_Última actualización: 12 de septiembre de 2026_

Krafitt usa tres cookies. Todas son de origen propio, todas son estrictamente
necesarias para algo que le has pedido a la aplicación, y ninguna te rastrea.
No hay analítica, ni publicidad, ni cookies de terceros en este sitio — que es
también la razón de que no haya banner de consentimiento: según la normativa de
ePrivacy, las cookies estrictamente necesarias no lo requieren.

## Las cookies

### `better-auth.session_token`

**Para qué:** mantener tu sesión iniciada. Sin ella, cada carga de página te
volvería a pedir la contraseña.

**Qué contiene:** un token de sesión aleatorio. Ni tu correo ni tu contraseña.

**Duración:** caduca con la sesión y se elimina al cerrarla.

**Marcas:** `HttpOnly` (el JavaScript de la página no puede leerla), `Secure` en
producción, `SameSite=Lax`.

### `krafitt.theme`

**Para qué:** recordar si has elegido el tema oscuro o el claro, para que el
servidor pueda renderizar el correcto de inmediato en lugar de enseñarte el otro
durante un parpadeo.

**Qué contiene:** el texto literal `dark` o `light`.

**Duración:** un año.

**Marcas:** `SameSite=Lax`. Legible por la página, porque el selector de tema la
escribe.

### `krafitt.locale`

**Para qué:** recordar si has elegido inglés, castellano o catalán. Sin ella, la
aplicación recurre a la cabecera `Accept-Language` de tu navegador.

**Qué contiene:** el texto literal `en`, `es` o `ca`.

**Duración:** un año.

**Marcas:** `SameSite=Lax`. Legible por la página, porque el selector de idioma
la escribe.

## Qué no usa Krafitt

Ni Google Analytics ni ninguna otra cookie de analítica. Ninguna cookie de
publicidad o de retargeting. Ningún píxel de redes sociales. Ningún
identificador entre sitios. Nada de fingerprinting. Ninguna cookie se comparte
con nadie, porque ningún tercero tiene código en este sitio.

## Cómo desactivarlas

Puedes bloquear o borrar cookies desde la configuración de tu navegador en
cualquier momento. Bloquear `krafitt.theme` y `krafitt.locale` solo te cuesta la
preferencia: la aplicación vuelve al tema oscuro y al idioma de tu navegador.
Bloquear `better-auth.session_token` hace imposible iniciar sesión, porque no
queda nada con lo que recordarte.

## Más

Lo que la aplicación guarda en su base de datos, y no en tu navegador, lo cubre
la [política de privacidad](/legal/privacy). Las dudas van a
[krafitt@gmail.com](mailto:krafitt@gmail.com).
