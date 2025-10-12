import { defineEventHandler } from 'h3'
import { getSessionPayload } from '~~/server/utils/session-store'

export default defineEventHandler(() => {
  return getSessionPayload()
})
