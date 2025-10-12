import type { ChatMessage, Session } from '~/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { chatRepository } from '@/services/chatRepository'
import { appendMessageAndApplyLimits, CHARACTER_LIMIT } from '@/services/limits'

export const useChatSessions = defineStore('chat.sessions', () => {
  // state
  const sessions = ref<Record<string, Session>>({})
  const currentSessionId = ref<string>('')

  // getters
  const current = computed<Session | undefined>(() => sessions.value[currentSessionId.value])
  const messages = computed<ChatMessage[]>(() => current.value?.messages || [])

  // actions
  async function hydrate() {
    const { sessions: loaded, currentSessionId: loadedId } = await chatRepository.load()
    sessions.value = loaded
    currentSessionId.value = loadedId

    if (!current.value || !currentSessionId.value) {
      createNewSession(
        'DeepSeek via OpenRouter',
        'openrouter',
        'deepseek/deepseek-r1',
        'Hi! I am the DeepSeek reasoning model proxied through OpenRouter. What can I help you explore?',
      )
    }
  }

  function persist() {
    chatRepository.save(sessions.value, currentSessionId.value)
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
