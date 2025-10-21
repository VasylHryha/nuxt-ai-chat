// Auto-hydrate auth state from cookie on app load
export default defineNuxtPlugin(async () => {
  const auth = useAuth()

  // Fetch current user from cookie (if exists)
  await auth.me()
})
