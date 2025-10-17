// Provider keys - extensible for any future provider
export type ProviderKey = 'ai-openai' | 'openai' | 'openrouter' | 'anthropic' | 'google'

// Provider types - for different backend architectures
export type ProviderType = 'ai-sdk' | 'proxy' | 'native'

export type Role = 'system' | 'user' | 'assistant'

export interface ChatTurn {
  role: Role
  content: string
}

export interface ChatResponse {
  content: string
  reasoning?: string // For reasoning models like DeepSeek R1
  provider?: string
  model?: string
}

export interface ProviderSendInput {
  model?: string
  temperature?: number
  messages: ChatTurn[]
  signal?: AbortSignal
}

export interface ChatPort {
  send: (input: ProviderSendInput) => Promise<ChatResponse>
}

export interface ProviderAdapter {
  key: ProviderKey
  type: ProviderType // How this provider is implemented
  chat: ChatPort
}

// Provider metadata for UI display
export interface ProviderInfo {
  key: ProviderKey
  name: string
  type: ProviderType
  description?: string
  supportsReasoning?: boolean
  defaultModel?: string
}
