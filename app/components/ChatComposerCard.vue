<script setup lang="ts">
defineProps<{ disabled: boolean, placeholder: string, error?: string }>()
const emit = defineEmits<{ (e: 'send', value: string): void }>()
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-[color:var(--panel)] backdrop-blur p-4 sm:p-5 space-y-3">
    <ChatComposer :disabled="disabled" :placeholder="placeholder" @send="v => emit('send', v)" />

    <div class="flex items-center justify-between text-xs">
      <p v-if="error" class="text-rose-300">
        {{ error }}
      </p>
      <p v-else class="text-fg-subtle">
        Tip: press <kbd class="rounded bg-white/10 px-1.5 py-0.5">Enter</kbd> to send,
        <kbd class="rounded bg-white/10 px-1.5 py-0.5">Shift</kbd>+<kbd class="rounded bg-white/10 px-1.5 py-0.5">Enter</kbd> for a new line.
      </p>

      <div class="hidden sm:flex items-center gap-2 text-fg-subtle">
        <UIcon name="i-heroicons-shield-check-20-solid" class="text-accent" />
        Proxied via <code class="text-fg">/api/v1/openrouter/chat</code>
      </div>
    </div>
  </div>
</template>
