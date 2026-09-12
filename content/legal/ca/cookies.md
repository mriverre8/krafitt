_Última actualització: 12 de setembre de 2026_

Krafitt fa servir tres galetes. Totes són d'origen propi, totes són estrictament
necessàries per a alguna cosa que has demanat a l'aplicació, i cap no et
rastreja. No hi ha analítica, ni publicitat, ni galetes de tercers en aquest
lloc — que és també la raó per la qual no hi ha bàner de consentiment: segons la
normativa d'ePrivacy, les galetes estrictament necessàries no en necessiten.

## Les galetes

### `better-auth.session_token`

**Per a què:** mantenir la teva sessió iniciada. Sense ella, cada càrrega de
pàgina et tornaria a demanar la contrasenya.

**Què conté:** un testimoni de sessió aleatori. Ni el teu correu ni la teva
contrasenya.

**Durada:** caduca amb la sessió i s'elimina en tancar-la.

**Marques:** `HttpOnly` (el JavaScript de la pàgina no la pot llegir), `Secure`
en producció, `SameSite=Lax`.

### `krafitt.theme`

**Per a què:** recordar si has triat el tema fosc o el clar, perquè el servidor
pugui renderitzar el correcte de seguida en lloc d'ensenyar-te l'altre durant un
parpelleig.

**Què conté:** el text literal `dark` o `light`.

**Durada:** un any.

**Marques:** `SameSite=Lax`. Llegible per la pàgina, perquè el selector de tema
l'escriu.

### `krafitt.locale`

**Per a què:** recordar si has triat anglès, castellà o català. Sense ella,
l'aplicació recorre a la capçalera `Accept-Language` del teu navegador.

**Què conté:** el text literal `en`, `es` o `ca`.

**Durada:** un any.

**Marques:** `SameSite=Lax`. Llegible per la pàgina, perquè el selector d'idioma
l'escriu.

## Què no fa servir Krafitt

Ni Google Analytics ni cap altra galeta d'analítica. Cap galeta de publicitat o
de retargeting. Cap píxel de xarxes socials. Cap identificador entre llocs. Gens
de fingerprinting. Cap galeta es comparteix amb ningú, perquè cap tercer no té
codi en aquest lloc.

## Com desactivar-les

Pots blocar o esborrar galetes des de la configuració del teu navegador en
qualsevol moment. Blocar `krafitt.theme` i `krafitt.locale` només et costa la
preferència: l'aplicació torna al tema fosc i a l'idioma del teu navegador.
Blocar `better-auth.session_token` fa impossible iniciar sessió, perquè no queda
res amb què recordar-te.

## Més

El que l'aplicació desa a la seva base de dades, i no al teu navegador, ho
cobreix la [política de privacitat](/legal/privacy). Els dubtes van a
[krafitt@gmail.com](mailto:krafitt@gmail.com).
