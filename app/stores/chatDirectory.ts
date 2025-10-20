import type { ChatListItem, CreateChatInput } from '@/services/chatDirectoryRepository'
// app/stores/chatDirectory.ts
import { defineStore } from 'pinia'
import { chatDirectoryRepository as repo } from '@/services/chatDirectoryRepository'

export const useChatDirectory = defineStore('chatDirectory', () => {
  // state
  const items = ref<ChatListItem[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const errorMessage = ref('')
  const lastFetchedAt = ref(0)
  const ttlMs = ref(30_000) // 30s SWR TTL

  // getters
  const list = computed(() => items.value)
  const isStale = computed(() => Date.now() - lastFetchedAt.value > ttlMs.value)
  const totalMessages = computed(() => 0) // optional if you want a stat (needs extra API); keep 0 for now
  const providersUsed = computed(() => new Set(items.value.map(i => i.provider)).size)

  // actions
  async function ensure(force = false) {
    if (!force && items.value.length && !isStale.value)
      return
    await fetchAll()
  }

  async function fetchAll() {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const rows = await repo.list()
      items.value = rows
      lastFetchedAt.value = Date.now()
    }
    catch (e: any) {
      errorMessage.value = String(e?.statusMessage || e?.message || 'Failed to load chats')
    }
    finally {
      isLoading.value = false
    }
  }

  async function create(input: CreateChatInput) {
    isMutating.value = true
    errorMessage.value = ''
    try {
      const created = await repo.create(input)
      items.value = [created, ...items.value]
      return created
    }
    catch (e: any) {
      errorMessage.value = String(e?.statusMessage || e?.message || 'Failed to create chat')
      throw e
    }
    finally {
      isMutating.value = false
    }
  }

  async function rename(id: string, title: string) {
    isMutating.value = true
    errorMessage.value = ''
    try {
      await repo.rename(id, title)
      const idx = items.value.findIndex(c => c.id === id)
      if (idx >= 0)
        items.value[idx] = { ...items.value[idx], title, updatedAt: new Date().toISOString() }
    }
    catch (e: any) {
      errorMessage.value = String(e?.statusMessage || e?.message || 'Failed to rename chat')
      throw e
    }
    finally {
      isMutating.value = false
    }
  }

  async function remove(id: string) {
    isMutating.value = true
    errorMessage.value = ''
    try {
      await repo.remove(id)
      items.value = items.value.filter(c => c.id !== id)
    }
    catch (e: any) {
      errorMessage.value = String(e?.statusMessage || e?.message || 'Failed to delete chat')
      throw e
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
    lastFetchedAt,
    ttlMs,
    // getters
    list,
    isStale,
    totalMessages,
    providersUsed,
    // actions
    ensure,
    fetchAll,
    create,
    rename,
    remove,
  }
})
