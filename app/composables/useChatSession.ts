/**
 * Unified chat session composable supporting both native and proxy providers
 * Consolidates useNativeChatSession and useProxyChatSession logic
 */
import type { UIMessage } from 'ai'
import { useChatPersistence } from '@/composables/useChatPersistence'
import { useAuth } from '@/stores/auth'

export type ChatSessionType = 'native' | 'proxy'

interface UseChatSessionOptions {
  type: ChatSessionType
  onFirstChatCreated?: (id: string) => void
}

/**
 * Unified composable for both native and proxy chat sessions
 * Handles streaming, error management, and message persistence
 */
export function useChatSession(options: UseChatSessionOptions = { type: 'native' }) {
  const auth = useAuth()
  const { createChat, saveMessages, loadChat, generateTitle } = useChatPersistence()

  // Provider varies by type
  const isProxy = options.type === 'proxy'
  const defaultProvider = isProxy ? 'openrouter' : 'openai'
  const defaultModel = isProxy ? 'deepseek/deepseek-r1' : 'gpt-4o-mini'

  const provider = ref<string>(defaultProvider)
  const model = ref(defaultModel)

  const currentChatId = ref<string | null>(null)
  const isLoadingChat = ref(false)
  const isSending = ref(false)
  const errorMessage = ref<string | null>(null)

  const messages = ref<UIMessage[]>([])

  /**
   * Load an existing chat by ID
   */
  async function loadExistingChatById(chatId: string) {
    isLoadingChat.value = true
    try {
      const response = await loadChat(chatId)
      currentChatId.value = response.chat.id
      provider.value = response.chat.provider
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

  /**
   * Ensure a chat ID exists, creating one if needed
   */
  async function ensureChatId(firstUserText: string) {
    if (currentChatId.value)
      return currentChatId.value
    const title = generateTitle(firstUserText)
    const id = await createChat(provider.value, model.value, title, options.type)
    if (!id)
      throw new Error('Failed to create chat')
    currentChatId.value = id
    options.onFirstChatCreated?.(id)
    return id
  }

  /**
   * Convert message content from UI format to API format
   */
  function getApiMessages() {
    return messages.value.map(m => ({
      role: m.role,
      content: m.parts
        .filter(p => p.type === 'text')
        .map(p => (p as any).text)
        .join('\n'),
    }))
  }

  /**
   * Get the streaming endpoint for the current provider
   */
  function getStreamingEndpoint(): string {
    return `/api/v1/${provider.value}/chat.stream`
  }

  /**
   * Get the fallback (non-streaming) endpoint if available
   */
  function getFallbackEndpoint(): string | null {
    // Only native OpenAI has a fallback
    if (options.type === 'native' && provider.value === 'openai')
      return '/api/v1/openai/chat'
    return null
  }

  /**
   * Handle streaming response and update message
   */
  async function handleStreaming(
    assistantMsg: UIMessage,
    endpoint: string,
    apiMessages: any[],
  ): Promise<string> {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        messages: apiMessages,
        model: model.value,
      }),
    })

    if (!resp.ok || !resp.body) {
      const fallbackEndpoint = getFallbackEndpoint()
      if (!fallbackEndpoint)
        throw new Error(`Streaming failed for ${provider.value} (status: ${resp.status})`)

      // Try fallback for native providers
      try {
        const fallback = await $fetch<{ content: string }>(
          fallbackEndpoint,
          {
            method: 'POST',
            body: {
              messages: apiMessages,
              model: model.value,
            },
            headers: { Authorization: `Bearer ${auth.token}` },
          },
        )
        const assistantText = String(fallback?.content ?? '')
        const textPart = assistantMsg.parts[0] as any
        textPart.text = assistantText
        return assistantText
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
    return accumulated
  }

  /**
   * Send a message and stream the response
   */
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

      // Create assistant message placeholder
      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text' as const, text: '' }],
      }
      messages.value.push(assistantMsg)

      // Stream response
      const apiMessages = getApiMessages()
      const endpoint = getStreamingEndpoint()
      const assistantText = await handleStreaming(assistantMsg, endpoint, apiMessages)
      await saveMessages(chatId, [{ role: 'assistant', content: assistantText }])
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      errorMessage.value = message
      console.error(`[${options.type} Chat] Send failed:`, err)
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
