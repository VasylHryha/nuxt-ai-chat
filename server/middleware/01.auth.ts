import { createError, defineEventHandler, getRequestURL } from 'h3'
import { getTokenFromRequest } from '@/server/utils/auth'
// server/middleware/00.auth.ts

const PUBLIC_PREFIXES = [
  '/api/v1/auth', // login/signup/me/logout
  '/api/public', // any public APIs you expose
  '/api/_nuxt_icon', // nuxt-icon asset proxy
  '/favicon.ico',
]

function isPublic(pathname: string) {
  if (!pathname.startsWith('/api/'))
    return true
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
}

declare module 'h3' {
  interface H3EventContext {
    user?: { id: string, email: string } | null
  }
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  if (!url?.pathname || isPublic(url.pathname)) {
    // console.log('auth', url?.pathname, url)
    // logger.debug?.(`auth skip: ${url.pathname}`)
    return
  }

  const { jwtSecret } = useRuntimeConfig()
  if (!jwtSecret) {
    // Fail fast in dev; in prod you want this set
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET missing' })
  }

  // Extract token from Authorization: Bearer ... OR secure httpOnly cookie
  const token = getTokenFromRequest(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing token' })
  }

  try {
    const payload = verifyJWT(token, jwtSecret, { issuer: 'nuxt-ai-chat' })
    event.context.user = {
      id: String(payload.sub),
      email: String(payload.email || ''),
    }
    console.info(`auth ok: ${event.context.user.email} -> ${url.pathname}`)
  }
  catch (error: unknown) {
    console.warn(`auth failed: ${url.pathname}`)
    console.error(error)
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }
})
