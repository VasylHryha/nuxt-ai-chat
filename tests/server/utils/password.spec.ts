import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/server/utils/password'

describe('password utils', () => {
  it('hashes with deterministic mock during tests', async () => {
    await expect(hashPassword('s3cret')).resolves.toBe('argon2:s3cret')
  })

  it('verifies encoded hashes correctly', async () => {
    const hashed = await hashPassword('p@ssw0rd')

    await expect(verifyPassword(hashed, 'p@ssw0rd')).resolves.toBe(true)
    await expect(verifyPassword(hashed, 'wrong')).resolves.toBe(false)
  })
})
