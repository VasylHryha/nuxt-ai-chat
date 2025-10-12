<script setup lang="ts">
const props = defineProps<{ prompts: string[] }>()
const emit = defineEmits<{ (e: 'pick', value: string): void }>()
</script>

<template>
  <div class="mt-5 flex flex-wrap gap-2">
    <UButton
      v-for="p in prompts"
      :key="p"
      color="neutral"
      variant="soft"
      size="xs"
      class="rounded-full chip-accent text-fg"
      @click="emit('pick', p)"
    >
      {{ p }}
    </UButton>
  </div>
</template>
