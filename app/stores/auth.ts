import type { AuthUser } from 'db/types'
import { defineStore } from 'pinia'

/**
 * Auth store (Composition API)
 * - Keeps only minimal auth state
 * - Works with httpOnly cookie on the server
 * - Token is optional (for non-cookie clients); safe to omit in SSR UI
 */
export const useAuth = defineStore('auth', () => {
  const token = ref('') // optional (Bearer for non-cookie clients)
  const user = ref<AuthUser | null>(null)

  async function login(email: string) {
    const res = await $fetch<{ token: string, user: AuthUser, expiresIn: number }>(
      '/api/v1/auth/login',
      { method: 'POST', body: { email } },
    )
    token.value = res.token || ''
    user.value = res.user
  }

  async function me() {
    const u = await $fetch<AuthUser>('/api/v1/auth/me', { method: 'GET' })
    user.value = u
  }

  async function logout() {
    await $fetch('/api/v1/auth/logout', { method: 'POST' })
    token.value = ''
    user.value = null
  }

  return { token, user, login, me, logout }
})
