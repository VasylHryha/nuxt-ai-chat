// app/plugins/auth-hydration.client.ts
/**
 * Client-side auth hydration plugin
 * - Runs once on app start (client-side only)
 * - Attempts to restore auth state from httpOnly cookie via /api/v1/auth/me
 * - Silently fails if not authenticated (user stays null)
 */

export default defineNuxtPlugin(async () => {
  const auth = useAuth()

  // Skip if already hydrated
  if (auth.user) {
    return
  }

  try {
    // Try to restore session from httpOnly cookie
    await auth.me()
  }
  catch {
    // Silently fail - user will be redirected by middleware if accessing protected route
    // No need to show error on public pages
  }
})
