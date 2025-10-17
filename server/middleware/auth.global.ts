import { getRequestURL } from 'h3' // from h3
// server/middleware/auth.global.ts
// Optional: centralize your public routes
const PUBLIC_PREFIXES = ['/api/v1/auth', '/api/public', '/favicon.ico']

function isPublic(pathname: string) {
  // keep simple & explicit; expand as needed
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
  const { jwtSecret } = useRuntimeConfig()
  const url = getRequestURL(event)

  // Only guard API calls you care about; allow public endpoints
  if (isPublic(url.pathname))
    return

  // Extract token from Authorization: Bearer ... OR secure httpOnly cookie
  const auth = getHeader(event, 'authorization') || ''
  const token
    = auth.startsWith('Bearer ') ? auth.slice(7).trim() : (getCookie(event, 'access_token') || '')

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing token' })
  }

  try {
    const payload = verifyJWT(token, jwtSecret, { issuer: 'nuxt-ai-chat' })
    // Attach a small, immutable identity to the request context.
    // Handlers read from here; do NOT re-parse headers/query.
    event.context.user = {
      id: String(payload.sub),
      email: String(payload.email || ''),
    }
  }
  catch (e: unknown) {
    console.error(e)
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }
})
