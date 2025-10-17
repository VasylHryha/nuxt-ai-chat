# TODO: Code Quality & Polish Tasks

This document tracks remaining improvements to bring the codebase to production-ready status.

## ✅ Completed (Recent)

- [x] Remove disabled legacy middleware (`validateUser.ts`)
- [x] Replace `any` types with `unknown` in catch blocks (4 files)
- [x] Enhanced provider type system with `ProviderType` and `ProviderInfo`
- [x] Added OpenRouter provider adapter
- [x] Created generic `createProxyProvider()` factory
- [x] Fixed repository contract in `chat.sessions.ts`
- [x] Added missing imports in `useChatProvider`
- [x] Updated comprehensive README and AI_AGENT_BRIEF

---

## 🔴 High Priority (Core Functionality)

### 1. Add Input Validation Schema (Zod)
**Effort**: ~2 hours | **Impact**: High (Security + DX)

**Problem**: Query/body parameters use loose `String()` casting without validation.

**Files**:
- `server/api/v1/chats/index.get.ts:4-10`
- `server/api/v1/auth/signup.post.ts:5-6`
- All API endpoints with query params

**Solution**:
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  provider: z.enum(['openai', 'openrouter', 'anthropic', 'google']).optional(),
  model: z.string().optional(),
})

const validated = schema.parse(getQuery(event))
```

**Benefits**: Type-safe parsing, automatic error messages, runtime validation

---

### 2. Add Rate Limiting for Auth Endpoints
**Effort**: ~1-2 hours | **Impact**: High (Security)

**Problem**: Login/signup endpoints have no rate limiting, vulnerable to brute force.

**Files to create**:
- `server/middleware/rateLimit.ts`
- Update `server/api/v1/auth/login.post.ts`
- Update `server/api/v1/auth/signup.post.ts`

**Solution**: Use `unjs/unstorage` with in-memory driver or Redis:
```typescript
// Track attempts by IP or email
const attempts = await storage.getItem(`login:${ip}`)
if (attempts > 5) throw createError({ statusCode: 429, message: 'Too many attempts' })
```

**Acceptance criteria**:
- Max 5 login attempts per IP per 15 minutes
- Max 3 signup attempts per IP per hour
- Clear error messages for rate limit hits

---

### 3. Type Safety for Event Handlers
**Effort**: ~30 minutes | **Impact**: Medium (DX)

**Problem**: 15+ event handlers use `any` or no type for `event` parameter.

**Files**: All `server/api/**/*.ts` handlers

**Solution**:
```typescript
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  // Now get full autocomplete
})
```

---

## 🟡 Medium Priority (Architecture Improvements)

### 4. Extract Message Validation Service
**Effort**: ~1 hour | **Impact**: Medium (Maintainability)

**Problem**: Message validation logic scattered across 3 files:
- `app/stores/chat.sessions.ts` (character limits)
- `app/stores/chat.runtime.ts` (text trimming)
- `app/services/limits.ts` (appendMessageAndApplyLimits)

**Solution**: Create `app/services/messageValidator.ts`:
```typescript
export class MessageValidator {
  static validate(text: string): { valid: boolean, error?: string }
  static checkLimits(session: Session): { capped: boolean, reason?: string }
  static sanitize(text: string): string
}
```

---

### 5. Add Dependency Injection to Composables
**Effort**: ~1-2 hours | **Impact**: Medium (Testability)

**Problem**: Composables have tight coupling to stores, cannot mock in tests.

**Files**:
- `app/composables/useChatProvider.ts:8`

**Solution**:
```typescript
export function useChatProvider(
  sessionId?: string,
  sessions = useChatSessions() // Default injection
) {
  // Now testable: useChatProvider(id, mockSessions)
}
```

---

### 6. Centralize Email Validation
**Effort**: ~20 minutes | **Impact**: Low (DRY)

**Problem**: Email regex appears in 2 places:
- `app/stores/users.ts:31`
- Previously in `validateUser.ts` (now removed)

**Solution**: Create `app/utils/validation.ts`:
```typescript
export const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
export const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim())
```

---

### 7. Add Explicit Return Types to chatRepository
**Effort**: ~15 minutes | **Impact**: Low (Documentation)

**Problem**: Some methods lack explicit return type annotations.

**File**: `app/services/chatRepository.ts:63-130`

**Solution**:
```typescript
export const chatRepository = {
  async load(): Promise<DirectorySnapshot> { ... },
  async save(snapshot: DirectorySnapshot): Promise<void> { ... },
  async syncPull(local: DirectorySnapshot): Promise<DirectorySnapshot> { ... },
  // etc.
}
```

---

## 🟢 Low Priority (Nice to Have)

### 8. Replace Silent Failures with Logging
**Effort**: ~30 minutes | **Impact**: Low (Debugging)

**Problem**: chatRepository has bare `catch {}` blocks that fail silently.

**Files**: `app/services/chatRepository.ts:72, 81, 90, 97`

**Solution**:
```typescript
catch (error) {
  if (import.meta.dev) console.error('[ChatRepo] Sync failed:', error)
  return fallback
}
```

---

### 9. Add CORS Configuration
**Effort**: ~15 minutes | **Impact**: Low (Deployment)

**File**: `nuxt.config.ts`

**Solution**:
```typescript
nitro: {
  experimental: {
    openAPI: true,
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
}
```

---

### 10. Add Request Size Limits
**Effort**: ~15 minutes | **Impact**: Low (Security)

**File**: `nuxt.config.ts`

**Solution**:
```typescript
nitro: {
  bodyLimit: 1024 * 1024, // 1MB limit
}
```

---

## 📋 Feature Completeness (From AI_AGENT_BRIEF.md)

These are **not** bugs/polish but missing features for a complete app:

1. **Provider endpoint alignment** - Client providers need to call correct AI SDK streaming endpoints
2. **Chat UI** - List page, new chat flow, resume functionality
3. **User management UI** - User selector, create modal
4. **Provider selection UI** - Dropdown to choose OpenAI/Anthropic/Google
5. **Testing** - Comprehensive test coverage (auth, streaming, persistence)
6. **Legacy cleanup** - Decide on fate of `/api/v1/openai/chats.*` endpoints

See [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md) for full feature roadmap.

---

## 🎯 Recommended Order of Attack

**Week 1** (Foundation):
1. Add Zod validation (#1) - prevents bad data early
2. Type event handlers (#3) - immediate DX improvement
3. Add rate limiting (#2) - critical security fix

**Week 2** (Architecture):
4. Extract message validator (#4) - reduces coupling
5. DI in composables (#5) - enables testing
6. Centralize email validation (#6) - quick win

**Week 3** (Polish):
7. Return types (#7)
8. Logging (#8)
9. CORS config (#9)
10. Request limits (#10)

---

## 📊 Current Code Quality Metrics

**Strengths**:
- ✅ SOLID principles generally followed (SRP, DIP in stores)
- ✅ Secure authentication (Argon2, JWT, timing-safe comparisons)
- ✅ SQL injection protected (parameterized queries)
- ✅ XSS protected (Vue auto-escaping)
- ✅ Strong type system for domain models
- ✅ Clean provider adapter pattern

**Areas for Improvement**:
- ⚠️ Input validation (no schema validation)
- ⚠️ Rate limiting (missing)
- ⚠️ Type safety (some `any` types remain in server handlers)
- ⚠️ Tight coupling (composables depend directly on stores)
- ⚠️ Silent failures (catch blocks without logging)

---

## 💡 Future Enhancements (Beyond Polish)

These go beyond code quality into new capabilities:

- [ ] WebSocket support for real-time streaming
- [ ] Multi-tenancy (team/org model)
- [ ] Usage tracking and cost monitoring
- [ ] Prompt templates and saved prompts
- [ ] Chat export (JSON, Markdown, PDF)
- [ ] Search across chat history
- [ ] Admin dashboard for user management
- [ ] Role-based access control (RBAC)
- [ ] API key management for external integrations
- [ ] Webhook support for chat events

---

**Last updated**: 2025-01-17
**Status**: Ready for focused polish sprints
