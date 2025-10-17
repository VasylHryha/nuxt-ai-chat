// server/utils/auth.ts
import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getHeader, setCookie } from 'h3'
import { verifyJWT } from './jwt'

const ACCESS_COOKIE = 'access_token'

export function getTokenFromRequest(event: H3Event) {
  // Prefer Authorization header; fallback to cookie
  const auth = getHeader(event, 'authorization') || ''
  if (auth.startsWith('Bearer '))
    return auth.slice(7).trim()
  const cookie = getCookie(event, ACCESS_COOKIE)
  return cookie || ''
}

export function setAccessCookie(event: H3Event, token: string, maxAgeSec: number) {
  setCookie(event, ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: maxAgeSec,
  })
}

export function clearAccessCookie(event: H3Event) {
  deleteCookie(event, ACCESS_COOKIE, { path: '/' })
}

export function getAuthUser(event: H3Event) {
  const cfg = useRuntimeConfig()
  const token = getTokenFromRequest(event)
  if (!token)
    return null
  try {
    const payload = verifyJWT(token, cfg.jwtSecret, { issuer: 'nuxt-ai-chat' })
    // we expect { sub: user_id, email }
    return { id: String(payload.sub), email: String(payload.email || '') }
  }
  catch {
    return null
  }
}

// Throw if not authenticated
export function requireUser(event: H3Event) {
  const u = event.context.user
  if (!u)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return u
}
