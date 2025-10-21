import { getUserByEmail, insertUser, upsertPasswordCredential } from '@/server/db/users'
// server/api/v1/auth/signup.post.ts
// Note: setAccessCookie, signJWT, hashPassword, safeValidate, signupSchema are auto-imported from server/utils/

export default defineEventHandler(async (event) => {
  // Validate input with Zod schema (auto-imported)
  const { email, name, password } = await safeValidate(readBody(event), signupSchema)

  if (getUserByEmail(email))
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })

  try {
    const user = insertUser({ email, name })
    const phash = await hashPassword(password)
    upsertPasswordCredential(user.id, phash)

    const { jwtSecret } = useRuntimeConfig()
    if (!jwtSecret)
      throw new Error('JWT_SECRET missing')
    const ttlSec = 60 * 15 // 15 minutes
    const token = await signJWT({ sub: user.id, email: user.email }, { secret: jwtSecret, expiresInSec: ttlSec, issuer: 'nuxt-ai-chat' })
    setAccessCookie(event, token, ttlSec)

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, createdAt: new Date(user.created_at).toISOString() },
    }
  }
  catch (error: unknown) {
    // surfaces real cause during dev
    const message = error instanceof Error ? error.message : 'internal error'
    throw createError({ statusCode: 500, statusMessage: `Signup failed: ${message}` })
  }
})
