# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI and feature components; tests live in `__tests__/` folders.
- `lib/`: Auth, services, Supabase, database SQL, and utilities.
- `types/`: TypeScript definitions shared across the app.
- `prisma/`: Prisma schema and tooling.
- `e2e/`: Playwright end‑to‑end tests and helpers.
- Config: `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `tailwind.config.ts`.

## Build, Test, and Development Commands
- `npm run dev`: Start local Next.js dev server.
- `npm run build`: Production build.
- `npm start`: Run built app.
- `npm run lint`: ESLint checks.
- `npm run typecheck`: TypeScript type checks.
- `npm test` / `npm run test:run`: Vitest unit/component tests.
- `npm run test:coverage`: Coverage report.
- `npm run test:e2e` (± `:ui`, `:headed`, `:debug`): Playwright E2E.
- Prisma: `npm run prisma:generate`, `prisma:migrate:*`, `prisma:studio`.

## Coding Style & Naming Conventions
- Language: TypeScript/TSX; follow existing patterns enforced by ESLint (`eslint-config-next`).
- Files: kebab-case (e.g., `vehicle-form.tsx`), components in PascalCase exports, functions/vars camelCase.
- Imports: absolute aliases where configured; prefer named exports.
- Styling: Tailwind CSS; keep utility classes readable and grouped logically.
- Indentation & format: match current codebase (2 spaces typical); run `npm run lint` before PRs.

## Testing Guidelines
- Frameworks: Vitest + Testing Library for unit/component; Playwright for E2E; MSW for mocks.
- Locations: `**/__tests__/` near source; E2E under `e2e/`.
- Conventions: filename.test.ts(x), AAA structure, test critical business logic (vehicles, invoices, finances).
- Coverage: target high coverage on core flows; see TESTING.md for targets and patterns.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat: add vehicle status tracking`, `fix: resolve auth redirect`).
- PRs: clear description, linked issues, screenshots for UI, test plan/results, and checklist (lint, typecheck, tests passing).
- Scope: keep PRs small and focused; include migrations/SQL changes in `lib/database/` when relevant.

## Security & Configuration
- Never commit secrets; use `.env.local` (see `.env.example`).
- Supabase keys and service role required for local dev; validate via `lib/database/test-connection.ts` if applicable.
- Follow RLS policies and permission helpers in `lib/auth/` when adding features.

