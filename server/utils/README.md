# Server Utils (`server/utils/`)

**Auto-imported helper functions available globally in server code**

## What's Here

Utility functions for authentication, validation, ID generation, and AI providers.

## ⚡ Auto-Imports (CRITICAL)

**All exports from `server/utils/*.ts` are auto-imported by Nuxt.**

**You can use these WITHOUT importing:**
```typescript
// ✅ Good - auto-imported
export default defineEventHandler(async (event) => {
  const hash = await hashPassword('password')
  const token = signJWT(payload, options)
  const user = requireUser(event)
})

// ❌ Bad - manual import not needed
import { hashPassword } from '@/server/utils/password'
```

**Exception:** Database functions must be imported explicitly.

## File Overview

```
server/utils/
├── auth.ts        # JWT cookie handling, token extraction, requireUser()
├── jwt.ts         # Sign and verify JWT tokens
├── password.ts    # Argon2 password hashing
├── validators.ts  # Zod schemas (login, signup)
├── id.ts          # Nanoid ID generation
├── ai.ts          # AI provider helpers (legacy)
└── requireKey.ts  # Validate env vars (legacy)
```

---

## `auth.ts` - Authentication Helpers

### `getTokenFromRequest(event)`
Extracts JWT from `Authorization` header or cookie.

```typescript
const token = getTokenFromRequest(event)
// Returns: string (empty if not found)
```

**Checks in order:**
1. `Authorization: Bearer <token>` header
2. `access_token` httpOnly cookie

### `setAccessCookie(event, token, maxAgeSec)`
Sets httpOnly cookie with JWT.

```typescript
setAccessCookie(event, token, 900) // 15 minutes
```

**Cookie settings:**
- `httpOnly: true` - JS can't access (XSS protection)
- `sameSite: 'lax'` - CSRF protection
- `secure: false` in dev, `true` in prod
- `path: '/'` - All routes
- `maxAge: number` - TTL in seconds

### `clearAccessCookie(event)`
Deletes access token cookie.

```typescript
clearAccessCookie(event)
```

### `getAuthUser(event)`
Returns authenticated user or null.

```typescript
const user = getAuthUser(event)
// Returns: { id: string, email: string } | null
```

**Note:** Prefer using `requireUser()` instead (throws 401).

### `requireUser(event)`
Returns authenticated user or throws 401.

```typescript
const authUser = requireUser(event)
// Returns: { id: string, email: string }
// Throws: 401 if not authenticated
```

**Use in protected routes:**
```typescript
export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)
  // authUser is guaranteed here
})
```

---

## `jwt.ts` - JWT Signing/Verification

**Uses:** `jose` library (modern JWT library for Node/Bun)

### `signJWT(payload, options)`
Creates signed JWT token.

```typescript
const token = signJWT(
  { sub: userId, email: 'user@example.com' },
  {
    secret: 'your-secret',
    expiresInSec: 900,        // 15 minutes
    issuer: 'nuxt-ai-chat'
  }
)
```

**Payload:**
- `sub` (subject) - User ID
- `email` - User email
- `iat` (issued at) - Auto-added
- `exp` (expiry) - Auto-added based on `expiresInSec`
- `iss` (issuer) - Custom issuer

**Algorithm:** HS256 (HMAC-SHA256)

### `verifyJWT(token, secret, options)`
Verifies JWT signature and claims.

```typescript
const payload = verifyJWT(token, secret, { issuer: 'nuxt-ai-chat' })
// Returns: { sub, email, iat, exp, iss }
// Throws: If invalid, expired, or wrong issuer
```

**Validates:**
- ✅ Signature matches secret
- ✅ Not expired (`exp` claim)
- ✅ Issuer matches (if provided)

---

## `password.ts` - Password Hashing

**Uses:** `@node-rs/argon2` (Argon2id algorithm)

### `hashPassword(password)`
Hashes password with Argon2id.

```typescript
const hash = await hashPassword('user-password')
// Returns: string (Argon2 hash)
```

**Parameters (hardcoded):**
- Algorithm: Argon2id
- Memory: 19456 KiB
- Iterations: 2
- Parallelism: 1

**Async:** Always await this function.

### `verifyPassword(hash, password)`
Verifies password against hash.

```typescript
const valid = await verifyPassword(storedHash, userInput)
// Returns: boolean
```

**Timing-safe:** Prevents timing attacks.

**Async:** Always await this function.

---

## `validators.ts` - Zod Schemas

**Uses:** Zod for runtime validation

### `safeValidate(dataPromise, schema)`
Validates and returns typed data.

```typescript
const body = await safeValidate(readBody(event), loginSchema)
// Returns: { email: string, password: string }
// Throws: 400 if validation fails
```

**Error format:**
```json
{
  "statusCode": 400,
  "statusMessage": "Validation failed",
  "data": {
    "issues": [
      { "path": ["email"], "message": "Invalid email" }
    ]
  }
}
```

### Predefined Schemas

**`loginSchema`**
```typescript
{
  email: string (email format)
  password: string (min 1 char)
}
```

**`signupSchema`**
```typescript
{
  email: string (email format)
  password: string (min 8 chars)
  name: string (min 1 char)
}
```

**Usage:**
```typescript
export default defineEventHandler(async (event) => {
  const { email, password } = await safeValidate(readBody(event), loginSchema)
  // email and password are validated and typed
})
```

---

## `id.ts` - ID Generation

**Uses:** `nanoid` library

### `newId(prefix)`
Generates unique ID with prefix.

```typescript
const userId = newId('user')      // user_abc123xyz
const chatId = newId('chat')      // chat_def456uvw
const messageId = newId('msg')    // msg_ghi789rst
```

**Format:** `{prefix}_{random}`
**Length:** 21 characters random part (URL-safe)
**Collision:** ~1% probability in 1 billion IDs

**Used for:**
- User IDs (`user_`)
- Chat IDs (`chat_`)
- Message IDs (`msg_`)
- Connection IDs (`conn_`)

---

## `ai.ts` - AI Provider Helpers (Legacy)

**Status:** Legacy, prefer Vercel AI SDK

Contains helpers for manual AI provider integration.

**Not actively used** in current AI SDK implementation.

---

## `requireKey.ts` - Environment Variable Validation (Legacy)

**Status:** Legacy

Helper to validate required env vars.

**Not actively used** - prefer direct checks:
```typescript
const config = useRuntimeConfig()
if (!config.openaiApiKey)
  throw new Error('OPENAI_API_KEY missing')
```

---

## Common Patterns

### Create user with password
```typescript
import { createUser } from '@/server/db/users'

const hash = await hashPassword(password)
const user = createUser({ email, name, passwordHash: hash })
```

### Login flow
```typescript
import { getPasswordHashByEmail } from '@/server/db/users'

const { email, password } = await safeValidate(readBody(event), loginSchema)
const record = getPasswordHashByEmail(email)

if (!record || !(await verifyPassword(record.hash, password))) {
  throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
}

const token = signJWT({ sub: record.user.id, email }, { secret, expiresInSec: 900 })
setAccessCookie(event, token, 900)

return { token, user: record.user }
```

### Protected route
```typescript
export default defineEventHandler(async (event) => {
  const authUser = requireUser(event) // Auto-imported
  // authUser: { id: string, email: string }
})
```

---

## Security Best Practices

### Password Hashing
- ✅ Use Argon2id (memory-hard, GPU-resistant)
- ✅ Never log passwords or hashes
- ✅ Store hash in separate `credentials` table

### JWT
- ✅ Use strong secret (`openssl rand -base64 32`)
- ✅ Short TTL (15min recommended)
- ✅ httpOnly cookies (prevent XSS)
- ✅ Verify issuer claim

### Validation
- ✅ Validate all user input with Zod
- ✅ Return user-friendly errors (don't expose stack traces)
- ✅ Type-safe after validation

---

## Environment Variables

**Accessed via `useRuntimeConfig()` (auto-available):**

```typescript
const config = useRuntimeConfig()

// Private (server-only)
config.jwtSecret
config.openaiApiKey
config.anthropicApiKey

// Public (client-accessible)
config.public.openaiModel
```

**Never expose private vars to client!**

---

## TypeScript Types

### JWT Payload
```typescript
interface JWTPayload {
  sub: string    // User ID
  email: string  // User email
  iat: number    // Issued at (Unix timestamp)
  exp: number    // Expiry (Unix timestamp)
  iss: string    // Issuer ('nuxt-ai-chat')
}
```

### Auth User
```typescript
interface AuthUser {
  id: string
  email: string
}
```

---

## Testing

**Mock auth user:**
```typescript
const mockUser = { id: 'user_123', email: 'test@example.com' }
event.context.user = mockUser
```

**Generate test token:**
```typescript
const token = signJWT(
  { sub: 'user_123', email: 'test@example.com' },
  { secret: 'test-secret', expiresInSec: 3600 }
)
```

---

## Common Issues

### "Function not found"
- **Cause:** Not auto-imported (e.g., DB function)
- **Fix:** Import explicitly: `import { fn } from '@/server/db/file'`

### "Circular dependency"
- **Cause:** Utils importing from each other
- **Fix:** Refactor to remove circular imports

### "Password hash not working"
- **Cause:** Not awaiting `hashPassword()` or `verifyPassword()`
- **Fix:** Always use `await`

---

## Future Improvements

- [ ] Add refresh token helpers
- [ ] Add MFA (TOTP) helpers
- [ ] Add email verification helpers
- [ ] Add password reset helpers
- [ ] Add OAuth helpers (Google, GitHub)
