import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import { signJWT, verifyJWT } from '@/server/utils/jwt'

const SECRET = 'unit-test-secret'

describe('signJWT / verifyJWT', () => {
  it('signs and verifies payload with issuer enforcement', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

    const token = signJWT(
      { sub: 'user_123', email: 'user@example.com' },
      { secret: SECRET, expiresInSec: 300, issuer: 'nuxt-ai-chat' },
    )

    expect(token.split('.')).toHaveLength(3)

    const payload = verifyJWT(token, SECRET, { issuer: 'nuxt-ai-chat' })

    expect(payload).toMatchObject({
      sub: 'user_123',
      email: 'user@example.com',
      iss: 'nuxt-ai-chat',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    })

    vi.useRealTimers()
  })

  it('throws when the payload is altered without resigning', () => {
    const token = signJWT({ sub: 'user_123' }, { secret: SECRET, expiresInSec: 60 })
    const [head, payload, signature] = token.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    decoded.sub = 'user_456'
    const tamperedPayload = Buffer.from(JSON.stringify(decoded))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const tampered = `${head}.${tamperedPayload}.${signature}`

    expect(() => verifyJWT(tampered, SECRET)).toThrowError('Bad signature')
  })

  it('throws when token is expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const token = signJWT({ sub: 'user_123' }, { secret: SECRET, expiresInSec: 1 })

    vi.setSystemTime(new Date('2024-01-01T00:00:02Z'))

    expect(() => verifyJWT(token, SECRET)).toThrowError('Token expired')

    vi.useRealTimers()
  })

  it('throws on issuer mismatch', () => {
    const token = signJWT({ sub: 'user_123' }, { secret: SECRET, expiresInSec: 60, issuer: 'nuxt-ai-chat' })
    expect(() => verifyJWT(token, SECRET, { issuer: 'other-issuer' })).toThrowError('Bad issuer')
  })
})
