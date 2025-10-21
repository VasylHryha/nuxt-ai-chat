# Middleware (`server/middleware/`)

**Request interceptors that run before API handlers**

## What's Here

Middleware that processes **every incoming request** before reaching route handlers.

## Execution Order

Middleware files run in **alphabetical order** by filename:

```
00.logs.ts    → Request logging (REMOVED/legacy)
01.auth.ts    → JWT authentication (ACTIVE)
```

**Prefix numbers (00, 01)** control execution order.

## Active Middleware

### `01.auth.ts` - Authentication Middleware

**Runs on:** Every API request

**Purpose:** Verify JWT and attach user to request context

**Flow:**
```
1. Check if route is public (whitelist)
   ↓ YES → Skip auth, continue
   ↓ NO  → Verify JWT

2. Extract token from:
   - Authorization: Bearer <token> header
   - access_token httpOnly cookie

3. Verify JWT signature + expiry
   ↓ VALID   → Attach user to event.context.user
   ↓ INVALID → Throw 401 Unauthorized

4. Continue to route handler
```

**Implementation:**
```typescript
export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  // Skip auth for public routes
  if (isPublic(url.pathname)) {
    return
  }

  // Extract token
  const token = getTokenFromRequest(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing token' })
  }

  // Verify JWT
  const payload = verifyJWT(token, jwtSecret, { issuer: 'nuxt-ai-chat' })

  // Attach user to context
  event.context.user = {
    id: String(payload.sub),
    email: String(payload.email || '')
  }
})
```

**Public routes (whitelisted):**
- `/api/v1/auth/*` - Login, signup, me, logout
- `/api/public/*` - Any public APIs
- `/api/_nuxt_icon/*` - Nuxt Icon asset proxy
- `/favicon.ico` - Favicon

**All other `/api/*` routes require authentication.**

**Non-API routes** (pages, assets) are skipped - client middleware handles those.

## How Route Handlers Use Auth

### Require authenticated user
```typescript
export default defineEventHandler(async (event) => {
  const authUser = requireUser(event) // Throws 401 if not authenticated
  console.log(authUser.id, authUser.email)
})
```

### Optional auth
```typescript
export default defineEventHandler(async (event) => {
  const user = event.context.user // undefined if not authenticated
  if (user) {
    console.log('Authenticated:', user.email)
  } else {
    console.log('Anonymous request')
  }
})
```

## Context Type Extension

**Middleware adds `user` to H3 event context:**

```typescript
declare module 'h3' {
  interface H3EventContext {
    user?: { id: string, email: string } | null
  }
}
```

This provides TypeScript autocomplete for `event.context.user`.

## Token Extraction

**From `server/utils/auth.ts` (auto-imported):**

```typescript
function getTokenFromRequest(event: H3Event) {
  // 1. Check Authorization header
  const auth = getHeader(event, 'authorization') || ''
  if (auth.startsWith('Bearer '))
    return auth.slice(7).trim()

  // 2. Fallback to cookie
  const cookie = getCookie(event, 'access_token')
  return cookie || ''
}
```

**Priority:**
1. `Authorization: Bearer <token>` header (for API clients)
2. `access_token` httpOnly cookie (for browser)

## JWT Verification

**Uses `verifyJWT()` from `server/utils/jwt.ts`:**

```typescript
const payload = verifyJWT(token, secret, { issuer: 'nuxt-ai-chat' })
```

**Validates:**
- ✅ Signature (HMAC-SHA256)
- ✅ Expiry (`exp` claim)
- ✅ Issuer (`iss` claim)

**Throws if:**
- ❌ Signature invalid
- ❌ Token expired
- ❌ Wrong issuer

## Error Responses

### Missing token
```json
{
  "statusCode": 401,
  "statusMessage": "Missing token"
}
```

### Invalid/expired token
```json
{
  "statusCode": 401,
  "statusMessage": "Invalid or expired token"
}
```

### Missing JWT_SECRET
```json
{
  "statusCode": 500,
  "statusMessage": "JWT_SECRET missing"
}
```

## Logging

**Current behavior:**
```typescript
// Success
console.info(`auth ok: user@example.com -> /api/v1/chats`)

// Failure
console.warn(`auth failed: /api/v1/chats`)
console.error(error)
```

## Security Notes

1. **httpOnly cookies prevent XSS:**
   - JavaScript cannot read `access_token` cookie
   - Only sent in HTTP requests

2. **JWT signed with secret:**
   - Cannot be tampered without knowing `JWT_SECRET`
   - Generated with: `openssl rand -base64 32`

3. **Short TTL (15min):**
   - Limits exposure if token stolen
   - User must re-login every 15 minutes

4. **No token refresh:**
   - Current implementation doesn't refresh tokens
   - Future: Add refresh token mechanism

## Common Issues

### "Missing token" on valid request
- **Cause:** Cookie not being sent (CORS, secure flag in dev)
- **Fix:** Set `secure: false` in development (already done)

### "Invalid or expired token"
- **Cause 1:** Token TTL expired (15min)
- **Fix:** User must re-login
- **Cause 2:** JWT_SECRET changed
- **Fix:** All users must re-login

### Middleware runs twice
- **Cause:** Both server and client middleware
- **Note:** Normal - server validates API, client validates routes

## Client Middleware Coordination

**Server middleware:** Protects `/api/*` routes
**Client middleware:** Protects page routes (redirects to login)

**Together:**
- Server: User can't call protected APIs without token
- Client: User can't view protected pages without auth

See: `app/middleware/auth.global.ts`

## Future Improvements

- [ ] Add rate limiting middleware
- [ ] Add request ID middleware (tracing)
- [ ] Add CORS middleware (if needed)
- [ ] Refresh token mechanism
- [ ] Session revocation (blacklist)

## Testing

**Mock authenticated user in tests:**

```typescript
import { describe, it, expect } from 'bun:test'

describe('Protected API', () => {
  it('requires authentication', async () => {
    // Without token
    await expect($fetch('/api/v1/chats')).rejects.toThrow('401')
  })

  it('allows authenticated user', async () => {
    const token = signJWT({ sub: 'user_123', email: 'test@example.com' })
    const response = await $fetch('/api/v1/chats', {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(response).toBeDefined()
  })
})
```

## Debugging

**Enable verbose logging:**
```typescript
console.log('auth', url?.pathname, url) // Uncomment line 28
```

**Check token extraction:**
```typescript
const token = getTokenFromRequest(event)
console.log('Token:', token ? 'present' : 'missing')
```

**Verify JWT payload:**
```typescript
const payload = verifyJWT(token, jwtSecret, { issuer: 'nuxt-ai-chat' })
console.log('Payload:', payload)
```
