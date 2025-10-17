import type { ChatMessage, Session } from '~/types'

export const MESSAGE_LIMIT = 50
export const CHARACTER_LIMIT = 100_000

export function appendMessageAndApplyLimits(session: Session, message: ChatMessage) {
  // Ensure message has updatedAt
  if (!message.updatedAt) {
    message.updatedAt = message.createdAt || Date.now()
  }

  session.messages.push(message)
  session.charCount += (message.content?.length || 0) + (message.reasoning?.length || 0)
  session.cappedByCount ||= session.messages.length >= MESSAGE_LIMIT
  session.cappedByChars ||= session.charCount >= CHARACTER_LIMIT
  session.updatedAt = Date.now()
}
