<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const year = new Date().getFullYear()

const items = ref<NavigationMenuItem[]>([
  {
    label: 'DeepSeek via OpenRouter',
    icon: 'i-heroicons-sparkles-20-solid',
    to: '/deep-seek',
  },
  {
    label: 'OpenRouter',
    icon: 'i-heroicons-arrow-top-right-on-square-20-solid',
    to: 'https://openrouter.ai',
    target: '_blank',
    rel: 'noopener',
  },
])
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
        <div class="flex min-w-0 flex-col">
          <h1 class="text-base font-semibold tracking-wide leading-none text-fg">
            Nuxt AI Chat
          </h1>
          <p class="text-xs text-fg-subtle truncate">
            OpenRouter / DeepSeek demo
          </p>
        </div>

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
