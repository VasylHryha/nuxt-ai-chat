import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { createIdGenerator, DefaultChatTransport } from 'ai'
import { useChatPersistence } from '@/composables/useChatPersistence'
import { useAuth } from '@/stores/auth'

interface UseAiChatSessionOptions {
  onFirstChatCreated?: (id: string) => void
}

export function useAiChatSession(options: UseAiChatSessionOptions = {}) {
  const auth = useAuth()
  const { createChat, saveMessages, loadChat, generateTitle } = useChatPersistence()

  const provider = ref<'openai' | 'openrouter' | 'anthropic' | 'google'>('openai')
  const model = ref('gpt-5-nano')

  const currentChatId = ref<string | null>(null)
  const isLoadingChat = ref(false)
  const lastSavedMessageCount = ref(0)
  const isSaving = ref(false)

  const chat = new Chat({
    generateId: createIdGenerator({ prefix: 'msgc', size: 16 }),
    transport: new DefaultChatTransport({
      api: '/api/v1/ai/chats',
      credentials: 'include',
      headers: () => ({ Authorization: `Bearer ${auth.token}` }),
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { messages, id, provider: provider.value, model: model.value } }
      },
    }),
  })

  async function saveNewMessages() {
    if (isSaving.value)
      return

    const currentMessageCount = chat.messages.length
    if (currentMessageCount <= lastSavedMessageCount.value)
      return

    isSaving.value = true

    const unsavedMessages = chat.messages.slice(lastSavedMessageCount.value)
    const messagesToSave = unsavedMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const content = m.parts
          .filter(p => p.type === 'text')
          .map(p => (p as any).text)
          .join('\n')
        return { role: m.role as 'user' | 'assistant', content }
      })

    if (messagesToSave.length === 0) {
      isSaving.value = false
      return
    }

    if (!currentChatId.value) {
      const firstUserMessage = messagesToSave.find(m => m.role === 'user')
      if (!firstUserMessage) {
        isSaving.value = false
        return
      }

      const title = generateTitle(firstUserMessage.content)
      const chatId = await createChat(provider.value, model.value, title, 'ai-sdk')
      if (!chatId) {
        console.error('[AI Chat] Failed to create chat')
        isSaving.value = false
        return
      }
      currentChatId.value = chatId
      options.onFirstChatCreated?.(chatId)
    }

    try {
      await saveMessages(currentChatId.value!, messagesToSave)
      lastSavedMessageCount.value = currentMessageCount
    }
    catch (error) {
      console.error('[AI Chat] Failed to save messages:', error)
    }
    finally {
      isSaving.value = false
    }
  }

  async function loadExistingChatById(chatId: string) {
    isLoadingChat.value = true
    try {
      const response = await loadChat(chatId)

      currentChatId.value = response.chat.id
      provider.value = response.chat.provider
      model.value = response.chat.model

      const uiMessages: UIMessage[] = response.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
      }))

      chat.messages.splice(0, chat.messages.length, ...uiMessages)
      lastSavedMessageCount.value = uiMessages.length
    }
    finally {
      isLoadingChat.value = false
    }
  }

  let saveTimeout: NodeJS.Timeout | null = null
  watch(() => chat.messages.length, (newLength, oldLength) => {
    if (oldLength === 0 || newLength <= oldLength)
      return
    const lastMessage = chat.messages[newLength - 1]
    if (!lastMessage || lastMessage.role !== 'assistant')
      return
    if (saveTimeout)
      clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      await saveNewMessages()
    }, 500)
  })

  return {
    chat,
    provider,
    model,
    currentChatId,
    isLoadingChat,
    lastSavedMessageCount,
    saveNewMessages,
    loadExistingChatById,
  }
}
