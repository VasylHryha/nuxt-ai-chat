import type { ChatResponse, ProviderAdapter, ProviderSendInput } from './types'

export function openrouterProvider(): ProviderAdapter {
  return {
    key: 'openrouter',
    type: 'proxy',
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        const r = await $fetch('/api/v1/openrouter/chat', {
          method: 'POST',
          body: { messages, model, temperature },
          signal,
        })
        return {
          content: String(r?.content ?? ''),
          reasoning: r?.reasoning,
          provider: 'openrouter',
          model: r?.model ?? model,
        }
      },
    },
  }
}
