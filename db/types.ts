export type Provider = 'openai' | 'openrouter' | 'anthropic' | 'google' | 'mistral' | 'cohere'

export interface User {
  id: string
  email: string
  created_at: number
}

export interface Connection {
  id: string
  user_id: string
  label: string
  provider: Provider
  model: string
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
