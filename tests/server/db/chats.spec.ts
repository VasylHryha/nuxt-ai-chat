import { beforeEach, describe, expect, it } from 'vitest'
import { createChatForUser, listChatsByUserEmail } from '@/server/db/chats'
import db from '@/server/db/main'
import { insertUser } from '@/server/db/users'

const resetDb = (globalThis as any).__NUXT_RESET_DB__ as (() => void) | undefined

describe('server/db/chats', () => {
  beforeEach(() => {
    resetDb?.()
  })

  it('creates chat with reusable connection', () => {
    const user = insertUser({ email: 'chat-user@example.com', name: 'Chatter' })

    const chat1 = createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
      title: 'First session',
    })
    const chat2 = createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
      title: 'Second session',
    })

    expect(chat1.user_id).toBe(user.id)
    expect(chat2.user_id).toBe(user.id)
    expect(chat1.connection_id).toBe(chat2.connection_id)

    const connectionCount = db.prepare('SELECT COUNT(*) as count FROM connections').get() as { count: number }
    expect(connectionCount.count).toBe(1)
  })

  it('lists chats by user with provider/model filters', () => {
    const user = insertUser({ email: 'filters@example.com', name: 'Filter' })

    createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
      title: 'OpenAI chat',
    })
    createChatForUser({
      email: user.email,
      provider: 'anthropic',
      model: 'claude-3',
      title: 'Claude chat',
    })

    const all = listChatsByUserEmail({ email: user.email })
    expect(all).toHaveLength(2)

    const byProvider = listChatsByUserEmail({ email: user.email, provider: 'anthropic' })
    expect(byProvider).toHaveLength(1)
    expect(byProvider[0].provider).toBe('anthropic')

    const byProviderModel = listChatsByUserEmail({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
    })
    expect(byProviderModel).toHaveLength(1)
    expect(byProviderModel[0].model).toBe('gpt-4o-mini')
  })

  it('throws when creating chat for unknown user or invalid provider', () => {
    expect(() =>
      createChatForUser({
        email: 'missing@example.com',
        provider: 'openai',
        model: 'gpt-4o-mini',
      }),
    ).toThrowError('User not found')

    const user = insertUser({ email: 'invalid-provider@example.com', name: 'Bad Provider' })
    expect(() =>
      createChatForUser({
        email: user.email,
        provider: 'invalid-provider',
        model: 'whatever',
      }),
    ).toThrowError('Invalid provider or model')
  })

  it('cascades delete of connections/chats when user removed', () => {
    const user = insertUser({ email: 'cascade-chat@example.com', name: 'Cascade' })
    const chat = createChatForUser({
      email: user.email,
      provider: 'openai',
      model: 'gpt-4o-mini',
    })

    db.prepare('DELETE FROM users WHERE id=?').run(user.id)

    const chatRow = db.prepare('SELECT * FROM chats WHERE id=?').get(chat.id)
    const connectionRow = db.prepare('SELECT * FROM connections WHERE id=?').get(chat.connection_id)

    expect(chatRow).toBeUndefined()
    expect(connectionRow).toBeUndefined()
  })
})
