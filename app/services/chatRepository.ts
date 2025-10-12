import type { Session } from '~/types'
import { $fetch } from 'ofetch' // Nuxt's $fetch (ofetch) explicitly imported

const SESSIONS_KEY = 'ai-chat.v1.sessions'
const CURRENT_KEY = 'ai-chat.v1.current'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

interface LoadResult { sessions: Record<string, Session>, currentSessionId: string }

/**
 * Single repository:
 * 1) Try localStorage (browser).
 * 2) If empty or not available, try API fallback (optional, future-ready).
 * 3) Always return a safe shape.
 */
export const chatRepository = {
  async load(): Promise<LoadResult> {
    // 1) Browser localStorage
    if (isBrowser()) {
      try {
        const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}') || {}
        const currentSessionId = localStorage.getItem(CURRENT_KEY) || ''

        // If we have something, use it immediately.
        if (Object.keys(sessions).length > 0 && currentSessionId) {
          return { sessions, currentSessionId }
        }
      }
      catch {
        // corrupted localStorage → fall through to API
      }
    }

    // 2) API fallback (optional; works in both SSR and client)
    try {
      // shape is up to your future API; we expect the same as localStorage
      const result = await $fetch<LoadResult>('/api/v1/chats', { method: 'GET' })
      if (result && typeof result === 'object') {
        // If we’re in the browser, also cache to localStorage for next time
        if (isBrowser()) {
          localStorage.setItem(SESSIONS_KEY, JSON.stringify(result.sessions || {}))
          localStorage.setItem(CURRENT_KEY, result.currentSessionId || '')
        }
        return {
          sessions: result.sessions || {},
          currentSessionId: result.currentSessionId || '',
        }
      }
    }
    catch {
      // No API yet or offline — ignore
    }

    // 3) Safe default
    return { sessions: {}, currentSessionId: '' }
  },

  /**
   * Save to localStorage, then try to notify the API (best-effort).
   * This means the app works offline and syncs when possible.
   */
  async save(sessions: Record<string, Session>, currentSessionId: string): Promise<void> {
    // 1) Local cache
    if (isBrowser()) {
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
        localStorage.setItem(CURRENT_KEY, currentSessionId)
      }
      catch {
        // quota or private mode — ignore, still try API
      }
    }

    // 2) Best-effort API sync (if/when you implement it)
    try {
      await $fetch('/api/v1/chats', {
        method: 'PUT',
        body: { sessions, currentSessionId },
      })
    }
    catch {
      // API not implemented or offline — ignore
    }
  },
}
