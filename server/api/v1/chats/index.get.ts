import { listChatsByUserEmail } from '@/server/db/chats'
import { getLastMessageByChatId, getMessageCountByChatId } from '@/server/db/messages'
// Note: safeValidateQuery, listChatsQuerySchema are auto-imported from server/utils/

export default defineEventHandler((event) => {
  const authUser = requireUser(event)

  // Validate query parameters with Zod schema (auto-imported)
  const { email, provider, model, startDate, endDate } = safeValidateQuery(getQuery(event), listChatsQuerySchema)

  if (email !== authUser.email)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  try {
    let rows = listChatsByUserEmail({ email, provider, model })

    // Apply date filters if provided
    if (startDate) {
      rows = rows.filter(r => r.updated_at >= startDate)
    }
    if (endDate) {
      rows = rows.filter(r => r.updated_at <= endDate)
    }

    // Get message count and last message for each chat
    return rows.map((r) => {
      const messageCount = getMessageCountByChatId(r.id)
      const lastMessage = getLastMessageByChatId(r.id)

      return {
        id: r.id,
        title: r.title,
        provider: r.provider,
        model: r.model,
        ui: r.ui || 'ai-sdk',
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
        messageCount,
        lastMessage: lastMessage
          ? {
              role: lastMessage.role,
              content: lastMessage.content.substring(0, 100), // Preview first 100 chars
              createdAt: new Date(lastMessage.created_at).toISOString(),
            }
          : null,
      }
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list chats'
    const code = message.includes('User not found') ? 404 : 400
    throw createError({ statusCode: code, statusMessage: message })
  }
})
