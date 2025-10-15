// server/utils/state/openaiDirectory.ts
import type { H3Event } from 'h3'

export interface Snapshot { currentProfileId: string, profiles: Record<string, any> }

// Use globalThis to keep a single instance across hot reloads
const g = globalThis as any
if (!g.__OPENAI_DIR__)
  g.__OPENAI_DIR__ = { currentProfileId: '', profiles: {} } as Snapshot

export function getSnapshot(_event?: H3Event): Snapshot {
  return g.__OPENAI_DIR__ as Snapshot
}

export function setSnapshot(next: Snapshot) {
  g.__OPENAI_DIR__ = {
    currentProfileId: next?.currentProfileId || '',
    profiles: next?.profiles || {},
  } as Snapshot
}

export function getChatById(id: string) {
  const snap = getSnapshot()
  for (const p of Object.values(snap.profiles || {}) as any[]) {
    if (p.sessions?.[id])
      return p.sessions[id]
  }
  return null
}
