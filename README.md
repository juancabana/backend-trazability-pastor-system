# Backend — Sistema de Trazabilidad Pastoral

API REST en NestJS (puerto `3000`, prefijo global `/api`).

## Comandos

```bash
npm install
npm run start:dev      # Dev con watch
npm run build          # Compilar TypeScript
npm run start:prod     # Ejecutar build
npm run lint           # ESLint --fix
npm run test           # Jest
npm run seed           # Sembrar base de datos
```

## Variables de entorno (`.env`)

```env
# Base de datos (obligatorio)
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

# Auth (obligatorio)
JWT_SECRET=

# Envío de correos (opcional — ver sección abajo)
EMAIL_ENABLED=false
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
```

---

## Funcionalidad: Envío de correos (consolidados)

El módulo de envío de reportes consolidados por correo es **opcional** y está
controlado por un *feature flag*. Por defecto está **deshabilitado** porque
todavía no se ha integrado el proveedor SMTP definitivo (BillionMail).

### Estado actual: deshabilitado

Cuando `EMAIL_ENABLED` no está definido o vale `false`:

- **No se exigen** las variables `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`,
  `MAIL_FROM`. El build y el arranque funcionan sin ellas.
- El `MailerModule` se inicializa con un transporte ficticio
  (`jsonTransport`) — no se hace ninguna conexión SMTP.
- `EmailService` registra una advertencia al iniciar:
  `EmailService deshabilitado (EMAIL_ENABLED=false). El envio de correos esta apagado.`
- El endpoint `POST /api/consolidated/send-report` responde
  `503 Service Unavailable` con el mensaje:
  `El envio de correos esta deshabilitado. Configurar EMAIL_ENABLED=true y las variables MAIL_* para activarlo.`
- El endpoint público `GET /api/config/public` expone
  `features.emailEnabled: false`, lo que hace que el frontend oculte la sección
  *Enviar Reporte* automáticamente.

### Cómo habilitarlo

1. Provisionar el proveedor SMTP (BillionMail u otro) y obtener:
   `host`, `port`, `user`, `password` y un remitente (`from`).
2. Añadir al `.env`:
   ```env
   EMAIL_ENABLED=true
   MAIL_HOST=smtp.tu-proveedor.com
   MAIL_PORT=587
   MAIL_USER=usuario
   MAIL_PASS=password
   MAIL_FROM="Trazabilidad Pastoral <noreply@tu-dominio.com>"
   ```
3. Reiniciar la aplicación (`npm run start:dev` o redeploy en Vercel).
4. Verificar:
   - `GET /api/config/public` debe devolver `features.emailEnabled: true`.
   - En los logs **no** debe aparecer la advertencia
     `EmailService deshabilitado`.
   - En el frontend, el item *Enviar Reporte* aparece en el sidebar de admin.

### Cómo deshabilitarlo de nuevo

Establecer `EMAIL_ENABLED=false` (o eliminar la variable) y reiniciar.
Las variables `MAIL_*` pueden quedarse o eliminarse — son ignoradas mientras el
flag esté apagado.

### Archivos involucrados

- [src/config/feature-flags.ts](src/config/feature-flags.ts) — helper `isEmailEnabled(config)`.
- [src/config/constants.ts](src/config/constants.ts) — `EMAIL_ENABLED_DEFAULT`.
- [src/email/email.module.ts](src/email/email.module.ts) — factory condicional del `MailerModule`.
- [src/email/email.service.ts](src/email/email.service.ts) — guard al enviar.
- [src/consolidated/application/use-cases/send-consolidated-report.use-case.ts](src/consolidated/application/use-cases/send-consolidated-report.use-case.ts) — caso de uso.
- [src/app.controller.ts](src/app.controller.ts) — expone el flag en `/api/config/public`.

---

## Arquitectura

Clean Architecture por módulo de dominio
(`auth`, `association`, `district`, `church`, `union`, `activity-category`,
`daily-report`, `consolidated`, `email`):

```
src/{module}/
  domain/          # Entidades (TypeORM), interfaces
  application/     # Casos de uso (uno por clase)
  infrastructure/  # Repositorios, estrategias (JWT)
  presentation/    # Controllers, DTOs
```

Más detalle en [../docs/BACKEND.md](../docs/BACKEND.md) y
[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
