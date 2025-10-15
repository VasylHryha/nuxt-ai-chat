// app/services/providers/nuxt.ts  (also used for openai via facade)
import type { ChatResponse, ProviderAdapter, ProviderKey, ProviderSendInput } from './types'

const toS = (v: unknown) => typeof v === 'string' ? v : (v == null ? '' : String(v))

export function nuxtProvider(kind: Extract<ProviderKey, 'openrouter' | 'openai'>): ProviderAdapter {
  return {
    key: kind,
    supportsServerChats: kind === 'openai',
    chat: {
      async send({ messages, model, temperature, signal }: ProviderSendInput): Promise<ChatResponse> {
        const r = await $fetch('/api/v1/chat', {
          method: 'POST',
          body: { provider: kind, messages, model, temperature },
          signal,
        })
        return { content: toS(r?.content), reasoning: typeof r?.reasoning === 'string' ? r.reasoning : undefined, provider: r?.provider ?? kind, model: r?.model ?? model }
      },
    },
    directory: kind === 'openai'
      ? {
          getList: (userId?: string) => $fetch(`/api/v1/openai/chats`, { method: 'GET', query: { userId } }),
          getChat: (id: string) => $fetch(`/api/v1/openai/chats/${id}`, { method: 'GET' }), // you can add this route later
          upsertSnapshot: (snap: any) => $fetch(`/api/v1/openai/chats`, { method: 'PUT', body: snap }),
        }
      : undefined,
  }
}
