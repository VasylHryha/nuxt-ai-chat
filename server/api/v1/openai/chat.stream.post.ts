import { defineEventHandler, readBody, sendStream, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model = 'gpt-4o-mini', temperature = 0.7 }
    = await readBody<{ messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>, model?: string, temperature?: number }>(event)

  if (!Array.isArray(messages) || messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })

  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey)
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      stream: true,
    }),
  })

  if (!res.ok || !res.body)
    throw createError({ statusCode: res.status || 500, statusMessage: 'OpenAI stream error' })

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
              const token = payload?.choices?.[0]?.delta?.content
              if (typeof token === 'string' && token) {
                controller.enqueue(encoder.encode(token))
              }
              else if (payload?.choices?.[0]) {
                // Log unexpected format for debugging (helps identify API changes)
                console.warn('[OpenAI Stream] Unexpected delta format:', { payload: JSON.stringify(payload).slice(0, 200) })
              }
            }
            catch (err) {
              console.warn('[OpenAI Stream] Parse error:', err)
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
