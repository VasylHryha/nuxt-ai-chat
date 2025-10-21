import { defineEventHandler, readBody, sendStream, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model, temperature = 0.7 } = await readBody<{
    messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
    model?: string
    temperature?: number
  }>(event)

  const {
    openrouterApiKey,
    public: { openrouterBase = 'https://openrouter.ai/api/v1' },
  } = useRuntimeConfig()

  if (!openrouterApiKey)
    throw createError({ statusCode: 500, statusMessage: 'OPENROUTER_API_KEY is not configured' })
  if (!Array.isArray(messages) || messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })

  const usedModel = model || 'deepseek/deepseek-r1'

  const res = await fetch(`${openrouterBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: usedModel, temperature, messages, stream: true }),
  })

  if (!res.ok || !res.body)
    throw createError({ statusCode: res.status || 500, statusMessage: 'OpenRouter stream error' })

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache')

  const upstream = res.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await upstream.read()
          if (done)
            break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const raw of lines) {
            const line = raw.trim()
            if (!line)
              continue
            if (line === 'data: [DONE]') {
              controller.close()
              return
            }
            if (!line.startsWith('data:'))
              continue
            const payloadText = line.slice(5).trim()
            if (!payloadText)
              continue
            try {
              const payload = JSON.parse(payloadText)
              // OpenRouter R1 uses delta.content similar to OpenAI
              const token = payload?.choices?.[0]?.delta?.content
              if (typeof token === 'string' && token) {
                controller.enqueue(encoder.encode(token))
              }
              else if (payload?.choices?.[0]) {
                // Log unexpected format for debugging
                console.debug('[OpenRouter Stream] Unexpected delta format:', { payload: JSON.stringify(payload).slice(0, 200) })
              }
            }
            catch (err) {
              console.warn('[OpenRouter Stream] Parse error:', err)
              // ignore parse errors
            }
          }
        }
      }
      finally {
        controller.close()
      }
    },
  })

  return sendStream(event, stream as any)
})
