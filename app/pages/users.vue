<!-- app/pages/users.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUsersStore } from '@/stores/users'

const usersStore = useUsersStore()

const newEmail = ref('')
const newName = ref('')
const errorMessage = computed(() => usersStore.errorMessage)
const isLoading = computed(() => usersStore.isLoading)
const isSubmitting = computed(() => usersStore.isSubmitting)
const users = computed(() => usersStore.list)
const hasUsers = computed(() => users.value.length > 0)

async function reload() {
  await usersStore.fetchAll() // hard refresh ignores TTL
}

async function addUser() {
  try {
    await usersStore.addUser(newEmail.value, newName.value)
    newEmail.value = ''
    newName.value = ''
  }
  catch {
    // errorMessage is already populated by the store
  }
}

onMounted(() => usersStore.ensure()) // SWR: only calls API if stale/empty
</script>

<template>
  <main class="container-app py-8 space-y-6">
    <header class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-fg">
          Users
        </h1>
        <p class="text-sm text-fg-muted">
          Preview all users and add a new one.
        </p>
      </div>
      <button
        class="chip-accent px-3 py-2 rounded-lg text-sm"
        :disabled="isLoading"
        title="Reload"
        @click="reload"
      >
        {{ isLoading ? 'Loading…' : 'Reload' }}
      </button>
    </header>

    <!-- Add user -->
    <section class="panel shadow-soft p-4 sm:p-6 space-y-4">
      <h2 class="text-lg font-medium text-fg">
        Add user
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm text-fg-subtle mb-1">Email</label>
          <input
            v-model="newEmail"
            type="email"
            placeholder="you@example.com"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
          >
        </div>
        <div>
          <label class="block text-sm text-fg-subtle mb-1">Name (optional)</label>
          <input
            v-model="newName"
            type="text"
            placeholder="Jane Doe"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
          >
        </div>
        <div class="flex items-end">
          <button
            class="chip-accent w-full md:w-auto px-4 py-2 rounded-lg font-medium"
            :disabled="isSubmitting"
            @click="addUser"
          >
            {{ isSubmitting ? 'Adding…' : 'Add user' }}
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-400">
        {{ errorMessage }}
      </p>
    </section>

    <!-- Users table -->
    <section class="panel shadow-soft overflow-hidden">
      <div class="px-4 sm:px-6 py-3 border-b border-[var(--panel-border)] flex items-center justify-between">
        <h3 class="text-base font-medium text-fg">
          All users
        </h3>
        <span class="text-xs badge-accent px-2 py-1 rounded-full">{{ users.length }} total</span>
      </div>

      <div v-if="!hasUsers && !isLoading" class="p-6 text-fg-muted">
        No users yet. Add one above.
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[color-mix(in_oklab,var(--panel)_85%,transparent)] border-b border-[var(--panel-border)]">
            <tr class="text-left">
              <th class="px-4 sm:px-6 py-3 font-semibold">
                Email
              </th>
              <th class="px-4 sm:px-6 py-3 font-semibold">
                Name
              </th>
              <th class="px-4 sm:px-6 py-3 font-semibold">
                Created
              </th>
              <th class="px-4 sm:px-6 py-3 font-semibold">
                ID
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users"
              :key="u.id"
              class="border-b border-[color-mix(in_oklab,var(--panel-border)_65%,transparent)] hover:bg-[color-mix(in_oklab,var(--panel)_75%,transparent)]/60 transition-colors"
            >
              <td class="px-4 sm:px-6 py-3 align-middle">
                <span class="text-fg">{{ u.email }}</span>
              </td>
              <td class="px-4 sm:px-6 py-3 align-middle text-fg-muted">
                {{ u.name || '—' }}
              </td>
              <td class="px-4 sm:px-6 py-3 align-middle text-fg-muted">
                {{ new Date(u.createdAt).toLocaleString() }}
              </td>
              <td class="px-4 sm:px-6 py-3 align-middle text-fg-subtle font-mono text-xs">
                {{ u.id }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
