<!-- pages/chats/index.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useChatSessions } from '@/stores/chat.sessions'

const sessions = useChatSessions()
const { currentProfile, currentProfileId } = storeToRefs(sessions)

function onNew() {
  sessions.createNewSession('New chat', 'openrouter', 'deepseek/deepseek-r1')
}
function openChat(id: string) {
  sessions.openSession(id)
  navigateTo('/deep-seek')
}
function renameChat(id: string) {
  const title = prompt('Rename chat to?')
  if (title)
    sessions.renameSession(id, title)
}
function deleteChat(id: string) {
  if (confirm('Delete this chat?'))
    sessions.deleteSession(id)
}
</script>

<template>
  <main class="container-app py-10">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        Chats
      </h1>
      <UButton color="primary" @click="onNew">
        New chat
      </UButton>
    </div>

    <div v-if="!currentProfile" class="text-sm text-fg-muted">
      No profile yet.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="s in sessions.listSessions(currentProfileId)"
        :key="s.id"
        class="flex items-center justify-between rounded-xl border border-white/10 bg-[color:var(--panel)] p-3"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ s.title }}
          </p>
          <p class="text-xs text-fg-subtle">
            {{ new Date(s.updatedAt).toLocaleString() }} · {{ s.messages.length }} messages
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton size="xs" variant="soft" @click="openChat(s.id)">
            Open
          </UButton>
          <UButton size="xs" variant="ghost" @click="renameChat(s.id)">
            Rename
          </UButton>
          <UButton size="xs" color="rose" variant="soft" @click="deleteChat(s.id)">
            Delete
          </UButton>
        </div>
      </li>
    </ul>
  </main>
</template>
