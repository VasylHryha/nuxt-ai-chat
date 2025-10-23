/**
 * Composable for creating new AI SDK chats
 * Generates chat ID and tracks it in store before navigation
 */
import { generateId } from 'ai'
import { useChatDirectory } from '@/stores/chatDirectory'

export function useNewAiChat() {
  const directory = useChatDirectory()
  const router = useRouter()

  /**
   * Create a new chat and navigate to it
   * Marks the chat as "new" in store to skip DB load
   */
  async function createNewChat() {
    // Generate unique chat ID
    const chatId = `chat__${generateId()}`

    // Mark as new in store (replaces any previous new chat)
    directory.setNewChatId(chatId)

    // Navigate to the chat page
    await router.push(`/ai-chat/${chatId}`)

    return chatId
  }

  return {
    createNewChat,
  }
}
