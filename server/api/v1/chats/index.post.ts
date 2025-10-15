// Minimal fan-out to keep your current adapters working.
// /api/v1/chat → /api/v1/{provider}/chat
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini'
    messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
    model?: string
    temperature?: number
  }>(event)

  const provider = body?.provider
  if (!provider)
    throw createError({ statusCode: 400, statusMessage: 'provider required' })

  // forward to your per-provider route that already exists/you’re adding
  return await $fetch(`/api/v1/${provider}/chat`, { method: 'POST', body })
})
