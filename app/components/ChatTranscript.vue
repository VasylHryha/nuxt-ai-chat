<script setup lang="ts">
import type { ChatMessage } from '~/types'
import MessageList from '~/components/MessageList.vue'

defineProps<{ messages: ChatMessage[], reasoning?: string | null }>()
</script>

<template>
  <MessageList :messages="messages" :reasoning="reasoning" />
</template>
