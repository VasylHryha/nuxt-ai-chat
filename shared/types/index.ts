/**
 * Shared types used across client and server
 */

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
  reasoning?: string
  createdAt: number
  updatedAt: number
}

export interface Session {
  id: string
  title: string
  provider: string
  model?: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  cappedByCount: boolean
  cappedByChars: boolean
  charCount: number
}

export interface Profile {
  id: string
  name: string
  currentSessionId: string
  sessions: Record<string, Session>
  createdAt: number
  updatedAt: number
}

export interface DirectorySnapshot {
  currentProfileId: string
  profiles: Record<string, Profile>
}

export interface ChatListMessagePreview {
  role: string
  content: string
  createdAt: string
}

export interface ChatListItem {
  id: string
  title: string
  provider: string
  model: string
  ui?: 'ai-sdk' | 'native' | 'proxy'
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: ChatListMessagePreview | null
}
