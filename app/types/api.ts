/**
 * API response types for chat operations
 */
import type { ChatListItem } from './index'

export interface ApiError {
  statusCode: number
  statusMessage: string
}

export interface CreateChatResponse {
  id: string
}

export interface GetChatResponse {
  chat: {
    id: string
    title: string
    provider: string
    model: string
    createdAt: string
    updatedAt: string
  }
  messages: Array<{
    id: string
    role: string
    content: string
    createdAt: string
    providerGenerationId?: string
  }>
}

/**
 * Chat list query parameters
 */
export interface ListChatsParams {
  email: string
  provider?: string
  model?: string
  startDate?: number
  endDate?: number
}

/**
 * Chat list request options
 */
export interface ListChatsOptions {
  ifNoneMatch?: string
}

/**
 * Chat list response with ETag support
 */
export interface ListChatsResult {
  items: ChatListItem[]
  etag?: string
  fromCache: boolean
}
