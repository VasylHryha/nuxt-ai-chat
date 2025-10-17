import { getUserByEmail, insertUser, upsertPasswordCredential } from '@/server/db/users'
// server/api/v1/auth/signup.post.ts
export default defineEventHandler(async (event) => {
  const { email, name, password } = await readBody<{ email: string, name: string, password: string }>(event)
  if (!email || !name || !password)
    throw createError({ statusCode: 400, statusMessage: 'email, name, password required' })
  if (getUserByEmail(email))
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })

  const user = insertUser({ email, name })
  const phash = await hashPassword(password)
  upsertPasswordCredential(user.id, phash)

  const { jwtSecret } = useRuntimeConfig()
  const ttlSec = 3600
  const token = signJWT({ sub: user.id, email: user.email }, {
    secret: jwtSecret,
    expiresInSec: ttlSec,
    issuer: 'nuxt-ai-chat',
  })
  setAccessCookie(event, token, ttlSec)

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: new Date(user.created_at).toISOString() },
  }
})
