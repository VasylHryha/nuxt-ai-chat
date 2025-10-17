import type { ChatMessage, DirectorySnapshot, Profile, Session } from '~/types'
// app/services/chatRepository.ts
import { $fetch } from 'ofetch'

const STORAGE_KEY = 'ai-chat.v1.directory'

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'
const now = () => Date.now()

// ——— Merge helpers ———
function mergeMessages(local: ChatMessage[], remote: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>()
  for (const m of local) byId.set(m.id, m)
  for (const r of remote) {
    const l = byId.get(r.id)
    if (!l || r.updatedAt > l.updatedAt)
      byId.set(r.id, r)
  }
  return Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt)
}

function mergeSessions(local: Record<string, Session>, remote: Record<string, Session>): Record<string, Session> {
  const out: Record<string, Session> = { ...local }
  for (const [id, r] of Object.entries(remote)) {
    const l = out[id]
    if (!l) {
      out[id] = r
      continue
    }
    // last-write-wins at session level; also merge messages
    const mergedMsgs = mergeMessages(l.messages, r.messages)
    const newer = (r.updatedAt > l.updatedAt) ? r : l
    out[id] = { ...newer, messages: mergedMsgs }
  }
  return out
}

function mergeProfiles(local: Record<string, Profile>, remote: Record<string, Profile>): Record<string, Profile> {
  const out: Record<string, Profile> = { ...local }
  for (const [id, rp] of Object.entries(remote)) {
    const lp = out[id]
    if (!lp) {
      out[id] = rp
      continue
    }
    const sessions = mergeSessions(lp.sessions, rp.sessions)
    const newer = (rp.updatedAt > lp.updatedAt) ? rp : lp
    out[id] = { ...newer, sessions }
    // if currentSessionId disappeared, clear it
    if (!out[id].sessions[out[id].currentSessionId])
      out[id].currentSessionId = ''
  }
  return out
}

function mergeSnapshots(local: DirectorySnapshot, remote: DirectorySnapshot): DirectorySnapshot {
  const profiles = mergeProfiles(local.profiles || {}, remote.profiles || {})
  // prefer whichever snapshot is newer via max updated profile
  const localMax = Math.max(0, ...Object.values(local.profiles || {}).map(p => p.updatedAt))
  const remoteMax = Math.max(0, ...Object.values(remote.profiles || {}).map(p => p.updatedAt))
  const currentProfileId = remoteMax >= localMax ? remote.currentProfileId || local.currentProfileId : local.currentProfileId
  return { currentProfileId, profiles }
}

// ——— Repository ———
let pushTimer: any = null
let syncTimer: any = null

export const chatRepository = {
  async load(): Promise<DirectorySnapshot> {
    // 1) Local first
    if (isBrowser()) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw)
          return JSON.parse(raw) as DirectorySnapshot
      }
      catch {
      }
    }
    // 2) Remote fallback
    try {
      const remote = await $fetch<DirectorySnapshot>('/api/v1/chats', { method: 'GET' })
      if (isBrowser())
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote || { currentProfileId: '', profiles: {} }))
      return remote || { currentProfileId: '', profiles: {} }
    }
    catch {
      return { currentProfileId: '', profiles: {} }
    }
  },

  async save(snapshot: DirectorySnapshot) {
    // Local cache
    if (isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      }
      catch {
      }
    }
    // Debounced push
    if (pushTimer)
      clearTimeout(pushTimer)
    pushTimer = setTimeout(async () => {
      try {
        await $fetch('/api/v1/chats', { method: 'PUT', body: snapshot })
      }
      catch {
      }
    }, 600) // debounce 600ms
  },

  async syncPull(local: DirectorySnapshot): Promise<DirectorySnapshot> {
    try {
      const remote = await $fetch<DirectorySnapshot>('/api/v1/chats', { method: 'GET' })
      const merged = mergeSnapshots(local, remote || { currentProfileId: '', profiles: {} })
      // If merged differs, persist
      await this.save(merged)
      return merged
    }
    catch {
      return local
    }
  },

  startBackgroundSync(getLocal: () => DirectorySnapshot, setLocal: (snap: DirectorySnapshot) => void, intervalMs = 60_000) {
    if (syncTimer)
      clearInterval(syncTimer)
    syncTimer = setInterval(async () => {
      const merged = await this.syncPull(getLocal())
      setLocal(merged) // reflect merges into the store
    }, intervalMs)
  },

  stopBackgroundSync() {
    if (syncTimer)
      clearInterval(syncTimer)
    syncTimer = null
  },

  now,
}
