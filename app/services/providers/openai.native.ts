import type { ChatResponse, ProviderAdapter, ProviderSendInput } from './types'

export function openaiNativeProvider(): ProviderAdapter {
  return {
    key: 'openai',
    type: 'native',
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        const r = await $fetch('/api/v1/openai/chat', {
          method: 'POST',
          body: { messages, model, temperature },
          signal,
        })
        return {
          content: String(r?.content ?? ''),
          reasoning: r?.reasoning,
          provider: 'openai',
          model: r?.model ?? model,
        }
      },
    },
  }
}
