# Design Decisions

> Why this stack, what I weighed, and what I'd revisit. Written as interview prep — every claim below is something I'd defend if asked.

## Stack at a glance

| Category             | Choice                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| Framework            | React 19 + TypeScript + Vite 8                                                       |
| Styling              | Tailwind CSS v4 + shadcn/ui (radix-vega)                                             |
| State                | TanStack Query (server cache) + Zustand (filter UI) + persist → localStorage (theme) |
| Reorder algorithm    | Custom fractional indexing                                                           |
| Forms & validation   | react-hook-form + Zod                                                                |
| Drag, virtual, chart | @dnd-kit + @tanstack/react-virtual + recharts                                        |
| Toasts               | sonner                                                                               |
| Tests                | Vitest in real Chromium (Playwright browser)                                         |
| Quality              | ESLint + Prettier + Husky + lint-staged + Knip                                       |
| Performance          | React Compiler (auto-memoization)                                                    |

---

## 1. Frontend Stack

### [React 19](https://react.dev)

**Chosen** — React 19, with the React Compiler wired through Vite.

**Why**

- Concurrent rendering, Suspense, and the Compiler slot are all first-class in 19.
- Best-in-class ecosystem fit for the rest of the stack: shadcn/ui, dnd-kit, react-hook-form, @tanstack/react-virtual, recharts, and sonner all assume React as the host.
- **Deepest personal expertise** — React is the framework I have the most production experience with, so the choice also reflects where I can move fastest and make the most defensible decisions about state, rendering, and concurrent behavior in this codebase. Expertise isn't a tie-breaker in isolation, but combined with the technical fit, it makes React the obvious pick.

### [Vite 8](https://vite.dev)

**Chosen** — Vite 8, with `@vitejs/plugin-react` + `@rolldown/plugin-babel` running the React Compiler preset.

**Why**

- Native ESM dev server with sub-second cold start and instant HMR; the Compiler wires in cleanly via the existing plugin chain.
- First-class path-alias support (`@/`), manual-chunk control (we split `recharts` out of `vendor`), and a single config file that also drives Vitest's browser mode.
- Plays nicely with Tailwind v4's `@tailwindcss/vite` plugin — no PostCSS pipeline to babysit.

**Alternatives**

- **[Next.js](https://nextjs.org)** — would force app-router conventions, RSC boundaries, and a server runtime we don't need for a SPA whose only persistence was `localStorage`.
- **[Turbopack](https://turbo.build/pack)** — fast in dev, but its Vitest story is non-existent and the production chunking story is less mature than Vite/Rollup.
- **[Webpack](https://webpack.js.org)** — ubiquitous but heavier config, slower HMR, and no native ESM dev experience.

### [TypeScript](https://www.typescriptlang.org)

**Chosen** — TypeScript in strict bundler mode (`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`).

**Why**

- Type-driven Zod inference: the form schema _is_ the form's prop type, end to end.
- `verbatimModuleSyntax` + `moduleResolution: bundler` keeps the import surface honest and matches Vite's resolution.
- `noUnusedLocals` + `noUnusedParameters` catch dead code at compile time, complementing Knip at the file/export level.

**Alternatives**

- **JS + JSDoc** — fine for small modules, but loses us Zod's `z.infer` and the editor-level safety we get on forms and the Zustand store.
- **[Flow](https://flow.org)** — dead ecosystem; no React 19 type coverage, no IDE support worth the migration.

### [Tailwind CSS v4](https://tailwindcss.com)

**Chosen** — Tailwind v4 via the official Vite plugin, with design tokens declared in `@theme inline`.

**Why**

- Utility-first + a real design-token system (`@theme`) means the chart colors, sidebar tokens, and component primitives all pull from one source of truth.
- The Vite plugin replaces the old PostCSS pipeline — faster builds, less config to drift.
- Pairs naturally with shadcn's copy-paste components, which expect Tailwind class names verbatim.

**Alternatives**

- **CSS Modules** — clean scoping, but every token has to be hand-wired into CSS variables and there's no equivalent of `@theme`.
- **[styled-components](https://styled-components.com)** — runtime CSS-in-JS, no design-token system, and a runtime cost we don't need.

### [shadcn/ui](https://ui.shadcn.com) (radix-vega) on [Radix UI](https://www.radix-ui.com)

**Chosen** — shadcn/ui with the radix-vega style, pulling in Radix primitives for a11y and `@radix-ui/react-*` behavior.

**Why**

- We _own the source_ — every component is a local file in `src/components/ui/`, so we can reshape a button or a dialog without fighting an upstream API.
- Built on Radix, so accessibility (focus traps, keyboard nav, ARIA) is solved for the tricky primitives (Dialog, DropdownMenu, Tooltip, Accordion).
- The `components.json` config keeps the generator reproducible and the `radix-vega` style matches the visual direction we wanted.

**Alternatives**

- **[MUI](https://mui.com)** — comprehensive, but ships its own styling system that fights Tailwind and pushes opinions we don't share.
- **[Chakra UI](https://chakra-ui.com)** — same problem in a different costume: heavy runtime, hard to fully restyle, source not owned.
- **[Headless UI](https://headlessui.com)** alone — great a11y primitives, but no styling baseline; we'd end up rebuilding what shadcn already gives us.

---

## 2. State & Data

### [TanStack Query](https://tanstack.com/query) (server cache)

**Chosen** — `@tanstack/react-query` v5 as the single source of truth for the task list. One `useQuery` for reads and four `useMutation`s for writes, all in `frontend/src/hooks/use-tasks.ts`. Wrapped in a `QueryClientProvider` at the root of `app.tsx`.

**Why**

- One query key (`['tasks']`) is the entire contract for invalidation — every mutation calls `invalidateQueries({ queryKey: ['tasks'] })` in `onSettled`, so the cache and the DB can never drift for long.
- The optimistic-update pattern fits in ~15 lines per mutation: `onMutate` cancels in-flight queries, snapshots the previous list, patches the cache with a synthetic row (UUID temp id), and returns `{ previous, tempId }`; `onError` rolls back from `context`; `onSuccess` swaps the synthetic row for the server's authoritative row; `onSettled` revalidates. Cancellation + rollback context are the two pieces that would take real work to replicate by hand.
- `useFilteredTasks` (in `hooks/use-filtered-tasks.ts`) reads from the cache and applies the filter/sort in-render, so the filter store stays purely UI and the cache stays purely server state — no overlap, no risk of double-rendering.
- Plays cleanly with the React 19 + Compiler stack: a `QueryClient` is just a React context boundary at the root, and the `useQuery`/`useMutation` hooks return the same shape every render, which the Compiler can memoize.

**Alternatives**

- **[SWR](https://swr.vercel.app)** — lovely read-side API, but its mutation story (`mutate` + `revalidate`) doesn't give us a typed rollback context out of the box, and its optimistic-update example is shorter on docs than TanStack's.
- **[RTK Query](https://redux-toolkit.js.org/rtk-query-overview)** — pulls us back into Redux and the slices/store/Provider ceremony we already moved away from. Worth it on a team of 20+; overkill for one cache slice.
- **Hand-rolled `useState` + `useEffect`** — fine for one read, but optimistic updates with rollback, request cancellation, and a typed error surface (`ApiError` + `fieldErrors`) take real code to get right; we'd be rebuilding a worse TanStack Query.

### Typed API client (`@/lib/api.ts`)

**Chosen** — A 45-line `fetch` wrapper: `api.get / post / patch / delete`, `API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'`, 204 short-circuits to `undefined`, and an `ApiError` class that carries `status` and the backend's `fieldErrors` map so form-level errors round-trip without an adapter.

**Why**

- One file is the only place to add auth headers, retries, telemetry, or request logging later — the hooks and components stay call-site-clean.
- `fieldErrors` (grouped by dotted path, see `backend/src/schemas/task.ts`) is plumbed through the same `ApiError` the form consumes, so the Zod errors from the backend surface in the same per-field slots as the frontend Zod errors.

**Alternatives**

- **[axios](https://axios-http.com)** — heavier, its interceptor story earns nothing at a five-call API, and the bundle is bigger than the 45 lines we wrote.
- **[ky](https://github.com/sindresorhus/ky)** — nice hooks and retry API, but the surface is overkill for this endpoint set.
- **Raw `fetch` in every hook** — works, but error-shape handling, JSON encoding, and the 204 short-circuit would be duplicated five times.

### [Zustand](https://zustand-demo.pmnd.rs) (filter UI, in-memory)

**Chosen** — One small store, `useTaskFilterStore` in `store/task-filter-store.ts`, holding `filters: TaskFilters` and `setFilter` / `resetFilters`. No `persist`, no provider, no slices.

**Why**

- Filter state is pure UI and benefits from a clean default on every reload — the user lands on the unfiltered list.
- It lives in its own store (separate from `useThemeStore`) so the persistence boundary is one file per concern and we can later add `persist` to the filter store without entangling theme state.
- The task list itself does **not** live here — it's owned by TanStack Query, and the two never overlap.

**Alternatives**

- **URL search params** — more shareable and survives reload, at the cost of a router and a small parsing layer; the next obvious "I'd revisit" item.
- **Local component state** — works, but as soon as `TaskList` and `TaskFilters` need to share the state, the prop drilling starts.
- **`Context` + `useReducer`** — no extra dependency, but re-renders are coarse and selectors require hand-rolled `useSyncExternalStore` work.

### `zustand/middleware` persist → `localStorage` (theme only)

**Chosen** — `useThemeStore` persists `theme: 'light' | 'dark' | 'system'` to `localStorage` under the key `task-manager-theme` (v1). This is the **only** persisted piece of state on this branch.

**Why**

- The theme must be readable before first paint to avoid a flash of wrong theme — an inline script in `index.html` reads the value and applies the `.dark` class synchronously, and `useThemeEffect` keeps it in sync after hydration.
- Task data moved off `localStorage` to the backend; the rest of the UI state (filters, dialog open/close, accordion state) is small and reset-on-reload-friendly.

**Alternatives**

- **Cookies** — fine for cross-tab sync, but `localStorage` is the right shape for a synchronous read at `<script>` time, which is what the no-FOUC flow needs.
- **System theme only** — gives up the user's explicit choice and the `theme === 'system'` listener in `useThemeEffect` is the only piece worth keeping.

### Fractional indexing (`@/lib/indexing.ts`)

**Chosen** — Custom float-based `generateKeyBetween(prev, next)`, O(1) per move, no rebalance.

**Why**

- A drag only rewrites _one_ row's `index` — the rest of the list and the SQLite table stay untouched, and the network call is a single `PATCH /tasks/:id` with `{ index }`.
- Floating-point precision is more than adequate for the realistic depth of reorder (we'd need ~50 consecutive reorders between the same two neighbors before rounding becomes a concern).
- Plain numbers serialize cleanly through JSON and the Drizzle `real` column, and play nicely with `toSorted` in `useFilteredTasks`.

**Alternatives**

- **Full-list rewrite on every move** — simplest code, but O(n) writes per drag and a thrashy network on long lists.

---

## 3. Forms & Validation

### [react-hook-form](https://react-hook-form.com)

**Chosen** — react-hook-form, uncontrolled by default, wired to Zod via `@hookform/resolvers/zod`.

**Why**

- Uncontrolled inputs mean a 100-field form would re-render zero times per keystroke — the form layer stays cheap as the schema grows.
- The `Controller` API is reserved for the one Radix `Select` we use; everything else is a plain `register()` call.
- Built-in `formState`, `reset`, and field-ref ergonomics; pairing with Zod gives us inferred types and a single source of truth for shape + validation.

**Alternatives**

- **[Formik](https://formik.org)** — controlled-by-default, heavier, slower on big forms, and the project is in maintenance mode.
- **[TanStack Form](https://tanstack.com/form)** — excellent and more powerful, but newer; RHF is the well-trodden path with stronger community examples.
- **Native `useState`** — fine for a single field, painful for any real form (manual touched/dirty, manual validation glue, no field arrays).

### [Zod](https://zod.dev)

**Chosen** — Zod for both schema validation and type inference. Two schemas: `taskFormSchema` (base) and `newTaskFormSchema` (base + "no past due date" refine).

**Why**

- One schema is the _type_ (`z.infer<typeof taskFormSchema>`) _and_ the _runtime validator_ — no drift between the two.
- `.refine()` composes cleanly: the create-vs-edit difference is just a single refinement, not a parallel schema tree.
- The `@hookform/resolvers/zod` adapter turns it into a one-liner in `useForm({ resolver: zodResolver(...) })`.

---

## 4. Interaction

### [@dnd-kit/sortable](https://dndkit.com)

**Chosen** — `@dnd-kit/core` + `@dnd-kit/sortable`, with Pointer and Keyboard sensors, vertical list strategy, `closestCenter` collision.

**Why**

- Accessible by default: keyboard sensor + `sortableKeyboardCoordinates` means reordering works for users who can't drag.
- Headless, so we own the visual treatment of the dragged item (opacity, z-index, transitions) without fighting library styles.
- `arrayMove` + our own `reorderTask` action keeps the React state, the Zustand state, and the persisted store all in lockstep.

### [@tanstack/react-virtual](https://tanstack.com/virtual)

**Chosen** — `@tanstack/react-virtual` for the task list, capped at `60vh` with an estimated row height of `76px`.

**Why**

- Headless and tree-shakeable; we wrap it in a tiny `VirtualizedList` so call sites are `renderItem`-style instead of `useVirtualizer`-style.
- Type-safe, no DOM measurement guesswork, and handles dynamic row heights correctly out of the box.
- Keeps the list snappy even with hundreds of tasks — only the visible window actually mounts.

**Alternatives**

- **[react-virtuoso](https://virtuoso.dev)** — more features (sticky headers, dynamic load) but heavier and more opinionated; we'd be paying for capabilities we don't use.
- **[react-window](https://github.com/bvaughn/react-window)** — older, less TS-friendly, and its API is showing its age next to TanStack Virtual.

### [recharts](https://recharts.org)

**Chosen** — recharts for the Statistics accordion (PieChart + BarChart). Loaded with `React.lazy`, split into its own `charts` chunk by Vite.

**Why**

- Declarative React API matches the rest of the codebase — no imperative chart instance to manage.
- Theming via CSS variables (`var(--color-emerald-500)` etc.) means the charts follow the light/dark theme without a re-render.
- Lazy-loaded + manual-chunk-split so the heavy library doesn't bloat the initial vendor bundle.

**Alternatives**

- **[Chart.js](https://www.chartjs.org)** — canvas-based and fast, but imperative and the React integration is bolted on; theming the data colors is clumsier.
- **[Visx](https://airbnb.io/visx)** — lower-level D3 wrappers, more code to write for a two-chart screen.
- **[ECharts](https://echarts.apache.org)** — powerful and feature-complete, but big and canvas-based; overkill for two small charts.

### [sonner](https://sonner.emilkowal.ski)

**Chosen** — sonner for the success toasts on add/update/delete.

**Why**

- Tiny, opinionated defaults, accessible, and the API is a one-liner: `toast.success('Task added')`.
- Stacks cleanly, auto-dismisses, and ships a `<Toaster />` we drop into the root once and forget.

**Alternatives**

- **[react-hot-toast](https://react-hot-toast.com)** — good, but the API surface is looser and the default look is less polished.
- **[react-toastify](https://github.com/fkhadra/react-toastify)** — heavier, more CSS to override, more configuration to ship.

---

## 5. Tooling

### [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) browser provider

**Chosen** — Vitest in browser mode, with the `@vitest/browser-playwright` Chromium provider. Tests live in `__tests__/` folders next to the code they cover.

**Why**

- Tests run in _real_ Chromium, not jsdom — so layout, focus traps, and Radix's a11y behavior are exercised honestly.
- One runner, one config (`vite.config.ts`), zero extra build pipeline. Vitest already understands the Vite alias, the TS path mapping, and the React Compiler output.
- `vitest-browser-react` gives us idiomatic React Testing Library semantics in the real browser.

**Alternatives**

- **[Jest](https://jestjs.io) + [React Testing Library](https://testing-library.com) + jsdom** — the historical default, but jsdom is famously wrong for layout, viewport, and accessibility — all things this app cares about.
- **[Cypress](https://www.cypress.io) Component Tests** — real browser too, but a heavier runner with a separate config and a different mental model from the unit tests.

### [ESLint](https://eslint.org) + [Prettier](https://prettier.io) + [Husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged)

**Chosen** — The well-trodden combo, with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and `eslint-plugin-check-file` for filename and folder casing.

**Why**

- `typescript-eslint` gives type-aware rules that catch real bugs, not just style nits.
- `check-file` enforces `kebab-case` filenames and Next.js-app-router folder casing — conventions stay consistent without manual review.
- Husky + lint-staged keeps every commit clean: `prettier --write` + `eslint .` runs against the staged diff only, so the hooks stay fast.

**Alternatives**

- **[Biome](https://biomejs.dev)** — faster, single binary, but its React-Hooks and TypeScript rules coverage is still thinner than ESLint's in 2026.
- **[simple-git-hooks](https://github.com/toplenboren/simple-git-hooks)** — lighter than Husky, but the ecosystem (lint-staged integration, `npx husky add`) is less common and the migration cost is real.

### [Knip](https://knip.dev)

**Chosen** — Knip for unused files, unused exports, and unused dependencies.

**Why**

- Catches dead code at the _project_ level — files, exports, _and_ dependencies in one pass, which `noUnusedLocals` can't.
- Runs in CI / on demand (`pnpm knip`) without polluting the dev loop.

### [React Compiler](https://react.dev/learn/react-compiler)

**Chosen** — `babel-plugin-react-compiler` enabled through `reactCompilerPreset()` in `vite.config.ts`. Auto-memoization of components and hook output.

**Why**

- Removes the cognitive load of `useMemo` / `useCallback` / `React.memo` from the application code — the compiler memoizes based on referential inputs, just like a careful human would.
- Module-level `const` is the right escape hatch for values that are genuinely constant for the module's lifetime (e.g. `TODAY_STRING = todayIso()` in `task-form.tsx`), instead of a `useMemo(..., [])`.

**Alternatives**

- **Hand-written `useMemo` / `useCallback` / `React.memo`** — error-prone, easy to leak references, and inconsistent across the codebase.
- **[Reselect](https://reselectjs.org)** — great for selector memoization, but only addresses one slice of the problem; it can't prevent a child component from re-rendering on a new parent reference.

---

## 6. Architecture & Conventions

### `@/` path alias

**Chosen** — `@` resolves to `frontend/src`, configured in both `vite.config.ts` and `tsconfig.app.json`.

**Why**

- Imports read like `@/store/task-store` instead of `../../../store/task-store` — readable, refactor-safe, and the same alias works in Vite, Vitest, and TypeScript.
- No runtime cost; the alias is resolved at build time.

**Alternatives**

- **Relative imports everywhere** — works, but the deep paths get unreadable fast in a project with `hooks/`, `lib/`, `components/`, `components/task/`, and `components/ui/`.

### `kebab-case` files, Next.js-app-router folder casing

**Chosen** — Filenames in `src/` are `kebab-case` (e.g. `task-list.tsx`); folders under `src/` (except `__tests__/`) follow Next.js-app-router casing. Both enforced by `eslint-plugin-check-file`.

**Why**

- Matches shadcn's `task-form.tsx`, `task-item.tsx` etc. output — no rename step when a generated component is dropped in.
- The app-router casing is unambiguous for tooling and reads naturally: `components/task/`, `components/ui/`, `hooks/`, `lib/`, `store/`, `schemas/`.

**Alternatives**

- **Camel/Pascal filenames everywhere** — fine, but inconsistent with shadcn's output and harder to keep aligned long-term.
- **No rule** — drift across PRs; new contributors reinvent the convention on every file.

### No manual memoization

**Chosen** — `useMemo`, `useCallback`, and `React.memo` are intentionally absent from application code. The React Compiler does the equivalent skipping automatically.

**Why**

- Less code, fewer bugs: no stale-closure hazards, no accidentally re-created objects flowing into a memoized child.
- Reads more like plain TypeScript — the optimization is invisible, which is the right place for it.
- For values that are genuinely constant for the module lifetime (e.g. today's ISO date used as the `min` of a date input), declare a module-level `const` instead of `useMemo(..., [])`.

**Alternatives**

- **`React.memo` + `useMemo` per component** — the default in most React codebases, but error-prone and noisy; the Compiler renders most of it redundant.

### One Zustand store per concern (no slices)

**Chosen** — Two small stores: `useTaskFilterStore` (filter UI, in-memory) and `useThemeStore` (theme, persisted). The task list itself is owned by the TanStack Query cache, not by a store. No slice composition, no combined mega-store.

**Why**

- Each store has its own concern and (where applicable) its own `persist` key, version, and `partialize` — the persistence boundary is one file, easy to reason about and to test.
- Slices in Zustand work, but the ceremony (slice creator + combine) earns nothing at this size, and we'd lose the clarity of "this is a UI store, that is the server cache."
- `useTaskFilterStore` and `useThemeStore` already live in different files with different concerns; a slice abstraction would be ceremony in search of a problem.

**Alternatives**

- **Single mega-store with slices** — more boilerplate, harder to test persistence boundaries, and we'd lose the one-key-per-concern clarity of two stores.
- **Redux-style slices with a root reducer** — fine in Redux, but Zustand doesn't ship a slice primitive; we'd be hand-rolling a pattern that adds no value here.

---

## What I'd revisit

- **End-to-end coverage is currently thin.** Unit and component tests in `__tests__/` are solid, but no e2e testing — there's no Playwright spec exercising the full add → reorder → complete → delete flow across browsers. I'd add a small smoke suite there as the next step.
- **Docker deployment** The app has no containerization; setup requires manual Node/pnpm install and two terminals. I'd add a single Dockerfile and docker-compose.yml so it deploys anywhere (VPS, Railway, Fly.io) with docker compose up. The approach: multi-stage build (frontend → vite build, backend → tsup bundle), backend serves the built frontend as static files via express.static, and a persistent volume keeps SQLite data across restarts.
