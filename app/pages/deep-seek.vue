<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useChatRuntime } from '@/stores/chat.runtime'
import { useChatSessions } from '@/stores/chat.sessions'

const sessions = useChatSessions()
const runtime = useChatRuntime()
runtime.configureRuntime({ provider: 'openrouter', label: 'DeepSeek via OpenRouter' })

const { messages, current } = storeToRefs(sessions)
const { isSending, errorMessage, canSend, displayName } = storeToRefs(runtime)

const quickPrompts = [
  'Summarise the latest research on retrieval-augmented generation.',
  'Draft a customer support reply that sounds empathetic but concise.',
  'Explain how Nuxt server routes can proxy external APIs securely.',
]

function handlePrompt(p: string) {
  runtime.sendUserMessage(p)
}

function handleSend(t: string) {
  runtime.sendUserMessage(t)
}

function handleReset() {
  sessions.resetCurrentSession()
}

function handleNewChat() {
  sessions.createNewSession('DeepSeek via OpenRouter', 'openrouter', 'deepseek/deepseek-r1')
}
</script>

<template>
  <main class="relative min-h-screen">
    <div
      class="pointer-events-none absolute inset-x-0 top-[-18rem] z-0 h-[32rem]
                bg-gradient-to-br from-emerald-600/30 via-[color:var(--bg-center)]/30 to-transparent blur-3xl"
    />

    <div class="relative z-10 container-app py-10 sm:py-12 lg:py-14">
      <div class="mx-auto max-w-6xl space-y-8 sm:space-y-10">
        <ChatHeaderCard :display-name="displayName" :is-sending="isSending" @reset="handleReset" @new="handleNewChat">
          <ChatQuickPrompts :prompts="quickPrompts" @pick="handlePrompt" />
          <ChatCapsAlert
            :capped-by-count="current?.cappedByCount"
            :capped-by-chars="current?.cappedByChars"
            @new="handleNewChat"
          />
        </ChatHeaderCard>

        <section class="grid gap-8">
          <ChatTranscriptCard :title="displayName" :is-sending="isSending" :messages="messages" />
          <ChatComposerCard
            :disabled="!canSend"
            :placeholder="(current?.cappedByCount || current?.cappedByChars)
              ? 'This chat is capped — start a new chat to continue.'
              : 'Ask the DeepSeek model…'"
            :error="errorMessage"
            @send="handleSend"
          />
        </section>

        <div class="flex justify-center">
          <UButton to="/" variant="ghost" color="neutral" class="rounded-xl">
            ← Back to home
          </UButton>
        </div>
      </div>
    </div>
  </main>
</template>
