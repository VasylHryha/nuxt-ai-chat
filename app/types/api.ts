/**
 * API response types for chat operations
 */

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
