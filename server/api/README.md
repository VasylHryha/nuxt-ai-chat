# API Routes (`server/api/`)

**HTTP endpoints for authentication, chat CRUD, and AI streaming**

## What's Here

RESTful API routes and AI streaming endpoints. All routes require authentication except `/api/v1/auth/*`.

## Route Structure

```
/api/v1/
├── ai/                              # Vercel AI SDK endpoints (RECOMMENDED)
│   ├── chats/index.post.ts          # POST /api/v1/ai/chats - Stream chat with persistence
│   ├── chats/index.get.ts           # GET  /api/v1/ai/chats - List chats (legacy?)
│   ├── chats/[id]/messages.post.ts  # POST /api/v1/ai/chats/:id/messages
│   ├── completions/index.post.ts    # POST /api/v1/ai/completions - Text completion
│   └── index.get.ts                 # GET  /api/v1/ai - Health check
│
├── auth/                            # Authentication
│   ├── login.post.ts                # POST /api/v1/auth/login
│   ├── signup.post.ts               # POST /api/v1/auth/signup
│   ├── me.get.ts                    # GET  /api/v1/auth/me
│   └── logout.post.ts               # POST /api/v1/auth/logout
│
├── chats/                           # Chat CRUD (legacy, used for persistence only)
│   ├── index.get.ts                 # GET    /api/v1/chats - List chats
│   ├── create.post.ts               # POST   /api/v1/chats/create - Create chat
│   ├── [chatId].get.ts              # GET    /api/v1/chats/:id - Get chat + messages
│   ├── [chatId].delete.ts           # DELETE /api/v1/chats/:id - Soft delete
│   └── [chatId]/messages.post.ts    # POST   /api/v1/chats/:id/messages - Add message
│
├── users/
│   └── index.get.ts                 # GET /api/v1/users - List users (admin)
│
├── openai/                          # Native/Proxy OpenAI (LEGACY)
│   ├── chat.post.ts                 # Non-streaming
│   └── chat.stream.post.ts          # Manual SSE streaming
│
├── openrouter/                      # Proxy OpenRouter (LEGACY)
│   └── chat.stream.post.ts
│
├── anthropic/                       # Proxy Anthropic (LEGACY)
│   └── chat.stream.post.ts
│
└── google/                          # Proxy Google (LEGACY)
    └── chat.stream.post.ts
```

## Naming Convention

**Pattern:** `[route].[method].ts`

Examples:
- `login.post.ts` → POST /api/v1/auth/login
- `[chatId].get.ts` → GET /api/v1/chats/:chatId
- `index.get.ts` → GET /api/v1/chats (list)

**Dynamic params:** `[paramName]` becomes `event.context.params.paramName`

## Authentication

**All routes** except `/api/v1/auth/*` require authentication via middleware.

### Get authenticated user
```typescript
export default defineEventHandler(async (event) => {
  const authUser = requireUser(event) // { id, email }
  // authUser is guaranteed or 401 thrown
})
```

### Optional auth
```typescript
const user = event.context.user // undefined if not authenticated
```

## Response Patterns

### Success
```typescript
return {
  id: 'chat_123',
  title: 'My conversation',
  createdAt: '2025-01-01T00:00:00.000Z'
}
```

### Error
```typescript
throw createError({
  statusCode: 404,
  statusMessage: 'Chat not found'
})
```

## Key Endpoints

### Auth Routes (`/api/v1/auth/`)

#### POST `/api/v1/auth/signup`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": { "id": "user_123", "email": "...", "name": "..." },
  "expiresIn": 900
}
```

**Side effects:**
- Creates user + password hash
- Sets `access_token` httpOnly cookie (15min TTL)

#### POST `/api/v1/auth/login`
Same as signup, but validates existing credentials.

#### GET `/api/v1/auth/me`
**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### POST `/api/v1/auth/logout`
- Clears `access_token` cookie
- Returns `{ success: true }`

---

### AI SDK Routes (`/api/v1/ai/`) ✅ RECOMMENDED

#### POST `/api/v1/ai/chats`
**Streaming chat with automatic persistence**

**Request:**
```json
{
  "messages": [
    { "id": "msg1", "role": "user", "parts": [{ "type": "text", "text": "Hello" }] },
    { "id": "msg2", "role": "assistant", "parts": [{ "type": "text", "text": "Hi!" }] },
    { "id": "msg3", "role": "user", "parts": [{ "type": "text", "text": "How are you?" }] }
  ],
  "model": "gpt-4o-mini",
  "id": "chat_abc123"  // chatId, required for persistence
}
```

**Response:** Server-Sent Events (SSE) stream

**Implementation:**
```typescript
import { streamText, convertToModelMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const result = streamText({
  model: openai(model),
  messages: convertToModelMessages(messages)
})

return result.toUIMessageStreamResponse({
  originalMessages: messages,
  async onFinish({ messages: finalMessages }) {
    // Save new messages to database
    const newMessages = finalMessages.slice(messages.length - 1)
    for (const msg of newMessages) {
      insertMessage({ chatId, role: msg.role, content: msg.content })
    }
  }
})
```

**Key features:**
- ✅ Handles SSE streaming automatically
- ✅ Persists messages after streaming completes
- ✅ Converts `UIMessage[]` ↔ model format
- ✅ Provider-agnostic (easy to add Anthropic, Google, etc.)

#### POST `/api/v1/ai/completions`
**Text completion (stateless)**

**Request:**
```json
{
  "prompt": "Write a haiku about coding",
  "model": "gpt-4o-mini"
}
```

**Response:** SSE stream of completion text

**No persistence** - completions are stateless.

---

### Chat CRUD Routes (`/api/v1/chats/`)

**Used by AI SDK client for persistence, not for AI streaming.**

#### POST `/api/v1/chats/create`
**Create chat**

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "title": "My conversation",
  "ui": "ai-sdk"
}
```

**Response:**
```json
{
  "id": "chat_abc123"
}
```

**Creates:**
- Default connection (if needed)
- Chat record

#### GET `/api/v1/chats`
**List user's chats**

**Query params:**
- `provider` (optional) - Filter by provider
- `startDate` / `endDate` (optional) - Date range
- `search` (optional) - Search in title/content

**Response:**
```json
[
  {
    "id": "chat_123",
    "title": "My conversation",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "messageCount": 5,
    "lastMessagePreview": "How are you?",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:05:00.000Z"
  }
]
```

#### GET `/api/v1/chats/:chatId`
**Get chat with messages**

**Response:**
```json
{
  "chat": {
    "id": "chat_123",
    "title": "My conversation",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello",
      "createdAt": "..."
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Hi there!",
      "createdAt": "...",
      "providerGenerationId": "msg-abc123"
    }
  ]
}
```

#### DELETE `/api/v1/chats/:chatId`
**Soft delete chat**

**Response:**
```json
{
  "success": true
}
```

#### POST `/api/v1/chats/:chatId/messages`
**Add message (legacy, not used by AI SDK)**

**Request:**
```json
{
  "role": "user",
  "content": "Hello world"
}
```

---

### Legacy Provider Routes

**These are manual SSE streaming implementations.**

**Status:** Not recommended, use `/api/v1/ai/chats` instead.

**Routes:**
- `POST /api/v1/openai/chat.stream` - Manual OpenAI streaming
- `POST /api/v1/anthropic/chat.stream` - Manual Anthropic streaming
- `POST /api/v1/google/chat.stream` - Manual Google streaming
- `POST /api/v1/openrouter/chat.stream` - Manual OpenRouter streaming

**Issues:**
- Manual SSE parsing required on client
- No built-in persistence
- Harder to maintain

**Replacement:** Use AI SDK with provider adapters instead.

---

## Event Handler Patterns

### Basic Handler
```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const params = getRouterParam(event, 'chatId')
  const query = getQuery(event)

  return { data: 'response' }
})
```

### Lazy Handler (for DB/provider setup)
```typescript
export default defineLazyEventHandler(async () => {
  // Setup once (expensive operations)
  const openai = createOpenAI({ apiKey: useRuntimeConfig().openaiApiKey })

  return defineEventHandler(async (event) => {
    // Handle each request
    const result = streamText({ model: openai('gpt-4o-mini'), ... })
    return result.toUIMessageStreamResponse()
  })
})
```

**Use lazy handlers when:**
- Initializing AI provider clients
- Database connections
- Expensive one-time setup

### Streaming Handler
```typescript
return result.toUIMessageStreamResponse({
  originalMessages: messages,
  async onFinish({ messages: finalMessages }) {
    // Called when streaming completes
    // Save to database here
  }
})
```

## Request Validation

### Using Zod (auto-imported)
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const body = await safeValidate(readBody(event), schema)
  // body is typed and validated
})
```

**Predefined schemas (auto-imported):**
- `loginSchema` - email + password
- `signupSchema` - email + password + name

## Error Handling

### User-facing errors
```typescript
throw createError({
  statusCode: 400,
  statusMessage: 'Invalid input'
})
```

### Internal errors
```typescript
try {
  // risky operation
} catch (error: unknown) {
  console.error('[Component] Error:', error)
  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error'
  })
}
```

**Never expose:**
- Stack traces in production
- Database error details
- API keys or secrets

## CORS & Headers

**Handled by Nuxt/Nitro automatically.**

For custom headers:
```typescript
setHeader(event, 'X-Custom-Header', 'value')
```

## Rate Limiting

**Not implemented yet.**

Future:
- Add rate limiting middleware
- Use Redis or in-memory store
- Per-user or per-IP limits

## Testing

**Location:** `tests/server/api/`

**Pattern:**
```typescript
import { describe, it, expect } from 'bun:test'

describe('POST /api/v1/auth/login', () => {
  it('returns token for valid credentials', async () => {
    const response = await $fetch('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'password' }
    })

    expect(response.token).toBeDefined()
  })
})
```

## Common Patterns

### Get authenticated user
```typescript
const authUser = requireUser(event)
console.log(authUser.id, authUser.email)
```

### Parse request body
```typescript
const body = await readBody(event)
const { email, password } = body
```

### Get route params
```typescript
const chatId = getRouterParam(event, 'chatId')
```

### Get query params
```typescript
const query = getQuery(event)
const page = Number(query.page) || 1
```

### Set cookie
```typescript
setAccessCookie(event, token, 900) // 15min TTL
```

### Return JSON
```typescript
return { data: 'response' }  // Auto-serialized
```

### Stream response
```typescript
return result.toUIMessageStreamResponse()
```

## Future Improvements

- [ ] Add rate limiting middleware
- [ ] WebSocket support for real-time features
- [ ] Batch message operations
- [ ] Search endpoint with full-text search
- [ ] Export chat as markdown/JSON
