<script setup lang="ts">
import type { ChatDateFilterValue, ChatProviderFilterValue } from '@/constants/chats'
import { LazyChatDeleteModal } from '#components'
import { useOverlay } from '#imports'
import ChatListHeader from '@/components/ChatListHeader.vue'
import { resolveDateFilterStart } from '@/constants/chats'

const auth = useAuth()
const { remove, ensure } = useChatDirectory()
const { isLoading, errorMessage, list } = storeToRefs(useChatDirectory())
const overlay = useOverlay()
const toast = useToast()

// Filters (unified reactive object)
const filters = ref({
  search: '',
  provider: 'all' as ChatProviderFilterValue,
  dateRange: 'all' as ChatDateFilterValue,
})

const chatDeleteModal = overlay.create(LazyChatDeleteModal)

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

// Centralized fetch function
async function fetchChatsWithCurrentParams(force = false) {
  const email = auth.user?.email
  if (!email) {
    console.error('[Chats] No user email found, cannot fetch chats')
    return
  }

  const provider = filters.value.provider !== 'all' ? filters.value.provider : undefined
  const startDate = resolveDateFilterStart(filters.value.dateRange)

  try {
    await ensure({ email, provider, startDate }, { force })
  }
  catch (err: any) {
    console.error('[Chats] Failed to fetch chats:', err)
  }
}

// Retry with force refresh
async function retryFetch() {
  await fetchChatsWithCurrentParams(true)
}

// Watch filters and refetch
watch(
  () => filters,
  () => fetchChatsWithCurrentParams(),
  { immediate: true },
)

// Client-side search filtering
const filteredChats = computed(() => {
  if (!filters.value.search.trim())
    return list.value

  const query = filters.value.search.toLowerCase().trim()
  return list.value.filter((chat) => {
    const matchesTitle = chat.title.toLowerCase().includes(query)
    const matchesMessage = chat.lastMessage?.content?.toLowerCase().includes(query) ?? false

    return matchesTitle || matchesMessage
  })
})

useHead({ title: 'My Chats · Nuxt AI Chat' })
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Filters -->
    <ChatListHeader v-model="filters" />

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
        {{ filters.search ? 'No chats found' : 'No chats yet' }}
      </h2>
      <p class="text-fg-muted mt-2">
        {{ filters.search ? 'Try adjusting your search or filters' : 'Start a new conversation to get started' }}
      </p>
      <NuxtLink v-if="!filters.search" to="/ai-chat/new" class="chip-accent px-6 py-3 mt-6 rounded-lg inline-block">
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
