<script setup lang="ts">
import type { ChatListItem } from '@/types'
import { getProviderColor } from '@/constants/chats'
import { getChatRouteFor } from '@/services/providers/routing'
import { formatRelativeTime } from '@/utils/datetime'

interface DeletePayload {
  id: string
  title: string
}

const props = defineProps<{
  chat: ChatListItem
}>()

const emit = defineEmits<{
  (e: 'delete', payload: DeletePayload): void
}>()

const chatLink = computed(() =>
  getChatRouteFor(props.chat.provider, props.chat.model, props.chat.id, props.chat.ui),
)

const updatedAtDisplay = computed(() => formatRelativeTime(props.chat.updatedAt))

const providerColor = computed(() => getProviderColor(props.chat.provider))

const lastMessageLabel = computed(() => {
  if (!props.chat.lastMessage)
    return ''

  return props.chat.lastMessage.role === 'user' ? 'You:' : 'AI:'
})

const dropdownItems = [
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: () => {
        emit('delete', { id: props.chat.id, title: props.chat.title })
      },
    },
  ],
]
</script>

<template>
  <div class="panel p-4 hover:shadow-md transition-all duration-200 group relative">
    <div class="flex items-start justify-between gap-3">
      <!-- Main Content -->
      <NuxtLink :to="chatLink" class="flex-1 min-w-0 block hover:no-underline">
        <div class="space-y-2.5">
          <!-- Title and Timestamp Row -->
          <div class="flex items-center justify-between gap-2 min-w-0">
            <h3 class="text-lg font-semibold text-fg truncate group-hover:text-emerald-400 transition-colors">
              {{ chat.title }}
            </h3>
            <span class="text-xs text-fg-muted whitespace-nowrap flex-shrink-0">
              {{ updatedAtDisplay }}
            </span>
          </div>

          <!-- Metadata Row -->
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge :color="providerColor" variant="soft" size="sm">
              {{ chat.provider }}
            </UBadge>
            <span class="text-xs text-fg-muted">
              {{ chat.model }}
            </span>
            <span class="text-xs text-fg-subtle">
              • {{ chat.messageCount }} {{ chat.messageCount === 1 ? 'message' : 'messages' }}
            </span>
          </div>

          <!-- Last Message Preview -->
          <div class="min-h-[1.5rem]">
            <p v-if="chat.lastMessage" class="text-sm text-fg-muted line-clamp-2">
              <span class="font-medium">{{ lastMessageLabel }}</span>
              {{ chat.lastMessage.content }}
            </p>
            <p v-else class="text-sm text-fg-subtle italic">
              No messages yet
            </p>
          </div>
        </div>
      </NuxtLink>

      <!-- Menu Button - Fixed Width Space (20px) -->
      <UDropdownMenu :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
        <UButton
          icon="i-heroicons-ellipsis-vertical-20-solid"
          color="gray"
          variant="ghost"
          size="xs"
          :ui="{ base: 'h-6 px-1' }"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
