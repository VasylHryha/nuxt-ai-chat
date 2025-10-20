import type { AuthUser } from 'db/types'
import { defineStore } from 'pinia'

export const useAuth = defineStore('auth', () => {
  const token = ref('') // optional: useful for non-cookie clients
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const errorMessage = ref('')

  async function login(email: string, password: string) {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<{ token: string, user: AuthUser, expiresIn: number }>(
        '/api/v1/auth/login',
        { method: 'POST', body: { email, password } },
      )
      token.value = res.token || ''
      user.value = res.user
      isInitialized.value = true
    }
    catch (e: any) {
      errorMessage.value = String(e?.statusMessage || e?.message || 'Login failed')
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  async function signup(name: string, email: string, password: string) {
    isLoading.value = true
    errorMessage.value = ''
    try {
      console.log('signup', name, email, password)
      const res = await $fetch<{ token: string, user: AuthUser }>(
        '/api/v1/auth/signup',
        { method: 'POST', body: { name, email, password } },
      )
      token.value = res.token || ''
      user.value = res.user
      isInitialized.value = true
    }
    catch (e: any) {
      console.log(e)
      errorMessage.value = String(e?.statusMessage || e?.message || 'Signup failed')
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  async function me() {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const u = await $fetch<AuthUser>('/api/v1/auth/me', { method: 'GET' })
      user.value = u
      isInitialized.value = true
    }
    catch (e: any) {
      // silent — unauthenticated is normal on first load
    }
    finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    errorMessage.value = ''
    try {
      await $fetch('/api/v1/auth/logout', { method: 'POST' })
      token.value = ''
      user.value = null
    }
    finally {
      isLoading.value = false
    }
  }

  return { token, user, isLoading, isInitialized, errorMessage, login, signup, me, logout }
})
