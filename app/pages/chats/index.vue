<script setup lang="ts">
import { getChatRouteFor } from '@/services/providers/routing'

const auth = useAuth()

interface Chat {
  id: string
  title: string
  provider: string
  model: string
  ui?: 'ai-sdk' | 'native' | 'proxy'
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: {
    role: string
    content: string
    createdAt: string
  } | null
}

// State
const chats = ref<Chat[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const selectedProvider = ref<string>('all')
const dateFilter = ref<string>('all') // 'all', 'today', 'week', 'month'

// Modal state
const isDeleteModalOpen = ref(false)
const pendingDeleteId = ref<string>('')
const pendingDeleteTitle = ref<string>('')
const deleteError = ref<string | null>(null)

// Fetch chats
async function fetchChats() {
  isLoading.value = true
  error.value = null

  try {
    const params: any = {
      email: auth.user?.email,
    }

    // Add provider filter if selected
    if (selectedProvider.value !== 'all') {
      params.provider = selectedProvider.value
    }

    // Add date filter
    if (dateFilter.value !== 'all') {
      const now = Date.now()
      if (dateFilter.value === 'today') {
        params.startDate = now - 24 * 60 * 60 * 1000
      }
      else if (dateFilter.value === 'week') {
        params.startDate = now - 7 * 24 * 60 * 60 * 1000
      }
      else if (dateFilter.value === 'month') {
        params.startDate = now - 30 * 24 * 60 * 60 * 1000
      }
    }

    const data = await $fetch<Chat[]>('/api/v1/chats', {
      query: params,
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    chats.value = data
  }
  catch (err: any) {
    error.value = err?.message || 'Failed to load chats'
    console.error('[Chats] Failed to fetch:', err)
  }
  finally {
    isLoading.value = false
  }
}

// Open delete confirmation modal
function openDeleteModal(chatId: string, chatTitle: string) {
  pendingDeleteId.value = chatId
  pendingDeleteTitle.value = chatTitle
  deleteError.value = null
  isDeleteModalOpen.value = true
}

// Confirm and delete chat
async function confirmDeleteChat() {
  deleteError.value = null

  try {
    await $fetch(`/api/v1/chats/${pendingDeleteId.value}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    // Remove from list
    chats.value = chats.value.filter(c => c.id !== pendingDeleteId.value)
    isDeleteModalOpen.value = false
  }
  catch (err: any) {
    deleteError.value = err?.message || 'Failed to delete chat'
    console.error('[Chats] Failed to delete:', err)
  }
}

// Computed: Filtered chats by search query
const filteredChats = computed(() => {
  if (!searchQuery.value)
    return chats.value

  const query = searchQuery.value.toLowerCase()
  return chats.value.filter(chat =>
    chat.title.toLowerCase().includes(query)
    || chat.lastMessage?.content.toLowerCase().includes(query),
  )
})

// Compute route target per chat based on provider/model
function getChatLink(chat: Chat) {
  return getChatRouteFor(chat.provider, chat.model, chat.id, chat.ui)
}

// Format date helper
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1)
    return 'Just now'
  if (diffMins < 60)
    return `${diffMins}m ago`
  if (diffHours < 24)
    return `${diffHours}h ago`
  if (diffDays < 7)
    return `${diffDays}d ago`

  return date.toLocaleDateString()
}

// Provider badge color
function getProviderColor(provider: string) {
  const colors: Record<string, string> = {
    openai: 'emerald',
    anthropic: 'orange',
    google: 'blue',
    openrouter: 'purple',
  }
  return colors[provider] || 'gray'
}

// Load chats on mount
onMounted(() => {
  fetchChats()
})

// Reload when filters change
watch([selectedProvider, dateFilter], () => {
  fetchChats()
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
    <div class="panel p-4 flex flex-wrap gap-3">
      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <UInput
          v-model="searchQuery"
          placeholder="Search by title or message..."
          icon="i-heroicons-magnifying-glass-20-solid"
        />
      </div>

      <!-- Provider Filter -->
      <select
        v-model="selectedProvider"
        class="px-3 py-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] text-fg"
      >
        <option value="all">
          All Providers
        </option>
        <option value="openai">
          OpenAI
        </option>
        <option value="anthropic">
          Anthropic
        </option>
        <option value="google">
          Google
        </option>
        <option value="openrouter">
          OpenRouter
        </option>
      </select>

      <!-- Date Filter -->
      <select
        v-model="dateFilter"
        class="px-3 py-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] text-fg"
      >
        <option value="all">
          All Time
        </option>
        <option value="today">
          Today
        </option>
        <option value="week">
          This Week
        </option>
        <option value="month">
          This Month
        </option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path-20-solid" class="text-4xl text-fg-muted animate-spin mx-auto" />
      <p class="text-fg-muted mt-2">
        Loading chats...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="panel p-6 text-center">
      <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="text-4xl text-red-400 mx-auto" />
      <p class="text-fg mt-2">
        {{ error }}
      </p>
      <button class="chip-accent px-4 py-2 mt-4 rounded-lg" @click="fetchChats">
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
      <div
        v-for="chat in filteredChats"
        :key="chat.id"
        class="panel p-4 hover:shadow-lg transition-all group relative"
      >
        <NuxtLink
          :to="getChatLink(chat)"
          class="block"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Title and Date -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <h3 class="text-lg font-semibold text-fg truncate group-hover:text-emerald-400 transition-colors">
                  {{ chat.title }}
                </h3>
                <span class="text-xs text-fg-muted whitespace-nowrap">
                  {{ formatDate(chat.updatedAt) }}
                </span>
              </div>

              <!-- Provider Badge and Model -->
              <div class="flex items-center gap-2 mb-2">
                <UBadge :color="getProviderColor(chat.provider)" variant="soft" size="sm">
                  {{ chat.provider }}
                </UBadge>
                <span class="text-xs text-fg-muted">
                  {{ chat.model }}
                </span>
                <span class="text-xs text-fg-subtle">
                  • {{ chat.messageCount }} messages
                </span>
              </div>

              <!-- Last Message Preview -->
              <p v-if="chat.lastMessage" class="text-sm text-fg-muted line-clamp-2">
                <span class="font-medium">{{ chat.lastMessage.role === 'user' ? 'You:' : 'AI:' }}</span>
                {{ chat.lastMessage.content }}
              </p>
              <p v-else class="text-sm text-fg-subtle italic">
                No messages yet
              </p>
            </div>
          </div>
        </NuxtLink>

        <!-- Delete Button -->
        <button
          class="absolute top-4 right-4 chip px-3 py-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
          @click.prevent="openDeleteModal(chat.id, chat.title)"
        >
          <UIcon name="i-heroicons-trash-20-solid" />
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="isDeleteModalOpen">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-fg mb-2">
          Delete Chat
        </h2>
        <p class="text-fg-muted mb-6">
          Are you sure you want to delete "<strong>{{ pendingDeleteTitle }}</strong>"? This action cannot be undone.
        </p>

        <!-- Error message -->
        <div v-if="deleteError" class="bg-red-500/10 border border-red-500/20 rounded p-3 mb-6">
          <p class="text-red-400 text-sm">
            {{ deleteError }}
          </p>
        </div>

        <!-- Modal Actions -->
        <div class="flex gap-3 justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isDeleteModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            @click="confirmDeleteChat"
          >
            Delete
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
