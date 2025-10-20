import { listChatsByUserEmail } from '@/server/db/chats'
import { getLastMessageByChatId, getMessageCountByChatId } from '@/server/db/messages'

export default defineEventHandler((event) => {
  const authUser = requireUser(event)
  const q = getQuery(event)
  const email = String(q.email || '').trim().toLowerCase()
  if (!email)
    throw createError({ statusCode: 400, statusMessage: 'email is required' })
  if (!isValidEmail(email))
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })

  if (email !== authUser.email)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const provider = q.provider ? String(q.provider) : undefined
  const model = q.model ? String(q.model) : undefined

  // Date filters
  const startDate = q.startDate ? Number(q.startDate) : undefined
  const endDate = q.endDate ? Number(q.endDate) : undefined

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
