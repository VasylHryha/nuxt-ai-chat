// server/api/v1/auth/logout.post.ts

export default defineEventHandler((event) => {
  clearAccessCookie(event)
  return { ok: true }
})
