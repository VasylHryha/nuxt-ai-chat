# Server Directory

**Server-side code for Nuxt AI Chat application**

## What's Here

This directory contains all backend logic: API routes, database access, authentication, and server utilities.

## Technology Stack

- **Nitro** - Nuxt's server engine
- **H3** - HTTP event framework
- **Bun SQLite** (`bun:sqlite`) - Native database driver
- **JWT (HS256)** - Authentication tokens
- **Argon2id** - Password hashing

## Directory Structure

```
server/
├── api/           # HTTP endpoints (RESTful + AI streaming)
├── db/            # Database queries and schema
├── middleware/    # Request interceptors (auth, logging)
└── utils/         # Auto-imported helpers (JWT, password, validators)
```

## Auto-Imports (IMPORTANT)

### Server Utils (Auto-imported)
All files in `server/utils/*.ts` are **auto-imported globally** by Nuxt.

**You can use these WITHOUT importing:**
- `hashPassword()`, `verifyPassword()`
- `signJWT()`, `verifyJWT()`
- `setAccessCookie()`, `getTokenFromRequest()`, `requireUser()`
- `safeValidate()`, `loginSchema`, `signupSchema`, `createChatSchema`
- `rid()` - ID generation helper

### Shared Types (Auto-imported)
All types in `shared/types/*.ts` are **auto-imported** on both client and server.

**You can use these WITHOUT importing:**
- `Role`, `ChatMessage`, `Session`, `Profile`, `DirectorySnapshot`
- `AgentChatRequestBody`, `AiChatRequestBody`
- `WebSearchResult`, `CalculatorResult`, `DateTimeResult`, etc.

### Must Import Manually
**You MUST manually import:**
- Database functions from `server/db/*.ts`
- Types from `server/db/types.ts` or `app/types/*.ts`
- Third-party packages

## Request Flow

```
1. HTTP Request
   ↓
2. Middleware (00.logs.ts → 01.auth.ts)
   ↓
3. API Route Handler
   ↓
4. Database Queries (if needed)
   ↓
5. Response
```

## Authentication Flow

**Every API request goes through:**
1. `middleware/01.auth.ts` verifies JWT from cookie or header
2. Attaches `event.context.user` if valid
3. Route handlers use `requireUser(event)` to enforce auth

**Login creates:**
- JWT token (15min TTL)
- httpOnly cookie (`access_token`)
- Returns token + user object

## Key Patterns

### Event Handler
```typescript
export default defineEventHandler(async (event) => {
  const authUser = requireUser(event) // Throws 401 if not authenticated
  const body = await readBody(event)  // Parse request body

  // Your logic here

  return { data: 'response' }
})
```

### Lazy Event Handler (for DB connections)
```typescript
export default defineLazyEventHandler(async () => {
  // Setup once (DB connections, provider clients)
  const client = createClient()

  return defineEventHandler(async (event) => {
    // Handle each request
  })
})
```

## Error Handling

```typescript
// User-friendly errors
throw createError({
  statusCode: 400,
  statusMessage: 'Invalid input'
})

// Log details internally
console.error('[Component] Error details:', error)
```

## Environment Variables

Accessed via `useRuntimeConfig()`:

```typescript
const config = useRuntimeConfig()
config.jwtSecret           // Private (server-only) - NUXT_JWT_SECRET
config.openaiApiKey        // Private - NUXT_OPENAI_API_KEY
config.openrouterApiKey    // Private - NUXT_OPENROUTER_API_KEY
config.tavilyApiKey        // Private - NUXT_TAVILY_API_KEY
config.braveApiKey         // Private - NUXT_BRAVE_API_KEY (for agents)
config.dbPath              // Private - NUXT_DB_PATH
config.public.openaiModel  // Public (client-accessible) - NUXT_PUBLIC_OPENAI_MODEL
config.public.appTitle     // Public - NUXT_PUBLIC_APP_TITLE
```

**Note**: All runtime config vars use `NUXT_` prefix in `.env.local`

## See Also

- [server/api/README.md](./api/README.md) - API routes
- [server/db/README.md](./db/README.md) - Database layer
- [server/middleware/README.md](./middleware/README.md) - Request middleware
- [server/utils/README.md](./utils/README.md) - Helper functions
