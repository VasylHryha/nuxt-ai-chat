import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { createIdGenerator, DefaultChatTransport } from 'ai'
import { createChat, getChat } from '@/services/api'
import { useAuth } from '@/stores/auth'

interface UseAiChatSessionOptions {
  chatId?: string
  onFirstChatCreated?: (id: string) => void
}

export function useAiChatSession(options: UseAiChatSessionOptions = {}) {
  const auth = useAuth()

  const provider = ref<'openai' | 'openrouter' | 'anthropic' | 'google'>('openai')
  const model = ref('gpt-4o-mini')

  const currentChatId = ref<string | null>(options.chatId || null)
  const isLoadingChat = ref(false)
  const isCreatingChat = ref(false)

  const chat = new Chat({
    generateId: createIdGenerator({ prefix: 'msgc', size: 16 }),
    transport: new DefaultChatTransport({
      api: '/api/v1/ai/chats',
      credentials: 'include',
      headers: () => ({ Authorization: `Bearer ${auth.token}` }),
      async prepareSendMessagesRequest({ messages }) {
        // Create chat on first message if needed
        if (!currentChatId.value && !isCreatingChat.value) {
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
    loadExistingChatById,
  }
}
