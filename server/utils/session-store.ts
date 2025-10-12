import type { Session } from '~/types'

export interface SessionPayload {
  sessions: Record<string, Session>
  currentSessionId: string
}

const state: SessionPayload = {
  sessions: {},
  currentSessionId: '',
}

export function getSessionPayload(): SessionPayload {
  return state
}

export function updateSessionPayload(payload: SessionPayload) {
  state.sessions = payload.sessions
  state.currentSessionId = payload.currentSessionId
}
