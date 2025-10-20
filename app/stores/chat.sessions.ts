import type { ChatMessage, DirectorySnapshot, Profile, Session } from '~/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { chatRepository } from '@/services/chatRepository'
import { appendMessageAndApplyLimits, CHARACTER_LIMIT } from '@/services/limits'

export const useChatSessions = defineStore('chat.sessions', () => {
  // state - store as DirectorySnapshot internally
  const profileId = ref<string>('default-profile')
  const sessions = ref<Record<string, Session>>({})
  const currentSessionId = ref<string>('')

  // getters
  const current = computed<Session | undefined>(() => sessions.value[currentSessionId.value])
  const messages = computed<ChatMessage[]>(() => current.value?.messages || [])

  // helper to build snapshot for persistence
  function getSnapshot(): DirectorySnapshot {
    const now = Date.now()
    const profile: Profile = {
      id: profileId.value,
      name: 'Default Profile',
      currentSessionId: currentSessionId.value,
      sessions: sessions.value,
      createdAt: now,
      updatedAt: now,
    }
    return {
      currentProfileId: profileId.value,
      profiles: { [profileId.value]: profile },
    }
  }

  // actions
  async function hydrate() {
    const snapshot = await chatRepository.load()

    // Ensure snapshot has valid structure
    if (!snapshot || !snapshot.profiles) {
      console.warn('[chat.sessions] Invalid snapshot structure, using empty state')
      // Create default session
      createNewSession(
        'AI Chat',
        'ai-openai',
        'gpt-4',
        'Hi! How can I help you today?',
      )
      return
    }

    // Extract current profile from snapshot
    const currentProfile = snapshot.currentProfileId ? snapshot.profiles[snapshot.currentProfileId] : undefined

    if (currentProfile) {
      profileId.value = currentProfile.id
      sessions.value = currentProfile.sessions || {}
      currentSessionId.value = currentProfile.currentSessionId || ''
    }

    // Create default session if none exists
    if (!current.value || !currentSessionId.value) {
      createNewSession(
        'AI Chat',
        'ai-openai',
        'gpt-4',
        'Hi! How can I help you today?',
      )
    }
  }

  function persist() {
    chatRepository.save(getSnapshot())
  }

  function createNewSession(title: string, provider: string, model?: string, greeting?: string) {
    const id = crypto.randomUUID()
    const now = Date.now()
    const session: Session = {
      id,
      title,
      provider,
      model,
      messages: [],
      createdAt: now,
      updatedAt: now,
      cappedByCount: false,
      cappedByChars: false,
      charCount: 0,
    }

    if (greeting) {
      appendMessageAndApplyLimits(session, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: greeting,
        createdAt: now,
      })
      session.cappedByChars ||= session.charCount >= CHARACTER_LIMIT
    }

    sessions.value[id] = session
    currentSessionId.value = id
    persist()
  }

  function resetCurrentSession() {
    const s = current.value
    if (!s)
      return
    const greeting = s.messages.find(m => m.role === 'assistant')?.content
    createNewSession(s.title, s.provider, s.model, greeting)
  }

  function pushMessageToCurrent(message: ChatMessage) {
    const s = current.value
    if (!s)
      return
    appendMessageAndApplyLimits(s, message)
    // reassign to keep reactivity happy in edge cases
    sessions.value[s.id] = s
    persist()
  }

  return {
    // state
    sessions,
    currentSessionId,
    // getters
    current,
    messages,
    // actions
    hydrate,
    persist,
    createNewSession,
    resetCurrentSession,
    pushMessageToCurrent,
  }
})
