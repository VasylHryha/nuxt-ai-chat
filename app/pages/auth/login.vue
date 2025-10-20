<!-- app/pages/auth/login.vue -->
<script setup lang="ts">
import { useRoute, useRouter } from '#imports'
import { onMounted, ref } from 'vue'
import { useAuth } from '@/stores/auth'

definePageMeta({ layout: 'default' })
useHead({ title: 'Sign in · Nuxt AI Chat' })

const email = ref('')
const password = ref('')
const show = ref(false) // show/hide password
const isSubmitting = ref(false)
const errorMessage = ref('')

const auth = useAuth()
const router = useRouter()
const route = useRoute()

const emailRe = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

async function handleLogin() {
  errorMessage.value = ''
  const clean = email.value.trim().toLowerCase()
  if (!clean || !emailRe.test(clean)) {
    errorMessage.value = 'Please enter a valid email.'
    return
  }
  if (!password.value) {
    errorMessage.value = 'Please enter your password.'
    return
  }

  isSubmitting.value = true
  try {
    await auth.login(clean, password.value)
    const redirectTo = String(route.query.redirect || '/users')
    await router.push(redirectTo)
  }
  catch (e: any) {
    errorMessage.value = String(e?.statusMessage || e?.message || 'Invalid email or password')
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (!auth.user) {
    try {
      await auth.me()
    }
    catch {
    }
  }
  if (auth.user) {
    const to = String(route.query.redirect || '/users')
    router.replace(to)
  }
})
</script>

<template>
  <main class="min-h-[80svh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="panel shadow-soft rounded-2xl overflow-hidden">
        <div class="px-6 pt-6">
          <h1 class="text-2xl font-semibold text-fg">
            Sign in
          </h1>
          <p class="text-fg-muted text-sm mt-1">
            Enter your email and password.
          </p>
        </div>

        <div class="p-6 space-y-4">
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

          <label class="block text-sm text-fg-subtle mb-1">Password</label>
          <div class="flex items-stretch gap-2">
            <input
              v-model="password"
              :type="show ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
              @keydown.enter.prevent="handleLogin"
            >
            <button
              type="button"
              class="px-3 rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] text-sm"
              :aria-pressed="show"
              title="Show/Hide password"
              @click="show = !show"
            >
              {{ show ? 'Hide' : 'Show' }}
            </button>
          </div>

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

          <div class="flex items-center justify-between text-xs text-fg-subtle">
            <span>Forgot password? (coming soon)</span>
            <NuxtLink to="/auth/signup" class="underline hover:no-underline">
              Create an account
            </NuxtLink>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-fg-subtle mt-4">
        By continuing you agree to the terms.
      </p>
    </div>
  </main>
</template>
