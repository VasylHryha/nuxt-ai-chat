import { defineEventHandler, readBody, sendStream, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const { messages, model = 'claude-3-5-sonnet-20241022', temperature = 0.7 } = await readBody<{
    messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
    model?: string
    temperature?: number
  }>(event)

  if (!Array.isArray(messages) || messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })

  const { anthropicApiKey } = useRuntimeConfig()
  if (!anthropicApiKey)
    throw createError({ statusCode: 500, statusMessage: 'ANTHROPIC_API_KEY is not configured' })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      stream: true,
      max_tokens: 2048,
    }),
  })

  if (!res.ok || !res.body)
    throw createError({ statusCode: res.status || 500, statusMessage: 'Anthropic stream error' })

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
            if (line === 'event: message_stop') {
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
              // Anthropic uses content_block_delta.delta.text for streaming content
              const token = payload?.delta?.text
              if (typeof token === 'string' && token)
                controller.enqueue(encoder.encode(token))
              else if (payload?.delta && payload.delta.type === 'text_delta')
                console.warn('[Anthropic Stream] Received delta:', { type: payload.delta.type, text: payload.delta.text?.slice(0, 50) })
            }
            catch (err) {
              console.warn('[Anthropic Stream] Parse error:', err)
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
