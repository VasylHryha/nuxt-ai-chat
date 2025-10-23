/**
 * AI SDK specific streaming operations
 * For chat CRUD operations, use services/api/chats.ts instead
 */
import type { UIMessage } from 'ai'
import { fetchStream } from './utils'

const BASE_URL = '/api/v1'

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
