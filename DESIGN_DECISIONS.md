# Design Decisions

> Why this stack, what I weighed, and what I'd revisit. Written as interview prep — every claim below is something I'd defend if asked.

## Stack at a glance

| Category             | Choice                                         |
| -------------------- | ---------------------------------------------- |
| Framework            | React 19 + TypeScript + Vite 8                 |
| Styling              | Tailwind CSS v4 + shadcn/ui (radix-vega)       |
| State                | Zustand + persist → localStorage               |
| Reorder algorithm    | Custom fractional indexing                     |
| Forms & validation   | react-hook-form + Zod                          |
| Drag, virtual, chart | @dnd-kit + @tanstack/react-virtual + recharts  |
| Toasts               | sonner                                         |
| Tests                | Vitest in real Chromium (Playwright browser)   |
| Quality              | ESLint + Prettier + Husky + lint-staged + Knip |
| Performance          | React Compiler (auto-memoization)              |

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

- **[Next.js](https://nextjs.org)** — would force app-router conventions, RSC boundaries, and a server runtime we don't need for a localStorage-only SPA.
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

### [Zustand](https://zustand-demo.pmnd.rs)

**Chosen** — Zustand, one store per concern, no slices, no provider.

**Why**

- The `create()` API is the smallest possible surface for a store — no actions object, no reducers, no boilerplate to add a new mutation.
- Selectors are first-class: `useTaskStore((s) => s.tasks)` only re-renders the subscriber when _that slice_ changes, which keeps the virtualized list cheap.
- Plays cleanly with `persist` and with the rest of the React 19 + Compiler stack — no provider tree, no context boundaries.

**Alternatives**

- **[Redux Toolkit](https://redux-toolkit.js.org)** — excellent for large teams, but the ceremony (slices, reducers, action types) is overkill for two stores and ~10 actions.
- **[Jotai](https://jotai.org)** — beautiful for atom-shaped state; less natural when the domain is "a list of tasks + a few filters," and its persistence story is less turnkey.
- **`Context` + `useReducer`** — no extra dependency, but re-renders are coarse, there's no built-in persistence, and selectors require hand-rolled `useSyncExternalStore` work.

### `zustand/middleware` persist → `localStorage`

**Chosen** — Persist middleware, writing only `tasks` to `localStorage` under the key `task-manager-store` (v1). Filters are runtime-only.

**Why**

- `partialize` lets us pick exactly what hits disk — we persist `tasks` but not `filters`, so the user gets a clean default-filter experience on every reload.
- Versioned (`version: 1`) so the shape can evolve safely via `migrate` when we need to.

**Alternatives**

- **[IndexedDB via Dexie](https://dexie.org)** — would buy us async writes and large capacity, but our working set is a few hundred KB at most; the async API is overkill and complicates SSR-shaped tests.
- **`sessionStorage`** — wrong persistence semantics; tasks would vanish at the end of every tab.
- **Custom storage adapter** — we'd reinvent the wheel and lose versioning, migrations, and the cross-tab story for free.

### Fractional indexing (`@/lib/indexing.ts`)

**Chosen** — Custom float-based `generateKeyBetween(prev, next)`, O(1) per move, no rebalance.

**Why**

- A drag only rewrites _one_ row's `index` — the rest of the list and the localStorage payload stay untouched.
- Floating-point precision is more than adequate for the realistic depth of reorder (we'd need ~50 consecutive reorders between the same two neighbors before rounding becomes a concern).
- Plain numbers serialize cleanly into the persisted store and play nicely with `toSorted` in the `useFilteredTasks` hook.

**Alternatives**

- **Full-list rewrite on every move** — simplest code, but O(n) writes per drag and a thrashy localStorage on long lists.

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

**Chosen** — Two small stores: `useTaskStore` (tasks + filters) and `useThemeStore` (theme). No slice composition, no combined mega-store.

**Why**

- Each store has its own `persist` key, version, and `partialize` — the persistence boundary is one file, easy to reason about and to test.
- Slices in Zustand work, but the ceremony (slice creator + combine) earns nothing at this size.
- `useTaskStore` and `useThemeStore` already live in different files with different concerns; a slice abstraction would be ceremony in search of a problem.

**Alternatives**

- **Single mega-store with slices** — more boilerplate, harder to test persistence boundaries, and we'd lose the one-key-per-concern clarity of two stores.
- **Redux-style slices with a root reducer** — fine in Redux, but Zustand doesn't ship a slice primitive; we'd be hand-rolling a pattern that adds no value here.

---

## What I'd revisit

- **End-to-end coverage is currently thin.** Unit and component tests in `__tests__/` are solid, but no e2e testing — there's no Playwright spec exercising the full add → reorder → complete → delete flow across browsers. I'd add a small smoke suite there as the next step.
- **Docker deployment** The app has no containerization; setup requires manual Node/pnpm install serve with terminals. I'd add a single Dockerfile and docker-compose.yml so it deploys anywhere (VPS, Railway, Fly.io) with docker compose up.
