# AI Architecture Documentation

**For AI Agents & Developers**

This document explains the AI/chat architecture, patterns, and technologies used in this project.

---

## Overview

This project uses **Vercel AI SDK** for streaming AI chat and completion features with **server-side persistence** to SQLite.

**Key Pattern:** Client only talks to Nuxt backend; backend handles all AI provider communication and database persistence.

---

## Technology Stack

### AI SDK & Providers
- **[@ai-sdk/vue](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)** - Vue composables for chat/completion UI
- **[@ai-sdk/openai](https://ai-sdk.dev/providers/ai-sdk-providers/openai)** - OpenAI provider adapter
- **[ai](https://www.npmjs.com/package/ai)** - Core AI SDK (`streamText`, `convertToModelMessages`)

### Authentication
- **JWT (HS256)** - Token-based auth
- **httpOnly cookies** - Secure token storage (15min TTL)
- **@node-rs/argon2** - Password hashing (Argon2id)

### Database
- **Bun SQLite (`bun:sqlite`)** - Native Bun database driver
- **Schema:** `users`, `credentials`, `chats`, `messages`

### Framework
- **Nuxt 4** - Vue meta-framework with auto-imports
- **Nitro** - Server engine
- **H3** - HTTP framework

---

## AI SDK Integration Patterns

### 1. Chat Pattern (Conversational AI)

**Use case:** Multi-turn conversations with message history

**Client:** `/app/pages/ai-chat/`
```typescript
import { Chat } from '@ai-sdk/vue'
import { useAiChatSession } from '@/composables/useAiChatSession'

const { chat } = useAiChatSession()
chat.sendMessage({ text: 'Hello' })
```

**Composable:** `/app/composables/useAiChatSession.ts`
- Uses `Chat` class from `@ai-sdk/vue`
- Sends all messages (`UIMessage[]`) to server
- Creates chat in DB on first message
- Server handles persistence via `onFinish` callback

**Server:** `/server/api/v1/ai/chats/index.post.ts`
```typescript
import { streamText, convertToModelMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const result = streamText({
  model: openai(model),
  messages: convertToModelMessages(messages), // Convert UIMessage[] to model format
})

return result.toUIMessageStreamResponse({
  originalMessages: messages,
  async onFinish({ messages: finalMessages }) {
    // Save to database here (all messages including new AI response)
    insertMessage({ chatId, role, content })
    updateChatTimestamp(chatId)
  }
})
```

**Flow:**
1. User types message → Client appends to `chat.messages`
2. `prepareSendMessagesRequest()` creates chat if needed, sends all messages + chatId
3. Server streams AI response via SSE
4. `onFinish()` callback saves **both user and assistant messages** to DB
5. Client UI updates in real-time during streaming

---

### 2. Completion Pattern (Stateless Text Generation)

**Use case:** Single-shot text completion (no conversation history)

**Client:** `/app/pages/completion.vue`
```typescript
import { Completion } from '@ai-sdk/vue'
import { useAiCompletion } from '@/composables/useAiCompletion'

const { completion } = useAiCompletion()
completion.submit({ prompt: 'Write a haiku' })
```

**Server:** `/server/api/v1/ai/completions/index.post.ts`
```typescript
const result = streamText({
  model: openai(model),
  prompt, // Single string, no message history
})

return result.toUIMessageStreamResponse()
```

**Flow:**
1. User enters prompt → Client sends single string
2. Server streams completion via SSE
3. No persistence (stateless)
4. Client displays streaming text

---

## Database Persistence Strategy

### Chat Creation
**Endpoint:** `POST /api/v1/chats/create`
- Creates chat record with provider/model/title
- Returns `chatId`
- Triggered on first message (client-side)

### Message Persistence
**Location:** Server-side `onFinish` callback in `/server/api/v1/ai/chats/index.post.ts`

**Why server-side?**
- ✅ Knows exactly when streaming completes
- ✅ Has full message history including new assistant response
- ✅ No race conditions or timing issues
- ✅ Follows Vercel AI SDK best practices

**Pattern:**
```typescript
onFinish({ messages: finalMessages }) {
  // Calculate which messages are new
  const existingMessages = messages.length - 1 // Original request messages
  const newMessages = finalMessages.slice(existingMessages) // New assistant response

  for (const msg of newMessages) {
    const content = msg.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('\n')

    insertMessage({ chatId, role: msg.role, content })
  }
}
```

### Chat Loading
**Endpoint:** `GET /api/v1/chats/:chatId`
- Returns chat metadata + all messages
- Client converts to `UIMessage[]` format
- Replaces `chat.messages` array

---

## Message Format Conversion

### UIMessage (Client/Storage)
```typescript
interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: 'text', text: string }>
}
```

### Model Messages (AI Provider)
```typescript
interface ModelMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
```

**Conversion:** `convertToModelMessages()` handles this automatically

---

## Authentication Flow

### Cookie-based JWT
**Why cookies?**
- ✅ Persists across page reloads
- ✅ Automatic inclusion in requests
- ✅ `httpOnly` prevents XSS attacks

**Settings:**
- **TTL:** 15 minutes (`60 * 15` seconds)
- **httpOnly:** `true` (JS can't access)
- **sameSite:** `lax` (CSRF protection)
- **secure:** `false` in dev, `true` in production
- **Path:** `/` (all routes)

**Server Middleware:** `/server/middleware/01.auth.ts`
- Runs on **every API request**
- Verifies JWT from cookie or `Authorization` header
- Attaches `event.context.user` for handlers
- Whitelists: `/api/v1/auth`, `/api/_nuxt_icon`, `/favicon.ico`

**Client Middleware:** `/app/middleware/auth.global.ts`
- Runs on **every route navigation**
- Redirects to `/auth/login?redirect={path}` if not authenticated
- Whitelists: `/`, `/auth/login`, `/auth/signup`

---

## Auto-Imports (Nuxt)

**IMPORTANT:** Do NOT manually import these - Nuxt auto-imports them:

### Server-side
- `server/utils/*.ts` → All exports globally available
- Examples: `hashPassword()`, `signJWT()`, `verifyJWT()`, `setAccessCookie()`, `requireUser()`

### Client-side
- `composables/*.ts` → Functions starting with `use`
- `stores/*.ts` → Pinia stores (via `useStoreName()`)
- `components/*.vue` → Vue components

**When you DO need imports:**
- Database functions from `server/db/*.ts`
- Types and interfaces
- Third-party packages

---

## API Route Structure

```
/api/v1/
├── ai/                         # AI SDK routes
│   ├── chats/index.post.ts    # Chat streaming (POST /api/v1/ai/chats)
│   └── completions/index.post.ts # Text completion (POST /api/v1/ai/completions)
├── auth/                       # Authentication
│   ├── login.post.ts
│   ├── signup.post.ts
│   ├── me.get.ts
│   └── logout.post.ts
├── chats/                      # Chat CRUD
│   ├── index.get.ts           # List chats
│   ├── create.post.ts         # Create chat
│   ├── [chatId].get.ts        # Get chat + messages
│   ├── [chatId].delete.ts     # Soft delete
│   └── [chatId]/messages.post.ts # Add message (legacy, not used by AI SDK)
└── users/
    └── index.get.ts           # User management
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=./db/sqlite/app.db

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your-secret-key

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
```

---

## Streaming Response Format

**AI SDK uses Server-Sent Events (SSE)** under the hood, but the SDK handles all parsing.

**Server sends:** `result.toUIMessageStreamResponse()`
**Client receives:** Auto-parsed by `Chat` or `Completion` class

**No manual SSE parsing needed!** The AI SDK abstracts this away.

---

## Error Handling

### Server-side
```typescript
// User-friendly error messages
throw createError({
  statusCode: 502,
  statusMessage: 'AI provider temporarily unavailable'
})

// Log details internally
console.error('[AI Chat] Failed to save:', error)
```

### Client-side
**AI SDK composables expose error state:**
```typescript
const { chat } = useAiChatSession()
// chat.error - reactive error message
// chat.isLoading - loading state
```

---

## Key Differences from Manual Streaming

### ❌ Old approach (manual)
- Custom SSE parsing
- Manual message accumulation
- Client-side persistence via `watch()`
- Race conditions with streaming completion

### ✅ AI SDK approach (current)
- `Chat` / `Completion` classes handle streaming
- `toUIMessageStreamResponse()` handles format
- Server-side persistence in `onFinish`
- Clean separation of concerns

---

## Future Provider Support

To add new providers (Anthropic, Google, etc.):

1. Install provider package: `bun add @ai-sdk/anthropic`
2. Update server endpoint:
```typescript
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey })
const result = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages: convertToModelMessages(messages)
})
```
3. Update client to pass provider selection

**No changes needed to persistence logic!** The AI SDK pattern is provider-agnostic.

---

## API Client Architecture

### Centralized API Client Pattern

**Problem:** Repeating auth headers, error handling, and try-catch boilerplate in multiple API clients.

**Solution:** Centralized API client layer with shared utilities and global fetch interceptor.

### Files Involved

**1. `/app/types/api.ts`** - Response types
```typescript
export interface CreateChatResponse { id: string }
export interface GetChatResponse { chat: {...}, messages: [...] }
export interface ApiError { statusCode: number, statusMessage: string }
```

**2. `/app/services/api/utils.ts`** - Shared utilities
```typescript
// Error handler (reusable across all API clients)
export function handleApiError(error: any): never

// Wrapper for $fetch requests
export async function fetchApi<T>(url: string, options: any): Promise<T>

// Wrapper for streaming requests
export async function fetchStream(url: string, options: any): Promise<Response>
```

**3. `/app/plugins/api.client.ts`** - Global fetch interceptor
```typescript
// Automatically attaches Authorization header to ALL $fetch requests
$fetch.create({
  onRequest({ options }) {
    const auth = useAuth()
    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`
    }
  },
  onResponseError({ response }) {
    // Handle 401 - session expired
    if (response.status === 401) {
      auth.logout()
      navigateTo('/auth/login')
    }
  }
})
```

**4. `/app/services/api/ai-sdk.ts`** - Simplified API client
```typescript
// Before: manual auth headers, error handling in every function
const response = await $fetch(url, {
  headers: getAuthHeader(),
  body: {...}
})

// After: clean, reusable
const response = await fetchApi<CreateChatResponse>(url, {
  method: 'POST',
  body: {...}
})
```

### Why This Architecture?

✅ **No Repetition** - Auth headers attached globally, not in every function
✅ **Centralized Error Handling** - `handleApiError` is reused across all API clients
✅ **Type Safety** - All response types in one place (`app/types/api.ts`)
✅ **Single Responsibility** - API client is clean, utilities are separate
✅ **Easy to Extend** - Adding new providers just imports the utilities
✅ **Global 401 Handling** - Plugin intercepts all auth errors automatically

### Migration Checklist

When adding new API clients or endpoints:

- [ ] Define response types in `app/types/api.ts`
- [ ] Use `fetchApi<T>()` for GET/POST without streaming
- [ ] Use `fetchStream()` for SSE endpoints
- [ ] Don't manually call `getAuthHeader()` (plugin handles it)
- [ ] Import from `./utils` for error handling
- [ ] Remove manual try-catch-handleError boilerplate

### Example: Adding a New API Client

```typescript
// app/services/api/my-api.ts
import type { MyResponse } from '@/types/api'
import { fetchApi } from './utils'

const BASE_URL = '/api/v1'

export async function getMyData(id: string): Promise<MyResponse> {
  // Auth header automatically attached by plugin
  // Errors automatically handled by fetchApi wrapper
  return fetchApi<MyResponse>(`${BASE_URL}/my-endpoint/${id}`, {
    method: 'GET'
  })
}
```

---

## Common Pitfalls

1. **Don't manually import auto-imported utils** - Causes conflicts
2. **Don't trust headers/query for auth** - Always use `event.context.user` from middleware
3. **Don't expose secrets in responses** - Return clean DTOs only
4. **Don't parse SSE manually** - AI SDK handles it
5. **Don't save messages client-side with watch()** - Use server `onFinish`
6. **Don't manually attach auth headers** - Plugin handles it globally
7. **Don't repeat error handling** - Use `handleApiError()` from utils

---

## References

- [Vercel AI SDK Docs](https://ai-sdk.dev/docs)
- [AI SDK Chat Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- [streamText API](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- [useChat Vue Docs](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [Nuxt Auto-Imports](https://nuxt.com/docs/guide/concepts/auto-imports)
