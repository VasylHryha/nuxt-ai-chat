<!-- pages/chats/index.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useChatSessions } from '@/stores/chat.sessions'

const sessions = useChatSessions()
const { sessions: allSessions, currentSessionId } = storeToRefs(sessions)
const toast = useToast()

const renameState = reactive({
  open: false,
  sessionId: '',
  title: '',
  error: '',
})

const deleteState = reactive({
  open: false,
  sessionId: '',
  title: '',
})

const chatList = computed(() => {
  return Object.values(allSessions.value).sort((a, b) => b.updatedAt - a.updatedAt)
})

function onNew() {
  sessions.createNewSession('New chat', 'ai-openai', 'gpt-4o')
  navigateTo('/ai-chat')
}

function openChat(id: string) {
  currentSessionId.value = id
  navigateTo('/ai-chat')
}

function renameChat(id: string) {
  const session = allSessions.value[id]
  if (!session)
    return
  renameState.open = true
  renameState.sessionId = id
  renameState.title = session.title
  renameState.error = ''
}

function cancelRename() {
  renameState.open = false
  renameState.sessionId = ''
  renameState.title = ''
  renameState.error = ''
}

function submitRename() {
  const session = allSessions.value[renameState.sessionId]
  if (!session) {
    cancelRename()
    return
  }
  const nextTitle = renameState.title.trim()
  if (!nextTitle) {
    renameState.error = 'Title cannot be empty'
    return
  }
  session.title = nextTitle
  session.updatedAt = Date.now()
  sessions.persist()
  toast.add?.({ title: 'Chat renamed', color: 'emerald' })
  cancelRename()
}

function deleteChat(id: string) {
  const session = allSessions.value[id]
  if (!session)
    return
  deleteState.open = true
  deleteState.sessionId = id
  deleteState.title = session.title
}

function cancelDelete() {
  deleteState.open = false
  deleteState.sessionId = ''
  deleteState.title = ''
}

function confirmDelete() {
  const id = deleteState.sessionId
  if (!id) {
    cancelDelete()
    return
  }
  delete allSessions.value[id]
  if (currentSessionId.value === id)
    currentSessionId.value = ''
  sessions.persist()
  toast.add?.({ title: 'Chat deleted', color: 'red' })
  cancelDelete()
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0)
    return `${days}d ago`
  if (hours > 0)
    return `${hours}h ago`
  if (minutes > 0)
    return `${minutes}m ago`
  return 'Just now'
}

function getProviderColor(provider: string) {
  const colors: Record<string, string> = {
    'ai-openai': 'text-emerald-300',
    'openai': 'text-green-300',
    'openrouter': 'text-blue-300',
    'anthropic': 'text-amber-300',
    'google': 'text-red-300',
  }
  return colors[provider] || 'text-fg-subtle'
}

useHead({ title: 'My Chats · Nuxt AI Chat' })
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-fg">
          My Chats
        </h1>
        <p class="text-sm text-fg-muted mt-1">
          View and manage your conversations
        </p>
      </div>
      <UButton
        color="emerald"
        size="md"
        class="rounded-xl"
        icon="i-heroicons-plus-20-solid"
        @click="onNew"
      >
        New Chat
      </UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="panel shadow-soft p-4">
        <div class="flex items-center gap-3">
          <div
            class="size-10 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="text-emerald-300 size-5" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-fg">
              {{ chatList.length }}
            </p>
            <p class="text-xs text-fg-muted">
              Total Chats
            </p>
          </div>
        </div>
      </div>

      <div class="panel shadow-soft p-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-lg bg-blue-500/15 border border-blue-400/25 flex items-center justify-center">
            <UIcon name="i-heroicons-envelope-20-solid" class="text-blue-300 size-5" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-fg">
              {{ chatList.reduce((sum, c) => sum + c.messages.length, 0) }}
            </p>
            <p class="text-xs text-fg-muted">
              Total Messages
            </p>
          </div>
        </div>
      </div>

      <div class="panel shadow-soft p-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-lg bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
            <UIcon name="i-heroicons-circle-stack-20-solid" class="text-purple-300 size-5" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-fg">
              {{ new Set(chatList.map(c => c.provider)).size }}
            </p>
            <p class="text-xs text-fg-muted">
              Providers Used
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat List -->
    <div v-if="chatList.length > 0" class="space-y-3">
      <div
        v-for="chat in chatList"
        :key="chat.id"
        class="panel shadow-soft p-4 hover:border-emerald-400/30 transition-all cursor-pointer group"
        @click="openChat(chat.id)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Title & Provider -->
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-base font-semibold text-fg truncate">
                {{ chat.title }}
              </h3>
              <UBadge
                variant="soft"
                size="sm"
                class="rounded-md shrink-0"
                :class="getProviderColor(chat.provider)"
              >
                {{ chat.provider }}
              </UBadge>
              <UBadge
                v-if="chat.id === currentSessionId"
                variant="soft"
                size="sm"
                color="emerald"
                class="rounded-md shrink-0"
              >
                Active
              </UBadge>
            </div>

            <!-- Last Message -->
            <p v-if="chat.messages.length > 0" class="text-sm text-fg-muted truncate mb-2">
              {{ chat.messages[chat.messages.length - 1].content.slice(0, 100) }}
            </p>
            <p v-else class="text-sm text-fg-subtle italic mb-2">
              No messages yet
            </p>

            <!-- Metadata -->
            <div class="flex items-center gap-4 text-xs text-fg-subtle">
              <span class="flex items-center gap-1">
                <UIcon name="i-heroicons-clock-16-solid" />
                {{ formatRelativeTime(chat.updatedAt) }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="i-heroicons-chat-bubble-left-16-solid" />
                {{ chat.messages.length }} messages
              </span>
              <span v-if="chat.model" class="flex items-center gap-1 truncate">
                <UIcon name="i-heroicons-cpu-chip-16-solid" />
                {{ chat.model }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="size-8 rounded-lg hover:bg-[var(--glass)] flex items-center justify-center text-fg-subtle hover:text-fg transition-colors"
              title="Rename chat"
              @click.stop="renameChat(chat.id)"
            >
              <UIcon name="i-heroicons-pencil-16-solid" />
            </button>
            <button
              class="size-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-fg-subtle hover:text-red-400 transition-colors"
              title="Delete chat"
              @click.stop="deleteChat(chat.id)"
            >
              <UIcon name="i-heroicons-trash-16-solid" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="panel shadow-soft p-12 text-center"
    >
      <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="text-5xl text-fg-subtle mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-fg mb-2">
        No chats yet
      </h3>
      <p class="text-sm text-fg-muted mb-6">
        Start a conversation to see your chats here
      </p>
      <UButton
        color="emerald"
        size="lg"
        class="rounded-xl"
        icon="i-heroicons-plus-20-solid"
        @click="onNew"
      >
        Start Your First Chat
      </UButton>
    </div>
  </div>

  <UModal v-model="renameState.open" :ui="{ width: 'max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-fg">
            Rename Chat
          </h3>
        </div>
      </template>
      <UFormGroup label="Chat title" :error="renameState.error">
        <UInput
          v-model="renameState.title"
          placeholder="Enter new title"
          autofocus
          @keydown.enter.prevent="submitRename"
        />
      </UFormGroup>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="ghost" @click="cancelRename">
            Cancel
          </UButton>
          <UButton color="emerald" @click="submitRename">
            Save
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <UModal v-model="deleteState.open" :ui="{ width: 'max-w-md' }">
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold text-fg">
          Delete Chat
        </h3>
      </template>
      <p class="text-sm text-fg-muted">
        Are you sure you want to delete <span class="font-medium text-fg">{{ deleteState.title }}</span>? This action
        cannot be undone.
      </p>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="ghost" @click="cancelDelete">
            Cancel
          </UButton>
          <UButton color="red" @click="confirmDelete">
            Delete
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
