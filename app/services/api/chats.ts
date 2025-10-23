/**
 * Chat CRUD API client
 * All chat-related operations (create, read, update, delete)
 */
import type { ChatListItem } from '@/types'
import type { CreateChatResponse, GetChatResponse, ListChatsOptions, ListChatsParams, ListChatsResult } from '@/types/api'
import { fetchApi, fetchWithEtag, handleApiError } from './utils'

const BASE_URL = '/api/v1/chats'

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
    `${BASE_URL}/create`,
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
  return fetchApi<GetChatResponse>(`${BASE_URL}/${chatId}`)
}

/**
 * List chats with ETag caching support
 */
export async function listChats(
  params: ListChatsParams,
  options: ListChatsOptions = {},
): Promise<ListChatsResult> {
  try {
    const { data, etag, fromCache } = await fetchWithEtag<ChatListItem[]>(
      BASE_URL,
      {
        query: params,
        ifNoneMatch: options.ifNoneMatch,
      },
    )

    return {
      items: data,
      etag,
      fromCache,
    }
  }
  catch (error: any) {
    handleApiError(error)
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string): Promise<void> {
  try {
    await fetchApi(`${BASE_URL}/${chatId}`, { method: 'DELETE' })
  }
  catch (error: any) {
    handleApiError(error)
  }
}
