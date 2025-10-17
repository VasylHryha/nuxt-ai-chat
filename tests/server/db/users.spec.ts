import { beforeEach, describe, expect, it } from 'vitest'
import db from '@/server/db/main'
import {
  getPasswordHashByEmail,
  getUserByEmail,
  getUserById,
  insertUser,
  listUsers,
  upsertPasswordCredential,
} from '@/server/db/users'

const resetDb = (globalThis as any).__NUXT_RESET_DB__ as (() => void) | undefined

describe('server/db/users', () => {
  beforeEach(() => {
    resetDb?.()
  })

  it('inserts and retrieves users by email and id', () => {
    const created = insertUser({ email: 'test@example.com', name: 'Test User' })

    const byEmail = getUserByEmail('test@example.com')
    const byId = getUserById(created.id)
    const users = listUsers()

    expect(byEmail).toEqual({
      id: created.id,
      email: 'test@example.com',
      name: 'Test User',
      created_at: expect.any(Number),
    })
    expect(byId).toEqual(byEmail)
    expect(users.find(u => u.id === created.id)).toEqual(byEmail)
  })

  it('enforces unique emails (case insensitive)', () => {
    insertUser({ email: 'duplicate@example.com', name: 'One' })

    expect(() => insertUser({ email: 'Duplicate@example.com', name: 'Two' })).toThrowError()
  })

  it('upserts password credentials and reuses credential id', async () => {
    const user = insertUser({ email: 'cred@example.com', name: 'Cred User' })

    const firstId = upsertPasswordCredential(user.id, 'hash-v1')
    const row1 = db.prepare('SELECT password_hash FROM credentials WHERE id=?').get(firstId) as { password_hash: string }
    expect(row1.password_hash).toBe('hash-v1')

    const secondId = upsertPasswordCredential(user.id, 'hash-v2')
    const row2 = db.prepare('SELECT password_hash FROM credentials WHERE id=?').get(secondId) as { password_hash: string }
    expect(secondId).toBe(firstId)
    expect(row2.password_hash).toBe('hash-v2')

    const lookup = getPasswordHashByEmail('cred@example.com')
    expect(lookup).toEqual({
      user: {
        id: user.id,
        email: 'cred@example.com',
        name: 'Cred User',
        created_at: expect.any(Number),
      },
      hash: 'hash-v2',
    })
  })

  it('cascades credential deletion when user is removed', () => {
    const user = insertUser({ email: 'cascade@example.com', name: 'Cascade' })
    const credId = upsertPasswordCredential(user.id, 'hash')

    db.prepare('DELETE FROM users WHERE id=?').run(user.id)

    const credential = db.prepare('SELECT * FROM credentials WHERE id=?').get(credId)

    expect(credential).toBeUndefined()
    expect(getUserByEmail('cascade@example.com')).toBeNull()
  })
})
