import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { createIdGenerator, DefaultChatTransport } from 'ai'
import { TOOL_API } from '@/constants/ai-sdk'
import { createChat, getChat } from '@/services/api'
import { useAuth } from '@/stores/auth'

interface UseAiChatSessionOptions {
  chatId?: string
  onFirstChatCreated?: (id: string) => void
}

export function useAiChatSession(options: UseAiChatSessionOptions = {}) {
  const auth = useAuth()
  const directory = useChatDirectory()

  const provider = ref<'openai' | 'openrouter' | 'anthropic' | 'google'>('openai')
  const model = ref('gpt-4o-mini')

  const currentChatId = ref<string | null>(options.chatId || null)
  const isLoadingChat = ref(false)
  const isCreatingChat = ref(false)
  const chatNotFound = ref(false)
  const loadError = ref<string | null>(null)

  const chat = new Chat({
    generateId: createIdGenerator({ prefix: 'msgc', size: 16 }),
    transport: new DefaultChatTransport({
      api: TOOL_API,
      credentials: 'include',
      headers: () => ({ Authorization: `Bearer ${auth.token}` }),
      async prepareSendMessagesRequest({ messages }) {
        // Create chat on first message if needed
        // Check if this is a new chat (not yet in DB) by checking if it's tracked as "new"
        const isNewChat = currentChatId.value ? directory.isNewChat(currentChatId.value) : true

        if (isNewChat && !isCreatingChat.value) {
          isCreatingChat.value = true
          try {
            const firstUserMessage = messages.find(m => m.role === 'user')
            if (firstUserMessage) {
              const content = firstUserMessage.parts
                .filter(p => p.type === 'text')
                .map(p => (p as any).text)
                .join('\n')

              const title = content.length > 50 ? `${content.substring(0, 50)}...` : content
              const chatId = await createChat(provider.value, model.value, title, 'ai-sdk')
              if (chatId) {
                currentChatId.value = chatId
                // Clear from newChatId store since it's now in DB
                directory.setNewChatId(null)
                options.onFirstChatCreated?.(chatId)
              }
            }
          }
          finally {
            isCreatingChat.value = false
          }
        }

        return { body: { messages, id: currentChatId.value, provider: provider.value, model: model.value } }
      },
    }),
  })

  async function loadExistingChatById(chatId: string) {
    isLoadingChat.value = true
    chatNotFound.value = false
    loadError.value = null

    try {
      const response = await getChat(chatId)

      currentChatId.value = response.chat.id
      provider.value = response.chat.provider
      model.value = response.chat.model

      const uiMessages: UIMessage[] = response.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
      }))

      chat.messages.splice(0, chat.messages.length, ...uiMessages)
    }
    catch (error: any) {
      // Handle 404 specifically
      if (error?.message?.includes('404') || error?.statusCode === 404 || error?.message?.includes('not found')) {
        chatNotFound.value = true
        loadError.value = 'Chat not found'
      }
      else {
        loadError.value = error?.message || 'Failed to load chat'
      }
      console.error('[AI Chat] Failed to load chat:', error)
    }
    finally {
      isLoadingChat.value = false
    }
  }

  return {
    chat,
    provider,
    model,
    currentChatId,
    isLoadingChat,
    chatNotFound,
    loadError,
    loadExistingChatById,
  }
}
