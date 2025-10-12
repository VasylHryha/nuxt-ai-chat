<script setup lang="ts">
defineProps<{ cappedByCount?: boolean, cappedByChars?: boolean }>()
const emit = defineEmits<{ (e: 'new'): void }>()
</script>

<template>
  <div v-if="cappedByCount || cappedByChars" class="mt-4">
    <UAlert
      title="This chat is capped"
      :description="cappedByCount ? 'You reached 50 messages.' : 'You reached 100k characters.'"
      color="amber"
      variant="soft"
      icon="i-heroicons-exclamation-triangle-20-solid"
      class="border border-amber-400/30 bg-amber-400/10 rounded-xl"
    >
      <template #actions>
        <UButton color="primary" variant="solid" size="xs" class="rounded-lg" @click="emit('new')">
          Start new chat
        </UButton>
      </template>
    </UAlert>
  </div>
</template>
