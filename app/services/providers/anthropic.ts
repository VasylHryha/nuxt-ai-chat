// app/services/providers/anthropic.ts
import type { ChatResponse, ProviderAdapter, ProviderSendInput } from './types'

export function anthropicProvider(): ProviderAdapter {
  return {
    key: 'anthropic',
    supportsServerChats: false, // no server list in our app
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        // Use unified facade; server dispatches to Anthropic adapter
        const r = await $fetch('/api/v1/chat', {
          method: 'POST',
          body: { provider: 'anthropic', messages, model, temperature },
          signal,
        })
        return { content: String(r?.content ?? ''), reasoning: typeof r?.reasoning === 'string' ? r.reasoning : undefined, provider: 'anthropic', model: r?.model ?? model }
      },
    },
  }
}
