import { listChatsByUserEmail } from '@/server/db/chats'

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

  try {
    const rows = listChatsByUserEmail({ email, provider, model })
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      provider: r.provider,
      model: r.model,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list chats'
    const code = message.includes('User not found') ? 404 : 400
    throw createError({ statusCode: code, statusMessage: message })
  }
})
