// app/composables/useChatProvider.ts
import type { ChatProvider } from '@/services/providers/types'
import { computed } from 'vue'
import { getProvider } from '@/services/providers'
import { useChatSessions } from '@/stores/chat.sessions'

export function useChatProvider(sessionId?: string) {
  const sessions = useChatSessions()

  const providerKey = computed(() => {
    const s = sessionId ? sessions.sessions[sessionId] : sessions.current
    // default to 'ai-openai' if not set
    return s?.provider || 'ai-openai'
  })

  const provider = computed<ChatProvider>(() => getProvider(providerKey.value))

  // small helper for convenience
  function send(input: Parameters<ChatProvider['send']>[0]) {
    return provider.value.send(input)
  }

  return { providerKey, provider, send }
}
