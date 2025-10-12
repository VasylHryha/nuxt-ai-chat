<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<(e: 'send', text: string) => void>()

const draft = ref('')

const canSubmit = computed(() => !props.disabled && draft.value.trim().length > 0)

function submit() {
  const text = draft.value.trim()
  if (!text || props.disabled)
    return
  emit('send', text)
  draft.value = ''
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter')
    return
  if (event.shiftKey)
    return // allow manual line breaks
  event.preventDefault()
  submit()
}
</script>

<template>
  <form class="flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="submit">
    <UTextarea
      v-model="draft"
      :disabled="disabled"
      :placeholder="placeholder || 'Type your message…'"
      autoresize
      min-rows="2"
      size="lg"
      class="w-full panel !border-white/10 bg-white/5 text-slate-100 shadow-inner"
      @keydown="onKeydown"
    />
    <UButton
      type="submit"
      color="emerald"
      size="lg"
      class="sm:self-end"
      :disabled="!canSubmit"
      :loading="disabled"
      icon="i-heroicons-paper-airplane-20-solid"
      label="Send"
    />
  </form>
</template>
