# Services Directory

Business logic, API clients, and external integrations. Services are pure TypeScript modules without Vue reactivity.

## Structure

```
services/
├── api/                    # API client modules
│   ├── utils.ts           # Shared fetch wrappers and error handling
│   ├── chats.ts           # Chat CRUD operations
│   └── ...
├── providers/             # AI provider adapters
│   ├── index.ts           # Provider registry and factory
│   ├── types.ts           # Provider interfaces
│   ├── ai-openai.ts       # AI SDK OpenAI provider
│   ├── openai.native.ts   # Native OpenAI SDK provider
│   └── openrouter.ts      # Proxy OpenRouter provider
└── ...
```

---

## API Clients (`services/api/`)

### Pattern: Centralized API Layer

All API requests go through typed client functions with automatic auth and error handling.

**Core utilities** (`services/api/utils.ts`):
- `fetchApi<T>()` - Type-safe wrapper with automatic auth headers
- `fetchStream()` - SSE streaming wrapper
- `handleApiError()` - Centralized error handler

**Benefits**:
- ✅ No manual auth headers (plugin handles globally)
- ✅ Centralized error handling
- ✅ Type-safe responses
- ✅ Easy to mock for testing

### `chats.ts`
**Exports**:
- `listChats(params, options)` - Fetch chat list with ETag support
- `deleteChat(chatId)` - Delete chat by ID

**ETag Support**:
```typescript
// First fetch
const { items, etag } = await listChats({ email: 'user@example.com' })

// Subsequent fetch with ETag
const { items, etag, fromCache } = await listChats(
  { email: 'user@example.com' },
  { ifNoneMatch: etag }
)

// If fromCache === true, server returned 304 (not modified)
```

**Usage**:
```typescript
import { listChats, deleteChat } from '@/services/api/chats'

const { items, etag } = await listChats({
  email: 'user@example.com',
  provider: 'openai',
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
})

await deleteChat('chat-id')
```

---

## AI Providers (`services/providers/`)

### Three-Tier Provider System

#### 1. AI SDK Providers (`type: 'ai-sdk'`)
- Uses Vercel AI SDK with SSE streaming
- Best for: Streaming, structured outputs, multimodal
- Example: OpenAI via `/api/v1/ai/chats`
- Registration: `'ai-openai': () => createAiSdkProvider('openai')`

#### 2. Proxy Providers (`type: 'proxy'`)
- Simple HTTP proxy to external APIs
- Best for: Quick integration (5 min setup)
- Example: OpenRouter at `/api/v1/openrouter/chat.stream.post.ts`
- Registration: `'openrouter': () => createProxyProvider('openrouter', 'openrouter')`

#### 3. Native Providers (`type: 'native'`)
- Direct SDK integration with full features
- Best for: Provider-specific capabilities
- Example: OpenAI using OpenAI SDK directly
- Registration: Manual provider implementation

### Provider Registry (`providers/index.ts`)

**Exports**:
- `PROVIDER_INFO` - Metadata for all providers
- `getProvider(key)` - Get provider instance
- `createProxyProvider(key, endpoint)` - Factory for proxy providers
- `createAiSdkProvider(key)` - Factory for AI SDK providers

**Usage**:
```typescript
import { getProvider } from '@/services/providers'

const provider = getProvider('openai')
const response = await provider.send({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'gpt-4o-mini'
})
```

### Adding a New Provider

**Proxy Provider (Simplest)**:

1. Add to registry:
```typescript
// services/providers/index.ts
'my-provider': () => createProxyProvider('my-provider', 'my-provider')
```

2. Create server endpoint:
```typescript
// server/api/v1/my-provider/chat.stream.post.ts
export default defineEventHandler(async (event) => {
  const { messages, model } = await readBody(event)
  const { myProviderApiKey } = useRuntimeConfig()

  const response = await fetch('https://api.provider.com/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${myProviderApiKey}` },
    body: JSON.stringify({ messages, model })
  })

  return response.body // Stream directly
})
```

3. Add to `.env`:
```bash
MY_PROVIDER_API_KEY=...
```

---

## Service Guidelines

### 1. Pure Logic Only
Services should NOT:
- Import Vue/Nuxt composables
- Use `ref()`, `reactive()`, `computed()`
- Access `window`, `document`, or DOM

Services SHOULD:
- Be pure TypeScript functions
- Handle business logic
- Return plain data or Promises

### 2. Error Handling
```typescript
// ✅ Good: Let error bubble up
export async function fetchData() {
  return await $fetch('/api/data') // Throws on error
}

// ❌ Bad: Swallow errors silently
export async function fetchData() {
  try {
    return await $fetch('/api/data')
  } catch {
    return null // Error lost!
  }
}
```

### 3. Type Safety
```typescript
// ✅ Good: Explicit types
export async function fetchUser(id: string): Promise<User> {
  return await fetchApi<User>(`/api/users/${id}`)
}

// ❌ Bad: Implicit any
export async function fetchUser(id) {
  return await fetchApi(`/api/users/${id}`)
}
```

---

## Related

- **Types** (`app/types/`) - TypeScript interfaces for API responses
- **Server API** (`server/api/`) - Backend endpoints
- **Composables** (`app/composables/`) - Reactive wrappers for services
- **Stores** (`app/stores/`) - State management with caching
