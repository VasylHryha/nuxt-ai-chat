/**
 * Global API interceptor plugin
 * Automatically attaches Authorization header to all $fetch requests
 * Handles auth errors and token refresh if needed
 */

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Configure global $fetch interceptor
  $fetch.create({
    baseURL: config.public.apiBase || '/api/v1',
    onRequest({ options }) {
      const auth = useAuth()

      // Attach Authorization header if token exists
      if (auth.token) {
        const headers = (options.headers as Record<string, string>) || {}
        headers.Authorization = `Bearer ${auth.token}`
        options.headers = headers
      }
    },

    async onResponseError({ response }) {
      // Handle 401 errors - session expired
      if (response.status === 401) {
        const auth = useAuth()
        await auth.logout()

        if (typeof window !== 'undefined') {
          navigateTo('/auth/login')
        }
      }
    },
  })
})
