// server/db/chats.ts
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
  ui?: 'ai-sdk' | 'native' | 'proxy'
}

export function createChatForUser(input: CreateChatInput): Chat {
  const user = getUserByEmail(input.email)
  if (!user)
    throw new Error('User not found')

  const provider = String(input.provider || '').trim().toLowerCase()
  const model = String(input.model || '').trim()
  if (!PROVIDERS.has(provider) || !model)
    throw new Error('Invalid provider or model')

  // Resolve UI kind from provider (server-controlled; safer than trusting client)
  const providedUi = input.ui
  const derivedUi: 'ai-sdk' | 'native' | 'proxy'
    = (provider === 'openrouter' || provider === 'anthropic' || provider === 'google')
      ? 'proxy'
      : 'ai-sdk'
  const ui: 'ai-sdk' | 'native' | 'proxy' = (providedUi === 'ai-sdk' || providedUi === 'native' || providedUi === 'proxy') ? providedUi : derivedUi

  const conn = getOrCreateConnection(user.id, provider, model, input.baseURL ?? null, input.settings, ui)

  const id = rid('chat_')
  const now = Date.now()
  const title = (input.title || 'New chat').trim() || 'New chat'

  db.prepare(`
        INSERT INTO chats (id,user_id,connection_id,title,created_at,updated_at)
        VALUES (?,?,?,?,?,?)
    `).run(id, user.id, conn.id, title, now, now)

  return db.prepare(`SELECT * FROM chats WHERE id = ?`).get(id) as Chat
}

export function listChatsByUserEmail(opts: { email: string, provider?: string, model?: string }): Array<Chat & { provider: string, model: string, ui?: 'ai-sdk' | 'native' | 'proxy' }> {
  const user = getUserByEmail(opts.email)
  if (!user)
    throw new Error('User not found')

  if (opts.provider && opts.model) {
    const rows = db.prepare(`
            SELECT c.*, k.provider, k.model, k.ui
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
    const rows = db.prepare(`
            SELECT c.*, k.provider, k.model, k.ui
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

  const rows = db.prepare(`
        SELECT c.*, k.provider, k.model, k.ui
        FROM chats c
                 JOIN connections k ON k.id = c.connection_id
        WHERE c.user_id = ?
          AND c.deleted_at IS NULL
          AND k.deleted_at IS NULL
        ORDER BY c.updated_at DESC
    `).all(user.id) as any[]

  return rows
}

/**
 * Get a single chat by ID
 * Verifies the chat belongs to the user for security
 */
export function getChatById(chatId: string, userId: string): Chat | null {
  const chat = db.prepare(`
    SELECT c.*, k.provider, k.model, k.ui
    FROM chats c
    JOIN connections k ON k.id = c.connection_id
    WHERE c.id = ? AND c.user_id = ? AND c.deleted_at IS NULL
  `).get(chatId, userId) as (Chat & { provider: string, model: string }) | undefined

  return chat || null
}

/**
 * Update the updated_at timestamp of a chat
 * Called when a new message is added
 */
export function updateChatTimestamp(chatId: string, userId: string): void {
  const now = Date.now()
  db.prepare(`
    UPDATE chats
    SET updated_at = ?
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).run(now, chatId, userId)
}

/**
 * Soft delete a chat by setting deleted_at timestamp
 * Messages are preserved via CASCADE in schema
 */
export function softDeleteChat(chatId: string, userId: string): void {
  const now = Date.now()
  const result = db.prepare(`
    UPDATE chats
    SET deleted_at = ?
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).run(now, chatId, userId)

  if (result.changes === 0)
    throw new Error('Chat not found or already deleted')
}

/**
 * Update chat title
 */
export function updateChatTitle(chatId: string, userId: string, title: string): void {
  const trimmedTitle = title.trim()
  if (!trimmedTitle)
    throw new Error('Title cannot be empty')

  const result = db.prepare(`
    UPDATE chats
    SET title = ?, updated_at = ?
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).run(trimmedTitle, Date.now(), chatId, userId)

  if (result.changes === 0)
    throw new Error('Chat not found')
}
