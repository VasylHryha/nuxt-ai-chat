type Role = 'user' | 'assistant' | 'system'
interface ClientMsg { role: Role, content: string }

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages: ClientMsg[] }>(event)
  if (!body?.messages?.length) {
    throw createError({ statusCode: 400, statusMessage: 'messages required' })
  }

  const cfg = useRuntimeConfig()
  const apiKey = cfg.openrouterApiKey
  const model = cfg.public.openrouterModel
  const base = cfg.public.openrouterBase
  const title = cfg.public.appTitle

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Missing OPENROUTER_API_KEY' })
  }

  // Call OpenRouter (server-side)
  const url = `${base}/chat/completions`
  const res = await $fetch<any>(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Informational headers (not required server-side, but fine to send):
      'HTTP-Referer': getRequestHeader(event, 'origin') || 'http://localhost',
      'X-Title': title,
    },
    body: {
      model,
      messages: body.messages, // [{role, content}]
      stream: false,
    },
  }).catch((e: any) => {
    console.error(e)
    throw createError({ statusCode: 502, statusMessage: `OpenRouter: ${e?.data || e?.message || e}` })
  })

  const msg = res?.choices?.[0]?.message || {}
  const content = msg?.content ?? ''
  const reasoning = msg?.reasoning ?? msg?.metadata?.reasoning ?? undefined

  return { role: 'assistant', content, reasoning }
})
