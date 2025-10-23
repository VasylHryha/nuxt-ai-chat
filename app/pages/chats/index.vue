<script setup lang="ts">
import type { ChatDateFilterValue, ChatProviderFilterValue } from '@/constants/chats'
import type { ChatDirectoryParams } from '@/stores/chatDirectory'
import { LazyChatDeleteModal } from '#components'
import { useOverlay } from '#imports'

import { CHAT_DATE_FILTERS, CHAT_PROVIDER_FILTERS, resolveDateFilterStart } from '@/constants/chats'

const auth = useAuth()
const { remove, ensure } = useChatDirectory()
const { isLoading, errorMessage, list } = storeToRefs(useChatDirectory())
const overlay = useOverlay()
const toast = useToast()

// Filters
const searchQuery = ref('')
const selectedProvider = ref<ChatProviderFilterValue>('all')
const dateFilter = ref<ChatDateFilterValue>('all')
const providerOptions = CHAT_PROVIDER_FILTERS
const dateOptions = CHAT_DATE_FILTERS

const chatDeleteModal = overlay.create(LazyChatDeleteModal) // Create an in

function openDeleteModal({ id, title }: { id: string, title: string }) {
  chatDeleteModal.open({
    title,
    loading: isLoading.value,
    onConfirm: () => {
      try {
        remove(id)
      }
      catch (err: any) {
        console.error('[Chats] Failed to delete chat:', err)
        toast.add({
          title: `Failed to delete chat: ${err.message}`,
          color: 'error',
          id: 'modal-dismiss',
        })
      }
    },
  })
}

// Derived query params for list API
const chatQueryParams = computed<ChatDirectoryParams | null>(() => {
  const email = auth.user?.email
  if (!email)
    return null

  const provider = selectedProvider.value !== 'all' ? selectedProvider.value : undefined
  const startDate = resolveDateFilterStart(dateFilter.value)

  return {
    email,
    provider,
    startDate,
  }
})

async function retryFetch() {
  const params = chatQueryParams.value
  if (!params)
    return

  try {
    await ensure(params, { force: true })
  }
  catch (err: any) {
    console.error('[Chats] Retry failed:', err)
  }
}

// Fetch chats when filters or auth user change
watch(
  chatQueryParams,
  async (params) => {
    if (!params)
      return

    try {
      await ensure(params)
    }
    catch (err: any) {
      console.error('[Chats] Failed to ensure chats:', err)
    }
  },
  { immediate: true },
)

// Computed: Filtered chats by search query
const filteredChats = computed(() => {
  if (!searchQuery.value)
    return list.value

  const query = searchQuery.value.toLowerCase()
  return list.value.filter((chat) => {
    const matchesTitle = chat.title.toLowerCase().includes(query)
    const matchesMessage = chat.lastMessage?.content
      ? chat.lastMessage.content.toLowerCase().includes(query)
      : false

    return matchesTitle || matchesMessage
  })
})

useHead({ title: 'My Chats · Nuxt AI Chat' })
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-fg">
          My Chats
        </h1>
        <p class="text-sm text-fg-muted mt-1">
          Browse and manage your conversations
        </p>
      </div>
      <NuxtLink
        to="/ai-chat/new"
        class="chip-accent px-4 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <UIcon name="i-heroicons-plus-20-solid" />
        New Chat
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="panel p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 sm:min-w-[250px]">
          <UInput
            v-model="searchQuery"
            placeholder="Search by title or message..."
            icon="i-heroicons-magnifying-glass-20-solid"
            class="w-full"
          />
        </div>

        <!-- Filters Row -->
        <div class="flex gap-3 sm:flex-shrink-0">
          <!-- Provider Filter -->
          <USelect
            v-model="filters.provider"
            :items="providerOptions"
            class="w-full sm:w-48"
            aria-label="Filter by provider"
          />

          <!-- Date Filter -->
          <USelect
            v-model="filters.dateRange"
            :items="dateOptions"
            class="w-full sm:w-44"
            aria-label="Filter by date"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path-20-solid" class="text-4xl text-fg-muted animate-spin mx-auto" />
      <p class="text-fg-muted mt-2">
        Loading chats...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="panel p-6 text-center">
      <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="text-4xl text-red-400 mx-auto" />
      <p class="text-fg mt-2">
        {{ errorMessage }}
      </p>
      <button class="chip-accent px-4 py-2 mt-4 rounded-lg" @click="retryFetch">
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredChats.length === 0" class="panel p-12 text-center">
      <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="text-6xl text-fg-subtle mx-auto" />
      <h2 class="text-xl font-semibold text-fg mt-4">
        {{ searchQuery ? 'No chats found' : 'No chats yet' }}
      </h2>
      <p class="text-fg-muted mt-2">
        {{ searchQuery ? 'Try adjusting your search or filters' : 'Start a new conversation to get started' }}
      </p>
      <NuxtLink v-if="!searchQuery" to="/ai-chat/new" class="chip-accent px-6 py-3 mt-6 rounded-lg inline-block">
        <UIcon name="i-heroicons-plus-20-solid" class="mr-2" />
        Create Your First Chat
      </NuxtLink>
    </div>

    <!-- Chat List -->
    <div v-else class="grid gap-4">
      <ChatListItem
        v-for="chat in filteredChats"
        :key="chat.id"
        :chat="chat"
        @delete="openDeleteModal"
      />
    </div>
  </div>
</template>
