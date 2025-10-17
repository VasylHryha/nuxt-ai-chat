// app/plugins/fetch-auth.client.ts
import { useAuth } from '@/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuth()
  nuxtApp.$fetch = $fetch.create({
    onRequest({ options }) {
      if (auth.token) {
        options.headers = { ...(options.headers || {}), Authorization: `Bearer ${auth.token}` }
      }
    },
  })
})
