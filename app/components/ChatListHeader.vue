<script setup lang="ts">
import type { ChatDateFilterValue, ChatProviderFilterValue } from '@/constants/chats'
import { CHAT_DATE_FILTERS, CHAT_PROVIDER_FILTERS } from '@/constants/chats'

interface FilterValues {
  search: string
  provider: ChatProviderFilterValue
  dateRange: ChatDateFilterValue
}

const modelValue = defineModel<FilterValues>({ required: true })

const providerOptions = CHAT_PROVIDER_FILTERS
const dateOptions = CHAT_DATE_FILTERS
</script>

<template>
  <div class="space-y-4">
    <!-- Title Row -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-fg">
          My Chats
        </h1>
        <p class="text-sm text-fg-muted mt-1">
          Browse and manage your conversations
        </p>
      </div>
      <NuxtLink
        to="/ai-chat/new"
        class="chip-accent px-4 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <UIcon name="i-heroicons-plus-20-solid" />
        New Chat
      </NuxtLink>
    </div>

    <!-- Filters Row -->
    <div class="panel p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 sm:min-w-[250px]">
          <UInput
            v-model="modelValue.search"
            placeholder="Search by title or message..."
            icon="i-heroicons-magnifying-glass-20-solid"
            class="w-full"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex gap-3 sm:flex-shrink-0">
          <!-- Provider Filter -->
          <USelect
            v-model="modelValue.provider"
            :items="providerOptions"
            class="w-full sm:w-48"
            aria-label="Filter by provider"
          />

          <!-- Date Filter -->
          <USelect
            v-model="modelValue.dateRange"
            :items="dateOptions"
            class="w-full sm:w-44"
            aria-label="Filter by date"
          />
        </div>
      </div>
    </div>
  </div>
</template>
