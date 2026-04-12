# AGENTS.md

## Project

Astro v6 landing page deployed to Cloudflare (SSR via `@astrojs/cloudflare` adapter).

## Commands

- `pnpm dev` — dev server on `localhost:4321`
- `pnpm build` — production build to `./dist/`
- `pnpm preview` — local preview of production build
- `pnpm generate-types` — generate `worker-configuration.d.ts` from `wrangler.jsonc` bindings

There are no lint, format, typecheck, or test scripts. Use `pnpm build` as the verification step after changes.

## Stack

- **Package manager**: pnpm (not npm/yarn)
- **Node**: >=22.12.0
- **Vite**: overridden to v7 in package.json overrides
- **Tailwind CSS v4**: CSS-first config (`@import "tailwindcss"` in `src/styles/global.css`), no `tailwind.config.js`
- **TypeScript**: strict config extending `astro/tsconfigs/strict`

## Architecture

- Entry point: `src/pages/index.astro`
- Layout: `src/layouts/Layout.astro` (imports `global.css`)
- Cloudflare config: `wrangler.jsonc` (compatibility date, assets binding)
- `pnpm-workspace.yaml` only allows builds for esbuild and sharp