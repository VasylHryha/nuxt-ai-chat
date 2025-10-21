import type { UIMessage } from 'ai'
import { useChatPersistence } from '@/composables/useChatPersistence'
import { useAuth } from '@/stores/auth'

interface UseNativeChatSessionOptions {
  onFirstChatCreated?: (id: string) => void
}

export function useNativeChatSession(options: UseNativeChatSessionOptions = {}) {
  const auth = useAuth()
  const { createChat, saveMessages, loadChat, generateTitle } = useChatPersistence()

  const provider = ref<'openai'>('openai')
  const model = ref('gpt-4o-mini')

  const currentChatId = ref<string | null>(null)
  const isLoadingChat = ref(false)
  const isSending = ref(false)
  const errorMessage = ref<string | null>(null)

  const messages = ref<UIMessage[]>([])

  async function loadExistingChatById(chatId: string) {
    isLoadingChat.value = true
    try {
      const response = await loadChat(chatId)
      currentChatId.value = response.chat.id
      provider.value = response.chat.provider as 'openai'
      model.value = response.chat.model
      messages.value = response.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
      } as UIMessage))
    }
    finally {
      isLoadingChat.value = false
    }
  }

  async function ensureChatId(firstUserText: string) {
    if (currentChatId.value)
      return currentChatId.value
    const title = generateTitle(firstUserText)
    const id = await createChat(provider.value, model.value, title, 'native')
    if (!id)
      throw new Error('Failed to create chat')
    currentChatId.value = id
    options.onFirstChatCreated?.(id)
    return id
  }

  async function sendMessage(payload: { text: string }) {
    if (isSending.value)
      return
    const text = payload.text?.trim()
    if (!text)
      return

    errorMessage.value = null
    isSending.value = true
    try {
      // Append user message optimistically
      const userMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text' as const, text }],
      }
      messages.value.push(userMsg)

      const chatId = await ensureChatId(text)
      await saveMessages(chatId, [{ role: 'user', content: text }])

      // Stream from native OpenAI endpoint
      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text' as const, text: '' }],
      }
      messages.value.push(assistantMsg)

      const resp = await fetch('/api/v1/openai/chat.stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          messages: messages.value.map(m => ({
            role: m.role,
            content: m.parts
              .filter(p => p.type === 'text')
              .map(p => (p as any).text)
              .join('\n'),
          })),
          model: model.value,
        }),
      })

      if (!resp.ok || !resp.body) {
        // Fallback to non-streaming (only for OpenAI native)
        try {
          const fallback = await $fetch<{ content: string }>(
            '/api/v1/openai/chat',
            {
              method: 'POST',
              body: {
                messages: messages.value.map(m => ({
                  role: m.role,
                  content: m.parts
                    .filter(p => p.type === 'text')
                    .map(p => (p as any).text)
                    .join('\n'),
                })),
                model: model.value,
              },
              headers: { Authorization: `Bearer ${auth.token}` },
            },
          )
          const assistantText = String(fallback?.content ?? '')
          const textPart = assistantMsg.parts[0] as any
          textPart.text = assistantText
          await saveMessages(chatId, [{ role: 'assistant', content: assistantText }])
          return
        }
        catch (fallbackErr) {
          const errMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Fallback failed'
          throw new Error(`Streaming failed and fallback error: ${errMsg}`)
        }
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break
          const chunk = decoder.decode(value)
          accumulated += chunk
          const textPart = assistantMsg.parts[0] as any
          textPart.text += chunk
        }
      }
      finally {
        reader.releaseLock()
      }
      await saveMessages(chatId, [{ role: 'assistant', content: accumulated }])
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      errorMessage.value = message
      console.error('[Native Chat] Send failed:', err)
      // Remove the assistant message we added optimistically since it failed
      if (messages.value.length > 0 && messages.value[messages.value.length - 1]?.role === 'assistant') {
        messages.value.pop()
      }
    }
    finally {
      isSending.value = false
    }
  }

  // Expose a Chat-like interface for pages to consume uniformly
  const chat = {
    get messages() { return messages.value },
    sendMessage,
  }

  return {
    chat,
    provider,
    model,
    currentChatId,
    isLoadingChat,
    isSending,
    errorMessage,
    loadExistingChatById,
  }
}
