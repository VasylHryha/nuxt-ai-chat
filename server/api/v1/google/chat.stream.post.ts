import { defineEventHandler, readBody, sendStream, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model = 'gemini-2.0-flash', temperature = 0.7 } = await readBody<{
    messages: Array<{ role: 'user' | 'assistant', content: string }>
    model?: string
    temperature?: number
  }>(event)

  if (!Array.isArray(messages) || messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })

  const { googleApiKey, public: { googleBase = 'https://generativelanguage.googleapis.com/v1beta/openai/' } } = useRuntimeConfig()
  if (!googleApiKey)
    throw createError({ statusCode: 500, statusMessage: 'GOOGLE_API_KEY is not configured' })

  // Google's API expects messages in a slightly different format for streaming
  const res = await fetch(`${googleBase}chat/completions?key=${googleApiKey}`, {
    method: 'POST',
    headers: {
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
    throw createError({ statusCode: res.status || 500, statusMessage: 'Google stream error' })

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
              // Google's API uses choices[0].delta.content like OpenAI
              const token = payload?.choices?.[0]?.delta?.content
              if (typeof token === 'string' && token)
                controller.enqueue(encoder.encode(token))
              else if (payload?.choices?.[0])
                console.warn('[Google Stream] Received delta:', { choices: payload.choices[0] })
            }
            catch (err) {
              console.warn('[Google Stream] Parse error:', err)
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
