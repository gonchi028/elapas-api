# AGENTS.md

## Project

NestJS 11 API (TypeScript) for the **ELAPAS Water Utility Management System**. Package manager: **pnpm**.

## Commands

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server (watch) | `pnpm start:dev` |
| Build | `pnpm build` |
| Lint (with auto-fix) | `pnpm lint` |
| Format | `pnpm format` |
| Unit tests | `pnpm test` |
| E2E tests | `pnpm test:e2e` |
| Run single test file | `pnpm test -- path/to/file.spec.ts` |
| Generate DB migration | `pnpm db:generate` |
| Run DB migration | `pnpm db:migrate` |
| Push DB schema | `pnpm db:push` |
| Drizzle Studio | `pnpm db:studio` |
| Seed database | `pnpm seed` |

## Verification order

`pnpm lint` then `pnpm build` then `pnpm test`.

## Architecture

- Entry point: `src/main.ts` — creates Nest app, listens on `PORT` (default 3000)
- Global prefix: `api/` — all routes are `/api/...`
- Swagger docs: `/docs` — all in **Spanish**
- Root module: `src/app.module.ts` — imports DbModule + AuthModule + all business modules
- Source root: `src/`
- Build output: `dist/`
- E2E tests: `test/` (separate Jest config at `test/jest-e2e.json`)
- Design docs: `docs/DD-ELAPAS.md` (full spec), `docs/plan.md` (implementation plan)

## Database

- ORM: **Drizzle ORM** with PostgreSQL (`postgres` driver)
- Schema: `src/db/schema.ts` — all tables, pgEnums, relations
- Connection: `src/db/connection.ts` — `DB_PROVIDER` symbol + `Database` type
- `DbModule` is `@Global()` — inject `DB_PROVIDER` in any service without importing DbModule
- Config: `drizzle.config.ts`

## Auth

- Library: **Better Auth** (email/password with sessions)
- Config: `src/auth/auth.ts` — includes `additionalFields` for role/estado
- `AuthGuard` — session-based, checks `req.session`
- `RolesGuard` — checks `@Roles()` decorator against `req.user.role`
- Roles: `admin`, `brigadista`, `ciudadano`
- Passwords live in the `account` table (Better Auth), not the `user` table
- `signUpEmail` only accepts `name`, `email`, `password` — set role via separate `db.update()`

## Modules

| Module | Path | Description |
|---|---|---|
| Db | `src/db/` | Global Drizzle DB provider |
| Auth | `src/auth/` | Better Auth + guards + decorators |
| Usuarios | `src/usuarios/` | Admin CRUD for users |
| Distritos | `src/distritos/` | Admin CRUD for districts |
| Contratos | `src/contratos/` | Contracts (citizens see mis-contratos) |
| Tarifas | `src/tarifas/` | Tariff tier management |
| Asignaciones | `src/asignaciones/` | Admin assigns contracts to brigadistas (route management) |
| Lecturas | `src/lecturas/` | Meter readings by brigadistas (scoped to assigned contracts) |
| Facturas | `src/facturas/` | Invoices + massive generation |
| Pagos | `src/pagos/` | Payments with QR simulation |
| Cortes | `src/cortes/` | Service cuts (scoped to assigned contracts) |
| Reportes | `src/reportes/` | Dashboard reports |

## Common

- `src/common/filters/http-error.filter.ts` — global exception filter (uniform `{ success, error }` response)

## Globals (in main.ts)

- `ValidationPipe` — whitelist, forbidNonWhitelisted, transform
- `HttpErrorFilter` — catches all exceptions, returns uniform JSON
- CORS enabled
- Body parser disabled for NestJS (re-added manually) to support Better Auth raw body

## Conventions

- Controllers wrap responses uniformly: `{ success, data, pagination?: { page, limit, total } }`
- Services return `{ data, total }` for paginated queries
- DTOs use `class-validator` decorators for input validation
- Swagger decorators on all endpoints with Spanish descriptions

## Test conventions

- Unit test files: `*.spec.ts` colocated with source in `src/`
- E2E test files: `*.e2e-spec.ts` in `test/`
- Test runner: Jest via ts-jest

## Style / lint

- ESLint flat config (`eslint.config.mjs`) — typescript-eslint `recommendedTypeChecked` + prettier
- Prettier: **single quotes**, **trailing commas**
- `@typescript-eslint/no-explicit-any` is **off**
- `@typescript-eslint/no-floating-promises` and `no-unsafe-argument` are **warn**

## TypeScript

- Target: ES2023, module: `nodenext`
- `strictNullChecks: true` but `noImplicitAny: false` (relaxed)
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)

## Key patterns

- Inject DB: `@Inject(DB_PROVIDER) private db: Database`
- Protect route: `@UseGuards(AuthGuard, RolesGuard)` + `@Roles('admin')`
- Pagination: accept `page` + `limit` query params, return `{ data, total }`
- Transactions: use `this.db.transaction(async (tx) => { ... })` for multi-step ops
- pgEnum types: cast with explicit unions like `'activo' as 'activo' | 'suspendido' | 'cortado'`
