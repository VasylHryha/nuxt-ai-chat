import { getUserByEmail, insertUser, upsertPasswordCredential } from '@/server/db/users'
// server/api/v1/auth/signup.post.ts
// Note: setAccessCookie, signJWT, hashPassword are auto-imported from server/utils/

export default defineEventHandler(async (event) => {
  const { email, name, password } = await readBody<{ email?: string, name?: string, password?: string }>(event)

  if (!email || !name || !password)
    throw createError({ statusCode: 400, statusMessage: 'email, name, and password are required' })

  const cleanEmail = email.trim().toLowerCase()
  const emailRe = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRe.test(cleanEmail))
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })

  if (password.length < 8)
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })

  if (getUserByEmail(cleanEmail))
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })

  try {
    const user = insertUser({ email: cleanEmail, name: name.trim() })
    const phash = await hashPassword(password)
    upsertPasswordCredential(user.id, phash)

    const { jwtSecret } = useRuntimeConfig()
    if (!jwtSecret)
      throw new Error('JWT_SECRET missing')
    const ttlSec = 3600
    const token = signJWT({ sub: user.id, email: user.email }, { secret: jwtSecret, expiresInSec: ttlSec, issuer: 'nuxt-ai-chat' })
    setAccessCookie(event, token, ttlSec)

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, createdAt: new Date(user.created_at).toISOString() },
    }
  }
  catch (error: any) {
    // surfaces real cause during dev
    throw createError({ statusCode: 500, statusMessage: `Signup failed: ${error?.message || 'internal error'}` })
  }
})
