import db from '@/server/db/main'

export default defineEventHandler(async (event) => {
  const chatId = getRouterParam(event, 'id')!
  const userId = getHeader(event, 'x-user-id') || 'demo-user'

  const chat = db.prepare(`
    SELECT id, title, created_at, updated_at
    FROM chats
    WHERE id = ? AND user_id = ?
  `).get(chatId, userId)

  if (!chat) {
    setResponseStatus(event, 404)
    return { error: 'Chat not found' }
  }

  const messages = db.prepare(`
    SELECT id, role, content, created_at, provider_generation_id
    FROM messages
    WHERE chat_id = ?
    ORDER BY created_at ASC
  `).all(chatId)

  return {
    id: chat.id,
    title: chat.title,
    createdAt: new Date(chat.created_at).toISOString(),
    updatedAt: new Date(chat.updated_at).toISOString(),
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.created_at).toISOString(),
      generationId: m.provider_generation_id || null,
    })),
  }
})
