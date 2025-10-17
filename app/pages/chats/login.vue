<!-- app/pages/auth/login.vue -->
<script setup lang="ts">
/**
 * Auth/Login page
 * - Keeps UI simple
 * - Delegates network/auth concerns to a small Pinia store (useAuth)
 * - On success: redirect to `route.query.redirect` or "/users"
 */

import { useRoute, useRouter } from '#imports'
import { onMounted, ref } from 'vue'
import { useAuth } from '@/stores/auth' // see store stub below

// Local state (UI only)
const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

// Dependencies
const auth = useAuth()
const router = useRouter()
const route = useRoute()

// Very small email validation (client-side convenience)
const emailRe = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

async function handleLogin() {
  errorMessage.value = ''
  const clean = email.value.trim().toLowerCase()

  if (!clean || !emailRe.test(clean)) {
    errorMessage.value = 'Please enter a valid email.'
    return
  }

  isSubmitting.value = true
  try {
    // Delegate to store → POST /api/v1/auth/login (sets httpOnly cookie)
    await auth.login(clean)

    // Redirect target (defaults to /users for now)
    const redirectTo = String(route.query.redirect || '/users')
    await router.push(redirectTo)
  }
  catch (e: any) {
    errorMessage.value = String(e?.statusMessage || e?.message || 'Login failed')
  }
  finally {
    isSubmitting.value = false
  }
}

// If already logged in, bounce to redirect target
onMounted(async () => {
  // Optional: try to hydrate from cookie
  if (!auth.user) {
    try {
      await auth.me()
    }
    catch {
    }
  }
  if (auth.user) {
    const redirectTo = String(route.query.redirect || '/users')
    router.replace(redirectTo)
  }
})

// SEO / title
useHead({ title: 'Sign in · Nuxt AI Chat' })
</script>

<template>
  <main class="min-h-[80svh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="panel shadow-soft rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="px-6 pt-6">
          <h1 class="text-2xl font-semibold text-fg">
            Sign in
          </h1>
          <p class="text-fg-muted text-sm mt-1">
            Use your email to continue.
          </p>
        </div>

        <!-- Form -->
        <div class="p-6 space-y-4">
          <!-- Nuxt UI inputs if available; fall back to native inputs with theme tokens -->
          <label class="block text-sm text-fg-subtle mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="you@example.com"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
            @keydown.enter.prevent="handleLogin"
          >

          <button
            :disabled="isSubmitting"
            class="chip-accent w-full px-4 py-2 rounded-lg font-medium"
            @click="handleLogin"
          >
            {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
          </button>

          <p v-if="errorMessage" class="text-sm text-red-400">
            {{ errorMessage }}
          </p>

          <p class="text-xs text-fg-subtle">
            By continuing you agree to the terms. We only use your email to identify your chats.
          </p>
        </div>
      </div>

      <!-- Small footer note -->
      <p class="text-center text-xs text-fg-subtle mt-4">
        Don’t have an account? Typing an email will create one on first sign-in.
      </p>
    </div>
  </main>
</template>

<style scoped>
/* Optional subtle animation on focus/hover—keeps within your theme vibe */
</style>
