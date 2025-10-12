<script setup lang="ts">
/* wrapper over the composer we wrote earlier */
import ChatInput from '~/components/ChatInput.vue'

const props = defineProps<{ disabled?: boolean, placeholder?: string }>()
const emit = defineEmits<{ (e: 'send', text: string): void }>()
</script>

<template>
  <ChatInput
    :disabled="props.disabled"
    :placeholder="props.placeholder"
    @send="(t) => emit('send', t)"
  />
</template>
