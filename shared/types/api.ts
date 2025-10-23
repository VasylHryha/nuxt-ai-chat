/**
 * API request/response types
 * Shared between client and server for type-safe API contracts
 */
import type { UIMessage } from 'ai'
import type { ChatListItem } from './index'

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  statusCode: number
  statusMessage: string
}

// ============================================================================
// CHAT CRUD TYPES
// ============================================================================

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

export interface ListChatsParams {
  email: string
  provider?: string
  model?: string
  startDate?: number
  endDate?: number
}

export interface ListChatsOptions {
  ifNoneMatch?: string
}

export interface ListChatsResult {
  items: ChatListItem[]
  etag?: string
  fromCache: boolean
}

// ============================================================================
// AI STREAMING TYPES (Basic Chat)
// ============================================================================

/**
 * Request body for basic AI chat streaming
 * Endpoint: POST /api/v1/ai/chats
 */
export interface AiChatRequestBody {
  messages: UIMessage[]
  model?: string
  id: string // Chat ID (optional, for message persistence)
  maxSteps?: number
}

// ============================================================================
// AI AGENT TYPES (Advanced Chat with Tools)
// ============================================================================

/**
 * Request body for AI agent chat with tool calling
 * Endpoint: POST /api/v1/ai/chats/[id]/agent
 */
export interface AgentChatRequestBody {
  messages: UIMessage[]
  model?: string
  id: string
  maxSteps?: number // Max tool calling loop iterations (default: 5)
}

/**
 * Tool result types for agent tool calls
 */
export interface WebSearchResultItem {
  title: string
  url: string
  snippet: string
}

export interface WebSearchResult {
  results?: WebSearchResultItem[]
  query: string
  count?: number
  error?: string
  provider?: string
  tip?: string
}

export interface WebFetchResult {
  url: string
  content?: string
  length?: number
  error?: string
}

export interface CalculatorResult {
  result?: number
  expression: string
  error?: string
}

export interface DateTimeResult {
  iso?: string
  formatted?: string
  timestamp?: number
  timezone?: string
  input?: string
  error?: string
}

export interface SummarizeResult {
  instruction: string
  text: string
}

export interface KnowledgeBaseResultItem {
  id?: string
  title?: string
  snippet?: string
  url?: string
  metadata?: Record<string, unknown>
}

export interface KnowledgeBaseResult {
  query: string
  results: KnowledgeBaseResultItem[]
  note: string
}

/**
 * Union type for all possible tool results
 */
export type AgentToolResult
  = | WebSearchResult
    | WebFetchResult
    | CalculatorResult
    | DateTimeResult
    | SummarizeResult
    | KnowledgeBaseResult
