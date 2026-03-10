# Despliegue en producción — O'Higgins y Las Huertas

Guía breve para poner la app en un servidor y usarla en la práctica.

**Para Vercel + Neon + GitHub:** sigue [VERCEL-NEON.md](./VERCEL-NEON.md) paso a paso.

## Requisitos

- **Node.js** 20+
- **Base de datos**: SQLite (desarrollo y servidores con disco persistente) o **PostgreSQL** (recomendado en Vercel/Railway/Render).

## Variables de entorno

Copia `.env.example` a `.env.local` (desarrollo) o configura las variables en el panel de tu proveedor (producción).

| Variable        | Obligatorio | Descripción |
|----------------|------------|-------------|
| `AUTH_SECRET`  | **Sí**     | Secreto para sesiones NextAuth (mín. 32 caracteres). Generar: `openssl rand -base64 33` |
| `ADMIN_CODE`   | No (recomendado) | Si está definido, los usuarios con rol ADMIN deben introducir este código además de la contraseña al iniciar sesión. Generar: `openssl rand -base64 24` |
| `DATABASE_URL` | **Sí**     | SQLite: `file:./prisma/dev.db` (ruta absoluta en producción). Postgres: `postgresql://user:pass@host:5432/dbname` |
| `NEXTAUTH_URL` | **Sí en prod** | URL pública de la app, p. ej. `https://ohiggins.tudominio.com`. En Vercel/Railway suele autocompletarse. |

En **producción**, si `AUTH_SECRET` no está definido o tiene menos de 32 caracteres, la app no arrancará (validación en el arranque).

## Build y arranque

```bash
# Instalar dependencias
npm ci

# Generar cliente Prisma
npx prisma generate

# Migraciones (crear/actualizar tablas)
npx prisma migrate deploy

# (Opcional) Poblar datos iniciales
npm run db:seed

# Build
npm run build

# Arrancar en producción
npm run start
```

El servidor escucha en el puerto definido por `PORT` (por defecto 3000).

## Base de datos

- **SQLite**: adecuado si el servidor tiene disco persistente y un solo proceso (p. ej. VPS, Railway con volumen). La ruta de `DATABASE_URL` debe ser absoluta en producción (p. ej. `file:/var/app/prisma/dev.db`).
- **PostgreSQL**: necesario en entornos serverless (Vercel) o cuando no hay disco persistente. Cambia `provider` en `prisma/schema.prisma` a `postgresql` y usa la URL de tu proveedor.

## Subida de imágenes

Las fotos de entradas se guardan en `public/uploads/entries/`. En despliegues con filesystem efímero (Vercel, etc.) estos archivos **no se conservan** entre despliegues. Opciones:

1. Usar un host con disco persistente (VPS, Railway con volumen).
2. Migrar a un almacenamiento externo (S3, Cloudflare R2, etc.) y guardar la URL en `imagePath`.

## Comprobación de salud

- **GET /api/health**: responde 200 si la app y la base de datos están bien. Útil para monitoreo o balanceadores de carga. No requiere autenticación.

## Seguridad ya aplicada

- Cabeceras de seguridad (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Rutas protegidas por sesión; solo usuarios con sesión acceden al panel.
- Límite de tamaño en imágenes de entradas (5 MB).
- `AUTH_SECRET` y `NEXTAUTH_URL` validados en producción al arrancar.

## Errores y 404

- Páginas de error genéricas (`error.tsx`) y 404 (`not-found.tsx`) muestran mensajes en español y enlaces para volver al inicio.
