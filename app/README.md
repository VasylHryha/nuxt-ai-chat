# App Directory (`app/`)

**Client-side Vue application code**

## What's Here

Vue components, pages, composables, stores, and client-side logic.

## Technology Stack

- **Vue 3** - Composition API
- **Pinia** - State management
- **Vercel AI SDK (@ai-sdk/vue)** - Chat/completion UI
- **Nuxt UI** - Component library
- **Tailwind v4** - Styling

## Directory Structure

```
app/
├── composables/   # Reusable logic (auto-imported)
├── stores/        # Pinia stores (auto-imported)
├── pages/         # File-based routing
├── components/    # Vue components (auto-imported)
├── middleware/    # Route guards
├── services/      # Business logic layer
├── utils/         # Helper functions (auto-imported)
├── config/        # Client config
├── layouts/       # Page layouts
├── plugins/       # Nuxt plugins
├── types/         # TypeScript types
└── assets/        # Images, styles
```

## Auto-Imports

**Functions auto-imported (no need to import):**
- `composables/*.ts` - Functions starting with `use`
- `stores/*.ts` - Pinia stores via `useStoreName()`
- `components/*.vue` - Vue components
- `utils/*.ts` - Exported functions

**Must manually import:**
- Services from `services/`
- Types from `types/`
- Third-party packages

## Key Directories

### `composables/` - Reusable Logic

**AI SDK composables:**
- `useAiChatSession.ts` - Chat with Vercel AI SDK (RECOMMENDED)
- `useAiCompletion.ts` - Text completion
- `useChatSession.ts` - Manual streaming chat (LEGACY)
- `useNativeChatSession.ts` - Native provider chat (LEGACY)
- `useProxyChatSession.ts` - Proxy provider chat (LEGACY)

**Persistence:**
- `useChatPersistence.ts` - Save/load chats from API

**Usage:**
```typescript
// Auto-imported
const { chat } = useAiChatSession()
```

### `stores/` - Pinia State Management

**Auth:**
- `auth.ts` - Login, signup, logout, me

**Data:**
- `users.ts` - User list (SWR, 1min TTL)
- `chat.sessions.ts` - Chat sessions + profiles
- `chat.runtime.ts` - UI state (sending, errors, abort)

**Usage:**
```typescript
// Auto-imported
const auth = useAuth()
auth.login(email, password)
```

### `pages/` - File-based Routing

**AI SDK pages:**
- `ai-chat/new.vue` - New chat
- `ai-chat/[id].vue` - Existing chat

**Completion:**
- `completion.vue` - Text completion

**Legacy:**
- `native-chat/` - Native provider
- `proxy-chat/` - Proxy provider

**Auth:**
- `auth/login.vue`, `auth/signup.vue`

**Other:**
- `index.vue` - Homepage
- `chats/index.vue` - Chat list
- `users.vue` - User management

### `components/` - Vue Components

**Auto-imported by filename.**

Example: `Button.vue` → `<Button />`

### `middleware/` - Route Guards

**`auth.global.ts`** - Client-side auth
- Runs on every route navigation
- Redirects to `/auth/login?redirect={path}` if not authenticated
- Whitelists: `/`, `/auth/login`, `/auth/signup`

### `services/` - Business Logic

**Providers:**
- `providers/index.ts` - Provider registry
- `providers/types.ts` - Provider interfaces

**Other:**
- `chatRepository.ts` - Chat persistence layer (legacy)
- `usersRepository.ts` - User data access (legacy)

### `utils/` - Helper Functions

- `messageFormat.ts` - API ↔ UI message conversion (legacy)
- `streaming.ts` - SSE streaming handler (legacy)
- `endpoints.ts` - Provider endpoint mapping (legacy)

### `config/` - Configuration

- `endpoints.ts` - AI provider endpoint configuration

---

## Common Patterns

### Create new page
```typescript
// app/pages/example.vue
<script setup lang="ts">
const title = ref('Example Page')

useHead({ title: 'Example · Nuxt AI Chat' })
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
  </div>
</template>
```

### Use composable
```typescript
<script setup lang="ts">
const { chat } = useAiChatSession({
  onFirstChatCreated: (id) => {
    navigateTo(`/ai-chat/${id}`)
  }
})

function handleSubmit() {
  chat.sendMessage({ text: input.value })
}
</script>
```

### Use Pinia store
```typescript
<script setup lang="ts">
const auth = useAuth()
const users = useUsers()

onMounted(() => {
  users.fetch() // Load users
})
</script>
```

### Protected route
```typescript
// Middleware handles this automatically
// Just navigate - middleware will redirect if not authenticated
navigateTo('/chats')
```

---

## See Also

- [docs/AI_ARCHITECTURE.md](../docs/AI_ARCHITECTURE.md) - AI integration patterns
- [server/README.md](../server/README.md) - Server-side docs
