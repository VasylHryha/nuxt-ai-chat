# Nuxt AI Chat - Project Status (Jan 2025)

## What We're Building
- A Nuxt 4 starter that showcases secure AI chat flows: the browser talks to our Nuxt server, which proxies OpenRouter/OpenAI (DeepSeek reasoning model is the first demo).
- Reusable UI (Nuxt UI + Tailwind v4) and Pinia stores so we can drop in additional providers later without reworking the front end.
- Optional SQLite persistence so teams can keep chat history tied to users and provider connections.

- **Frontend:** Nuxt 4, Vue 3 `<script setup>`, Pinia, Nuxt UI, Tailwind v4 design tokens in `app/assets/main.css`.
- **Server:** Nuxt server routes under `server/api/v1`, Bun/SQLite database layer (`db/migrations/001_init.sql`), provider adapters using `@ai-sdk/*`.
- **Tooling:** Bun scripts for dev/build, ESLint via `@antfu`, migrations/seeds in `db/scripts`.

## What's Working
- Landing page and DeepSeek chat UI render correctly with prompts, composer, transcript, and caps alert states.
- Pinia runtime store (`app/stores/chat.runtime.ts`) handles optimistic user message queuing and will attach provider responses once the backend is wired.
- OpenRouter proxy route (`server/api/v1/openrouter/chat.post.ts`) is ready; just needs environment keys.
- Database schema + helper functions exist for users, connections, chats, messages; migrations and seed script run with Bun.

## Open Issues Before Demo
- Frontend provider bridge still points to `/api/v1/chat`, which is not implemented; update providers to call existing per-provider endpoints or add the mux route.
- `chatRepository` contract and Pinia session store disagree on data shape (`DirectorySnapshot` vs `{ sessions, currentSessionId }`), so hydration/persistence is currently broken.
- Some TypeScript mismatches (e.g., `ChatMessage.updatedAt`, missing imports in `useChatProvider`) need a quick pass so the app compiles.
- Streaming SDK route under `server/api/v1/sdk` references a non-existent `@/server/utils/main`; either fix import & wiring or park it to avoid confusion.
- No automated tests yet; repo guidelines call for at least smoke tests covering the new route and page.
- User journey is incomplete: we need a selectable user list, a modal to add users via the `/api/v1/users` API, a provider/model picker (OpenAI SDK + `gpt-5-nano` initially), and a chat directory page to view, create, and reopen conversations.

## Suggested Next Moves
1. Fix provider wiring + `/api/v1/chat` story so DeepSeek messages travel end-to-end.
2. Reconcile the chat repository with the Pinia store (either keep local storage simple or finish the directory snapshot approach).
3. Finish the user flow: verify the add-user API, ship the user-select page with create-user modal, then introduce provider/model selection and the chat list view (new chat + existing transcript).
4. Patch the TypeScript errors, then run through a manual chat to confirm OpenRouter responses arrive.
5. Add a README env section and first Vitest smoke tests to lock regressions.

Ping the AI brief (`docs/AI_AGENT_BRIEF.md`) for lower-level TODOs when you dive into implementation.
