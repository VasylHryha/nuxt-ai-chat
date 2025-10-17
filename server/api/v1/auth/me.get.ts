import { getUserByEmail } from '@/server/db/users'
// server/api/v1/auth/me.get.ts

export default defineEventHandler((event) => {
  const { email } = requireUser(event)
  const u = getUserByEmail(email)
  if (!u)
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  return { id: u.id, email: u.email, createdAt: new Date(u.created_at).toISOString() }
})
