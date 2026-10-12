# Cuota Clara — Cloudflare + Firebase, edición personal

Copia independiente de Universitario Vóley Club. Incluye personas, pagos mensuales, historial individual, desactivación/reactivación, recordatorio manual por WhatsApp, acceso con correo/contraseña y respaldo JSON completo. Conserva el diseño y el logo del club.

**Estado:** código implementado y compilado, con pruebas de autorización. Falta autenticar las cuentas, crear/configurar Firebase y D1, migrar datos y probar el acceso real antes de publicar. No hay cuentas ni contraseñas predefinidas. No se puede ingresar mientras la configuración esté vacía.

## Presupuesto $0

Usar **Cloudflare Workers Free + D1 Free** y **Firebase Spark**. No activar Blaze, App Hosting, Functions, SMS, dominio de pago, R2 ni planes pagados. El acceso se publica en el subdominio incluido `workers.dev`. Los planes gratuitos tienen cuotas; no constituyen disponibilidad ilimitada. Revisar el consumo en los paneles. Ningún script activa facturación.

Los envíos automáticos de WhatsApp permanecen desactivados (`AUTO_SEND_ENABLED=false`). No se incluyen cron triggers. El botón manual abre WhatsApp para que tú confirmes el envío. No ejecutar el programador anterior contra esta versión.

## Requisitos

Node.js 24 LTS, npm, una cuenta Google y una cuenta Cloudflare. Las cuentas y el proyecto deben estar a tu nombre. No compartir contraseñas ni tokens administrativos por chat.

```sh
npm install
npm test
npm run check
```

## 1. Firebase Authentication (Spark)

La integración instalada no equivale a una sesión de Google autorizada. En un equipo sin navegador local, usar `--no-localhost`:

```sh
npx -y firebase-tools@latest login --no-localhost
npx -y firebase-tools@latest projects:list
```

Crear un proyecto personal llamado Cuota Clara en Spark si todavía no existe (elegir un ID globalmente único). Seleccionar el proyecto explícitamente en cada comando, sin tocar proyectos ajenos.

```sh
npx -y firebase-tools@latest projects:create TU_ID_FIREBASE --display-name "Cuota Clara"
npx -y firebase-tools@latest apps:create WEB "Cuota Clara personal" --project TU_ID_FIREBASE
npx -y firebase-tools@latest apps:list --project TU_ID_FIREBASE
npx -y firebase-tools@latest apps:sdkconfig WEB TU_APP_ID --project TU_ID_FIREBASE
npx -y firebase-tools@latest deploy --only auth --project TU_ID_FIREBASE
```

En Authentication → Usuarios, crear TU cuenta con correo/contraseña. Copiar su UID. No añadir registro público: solo el UID configurado como `ADMIN_UID` puede acceder, aunque existan otras cuentas Firebase. La API web pública identifica el proyecto; no es una contraseña. La recuperación usa el correo y la página de restablecimiento alojada por Firebase. Revisar las plantillas de correo y probar la recuperación con la cuenta real.

## 2. Cloudflare Workers Free y D1

```sh
npx wrangler login
npm run db:create
```

Copiar el `database_id` exacto que devuelve Cloudflare. Configurar los identificadores públicos con:

```sh
node scripts/configure.mjs
npm run db:migrate
```

El configurador guarda el ID del proyecto Firebase, la API key web, el UID administrador y el ID de D1 en `wrangler.jsonc`. No pide contraseña ni token Cloudflare. No usar el ID ficticio de ejemplo para desplegar.

## 3. Migración de datos

El código no contiene contactos reales ni copia contraseñas. La base original de Sites no se comparte automáticamente con la nueva cuenta Cloudflare. Antes de cambiar de URL, exportar todas las filas de `contacts`, `payments`, `sends` y `settings` del sitio anterior a un archivo privado con esta estructura:

```json
{"format":"cuota-clara-backup","version":1,"exportedAt":"FECHA_ISO","data":{"contacts":[],"payments":[],"sends":[],"settings":[]}}
```

No usar el CSV del mes como respaldo completo: no contiene todo el historial. Si todavía no se exportó la base anterior, no sustituir la app original.

```sh
node scripts/backup-to-sql.mjs backups/respaldo.json backups/importacion.sql
npx wrangler d1 execute DB --remote --file backups/importacion.sql
```

Importar únicamente en la base nueva y vacía después de las migraciones. El importador usa INSERT (no REPLACE ni DELETE), detiene conflictos y deja `settings.enabled=0`. Si una importación falla, revisar el estado antes de repetir: no se promete atomicidad entre todos los lotes remotos. Comparar los recuentos y el historial antes del cambio de URL.

## 4. Publicación

```sh
npm run deploy
```

El script bloquea la publicación si faltan identificadores reales, el UID o la base. Ejecuta TypeScript, compila y publica el Worker generado con su binding D1. La URL final la devuelve Cloudflare. No se publica en Sites ni modifica el sitio anterior.

Comprobar en la URL HTTPS publicada:

- Sin sesión: ningún contacto, pago o respaldo accesible.
- Tu cuenta entra; otra cuenta Firebase no entra.
- Registro y consulta de un pago de prueba autorizado; historial individual correcto.
- Cerrar sesión vuelve al login.
- Recuperación de contraseña funciona.
- Datos importados coinciden con la base anterior.

## Mantenimiento y respaldos

En Configuración → **Descargar respaldo completo** se descargan contactos, pagos, envíos y preferencias, sin cookies ni credenciales. Conservar una copia semanal y otra antes de cambios. Para un respaldo SQL desde la terminal autenticada:

```sh
npm run db:backup
```

La carpeta `backups/` está excluida de Git. Guardar el ZIP de código y un repositorio privado con cambios revisados. Revisar mensualmente el consumo gratuito y los errores. Antes de actualizar dependencias, ejecutar pruebas y compilación; no reemplazar versiones automáticamente en producción.

## Seguridad y límites

- Firebase valida correo y contraseña. La contraseña solo se utiliza durante el intercambio de login; no se guarda ni se registra.
- El servidor comprueba la firma RS256 con certificados de Google, proyecto, emisor, caducidad y UID autorizado. No confía en encabezados de ChatGPT ni identificadores enviados por el cliente.
- Cookies `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict`; renovación de sesión mientras la app está abierta. No se entregan tokens al JavaScript de la página.
- Logout borra las cookies de este navegador. Tokens Firebase ya emitidos pueden ser válidos hasta una hora; para un bloqueo inmediato del acceso cambiar `ADMIN_UID` y volver a publicar, además de deshabilitar la cuenta en Firebase.
- Mutaciones requieren Origin del mismo sitio; login/recuperación tienen límites por IP en D1. No se guardan IPs en claro.
- Las rutas de datos, historial, respaldo y ejecución de avisos requieren autorización en servidor. `/api/run` no es público.
- La base y las credenciales faltantes bloquean el acceso; no hay modo demo que permita saltarse el login.
- Pruebas locales de cookies requieren HTTPS. No se incluyen sesiones Firebase falsas ni bypass de producción.

Documentación: https://firebase.google.com/docs/auth/admin/verify-id-tokens · https://firebase.google.com/docs/reference/rest/auth · https://developers.cloudflare.com/workers/ · https://developers.cloudflare.com/d1/
