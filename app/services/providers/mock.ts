import type { ChatMessage, ChatProvider } from '~/types'

export function mockProvider(): ChatProvider {
  return {
    name: 'Mock Provider',
    async send(history: ChatMessage[]) {
      const last = history.at(-1)
      await new Promise(r => setTimeout(r, 150))
      return { role: 'assistant', content: `Mock: ${last?.content ?? 'hi'}`, reasoning: 'mock' }
    },
  }
}
