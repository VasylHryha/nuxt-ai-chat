<script setup lang="ts">
import { useAiChatSession } from '@/composables/useAiChatSession'

const route = useRoute()
const directory = useChatDirectory()
const toast = useToast()

// Get chatId from route
const initialChatId = route.params.id as string

// Handle legacy /ai-chat/new route (backward compatibility)
if (!initialChatId || initialChatId === 'new') {
  const { createNewChat } = useNewAiChat()
  await createNewChat()
}

// Check if this is a new chat (tracked in store)
const isNewChat = directory.isNewChat(initialChatId)

const { chat, currentChatId, isLoadingChat, chatNotFound, loadError, loadExistingChatById } = useAiChatSession({
  chatId: initialChatId,
})

const input = ref('')

function handleSubmit(e: Event) {
  e.preventDefault()
  const text = input.value.trim()
  if (!text)
    return
  chat.sendMessage({ text })
  input.value = ''
}

async function createNewChat() {
  const { createNewChat } = useNewAiChat()
  await createNewChat()
}

useHead({ title: 'AI Chat · Nuxt AI Chat' })

// Load existing chat only if it's not a new chat
onMounted(async () => {
  if (isNewChat) {
    // It's a new chat, skip DB load
    return
  }

  // Try to load existing chat from DB
  if (!chat.messages.length && currentChatId.value) {
    await loadExistingChatById(currentChatId.value)

    // Show toast if chat not found
    if (chatNotFound.value) {
      toast.add({
        title: 'Chat not found',
        description: 'This chat may have been deleted or the link is incorrect.',
        color: 'error',
      })
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-4 border-b border-[var(--panel-border)]">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/chats"
          class="text-fg-muted hover:text-fg transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" class="text-xl" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-semibold text-fg">
            AI Chat
          </h1>
          <p class="text-sm text-fg-muted">
            {{ isLoadingChat ? 'Loading chat...' : chat.messages.length === 0 ? 'Start a new conversation' : 'Continue conversation' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="chip px-3 py-2 text-sm"
          @click="createNewChat"
        >
          <UIcon name="i-heroicons-plus-20-solid" class="mr-1" />
          New Chat
        </button>
        <UBadge color="emerald" variant="soft" size="md" class="rounded-lg">
          <UIcon name="i-heroicons-sparkles-20-solid" class="mr-1" />
          AI SDK
        </UBadge>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
      <!-- Error States Component -->
      <ChatErrorStates
        v-if="isLoadingChat || chatNotFound || loadError || chat.messages.length === 0"
        :is-loading="isLoadingChat"
        :chat-not-found="chatNotFound"
        :load-error="loadError"
        :is-empty="chat.messages.length === 0"
        :on-retry="() => loadExistingChatById(currentChatId!)"
        :on-create-new="createNewChat"
      />

      <div
        v-for="(m, index) in chat.messages"
        v-else
        :key="m.id || index"
        class="flex items-start gap-3"
        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <!-- Avatar -->
        <div
          v-if="m.role !== 'user'"
          class="size-8 rounded-full bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0"
        >
          <UIcon name="i-heroicons-sparkles-16-solid" class="text-emerald-300 size-4" />
        </div>

        <!-- Message Bubble -->
        <div
          class="panel shadow-soft px-4 py-3 max-w-[80%]"
          :class="m.role === 'user' ? 'bg-emerald-500/10 border-emerald-400/20' : ''"
        >
          <div
            v-for="(part, i) in m.parts"
            :key="`${m.id}-${part.type}-${i}`"
            class="text-fg text-sm leading-relaxed"
          >
            <div v-if="part.type === 'text'">
              {{ part.text }}
            </div>
          </div>
        </div>

        <!-- User Avatar -->
        <div
          v-if="m.role === 'user'"
          class="size-8 rounded-full bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-center shrink-0"
        >
          <UIcon name="i-heroicons-user-16-solid" class="text-fg-subtle size-4" />
        </div>
      </div>
    </div>

    <!-- Input Form -->
    <form
      class="flex items-end gap-2"
      @submit="handleSubmit"
    >
      <div class="flex-1">
        <textarea
          v-model="input"
          placeholder="Type your message..."
          rows="2"
          class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40 resize-none text-fg"
          @keydown.enter.exact.prevent="handleSubmit"
        />
      </div>
      <button
        type="submit"
        class="chip-accent px-5 py-3 rounded-lg font-medium flex items-center gap-2 h-fit"
        :disabled="!input.trim()"
      >
        <UIcon name="i-heroicons-paper-airplane-16-solid" />
        Send
      </button>
    </form>
  </div>
</template>
