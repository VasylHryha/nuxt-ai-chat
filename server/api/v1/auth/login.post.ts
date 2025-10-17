// server/api/v1/auth/login.post.ts
import { getPasswordHashByEmail } from '@/server/db/users'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<{ email: string, password: string }>(event)
  if (!email || !password)
    throw createError({ statusCode: 400, statusMessage: 'email and password required' })

  const clean = String(email).trim().toLowerCase()
  const record = getPasswordHashByEmail(clean)

  if (!record)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const valid = await verifyPassword(record.hash, password)
  if (!valid)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const cfg = useRuntimeConfig()
  if (!cfg.jwtSecret)
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET missing' })

  const ttlSec = 60 * 60 // 1 hour
  const token = signJWT(
    { sub: record.user.id, email: record.user.email },
    { secret: cfg.jwtSecret, expiresInSec: ttlSec, issuer: 'nuxt-ai-chat' },
  )

  setAccessCookie(event, token, ttlSec)
  return {
    token, // also return for non-cookie clients
    user: {
      id: record.user.id,
      email: record.user.email,
      name: record.user.name,
      createdAt: new Date(record.user.created_at).toISOString(),
    },
    expiresIn: ttlSec,
  }
})
