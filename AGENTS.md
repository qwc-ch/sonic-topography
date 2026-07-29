# Sonic Topography — AGENTS.md

## Quick start

```bash
pnpm install
pnpm dev          # Vite on http://localhost:3000
pnpm build        # vite build
pnpm lint         # tsc --noEmit (typecheck only; no ESLint/prettier)
pnpm test         # vitest run
```

`lint -> build` is the standard verification order.

## Structure (single-package Vite + React + Three.js)

- `src/main.tsx` → `src/App.tsx` → `src/components/UI/UI.tsx` (big, ~1300 lines)
- `src/components/AudioVisualizer/MapScene.tsx` — 3D scene via `@react-three/fiber`
- `src/lib/AudioEngine.ts` — audio analysis, feeds visualizer
- `src/lib/metingConfig.ts` — default playlist ID, server, and API URLs

## Path alias

`@/` maps to project root, e.g. `import '@/src/lib/...'` or `import '@/src/components/...'`.

## Music / Playlist config

Everything in `src/lib/metingConfig.ts`:
- `metingConfig.meting.id` — default playlist ID (Netease `17426009449`)
- `metingConfig.meting.server` — platform (`netease`/`tencent`/`kugou`/`xiami`/`baidu`)
- `metingConfig.meting.api` + `fallbackApis` — API endpoint URLs

## Tests

Two styles coexist:

| Style | Files | Run via |
|---|---|---|
| Flat `node:assert` (no describe/it) | `src/lib/*.test.ts` | `npm test` (vitest run) or `npx tsx <file>` |
| vitest describe/it | `src/**/*.vitest.test.tsx` | `npm test` |

Many flat tests mock `localStorage` with a `Map` at the top level. They all share the same suite (all 20 files run together but each only has 1 test). Currently all 20 fail.

For focused verification: `npx tsx src/lib/<specific-test>.test.ts`

## Vite dev server quirks

- Port 3000, `--host` exposed
- HMR can be disabled: `DISABLE_HMR=true pnpm dev`
- In AI Studio / restricted envs: HMR watch may need `DISABLE_HMR=true`

## Codebase conventions

- **No generated code, no migrations, no codegen**
- Styles: Tailwind v4 with inline `style={{}}` overrides via computed theme colors
- UI state: all React `useState` inside `UI.tsx` (no external store)
- Display settings persisted to `localStorage` via `src/lib/displaySettings.ts`
- Single `App.tsx` owns theme/rotation/groundEq state and passes as props to `UI` and `MapScene`
- Most UI panel logic lives in `src/components/UI/UI.tsx` (not split into smaller components)

## Stale docs

`docs/code-map.md` references `desktop/`, `server/`, `local-server.mjs`, and older patterns that no longer exist. **Trust executable source (config/ts/scss) over prose docs.**

## Constraints

- `.env*` files are gitignored; there is no `.env.example`
- Do not commit `dist/`, `release/`, `data/`, `updates/`, local `data/playlists.json`, or any account cookies
- The sidebar is hidden by default; click the gear icon (top-left) to open
