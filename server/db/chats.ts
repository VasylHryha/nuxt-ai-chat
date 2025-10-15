import type { Chat } from 'db/types'
import { getOrCreateConnection } from './connections'
import db from './main'
import { getUserByEmail } from './users'

const PROVIDERS = new Set(['openai', 'openrouter', 'anthropic', 'google', 'mistral', 'cohere'])

export interface CreateChatInput {
  email: string
  provider: string
  model: string
  title?: string
  baseURL?: string | null
  settings?: unknown
}

export function createChatForUser(input: CreateChatInput): Chat {
  const user = getUserByEmail(input.email)
  if (!user)
    throw new Error('User not found')

  const provider = String(input.provider || '').trim().toLowerCase()
  const model = String(input.model || '').trim()
  if (!PROVIDERS.has(provider) || !model)
    throw new Error('Invalid provider or model')

  const conn = getOrCreateConnection(user.id, provider, model, input.baseURL ?? null, input.settings)

  const id = rid('chat_')
  const now = Date.now()
  const title = (input.title || 'New chat').trim() || 'New chat'
  db.query(`
    INSERT INTO chats (id,user_id,connection_id,title,created_at,updated_at)
    VALUES (?,?,?,?,?,?)
  `).run(id, user.id, conn.id, title, now, now)

  return db.query(`SELECT * FROM chats WHERE id = ?`).get(id) as Chat
}

export function listChatsByUserEmail(opts: { email: string, provider?: string, model?: string }): Array<Chat & { provider: string, model: string }> {
  const user = getUserByEmail(opts.email)
  if (!user)
    throw new Error('User not found')

  if (opts.provider && opts.model) {
    const rows = db.query(`
      SELECT c.*, k.provider, k.model
      FROM chats c
      JOIN connections k ON k.id = c.connection_id
      WHERE c.user_id = ?
        AND c.deleted_at IS NULL
        AND k.deleted_at IS NULL
        AND k.provider = ?
        AND k.model = ?
      ORDER BY c.updated_at DESC
    `).all(user.id, opts.provider.trim().toLowerCase(), opts.model.trim()) as any[]
    return rows
  }

  if (opts.provider) {
    const rows = db.query(`
      SELECT c.*, k.provider, k.model
      FROM chats c
      JOIN connections k ON k.id = c.connection_id
      WHERE c.user_id = ?
        AND c.deleted_at IS NULL
        AND k.deleted_at IS NULL
        AND k.provider = ?
      ORDER BY c.updated_at DESC
    `).all(user.id, opts.provider.trim().toLowerCase()) as any[]
    return rows
  }

  const rows = db.query(`
    SELECT c.*, k.provider, k.model
    FROM chats c
    JOIN connections k ON k.id = c.connection_id
    WHERE c.user_id = ?
      AND c.deleted_at IS NULL
      AND k.deleted_at IS NULL
    ORDER BY c.updated_at DESC
  `).all(user.id) as any[]

  return rows
}
