<!-- app/pages/auth/signup.vue -->
<script setup lang="ts">
import { useRoute, useRouter } from '#imports'
import { ref } from 'vue'
import { useAuth } from '@/stores/auth'

definePageMeta({ layout: 'default' })
useHead({ title: 'Create account · Nuxt AI Chat' })

const auth = useAuth()
const router = useRouter()
const route = useRoute()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const show = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const emailRe = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

async function handleSignup() {
  errorMessage.value = ''
  const cleanEmail = email.value.trim().toLowerCase()
  const cleanName = name.value.trim()
  if (!cleanName) {
    errorMessage.value = 'Please enter your name.'
    return
  }
  if (!cleanEmail || !emailRe.test(cleanEmail)) {
    errorMessage.value = 'Please enter a valid email.'
    return
  }
  if (!password.value || password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    await auth.signup(cleanName, cleanEmail, password.value)
    const redirectTo = String(route.query.redirect || '/users')
    await router.push(redirectTo)
  }
  catch (e: any) {
    errorMessage.value = String(e?.statusMessage || e?.message || 'Signup failed')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="min-h-[80svh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="panel shadow-soft rounded-2xl overflow-hidden">
        <div class="px-6 pt-6">
          <h1 class="text-2xl font-semibold text-fg">
            Create account
          </h1>
          <p class="text-fg-muted text-sm mt-1">
            Name, email, and a password.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <label class="block text-sm text-fg-subtle mb-1">Name</label>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            placeholder="Jane Doe"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
          >

          <label class="block text-sm text-fg-subtle mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="you@example.com"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
          >

          <label class="block text-sm text-fg-subtle mb-1">Password</label>
          <div class="flex items-stretch gap-2">
            <input
              v-model="password"
              :type="show ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
            >
            <button
              type="button"
              class="px-3 rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] text-sm"
              :aria-pressed="show"
              @click="show = !show"
            >
              {{ show ? 'Hide' : 'Show' }}
            </button>
          </div>

          <label class="block text-sm text-fg-subtle mb-1">Confirm password</label>
          <input
            v-model="confirm"
            :type="show ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Repeat password"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--glass)] px-3 py-2 outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)]"
            @keydown.enter.prevent="handleSignup"
          >

          <button
            :disabled="isSubmitting"
            class="chip-accent w-full px-4 py-2 rounded-lg font-medium"
            @click="handleSignup"
          >
            {{ isSubmitting ? 'Creating…' : 'Create account' }}
          </button>

          <p v-if="errorMessage" class="text-sm text-red-400">
            {{ errorMessage }}
          </p>

          <div class="text-xs text-fg-subtle">
            Already have an account?
            <NuxtLink to="/auth/login" class="underline hover:no-underline">
              Sign in
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
