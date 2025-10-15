# Nuxt AI Chat - Agent Brief

## Mission Snapshot
- Goal: ship a Nuxt 4 starter that demonstrates secure, proxy-based AI chat (DeepSeek via OpenRouter first, OpenAI-ready).
- Stack: Nuxt 4 + Vue 3 (`<script setup>`), Pinia stores, Nuxt UI, Tailwind v4 tokens, Bun tooling, Bun/SQLite persistence on the server.
- Core idea: client only talks to our Nuxt backend; the backend fans out to OpenRouter/OpenAI/etc. and optionally syncs chats to SQLite.

## Frontend Architecture
- Layout shell in `app/layouts/default.vue` overlays Nuxt UI navigation + Tailwind theme tokens.
- Landing page (`app/pages/index.vue`) markets the starter; DeepSeek chat lives in `app/pages/deep-seek.vue`.
- Stores:
  - `app/stores/chat.sessions.ts` keeps per-session Pinia state (messages, capped flags, char counts).
  - `app/stores/chat.runtime.ts` handles runtime send flow: optimistic user message, provider dispatch, error/cancel handling.
- Shared components under `app/components/` cover transcript, composer, quick prompts, caps alert; rely on Nuxt UI primitives.
- Providers resolved through `app/composables/useChatProvider.ts` -> `app/services/providers/*` to keep chat APIs swappable.

## Backend Architecture
- SQLite schema in `db/migrations/001_init.sql`; Bun scripts manage migrations/seeds (`bun run db:scripts`).
- Low-level DB helpers in `server/db/*.ts` for users, chats, connections.
- REST endpoints under `server/api/v1/`:
  - `/openrouter/chat` posts to OpenRouter with runtime config credentials.
  - `/openai/*` mirrors the same shape and keeps an in-memory directory snapshot (`server/utils/state/openaiDirectory.ts`).
  - `/chats` and `/users` expose CRUD-like proxies onto the SQLite tables.
  - `/sdk/chats/*` targets AI SDK streaming, but imports need cleanup before it works.
- Provider utilities (`server/utils/ai.ts`) wrap `@ai-sdk/*` for streaming support.

## Current Working State (Jan 2025)
- UI renders, Tailwind + Nuxt UI theming in place, and DeepSeek page wires up Pinia + components.
- Server OpenRouter proxy (`server/api/v1/openrouter/chat.post.ts`) is complete and ready once called with credentials.
- SQLite schema, seeds, and list/create chat endpoints are ready for manual use.

## Known Gaps & TODOs
1. `app/composables/useChatProvider.ts` is incomplete:
   - Missing `import { computed } from 'vue'` and `import { useChatSessions } from '@/stores/chat.sessions'`.
   - Uses `ChatProvider` type that no longer exists; should lean on `ChatPort` from `app/services/providers/types.ts`.
   - Defaults to provider `'nuxt'`, but registry uses `'openrouter' | 'openai' | ...`; fix fallback to a real key (likely `'openrouter'`).
2. `app/stores/chat.sessions.ts` expects `{ sessions, currentSessionId }` from `chatRepository.load()`, yet the repository currently returns a `DirectorySnapshot`.
   - Decide: either simplify repository to local-only session store or re-introduce profile snapshot shape; currently hydration fails silently.
   - Same mismatch for `chatRepository.save(...)`: Pinia store calls `save(sessions.value, currentSessionId.value)` while implementation expects a single snapshot.
3. Provider send path: `useChatProvider` ultimately calls `$fetch('/api/v1/chat', ...)` via `nuxtProvider`, but there is no `/api/v1/chat` endpoint. Either:
   - Add a multiplexer route (preferred) that inspects `{ provider }` and dispatches, or
   - Update providers to hit the existing `/api/v1/{provider}/chat` endpoints.
4. `ChatMessage` type (`app/types/index.ts`) marks `updatedAt` as required, yet new messages added in stores omit it. Pick a direction: mark optional or populate `updatedAt`.
5. `server/api/v1/sdk/chats/[id]/messages.post.ts` imports `db` from `'@/server/utils/main'`, which does not exist. Should import from `@/server/db/main` and possibly reuse helpers.
6. `/server/api/v1/openai/chats.*` currently stores snapshots in-memory only; decide whether to persist to SQLite or keep as demo data.
7. Testing: no specs under `tests/` yet. Need at least smoke tests for DeepSeek page and server proxies per repo guidelines.
8. User management flow is missing end-to-end support:
   - Ensure the `/api/v1/users` routes let us add a user programmatically; define the request/response contract.
   - Build UI to choose the active user, including a modal to create one from the app shell.
9. Chat discovery flow still TBD:
   - After selecting a user, add a provider/model picker (start with OpenAI SDK + `gpt-5-nano`).
   - Create a chat list page to inspect previous conversations, spawn a new chat, and open an existing transcript.

## Suggested Next Steps (priority order)
1. Fix provider plumbing (`useChatProvider`, `/api/v1/chat` route or per-provider URLs) so DeepSeek chat can actually send/receive.
2. Reconcile `chatRepository` contract with Pinia session store; ensure hydration/persist flow works in browser and falls back gracefully server-side.
3. Wire OpenRouter response into transcript with reasoning bubble (already supported in `MessageList.vue`).
4. Close the user-management loop: verify `/api/v1/users` POST works, surface it through a modal on the user-select page, and persist the chosen user in Pinia.
5. Add provider/model selection step before entering the chat (OpenAI SDK + `gpt-5-nano` for now).
6. Build the chat directory view so users can list, create, and resume chats against the chosen provider.
7. Add minimal Vitest/Nuxt tests: DeepSeek page renders prompts, `/api/v1/openrouter/chat` handles missing key, etc.
8. Harden backend streaming SDK route or remove it if out-of-scope to reduce confusion.
9. Document env vars (`OPENROUTER_API_KEY`, etc.) in README (currently boilerplate).

## Tooling & Setup Notes
- Install: `bun install` (keep `bun.lock` in sync).
- Dev server: `bun run dev` (requires `.env` with keys; see `nuxt.config.ts` for names).
- DB: `bun run db:migrate` (runs `db/scripts/migrate.js`), `bun run db/scripts/seeds.js you@example.com` to add a user.
- Tests (once added): `bunx nuxt test`.
- ESLint: `bunx eslint . --fix` respecting @antfu config (two spaces, single quotes, no semis).

## Key File References
- Frontend entry: `app/pages/deep-seek.vue`
- Pinia stores: `app/stores/chat.runtime.ts`, `app/stores/chat.sessions.ts`
- Provider registry: `app/services/providers/index.ts`, `app/services/providers/nuxt.ts`
- Chat repository: `app/services/chatRepository.ts`
- Server proxies: `server/api/v1/openrouter/chat.post.ts`, `server/api/v1/openai/chat.post.ts`
- DB helpers: `server/db/chats.ts`, `server/db/connections.ts`, `server/db/users.ts`

Keep this brief updated after each meaningful change so subsequent agents and humans stay aligned.
