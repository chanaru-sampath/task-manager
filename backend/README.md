# Task Manager — Backend

The REST API for the Task Manager. Built with Express 5, TypeScript, Drizzle ORM, and libSQL (SQLite). Validates every request with Zod and exposes a small set of `/tasks` endpoints plus a `/health` probe.

For the project-level overview (features, tech stack, getting started, architecture notes, branches), see the [root README](../README.md).

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
pnpm install
cp .env.sample .env.local   # done already in this repo
pnpm run db:migrate         # apply migrations to local.db
pnpm run dev
```

The dev server starts on http://localhost:3001 with hot reload via `tsx watch`.

## Environment Variables

Configured via `backend/.env.local` (created from `.env.sample`):

| Variable        | Required | Default                                 | Description                                                                 |
| --------------- | -------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `DB_FILE_NAME`  | yes      | `file:local.db`                         | libSQL connection string. Use `file:./path/to.db` for a local SQLite file. |
| `PORT`          | no       | `3001`                                  | HTTP port the Express server listens on.                                    |
| `CORS_ORIGIN`   | no       | `http://localhost:3000,http://localhost:4173` | Comma-separated list of allowed origins. Requests from any other origin are rejected by the CORS middleware. |

`src/db/index.ts` and `drizzle.config.ts` both load `.env.local` (and fall back to `.env`) at startup, so migrations and the runtime share the same configuration.

## Scripts

Run from inside this directory.

| Script              | What it does                                                                       |
| ------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`          | Start the Express server with `tsx watch` (hot reload on file changes).            |
| `pnpm build`        | Bundle the server to `dist/index.js` with `tsup` (ESM format).                      |
| `pnpm start`        | Run the compiled bundle: `node dist/index.js`.                                     |
| `pnpm typecheck`    | Run `tsc --noEmit` for a fast type check without emitting.                         |
| `pnpm db:generate`  | Generate a new Drizzle migration from `src/db/schema.ts` into `drizzle/`.          |
| `pnpm db:migrate`   | Apply all pending Drizzle migrations to the database.                              |
| `pnpm db:push`      | Push the current schema directly to the database (useful for prototyping).         |
| `pnpm db:studio`    | Open Drizzle Studio, a local UI for inspecting and editing the database.          |

`db:generate` and `db:migrate` are the two commands you reach for when the schema changes: generate a migration from your edits, then apply it.

## Folder Layout

```
backend/
├── src/
│   ├── index.ts                       # Express app entry: CORS, /health, /tasks, 404, error handler
│   ├── db/
│   │   ├── index.ts                   # Drizzle/libSQL client (loads .env.local)
│   │   └── schema.ts                  # `tasks` table definition
│   ├── routes/
│   │   └── tasks.ts                   # GET/POST/PATCH/DELETE handlers for /tasks
│   └── schemas/
│       └── task.ts                    # Zod request schemas + reusable `validate` middleware
├── drizzle/
│   ├── 0000_soft_stardust.sql         # Initial migration: creates the `tasks` table
│   └── meta/                          # Drizzle Kit migration metadata
├── dist/                              # tsup output (created by `pnpm build`)
├── drizzle.config.ts                  # drizzle-kit config (schema path, out dir, SQLite dialect)
├── .env.local / .env.sample           # Local env config (DB_FILE_NAME, PORT, CORS_ORIGIN)
├── pnpm-workspace.yaml                # Allows esbuild to run postinstall
├── tsconfig.json                      # Strict TypeScript, ESM, bundler resolution
└── package.json
```

## API

Base URL: `http://localhost:3001` (configurable via `PORT`).

| Method | Path         | Body                                                        | Success            | Errors                |
| ------ | ------------ | ----------------------------------------------------------- | ------------------ | --------------------- |
| GET    | `/tasks`     | —                                                           | `200 Task[]`       | `500`                 |
| POST   | `/tasks`     | `{ title, dueOn: "YYYY-MM-DD", priority }`                  | `201 Task`         | `400`, `500`          |
| PATCH  | `/tasks/:id` | partial `{ title?, dueOn?, priority?, completed?, index? }` | `200 Task`         | `400`, `404`, `500`   |
| DELETE | `/tasks/:id` | —                                                           | `204` (no body)    | `404`, `500`          |
| GET    | `/health`    | —                                                           | `200 { status: "ok" }` | `500`              |

`Task` shape (matches the frontend `Task` type and the Drizzle `tasks` row):

```ts
{
  id: string;            // UUID generated server-side
  title: string;         // 1..100 characters, trimmed
  dueOn: string;         // ISO calendar date, 'YYYY-MM-DD'
  priority: "low" | "medium" | "high";
  completed: boolean;    // false on create
  index: number;         // float for fractional-index ordering
}
```

### Error Responses

All errors share a consistent JSON shape:

- `400 { error: "Validation failed", fieldErrors: { [path]: string[] } }` — request body failed Zod validation. `fieldErrors` is grouped by the dotted path of each invalid field.
- `404 { error: "Task not found" }` — PATCH/DELETE on an unknown `id`. The catch-all 404 returns `{ error: "Route not found" }`.
- `500 { error: "Internal server error" }` — any unhandled error from a handler is forwarded to the centralized error middleware, which logs the original and returns a generic 500.

## Database and Migrations

The `tasks` table (see `src/db/schema.ts`) is the only table:

| Column      | Type                          | Notes                                              |
| ----------- | ----------------------------- | -------------------------------------------------- |
| `id`        | `text` (PK)                   | UUID v4 generated in the `POST /tasks` handler.    |
| `title`     | `text`                        | 1..100 characters, trimmed.                        |
| `dueOn`     | `text`                        | ISO calendar date, format `YYYY-MM-DD`.            |
| `priority`  | `text` enum                   | One of `low`, `medium`, `high`.                    |
| `completed` | `integer` (boolean mode)      | Defaults to `false`.                               |
| `index`     | `real`                        | Float for fractional-index ordering; see below.     |

Drizzle Kit writes migrations into `drizzle/`. The initial migration (`0000_soft_stardust.sql`) creates the `tasks` table. The workflow for schema changes is:

```bash
# 1. Edit src/db/schema.ts
# 2. Generate a migration describing the diff
pnpm run db:generate
# 3. Apply it to the database
pnpm run db:migrate
```

Use `pnpm run db:studio` for a local UI to inspect or hand-edit rows during development. The `drizzle/` directory is committed so every environment can replay the same schema history.

## Validation

`src/schemas/task.ts` defines the Zod request schemas and a small `validate` middleware that runs them on `req.body` (and optionally `req.params` / `req.query`):

- `createTaskSchema.body` — required `title`, `dueOn`, `priority`. Mirrors the frontend create form.
- `updateTaskSchema.body` — all fields optional, but the body must contain at least one field. Mirrors the frontend edit form plus the `completed` and `index` fields used by the toggle and drag-to-reorder flows.

On failure the middleware responds with `400 { error, fieldErrors }` and never reaches the route handler. The frontend surfaces `fieldErrors` in the form so the same error messages appear in both places.

## Ordering and Fractional Indexing

`POST /tasks` assigns the new task an `index` of `1.0` higher than the current maximum so new items land at the end of the list. The frontend computes a new fractional `index` for the moved row on drag and sends a single `PATCH` (see `frontend/src/lib/indexing.ts`). The server treats `index` as an opaque float and re-sorts by it on `GET /tasks`, so the client and the database never need to reindex siblings.

## Build and Run

```bash
pnpm build      # tsup bundles src/index.ts to backend/dist/index.js (ESM)
pnpm start      # node dist/index.js
```

The compiled bundle is self-contained and has no runtime dependencies on `tsx` or `drizzle-kit`. Use this in production; keep `pnpm dev` for local development.

## Conventions

- **Module system**: ESM (`"type": "module"` in `package.json`). Use `import`/`export` syntax everywhere.
- **TypeScript**: `strict: true` with `moduleResolution: "bundler"`, `target: "ES2020"`. `tsconfig.json` sets `noEmit: true` — building is delegated to `tsup`.
- **Error handling**: every async route handler is wrapped in `try/catch` and forwards errors via `next(err)`. Express 5 also handles thrown/rejected async handlers, so a missed `catch` will not crash the server, but the explicit pattern keeps stack traces clean.
- **Validation**: every request that mutates state goes through `validate(...)` from `src/schemas/task.ts`. The schemas are the contract shared with the frontend.
- **IDs**: server-generated with `randomUUID()` from `node:crypto`. The frontend never invents task IDs.
- **Env loading**: `src/db/index.ts`, `drizzle.config.ts`, and `src/index.ts` all call `dotenv` to load `.env.local` (and then `.env` as a fallback) so the runtime, the migrator, and the studio all see the same configuration.

## Pointers

- Project overview, getting started, architecture, and branches: [root README](../README.md)
- Frontend implementation: [frontend/README.md](../frontend/README.md)
