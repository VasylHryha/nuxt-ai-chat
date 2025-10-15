// app/services/providers/types.ts
export type ProviderKey = 'openrouter' | 'openai' | 'anthropic' | 'gemini'

export type Role = 'system' | 'user' | 'assistant'
export interface ChatTurn { role: Role, content: string }
export interface ChatResponse { content: string, reasoning?: string, provider?: string, model?: string }

export interface ProviderSendInput {
  sessionId: string
  model?: string
  temperature?: number
  messages: ChatTurn[]
  stream?: boolean
  signal?: AbortSignal
}

export interface ChatPort { send: (input: ProviderSendInput) => Promise<ChatResponse> }

export interface DirectoryPort {
  getList: (userId?: string) => Promise<any> // or DirectorySnapshot
  getChat: (sessionIdOrSlug: string) => Promise<any>
  upsertSnapshot: (snapshot: any) => Promise<void>
}

export interface ProviderAdapter {
  key: ProviderKey
  supportsServerChats: boolean
  chat: ChatPort
  directory?: DirectoryPort // present only if supportsServerChats = true
}
