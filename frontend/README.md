# Task Manager — Frontend

The single-page application for the Task Manager. Built with Vite, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui. Task data is fetched and cached by TanStack Query; a small Zustand store holds the filter UI state, and the theme preference is persisted to `localStorage` to avoid a flash of wrong theme on reload.

For the project-level overview (features, tech stack, getting started, architecture notes, branches), see the [root README](../README.md).

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
pnpm install
pnpm dev
```

The dev server starts on http://localhost:3000.

## Scripts

Run from inside this directory.

| Script            | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm dev`        | Start the Vite dev server with HMR.                              |
| `pnpm build`      | Type-check (`tsc -b`) and produce a production build to `dist/`. |
| `pnpm preview`    | Serve the production build locally for verification.             |
| `pnpm lint`       | Run ESLint over the project.                                     |
| `pnpm format`     | Format every supported file with Prettier (write mode).          |
| `pnpm typecheck`  | Run `tsc --noEmit` for a fast type check without emitting.       |
| `pnpm test`       | Run the Vitest browser test suite once.                          |
| `pnpm test:watch` | Run the Vitest browser test suite in watch mode.                 |
| `pnpm knip`       | Detect unused files, exports, and dependencies.                  |
| `pnpm prepare`    | Configure Husky to use the hooks in `../.husky`.                 |

## Path Alias

`@` resolves to `src/`, configured in `vite.config.ts` and `tsconfig.app.json`.

```ts
import { useTaskFilterStore } from '@/store/task-filter-store'
```

## Folder Layout

```
frontend/
├── public/                     # Static assets served as-is
├── src/
│   ├── app.tsx                 # Root component
│   ├── main.tsx                # React entry point
│   ├── types.ts                # Shared Task and TaskFilters types
│   ├── index.css               # Tailwind entry and global styles
│   ├── assets/                 # Images and fonts bundled by Vite
│   ├── components/
│   │   ├── header.tsx          # Sticky top bar with progress
│   │   ├── theme-toggle.tsx    # Light / dark / system switcher
│   │   ├── confirm-dialog.tsx  # Reusable destructive confirm modal
│   │   ├── virtualize-list.tsx # Generic virtualized list wrapper
│   │   ├── task/               # TaskList, TaskItem, TaskForm, TaskFilters, TaskEmptyState, TaskStatistics
│   │   └── ui/                 # shadcn/ui primitives (button, dialog, select, ...)
│   ├── hooks/
│   │   ├── use-tasks.ts             # TanStack Query bindings (useTasks, useCreateTask, useUpdateTask, ...)
│   │   └── use-filtered-tasks.ts   # Derives the filtered/sorted list from the cache
│   ├── store/
│   │   ├── task-filter-store.ts # Zustand store for the filter UI state (not persisted)
│   │   └── theme-store.ts      # Zustand store for the theme preference, with persist
│   ├── lib/
│   │   ├── utils.ts            # `cn` class-name helper
│   │   ├── api.ts              # Typed fetch wrapper around the backend
│   │   ├── indexing.ts         # Fractional key generation for drag reorders
│   │   └── local-date.ts       # date-fns wrappers (today, formatRelative, compareLocalDates, ...)
│   └── schemas/
│       └── task.ts             # Zod schemas for the task form (create + edit)
├── components.json             # shadcn/ui generator config
├── eslint.config.js            # ESLint flat config
├── prettier.config.mjs         # Prettier + import sort
├── lint-staged.config.mjs      # lint-staged wiring for the pre-commit hook
├── vite.config.ts              # Vite, Vitest, path alias, manual chunks
├── tsconfig*.json              # TypeScript project references
└── package.json
```

Tests live in `__tests__/` folders co-located with the code they cover:

- `src/components/__tests__/` — `header`, `theme-toggle`, `confirm-dialog`, `virtualize-list`
- `src/components/task/__tests__/` — `task-list`, `task-item`, `task-form`, `task-filters`, `task-empty-state`, `task-statistics`
- `src/hooks/__tests__/` — `use-filtered-tasks`
- `src/lib/__tests__/` — `indexing`, `local-date`
- `src/store/__tests__/` — `task-filter-store`, `theme-store`

## Testing

Tests run in a real browser using Vitest's browser mode with the Playwright provider (Chromium):

```bash
pnpm test          # one run
pnpm test:watch    # watch mode
```

`vite.config.ts` lists the dependencies that Vitest must transform on the fly (Radix UI, react-hook-form, sonner, next-themes, recharts). Add to that list if a new UI dependency throws a transform error.

## State and Persistence

Two Zustand stores:

- `useTaskFilterStore` — in-memory only (no `persist` middleware). Holds the filter UI state (`status`, `priority`, `sortByDueDate`, `sortDirection`) and resets to the defaults on every reload. Task data itself is owned by TanStack Query and lives in the server-state cache, not in any Zustand store.
- `useThemeStore` (`task-manager-theme`, version `1`) — wraps `persist` to write the theme preference (`light` / `dark` / `system`) to `localStorage`. This is the only piece of state still in `localStorage`, and it must be read by the inline script in `index.html` to avoid a flash of wrong theme on reload.

When a persisted store's shape changes, bump its `version` field and add a `migrate` function.

## Conventions

- **Filenames** in `src/` are `kebab-case` (e.g. `task-list.tsx`, `task-form.tsx`).
- **Folders** under `src/` (excluding `__tests__`) follow `kebab-case`.
- Both rules are enforced by `eslint-plugin-check-file` in `eslint.config.js`.
- **Prettier**: `printWidth: 120`, single quotes, no semicolons, trailing commas where ES5 allows, with imports sorted by `@trivago/prettier-plugin-sort-imports` in the order: React, third-party, `@/...`, relative.
- **Components** are exported as named functions; the only default export in the application is `App` from `app.tsx` (required by the React entry point in `main.tsx`).
- **Forms** use `react-hook-form` with a Zod resolver from `@hookform/resolvers/zod`. Schemas live in `src/schemas/`.
- **Dates** flow through `src/lib/local-date.ts`, which wraps `date-fns` so the rest of the app never imports `date-fns` directly. This keeps the date-handling surface small and easy to test.

## Build and Preview

```bash
pnpm build      # Outputs static assets to frontend/dist
pnpm preview    # Serves dist/ locally for smoke-testing
```

`vite.config.ts` configures manual chunks so that `recharts` is split out of the main `vendor` chunk. This keeps the initial bundle lean and lets the heavy charting library load on demand when the statistics accordion is opened.

## Pointers

- Project overview, getting started, architecture, and branches: [root README](../README.md)
- Backend implementation: [backend/README.md](../backend/README.md)
