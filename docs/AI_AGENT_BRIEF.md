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

## Current Working State (Updated Jan 2025)

### ✅ Completed & Working
- **AI SDK Integration**: Full AI SDK implementation with streaming support
  - `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google` installed
  - Server-side streaming via `/api/v1/ai/chats/[id]/messages.post.ts`
  - Dynamic provider selection (openai, anthropic, google)
  - SSE streaming with `text-delta` events
- **Authentication System**: Complete JWT-based auth
  - Login/signup endpoints (`/api/v1/auth/*`)
  - Argon2 password hashing via `@node-rs/argon2`
  - httpOnly cookies + Bearer token support
  - Global auth middleware protecting all `/api/v1/*` routes
  - Auth stores with login/logout/me actions
- **Database & Persistence**:
  - SQLite schema with users, connections, chats, messages tables
  - Database helpers for CRUD operations
  - Dual-layer persistence (localStorage + server sync)
  - Conflict resolution with last-write-wins merge
  - Background sync every 60s
- **State Management**:
  - Auth store (token, user)
  - Users store (SWR cache with TTL)
  - Chat sessions store (DirectorySnapshot with profiles)
  - Chat runtime store (sending state, errors, abort control)
- **Provider Architecture**:
  - Client-side providers: `ai-openai`, `openai` (legacy)
  - Server-side dynamic provider factory
  - Composable-based provider resolution

### 🔧 Recent Fixes (Applied)
1. ✅ **Fixed `useChatProvider.ts`**:
   - Added missing `import { computed } from 'vue'`
   - Added missing `import { useChatSessions } from '@/stores/chat.sessions'`
   - Changed default provider from `'nuxt'` to `'ai-openai'` (valid registry key)
2. ✅ **Fixed `chat.sessions.ts` repository contract**:
   - Store now properly handles `DirectorySnapshot` structure
   - `hydrate()` extracts current profile from snapshot
   - `persist()` builds proper `DirectorySnapshot` with profile wrapper
   - Added `profileId` state for multi-profile support
3. ✅ **Fixed `ChatMessage` type consistency**:
   - `appendMessageAndApplyLimits()` now populates `updatedAt` from `createdAt` if missing
   - Ensures all messages have required `updatedAt` field

## Known Gaps & TODOs (Updated)
1. ~~`app/composables/useChatProvider.ts` issues~~ → **FIXED**
2. ~~`app/stores/chat.sessions.ts` repository contract mismatch~~ → **FIXED**
3. ~~`ChatMessage` type `updatedAt` field missing~~ → **FIXED**
4. **Provider endpoint routing**: Client providers call `/api/v1/ai/chat` but streaming is at `/api/v1/ai/chats/[id]/messages`
   - Need to align client provider endpoints with server streaming API
   - Consider adding multiplexer route or updating provider implementations
5. **Legacy OpenAI endpoints**: `/api/v1/openai/chats.*` still exist alongside AI SDK endpoints
   - Decide: deprecate legacy or keep for backwards compatibility
6. **Testing**: Vitest suite expanding
   - ✅ Coverage for JWT/password utils, auth middleware, provider payloads (incl. error propagation), auth API routes, chat list/proxy/streaming endpoints (SSE mocked + failure paths), `chatRepository` merge/persistence logic, database CRUD/constraints, multi-user isolation, and input validation failure paths
   - Still need chat persistence conflict tests and multi-user authorization edge cases
7. **User Management UI**: Backend ready, UI missing
   - `/api/v1/users` endpoints exist and working
   - Need UI to select/create users
   - Need user picker modal in app shell
8. **Chat Discovery UI**: Backend ready, UI incomplete
   - Need chat list page to browse previous conversations
   - Need "new chat" flow with provider/model selection
   - Need ability to resume existing chats
9. **Multi-provider UI**: Only OpenAI wired up in default session
   - Anthropic and Google providers installed but not exposed in UI
   - Need provider selection dropdown/modal

## Suggested Next Steps (priority order)
1. **Align client-side providers with AI SDK streaming endpoints**
   - Update `ai-openai.ts` to use `/api/v1/ai/chats/[id]/messages` instead of generic `/api/v1/ai/chat`
   - Ensure provider send flow creates chat first, then streams messages
2. **Build chat discovery UI**
   - Create `/chats` page to list user's previous conversations
   - Add "New Chat" button with provider/model selection
   - Wire up chat resume functionality
3. **Build user management UI**
   - Add user selector dropdown in app header/sidebar
   - Create "Create User" modal
   - Persist selected user in auth store
4. **Add provider selection UI**
   - Provider picker modal (OpenAI, Anthropic, Google)
   - Model dropdown based on selected provider
   - Save connection preferences per user
5. **Testing**
   - Auth flow tests (login, signup, protected routes)
   - AI SDK streaming endpoint tests
   - Chat persistence and conflict resolution tests
6. **Clean up legacy code**
   - Decide on legacy `/api/v1/openai/*` endpoints (deprecate or keep)
   - Remove unused provider files if any
7. **Documentation**
   - Document required env vars (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)
   - Add setup guide for database initialization
   - Document authentication flow

## Tooling & Setup Notes
- Install: `bun install` (keep `bun.lock` in sync).
- Dev server: `bun run dev` (requires `.env` with keys; see `nuxt.config.ts` for names).
- DB: `bun run db:migrate` (runs `db/scripts/migrate.js`), `bun run db/scripts/seeds.js you@example.com` to add a user.
- Tests (once added): `bunx nuxt test`.
- ESLint: `bunx eslint . --fix` respecting @antfu config (two spaces, single quotes, no semis).

## Provider Architecture Patterns

This project supports **three types of AI provider integration** to allow maximum flexibility:

### 1. **AI SDK Providers** (`type: 'ai-sdk'`)
- Uses Vercel AI SDK (`@ai-sdk/*` packages) for streaming
- Best for: streaming responses, structured outputs, tool calling
- Example: `ai-openai` provider
- Server endpoint: `/api/v1/ai/chats/[id]/messages` (streaming with SSE)
- Benefits: Built-in streaming, multimodal support, standardized API

### 2. **Proxy Providers** (`type: 'proxy'`)
- Simple HTTP proxy to external AI services
- Best for: third-party aggregators (OpenRouter), custom endpoints
- Example: `openrouter`, `anthropic`, `google` providers
- Server endpoint pattern: `/api/v1/{provider}/chat`
- Benefits: Easy to add new providers, no SDK dependencies
- **Generic factory available**: Use `createProxyProvider(key, endpoint)` to add new providers without creating files

### 3. **Native Providers** (`type: 'native'`)
- Direct integration with provider's SDK
- Best for: provider-specific features, maximum control
- Example: `openai` (native) using OpenAI SDK directly
- Server endpoint pattern: `/api/v1/{provider}/chat`
- Benefits: Full access to provider features, no abstraction overhead

### Adding a New Provider

**Option A: Use the generic proxy factory** (simplest):
```ts
// In app/services/providers/index.ts registry
'my-provider': () => createProxyProvider('my-provider', 'my-provider')
```
Then create `/server/api/v1/my-provider/chat.post.ts` following the OpenRouter pattern.

**Option B: Create a dedicated adapter** (for complex needs):
1. Create `app/services/providers/my-provider.ts`
2. Implement `ProviderAdapter` interface with `key`, `type`, and `chat.send()`
3. Add to registry in `app/services/providers/index.ts`
4. Add metadata to `PROVIDER_INFO` for UI display

### Provider Response Format
All providers must return:
```ts
{
  content: string        // Required: main response text
  reasoning?: string     // Optional: for reasoning models (DeepSeek R1, etc.)
  provider?: string      // Optional: provider identifier
  model?: string         // Optional: model used
}
```

## Key File References
- **Pinia stores**: `app/stores/chat.runtime.ts`, `app/stores/chat.sessions.ts`, `app/stores/auth.ts`, `app/stores/users.ts`
- **Provider system**: `app/services/providers/index.ts` (registry + factory), `app/services/providers/types.ts` (interfaces)
- **Chat repository**: `app/services/chatRepository.ts` (dual-layer persistence with conflict resolution)
- **Server AI SDK**: `server/api/v1/ai/chats/[id]/messages.post.ts` (streaming), `server/utils/ai.ts` (provider factory)
- **Server proxies**: `server/api/v1/openrouter/chat.post.ts`, `server/api/v1/openai/chat.post.ts`
- **DB helpers**: `server/db/chats.ts`, `server/db/connections.ts`, `server/db/users.ts`
- **Auth**: `server/api/v1/auth/*`, `server/utils/auth.ts`, `server/utils/jwt.ts`

Keep this brief updated after each meaningful change so subsequent agents and humans stay aligned.
