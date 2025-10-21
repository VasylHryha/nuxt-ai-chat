import { createError, defineEventHandler, getRequestURL } from 'h3'
import { getTokenFromRequest } from '@/server/utils/auth'
// server/middleware/01.auth.ts

const PUBLIC_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/signup',
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

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (!url?.pathname || isPublic(url.pathname)) {
    return
  }

  const { jwtSecret } = useRuntimeConfig()
  if (!jwtSecret) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET missing' })
  }

  const token = getTokenFromRequest(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing token' })
  }

  try {
    const payload = await verifyJWT(token, jwtSecret, { issuer: 'nuxt-ai-chat' })
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
