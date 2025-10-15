const API_TO_SKIP_AUTH = ['/api/public', '/api/auth', '/favicon.ico', '/api/users']

export default defineEventHandler((event) => {
  // Priority: header email (for cURL/dev) → cookie userId (for UI)
  if (API_TO_SKIP_AUTH.includes(event.node.req.url || '')) {
    return
  }

  const email = getHeader(event, 'x-user-email') || (getQuery(event).email as string | undefined)

  const clean = (email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(clean)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }
})
