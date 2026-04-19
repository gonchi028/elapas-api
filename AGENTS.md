# AGENTS.md

## Project

NestJS 11 API (TypeScript). Package manager: **pnpm**.

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

## Verification order

`pnpm lint` then `pnpm build` then `pnpm test`.

## Architecture

- Entry point: `src/main.ts` — creates Nest app, listens on `PORT` (default 3000)
- Single module: `src/app.module.ts` — will grow as features are added
- Source root: `src/`
- Build output: `dist/`
- E2E tests: `test/` (separate Jest config at `test/jest-e2e.json`)

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
