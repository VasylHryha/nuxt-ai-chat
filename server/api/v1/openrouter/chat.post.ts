import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model, temperature = 0.7 } = await readBody(event)
  const {
    openrouterApiKey,
    public: { openrouterBase = 'https://openrouter.ai/api/v1' },
  } = useRuntimeConfig()

  if (!openrouterApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENROUTER_API_KEY is not configured' })
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })
  }

  const usedModel = model || 'deepseek/deepseek-r1'

  const res = await fetch(`${openrouterBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: usedModel,
      temperature,
      messages,
      // Optional: surface "reasoning" if model supports it
      reasoning: { effort: 'medium' },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw createError({ statusCode: res.status, statusMessage: text || 'OpenRouter error' })
  }

  const data = await res.json()
  const msg = data?.choices?.[0]?.message
  const content = msg?.content ?? ''
  // Some R1 variants also return reasoning tokens under message.reasoning or top-level
  const reasoning = msg?.reasoning ?? data?.choices?.[0]?.reasoning ?? undefined

  return { content, reasoning, provider: 'openrouter', model: usedModel }
})
