import { defineEventHandler, readBody } from 'h3'
import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const { messages, model = 'gpt-4o-mini', temperature = 0.7 }
    = await readBody<{ messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>, model?: string, temperature?: number }>(event)

  if (!Array.isArray(messages) || messages.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'messages[] required' })

  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey)
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })

  const client = new OpenAI({ apiKey: openaiApiKey })
  const res = await client.chat.completions.create({ model, messages, temperature })
  const content = res.choices?.[0]?.message?.content ?? ''
  return { content, provider: 'openai', model }
})
