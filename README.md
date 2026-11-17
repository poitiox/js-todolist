# V4.0 Todo List

A React 19.3.1 and TypeScript todo application with task creation, editing, deletion, completion toggling, filtering, completed-task cleanup, local persistence, and light/dark themes. Vite handles development and production builds; strict TypeScript checks, ESLint, and Prettier enforce code quality.

## Development

Use Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`, as specified in `package.json`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use the development server or production preview so that module loading works correctly. Browser storage belongs to the current origin; changing the host or port opens a different storage area.

## Checks and Production Build

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run preview
```

`index.html` loads `src/todo.ts`, which locates the root container and mounts React in StrictMode. TSX uses the automatic `react-jsx` transform without an additional Vite plugin. The build command is `tsc --noEmit && vite build`; generated files go to `dist/` and are excluded from version control.

ESLint 10 uses FlatCompat in `eslint.config.cjs` to load the course-required `.eslintrc.cjs`, keeping one rule definition. Complexity is limited to 10, nesting depth to 3, and explicit `any` is prohibited. These rules report errors, and `npm run lint` also rejects warnings. Both TS and TSX application files are checked.

Run `npm run format` to apply two-space indentation, double quotes, semicolons, and LF line endings. Formatting checks exclude generated output. TypeScript is pinned to 6.0.3 for compatibility with the installed TypeScript ESLint parser; `strict` and the existing strict compiler options remain enabled.

## Theme Context

`ThemeProvider` owns the light/dark theme and exposes the current theme and its state setter through `ThemeContext`. The page container and `ThemeToggle` both consume this Context through `useTheme()`. Calling the Hook outside its Provider throws a clear error.

The theme button updates the page background, content surface, native controls, feedback, and keyboard focus colors. Its accessible name is stable, and its pressed state indicates whether dark mode is active. Switching themes preserves tasks, the active filter, and unsaved input. Theme selection is kept in memory; reloading starts with the light theme.

## Local Persistence

The primary storage key is `todo-v2`. If that key is absent, the application reads the course template's `todos` key. An existing primary value always takes precedence, including an empty array. Invalid primary data produces recovery feedback instead of silently loading a different snapshot.

Task state is restored through a lazy state initializer. Reading catches storage-access and JSON errors, then delegates array and record validation to `parseTodos`. Restored records require a positive safe-integer ID, nonblank text, a Boolean completion state, and unique IDs. Additional fields are discarded.

A single Effect writes to the primary key after the user changes the task list. Its dependencies are the task list and change flag. Initial mounting, filtering, theme changes, and invalid input do not write to storage. Updating save feedback does not trigger another write. If the course template's fallback key was used, the first task change creates the primary record and preserves the fallback record.

StrictMode may invoke initializers and Effects again during development. Initialization only reads storage, and the change flag prevents initial writes, so repeated mounting does not replace saved tasks with an empty list. This synchronous storage Effect creates no subscriptions, timers, or asynchronous work that require cleanup. Saving catches storage errors and shows feedback while keeping the current tasks visible.

To check the course fixture manually, use a fresh browser profile or private window at the application's URL. In DevTools, open Application > Local Storage and add `todos` with this value while leaving `todo-v2` absent:

```json
[{ "id": 1, "text": "Test task", "completed": false }]
```

Reload and confirm that the task appears and the fixture is unchanged. Toggle its completion state and confirm that `todo-v2` contains the updated task while `todos` retains the original fixture. Reload again and confirm that the updated completion state is restored from the primary key.

See the official React references for [Context](https://react.dev/reference/react/useContext), [lazy state initialization](https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state), and [Effect dependencies and cleanup](https://react.dev/reference/react/useEffect).

## Run Tests Manually

```sh
npm run test
```

The script runs `vitest run` once without watch mode. Use `npm run test -- --reporter=verbose` for individual results. Tests are run manually by the user; each completed stage is committed by the user before work continues.

Business tests call the actual model functions. They cover creation, trimming, sequential IDs, invalid and blank input, completion changes, missing tasks, invalid IDs, safe-integer boundaries, and stored-record validation. Successful operations leave their inputs unchanged; rejected operations preserve both list contents and references.

Page regressions load the actual HTML in jsdom and mount the application in StrictMode. They cover task interactions, safe text rendering, storage failures, restoration after remounting, theme changes, primary/fallback storage precedence, invalid JSON, non-array data, and preservation of saved records during initial mounting. Only external browser storage is spied on where needed.

`npm run typecheck` checks application and test sources separately, keeping Node.js globals out of browser code. It does not execute tests; passing type checks does not establish that the test suite passes.

## File Responsibilities

| File                                | Responsibility                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `index.html`                        | React root container and browser entry                                        |
| `src/todo-model.ts`                 | Todo types, creation, completion changes, IDs, and restored-record validation |
| `src/todo.ts`                       | StrictMode setup and React root mounting                                      |
| `src/components/todo-app.tsx`       | Task state, business events, filtering, and persistence coordination          |
| `src/components/todo-form.tsx`      | Controlled input, submission, and input focus                                 |
| `src/components/todo-list.tsx`      | List composition and empty states                                             |
| `src/components/todo-item.tsx`      | Individual task display, editing, and callbacks                               |
| `src/todo-storage.ts`               | Primary/fallback storage reads, primary-key writes, and failure feedback      |
| `src/theme-context.tsx`             | Shared theme state, Provider, and `useTheme`                                  |
| `src/components/theme-toggle.tsx`   | Accessible light/dark theme toggle                                            |
| `src/styles.css`                    | Layout, theme colors, focus indicators, and narrow-screen styles              |
| `tests/todo-model.basic.test.ts`    | Basic creation and completion tests                                           |
| `tests/todo-model.boundary.test.ts` | ID boundaries and stored-record validation tests                              |
| `tests/todo-app.test.ts`            | Page interactions, themes, persistence, and safe text rendering               |
| `dist/`                             | Generated production output; excluded from version control                    |
| `tsconfig.json`                     | Strict browser-source type checking                                           |
| `tsconfig.test.json`                | Test-source type checking                                                     |
| `.eslintrc.cjs`                     | Course-required code quality rules                                            |
| `eslint.config.cjs`                 | Compatibility entry for the current ESLint version                            |
| `.prettierrc.json`                  | Formatting configuration                                                      |
