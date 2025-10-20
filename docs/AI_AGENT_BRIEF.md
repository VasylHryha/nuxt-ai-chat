# Nuxt AI Chat - Architecture Brief

**Last Updated**: 2025-10-17

> **Quick Links**: [AI Playbook](./AI_PLAYBOOK.md) • [TODO](../TODO.md) • [Contributing](../CONTRIBUTING.md)

---

## Mission & Goals

Build a production-ready Nuxt 4 starter demonstrating:
- ✅ **Multi-provider AI chat** with streaming support (OpenAI, Anthropic, Google, OpenRouter)
- ✅ **Secure authentication** with JWT + Argon2 password hashing
- ✅ **Chat persistence** with dual-layer storage (localStorage + SQLite)
- ✅ **Modern stack** with Nuxt 4, Vue 3, Pinia, Tailwind v4, Vercel AI SDK
- ✅ **Extensible architecture** supporting three provider patterns (AI SDK, Proxy, Native)

**Core Philosophy**: Client only talks to our Nuxt backend; backend handles provider communication and persistence.

---

## Current State Summary (October 2025)

### ✅ Fully Implemented

#### 1. Authentication System
- **JWT-based auth** with HS256, httpOnly cookies, Bearer token support
- **Endpoints**: `/api/v1/auth/signup`, `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`
- **Password security**: Argon2id hashing via `@node-rs/argon2`
- **Middleware protection**:
  - Server: `server/middleware/00.auth.ts` protects all `/api/v1/*` except `/api/v1/auth`
  - Client: `app/middleware/auth.global.ts` protects routes except `/`, `/auth/login`, `/auth/signup`
- **Stores**: `app/stores/auth.ts` with login/signup/logout/me + loading/error states
- **Auto-hydration**: Plugin restores session from cookie on app start
- **UI Integration**: Dynamic navigation, user display in header, logout button

#### 2. AI Provider System
**Three integration patterns** for maximum flexibility:

**A. AI SDK Providers** (`type: 'ai-sdk'`)
- Uses `@ai-sdk/vue` with Vercel AI SDK
- Supports streaming via SSE
- Current implementation: OpenAI via `/api/v1/ai/chats`
- Example: `app/pages/ai-chat.vue` uses `new Chat()` from AI SDK

**B. Proxy Providers** (`type: 'proxy'`)
- Simple HTTP proxy to external services
- Generic factory: `createProxyProvider(key, endpoint)`
- Examples: OpenRouter, custom endpoints
- Pattern: `/api/v1/{provider}/chat.post.ts`

**C. Native Providers** (`type: 'native'`)
- Direct SDK integration with full provider features
- Example: `openai.native.ts` using OpenAI SDK directly

**Provider Registry**: `app/services/providers/index.ts` with metadata in `PROVIDER_INFO`

**Extensibility**: Add new provider in 5 minutes with generic factory or custom adapter

#### 3. Database & Persistence

**Schema** (`db/migrations/001_init.sql`):
- `users` - User accounts (id, email, name, created_at)
- `credentials` - Argon2 password hashes (user_id, password_hash)
- `connections` - AI provider configs per user (provider, model, api_key, settings)
- `chats` - Conversation threads (user_id, connection_id, title, provider, model)
- `messages` - Message history (chat_id, role, content, reasoning, timestamps)

**Dual-layer persistence**:
- **Primary**: localStorage (fast, offline-first)
- **Secondary**: SQLite via `/api/v1/chats` (sync, multi-device)
- **Conflict resolution**: Last-write-wins merge on `updatedAt` timestamps
- **Background sync**: Every 60 seconds via `chatRepository.startBackgroundSync()`

**Repository pattern**: `app/services/chatRepository.ts` handles load/save/sync

#### 4. State Management (Pinia)

**Auth Store** (`app/stores/auth.ts`):
- State: `user`, `token`, `isLoading`, `isInitialized`, `errorMessage`
- Actions: `login(email, password)`, `signup(name, email, password)`, `logout()`, `me()`

**Users Store** (`app/stores/users.ts`):
- SWR caching with 1-minute TTL
- Actions: `ensure()`, `fetchAll()`, `addUser(email, name)`

**Chat Sessions Store** (`app/stores/chat.sessions.ts`):
- Manages `DirectorySnapshot` with profiles
- Actions: `hydrate()`, `persist()`, `createNewSession()`, `pushMessageToCurrent()`

**Chat Runtime Store** (`app/stores/chat.runtime.ts`):
- UI state: `isSending`, `errorMessage`, `abortSignal`
- Action: `send()` handles optimistic updates + provider dispatch

#### 5. UI Components & Pages

**Pages**:
- `/` - Landing page (public)
- `/auth/login` - Login form (public)
- `/auth/signup` - Signup form (public)
- `/ai-chat` - AI SDK chat interface (protected)
- `/chats` - Chat list dashboard with stats (protected)
- `/users` - User management (protected)

**Layout** (`app/layouts/default.vue`):
- Dynamic navigation based on auth state
- User email display + logout button
- Login button when not authenticated
- Theme switcher (dark/light)

**Styling**:
- Tailwind v4 with custom CSS tokens (`app/assets/main.css`)
- Nuxt UI components throughout
- Theme-aware colors (`.text-fg`, `.text-fg-muted`, `.panel`, etc.)
- Emerald accent color system

#### 6. Testing Infrastructure

**Framework**: Vitest with in-memory SQLite

**Current Coverage** (7 test files, ~40 tests):
- ✅ JWT utils (sign/verify/tamper/expiry)
- ✅ Password utils (Argon2 hashing)
- ✅ Auth middleware (public routes, token validation)
- ✅ Provider adapters (payload structure, factory pattern)
- ✅ Auth API routes (signup/login/me/logout flows)
- ✅ Chat API (list, create, SSE streaming)
- ✅ Chat repository (conflict resolution, sync)

**Test Setup**: `tests/setup/test-env.ts` with DB reset, network mocks, auth helpers

---

## Architecture Patterns

### Provider Architecture (3 Types)

#### Type 1: AI SDK Provider
```typescript
// app/pages/ai-chat.vue
import { Chat } from '@ai-sdk/vue'

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/v1/ai/chats',
    credentials: 'include',
    headers: () => ({ Authorization: `Bearer ${auth.token}` }),
  }),
})
```

Server handles streaming via SSE at `/api/v1/ai/chats`.

#### Type 2: Proxy Provider
```typescript
// app/services/providers/index.ts
'openrouter': () => createProxyProvider('openrouter', 'openrouter')

// server/api/v1/openrouter/chat.post.ts
export default defineEventHandler(async (event) => {
  const { messages, model } = await readBody(event)
  const { openrouterApiKey } = useRuntimeConfig()

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, model })
  })

  const data = await response.json()
  return { content: data.choices[0].message.content, provider: 'openrouter', model }
})
```

#### Type 3: Native Provider
```typescript
// app/services/providers/openai.native.ts
import OpenAI from 'openai'

export function openaiNativeProvider(): ProviderAdapter {
  return {
    key: 'openai',
    type: 'native',
    chat: {
      async send({ messages, model, signal }) {
        const client = new OpenAI({ apiKey: runtimeConfig.openaiApiKey })
        const response = await client.chat.completions.create({
          model: model || 'gpt-4o',
          messages,
        }, { signal })
        return { content: response.choices[0].message.content, provider: 'openai', model }
      }
    }
  }
}
```

### Repository Pattern

**Separation of concerns**:
- **Repositories** (`app/services/*Repository.ts`): Pure I/O, no state
- **Stores** (`app/stores/*.ts`): State + orchestration, use repositories
- **Composables** (`app/composables/*.ts`): Reusable logic, use stores

```typescript
// ✅ Good: Repository handles I/O only
export const chatRepository = {
  async load(): Promise<DirectorySnapshot> {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { currentProfileId: '', profiles: {} }
  },
  async save(snapshot: DirectorySnapshot): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }
}

// ✅ Good: Store orchestrates using repository
export const useChatSessions = defineStore('chat.sessions', () => {
  const sessions = ref<Record<string, Session>>({})

  async function hydrate() {
    const snapshot = await chatRepository.load()  // Use repo
    // ... process snapshot into sessions
  }

  function persist() {
    chatRepository.save(getSnapshot())  // Use repo
  }

  return { sessions, hydrate, persist }
})
```

### Auth Middleware (Dual-Layer Protection)

**Server-side** (`server/middleware/00.auth.ts`):
- Runs on EVERY API request
- Whitelists: `/api/v1/auth`, `/api/_nuxt_icon`, `/favicon.ico`
- Verifies JWT from cookie or Bearer header
- Attaches `event.context.user` for handlers to use

**Client-side** (`app/middleware/auth.global.ts`):
- Runs on EVERY route navigation
- Whitelists: `/`, `/auth/login`, `/auth/signup`
- Checks `auth.user` exists
- Redirects to login with `?redirect={fullPath}` if not authenticated

### Nuxt Auto-Imports (Important!)

**DO NOT manually import these** - Nuxt auto-imports them:

**Server-side**:
- `server/utils/*.ts` → All exports globally available
- Examples: `hashPassword()`, `signJWT()`, `verifyJWT()`, `setAccessCookie()`

**Client-side**:
- `composables/*.ts` → Functions starting with `use`
- `stores/*.ts` → Pinia stores (via `useStoreName()`)
- `components/*.vue` → Vue components (no import in templates)

```typescript
// ✅ Good: Let Nuxt auto-import
export default defineEventHandler(async (event) => {
  const hash = await hashPassword('password')  // Auto-imported!
  const token = signJWT(payload, options)       // Auto-imported!
  return { hash, token }
})

// ❌ Bad: Manual imports (causes issues)
import { hashPassword } from '@/server/utils/password'  // NOT NEEDED!
import { signJWT } from '@/server/utils/jwt'            // NOT NEEDED!
```

**When you DO need imports**:
- Database functions (from `server/db/*.ts`)
- Types and interfaces
- Third-party packages

---

## File Organization

```
app/
├── assets/
│   └── main.css               # Tailwind v4 + CSS tokens
├── components/                # Vue components
├── composables/               # Reusable logic (auto-imported)
│   └── useChatProvider.ts    # Provider resolution
├── layouts/
│   └── default.vue           # App shell with nav
├── middleware/
│   └── auth.global.ts        # Client-side route guard
├── pages/
│   ├── index.vue             # Landing page
│   ├── ai-chat.vue           # AI SDK chat
│   ├── chats/
│   │   ├── index.vue         # Chat list dashboard
│   │   └── login.vue         # Login form (will move to auth/)
│   ├── auth/
│   │   ├── login.vue         # Login page
│   │   └── signup.vue        # Signup page
│   └── users.vue             # User management
├── plugins/
│   └── auth-hydration.client.ts  # Auto-restore session
├── services/
│   ├── providers/            # AI provider adapters
│   │   ├── index.ts          # Registry + factory
│   │   ├── types.ts          # Interfaces
│   │   ├── ai-openai.ts      # AI SDK OpenAI
│   │   ├── openai.native.ts  # Native OpenAI
│   │   └── openrouter.ts     # Proxy OpenRouter
│   ├── chatRepository.ts     # Chat persistence
│   ├── usersRepository.ts    # User data access
│   └── limits.ts             # Message limits
└── stores/
    ├── auth.ts               # Auth state
    ├── users.ts              # User list (SWR)
    ├── chat.sessions.ts      # Chat sessions
    └── chat.runtime.ts       # Chat UI state

server/
├── api/v1/
│   ├── ai/
│   │   └── chats/
│   │       └── index.post.ts  # AI SDK streaming endpoint
│   ├── auth/
│   │   ├── login.post.ts     # Login
│   │   ├── signup.post.ts    # Signup
│   │   ├── logout.post.ts    # Logout
│   │   └── me.get.ts         # Get current user
│   ├── chats/
│   │   ├── index.get.ts      # List user chats
│   │   └── index.put.ts      # Sync chat snapshot
│   ├── users/
│   │   └── index.get.ts      # List users
│   ├── openrouter/
│   │   └── chat.post.ts      # OpenRouter proxy
│   └── openai/
│       └── chat.post.ts      # OpenAI proxy
├── db/
│   ├── main.ts               # DB instance
│   ├── chats.ts              # Chat queries
│   ├── connections.ts        # Connection queries
│   └── users.ts              # User queries
├── middleware/
│   └── 00.auth.ts            # Server-side auth guard
└── utils/
    ├── auth.ts               # Auth helpers (auto-imported)
    ├── jwt.ts                # JWT sign/verify (auto-imported)
    ├── password.ts           # Argon2 hash/verify (auto-imported)
    └── validators.ts         # Email validation (auto-imported)

db/
├── migrations/
│   └── 001_init.sql          # Database schema
├── scripts/
│   ├── migrate.js            # Migration runner
│   └── seeds.js              # Seed test data
└── types.ts                  # Database types

docs/
├── AI_AGENT_BRIEF.md         # This file
├── AI_PLAYBOOK.md            # Work guidelines (READ FIRST!)
└── api/                      # API documentation (TODO)

tests/
├── setup/
│   └── test-env.ts           # Test utilities
├── app/
│   └── services/
│       ├── chatRepository.spec.ts
│       └── providers.spec.ts
└── server/
    ├── api/
    │   ├── auth.spec.ts
    │   └── chats.spec.ts
    ├── db/
    │   ├── chats.spec.ts
    │   └── users.spec.ts
    ├── middleware/
    │   └── auth.global.spec.ts
    └── utils/
        ├── jwt.spec.ts
        └── password.spec.ts
```

---

## Key Decisions & Rationale

### Why Nuxt Auto-Imports?
- **DX**: Less boilerplate, cleaner code
- **Performance**: Tree-shakable, only imports what's used
- **Consistency**: Same patterns throughout project
- **Caveat**: Easy to forget they're auto-imported (documented in Playbook)

### Why Dual-Layer Persistence?
- **Offline-first**: localStorage works without network
- **Multi-device**: SQLite sync enables cross-device access
- **Conflict resolution**: Timestamps + merge logic handle concurrent edits
- **Future**: Can add real-time sync with WebSockets

### Why Three Provider Types?
- **AI SDK**: Best for streaming, structured outputs, multimodal
- **Proxy**: Easiest to add new providers (5-minute setup)
- **Native**: Maximum control for provider-specific features
- **Flexibility**: Choose the right tool for each provider

### Why Client + Server Middleware?
- **Defense in depth**: Two layers of protection
- **Better UX**: Client redirect avoids failed API calls
- **Security**: Server verification is source of truth
- **Clear separation**: Client handles routing, server handles auth

---

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL=./db/sqlite/dev.db

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# AI Provider Keys (add the ones you plan to use)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
```

**Security**: Never commit `.env` to git. Use `.env.example` as template.

---

## Setup & Development

```bash
# Install dependencies
bun install

# Initialize database
bun run db:migrate

# Seed test user (password: "password")
bun run db/scripts/seeds.js your-email@example.com

# Start dev server
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

---

## Known Issues & TODOs

### High Priority
1. **Password validation inconsistency**: Login requires password but validation only checks presence
2. **Chat persistence**: DirectorySnapshot structure works but needs server-side implementation
3. **Provider endpoint alignment**: AI SDK client uses different endpoint than legacy providers

### Medium Priority
4. **Error handling**: Some API endpoints return empty 400 responses (no error message)
5. **Type safety**: A few `any` types remain in catch blocks
6. **Input validation**: No Zod schemas yet (manual validation only)

### Low Priority
7. **Legacy cleanup**: Decide fate of `/api/v1/openai/chats.*` endpoints
8. **Testing gaps**: Need more E2E tests for auth flows
9. **Documentation**: API contracts not fully documented

**For detailed tasks, see [TODO.md](../TODO.md)**

---

## Next Steps (Recommended Order)

1. **Fix critical bugs** (P0 from TODO.md)
   - Empty 400 responses
   - Password validation

2. **Complete auth flow** (P1 from TODO.md)
   - Test signup/login end-to-end
   - Verify middleware protection works
   - Add better error messages

3. **Improve UX** (P2 from TODO.md)
   - Provider selection UI
   - Model picker
   - Chat history UI improvements

4. **Add testing** (P3 from TODO.md)
   - Auth E2E tests
   - Provider integration tests
   - UI component tests

5. **Polish & optimize** (P4 from TODO.md)
   - Input validation with Zod
   - Rate limiting
   - Performance optimizations

---

## Learning Resources

### Internal Docs
- **[AI Playbook](./AI_PLAYBOOK.md)** - Work guidelines, patterns, best practices
- **[TODO](../TODO.md)** - Prioritized task list
- **[Contributing](../CONTRIBUTING.md)** - Quick reference guide

### External Docs
- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Nuxt UI](https://ui.nuxt.com/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-alpha)

---

**Last updated**: 2025-10-17
**Status**: Active development, auth working, chat UI functional, provider system extensible

**Remember**: Read [AI_PLAYBOOK.md](./AI_PLAYBOOK.md) before making changes!
