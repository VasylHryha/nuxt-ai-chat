export type Provider = 'openai' | 'openrouter' | 'anthropic' | 'google' | 'mistral' | 'cohere'

// db/types.ts — DB row shapes (server-only)
export interface DbUser {
  id: string
  email: string
  name: string
  created_at: number
}

export interface DbCredential {
  id: string
  user_id: string
  kind: 'password' | 'oauth' | 'magic'
  password_hash?: string | null
  password_salt?: string | null
  password_algo?: string | null
  password_params?: string | null
  created_at: number
  updated_at: number
}

// API-safe shape
export interface PublicUser extends DbUser {}

// Minimal identity in JWT
export type AuthUser = Omit<DbUser, 'created_at'>

export interface Connection {
  id: string
  user_id: string
  label: string
  provider: Provider
  model: string
  ui?: 'ai-sdk' | 'native' | 'proxy'
  base_url?: string
  settings_json?: string
  created_at: number
  updated_at: number
  deleted_at?: number | null
}

export interface Chat {
  id: string
  user_id: string
  connection_id: string
  title: string
  created_at: number
  updated_at: number
  deleted_at?: number | null
}

export interface Message {
  id: string
  chat_id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  created_at: number
  provider_generation_id?: string | null
}
