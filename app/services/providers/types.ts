// Provider-local types (kept out of global types to avoid bloat)
export type Role = 'system' | 'user' | 'assistant'

export interface ChatTurn { role: Role, content: string }

export interface ChatResponse {
  content: string
  reasoning?: string
  provider?: string
  model?: string
}

export interface ProviderSendInput {
  sessionId: string
  model?: string
  temperature?: number
  messages: ChatTurn[]
  stream?: boolean
  signal?: AbortSignal
}

export interface ChatProvider {
  name: string
  send: (input: ProviderSendInput) => Promise<ChatResponse>
}

export type ProviderKey = 'nuxt' | 'openrouter' | 'openai' | 'deepseek'
