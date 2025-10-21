import { createChatForUser } from '@/server/db/chats'
// Note: safeValidate, createChatSchema are auto-imported from server/utils/

export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)

  // Validate input with Zod schema (auto-imported)
  const body = await safeValidate(readBody(event), createChatSchema)

  try {
    const chat = createChatForUser({
      email: authUser.email,
      provider: body.provider,
      model: body.model,
      title: body.title,
      ui: body.ui,
    })

    return {
      id: chat.id,
      title: chat.title,
      provider: body.provider,
      model: body.model,
      createdAt: new Date(chat.created_at).toISOString(),
      updatedAt: new Date(chat.updated_at).toISOString(),
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create chat'
    const code = message.includes('Invalid provider') ? 400 : 500
    throw createError({ statusCode: code, statusMessage: message })
  }
})
