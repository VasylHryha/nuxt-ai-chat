# Stores Directory

Pinia store modules for global state management across the application.

## Active Stores

### `auth.ts`
**Purpose**: User authentication and session management

**State**:
- `user` - Current authenticated user (id, email, name)
- `token` - JWT access token
- `isAuthenticated` - Computed boolean

**Actions**:
- `login(email, password)` - Authenticate user
- `signup(email, password, name)` - Register new user
- `logout()` - Clear session
- `fetchMe()` - Refresh user info from server

**Usage**:
```typescript
const auth = useAuth()
await auth.login('user@example.com', 'password')
if (auth.isAuthenticated) {
  console.log(auth.user.email)
}
```

---

### `users.ts`
**Purpose**: User directory with SWR caching pattern

**State**:
- `users` - Map of users by ID
- `lastFetchedAt` - Timestamp for TTL validation
- `ttlMs` - Time-to-live (default: 60s)

**Actions**:
- `ensure()` - Fetch users if stale or missing
- `invalidate()` - Force refetch on next ensure()

**Caching Strategy**:
- TTL-based: Refetches after 60 seconds
- Stale-while-revalidate pattern
- No ETag support (simple list)

**Usage**:
```typescript
const store = useUsers()
await store.ensure() // Fetches if stale
const user = store.users['user-id']
```

---

### `chatDirectory.ts`
**Purpose**: Chat list management with advanced caching

**State**:
- `items` - Array of chat summaries
- `etag` - HTTP ETag for cache validation
- `dirty` - Marks data as stale after mutations
- `lastFetchedAt` - Timestamp for TTL
- `ttlMs` - Time-to-live (default: 30s)

**Actions**:
- `ensure(params, options)` - Fetch chats with smart caching
- `remove(chatId)` - Delete chat and mark dirty
- `markDirty()` - Invalidate cache

**Caching Strategy**:
- **ETag-based**: HTTP 304 responses if unchanged
- **TTL-based**: Refetches after 30 seconds
- **Mutation tracking**: `dirty` flag forces refetch after deletes
- **Force option**: Bypass all caching

**Usage**:
```typescript
const directory = useChatDirectory()

// Fetch with caching
await directory.ensure({ email: 'user@example.com' })

// Force refresh
await directory.ensure({ email: 'user@example.com' }, { force: true })

// Delete and auto-invalidate
await directory.remove('chat-id')
```

**Why dirty flag?**
Without it, deleted chats would show until TTL expires (30s). The `dirty` flag ensures immediate refetch after mutations.

---

## When to Use Stores

**Use stores when**:
- State is shared across multiple pages/components
- You need server data caching (SWR, ETag)
- Managing authentication or global UI state

**Don't use stores when**:
- State is component-local (use `ref`/`reactive`)
- One-time data fetch (use `$fetch` directly)
- Complex business logic (use services layer)

---

## Store Pattern

All stores follow this structure:

```typescript
export const useMyStore = defineStore('myStore', () => {
  // 1. State (refs)
  const data = ref<MyData[]>([])
  const isLoading = ref(false)

  // 2. Getters (computed)
  const total = computed(() => data.value.length)

  // 3. Actions (functions)
  async function fetch() {
    isLoading.value = true
    try {
      data.value = await $fetch('/api/my-data')
    } finally {
      isLoading.value = false
    }
  }

  // 4. Return public API
  return { data, isLoading, total, fetch }
})
```

---

## Related

- **Composables** (`app/composables/`) - Reusable logic without global state
- **Services** (`app/services/`) - Business logic and API clients
- **Server** (`server/`) - API endpoints and database queries
