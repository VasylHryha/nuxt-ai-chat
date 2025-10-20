<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/stores/auth'

const year = new Date().getFullYear()
const auth = useAuth()
const { user, isLoading } = storeToRefs(auth)
const route = useRoute()

// All navigation items (some require auth)
const allItems = ref<Readonly<NavigationMenuItem[]>>([
  {
    label: 'Home',
    icon: 'i-heroicons-home-20-solid',
    to: '/',
  },
  {
    label: 'AI Chat',
    icon: 'i-heroicons-sparkles-20-solid',
    to: '/ai-chat/new',
    requireAuth: true,
  },
  {
    label: 'Chats',
    icon: 'i-heroicons-chat-bubble-left-right-20-solid',
    to: '/chats',
    requireAuth: true,
  },
  {
    label: 'Users',
    icon: 'i-heroicons-users-20-solid',
    to: '/users',
    requireAuth: true,
  },
])

// Filter navigation based on auth state
const items = computed(() => {
  if (!user.value) {
    // Show only public items when not authenticated
    return allItems.value.filter(item => !item.requireAuth)
  }
  return allItems.value
})

async function handleLogout() {
  await auth.logout()
  navigateTo('/chats/login')
}
</script>

<template>
  <div class="min-h-dvh flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--glass)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div class="container-app flex items-center gap-4 py-3">
        <!-- Logo -->
        <div class="size-9 grid place-items-center rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
          <UIcon name="i-heroicons-sparkles-20-solid" class="size-5" />
        </div>

        <!-- Brand -->
        <NuxtLink to="/" class="flex min-w-0 flex-col hover:opacity-80 transition-opacity">
          <h1 class="text-base font-semibold tracking-wide leading-none text-fg">
            Nuxt AI Chat
          </h1>
          <p class="text-xs text-fg-subtle truncate">
            Multi-Provider AI Starter
          </p>
        </NuxtLink>

        <!-- Right side -->
        <div class="ms-auto flex items-center gap-2">
          <!-- Navigation -->
          <UNavigationMenu
            :items="items"
            highlight
            :ui="{
              base: 'hidden md:flex', /* hide on small screens; show from md */
              item: 'rounded-lg',
              link: 'rounded-lg px-3 py-2 text-fg-subtle hover:text-fg data-[state=active]:text-fg',
              content: 'min-w-56 border border-white/10 bg-[color:var(--glass)]/95 backdrop-blur rounded-xl',
            }"
          >
            <!-- optional leading icon in link -->
            <template #item-leading="{ item }">
              <UIcon v-if="item.icon" :name="item.icon" class="me-1.5 text-fg-subtle" />
            </template>
          </UNavigationMenu>

          <!-- Compact menu for small screens -->
          <UDropdownMenu
            class="md:hidden"
            :items="[items]"
            :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
            :ui="{ content: 'min-w-56 border border-white/10 bg-[color:var(--glass)]/95 backdrop-blur rounded-xl' }"
          >
            <UButton
              icon="i-lucide-menu"
              color="neutral"
              variant="soft"
              class="rounded-xl"
              aria-label="Open menu"
            />
          </UDropdownMenu>

          <!-- User info & logout (when authenticated) -->
          <div v-if="user" class="flex items-center gap-2">
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--glass)] border border-[var(--panel-border)]">
              <UIcon name="i-heroicons-user-circle-16-solid" class="text-fg-subtle" />
              <span class="text-sm text-fg-muted">{{ user.email }}</span>
            </div>
            <UButton
              icon="i-heroicons-arrow-right-on-rectangle-16-solid"
              color="neutral"
              variant="ghost"
              class="rounded-xl"
              title="Logout"
              :disabled="isLoading"
              @click="handleLogout"
            >
              <span class="hidden sm:inline">Logout</span>
            </UButton>
          </div>

          <!-- Login button (when not authenticated) -->
          <UButton
            v-else-if="route.path !== '/chats/login'"
            to="/chats/login"
            color="emerald"
            variant="soft"
            class="rounded-xl"
            icon="i-heroicons-arrow-right-on-rectangle-16-solid"
          >
            Login
          </UButton>

          <!-- Theme switcher -->
          <UColorModeButton class="rounded-xl" />
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1">
      <div class="container-app py-6">
        <div class="panel shadow-soft p-3 sm:p-4 lg:p-6 transition-[background,transform]">
          <slot />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/10 bg-[color:var(--glass)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div class="container-app py-4 text-xs text-fg-subtle flex items-center justify-between">
        <span>© {{ year }} Nuxt AI Chat</span>
        <span class="flex items-center gap-2">
          <UIcon name="i-heroicons-code-bracket-20-solid" class="size-4" />
          Built with Nuxt UI + Tailwind v4
        </span>
      </div>
    </footer>
  </div>
</template>
