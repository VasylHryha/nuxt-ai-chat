// server/api/v1/openrouter/chat.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model, temperature = 0.7 } = await readBody(event)
  const {
    openrouterApiKey,
    public: { openrouterBase = 'https://openrouter.ai/api/v1', defaultModel = 'deepseek/deepseek-r1' },
  } = useRuntimeConfig()

  if (!openrouterApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENROUTER_API_KEY missing' })
  }

  const r = await fetch(`${openrouterBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-app.example',
      'X-Title': 'Nuxt Chat',
    },
    body: JSON.stringify({
      model: model || defaultModel,
      temperature,
      messages,
    }),
  })

  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw createError({ statusCode: r.status, statusMessage: t || 'Provider error' })
  }

  const data = await r.json()
  const choice = data?.choices?.[0]
  const content = choice?.message?.content || ''
  const reasoning = choice?.message?.reasoning || data?.reasoning || undefined

  return {
    content,
    reasoning,
    provider: 'openrouter',
    model: data?.model || (model || defaultModel),
  }
})
