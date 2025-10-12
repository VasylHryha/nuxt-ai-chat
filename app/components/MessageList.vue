<script setup lang="ts">
import type { ChatMessage } from '~/types'

defineProps<{
  messages: ChatMessage[]
  reasoning?: string | null
}>()
</script>

<template>
  <div class="flex flex-col gap-5">
    <TransitionGroup name="chat-message" tag="div" class="flex flex-col gap-4">
      <article
        v-for="(message, index) in messages"
        :key="`${index}-${message.role}`"
        class="flex gap-3"
        :class="message.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
      >
        <!-- Bubble -->
        <div
          class="max-w-[min(42rem,calc(100%-4rem))] px-5 py-4 text-sm leading-relaxed shadow-lg shadow-black/10 border rounded-3xl"
          :class="message.role === 'user'
            ? 'chip-accent text-fg'
            : 'border-[color:var(--panel-border)] bg-[color:var(--panel)] text-fg backdrop-blur-sm'"
        >
          <p class="whitespace-pre-wrap text-fg">
            {{ message.content }}
          </p>
        </div>
      </article>
    </TransitionGroup>

    <!-- Reasoning panel -->
    <UAlert
      v-if="reasoning"
      icon="i-heroicons-light-bulb-20-solid"
      color="amber"
      variant="soft"
      title="Reasoning trace"
      class="text-fg"
    >
      <pre class="whitespace-pre-wrap text-sm leading-relaxed font-mono text-fg">{{ reasoning }}</pre>
    </UAlert>
  </div>
</template>

<style scoped>
.chat-message-enter-active,
.chat-message-leave-active { transition: all .18s ease; }
.chat-message-enter-from,
.chat-message-leave-to { opacity: 0; transform: translateY(6px); }
</style>
