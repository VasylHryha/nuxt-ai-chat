// server/db/messages.ts
import type { Message } from 'db/types'
import db from './main'

export interface InsertMessageInput {
  chatId: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  createdAt?: number
  providerGenerationId?: string | null
}

/**
 * Insert a new message into a chat
 */
export function insertMessage(input: InsertMessageInput): Message {
  const id = rid('msg_')
  const now = input.createdAt || Date.now()

  db.prepare(`
    INSERT INTO messages (id, chat_id, role, content, created_at, provider_generation_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.chatId,
    input.role,
    input.content,
    now,
    input.providerGenerationId || null,
  )

  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message
}

/**
 * Get all messages for a chat, ordered by creation time
 * Verifies the chat belongs to the user for security
 */
export function getMessagesByChatId(chatId: string, userId: string): Message[] {
  // First verify the chat belongs to the user
  const chat = db.prepare(`
    SELECT id FROM chats
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).get(chatId, userId)

  if (!chat)
    throw new Error('Chat not found or access denied')

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE chat_id = ?
    ORDER BY created_at ASC
  `).all(chatId) as Message[]

  return messages
}

/**
 * Get the count of messages in a chat
 */
export function getMessageCountByChatId(chatId: string): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM messages
    WHERE chat_id = ?
  `).get(chatId) as { count: number }

  return result.count
}

/**
 * Get the last message in a chat (for preview)
 */
export function getLastMessageByChatId(chatId: string): Message | null {
  const message = db.prepare(`
    SELECT * FROM messages
    WHERE chat_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(chatId) as Message | undefined

  return message || null
}

/**
 * Delete all messages in a chat (hard delete - use with caution)
 */
export function deleteMessagesByChatId(chatId: string): void {
  db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId)
}
