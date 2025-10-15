// app/services/providers/gemini.ts
import type { ChatResponse, ProviderAdapter, ProviderSendInput } from './types'

export function geminiProvider(): ProviderAdapter {
  return {
    key: 'gemini',
    supportsServerChats: false, // treat as local-only for now
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        const r = await $fetch('/api/v1/chat', {
          method: 'POST',
          body: { provider: 'gemini', messages, model, temperature },
          signal,
        })
        return { content: String(r?.content ?? ''), reasoning: typeof r?.reasoning === 'string' ? r.reasoning : undefined, provider: 'gemini', model: r?.model ?? model }
      },
    },
  }
}
