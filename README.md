# Elapas API — Backend

API REST para el **Sistema de Gestión de Servicios Públicos de Agua** de ELAPAS Sucre. Proyecto académico — 7mo Semestre, Gestión de Proyectos de Software.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | NestJS 11 (TypeScript) |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL 15+ |
| Autenticación | Better Auth (email/password) |
| Documentación | Swagger / OpenAPI 3.0 |
| Runtime | Node.js 18+ LTS |
| Package manager | pnpm |

## Requisitos

- Node.js 18+
- pnpm 9+
- PostgreSQL 15+

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd elapas-api

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# Crear la base de datos en PostgreSQL
createdb elapas

# Aplicar el schema a la base de datos
pnpm db:push

# Iniciar el servidor en modo desarrollo
pnpm start:dev
```

El servidor inicia en `http://localhost:3000` (o el puerto definido en `PORT`).

## Documentación de la API

Swagger UI disponible en:

```
http://localhost:3000/docs
```

Spec OpenAPI en formato JSON:

```
http://localhost:3000/docs-json
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm install` | Instalar dependencias |
| `pnpm start:dev` | Servidor en modo desarrollo (watch) |
| `pnpm start:prod` | Servidor en producción |
| `pnpm build` | Compilar TypeScript a `dist/` |
| `pnpm lint` | ESLint con auto-fix |
| `pnpm format` | Prettier |
| `pnpm test` | Tests unitarios |
| `pnpm test:e2e` | Tests end-to-end |
| `pnpm test -- src/ruta/al/file.spec.ts` | Un solo test |
| `pnpm db:push` | Aplicar schema a la BD (dev) |
| `pnpm db:generate` | Generar migración SQL |
| `pnpm db:migrate` | Ejecutar migraciones |
| `pnpm db:studio` | Drizzle Studio (visor de datos) |

## Estructura del proyecto

```
src/
├── main.ts                  # Entry point, Swagger, global prefix
├── app.module.ts            # Módulo raíz
├── common/                  # Filtros, PDF, uploads (código compartido)
├── db/
│   ├── connection.ts        # Conexión Drizzle + DI provider
│   ├── db.module.ts         # DbModule global (inyecta la BD)
│   └── schema.ts            # Tablas, enums y relaciones
├── auth/
│   ├── auth.ts              # Configuración de Better Auth
│   ├── auth.controller.ts   # Endpoints de autenticación
│   ├── auth.module.ts
│   ├── auth.guard.ts        # Guard de sesión
│   ├── roles.guard.ts       # Guard de roles
│   ├── roles.decorator.ts   # Decorador @Roles()
│   └── dto/                 # DTOs de auth
├── usuarios/                # CRUD de usuarios (admin)
├── distritos/               # CRUD de distritos (admin)
├── predios/                 # CRUD de predios (admin)
├── medidores/               # CRUD de medidores (admin)
├── contratos/               # Gestión de contratos/catastro
├── tarifas/                 # Pliego tarifario
├── asignaciones/            # Asignación de contratos a brigadistas
├── lecturas/                # Registro de lecturas de medidores
├── facturas/                # Generación masiva de facturas
├── pagos/                   # Pagos y generación de QR
├── cortes/                  # Registro de cortes de servicio
└── reportes/                # Reportes y dashboard
```

## Autenticación y Roles

Better Auth gestiona la autenticación con email y contraseña. Todos los endpoints (excepto auth) requieren sesión activa.

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total: usuarios, contratos, facturación, reportes |
| `brigadista` | Lecturas, cortes, contratos (lectura) |
| `ciudadano` | Sus contratos, facturas, pagos |

## Módulos y Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/sign-up/email` | Registrarse | Pública |
| POST | `/api/auth/sign-in/email` | Iniciar sesión | Pública |
| POST | `/api/auth/sign-out` | Cerrar sesión | Sesión |
| GET | `/api/auth/get-session` | Obtener sesión actual | Sesión |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/usuarios` | admin |
| GET | `/api/usuarios/:id` | admin |
| POST | `/api/usuarios` | admin |
| PUT | `/api/usuarios/:id` | admin |
| DELETE | `/api/usuarios/:id` | admin |

### Distritos (`/api/distritos`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/distritos` | admin |
| GET | `/api/distritos/:id` | admin |
| POST | `/api/distritos` | admin |
| PUT | `/api/distritos/:id` | admin |
| DELETE | `/api/distritos/:id` | admin |

### Predios (`/api/predios`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/predios` | admin |
| GET | `/api/predios/:id` | admin |
| POST | `/api/predios` | admin |
| PUT | `/api/predios/:id` | admin |
| DELETE | `/api/predios/:id` | admin |

### Medidores (`/api/medidores`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/medidores` | admin |
| GET | `/api/medidores/:id` | admin |
| POST | `/api/medidores` | admin |
| PUT | `/api/medidores/:id` | admin |
| DELETE | `/api/medidores/:id` | admin |

### Contratos (`/api/contratos`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/contratos` | admin, brigadista |
| GET | `/api/contratos/mis-contratos` | ciudadano |
| GET | `/api/contratos/:id` | admin, brigadista, ciudadano |
| POST | `/api/contratos` | admin |
| PUT | `/api/contratos/:id` | admin |

### Tarifas (`/api/tarifas`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/tarifas` | admin, brigadista |
| GET | `/api/tarifas/:id` | admin, brigadista |
| POST | `/api/tarifas` | admin |
| PUT | `/api/tarifas/:id` | admin |

### Asignaciones (`/api/asignaciones`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/asignaciones` | admin |
| GET | `/api/asignaciones/brigadista/:brigadistaId` | admin, brigadista |
| POST | `/api/asignaciones` | admin |
| PUT | `/api/asignaciones/:brigadistaId` | admin |
| DELETE | `/api/asignaciones/:id` | admin |

### Lecturas (`/api/lecturas`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/lecturas` | admin |
| GET | `/api/lecturas/mi-ruta` | brigadista |
| GET | `/api/lecturas/:id` | admin, brigadista |
| POST | `/api/lecturas` | brigadista |

### Facturación (`/api/facturas`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/facturas` | admin |
| GET | `/api/facturas/mis-facturas` | ciudadano |
| GET | `/api/facturas/:id` | admin, ciudadano |
| GET | `/api/facturas/:id/pdf` | admin, ciudadano |
| POST | `/api/facturas/generar` | admin |

### Pagos (`/api/pagos`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| POST | `/api/pagos/qr/:facturaId` | ciudadano |
| POST | `/api/pagos/confirmar` | ciudadano, admin |
| GET | `/api/pagos` | admin |
| GET | `/api/pagos/mis-pagos` | ciudadano |

### Cortes (`/api/cortes`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| POST | `/api/cortes` | brigadista |
| GET | `/api/cortes` | admin |
| GET | `/api/cortes/:id` | admin |

### Reportes (`/api/reportes`)

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/reportes/resumen-diario` | admin |
| GET | `/api/reportes/recaudacion-por-distrito` | admin |
| GET | `/api/reportes/cortes-por-distrito` | admin |
| GET | `/api/reportes/lecturas-por-brigadista` | admin |

## Modelo de Datos

```
user ──1:N── contrato ──1:N── lectura
  │           │                   │
  │           │              factura ──1:N── pago
  │           │
  │           └── distrito
  │
  └──1:N── corte

tarifa ──1:N── factura
```

Tablas principales: `user`, `session`, `account`, `verification`, `distrito`, `predio`, `medidor`, `contrato`, `tarifa`, `asignacion`, `lectura`, `factura`, `pago`, `corte`.

## Formato de respuesta

Todas las respuestas siguen el formato estándar:

```json
{
  "success": true,
  "data": { },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

## Verificación

```bash
# Lint → Build → Tests (en este orden)
pnpm lint && pnpm build && pnpm test
```

## Licencia

UNLICENSED — Proyecto académico.
