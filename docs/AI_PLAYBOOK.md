# AI Collaboration Rules & Operating Playbook

> **Goal**: Move fast without breaking the repo — start simple → grow safely — keep tokens low — confirm big moves.

**Last updated**: 2025-10-17

---

## 📋 Quick Reference

**Before you start coding:**
- ✅ Read this playbook first
- ✅ Check [TODO.md](../TODO.md) for current priorities
- ✅ Review [AI_AGENT_BRIEF.md](./AI_AGENT_BRIEF.md) for architecture overview
- ✅ For big changes: Write a plan → Get approval → Implement

**For questions:**
- 🏗️ Architecture decisions → Check `docs/adr/` (Architecture Decision Records)
- 🔌 API contracts → Check `docs/api/`
- 🔐 Security rules → Check `docs/security.md`
- 🐛 Error codes → Check `docs/errors.md`

---

## 1. Core Principles

### Start Simple, Iterate Fast
- Ship the **smallest working change** first
- Avoid over-engineering; add complexity only when needed
- Working code > perfect architecture

### Pragmatic SOLID (when it helps)
- **SRP**: Separate IO (repositories) from state (stores) from UI (components)
- **DIP**: Depend on interfaces; keep adapters swappable (AI providers, DB drivers)
- **OCP**: Extend via composition, not modification
- Don't force patterns where they don't fit

### Security by Default
- Never expose secrets to client code
- Verify JWT once per request in middleware
- Never return credentials/hashes in API responses
- All protected routes require `event.context.user`

### Observability Matters
- Log key events: auth, provider calls, errors
- Include context: user ID, provider, model, status
- Use structured logging for easier debugging

---

## 2. Change Workflow

### Micro Change (1-3 files, < 30 min)
1. Make minimal patch
2. Run linters/tests
3. Commit with conventional format: `type(scope): description`
4. Done!

**Examples**: Fix typo, update copy, adjust styles, add validation

---

### Medium Change (New feature, API, or refactor)

**BEFORE coding**:
1. Write **Mini Plan** (see template below)
2. Post plan and wait for approval
3. Implement in small commits
4. Add tests (happy path + 1 edge case)
5. Update docs + TODO.md

**Examples**: New API endpoint, auth middleware, provider adapter, UI component

#### Mini Plan Template

```markdown
## What / Why
- **Problem**: [What's broken or missing?]
- **Outcome**: [What will work after this change?]

## Scope
- **In scope**: [What you will do]
- **Out of scope**: [What you won't do]

## Steps
1. [First step]
2. [Second step]
3. [Third step]

## Risks / Open Questions
- [What could go wrong?]
- [What needs clarification?]
```

---

### Big Change (Domain model, streaming, multi-phase work)

**BEFORE coding**:
1. Write **RFC Plan** (see template below)
2. Post RFC and wait for approval
3. Split into phases (1-2 day chunks)
4. Implement phase by phase with reviews
5. Add smoke/e2e tests for invariants
6. Document migration path + rollback strategy

**Examples**: Refresh token system, WebSocket streaming, multi-tenancy, RBAC

#### RFC Plan Template

```markdown
# RFC: [Title]

## Context
- **Current state**: [How things work today]
- **Constraints**: [Time, infra, security limits]

## Goals / Non-goals
- **Goals**: [What you will achieve]
- **Non-goals**: [What you explicitly won't do]

## Design & Interfaces
- **API routes**: [Endpoints, methods, auth]
- **Types/DTOs**: [Request/response shapes]
- **Data model**: [DB schema changes]
- **Error taxonomy**: [New error codes]

## Rollout Plan
- **Phase 1**: [First deliverable]
- **Phase 2**: [Second deliverable]
- **Migrations**: [DB changes, backfill scripts]
- **Monitoring**: [What to watch]
- **Rollback**: [How to undo if needed]

## Risks & Alternatives
- **Risks**: [What could go wrong?]
- **Considered & rejected**: [Other approaches you evaluated]

## Test Strategy
- **Unit tests**: [What to test in isolation]
- **Integration tests**: [What to test end-to-end]
- **Smoke tests**: [Critical paths to verify]
```

---

## 3. Token Economy & Context Management

### Be Gentle with Tokens
- Ask **short, targeted questions** with full context up front
- Avoid reading entire files when you only need specific functions
- Summarize long threads into brief session notes

### Session Cache (Keep These Handy)
Store in memory/notes during active session:
- Current user/chat/connection IDs you're working with
- Provider config (provider, model, baseURL)
- Active routes/contracts (message shapes, streaming protocol)
- Open todos from this session

### Project Cache (Persistent Reference)
Store in `docs/` for all sessions:
- **ADRs**: Architecture decisions (why Bun? why AI SDK?)
- **API contracts**: Endpoints + DTOs with examples
- **Env var matrix**: Required/optional vars
- **Error taxonomy**: Status codes + messages

---

## 4. Prioritization Rubric

Work on tasks in this order:

1. **🚨 Unblockers** (P0)
   - Broken builds, failing tests
   - Auth failures preventing access
   - Provider API keys missing
   - SSE streaming breakage

2. **🔒 Safety & Correctness** (P1)
   - Auth/JWT vulnerabilities
   - Data integrity issues
   - Required migrations

3. **👤 User-Visible Value** (P2)
   - Chat send/receive functionality
   - User management UI
   - Chat list/history

4. **🛠️ DX & Maintainability** (P3)
   - Tests for existing features
   - Type safety improvements
   - Documentation updates

5. **✨ Polish** (P4)
   - UI micro-interactions
   - Performance optimizations
   - Refactoring for elegance

**Always check [TODO.md](../TODO.md) for current priorities!**

---

## 5. Documentation Map

### Where to Find What

| Document | Purpose | When to Update |
|----------|---------|----------------|
| `README.md` | Quick start guide | When setup changes |
| `docs/AI_AGENT_BRIEF.md` | Architecture overview | When structure changes |
| `docs/AI_PLAYBOOK.md` | **This file** - How to work | When process changes |
| `TODO.md` | Current priorities & tasks | After each session |
| `docs/adr/ADR-*.md` | Architecture decisions | When choosing platforms |
| `docs/api/` | API contracts & examples | When adding endpoints |
| `docs/security.md` | Security rules & threats | When adding auth features |
| `docs/errors.md` | Error codes & messages | When adding error types |
| `docs/migrations/` | DB changes & backfills | When modifying schema |

### Creating New Documentation

**Architecture Decision Record (ADR)**:
```markdown
# ADR-001: Choose Bun over Node.js

## Status
Accepted

## Context
We need a JavaScript runtime for the server.

## Decision
Use Bun instead of Node.js.

## Rationale
- Faster startup times
- Built-in SQLite support
- Native TypeScript execution
- Better DX with hot reload

## Consequences
- Smaller ecosystem than Node
- Some npm packages may not work
- Team needs to learn Bun-specific APIs
```

---

## 6. Coding Standards

### File Organization
```
app/
├── components/        # UI components (pure presentation)
├── composables/       # Reusable Vue logic
├── layouts/           # Page layouts
├── middleware/        # Client-side route guards
├── pages/             # File-based routing
├── plugins/           # App-wide plugins
├── services/          # Business logic (repos, utils)
│   ├── providers/    # AI provider adapters
│   └── *Repository.ts # Data access layer
└── stores/            # Pinia state management

server/
├── api/v1/           # API routes (versioned)
├── db/               # Database queries
├── middleware/       # Server middleware (auth)
└── utils/            # Server utilities (JWT, password)
```

### Naming Conventions

**Files**:
- Components: `PascalCase.vue` (e.g., `ChatMessage.vue`)
- Composables: `camelCase.ts` starting with `use` (e.g., `useChatProvider.ts`)
- Stores: `camelCase.ts` (e.g., `auth.ts`, `chat.sessions.ts`)
- API routes: `lowercase.method.ts` (e.g., `login.post.ts`)

**Variables**:
- Database columns: `snake_case` (e.g., `created_at`, `user_id`)
- TypeScript/JS: `camelCase` (e.g., `createdAt`, `userId`)
- Types/Interfaces: `PascalCase` (e.g., `AuthUser`, `ChatMessage`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `JWT_EXPIRY`)

### Type Separation

**Database types** (server/db/types.ts):
```typescript
export interface UserRow {
  id: string
  email: string
  created_at: number  // Unix timestamp
}
```

**API DTOs** (types.ts):
```typescript
export interface AuthUser {
  id: string
  email: string
  createdAt: string  // ISO 8601
}
```

### Repository Pattern
```typescript
// ✅ Good: IO only, no state
export const userRepository = {
  async findById(id: string): Promise<UserRow | null> {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }
}

// ❌ Bad: Don't cache in repos
const cache = new Map()
export const userRepository = {
  async findById(id: string) {
    if (cache.has(id)) return cache.get(id)  // NO!
    // ...
  }
}
```

### Store Pattern
```typescript
// ✅ Good: Minimal state + orchestration
export const useAuth = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  async function login(email: string) {
    const data = await authRepository.login(email)  // Use repo
    user.value = data.user
  }

  return { user, login }
})
```

### Component Pattern
```typescript
// ✅ Good: UI only, no cross-cutting concerns
<script setup>
const auth = useAuth()  // Use store
const handleLogin = () => auth.login(email.value)
</script>

// ❌ Bad: Don't call repos directly
<script setup>
const handleLogin = () => authRepository.login(email.value)  // NO!
</script>
```

### Auth Pattern
```typescript
// ✅ Good: Verify once in middleware
export default defineEventHandler((event) => {
  const user = event.context.user  // Already verified
  return db.getUserChats(user.id)
})

// ❌ Bad: Don't trust headers/query
export default defineEventHandler((event) => {
  const userId = getHeader(event, 'x-user-id')  // UNSAFE!
  return db.getUserChats(userId)
})
```

### Error Handling
```typescript
// ✅ Good: User-friendly message + log details
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
try {
  await provider.chat(messages)
} catch (error: unknown) {
  throw createError({
    statusCode: 500,
    statusMessage: error.message  // Might leak secrets!
  })
}
```

### Environment Variables
```typescript
// ✅ Good: Read via runtimeConfig
const config = useRuntimeConfig()
const secret = config.jwtSecret

// ❌ Bad: Direct process.env access
const secret = process.env.JWT_SECRET  // Not validated!
```

### Nuxt Auto-Imports (IMPORTANT!)

**Nuxt automatically imports from these directories - DO NOT manually import:**

**Server-side auto-imports:**
- `server/utils/*.ts` - All exports are globally available in server code
- `server/middleware/*.ts` - Middleware functions
- Examples: `hashPassword()`, `signJWT()`, `verifyJWT()`, `setAccessCookie()`

**Client-side auto-imports:**
- `composables/*.ts` - Functions starting with `use` (e.g., `useAuth()`)
- `stores/*.ts` - Pinia stores (accessed via `useStoreName()`)
- `components/*.vue` - Vue components (no import needed in templates)

```typescript
// ✅ Good: Let Nuxt auto-import
export default defineEventHandler(async (event) => {
  const hash = await hashPassword('password')  // Auto-imported from server/utils/password.ts
  const token = signJWT(payload, options)       // Auto-imported from server/utils/jwt.ts
  return { hash, token }
})

// ❌ Bad: Manual imports (redundant and can cause issues)
import { hashPassword } from '@/server/utils/password'  // NOT needed!
import { signJWT } from '@/server/utils/jwt'            // NOT needed!

export default defineEventHandler(async (event) => {
  const hash = await hashPassword('password')
  const token = signJWT(payload, options)
  return { hash, token }
})
```

**When you DO need imports:**
- Database functions (e.g., `getUserByEmail` from `server/db/users.ts`)
- Types and interfaces
- Third-party packages
- Utilities NOT in auto-import directories

---

## 7. AI Provider Best Practices

### Provider Adapter Interface
All providers must implement `ChatPort`:

```typescript
export interface ChatPort {
  send(input: ProviderSendInput): Promise<ChatResponse>
  stream?(input: ProviderSendInput): AsyncIterable<ChatStreamChunk>
}
```

### Creating New Providers

**For AI SDK providers**:
```typescript
export function anthropicProvider(): ProviderAdapter {
  return {
    key: 'anthropic',
    type: 'ai-sdk',
    chat: {
      async send({ messages, model, signal }) {
        const { text } = await generateText({
          model: anthropic(model || 'claude-3-5-sonnet-20241022'),
          messages,
          abortSignal: signal,
        })
        return { content: text, provider: 'anthropic', model }
      }
    }
  }
}
```

**For proxy providers**:
```typescript
export function openrouterProvider(): ProviderAdapter {
  return createProxyProvider('openrouter', 'openrouter')
}
```

### Provider Logging
```typescript
// Always log: provider, model, latency, status
console.log('[Provider] Chat request', {
  provider: 'openai',
  model: 'gpt-4',
  messageCount: messages.length,
  userId: event.context.user?.id
})

const start = Date.now()
try {
  const result = await provider.send(input)
  console.log('[Provider] Success', {
    provider: 'openai',
    latencyMs: Date.now() - start,
    contentLength: result.content.length
  })
} catch (error) {
  console.error('[Provider] Failed', {
    provider: 'openai',
    latencyMs: Date.now() - start,
    error: error.message
  })
}
```

### Timeouts & Cancellation
```typescript
// ✅ Always pass AbortSignal
const controller = new AbortController()
setTimeout(() => controller.abort(), 30000)  // 30s timeout

await provider.send({
  messages,
  model,
  signal: controller.signal  // Pass signal!
})
```

---

## 8. Security & Compliance

### JWT Rules
- **Algorithm**: HS256 only
- **TTL**: 1 hour for access tokens (7 days during development)
- **Claims**: Minimal `{ sub: userId, email, iss: 'nuxt-ai-chat' }`
- **Verification**: Once per request in `server/middleware/auth.global.ts`
- **Storage**: httpOnly cookie (client never sees token)

### Password Handling
- **Algorithm**: Argon2id (via `@node-rs/argon2`)
- **Storage**: Separate `credentials` table (never join with users in public APIs)
- **Verification**: Timing-safe comparison

### API Response Rules
```typescript
// ❌ NEVER return these
{
  password: '...',
  password_hash: '...',
  jwt_secret: '...',
  api_key: '...'
}

// ✅ ALWAYS return clean DTOs
{
  id: '...',
  email: '...',
  createdAt: '...'
}
```

### Cookie Settings
```typescript
setCookie(event, 'access_token', token, {
  httpOnly: true,      // JS can't access
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  maxAge: 60 * 60      // 1 hour
})
```

### RBAC (Future)
When adding roles:
1. Add `role` claim to JWT
2. Create `requireRole(role)` helper
3. Add `role` column to users table
4. Update auth middleware to attach role

---

## 9. Testing Strategy

### Test Pyramid
```
      /\
     /E2E\      Few (smoke tests)
    /------\
   /  Integ \   Some (API + DB)
  /----------\
 /    Unit    \ Many (pure logic)
/--------------\
```

### Minimum Coverage
**Auth** (tests/server/api/auth.spec.ts):
- ✅ Signup with valid email + password
- ✅ Signup rejects duplicate email
- ✅ Login with correct credentials
- ✅ Login rejects wrong password
- ✅ /me returns user when authenticated
- ✅ /me returns 401 when not authenticated
- ✅ Logout clears cookie

**Chats** (tests/server/api/chats.spec.ts):
- ✅ List chats by user email
- ✅ Create chat with messages
- ✅ Stream chat response (SSE)
- ✅ Reject unauthorized access

**Users** (tests/server/api/users.spec.ts):
- ✅ List users (authenticated)
- ✅ Reject without auth (401)

### Writing New Tests

**API Test Template**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { eventHandler } from 'h3'

describe('POST /api/v1/feature', () => {
  beforeEach(() => {
    // Reset DB, clear mocks
  })

  it('should work with valid input', async () => {
    const event = createJsonEvent({ /* payload */ })
    const result = await handler(event)
    expect(result).toMatchObject({ /* expected */ })
  })

  it('should reject invalid input', async () => {
    const event = createJsonEvent({ /* bad payload */ })
    await expect(handler(event)).rejects.toThrow('Bad Request')
  })
})
```

### Running Tests
```bash
bun test                    # Run all tests
bun test auth              # Run tests matching "auth"
bun test --coverage        # Generate coverage report
```

---

## 10. Git Workflow & Commit Style

### Commit Format
```
type(scope): short description

Longer explanation if needed.

Fixes #123
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that doesn't add features or fix bugs
- `docs`: Documentation only
- `test`: Adding or updating tests
- `chore`: Tooling, deps, config

**Examples**:
```
feat(auth): add refresh token rotation
fix(chat): handle streaming errors gracefully
refactor(providers): extract common retry logic
docs(playbook): add testing guidelines
test(auth): add token expiry tests
chore(deps): update @ai-sdk/openai to 1.2.3
```

### PR Checklist
Copy this into PR description:

```markdown
## Checklist
- [ ] Plan/RFC linked (if medium/big change)
- [ ] Types/DTOs updated & mapped
- [ ] Tests added/updated
- [ ] Docs updated (API, README, or Playbook)
- [ ] Security review (secrets/JWT/PII)
- [ ] Manual smoke test passed
- [ ] TODO.md updated (if applicable)
```

---

## 11. What to Ask Humans About

Don't spend tokens on these - ask early:

### Product/Requirements
- Signup rules (email verification? SSO?)
- Password policy (length, complexity)
- Data retention (how long to keep messages?)
- User roles & permissions
- Rate limiting thresholds

### Infrastructure
- Production runtime (Bun vs Node)
- Database (SQLite vs Postgres)
- Hosting platform (Vercel, Railway, self-hosted)
- Provider API quotas & costs
- Monitoring & logging setup

### Migrations
- Long-running migrations (need downtime?)
- Backfill strategy (batch size, timing)
- Rollback plan (how to undo safely)

---

## 12. Session Notes Template

For active AI sessions, keep a scratch note with:

```markdown
# Session Notes: 2025-10-17

## Context
Working on: [Feature name]
Related: TODO.md items #3, #7

## Key IDs
- User: user_abc123
- Chat: chat_xyz789
- Session: sess_def456

## Active Routes
POST /api/v1/chats/stream
  Body: { provider, model, messages[] }
  Response: SSE stream

## Decisions Made
- Use Argon2id for passwords (not bcrypt)
- JWT TTL: 1h access, 30d refresh
- Store refresh tokens in DB with rotation

## Next Steps
- [ ] Add refresh token endpoint
- [ ] Update auth store with refresh logic
- [ ] Add expiry handling to fetch wrapper
```

---

## 13. Current TODO Queue

**See [TODO.md](../TODO.md) for full list!**

Quick summary:
- **P1**: Auth route protection ✅, Zod validation, Rate limiting
- **P2**: Test coverage (P1 items), Provider error handling
- **P3**: Integration tests, Code polish
- **P4**: Auth Phase 4 (refresh tokens, loading states)

---

## 14. Emergency Playbook

### Build is Broken
1. Check last commit: `git log -1`
2. Run `bun run build` locally
3. Read error message carefully
4. Check `nuxt.config.ts` for typos
5. Verify all imports exist

### Tests Failing
1. Run single test: `bun test <name>`
2. Check `beforeEach` cleanup
3. Verify DB is reset between tests
4. Look for race conditions (async/await)

### Auth Not Working
1. Check JWT_SECRET is set: `echo $JWT_SECRET`
2. Verify cookie is set: Browser DevTools → Application → Cookies
3. Check middleware runs: Add console.log
4. Verify token not expired: Check `exp` claim

### Provider API Failing
1. Check API key is valid: Try in Postman
2. Verify quota not exceeded: Check provider dashboard
3. Check endpoint URL: Should be `https://...`
4. Look at server logs for error details

---

## 15. Resources & Links

### External Docs
- [Nuxt 4 Docs](https://nuxt.com/docs)
- [Nuxt UI](https://ui.nuxt.com/)
- [AI SDK](https://sdk.vercel.ai/docs)
- [Pinia](https://pinia.vuejs.org/)
- [Vitest](https://vitest.dev/)

### Internal Docs
- [Architecture Brief](./AI_AGENT_BRIEF.md)
- [API Contracts](./api/)
- [Security Rules](./security.md)
- [TODO List](../TODO.md)

---

## 16. Contributing

### For Human Developers
1. Read this playbook
2. Check TODO.md for priorities
3. Follow Git workflow
4. Write tests
5. Update docs

### For AI Assistants
1. Read this playbook **first**
2. Ask before medium/big changes
3. Keep tokens low (be targeted)
4. Follow coding standards
5. Update TODO.md after sessions

---

**Questions?** Ask in the project channel or open an issue.

**Feedback?** This is a living document - suggest improvements!
