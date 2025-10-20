import { getChatById, updateChatTimestamp } from '@/server/db/chats'
import { insertMessage } from '@/server/db/messages'

export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)
  const chatId = getRouterParam(event, 'chatId')

  if (!chatId)
    throw createError({ statusCode: 400, statusMessage: 'chatId is required' })

  const body = await readBody<{
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    providerGenerationId?: string
  }>(event)

  // Validation
  if (!body.role || !body.content)
    throw createError({ statusCode: 400, statusMessage: 'role and content are required' })

  if (!['system', 'user', 'assistant', 'tool'].includes(body.role))
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })

  try {
    // Verify chat exists and user owns it
    const chat = getChatById(chatId, authUser.id)
    if (!chat)
      throw createError({ statusCode: 404, statusMessage: 'Chat not found' })

    // Insert message
    const message = insertMessage({
      chatId,
      role: body.role,
      content: body.content,
      providerGenerationId: body.providerGenerationId,
    })

    // Update chat's updated_at timestamp
    updateChatTimestamp(chatId, authUser.id)

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: new Date(message.created_at).toISOString(),
      providerGenerationId: message.provider_generation_id,
    }
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error)
      throw error

    const message = error instanceof Error ? error.message : 'Failed to add message'
    throw createError({ statusCode: 500, statusMessage: message })
  }
})
