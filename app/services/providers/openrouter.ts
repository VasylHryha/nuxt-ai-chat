import type { ChatProvider, ChatResponse, ProviderSendInput } from './types'

export function openrouterProvider(): ChatProvider {
  return {
    name: 'openrouter',
    async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
      const result = await $fetch<{ content?: unknown, reasoning?: unknown, provider?: string, model?: string }>(
        '/api/v1/openrouter/chat',
        { method: 'POST', body: { messages, model, temperature }, signal },
      )
      return {
        content: typeof result?.content === 'string' ? result.content : String(result?.content ?? ''),
        reasoning: typeof result?.reasoning === 'string' ? result.reasoning : undefined,
        provider: result?.provider ?? 'openrouter',
        model: result?.model,
      }
    },
  }
}
