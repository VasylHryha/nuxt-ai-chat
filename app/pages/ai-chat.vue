<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'

const input = ref('')
const chat = new Chat({})

function handleSubmit(e: Event) {
  e.preventDefault()
  chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <div>
    <div v-for="(m, index) in chat.messages" :key="m.id ? m.id : index">
      {{ m.role === "user" ? "User: " : "AI: " }}
      <div
        v-for="(part, i) in m.parts"
        :key="`${m.id}-${part.type}-${i}`"
      >
        <div v-if="part.type === 'text'">
          {{ part.text }}
        </div>
      </div>
    </div>

    <form @submit="handleSubmit">
      <input v-model="input" placeholder="Say something...">
    </form>
  </div>
</template>
