import { addUser, getUserByEmail } from '@/server/db/users'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.email && typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
    }

    const existing = getUserByEmail(email)

    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'User already exists' })
    }

    addUser(body.email)

    const u = getUserByEmail(email)
    if (!u) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create user' })
    }
    setResponseStatus(event, 201)
    setHeader(event, 'Location', `/api/v1/users/${u.id}`)
    return { id: u.id, email: u.email, createdAt: new Date(u.created_at).toISOString() }
  }
  else {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }
})
