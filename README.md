# Task Manager

A polished, persistent task tracker built as a Vite + React 19 single-page app. Add, filter, sort, reorder, and visualize your tasks with a smooth, keyboard-friendly UI. All data is stored locally in the browser; no account or server required.

## Features

- **Add / edit / delete** tasks through a modal dialog with Zod-validated forms; new tasks cannot have a past due date
- **Mark complete** with a single click on the checkbox
- **Filter** by status (all / active / completed) and priority (low / medium / high)
- **Sort** by due date (ascending or descending) or by manual drag order
- **Drag-to-reorder** via a grip handle. Reordering is automatically disabled when a filter or sort is active, with a one-click "Clear & Reorder" banner
- **Statistics dashboard** (collapsible accordion) with a completion pie chart and a priority distribution bar chart
- **Relative due dates** (Today / Tomorrow / Yesterday / N days) and overdue highlighting in red
- **Light, dark, and system** theme toggle with no flash of wrong theme on reload
- **Persistent** state across reloads via `localStorage`
- **Responsive** sticky header with a mobile floating action button for adding tasks
- **Toast notifications** for create, update, and delete actions
- **Destructive confirm dialogs** before deleting a task

## Tech Stack

**Framework**

- React 19, TypeScript, Vite 8

**UI**

- Tailwind CSS v4
- shadcn/ui (radix-vega style) primitives
- lucide-react icons

**State and data**

- Zustand with the `persist` middleware (localStorage)

**Forms and validation**

- react-hook-form
- Zod

**Interaction**

- `@dnd-kit/sortable` for drag-and-drop
- `@tanstack/react-virtual` for the virtualized task list
- `recharts` for statistics

**Dates**

- `date-fns`

**Testing and tooling**

- Vitest with the Playwright browser provider (Chromium)
- ESLint, Prettier, Knip
- Husky `pre-commit` and `pre-push` hooks wired with `lint-staged`

## Project Structure

```
task-manager/
├── backend/                 # Placeholder for a future API (see Branches)
├── frontend/                # The application
│   ├── src/
│   ├── public/
│   ├── components.json
│   ├── eslint.config.js
│   ├── lint-staged.config.mjs
│   ├── package.json
│   ├── prettier.config.mjs
│   ├── vite.config.ts
│   └── ...
├── .husky/                  # pre-commit and pre-push hooks
├── Makefile                 # Convenience wrappers around frontend scripts
├── README.md                # You are here
```

The `backend/` directory is intentionally empty on this branch.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install and run

```bash
cd frontend
pnpm install
pnpm dev
```

The dev server starts on http://localhost:3000. A `Makefile` wrapper is provided at the project root:

```bash
make frontend-dev
```

## Available Scripts

All scripts run from inside `frontend/` unless you use the `make` wrappers in the repo root.

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

`make help` lists all targets with their descriptions.

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

- **Persistence keys** (in `localStorage`):
  - `task-manager-store` holds `tasks` only (filters are intentionally not persisted; the schema is versioned, bump the `version` field in `store/task-store.ts` if you change its shape).
  - `task-manager-theme` holds the theme preference (`light` / `dark` / `system`).
- **Fractional indexing**: `lib/indexing.ts` assigns each task a float `index` that sits between its neighbors. Drag-to-reorder recomputes only the moved item's index in O(1), avoiding full-list rewrites.
- **Path alias**: `@` resolves to `frontend/src` (configured in `vite.config.ts` and `tsconfig`).
- **Theme no-FOUC**: an inline script in `frontend/index.html` reads the persisted theme from `localStorage` before the first paint, so the page never flashes the wrong theme.
- **Virtualized list**: the task list is rendered through `components/virtualize-list.tsx` using `@tanstack/react-virtual`, with the scroll area capped at `60vh` so the page remains responsive with large lists.
- **Manual chunks**: `vite.config.ts` splits `recharts` into its own chunk so the heavy charting library does not bloat the initial vendor bundle.
- **File conventions** (enforced by ESLint):
  - Filenames in `src/` are `kebab-case` (e.g. `task-list.tsx`, `task-form.tsx`).
  - Folders under `src/` (except `__tests__`) follow Next.js-app-router casing (e.g. `task/`, `ui/`, `lib/`).

## Branches

- `main` (this branch) — the frontend application only. All data is stored in the browser's `localStorage`. No backend, no setup beyond `pnpm install`.
- `with-backend` — adds a simple Express.js backend implementation. To explore that version, check the branch out and read its README:

  ```bash
  git fetch origin
  git checkout with-backend
  ```

  The `with-backend` branch contains the API and any environment / database setup instructions specific to it.
