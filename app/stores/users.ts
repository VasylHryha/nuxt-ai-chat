import type { PublicUser } from 'db/types'
import type { UsersRepository } from '@/services/usersRepository'
import { defineStore } from 'pinia'
import { createUsersRepository } from '@/services/usersRepository'

/**
 * Users store (Composition API)
 * - SRP: in-memory cache + light validation + SWR fetching
 * - IO is delegated to UsersRepository (DIP)
 */
export const useUsersStore = defineStore('users', () => {
  // DI: swap repo in tests if needed
  const repo: UsersRepository = createUsersRepository()

  // state
  const byId = ref<Record<string, PublicUser>>({})
  const allIds = ref<string[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const lastFetchedAt = ref(0)
  const ttlMs = ref(60_000) // 1 minute cache TTL

  // getters
  const list = computed(() => allIds.value.map(id => byId.value[id]))
  const isStale = computed<boolean>(() => Date.now() - lastFetchedAt.value > ttlMs.value)
  const getByEmail = (email: string) =>
    Object.values(byId.value).find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null

  // helpers
  const emailRe = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  function indexUsers(rows: PublicUser[]) {
    byId.value = {}
    allIds.value = []
    for (const u of rows) {
      byId.value[u.id] = u
      allIds.value.push(u.id)
    }
    lastFetchedAt.value = Date.now()
  }

  // actions
  async function ensure(force = false) {
    if (!force && list.value.length && !isStale.value)
      return
    await fetchAll()
  }

  async function fetchAll() {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const rows = await repo.list()
      indexUsers(rows ?? [])
    }
    catch (e: any) {
      errorMessage.value = String(e?.statusMessage || e?.message || 'Failed to load users')
    }
    finally {
      isLoading.value = false
    }
  }

  async function addUser(email: string, name?: string) {
    const clean = String(email || '').trim().toLowerCase()
    if (!clean || !emailRe.test(clean)) {
      errorMessage.value = 'Please enter a valid email.'
      throw new Error(errorMessage.value)
    }
    if (getByEmail(clean)) {
      errorMessage.value = 'This email already exists.'
      throw new Error(errorMessage.value)
    }

    isSubmitting.value = true
    errorMessage.value = ''
    try {
      const created = await repo.create({ email: clean, ...(name ? { name } : {}) })
      if (!byId.value[created.id])
        allIds.value.unshift(created.id)
      byId.value[created.id] = created
      lastFetchedAt.value = Date.now()
      return created
    }
    catch (e: any) {
      const msg = String(e?.statusMessage || e?.message || 'Failed to add PublicUser')
      errorMessage.value = /unique|exists/i.test(msg) ? 'This email already exists.' : msg
      throw new Error(errorMessage.value)
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    // state
    byId,
    allIds,
    isLoading,
    isSubmitting,
    errorMessage,
    lastFetchedAt,
    ttlMs,
    // getters
    list,
    isStale,
    getByEmail,
    // actions
    ensure,
    fetchAll,
    addUser,
  }
})
