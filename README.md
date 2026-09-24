# Autogestión

Herramienta personal para centralizar el trabajo en varios frentes o proyectos: credenciales, contactos, calendarios, tareas y notas en un solo lugar.

## Stack

- Next.js (App Router) con TypeScript estricto
- PostgreSQL 17 y Prisma 7
- Tailwind CSS
- Docker y Docker Compose
- Vitest (unitarias) y Playwright (extremo a extremo)

## Requisitos

- Node.js 22 o superior
- Docker con Docker Compose

## Configuración inicial

```bash
cp .env.example .env
# Edita .env y cambia POSTGRES_PASSWORD (y la misma clave dentro de DATABASE_URL)
npm install
npm run auth:configurar
npm run cifrado:configurar
```

`npm run auth:configurar` es interactivo: pide el usuario y la contraseña (mínimo 12 caracteres, sin mostrarla en pantalla), guarda solo su hash en `.env` y genera el secreto de sesión. Repítelo para cambiar la contraseña.

## Cifrado de credenciales

- Los secretos se guardan cifrados con AES-256-GCM (IV aleatorio por secreto) en el formato versionado `v1:iv:etiqueta:cifrado`. La clave es `CLAVE_CIFRADO` (32 bytes en base64) y vive solo en `.env`, nunca en la base de datos ni en git.
- `npm run cifrado:configurar` genera la clave y **nunca sobrescribe una existente**.
- **IMPORTANTE: si pierdes `CLAVE_CIFRADO`, todos los secretos guardados son IRRECUPERABLES.** Respáldala fuera del repositorio y del disco de datos (por ejemplo en un gestor de contraseñas). El respaldo de la base de datos (HU-15) debe acompañarse de una copia de esta clave.
- El secreto solo sale del servidor cuando el usuario lo revela o lo copia; nunca aparece en listados, fichas, errores ni historial.

## Acceso y seguridad

- Toda la aplicación exige sesión; solo `/login`, `/api/auth/*` y `/api/health` son públicas. Sin sesión, las páginas redirigen a `/login` y la API responde 401.
- La contraseña se guarda como hash `scrypt`; nunca en texto plano. La sesión dura 12 horas y viaja en una cookie `httpOnly` (`secure` cuando la aplicación se sirve por HTTPS).
- Los intentos de acceso se limitan a 5 por IP cada 15 minutos (y 100 en total), con el conteo guardado en PostgreSQL.
- Si se pierde `NEXTAUTH_SECRET` solo se cierran las sesiones abiertas; basta con generar otro.
- Detrás de un proxy, la IP se toma de `x-forwarded-for`: la plataforma de despliegue debe fijar esa cabecera.

## Ejecutar con Docker

Levanta la aplicación y la base de datos, y aplica las migraciones pendientes:

```bash
docker compose up --build -d
```

- Aplicación: http://localhost:3000
- Estado del sistema: http://localhost:3000/api/health
- Los datos de PostgreSQL se guardan en `./datos/postgres` (carpeta local, fuera del contenedor) y sobreviven a reconstruir las imágenes.
- Los puertos se publican solo en `127.0.0.1`. Se cambian con `APP_PUERTO` y `DB_PUERTO` en `.env`.

Para detener todo: `docker compose down` (los datos se conservan).

## Desarrollo local

Con la base de datos de Docker en marcha (`docker compose up -d db`):

```bash
npm run dev
```

## Diseño

Los tokens de diseño (color, tipografía, radios, sombras y foco) viven en `src/app/globals.css`, en el tema de DaisyUI `autogestion-dark-lime` y el bloque `@theme` de Tailwind. Los componentes usan solo clases semánticas (`bg-base-200`, `text-primary`), sin colores sueltos. Los componentes base están en `src/componentes`.

## Comandos

| Comando                      | Descripción                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `npm run dev`                | Servidor de desarrollo                                          |
| `npm run build`              | Compilación de producción                                       |
| `npm start`                  | Servidor de producción                                          |
| `npm run lint`               | Análisis estático con ESLint                                    |
| `npm run typecheck`          | Verificación de tipos                                           |
| `npm run format`             | Da formato con Prettier                                         |
| `npm run format:check`       | Comprueba el formato sin modificar archivos                     |
| `npm test`                   | Pruebas unitarias                                               |
| `npm run test:coverage`      | Pruebas unitarias con cobertura                                 |
| `npm run test:e2e`           | Pruebas de extremo a extremo (requiere la base de datos)        |
| `npm run auth:configurar`    | Define usuario y contraseña de acceso en `.env`                 |
| `npm run cifrado:configurar` | Genera `CLAVE_CIFRADO` en `.env` sin sobrescribir una existente |
| `npm run db:migrate`         | Crea y aplica una migración en desarrollo                       |
| `npm run db:deploy`          | Aplica las migraciones pendientes                               |
| `npm run db:studio`          | Abre Prisma Studio                                              |
| `npm run verify`             | Lint, tipos, pruebas y compilación                              |

Para ejecutar una sola prueba unitaria: `npx vitest run src/lib/env.test.ts`.

## Base de datos

El esquema está en `prisma/schema.prisma`. Tras modificarlo se genera la migración con `npm run db:migrate` y se regenera el cliente con `npm run db:generate` (Prisma 7 no lo hace solo). El cliente queda en `src/generated/prisma` y no se versiona; `npm install` lo regenera.
