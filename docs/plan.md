# Implementation Plan: Drizzle ORM + Better Auth in NestJS

## Overview

Integrate **Drizzle ORM** as the database layer and **Better Auth** for authentication into this NestJS 11 API project. PostgreSQL is the target database.

---

## Phase 1 — Project Setup & Dependencies

### 1.1 Install packages

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/pg
pnpm add better-auth
```

### 1.2 Environment variables

Create a `.env` file (already gitignored):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/elapas
PORT=3000
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3000
```

> Better Auth uses `BETTER_AUTH_SECRET` for signing tokens and `BETTER_AUTH_URL` as the base URL.

### 1.3 Drizzle Kit config

Create `drizzle.config.ts` at the project root:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## Phase 2 — Database Layer (Drizzle ORM)

### 2.1 File structure

```
src/
  db/
    connection.ts     # drizzle instance + postgres client
    schema.ts         # all table definitions
    relations.ts      # relations between tables
```

### 2.2 Database connection — `src/db/connection.ts`

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
```

### 2.3 Schema — `src/db/schema.ts`

Define core tables. Better Auth expects a `user` and `session` table at minimum. You can generate the exact schema via CLI:

```bash
npx @better-auth/cli generate
```

This outputs the Drizzle schema for `user`, `session`, `account`, and `verification` tables. Copy it into `src/db/schema.ts`.

Minimal manual example:

```ts
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: serial('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: varchar('user_agent', { length: 255 }),
  userId: serial('user_id')
    .notNull()
    .references(() => user.id),
});

export const account = pgTable('account', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: serial('user_id')
    .notNull()
    .references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
});

export const verification = pgTable('verification', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

### 2.4 Relations — `src/db/relations.ts`

```ts
import { relations } from 'drizzle-orm';
import { user, session, account } from './schema';

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
```

### 2.5 Add npm scripts to `package.json`

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

- Use `db:push` during development for rapid prototyping (no migration files).
- Use `db:generate` + `db:migrate` for production (generates SQL migration files in `./drizzle/`).

---

## Phase 3 — Authentication (Better Auth)

### 3.1 File structure

```
src/
  auth/
    auth.ts           # betterAuth instance + config
    auth.module.ts    # NestJS module
    auth.controller.ts # catches /api/auth/* routes
    auth.service.ts   # optional helper methods
```

### 3.2 Auth config — `src/auth/auth.ts`

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/connection';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
});
```

### 3.3 Auth controller — `src/auth/auth.controller.ts`

Better Auth provides a Node.js (Express-compatible) handler. Since NestJS uses Express under the hood, mount it via a raw request handler:

```ts
import {
  All,
  Controller,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';

@Controller('api/auth')
export class AuthController {
  @All()
  handler(@Req() req: Request, @Res() res: Response) {
    toNodeHandler(auth)(req, res);
  }
}
```

> **Important:** Do NOT apply `express.json()` body parsing before the Better Auth handler. NestJS enables it by default — see the workaround below.

### 3.4 Disable body parsing for auth routes

In `src/main.ts`, add **before** `app.listen()`:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: '10kb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Setting `bodyParser: false` and then re-adding `json()` middleware globally ensures Better Auth's route handler gets the raw request stream.

### 3.5 Auth module — `src/auth/auth.module.ts`

```ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
```

Register `AuthModule` in `src/app.module.ts`.

### 3.6 Auth API endpoints (provided by Better Auth)

| Method  | Endpoint                      | Description           |
| ------- | ----------------------------- | --------------------- |
| POST    | `/api/auth/sign-up/email`     | Register with email   |
| POST    | `/api/auth/sign-in/email`     | Login with email      |
| POST    | `/api/auth/sign-out`          | Logout                |
| GET     | `/api/auth/get-session`       | Get current session   |
| POST    | `/api/auth/forgot-password`   | Request password reset|
| POST    | `/api/auth/reset-password`    | Reset password        |
| POST    | `/api/auth/verify-email`      | Verify email address  |

---

## Phase 4 — Protecting Routes (Session Guard)

### 4.1 Session guard — `src/auth/auth.guard.ts`

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { auth } from './auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.user = session.user;
    request.session = session.session;
    return true;
  }
}
```

### 4.2 Usage

```ts
@UseGuards(AuthGuard)
@Get('profile')
getProfile(@Req() req: Request) {
  return req['user'];
}
```

---

## Phase 5 — Verification Checklist

Run in this order after implementation:

1. `pnpm lint` — ensure no lint errors
2. `pnpm build` — ensure TypeScript compiles
3. `pnpm test` — run existing tests (update scaffolding tests if needed)
4. `pnpm db:push` — push schema to database
5. Start dev server and test endpoints:
   - `POST /api/auth/sign-up/email` with `{ email, password, name }`
   - `POST /api/auth/sign-in/email` with `{ email, password }`
   - `GET /api/auth/get-session` with the session cookie

---

## Key Gotchas

- **Body parsing:** NestJS body parser is enabled by default. Better Auth's Node handler works alongside it. JSON limit is set to 10MB via `app.use(json({ limit: '10mb' }))`.
- **Route pattern:** The `@All()` decorator with a wildcard catches all HTTP methods on `/api/auth/*`.
- **Schema generation:** Run `npx @better-auth/cli generate` to get the exact Drizzle schema Better Auth expects — don't guess the columns.
- **CORS:** If the frontend is on a different origin, configure CORS in `main.ts` and set `BETTER_AUTH_URL` to the API's actual URL.
- **Cookies:** Better Auth uses cookies for session tokens by default. Ensure your frontend sends credentials (`withCredentials` in Axios, or `credentials: 'include'` in fetch).
- **File uploads:** Lecturas and cortes use `multipart/form-data` with multer. The JSON body parser only handles `application/json` requests, so multipart is processed by the FileInterceptor.
