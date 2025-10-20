import { softDeleteChat } from '@/server/db/chats'

export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)
  const chatId = getRouterParam(event, 'chatId')

  if (!chatId)
    throw createError({ statusCode: 400, statusMessage: 'chatId is required' })

  try {
    softDeleteChat(chatId, authUser.id)

    return {
      success: true,
      message: 'Chat deleted successfully',
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete chat'
    const code = message.includes('not found') ? 404 : 500
    throw createError({ statusCode: code, statusMessage: message })
  }
})
