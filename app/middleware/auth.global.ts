// app/middleware/auth.ts
/**
 * Client-side route guard
 * - Protects all routes except public whitelist
 * - Redirects unauthenticated users to /chats/login
 * - Preserves intended destination in redirect query param
 */

export default defineNuxtRouteMiddleware((to) => {
  // Public routes that don't require authentication
  const PUBLIC_ROUTES = [
    '/', // Home page
    '/auth/login', // Login page itself
    '/auth/signup',
  ]

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(to.path)

  // Skip auth check for public routes
  if (isPublicRoute) {
    return
  }

  // Client-side only: check auth state
  if (import.meta.client) {
    const auth = useAuth()

    // If no user is authenticated, redirect to login
    if (!auth.user) {
      // Preserve the intended destination
      return navigateTo({
        path: '/auth/login',
        query: { redirect: to.fullPath },
      })
    }
  }
})
