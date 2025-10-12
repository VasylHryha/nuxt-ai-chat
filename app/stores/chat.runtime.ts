import type { ChatMessage } from '~/types'
// stores/chat.runtime.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useChatProvider } from '@/composables/useChatProvider'
import { useChatSessions } from '@/stores/chat.sessions'

export const useChatRuntime = defineStore('chat.runtime', () => {
  const isSending = ref(false)
  const errorMessage = ref('')
  const providerKey = ref('openrouter') // label-only; session decides actual provider
  const displayName = ref('DeepSeek via OpenRouter')
  const abortController = ref<AbortController | null>(null)

  const sessions = useChatSessions()

  const canSend = computed(() => {
    const s = sessions.current
    return !!s && !isSending.value && !s.cappedByCount && !s.cappedByChars
  })
  const abortSignal = computed<AbortSignal | undefined>(() => abortController.value?.signal)

  function configureRuntime(opts: { provider: string, label: string }) {
    providerKey.value = opts.provider
    displayName.value = opts.label
  }

  async function sendUserMessage(text: string) {
    const session = sessions.current
    if (!session || !canSend.value)
      return
    const trimmed = text?.trim()
    if (!trimmed)
      return

    sessions.pushMessageToCurrent({
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    })
    if (session.cappedByCount || session.cappedByChars)
      return

    try {
      isSending.value = true
      errorMessage.value = ''
      abortController.value?.abort()
      abortController.value = new AbortController()

      // 👇 resolve provider for THIS session via composable
      const { send } = useChatProvider(session.id)
      const response = await send({
        sessionId: session.id,
        model: session.model,
        temperature: 0.7,
        messages: sessions.messages.map(m => ({ role: m.role, content: m.content })),
        signal: abortSignal.value,
      })

      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        reasoning: response.reasoning,
        createdAt: Date.now(),
      }
      sessions.pushMessageToCurrent(assistant)
    }
    catch (e: any) {
      if (e?.name !== 'AbortError')
        errorMessage.value = e?.message || 'Failed to send'
    }
    finally {
      isSending.value = false
    }
  }

  function cancelInFlight() {
    abortController.value?.abort()
  }

  return { isSending, errorMessage, providerKey, displayName, canSend, abortSignal, configureRuntime, sendUserMessage, cancelInFlight }
})
