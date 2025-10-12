import { useChatSessions } from '@/stores/chat.sessions'

export default defineNuxtPlugin(() => {
  useChatSessions().hydrate()
})
