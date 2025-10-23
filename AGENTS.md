# AGENTS.md

This document keeps every AI coding agent (Claude Code, GPT-based tools, etc.) aligned when contributing to this repository. Treat it as the shared source of truth and keep it in sync with `CLAUDE.md`. If any guidance changes in one file, mirror it here.

## Project Overview

Nuxt 4 AI Chat Starter with secure multi-provider integration (OpenAI, Anthropic, Google, OpenRouter), JWT auth, SQLite persistence, and Tailwind v4 styling. The client never talks directly to providers—everything flows through the Nuxt backend.

## Essential Reading (before touching code)

1. `docs/AI_PLAYBOOK.md` – mandatory workflow rules, planning requirements
2. `docs/AI_AGENT_BRIEF.md` – architecture, data flow, provider strategy
3. `CHAT_HISTORY_FEATURE.md` – how chat history is stored and synced
4. `docs/CHAT_HISTORY_ARCHITECTURE.md` – diagrams and deeper context
5. `TODO.md` – current priorities
6. `CONTRIBUTING.md` – workflow quick reference

## Operating Rules For All Agents

- Stay token-efficient: ask focused questions with full context.
- Plan first for medium/large changes; follow the playbook approval flow.
- Run relevant tests (`bun test`, targeted suites) before finishing.
- Keep docs in sync (README, briefs, TODO) whenever behavior changes.
- Security first: never expose secrets, always respect middleware-authenticated `event.context.user`.

## Development Workflow

```bash
bun run dev          # local dev (avoid --bun flag)
bun run build        # production build
bun run preview      # preview production build
bun run db:migrate   # apply migrations
bun db:seed <email>  # seed user (password: "password")
bunx eslint . --fix  # lint with shared config
bunx tsc --noEmit    # type-check
bun test             # run test suite (bun test auth / --coverage for filters)
```

Install dependencies with `bun install` to remain aligned with `bun.lock`.

## Architecture Quick Reference

- **Provider tiers**: AI SDK (`type: 'ai-sdk'`), Proxy (`type: 'proxy'`), Native (`type: 'native'`). All registered in `app/services/providers/index.ts` and consumed through `useChatSession({ type })`.
- **Repository → Store → Component** pattern: keep I/O in repositories, orchestration in Pinia stores, and UI logic in components.
- **Nuxt auto-imports**: do not manually import `server/utils/*`, `composables/*`, or `stores/*`. Import database modules, types, or third-party packages explicitly when needed.
- **Auth**: `server/middleware/01.auth.ts` validates every request; `app/middleware/auth.global.ts` guards client routes. Trust `event.context.user`.
- **Chat persistence**: localStorage primary, SQLite secondary, last-write-wins merge with periodic background sync via `chatRepository.startBackgroundSync()`.

## Database & Security

- Schema: `users`, `credentials`, `connections`, `chats`, `messages` (see `db/migrations/001_init.sql`).
- SQLite handled with `bun:sqlite` helpers in `server/db`.
- JWT: HS256, 7-day TTL in dev; issue tokens via middleware, store in httpOnly cookies.
- Passwords: Argon2id (`@node-rs/argon2`); never leak hashes or secrets in API responses.

## Coding Standards

- Files: components `PascalCase.vue`; composables/stores `camelCase.ts`; API routes `lowercase.method.ts`.
- DB fields use `snake_case`; TypeScript values use `camelCase`; types are `PascalCase`; constants `UPPER_SNAKE_CASE`.
- Error handling: log details server-side, return friendly `createError` messages; use `fetchApi`/`fetchStream` wrappers on the client.
- Avoid `any`; prefer `unknown` in catch blocks and provide real types.

## Testing Expectations

- Tests live in `tests/`, mirroring source structure.
- Use `@nuxt/test-utils` with Vitest harness (`tests/setup/test-env.ts` handles SQLite, mocks, and `__NUXT_RESET_DB__` hook).
- Target at least smoke coverage for every new route, provider, or server handler; add snapshots for generated prompts when practical.

## Common Tasks

- **New provider**: extend `app/services/providers/index.ts`, add a streaming endpoint under `server/api/v1/<provider>/chat.stream.post.ts`, configure `runtimeConfig`, and update `.env`.
- **New API endpoint**: create `server/api/v1/<resource>/<action>.<method>.ts`, rely on `event.context.user`, return DTOs, and add tests.
- **New API client**: define types in `app/types/api.ts`, add client in `app/services/api`, rely on `fetchApi` helpers, and import via composables.
- **New Pinia store**: `app/stores/<name>.ts`, isolate I/O in repositories, expose state/actions via `return { ... }`.

## Work Priorities & Housekeeping

1. P0 – unblockers (broken builds/tests, auth failures)
2. P1 – safety (security, data integrity)
3. P2 – user value
4. P3 – maintainability
5. P4 – polish

Keep `README.md`, `AI_AGENT_BRIEF`, and `TODO.md` aligned with implemented changes.

## Environment & Configuration

`runtimeConfig` stores secrets; expose only safe fields under `runtimeConfig.public`. Maintain `.env` with `DATABASE_URL`, `JWT_SECRET`, and provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`); never commit secrets.

## Additional Resources

- Nuxt 4 Docs – https://nuxt.com/docs
- Vercel AI SDK – https://sdk.vercel.ai/docs
- Pinia – https://pinia.vuejs.org/
- Nuxt UI – https://ui.nuxt.com/
- Tailwind v4 – https://tailwindcss.com/blog/tailwindcss-v4-alpha

## Final Reminders

- Be deliberate with tokens and prompts.
- Medium/big work requires a written plan in the conversation before coding.
- Run tests and linting relevant to your changes.
- Keep docs synchronized and surface any risks early.
- Never expose secrets; validate inputs rigorously.
