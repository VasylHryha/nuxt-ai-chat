// server/api/v1/auth/login.post.ts
import { getPasswordHashByEmail } from '@/server/db/users'
// Note: safeValidate, loginSchema are auto-imported from server/utils/

export default defineEventHandler(async (event) => {
  // Validate input with Zod schema (auto-imported)
  const { email, password } = await safeValidate(readBody(event), loginSchema)
  const record = getPasswordHashByEmail(email)

  if (!record)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const valid = await verifyPassword(record.hash, password)
  if (!valid)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const cfg = useRuntimeConfig()
  if (!cfg.jwtSecret)
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET missing' })

  const ttlSec = 60 * 15 // 15 minutes
  const token = await signJWT(
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
