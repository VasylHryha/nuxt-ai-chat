import type { ChatProvider } from '@/services/providers/types'
// app/composables/useChatProvider.ts
import { getProvider } from '@/services/providers'

export function useChatProvider(sessionId?: string) {
  const sessions = useChatSessions()

  const providerKey = computed(() => {
    const s = sessionId ? sessions.sessions[sessionId] : sessions.current
    // default to 'nuxt' to be extra safe
    return s?.provider || 'nuxt'
  })

  const provider = computed<ChatProvider>(() => getProvider(providerKey.value))

  // small helper for convenience
  function send(input: Parameters<ChatProvider['send']>[0]) {
    return provider.value.send(input)
  }

  return { providerKey, provider, send }
}
