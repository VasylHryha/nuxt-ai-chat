import type { ChatListItem } from '@/types'
import { defineStore } from 'pinia'
import { deleteChat, listChats } from '@/services/api'

export interface ChatDirectoryParams {
  email: string
  provider?: string
  startDate?: number
}

interface FetchOptions {
  force?: boolean
}

export const useChatDirectory = defineStore('chatDirectory', () => {
  const items = ref<ChatListItem[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const errorMessage = ref('')
  const etag = ref<string | null>(null)
  const lastFetchedAt = ref(0)
  const ttlMs = ref(30_000) // 30 seconds
  const dirty = ref(true) // Marks data as stale after mutations
  const newChatId = ref<string | null>(null) // Track single new chat ID

  const list = computed(() => items.value)
  const isStale = computed(() => Date.now() - lastFetchedAt.value > ttlMs.value)
  const totalMessages = computed(() => items.value.reduce((sum, chat) => sum + chat.messageCount, 0))
  const providersUsed = computed(() => new Set(items.value.map(chat => chat.provider)).size)

  function markDirty() {
    dirty.value = true
  }

  function setNewChatId(chatId: string | null) {
    newChatId.value = chatId
  }

  function isNewChat(chatId: string): boolean {
    return newChatId.value === chatId
  }

  async function ensure(params: ChatDirectoryParams, options: FetchOptions = {}) {
    // Skip fetch if data is fresh and not dirty (unless forced)
    const needsFetch = options.force || dirty.value || isStale.value

    if (!needsFetch)
      return

    await fetchAll(params, { useEtag: !options.force && !dirty.value })
  }

  async function fetchAll(params: ChatDirectoryParams, options: { useEtag: boolean }) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const { items: fetched, etag: responseEtag, fromCache } = await listChats(params, {
        ifNoneMatch: options.useEtag ? etag.value ?? undefined : undefined,
      })

      lastFetchedAt.value = Date.now()

      if (fromCache) {
        dirty.value = false
        return
      }

      items.value = fetched
      etag.value = responseEtag ?? null
      dirty.value = false
    }
    catch (error: any) {
      errorMessage.value = error?.message || 'Failed to load chats'
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function remove(id: string) {
    isMutating.value = true

    try {
      await deleteChat(id)
      items.value = items.value.filter(chat => chat.id !== id)
      dirty.value = true
    }
    finally {
      isMutating.value = false
    }
  }

  return {
    // state
    items,
    isLoading,
    isMutating,
    errorMessage,
    etag,
    lastFetchedAt,
    ttlMs,
    dirty,
    newChatId,
    // getters
    list,
    isStale,
    totalMessages,
    providersUsed,
    // actions
    ensure,
    markDirty,
    remove,
    setNewChatId,
    isNewChat,
  }
})
