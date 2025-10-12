<script setup lang="ts">
defineProps<{
  displayName: string
  isSending: boolean
}>()
const emit = defineEmits<{
  (e: 'reset'): void
  (e: 'new'): void
}>()
</script>

<template>
  <section
    class="rounded-2xl border border-white/10 bg-[color:var(--glass)]/90 p-5 sm:p-7 lg:p-8 backdrop-blur
           shadow-[0_1px_0_0_rgba(255,255,255,.03)_inset,0_6px_18px_rgba(0,0,0,.25)]"
  >
    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-3">
        <UBadge color="neutral" variant="soft" size="sm" class="badge-accent uppercase tracking-wide rounded-md text-fg">
          {{ displayName }}
        </UBadge>

        <div class="space-y-2">
          <h1 class="text-3xl font-semibold text-fg md:text-4xl">
            DeepSeek reasoning chat
          </h1>
          <p class="max-w-2xl text-sm leading-relaxed text-fg-muted md:text-base">
            Conversations run through the Nuxt
            <code class="text-fg">/api/v1/openrouter/chat</code>
            endpoint, so your OpenRouter credentials stay server-side. Swap the provider slug to reuse this view for any model.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          class="rounded-xl"
          :disabled="isSending"
          @click="emit('reset')"
        >
          <template #leading>
            <UIcon name="i-heroicons-arrow-path-20-solid" class="text-accent" />
          </template>
          Reset session
        </UButton>

        <UButton color="primary" variant="solid" size="sm" class="rounded-xl" @click="emit('new')">
          <template #leading>
            <UIcon name="i-heroicons-plus-circle-20-solid" />
          </template>
          New chat
        </UButton>
      </div>
    </div>

    <slot />
  </section>
</template>
