import type { ChatResponse, ProviderAdapter, ProviderSendInput } from './types'

export function aiOpenAIProvider(): ProviderAdapter {
  return {
    key: 'ai-openai',
    type: 'ai-sdk',
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        const r = await $fetch('/api/v1/ai/chat', {
          method: 'POST',
          body: { provider: 'openai', messages, model, temperature },
          signal,
        })
        return {
          content: String(r?.content ?? ''),
          reasoning: r?.reasoning,
          provider: 'ai-openai',
          model: r?.model ?? model,
        }
      },
    },
  }
}
