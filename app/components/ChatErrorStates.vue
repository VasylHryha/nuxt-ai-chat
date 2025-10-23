<script setup lang="ts">
interface Props {
  isLoading?: boolean
  chatNotFound?: boolean
  loadError?: string | null
  isEmpty?: boolean
  onRetry?: () => void
  onCreateNew?: () => void
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  chatNotFound: false,
  loadError: null,
  isEmpty: false,
})
</script>

<template>
  <!-- Loading State -->
  <div
    v-if="isLoading"
    class="flex items-center justify-center h-full text-center"
  >
    <div class="space-y-2">
      <UIcon name="i-heroicons-arrow-path-20-solid" class="text-4xl text-fg-muted animate-spin mx-auto" />
      <p class="text-fg-muted text-sm">
        Loading chat...
      </p>
    </div>
  </div>

  <!-- Chat Not Found Error (404) -->
  <div
    v-else-if="chatNotFound"
    class="flex items-center justify-center h-full text-center"
  >
    <div class="space-y-4 max-w-md">
      <UIcon name="i-heroicons-exclamation-circle-20-solid" class="text-5xl text-amber-400 mx-auto" />
      <h2 class="text-xl font-semibold text-fg">
        Chat Not Found
      </h2>
      <p class="text-fg-muted text-sm">
        This chat doesn't exist. It may have been deleted, or the link is incorrect.
      </p>
      <div class="flex gap-3 justify-center pt-2">
        <button
          v-if="onCreateNew"
          class="chip-accent px-4 py-2 rounded-lg"
          @click="onCreateNew"
        >
          <UIcon name="i-heroicons-plus-20-solid" class="mr-1" />
          Create New Chat
        </button>
        <NuxtLink to="/chats" class="chip px-4 py-2 rounded-lg">
          <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="mr-1" />
          Go to Chats
        </NuxtLink>
      </div>
    </div>
  </div>

  <!-- General Load Error -->
  <div
    v-else-if="loadError"
    class="flex items-center justify-center h-full text-center"
  >
    <div class="space-y-4 max-w-md">
      <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="text-5xl text-red-400 mx-auto" />
      <h2 class="text-xl font-semibold text-fg">
        Failed to Load Chat
      </h2>
      <p class="text-fg-muted text-sm">
        {{ loadError }}
      </p>
      <div class="flex gap-3 justify-center pt-2">
        <button
          v-if="onRetry"
          class="chip-accent px-4 py-2 rounded-lg"
          @click="onRetry"
        >
          <UIcon name="i-heroicons-arrow-path-20-solid" class="mr-1" />
          Retry
        </button>
        <NuxtLink to="/chats" class="chip px-4 py-2 rounded-lg">
          Go to Chats
        </NuxtLink>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div
    v-else-if="isEmpty"
    class="flex items-center justify-center h-full text-center"
  >
    <div class="space-y-2">
      <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="text-4xl text-fg-subtle mx-auto" />
      <p class="text-fg-muted text-sm">
        Start a conversation
      </p>
    </div>
  </div>
</template>
