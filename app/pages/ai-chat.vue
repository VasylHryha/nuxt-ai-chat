<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'

const input = ref('')
const chat = new Chat({})

function handleSubmit(e: Event) {
  e.preventDefault()
  if (!input.value.trim())
    return
  chat.sendMessage({ text: input.value })
  input.value = ''
}

useHead({ title: 'AI Chat · Nuxt AI Chat' })
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-4 border-b border-[var(--panel-border)]">
      <div>
        <h1 class="text-2xl font-semibold text-fg">
          AI Chat
        </h1>
        <p class="text-sm text-fg-muted">
          Chat with AI using Vercel AI SDK
        </p>
      </div>
      <UBadge color="emerald" variant="soft" size="md" class="rounded-lg">
        <UIcon name="i-heroicons-sparkles-20-solid" class="mr-1" />
        AI SDK
      </UBadge>
    </div>

    <!-- Messages Container -->
    <div class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
      <div
        v-if="chat.messages.length === 0"
        class="flex items-center justify-center h-full text-center"
      >
        <div class="space-y-2">
          <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="text-4xl text-fg-subtle mx-auto" />
          <p class="text-fg-muted text-sm">
            Start a conversation
          </p>
        </div>
      </div>

      <div
        v-for="(m, index) in chat.messages"
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
