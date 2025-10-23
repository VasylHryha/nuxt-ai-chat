import type { ChatListItem } from '@/types'
import { handleApiError } from './utils'

interface ListChatsParams {
  email: string
  provider?: string
  model?: string
  startDate?: number
  endDate?: number
}

interface ListChatsOptions {
  ifNoneMatch?: string
}

export interface ListChatsResult {
  items: ChatListItem[]
  etag?: string
  fromCache: boolean
}

export async function listChats(params: ListChatsParams, options: ListChatsOptions = {}): Promise<ListChatsResult> {
  try {
    const response = await $fetch.raw<ChatListItem[]>('/api/v1/chats', {
      query: params,
      headers: options.ifNoneMatch
        ? {
            'If-None-Match': options.ifNoneMatch,
          }
        : undefined,
    })

    if (response.status === 304) {
      return {
        items: [],
        etag: options.ifNoneMatch,
        fromCache: true,
      }
    }

    const etag = response.headers.get('ETag') ?? undefined
    const data = response._data ?? []

    return {
      items: data,
      etag,
      fromCache: false,
    }
  }
  catch (error: any) {
    handleApiError(error)
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    await $fetch(`/api/v1/chats/${chatId}`, {
      method: 'DELETE',
    })
  }
  catch (error: any) {
    handleApiError(error)
  }
}
