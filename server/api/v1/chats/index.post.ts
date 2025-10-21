import { requireUser } from '@/server/utils/auth'
// Note: safeValidate, chatProxySchema are auto-imported from server/utils/

// Minimal fan-out to keep your current adapters working.
// /api/v1/chats → /api/v1/{provider}/chat
export default defineEventHandler(async (event) => {
  requireUser(event)

  // Validate input with Zod schema (auto-imported)
  const body = await safeValidate(readBody(event), chatProxySchema)

  // forward to your per-provider route that already exists/you're adding
  return await $fetch(`/api/v1/${body.provider}/chat`, { method: 'POST', body })
})
