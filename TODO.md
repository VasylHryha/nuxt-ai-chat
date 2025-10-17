# TODO: Code Quality, Testing & Polish Tasks

This document tracks remaining improvements to bring the codebase to production-ready status.

---

## 🧪 Test Coverage Status & Plan

### ✅ Current Test Coverage (7 test files, ~40 tests)

**Excellent Coverage:**
1. **JWT Utils** (`tests/server/utils/jwt.spec.ts`) ✅
   - Sign/verify with issuer enforcement
   - Tampering detection (signature validation)
   - Token expiration
   - Issuer mismatch rejection
   - **Assessment**: Complete, well-tested

2. **Password Utils** (`tests/server/utils/password.spec.ts`) ✅
   - Hash with deterministic test mock
   - Verify hashed passwords (correct/wrong)
   - **Assessment**: Adequate for Argon2 wrapper

3. **Auth Middleware** (`tests/server/middleware/auth.global.spec.ts`) ✅
   - Public routes (no token required)
   - Protected routes (missing token rejection)
   - Valid Bearer token → user context
   - Invalid cookie tokens
   - **Assessment**: Core auth flow covered

4. **Provider Adapters** (`tests/app/services/providers.spec.ts`) ✅
   - AI SDK provider payload structure
   - Native OpenAI provider endpoint
   - Proxy provider factory (generic)
   - **Assessment**: Provider pattern verified

5. **Auth API Routes** (`tests/server/api/auth.spec.ts`) ✅
   - Signup with cookie setting
   - Duplicate signup rejection
   - Login with correct password
   - Login with wrong password rejection
   - /me with valid context
   - /me without user (401)
   - Logout cookie clearing
   - **Assessment**: Complete auth lifecycle

6. **Chat API** (`tests/server/api/chats.spec.ts`) ✅
   - List chats by user email
   - Missing email rejection (400)
   - Unknown user (404)
   - Proxy POST to provider endpoint
   - Missing provider rejection
   - **SSE streaming with persistence** (excellent!)
   - **Assessment**: Core chat operations covered

7. **Chat Repository** (`tests/app/services/chatRepository.spec.ts`) ✅
   - Load from localStorage (offline-first)
   - Save with debounced PUT
   - Conflict resolution (last-write-wins merge)
   - Remote sync pull
   - **Assessment**: Persistence layer well-tested

### 🟡 Priority 1: Core Functionality Gaps (HIGH)

#### T1.1: Database Layer Tests
**Status**: ✅ Completed
**Files**: `tests/server/db/users.spec.ts`, `tests/server/db/chats.spec.ts`
**Coverage**:
- User CRUD (insert/list/lookups), uniqueness constraints
- Password credential upsert behavior + cascade on delete
- Chat creation with reusable connections and filter queries
- Foreign key cascade from user → chats/connections

#### T1.2: Multi-User Authorization Tests
**Status**: ✅ Completed
**Files**: `tests/server/api/authorization.spec.ts`, guarded routes updated
**Coverage**:
- Ensures authenticated users cannot query other users’ chats (403)
- Blocks streaming into chats not owned by the requester (404)
- `/api/v1/chats` GET/POST and streaming handlers now require auth context

#### T1.3: Input Validation Tests
**Status**: ✅ Completed
**Files**: `tests/server/api/validation.spec.ts`, shared validator utilities
**Coverage**:
- Signup/login email format enforcement + password length checks
- Chat proxy provider/message validation (roles/content)
- Injection attempts rejected with explicit 400 responses

### 🟠 Priority 2: Error Handling & Edge Cases (MEDIUM)

#### T2.1: Provider Error Handling Tests
**Status**: ✅ Completed
**Files**: `tests/app/services/providers.spec.ts`
**Coverage**:
- Aborted requests propagate `AbortError`
- 429 and 500 responses surface structured errors
- Non-JSON/malformed payloads handled without crashes
- Timeout/backoff checks remain TODO (future enhancement)

#### T2.2: Chat Repository Conflict Resolution Tests
**Status**: ✅ Completed
**Files**: `tests/app/services/chatRepository.spec.ts`
**Coverage**:
- Concurrent offline/remote messages merged with correct ordering
- Remote session removal clears local `currentSessionId` while preserving data
- Network failure during sync returns local snapshot without side effects
- Remaining wishlist: localStorage quota + exponential backoff handling

#### T2.3: SSE Streaming Error Tests
**Status**: ✅ Completed
**Files**: `tests/server/api/chats.spec.ts`, streaming handler updates
**Coverage**:
- Mid-stream provider failures emit 502 errors and avoid assistant persistence
- Console logging added for easier debugging
- Remaining wishlist: client disconnect detection & DB write failure simulation

### 🟢 Priority 3: Integration & E2E Tests (LOW-MEDIUM)

#### T3.1: Full Auth Flow Integration Test
**Missing**: End-to-end signup → login → access protected resource
**Files to create**: `tests/integration/auth-flow.spec.ts`
**Effort**: 1 hour
**Why**: Validates complete user journey

**Tests needed**:
- Signup → auto-login → access /me → list chats
- Logout → re-login → access same chats
- Expired token → 401 → refresh flow (if implemented)

#### T3.2: Full Chat Flow Integration Test
**Missing**: Create user → create chat → send message → persist → retrieve
**Files to create**: `tests/integration/chat-flow.spec.ts`
**Effort**: 1 hour
**Why**: Validates end-to-end chat lifecycle

**Tests needed**:
- User creates chat → sends message → receives AI response → persists
- User lists chats → resumes existing chat → sends follow-up
- User switches providers mid-conversation

### 🔵 Priority 4: Performance & Load Tests (NICE-TO-HAVE)

#### T4.1: Concurrency Tests
**Missing**: Multiple simultaneous requests
**Files to create**: `tests/performance/concurrency.spec.ts`
**Effort**: 2 hours
**Why**: Ensures thread-safety, connection pooling

**Tests needed**:
- 10 simultaneous logins (different users)
- 5 concurrent streaming sessions
- Database connection pool under load
- Race conditions in chat repository merge

#### T4.2: Large Data Tests
**Missing**: Behavior with many chats/messages
**Files to create**: `tests/performance/large-data.spec.ts`
**Effort**: 1 hour
**Why**: Validates pagination, query performance

**Tests needed**:
- User with 1000 chats → list performance
- Chat with 100 messages → load performance
- Message limits enforcement (50 messages, 100k chars)

---

## 📊 Test Priority Matrix

| Priority | Category | Tests Needed | Effort | Impact |
|----------|----------|--------------|--------|--------|
| **P1** | Database CRUD | 15 tests | 2h | HIGH |
| **P1** | Multi-user auth | 8 tests | 1h | CRITICAL |
| **P1** | Input validation | 12 tests | 1h | HIGH |
| **P2** | Provider errors | 8 tests | 45min | MEDIUM |
| **P2** | Conflict resolution | 10 tests | 1h | MEDIUM |
| **P2** | Streaming errors | 6 tests | 45min | MEDIUM |
| **P3** | Auth flow E2E | 5 tests | 1h | LOW |
| **P3** | Chat flow E2E | 5 tests | 1h | LOW |
| **P4** | Concurrency | 8 tests | 2h | LOW |
| **P4** | Large data | 6 tests | 1h | LOW |

**Total estimated effort**: ~12 hours for complete coverage

---

## 🎯 Recommended Test Implementation Order

**Week 1** (Foundation - ~4 hours):
1. T1.1: Database layer tests (2h) - Critical data integrity
2. T1.2: Multi-user authorization (1h) - Security critical
3. T1.3: Input validation (1h) - Prevents bad data early

**Week 2** (Robustness - ~3 hours):
4. T2.1: Provider error handling (45min)
5. T2.2: Conflict resolution (1h)
6. T2.3: Streaming errors (45min)

**Week 3** (Integration - ~2 hours):
7. T3.1: Auth flow E2E (1h)
8. T3.2: Chat flow E2E (1h)

**Optional** (Performance):
9. T4.1: Concurrency tests (2h)
10. T4.2: Large data tests (1h)

---

## ✅ Test Quality Assessment

### What's Excellent About Current Tests:

1. **Proper Mocking**:
   - Uses Vitest's `vi.fn()` and `vi.mock()` correctly
   - Mock lifecycle management (beforeEach cleanup)
   - Deterministic time with `vi.useFakeTimers()`

2. **Good Assertions**:
   - Tests both success and failure paths
   - Verifies HTTP status codes and error messages
   - Checks side effects (cookies, database inserts)
   - Uses `toMatchObject` for flexible matching
   - Inline snapshots for payload verification

3. **Test Isolation**:
   - Database reset between tests (`__NUXT_RESET_DB__`)
   - localStorage cleared per test
   - No test interdependencies

4. **Realistic Scenarios**:
   - SSE streaming test is particularly well-done
   - Conflict resolution merge test covers complex case
   - Security tests (tampering, expiration) are thorough

### Minor Improvements Possible:

1. **Add describe blocks for grouping**:
   ```ts
   describe('error handling', () => {
     it('rejects missing credentials')
     it('rejects invalid tokens')
   })
   ```

2. **Extract test helpers**:
   - `createJsonEvent` appears in multiple files → shared utility
   - User creation fixture: `createTestUser()`

3. **Add parameterized tests** for similar cases:
   ```ts
   it.each([
     ['invalid-email', 400],
     ['user@toolong'.repeat(100), 400],
   ])('rejects malformed email: %s', async (email, expectedCode) => {
     // test
   })
   ```

---

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
