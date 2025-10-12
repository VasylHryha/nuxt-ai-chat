import { createError, defineEventHandler, readBody } from 'h3'
import type { SessionPayload } from '~~/server/utils/session-store'
import { getSessionPayload, updateSessionPayload } from '~~/server/utils/session-store'

export default defineEventHandler(async (event) => {
  const body = await readBody<SessionPayload | null>(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid session payload' })
  }

  updateSessionPayload({
    sessions: body.sessions || {},
    currentSessionId: body.currentSessionId || '',
  })

  return getSessionPayload()
})
