// composables/useChatPersistence.ts
import { useAuth } from '@/stores/auth'

export function useChatPersistence() {
  const auth = useAuth()

  /**
   * Create a new chat in the database
   */
  async function createChat(provider: string, model: string, title: string, ui?: 'ai-sdk' | 'proxy' | 'native'): Promise<string | null> {
    try {
      const response = await $fetch<{ id: string }>('/api/v1/chats/create', {
        method: 'POST',
        body: { provider, model, title, ui },
        headers: { Authorization: `Bearer ${auth.token}` },
      })

      return response.id
    }
    catch (error) {
      console.error('[Chat Persistence] Failed to create chat:', error)
      return null
    }
  }

  /**
   * Save a batch of messages to the database
   */
  async function saveMessages(
    chatId: string,
    messages: Array<{ role: 'user' | 'assistant', content: string }>,
  ): Promise<void> {
    if (!chatId || messages.length === 0)
      return

    try {
      // Save messages sequentially to preserve order
      for (const message of messages) {
        await $fetch(`/api/v1/chats/${chatId}/messages`, {
          method: 'POST',
          body: {
            role: message.role,
            content: message.content,
          },
          headers: { Authorization: `Bearer ${auth.token}` },
        })
      }
    }
    catch (error) {
      console.error('[Chat Persistence] Failed to save messages:', error)
      throw error
    }
  }

  /**
   * Load chat with messages from database
   */
  async function loadChat(chatId: string) {
    try {
      const response = await $fetch<{
        chat: any
        messages: Array<{ id: string, role: string, content: string, createdAt: string }>
      }>(`/api/v1/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })

      return response
    }
    catch (error: any) {
      console.error('[Chat Persistence] Failed to load chat:', error)
      throw error
    }
  }

  /**
   * Generate title from first message (first 50 chars)
   */
  function generateTitle(firstMessage: string): string {
    const trimmed = firstMessage.trim()
    return trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed
  }

  return {
    createChat,
    saveMessages,
    loadChat,
    generateTitle,
  }
}
