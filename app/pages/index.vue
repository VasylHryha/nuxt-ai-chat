<script setup lang="ts">
const highlights = [
  {
    title: 'DeepSeek via OpenRouter',
    description:
        'Proxy the DeepSeek reasoning model through a Nuxt server endpoint that keeps credentials private.',
    icon: 'i-heroicons-sparkles-20-solid',
  },
  {
    title: 'Composable chat building blocks',
    description:
        'Reusable store, transcript, and composer components make it easy to plug in different providers.',
    icon: 'i-heroicons-command-line-20-solid',
  },
  {
    title: 'Nuxt UI + Tailwind styling',
    description:
        'Accessible design primitives paired with Tailwind utility classes for rapid iteration.',
    icon: 'i-heroicons-swatch-20-solid',
  },
]
</script>

<template>
  <div class="relative isolate">
    <!-- Soft gradient wash using tokens -->
    <div
      class="pointer-events-none absolute inset-x-0 top-[-14rem] z-0 h-[28rem]
             bg-gradient-to-b from-emerald-600/30 via-[color:var(--bg-center)]/40 to-transparent blur-3xl"
    />

    <section class="relative z-10 grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
      <!-- Left: copy & actions -->
      <div class="space-y-8">
        <UBadge color="emerald" variant="soft" size="md" class="rounded-lg">
          Nuxt 4 + AI
        </UBadge>

        <h1 class="text-4xl font-semibold leading-tight text-fg md:text-5xl">
          Build AI chat experiences faster with a Nuxt&nbsp;4 starter.
        </h1>

        <p class="max-w-xl text-base leading-relaxed text-fg-muted md:text-lg">
          This playground demonstrates how to pair Nuxt UI, Tailwind, and a secure OpenRouter proxy to deliver AI chat flows
          without exposing API keys. Explore the DeepSeek demo or adapt the components to plug in another model.
        </p>

        <div class="flex flex-wrap items-center gap-4">
          <UButton
            to="/ai-chat"
            color="emerald"
            size="lg"
            class="rounded-xl shadow-lg shadow-emerald-500/20"
          >
            Start Chatting
          </UButton>

          <UButton
            to="/users"
            variant="ghost"
            size="lg"
            color="neutral"
            class="rounded-xl"
          >
            Manage Users
          </UButton>

          <UButton
            to="https://github.com/anthropics/claude-code"
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="lg"
            color="neutral"
            class="rounded-xl"
            icon="i-heroicons-arrow-top-right-on-square-20-solid"
          >
            Docs
          </UButton>
        </div>
      </div>

      <!-- Right: quick preview card using panel recipe -->
      <div class="rounded-xl border border-white/10 bg-[color:var(--panel)] backdrop-blur p-0.5">
        <div class="rounded-[0.7rem] border border-white/10 bg-[color:var(--glass)] p-5">
          <header class="space-y-2">
            <p class="text-xs uppercase tracking-wide text-emerald-300/80">
              Quick preview
            </p>
            <h2 class="text-2xl font-semibold text-fg">
              Chat lifecycle
            </h2>
            <p class="text-sm leading-relaxed text-fg-muted">
              Pinia keeps the conversation history in sync while the Nuxt server handles provider requests.
            </p>
          </header>

          <ul class="mt-5 space-y-4 text-sm text-fg">
            <li class="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="mt-1 text-emerald-300" />
              <div>
                <p class="font-medium text-fg">
                  Conversational memory
                </p>
                <p class="text-fg-subtle">
                  Messages persist in Pinia so the transcript, reasoning trail, and status UI stay consistent across views.
                </p>
              </div>
            </li>
            <li class="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <UIcon name="i-heroicons-cloud-arrow-up" class="mt-1 text-emerald-300" />
              <div>
                <p class="font-medium text-fg">
                  Secure proxy
                </p>
                <p class="text-fg-subtle">
                  The <code class="text-fg">/api/chat</code> endpoint bridges OpenRouter requests, keeping API keys out of the browser.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Highlights -->
    <section class="mt-16 space-y-8">
      <h2 class="text-2xl font-semibold text-fg">
        Why this starter?
      </h2>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="highlight in highlights"
          :key="highlight.title"
          class="border border-white/10 bg-[color:var(--glass)]"
        >
          <div class="flex items-start gap-3">
            <UIcon :name="highlight.icon" class="text-xl text-emerald-300" />
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-fg">
                {{ highlight.title }}
              </h3>
              <p class="text-sm leading-relaxed text-fg-muted">
                {{ highlight.description }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </section>
  </div>
</template>

<style scoped>
:host, .isolate { display: block; }
</style>
