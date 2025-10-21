# Actionable Fixes Checklist

## P0: Critical Fixes (Must Do Before Production)

### ✅ Fix 1: Add Error Handling to useNativeChatSession
**File**: `app/composables/useNativeChatSession.ts`
**Current State**: Errors silently fail
**Action**:
```typescript
// Add to top of composable
const errorMessage = ref<string | null>(null)

// Update sendMessage:
async function sendMessage(payload: { text: string }) {
  errorMessage.value = null  // Clear previous errors
  isSending.value = true
  try {
    // ... existing code ...
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    errorMessage.value = message
    console.error('[Native Chat] Send failed:', err)
    // Remove last optimistic message if exists
    if (assistantMsg.id && messages.value[messages.value.length - 1]?.id === assistantMsg.id) {
      messages.value.pop()
    }
  }
  finally {
    isSending.value = false
  }
}

// Add to return
return { ..., errorMessage }
```

**Test**: Send message with invalid API key, verify error displays

---

### ✅ Fix 2: Add Error Handling to useProxyChatSession
**File**: `app/composables/useProxyChatSession.ts`
**Action**: Same as Fix 1 (just copy/paste pattern)

**Test**: Same as Fix 1

---

### ✅ Fix 3: Display Error in Pages
**File**: `app/pages/native-chat/new.vue`
**Action**: Add error display before messages:
```vue
<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
    <!-- ... header ... -->

    <!-- ERROR DISPLAY -->
    <div v-if="errorMessage" class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-400/20">
      <p class="text-red-600 text-sm flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-circle-16-solid" />
        {{ errorMessage }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
      <!-- ... messages ... -->
    </div>
  </div>
</template>

<script setup>
// Add to script
const { chat, errorMessage } = useNativeChatSession({...})
</script>
```

**Also fix**: `app/pages/proxy-chat/new.vue` (same pattern)

**Test**: Send message and verify error displays red box with message

---

### ✅ Fix 4: Fix Streaming Fallback Logic
**File**: `app/composables/useNativeChatSession.ts`
**Issue**: Fallback tries non-existent endpoints for proxy providers
**Current**:
```typescript
if (!resp.ok || !resp.body) {
  // Fallback to non-streaming
  const fallback = await $fetch<{ content: string }>(
    '/api/v1/openai/chat',  // ❌ Assumes this exists
```

**Action**: Only use fallback for native providers:
```typescript
if (!resp.ok || !resp.body) {
  // Only native (OpenAI) provider has fallback
  if (provider.value !== 'openai') {
    throw new Error(`Streaming failed for ${provider.value} and no fallback available`)
  }

  // Try fallback for OpenAI native
  try {
    const fallback = await $fetch<{ content: string }>('/api/v1/openai/chat', {
      method: 'POST',
      body: {
        messages: messages.value.map(m => ({
          role: m.role,
          content: m.parts.map(p => (p as any).text).join('\n'),
        })),
        model: model.value,
      },
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    const text = String(fallback?.content ?? '')
    ;(assistantMsg.parts[0] as any).text = text
    await saveMessages(chatId, [{ role: 'assistant', content: text }])
    return
  }
  catch (fallbackErr) {
    throw new Error(`Both streaming and fallback failed: ${fallbackErr instanceof Error ? fallbackErr.message : 'unknown'}`)
  }
}
```

**Test**:
- [ ] Native chat works (has fallback)
- [ ] Proxy chat throws proper error (no fallback)

---

### ✅ Fix 5: Remove `as any` Type Casts (Priority 1)
**File**: `app/composables/useNativeChatSession.ts`
**Issue**: Lines 32, 89, 102
**Current**:
```typescript
parts: [{ type: 'text', text: m.content }] as any,
// ...
content: m.parts.map(p => (p as any).text).join('\n'),
```

**Action**: Add proper type:
```typescript
// Add this import
import type { UIMessage } from 'ai'

// Line 32 - properly type the message
messages.value = response.messages.map(m => ({
  id: m.id,
  role: m.role as 'user' | 'assistant',
  parts: [{ type: 'text' as const, text: m.content }],
} as UIMessage))

// Lines 89 & 102 - create helper function
function messagesToApiFormat(messages: UIMessage[]): Array<{role: string, content: string}> {
  return messages.map(m => ({
    role: m.role,
    content: m.parts
      .filter(p => p.type === 'text')
      .map(p => {
        const part = p as any // OK in helper where we know structure
        return typeof part.text === 'string' ? part.text : ''
      })
      .join('\n')
  }))
}

// Then use it:
body: JSON.stringify({
  messages: messagesToApiFormat(messages.value),
  model: model.value,
}),
```

**Also fix**: `app/composables/useProxyChatSession.ts` (same)

**Test**: TypeScript compile check passes

---

### ✅ Fix 6: Remove `as any` from Page Templates
**File**: `app/pages/native-chat/new.vue`
**Issue**: Hardcoded `as any` casts removed by fixing composable
**Action**: Once composable is fixed, pages automatically work correctly

**Test**: TypeScript compile check

---

### ✅ Fix 7: Add Send Button Loading State
**File**: `app/pages/native-chat/new.vue`
**Current**:
```vue
<button type="submit" class="chip px-5 py-3..." :disabled="!input.trim()">
  <UIcon name="i-heroicons-paper-airplane-16-solid" /> Send
</button>
```

**Action**:
```vue
<script setup>
const { chat, isSending } = useNativeChatSession({...})
</script>

<template>
  <button type="submit"
          class="chip px-5 py-3..."
          :disabled="!input.trim() || isSending"
  >
    <UIcon v-if="isSending"
            name="i-heroicons-arrow-path-16-solid"
            class="animate-spin" />
    <UIcon v-else
            name="i-heroicons-paper-airplane-16-solid" />
    {{ isSending ? 'Sending...' : 'Send' }}
  </button>
</template>
```

**Also fix**: `app/pages/proxy-chat/new.vue` (same)

**Test**: Button shows spinner and is disabled while sending

---

## P1: Code Quality Fixes (Should Do)

### 📋 Fix 8: Add Missing Streaming Endpoints
**Files to Create**:
1. `/api/v1/anthropic/chat.stream.post.ts`
2. `/api/v1/google/chat.stream.post.ts`

**Use as template**: `server/api/v1/openrouter/chat.stream.post.ts`

**For Anthropic**:
```typescript
import { defineEventHandler, readBody, setHeader, sendStream } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model = 'claude-3-5-sonnet-20241022', temperature = 0.7 } = await readBody(event)

  if (!Array.isArray(messages) || messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })

  const { anthropicApiKey } = useRuntimeConfig()
  if (!anthropicApiKey)
    throw createError({ statusCode: 500, statusMessage: 'ANTHROPIC_API_KEY not configured' })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      stream: true,
      max_tokens: 1024,
    }),
  })

  if (!res.ok || !res.body)
    throw createError({ statusCode: res.status || 500, statusMessage: 'Anthropic stream error' })

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache')

  const upstream = res.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await upstream.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const raw of lines) {
            const line = raw.trim()
            if (!line || line === 'event: message_stop') continue
            if (!line.startsWith('data:')) continue
            const payloadText = line.slice(5).trim()
            if (!payloadText) continue
            try {
              const payload = JSON.parse(payloadText)
              // Anthropic uses content_block_delta.delta.text
              const token = payload?.delta?.text
              if (typeof token === 'string' && token)
                controller.enqueue(encoder.encode(token))
            }
            catch {
              // ignore parse errors
            }
          }
        }
      }
      finally {
        controller.close()
      }
    },
  })

  return sendStream(event, stream as any)
})
```

**Test**: Stream response from Anthropic API

---

### 📋 Fix 9: Extract Message Format Utilities
**Create**: `app/utils/messageFormat.ts`
```typescript
import type { UIMessage } from 'ai'

export interface ApiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

/**
 * Convert API message format to UI message format
 */
export function convertApiToUIMessages(messages: ApiMessage[]): UIMessage[] {
  return messages.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  } as UIMessage))
}

/**
 * Convert UI messages to API message format
 */
export function convertUIMessagesToApi(messages: UIMessage[]): Array<{ role: string, content: string }> {
  return messages.map(m => ({
    role: m.role,
    content: m.parts
      .filter(p => p.type === 'text')
      .map(p => {
        const part = p as any
        return typeof part.text === 'string' ? part.text : ''
      })
      .join('\n')
  }))
}
```

**Use in composables**: Replace inline conversion with this utility

**Test**: Unit tests pass

---

### 📋 Fix 10: Extract Streaming Logic
**Create**: `app/utils/streaming.ts`
```typescript
/**
 * Stream response from endpoint and call onChunk for each piece
 */
export async function streamFromEndpoint(options: {
  endpoint: string
  body: Record<string, any>
  token: string
  onChunk: (chunk: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const resp = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.token}`,
    },
    body: JSON.stringify(options.body),
    signal: options.signal,
  })

  if (!resp.ok || !resp.body) {
    throw new Error(`Stream failed: ${resp.status} ${resp.statusText}`)
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      accumulated += chunk
      options.onChunk(chunk)
    }
  }
  finally {
    reader.releaseLock()
  }

  return accumulated
}
```

**Use in composables**: Replace inline streaming with this function

**Test**: Streaming still works

---

## P2: Optimization Fixes (Nice to Have)

### 🚀 Fix 11: Consolidate Composables
**Goal**: Merge native & proxy into unified composable
**File**: Create `app/composables/useChatSession.ts`
**Action**: Create new unified composable that accepts `type` parameter
**Deprecate**: `useNativeChatSession.ts` and `useProxyChatSession.ts`
**Time**: ~1 hour
**Benefit**: Single source of truth

---

### 🚀 Fix 12: Database Query Optimization
**File**: `server/db/chats.ts`
**Current**: N+1 queries for message counts
**Better**: Use GROUP BY aggregation
```typescript
// Before: 1 + 2N queries
// After: 1 query with aggregation
```
**Time**: ~30 min
**Benefit**: Faster chat list loading

---

## Testing Checklist

After each fix, verify:
- [ ] Code compiles without errors
- [ ] No TypeScript errors (`bunx tsc --noEmit`)
- [ ] No ESLint errors (run linter)
- [ ] Feature still works in browser
- [ ] No console errors/warnings
- [ ] Related tests pass

---

## Fix Priority by Impact

### If you have 30 minutes:
1. ✅ Fix 1-4: Add error handling & fix fallback (P0)

### If you have 1 hour:
1. ✅ Fix 1-7: All critical fixes (P0)

### If you have 2 hours:
1. ✅ Fix 1-8: All critical + missing endpoints (P0 + P1)

### If you have 4 hours:
1. ✅ Fix 1-10: All critical, endpoints, utilities (P0 + P1)

### If you have 1 day:
1. ✅ Fix 1-12: Complete refactoring (P0 + P1 + P2)

---

## Verification After All Fixes

```bash
# Type check
bunx tsc --noEmit

# Linter
bunx eslint . --fix

# Tests (after lint)
bun test

# Manual testing
1. Start dev server: bun run dev
2. Create native chat → verify works, error shows if fails
3. Create proxy chat → verify works, error shows if fails
4. Send message to each → verify spinner, success/error
5. Check console → no errors
```

---

## Summary

- **Total fixes**: 12 (7 critical, 3 quality, 2 optimization)
- **Estimated time**: 1-4 hours depending on which ones you do
- **Risk level**: Low (each fix is isolated)
- **Reward**: Much more reliable and maintainable code

Start with P0 fixes for stability, then P1 for quality, then P2 for polish.
