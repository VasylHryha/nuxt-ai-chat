<script setup lang="ts">
import type { ChatMessage } from '~/types'

defineProps<{ title: string, isSending: boolean, messages: ChatMessage[] }>()
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-[color:var(--panel)] backdrop-blur-lg overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 sm:px-5 border-b border-white/10 text-sm text-fg-muted">
      <span class="flex items-center gap-2">
        <UIcon name="i-heroicons-cpu-chip-20-solid" class="text-accent" />
        Active model: <span class="font-medium text-fg">&nbsp;{{ title }}</span>
      </span>
      <span v-if="isSending" class="flex items-center gap-2 text-fg-muted">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin text-accent" />
        Awaiting response…
      </span>
    </div>

    <div class="h-[56vh] sm:h-[60vh] lg:h-[62vh] overflow-y-auto pr-1">
      <ChatTranscript :messages="messages" />
    </div>
  </div>
</template>
