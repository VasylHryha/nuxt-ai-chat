import { convertToCoreMessages, streamText } from 'ai'
// server/api/v1/ai/chats/[id]/messages.post.ts
import db from '@/server/db/main'
import { getProvider } from '@/server/utils/ai'
import { requireUser } from '@/server/utils/auth'
import { rid } from '@/server/utils/id'

export default defineEventHandler(async (event) => {
  const chatId = getRouterParam(event, 'id')!
  const { id: userId } = requireUser(event)
  const { content, provider = 'openai', model = 'gpt-4o-mini', baseURL }
    = await readBody<{ content: string, provider?: any, model?: string, baseURL?: string }>(event)

  // 1) guard chat belongs to user
  const chat = db.prepare(`SELECT id FROM chats WHERE id=? AND user_id=?`).get(chatId, userId)
  if (!chat)
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })

  // 2) persist user message
  const now = Date.now()
  db.prepare(`INSERT INTO messages (id, chat_id, role, content, created_at)
              VALUES (?, ?, 'user', ?, ?)`).run(rid('msg'), chatId, content, now)
  db.prepare(`UPDATE chats SET updated_at=? WHERE id=?`).run(now, chatId)

  // 3) load history for context
  const rows = db.prepare(`SELECT role, content FROM messages WHERE chat_id=? ORDER BY created_at ASC`).all(chatId)

  // 4) pick provider uniformly
  const cfg = useRuntimeConfig()
  const apiKey
    = provider === 'openai'
      ? cfg.openaiApiKey
      : provider === 'anthropic'
        ? cfg.anthropicApiKey
        : provider === 'google'
          ? cfg.googleApiKey
          : undefined

  const prov = getProvider({ provider, apiKey, baseURL })

  // 5) stream with a single API shape
  const result = await streamText({
    model: prov(model),
    messages: convertToCoreMessages(rows as any),
  })

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  let buffer = ''
  let generationId: string | undefined

  try {
    for await (const part of result.stream) {
      if (part.type === 'response-metadata')
        generationId = (part as any).id || generationId
      if (part.type === 'text-delta') {
        buffer += part.textDelta
        await event.node.res.write(`data: ${JSON.stringify({ text: part.textDelta })}\n\n`)
      }
    }

    db.prepare(`INSERT INTO messages (id, chat_id, role, content, created_at, provider_generation_id)
                VALUES (?, ?, 'assistant', ?, ?, ?)`)
      .run(rid('msg'), chatId, buffer, Date.now(), generationId || null)

    event.node.res.write(`event: done\ndata:\n\n`)
    event.node.res.end()
  }
  catch (error) {
    console.error('[stream-text] failure', error)
    throw createError({ statusCode: 502, statusMessage: 'Provider stream failed' })
  }
})
