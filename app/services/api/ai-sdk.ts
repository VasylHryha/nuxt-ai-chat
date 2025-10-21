/**
 * Centralized API client for AI SDK chat operations
 * Uses global API interceptor for auth headers and error handling
 */
import type { UIMessage } from 'ai'
import type { CreateChatResponse, GetChatResponse } from '@/types/api'
import { fetchApi, fetchStream } from './utils'

const BASE_URL = '/api/v1'

/**
 * Create a new chat
 */
export async function createChat(
  provider: string,
  model: string,
  title: string,
  ui: 'ai-sdk' | 'native' | 'proxy' = 'ai-sdk',
): Promise<string> {
  const response = await fetchApi<CreateChatResponse>(
    `${BASE_URL}/chats/create`,
    {
      method: 'POST',
      body: { provider, model, title, ui },
    },
  )
  return response.id
}

/**
 * Get chat with all messages
 */
export async function getChat(chatId: string): Promise<GetChatResponse> {
  return fetchApi<GetChatResponse>(
    `${BASE_URL}/chats/${chatId}`,
    {
      method: 'GET',
    },
  )
}

/**
 * Stream chat response from AI SDK endpoint
 * Handles SSE streaming internally via AI SDK
 */
export async function streamChat(
  messages: UIMessage[],
  model: string,
  chatId: string | null,
  provider: string = 'openai',
): Promise<Response> {
  return fetchStream(
    `${BASE_URL}/ai/chats`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        id: chatId,
        provider,
      }),
    },
  )
}

/**
 * Export all API methods
 */
export const aiSdkApi = {
  createChat,
  getChat,
  streamChat,
}
