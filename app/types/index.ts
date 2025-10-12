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
