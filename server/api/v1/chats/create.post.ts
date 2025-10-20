import { createChatForUser } from '@/server/db/chats'

export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)

  const body = await readBody<{
    provider: string
    model: string
    title?: string
  }>(event)

  // Validation
  if (!body.provider || !body.model)
    throw createError({ statusCode: 400, statusMessage: 'provider and model are required' })

  try {
    const chat = createChatForUser({
      email: authUser.email,
      provider: body.provider,
      model: body.model,
      title: body.title,
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
