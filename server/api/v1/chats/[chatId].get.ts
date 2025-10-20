import { getChatById } from '@/server/db/chats'
import { getMessagesByChatId } from '@/server/db/messages'

export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)
  const chatId = getRouterParam(event, 'chatId')

  if (!chatId)
    throw createError({ statusCode: 400, statusMessage: 'chatId is required' })

  try {
    // Get chat (also verifies ownership)
    const chat = getChatById(chatId, authUser.id)
    if (!chat)
      throw createError({ statusCode: 404, statusMessage: 'Chat not found' })

    // Get messages (also verifies ownership)
    const messages = getMessagesByChatId(chatId, authUser.id)

    return {
      chat: {
        id: chat.id,
        title: chat.title,
        provider: (chat as any).provider,
        model: (chat as any).model,
        ui: (chat as any).ui || 'ai-sdk',
        createdAt: new Date(chat.created_at).toISOString(),
        updatedAt: new Date(chat.updated_at).toISOString(),
      },
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.created_at).toISOString(),
        providerGenerationId: m.provider_generation_id,
      })),
    }
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error)
      throw error

    const message = error instanceof Error ? error.message : 'Failed to get chat'
    throw createError({ statusCode: 500, statusMessage: message })
  }
})
