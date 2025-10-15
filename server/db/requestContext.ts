import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'

import db from './main'

export function getEmailFromRequest(event: H3Event): string | null {
  const h = getHeader(event, 'x-user-email')
  return h ? h.trim().toLowerCase() : null
}

export function getUserFromRequest(event: H3Event) {
  const email = getEmailFromRequest(event)
  if (!email)
    return null
  const stmt = db.query(`SELECT * FROM users WHERE email = ?`)
  const user = stmt.get(email) as any | undefined
  return user ?? null
}

export function requireUser(event: H3Event) {
  const u = getUserFromRequest(event)
  if (!u)
    throw createError({ statusCode: 401, statusMessage: 'User not registered' })
  return u
}
