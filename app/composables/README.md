# Composables Directory

Reusable composition functions for Vue components. Composables encapsulate reactive logic that can be shared across components without introducing global state.

## Active Composables

### `useChatSession.ts`
**Purpose**: Unified chat interface for both native and proxy providers

**Type**: `ChatSessionType = 'native' | 'proxy'`

**Options**:
```typescript
interface UseChatSessionOptions {
  type: ChatSessionType
  onFirstChatCreated?: (id: string) => void
}
```

**Returns**:
- `chat` - Chat instance with `messages` and `sendMessage()`
- `provider` - Current provider ref
- `model` - Current model ref
- `currentChatId` - Active chat ID
- `isLoadingChat` - Loading existing chat
- `isSending` - Sending message in progress
- `errorMessage` - Error display string
- `loadExistingChatById(id)` - Load chat history

**Provider Defaults**:
- **Native**: `openai` + `gpt-4o-mini`
- **Proxy**: `openrouter` + `deepseek/deepseek-r1`

**Features**:
- ✅ SSE streaming with automatic reader cleanup
- ✅ Fallback to non-streaming for native providers
- ✅ Automatic chat creation on first message
- ✅ Message persistence to SQLite
- ✅ Error handling with user-friendly messages

**Usage**:
```typescript
// Native chat (OpenAI)
const { chat, isSending, errorMessage, loadExistingChatById } = useChatSession({
  type: 'native',
  onFirstChatCreated: (id) => router.replace(`/native-chat/${id}`)
})

// Proxy chat (OpenRouter)
const { chat, isSending, errorMessage } = useChatSession({
  type: 'proxy',
  onFirstChatCreated: (id) => router.replace(`/proxy-chat/${id}`)
})

// Load existing chat
await loadExistingChatById('chat-id')

// Send message
chat.sendMessage({ text: 'Hello!' })
```

---

### `useChatPersistence.ts`
**Purpose**: Chat and message persistence to SQLite

**Returns**:
- `createChat(provider, model, title, ui)` - Create new chat
- `saveMessages(chatId, messages)` - Append messages
- `loadChat(chatId)` - Get chat with messages
- `generateTitle(text)` - Auto-generate title from first message

**Usage**:
```typescript
const { createChat, saveMessages, loadChat } = useChatPersistence()

// Create chat
const chatId = await createChat('openai', 'gpt-4o-mini', 'My Chat', 'native')

// Save messages
await saveMessages(chatId, [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' }
])

// Load chat
const { chat, messages } = await loadChat(chatId)
```

---

## Composable vs Store

**Use composables when**:
- Logic is component-scoped
- Need lifecycle hooks (`onMounted`, `watch`)
- Reusable utility functions
- No global state needed

**Use stores when**:
- State is shared across pages
- Need server data caching
- Managing authentication

---

## Naming Convention

All composables must:
- Start with `use` prefix
- Use camelCase
- Be auto-imported by Nuxt

Example: `useMyFeature.ts` exports `useMyFeature()`

---

## Composable Pattern

```typescript
export function useMyFeature(options?: MyOptions) {
  // 1. Reactive state
  const data = ref<MyData | null>(null)
  const isLoading = ref(false)

  // 2. Computed values
  const hasData = computed(() => data.value !== null)

  // 3. Functions
  async function fetch() {
    isLoading.value = true
    try {
      data.value = await $fetch('/api/my-data')
    } finally {
      isLoading.value = false
    }
  }

  // 4. Lifecycle (if needed)
  onMounted(() => {
    fetch()
  })

  // 5. Return public API
  return { data, isLoading, hasData, fetch }
}
```

---

## Related

- **Stores** (`app/stores/`) - Global state with Pinia
- **Services** (`app/services/`) - Business logic and API clients
- **Utils** (`app/utils/`) - Pure utility functions (no reactivity)
