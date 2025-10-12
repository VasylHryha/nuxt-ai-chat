# Repository Guidelines

## Project Structure & Module Organization
Nuxt 4 drives the app shell in `app/` and route views in `pages/`; share cross-page UI in `app/components/` and co-locate feature-specific components with their parent page. Server handlers for chat and proxy logic live in `server/api/`, while static assets such as icons and manifest files sit in `public/`. Keep configuration-centric code (e.g., `nuxt.config.ts`, `tsconfig.json`, `eslint.config.mjs`) at the root so infrastructure changes are easy to review.

## Build, Test, and Development Commands
Install dependencies with `bun install` to stay in sync with `bun.lock`. Use `bun run dev` for a hot-reloading local environment, `bun run build` to generate the production bundle, and `bun run preview` to smoke-test the built output. `bun run generate` produces a prerendered static site when you need static hosting.

## Coding Style & Naming Conventions
TypeScript and `<script setup>` single-file components are the default. The shared `@antfu/eslint-config` enforces two-space indentation, single quotes, no semicolons, and sorted imports; run `bunx eslint . --fix` before opening a pull request. Prefer PascalCase for Vue components (`ChatPanel.vue`), camelCase for composables (`useChatSession.ts`), and kebab-case for file-system routes (e.g., `pages/chat-history.vue`). Tailwind utility classes should be grouped by layout → spacing → color for clarity.

## Testing Guidelines
Leverage `@nuxt/test-utils` with Vitest to cover both components and server routes. Place specs in `tests/` mirroring the source path (`tests/pages/chat-history.spec.ts`) and name async helpers with the `waitFor...` prefix. Run the suite with `bunx nuxt test` (falls back to Vitest runner) and gate merges on the suite passing. Target at least smoke coverage for every new route or server handler; add snapshot assertions for generated prompts when practical.

## Commit & Pull Request Guidelines
There is no existing history, so adopt Conventional Commits (`feat: add streaming chat view`) to keep changelog automation viable. Limit commits to a focused change-set and include refactors under `refactor:` rather than `feat:`. Pull requests should describe intent, testing performed, and any environment changes; attach screenshots for UI updates and link relevant issues or discussions.

## Environment & Configuration Tips
Runtime keys are managed through Nuxt `runtimeConfig`. Define `OPENROUTER_API_KEY`, `OPENROUTER_BASE`, `OPENROUTER_MODEL`, and `APP_TITLE` in a local `.env` (never commit secrets) and restart `bun run dev` after changing them. When adding new configuration, surface public values under `runtimeConfig.public` so they remain accessible to the client bundle while keeping sensitive tokens private.
