<script setup lang="ts">
import { useChatSession } from '@/composables/useChatSession'

const router = useRouter()
const { chat, isSending, errorMessage } = useChatSession({
  type: 'proxy',
  onFirstChatCreated: id => router.replace(`/proxy-chat/${id}`),
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

useHead({ title: 'Proxy Chat · Nuxt AI Chat' })
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
    <div class="flex items-center justify-between mb-4 pb-4 border-b border-[var(--panel-border)]">
      <div class="flex items-center gap-3">
        <NuxtLink to="/chats" class="text-fg-muted hover:text-fg transition-colors">
          <UIcon name="i-heroicons-arrow-left-20-solid" class="text-xl" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-semibold text-fg">
            Proxy Chat
          </h1>
          <p class="text-sm text-fg-muted">
            Start a new proxy conversation
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/proxy-chat/new" class="chip px-3 py-2 text-sm">
          <UIcon name="i-heroicons-plus-20-solid" class="mr-1" /> New Chat
        </NuxtLink>
        <UBadge color="purple" variant="soft" size="md" class="rounded-lg">
          <UIcon name="i-heroicons-sparkles-20-solid" class="mr-1" /> Proxy
        </UBadge>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="errorMessage" class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-400/20 flex items-center gap-2">
      <UIcon name="i-heroicons-exclamation-circle-16-solid" class="text-red-600 size-5 shrink-0" />
      <p class="text-red-600 text-sm">
        {{ errorMessage }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
      <div v-if="chat.messages.length === 0" class="flex items-center justify-center h-full text-center">
        <div class="space-y-2">
          <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="text-4xl text-fg-subtle mx-auto" />
          <p class="text-fg-muted text-sm">
            Start a conversation
          </p>
        </div>
      </div>

      <div
        v-for="(m, index) in chat.messages" :key="m.id || index" class="flex items-start gap-3"
        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          v-if="m.role !== 'user'"
          class="size-8 rounded-full bg-purple-500/15 border border-purple-400/25 flex items-center justify-center shrink-0"
        >
          <UIcon name="i-heroicons-sparkles-16-solid" class="text-purple-300 size-4" />
        </div>
        <div
          class="panel shadow-soft px-4 py-3 max-w-[80%]"
          :class="m.role === 'user' ? 'bg-purple-500/10 border-purple-400/20' : ''"
        >
          <div v-for="(part, i) in m.parts" :key="`${m.id}-${part.type}-${i}`" class="text-fg text-sm leading-relaxed">
            <div v-if="part.type === 'text'">
              {{ part.text }}
            </div>
          </div>
        </div>
        <div v-if="m.role === 'user'" class="size-8 rounded-full bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-user-16-solid" class="text-fg-subtle size-4" />
        </div>
      </div>
    </div>

    <form class="flex items-end gap-2" @submit="handleSubmit">
      <div class="flex-1">
        <textarea
          v-model="input" placeholder="Type your message..." rows="2"
          class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400/40 resize-none text-fg"
          @keydown.enter.exact.prevent="handleSubmit"
        />
      </div>
      <button
        type="submit" class="chip px-5 py-3 rounded-lg font-medium flex items-center gap-2 h-fit"
        :disabled="!input.trim() || isSending"
      >
        <UIcon v-if="isSending" name="i-heroicons-arrow-path-16-solid" class="animate-spin" />
        <UIcon v-else name="i-heroicons-paper-airplane-16-solid" />
        {{ isSending ? 'Sending...' : 'Send' }}
      </button>
    </form>
  </div>
</template>
