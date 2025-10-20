# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Nuxt 4 AI Chat Starter** demonstrating secure multi-provider AI integration with JWT authentication, chat history management, and SQLite persistence. Built with Nuxt 4, Vue 3, Pinia, Bun, TypeScript, Tailwind v4, and Vercel AI SDK.

**Core Philosophy**: Client only talks to Nuxt backend; backend handles all provider communication and persistence.

**Key Features**:
- ✅ Multi-provider AI chat (OpenAI, Anthropic, Google, OpenRouter)
- ✅ Complete chat history system (create, store, resume, delete)
- ✅ JWT authentication with Argon2 password hashing
- ✅ Real-time message persistence to SQLite
- ✅ Search and filter chats by provider, date, and content

## Essential Reading

**BEFORE making ANY code changes**, read these docs in order:
1. **[docs/AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md)** - MANDATORY work guidelines, patterns, and best practices
2. **[docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md)** - Detailed architecture and system design
3. **[CHAT_HISTORY_FEATURE.md](./CHAT_HISTORY_FEATURE.md)** - Chat history implementation guide
4. **[docs/CHAT_HISTORY_ARCHITECTURE.md](./docs/CHAT_HISTORY_ARCHITECTURE.md)** - Detailed architecture diagrams
5. **[TODO.md](./TODO.md)** - Current priorities and tasks
6. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Quick reference for workflows

## Development Commands

```bash
# Development
bun run dev                          # Start dev server (http://localhost:3000)

# Database
bun run db:migrate                   # Run migrations (creates schema)
bun run db/scripts/seeds.js <email>  # Seed test user (password: "password")

# Production
bun run build                        # Build for production
bun run preview                      # Preview production build

# Code Quality
bunx eslint . --fix                  # Lint and fix code
bunx tsc --noEmit                    # Type check (no emit)

# Testing
bun test                             # Run all tests
bun test auth                        # Run tests matching "auth"
bun test --coverage                  # Generate coverage report
```

## Architecture Patterns

### Three-Tier Provider System

This project supports three AI provider integration patterns. Choose based on your needs:

**1. AI SDK Providers** (`type: 'ai-sdk'`)
- Uses Vercel AI SDK with SSE streaming
- Best for: Streaming, structured outputs, multimodal
- Example: OpenAI via `/api/v1/ai/chats`
- Client: `new Chat()` from `@ai-sdk/vue`

**2. Proxy Providers** (`type: 'proxy'`)
- Simple HTTP proxy to external APIs
- Best for: Quick integration (5 min setup)
- Factory: `createProxyProvider(key, endpoint)`
- Example: OpenRouter at `/api/v1/openrouter/chat.post.ts`

**3. Native Providers** (`type: 'native'`)
- Direct SDK integration with full features
- Best for: Provider-specific capabilities
- Example: `openai.native.ts` using OpenAI SDK directly

All providers register in `app/services/providers/index.ts` with metadata in `PROVIDER_INFO`.

### Repository-Store-Component Pattern

**Clear separation of concerns:**

```typescript
// ✅ Repository: Pure I/O, no state
export const chatRepository = {
  async load(): Promise<DirectorySnapshot> { /* localStorage */ },
  async save(snapshot: DirectorySnapshot): Promise<void> { /* localStorage */ }
}

// ✅ Store: State management + orchestration
export const useChatSessions = defineStore('chat.sessions', () => {
  const sessions = ref<Record<string, Session>>({})
  async function hydrate() {
    const snapshot = await chatRepository.load()  // Use repo
    // ... process into state
  }
  return { sessions, hydrate }
})

// ✅ Component: UI only
<script setup>
const sessions = useChatSessions()  // Use store
</script>
```

### Nuxt Auto-Imports (Critical!)

**DO NOT manually import these** - Nuxt auto-imports them:

**Server-side auto-imports:**
- `server/utils/*.ts` → All exports globally available
- Examples: `hashPassword()`, `signJWT()`, `verifyJWT()`, `setAccessCookie()`

**Client-side auto-imports:**
- `composables/*.ts` → Functions starting with `use`
- `stores/*.ts` → Pinia stores (via `useStoreName()`)
- `components/*.vue` → Vue components

```typescript
// ✅ Good: Let Nuxt auto-import
export default defineEventHandler(async (event) => {
  const hash = await hashPassword('password')  // Auto-imported!
  const token = signJWT(payload, options)      // Auto-imported!
})

// ❌ Bad: Manual imports (causes issues)
import { hashPassword } from '@/server/utils/password'  // NOT NEEDED!
```

**When you DO need imports:**
- Database functions from `server/db/*.ts`
- Types and interfaces
- Third-party packages

### Dual-Layer Auth Protection

**Server middleware** (`server/middleware/01.auth.ts`):
- Runs on ALL API requests
- Whitelists: `/api/v1/auth`, `/api/_nuxt_icon`, `/favicon.ico`
- Verifies JWT from cookie or Bearer header
- Attaches `event.context.user` for handlers

**Client middleware** (`app/middleware/auth.global.ts`):
- Runs on ALL route navigations
- Whitelists: `/`, `/auth/login`, `/auth/signup`
- Redirects to login with `?redirect={fullPath}` if not authenticated

### Dual-Layer Chat Persistence

**Architecture:**
- **Primary**: localStorage (fast, offline-first)
- **Secondary**: SQLite via `/api/v1/chats` (sync, multi-device)
- **Conflict resolution**: Last-write-wins merge on `updatedAt` timestamps
- **Background sync**: Every 60 seconds via `chatRepository.startBackgroundSync()`

**Repository**: `app/services/chatRepository.ts` handles load/save/sync

## Database Schema

```sql
users              -- User accounts (id, email, name)
credentials        -- Argon2 password hashes (user_id, password_hash)
connections        -- AI provider configs per user (provider, model, api_key)
chats              -- Conversation threads (user_id, connection_id, title)
messages           -- Message history (chat_id, role, content, timestamps)
```

**Migration**: `db/migrations/001_init.sql`
**Types**: `db/types.ts` (DB rows) vs API DTOs (camelCase)

## Key File Locations

```
app/
├── composables/useChatProvider.ts   # Provider resolution logic
├── services/
│   ├── providers/                   # AI provider adapters
│   │   ├── index.ts                 # Registry + factory
│   │   ├── types.ts                 # Provider interfaces
│   │   ├── ai-openai.ts             # AI SDK OpenAI
│   │   ├── openai.native.ts         # Native OpenAI
│   │   └── openrouter.ts            # Proxy OpenRouter
│   ├── chatRepository.ts            # Chat persistence layer
│   ├── usersRepository.ts           # User data access
│   └── limits.ts                    # Message limits (50 msgs, 100k chars)
├── stores/
│   ├── auth.ts                      # Auth state (login/signup/me/logout)
│   ├── users.ts                     # User list (SWR, 1min TTL)
│   ├── chat.sessions.ts             # Chat sessions + profiles
│   └── chat.runtime.ts              # UI state (sending, errors, abort)

server/
├── api/v1/
│   ├── ai/chats/index.post.ts       # AI SDK streaming (SSE)
│   ├── auth/*.post.ts               # Login, signup, logout, me
│   ├── chats/
│   │   ├── index.get.ts             # List chats (with filters, message count, preview)
│   │   ├── create.post.ts           # Create new chat
│   │   ├── [chatId].get.ts          # Get chat with messages
│   │   ├── [chatId].delete.ts       # Soft delete chat
│   │   └── [chatId]/messages.post.ts # Add message to chat
│   ├── users/index.get.ts           # User management
│   └── {provider}/chat.post.ts      # Provider-specific endpoints
├── db/
│   ├── main.ts                      # DB instance
│   ├── users.ts, chats.ts           # Query helpers
│   ├── messages.ts                  # Message CRUD operations
│   └── connections.ts               # Connection queries
├── middleware/
│   ├── 00.logs.ts                   # Request logging
│   └── 01.auth.ts                   # JWT verification (CRITICAL)
└── utils/
    ├── auth.ts                      # Auth helpers (auto-imported)
    ├── jwt.ts                       # Sign/verify JWT (auto-imported)
    ├── password.ts                  # Argon2 hash/verify (auto-imported)
    └── validators.ts                # Email validation (auto-imported)

db/
├── migrations/001_init.sql          # Database schema
└── scripts/
    ├── migrate.js                   # Migration runner
    └── seeds.js                     # Seed test users
```

## Security Rules

### JWT
- Algorithm: HS256 only
- TTL: 7 days (development), 1 hour (production recommended)
- Claims: `{ sub: userId, email, iss: 'nuxt-ai-chat' }`
- Verification: Once per request in middleware
- Storage: httpOnly cookie (client never sees token)

### Passwords
- Algorithm: Argon2id via `@node-rs/argon2`
- Storage: Separate `credentials` table
- Never join with users in public APIs
- Timing-safe comparison

### API Responses
```typescript
// ❌ NEVER return these
{ password: '...', password_hash: '...', jwt_secret: '...', api_key: '...' }

// ✅ ALWAYS return clean DTOs
{ id: '...', email: '...', createdAt: '...' }
```

### Auth Pattern
```typescript
// ✅ Good: Trust middleware verification
export default defineEventHandler((event) => {
  const user = event.context.user  // Already verified by middleware
  return db.getUserChats(user.id)
})

// ❌ Bad: Don't trust headers/query
export default defineEventHandler((event) => {
  const userId = getHeader(event, 'x-user-id')  // UNSAFE!
})
```

## Coding Standards

### Naming Conventions
- **Files**:
  - Components: `PascalCase.vue`
  - Composables: `camelCase.ts` starting with `use`
  - Stores: `camelCase.ts`
  - API routes: `lowercase.method.ts` (e.g., `login.post.ts`)
- **Variables**:
  - Database: `snake_case` (e.g., `created_at`, `user_id`)
  - TypeScript: `camelCase` (e.g., `createdAt`, `userId`)
  - Types: `PascalCase` (e.g., `AuthUser`, `ChatMessage`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `JWT_EXPIRY`)

### Type Separation
```typescript
// Database types (server/db/types.ts)
export interface UserRow {
  id: string
  email: string
  created_at: number  // Unix timestamp
}

// API DTOs (types.ts)
export interface AuthUser {
  id: string
  email: string
  createdAt: string  // ISO 8601
}
```

### Error Handling
```typescript
// ✅ Good: User-friendly + log details
try {
  await provider.chat(messages)
} catch (error: unknown) {
  console.error('[Provider] Chat failed:', error)
  throw createError({
    statusCode: 502,
    statusMessage: 'AI provider temporarily unavailable'
  })
}

// ❌ Bad: Expose internal errors
throw createError({
  statusCode: 500,
  statusMessage: error.message  // Might leak secrets!
})
```

## Change Workflow

### Micro Change (< 30 min, 1-3 files)
- Just do it
- Run tests and linters
- Commit: `type(scope): description`

### Medium Change (New feature/API/refactor)
1. Write **Mini Plan** first (see AI_PLAYBOOK.md)
2. Get approval
3. Implement in small commits
4. Add tests
5. Update docs

### Big Change (Domain model, auth system, streaming)
1. Write **RFC Plan** first (see AI_PLAYBOOK.md)
2. Get explicit approval
3. Split into phases
4. Add comprehensive tests
5. Document migration path

## Testing Strategy

**Current coverage**: 7 test files, ~40 tests

**Well-covered areas:**
- ✅ JWT utils (sign/verify/tamper/expiry)
- ✅ Password utils (Argon2 hashing)
- ✅ Auth middleware (public routes, token validation)
- ✅ Provider adapters (payload structure, factory)
- ✅ Auth API routes (signup/login/me/logout)
- ✅ Chat API (list, create, SSE streaming)
- ✅ Chat repository (conflict resolution, sync)

**Test setup**: `tests/setup/test-env.ts` with DB reset, network mocks, auth helpers

**Run tests:**
```bash
bun test                  # All tests
bun test auth             # Tests matching "auth"
bun test --coverage       # With coverage
```

## Common Tasks

### Adding a New AI Provider (Proxy - Simplest)

1. Add to registry in `app/services/providers/index.ts`:
```typescript
'my-provider': () => createProxyProvider('my-provider', 'my-provider')
```

2. Create server endpoint `server/api/v1/my-provider/chat.post.ts`:
```typescript
export default defineEventHandler(async (event) => {
  const { messages, model, temperature } = await readBody(event)
  const { myProviderApiKey } = useRuntimeConfig()

  const response = await fetch('https://api.provider.com/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${myProviderApiKey}` },
    body: JSON.stringify({ messages, model, temperature })
  })

  const data = await response.json()
  return {
    content: data.message,
    reasoning: data.reasoning,  // optional
    provider: 'my-provider',
    model
  }
})
```

3. Add to `nuxt.config.ts` runtimeConfig:
```typescript
runtimeConfig: {
  myProviderApiKey: '',
}
```

4. Add to `.env`:
```bash
MY_PROVIDER_API_KEY=...
```

### Adding a New API Endpoint

1. Create file: `server/api/v1/resource/action.method.ts`
2. Use middleware-verified user: `event.context.user`
3. Import DB functions explicitly (not auto-imported)
4. Return clean DTOs (never expose hashes/secrets)
5. Add tests in `tests/server/api/`

### Adding a Pinia Store

1. Create file: `app/stores/storeName.ts`
2. Use repository pattern for I/O
3. Keep state minimal
4. Export composable via `return { ... }`
5. Access via `useStoreName()` (auto-imported)

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL=./db/sqlite/dev.db

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# AI Provider Keys (add ones you use)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
```

**Never commit `.env` to git!**

## Common Pitfalls

1. **Manual imports of auto-imported utils** - Causes issues, let Nuxt handle it
2. **Trusting headers/query for auth** - Always use `event.context.user` from middleware
3. **Exposing secrets in responses** - Return clean DTOs only
4. **Using `any` type** - Use `unknown` in catch blocks, proper types elsewhere
5. **Skipping tests** - Add tests for all new features
6. **Not reading AI_PLAYBOOK.md first** - It contains critical patterns and rules

## Priority Order for Work

1. **🚨 P0 - Unblockers**: Broken builds, failing tests, auth failures
2. **🔒 P1 - Safety**: Security issues, data integrity, migrations
3. **👤 P2 - User Value**: Features users will see/use
4. **🛠️ P3 - Maintainability**: Tests, types, documentation
5. **✨ P4 - Polish**: UI details, optimizations

**Always check [TODO.md](./TODO.md) for current priorities!**

## Additional Resources

- **Nuxt 4 Docs**: https://nuxt.com/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Pinia**: https://pinia.vuejs.org/
- **Nuxt UI**: https://ui.nuxt.com/
- **Tailwind v4**: https://tailwindcss.com/blog/tailwindcss-v4-alpha

## Final Notes

- **Token efficiency**: Ask targeted questions with full context up front
- **Plan first**: Medium/big changes require approval before coding
- **Test everything**: Don't skip tests for new features
- **Update docs**: Keep README, AI_AGENT_BRIEF, TODO in sync
- **Security first**: Never expose secrets, always verify auth, validate input
