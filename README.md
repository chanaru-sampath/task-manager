# Task Manager

A polished, persistent task tracker built as a Vite + React 19 single-page app backed by an Express + SQLite API. Add, filter, sort, reorder, and visualize your tasks with a smooth, keyboard-friendly UI. Data is stored server-side; only the theme preference lives in the browser.

## Features

- **Add / edit / delete** tasks through a modal dialog with Zod-validated forms; new tasks cannot have a past due date
- **Mark complete** with a single click on the checkbox
- **Filter** by status (all / active / completed) and priority (low / medium / high)
- **Sort** by due date (ascending or descending) or by manual drag order
- **Drag-to-reorder** via a grip handle. Reordering is automatically disabled when a filter or sort is active, with a one-click "Clear & Reorder" banner
- **Statistics dashboard** (collapsible accordion) with a completion pie chart and a priority distribution bar chart
- **Relative due dates** (Today / Tomorrow / Yesterday / N days) and overdue highlighting in red
- **Light, dark, and system** theme toggle with no flash of wrong theme on reload
- **Optimistic mutations** powered by TanStack Query: the UI updates instantly and rolls back on error
- **Responsive** sticky header with a mobile floating action button for adding tasks
- **Toast notifications** for create, update, and delete actions
- **Destructive confirm dialogs** before deleting a task

## Tech Stack

**Frontend** (`frontend/`)

- React 19, TypeScript, Vite 8
- [React Compiler](https://react.dev/learn/react-compiler) (`babel-plugin-react-compiler` via `@vitejs/plugin-react`'s `reactCompilerPreset`) for automatic memoization — no manual `useMemo` / `useCallback` / `React.memo` needed
- TanStack Query for server-state cache, optimistic updates, and request lifecycle
- Zod for form validation (shared shape with the backend)
- Tailwind CSS v4, shadcn/ui primitives, lucide-react icons
- Zustand (filter-only store; the task list lives in the TanStack Query cache)
- `@dnd-kit/sortable` for drag-and-drop, `@tanstack/react-virtual` for virtualization, `recharts` for statistics
- `date-fns` for date math

**Backend** (`backend/`)

- Express 5, TypeScript (`tsx` for dev, `tsc` for build)
- Drizzle ORM + libSQL (SQLite, file-backed by default)
- Zod for request validation (mirrors the frontend schemas)
- dotenv for env loading

**Testing and tooling**

- Vitest with the Playwright browser provider (Chromium) — frontend only
- ESLint, Prettier, Knip
- Husky `pre-commit` and `pre-push` hooks wired with `lint-staged`

## Project Structure

```
task-manager/
├── backend/                # Express + Drizzle + SQLite API
│   ├── src/
│   │   ├── db/             # Drizzle client and schema
│   │   ├── routes/         # /tasks router
│   │   ├── schemas/        # Zod request schemas
│   │   └── index.ts
│   ├── drizzle/            # Generated migrations
│   └── package.json
├── frontend/               # The application
│   ├── src/
│   ├── public/
│   ├── components.json
│   ├── eslint.config.js
│   ├── lint-staged.config.mjs
│   ├── package.json
│   ├── prettier.config.mjs
│   ├── vite.config.ts
│   └── ...
├── .husky/                 # pre-commit and pre-push hooks
├── Makefile                # Convenience wrappers around frontend + backend scripts
├── README.md               # You are here
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Backend setup

```bash
cd backend
pnpm install
cp .env.sample .env.local   # already done in this repo
pnpm run db:migrate         # apply migrations to local.db
```

The backend runs on http://localhost:3001 by default. The bundled `backend/.env.local` configures SQLite at `file:local.db` and allows CORS from `http://localhost:3000` and `http://localhost:4173`.

```bash
make backend-dev
# or: cd backend && pnpm run dev
```

### Frontend setup

```bash
cd frontend
pnpm install
cp .env.sample .env.local
```

`.env.local` only needs `VITE_API_URL` (defaults to `http://localhost:3001`).

```bash
make frontend-dev
# or: cd frontend && pnpm run dev
```

The dev server starts on http://localhost:3000.

## Available Scripts

All scripts can be run from inside each package or via the `make` wrappers in the repo root.

### Frontend

| Action                   | pnpm                   | make                                             |
| ------------------------ | ---------------------- | ------------------------------------------------ |
| Start dev server         | `pnpm dev`             | `make frontend-dev`                              |
| Production build         | `pnpm build`           | `make frontend-build`                            |
| Preview production build | `pnpm preview`         | `make frontend-preview`                          |
| Lint                     | `pnpm lint`            | `make frontend-lint`                             |
| Format                   | `pnpm format`          | `make frontend-format`                           |
| Type-check               | `pnpm typecheck`       | `make frontend-typecheck`                        |
| Run tests (one-shot)     | `pnpm test`            | `make frontend-test`                             |
| Run tests (watch)        | `pnpm test:watch`      | `make frontend-test-watch`                       |
| Detect dead code         | `pnpm knip`            | `make frontend-knip`                             |
| Clean build output       | `rm -rf frontend/dist` | `make frontend-clean` (prompts for confirmation) |

### Backend

| Action                     | pnpm                  | make                       |
| -------------------------- | --------------------- | -------------------------- |
| Start dev server (watch)   | `pnpm dev`            | `make backend-dev`         |
| Type-check + build         | `pnpm build`          | `make backend-build`       |
| Start compiled server      | `pnpm start`          | `make backend-start`       |
| Generate a new migration   | `pnpm db:generate`    | `make backend-db-generate` |
| Apply migrations to the DB | `pnpm db:migrate`     | `make backend-db-migrate`  |
| Open Drizzle Studio        | `pnpm db:studio`      | `make backend-db-studio`   |
| Clean `dist/`              | `rm -rf backend/dist` | `make backend-clean`       |

### Both Apps

Composite targets that run the backend and frontend together from the repo root. Both run `db:push` first so the database schema is in sync with the running backend.

| Action                                            | make          |
| ------------------------------------------------- | ------------- |
| Start backend + frontend in dev mode (db push first) | `make up`    |
| Build both, then start backend + preview frontend (db push first) | `make serve` |

`make up` backgrounds the backend dev server and runs the frontend dev server in the foreground; Ctrl-C stops the frontend and the recipe then kills the backend. `make serve` does the same for the built bundle (`pnpm run start` + `vite preview`) after running the build steps. The recipe prints the working directory at each step so you can confirm it stays at the repo root.

`make help` lists all targets with their descriptions.

## API

Base URL: `http://localhost:3001`

| Method | Path         | Body                                                        | Returns          |
| ------ | ------------ | ----------------------------------------------------------- | ---------------- |
| GET    | `/tasks`     | —                                                           | `200 Task[]`     |
| POST   | `/tasks`     | `{ title, dueOn: "YYYY-MM-DD", priority }`                  | `201 Task`       |
| PATCH  | `/tasks/:id` | partial `{ title?, dueOn?, priority?, completed?, index? }` | `200 Task`       |
| DELETE | `/tasks/:id` | —                                                           | `204`            |
| GET    | `/health`    | —                                                           | `200 { status }` |

`Task` shape:

```ts
{
  id: string; // UUID
  title: string;
  dueOn: string; // 'YYYY-MM-DD'
  priority: "low" | "medium" | "high";
  completed: boolean;
  index: number; // float for fractional-index ordering
}
```

Validation errors return `400 { error, fieldErrors }`. Missing resources return `404 { error }`. Unhandled errors return `500 { error }`.

## Testing and Quality

- **Unit and component tests** live next to the code they exercise in `__tests__/` folders, run by Vitest in a real browser (Playwright / Chromium):

  ```bash
  cd frontend
  pnpm test
  pnpm test:watch
  ```

- **Lint**: `pnpm lint` runs ESLint with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and `eslint-plugin-check-file` (enforces kebab-case filenames and Next.js-app-router folder casing for `src/`).
- **Format**: `pnpm format` runs Prettier (single quotes, no semicolons, 120-column, sorted imports).
- **Type-check**: `pnpm typecheck` runs `tsc --noEmit`.
- **Dead-code detection**: `pnpm knip` reports unused files, exports, and dependencies.
- **Husky hooks**:
  - `pre-commit` runs `lint-staged` (Prettier + ESLint on staged files).
  - `pre-push` runs the type-check and the test suite.

## Architecture Notes

- **Persistence split**:
  - Tasks live in the backend's SQLite database (`backend/local.db` by default). Drizzle migrations live under `backend/drizzle/`.
  - The theme preference (`light` / `dark` / `system`) is the only thing still in `localStorage` (key: `task-manager-theme`), to avoid a flash of wrong theme on reload. See `frontend/src/store/theme-store.ts` and the inline script in `frontend/index.html`.
- **Server-state cache**: `useTasks()` is the single source of truth for the task list. Mutations (`useCreateTask`, `useUpdateTask`, `useReorderTask`, `useDeleteTask`) apply optimistic updates and roll back on error before invalidating the cache.
- **Filter store**: only the filter UI state (`status`, `priority`, `sortByDueDate`, `sortDirection`) lives in a small Zustand store (`useTaskFilterStore`). It is intentionally not persisted, so filters reset on reload.
- **Fractional indexing**: `lib/indexing.ts` assigns each task a float `index` that sits between its neighbors. Drag-to-reorder computes only the moved item's new index client-side and PATCHes the server.
- **Validation**: the frontend uses Zod for the form (`frontend/src/schemas/task.ts`); the backend re-validates the same shape with its own Zod schema (`backend/src/schemas/task.ts`) and returns 400 with `fieldErrors` on failure.
- **Path aliases**: `@` resolves to `frontend/src` (configured in `vite.config.ts` and `tsconfig`).
- **Theme no-FOUC**: an inline script in `frontend/index.html` reads the persisted theme from `localStorage` before the first paint.
- **Virtualized list**: the task list is rendered through `components/virtualize-list.tsx` using `@tanstack/react-virtual`, capped at `60vh` so the page stays responsive with large lists.
- **Manual chunks**: `vite.config.ts` splits `recharts` into its own chunk so the heavy charting library does not bloat the initial vendor bundle.
- **React Compiler**: enabled in `vite.config.ts` through `@vitejs/plugin-react`'s `reactCompilerPreset`. The compiler handles memoization of props, hook returns, and JSX, so the codebase intentionally avoids `useMemo`, `useCallback`, and `React.memo`. Write the natural code and let the compiler do the work.
- **File conventions** (enforced by ESLint):
  - Filenames in `src/` are `kebab-case` (e.g. `task-list.tsx`, `task-form.tsx`).
  - Folders under `src/` (except `__tests__`) follow Next.js-app-router casing (e.g. `task/`, `ui/`, `lib/`).

## Pointers

- Frontend implementation details: [frontend/README.md](frontend/README.md)
- Backend implementation details: [backend/README.md](backend/README.md)
