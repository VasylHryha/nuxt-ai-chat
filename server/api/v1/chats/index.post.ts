import { requireUser } from '@/server/utils/auth'

// Minimal fan-out to keep your current adapters working.
// /api/v1/chat → /api/v1/{provider}/chat
export default defineEventHandler(async (event) => {
  requireUser(event)
  const body = await readBody<{
    provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini'
    messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
    model?: string
    temperature?: number
  }>(event)

  const provider = body?.provider
  if (!provider)
    throw createError({ statusCode: 400, statusMessage: 'provider required' })

  const allowedProviders = new Set(['openrouter', 'openai', 'anthropic', 'gemini'])
  if (!allowedProviders.has(provider))
    throw createError({ statusCode: 400, statusMessage: 'Invalid provider' })

  if (!Array.isArray(body.messages) || body.messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages required' })
  for (const message of body.messages) {
    if (!message || typeof message.content !== 'string' || !message.content.trim())
      throw createError({ statusCode: 400, statusMessage: 'Invalid message content' })
    if (!['system', 'user', 'assistant'].includes(message.role))
      throw createError({ statusCode: 400, statusMessage: 'Invalid message role' })
  }

  // forward to your per-provider route that already exists/you’re adding
  return await $fetch(`/api/v1/${provider}/chat`, { method: 'POST', body })
})
